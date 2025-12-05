# backend/app/chat.py
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from .deps import get_mongo_client, get_current_user
from . import config

# OpenRouter/OpenAI bridge (optional)
from openai import OpenAI as OpenAIClient

router = APIRouter()
openrouter = None
if getattr(config, "OPENROUTER_API_KEY", None):
    openrouter = OpenAIClient(base_url="https://openrouter.ai/api/v1", api_key=config.OPENROUTER_API_KEY)

# Helper to safely extract text content from LLM response
def _llm_text_from_response(resp):
    try:
        # OpenRouter style: resp.choices[0].message.content
        return resp.choices[0].message.content
    except Exception:
        try:
            # fallback older shape
            return resp.choices[0].text
        except Exception:
            return str(resp)


# -----------------------------
#  Start a new chat (and optionally get an immediate assistant reply)
# -----------------------------
@router.post("/chat/start")
async def chat_start(payload: dict, current_user=Depends(get_current_user)):
    """
    payload: { "message": "user first message" }
    Creates a chat document and (optionally) asks LLM for an answer immediately.
    Returns: { chat_id, title, messages: [...] }
    """
    user_email = current_user["email"]
    user_msg = (payload.get("message") or "").strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Missing initial message")

    client = get_mongo_client()
    db = client[config.MONGO_DB_NAME]

    # Generate a simple title from the first message (first 60 chars)
    title = user_msg[:60].rstrip()
    if len(user_msg) > 60:
        title += "…"

    chat_doc = {
        "user": user_email,
        "title": title or "Untitled chat",
        "messages": [
            {"role": "user", "text": user_msg, "ts": datetime.utcnow()}
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    res = await db.chats.insert_one(chat_doc)
    chat_id = str(res.inserted_id)

    assistant_text = None
    # Optionally ask the LLM immediately
    if openrouter:
        prompt = f"User: {user_msg}\n\nAnswer concisely."
        try:
            resp = openrouter.chat.completions.create(
                model="mistralai/mixtral-8x7b-instruct",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=400
            )
            assistant_text = _llm_text_from_response(resp)
        except Exception as e:
            assistant_text = f"(LLM error: {e})"

    # If assistant replied, append it
    if assistant_text:
        await db.chats.update_one(
            {"_id": ObjectId(chat_id)},
            {"$push": {"messages": {"role": "assistant", "text": assistant_text, "ts": datetime.utcnow()}},
             "$set": {"updated_at": datetime.utcnow()}}
        )

    # Return the newly created chat and messages
    chat = await db.chats.find_one({"_id": ObjectId(chat_id)})
    chat["_id"] = str(chat["_id"])
    # convert datetime -> isoformat strings
    for m in chat.get("messages", []):
        if isinstance(m.get("ts"), (datetime, )):
            m["ts"] = m["ts"].isoformat()
    if isinstance(chat.get("created_at"), datetime):
        chat["created_at"] = chat["created_at"].isoformat()
    if isinstance(chat.get("updated_at"), datetime):
        chat["updated_at"] = chat["updated_at"].isoformat()

    return {"chat": chat}


# -----------------------------
#  Post a message to a chat
# -----------------------------
@router.post("/chat/{chat_id}/message")
async def chat_message(chat_id: str, payload: dict, current_user=Depends(get_current_user)):
    """
    payload: { "message": "text" }
    Appends a user message, calls LLM and appends assistant reply.
    Returns: { assistant: "...", messages: [...] }
    """
    user_email = current_user["email"]
    user_msg = (payload.get("message") or "").strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Missing message")

    client = get_mongo_client()
    db = client[config.MONGO_DB_NAME]

    try:
        oid = ObjectId(chat_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid chat id")

    chat = await db.chats.find_one({"_id": oid, "user": user_email})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Append user message
    user_msg_obj = {"role": "user", "text": user_msg, "ts": datetime.utcnow()}
    await db.chats.update_one({"_id": oid}, {"$push": {"messages": user_msg_obj}, "$set": {"updated_at": datetime.utcnow()}})

    # Build a context by optionally including last few messages (you can tailor this)
    history_msgs = chat.get("messages", [])[-8:]  # last few
    context_strings = []
    for m in history_msgs:
        context_strings.append(f"{m.get('role').upper()}: {m.get('text')}")
    context_strings.append(f"USER: {user_msg}")
    prompt = "\n\n".join(context_strings)

    assistant_text = None
    if openrouter:
        try:
            resp = openrouter.chat.completions.create(
                model="mistralai/mixtral-8x7b-instruct",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=400
            )
            assistant_text = _llm_text_from_response(resp)
        except Exception as e:
            assistant_text = f"(LLM error: {e})"
    else:
        assistant_text = "(LLM not configured on server)"

    assistant_obj = {"role": "assistant", "text": assistant_text, "ts": datetime.utcnow()}
    await db.chats.update_one({"_id": oid}, {"$push": {"messages": assistant_obj}, "$set": {"updated_at": datetime.utcnow()}})

    # Optionally update chat title if it was untitled or based on first message
    # (we keep the title as-is for now)

    # Return assistant message and the latest messages
    chat = await db.chats.find_one({"_id": oid})
    chat["_id"] = str(chat["_id"])
    for m in chat.get("messages", []):
        if isinstance(m.get("ts"), (datetime, )):
            m["ts"] = m["ts"].isoformat()
    return {"assistant": assistant_text, "chat": chat}


# -----------------------------
#  List chats
# -----------------------------
@router.get("/chat/list")
async def chat_list(current_user=Depends(get_current_user)):
    user_email = current_user["email"]
    client = get_mongo_client()
    db = client[config.MONGO_DB_NAME]

    rows = await db.chats.find({"user": user_email}, {"title": 1, "created_at": 1, "updated_at": 1}).sort("updated_at", -1).to_list(200)
    output = []
    for r in rows:
        output.append({
            "chat_id": str(r["_id"]),
            "title": r.get("title"),
            "created_at": (r.get("created_at").isoformat() if isinstance(r.get("created_at"), datetime) else r.get("created_at")),
            "updated_at": (r.get("updated_at").isoformat() if isinstance(r.get("updated_at"), datetime) else r.get("updated_at"))
        })
    return {"chats": output}


# -----------------------------
#  Get a single chat full history
# -----------------------------
@router.get("/chat/{chat_id}")
async def chat_get(chat_id: str, current_user=Depends(get_current_user)):
    user_email = current_user["email"]
    client = get_mongo_client()
    db = client[config.MONGO_DB_NAME]

    try:
        oid = ObjectId(chat_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid chat id")

    chat = await db.chats.find_one({"_id": oid, "user": user_email})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    chat["_id"] = str(chat["_id"])
    for m in chat.get("messages", []):
        if isinstance(m.get("ts"), (datetime, )):
            m["ts"] = m["ts"].isoformat()
    return {"chat": chat}
