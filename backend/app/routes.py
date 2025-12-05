# app/routes.py
import os
import uuid
from datetime import datetime
from typing import Optional, Any

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header, Request
from fastapi.responses import FileResponse
from bson import ObjectId
from jose import JWTError, jwt
from difflib import SequenceMatcher
from pydantic import BaseModel
from openai import OpenAI as OpenAIClient

from .deps import get_mongo_client, get_current_user
from .extract import extract_text
from .faiss_manager import FaissManager
from . import config

# ---------------------------------------------------------------
# Router + Config
# ---------------------------------------------------------------
router = APIRouter()

openrouter = None
if getattr(config, "OPENROUTER_API_KEY", None):
    openrouter = OpenAIClient(
        base_url="https://openrouter.ai/api/v1",
        api_key=config.OPENROUTER_API_KEY
    )

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------------
# TRACK CHANGES (COMPARE)
# ---------------------------------------------------------------

def compute_diff_chunks(text_a: str, text_b: str):
    words_a = text_a.split()
    words_b = text_b.split()

    sm = SequenceMatcher(None, words_a, words_b)
    similarity = sm.ratio() * 100.0

    chunks = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        chunks.append({
            "op": tag,
            "a": " ".join(words_a[i1:i2]) or None,
            "b": " ".join(words_b[j1:j2]) or None,
        })

    return similarity, chunks


class CompareRequest(BaseModel):
    doc_id_a: str
    doc_id_b: str


class DiffChunk(BaseModel):
    op: str
    a: str | None = None
    b: str | None = None


class CompareResponse(BaseModel):
    similarity: float
    chunks: list[DiffChunk]


@router.post("/documents/compare", response_model=CompareResponse)
async def compare_documents(payload: CompareRequest, current_user=Depends(get_current_user)):

    user_email = current_user["email"]
    client = get_mongo_client()
    db = client[config.MONGO_DB_NAME]

    try:
        oid_a = ObjectId(payload.doc_id_a)
        oid_b = ObjectId(payload.doc_id_b)
    except:
        raise HTTPException(status_code=400, detail="Invalid document id")

    doc_a = await db.documents.find_one({"_id": oid_a, "user": user_email})
    doc_b = await db.documents.find_one({"_id": oid_b, "user": user_email})

    if not doc_a or not doc_b:
        raise HTTPException(status_code=404, detail="Document not found")

    path_a = os.path.join(UPLOAD_DIR, doc_a["stored_path"])
    path_b = os.path.join(UPLOAD_DIR, doc_b["stored_path"])

    if not os.path.exists(path_a) or not os.path.exists(path_b):
        raise HTTPException(status_code=404, detail="Files missing on server")

    text_a = extract_text(path_a, os.path.splitext(path_a)[1].lower()).get("text", "")
    text_b = extract_text(path_b, os.path.splitext(path_b)[1].lower()).get("text", "")

    similarity, chunks = compute_diff_chunks(text_a, text_b)

    return CompareResponse(
        similarity=round(similarity, 2),
        chunks=[DiffChunk(**c) for c in chunks]
    )

# ---------------------------------------------------------------
# JWT HELPER
# ---------------------------------------------------------------

def _email_from_token(token: Optional[str]) -> Optional[str]:
    if not token:
        return None
    try:
        if token.startswith("Bearer "):
            token = token.split(" ", 1)[1]
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        return payload.get("sub")
    except:
        return None

# ---------------------------------------------------------------
# GET DOCUMENTS
# ---------------------------------------------------------------

@router.get("/documents")
async def get_documents(current_user=Depends(get_current_user)):
    user_email = current_user["email"]

    client = get_mongo_client()
    db = client[config.MONGO_DB_NAME]

    docs = await db.documents.find(
        {"user": user_email},
        {"filename": 1, "stored_path": 1}
    ).to_list(200)

    return {
        "documents": [
            {"_id": str(d["_id"]), "filename": d["filename"], "stored_path": d["stored_path"]}
            for d in docs
        ]
    }

# ---------------------------------------------------------------
# VIEW DOCUMENT
# ---------------------------------------------------------------

@router.get("/documents/view/{doc_id}")
async def view_document(doc_id: str, request: Request, authorization: Optional[str] = Header(None)):

    token = authorization or request.query_params.get("token")
    email = _email_from_token(token)

    if not email:
        raise HTTPException(status_code=401, detail="Unauthorized")

    client = get_mongo_client()
    db = client[config.MONGO_DB_NAME]

    try:
        oid = ObjectId(doc_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid document id")

    doc = await db.documents.find_one({"_id": oid, "user": email})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = os.path.join(UPLOAD_DIR, doc["stored_path"])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File missing")

    return FileResponse(file_path, filename=doc["filename"])

# ---------------------------------------------------------------
# DELETE DOCUMENT
# ---------------------------------------------------------------

@router.delete("/documents/delete/{doc_id}")
async def delete_document(doc_id: str, current_user=Depends(get_current_user)):

    user_email = current_user["email"]

    client = get_mongo_client()
    db = client[config.MONGO_DB_NAME]

    try:
        oid = ObjectId(doc_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    doc = await db.documents.find_one({"_id": oid, "user": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    await db.documents.delete_one({"_id": oid})

    file_path = os.path.join(UPLOAD_DIR, doc["stored_path"])
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except:
            pass

    return {"message": "Deleted"}

# ---------------------------------------------------------------
# UPLOAD DOCUMENT
# ---------------------------------------------------------------

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user=Depends(get_current_user)):

    user_email = current_user["email"]

    ext = os.path.splitext(file.filename)[1].lower()
    stored_filename = f"{uuid.uuid4()}{ext}"

    file_path = os.path.join(UPLOAD_DIR, stored_filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    extracted = extract_text(file_path, ext)
    fingerprint = extracted["fingerprint"]
    text = extracted["text"].strip()

    client = get_mongo_client()
    db = client[config.MONGO_DB_NAME]

    existing = await db.documents.find_one({"user": user_email, "fingerprint": fingerprint})
    if existing:
        os.remove(file_path)
        return {"message": "Duplicate upload", "duplicate": True}

    doc = {
        "user": user_email,
        "filename": file.filename,
        "stored_path": stored_filename,
        "fingerprint": fingerprint,
        "text_snippet": text[:2000]
    }

    res = await db.documents.insert_one(doc)

    FaissManager(user_email).add_document(
        text,
        {"doc_id": str(res.inserted_id), "filename": file.filename, "text_path": file_path}
    )

    return {"message": "Uploaded", "doc_id": str(res.inserted_id)}

# ---------------------------------------------------------------
# RAG ASK
# ---------------------------------------------------------------

@router.post("/ask")
async def ask_question(payload: dict, current_user=Depends(get_current_user)):

    q = payload.get("question", "").strip()
    if not q:
        raise HTTPException(status_code=400, detail="Missing question")

    user_email = current_user["email"]

    hits = FaissManager(user_email).query(q, top_k=4)
    context = "\n\n".join([h.get("text", "") for h in hits])

    if not openrouter:
        return {"answer": "AI not configured."}

    prompt = f"""
Use ONLY the context below to answer the question.

CONTEXT:
{context}

QUESTION:
{q}

If not found, say: "I could not find the answer in the documents."
"""

    response = openrouter.chat.completions.create(
        model="mistralai/mixtral-8x7b-instruct",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400
    )

    answer = _safe_extract(response)
    return {"answer": answer}


def _safe_extract(response: Any) -> str:
    try:
        c = response.choices[0]
        msg = getattr(c, "message", None)
        if msg and hasattr(msg, "content"):
            return msg.content
        if msg and isinstance(msg, dict):
            return msg.get("content", "")
        if hasattr(c, "text"):
            return c.text
    except:
        pass
    return ""

# ---------------------------------------------------------------
# SUMMARIES — LIST
# ---------------------------------------------------------------

@router.get("/summaries")
async def list_summaries(current_user=Depends(get_current_user)):

    user_email = current_user["email"]

    db = get_mongo_client()[config.MONGO_DB_NAME]

    rows = await db.summaries.find({"user": user_email}).sort("created_at", -1).to_list(300)

    return {
        "summaries": [
            {
                "id": str(x["_id"]),
                "docId": x.get("doc_id"),
                "filename": x.get("filename"),
                "text": x.get("text"),
                "createdAt": x.get("created_at").isoformat()
            }
            for x in rows
        ]
    }

# ---------------------------------------------------------------
# SUMMARIZE — GENERATE + UPSERT
# ---------------------------------------------------------------

@router.get("/documents/summarize/{doc_id}")
async def summarize_document(doc_id: str, current_user=Depends(get_current_user)):

    user_email = current_user["email"]

    db = get_mongo_client()[config.MONGO_DB_NAME]

    try:
        oid = ObjectId(doc_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    doc = await db.documents.find_one({"_id": oid, "user": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    path = os.path.join(UPLOAD_DIR, doc["stored_path"])
    ext = os.path.splitext(path)[1].lower()

    text = extract_text(path, ext).get("text", "")

    if not openrouter:
        summary = text[:600]
    else:
        resp = openrouter.chat.completions.create(
            model="mistralai/mixtral-8x7b-instruct",
            messages=[{"role": "user", "content": f"Summarize concisely:\n{text}"}],
            max_tokens=500,
        )
        summary = _safe_extract(resp)

    # UPSERT (update if exists)
    result = await db.summaries.find_one_and_update(
        {"user": user_email, "doc_id": doc_id},
        {
            "$set": {
                "filename": doc["filename"],
                "text": summary,
                "created_at": datetime.utcnow()
            }
        },
        upsert=True,
        return_document=True
    )

    return {"summary": summary}

# ---------------------------------------------------------------
# DELETE SUMMARY
# ---------------------------------------------------------------

@router.delete("/summaries/{sid}")
async def delete_summary(sid: str, current_user=Depends(get_current_user)):

    user_email = current_user["email"]

    db = get_mongo_client()[config.MONGO_DB_NAME]

    try:
        oid = ObjectId(sid)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    res = await db.summaries.delete_one({"_id": oid, "user": user_email})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")

    return {"message": "Deleted"}

# ---------------------------------------------------------------
# QUIZZES — LIST
# ---------------------------------------------------------------

@router.get("/quizzes")
async def list_quizzes(current_user=Depends(get_current_user)):

    user_email = current_user["email"]

    db = get_mongo_client()[config.MONGO_DB_NAME]

    rows = await db.quizzes.find({"user": user_email}).sort("created_at", -1).to_list(300)

    return {
        "quizzes": [
            {
                "id": str(x["_id"]),
                "docId": x.get("doc_id"),
                "filename": x.get("filename"),
                "questions": x.get("questions"),
                "numQuestions": x.get("num_questions"),
                "createdAt": x.get("created_at").isoformat()
            }
            for x in rows
        ]
    }

# ---------------------------------------------------------------
# QUIZ — GENERATE + UPSERT
# ---------------------------------------------------------------

@router.post("/documents/quiz/{doc_id}")
async def generate_quiz(doc_id: str, payload: dict, current_user=Depends(get_current_user)):

    user_email = current_user["email"]

    db = get_mongo_client()[config.MONGO_DB_NAME]

    try:
        oid = ObjectId(doc_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    doc = await db.documents.find_one({"_id": oid, "user": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    path = os.path.join(UPLOAD_DIR, doc["stored_path"])
    content = extract_text(path, os.path.splitext(path)[1].lower()).get("text", "")

    num = int(payload.get("num_questions") or 10)

    if not openrouter:
        quiz = "AI disabled."
    else:
        resp = openrouter.chat.completions.create(
            model="mistralai/mixtral-8x7b-instruct",
            messages=[{"role": "user", "content": f"Create {num} MCQs:\n{content}"}],
            max_tokens=800,
        )
        quiz = _safe_extract(resp)

    # UPSERT (update existing quiz for this document)
    await db.quizzes.find_one_and_update(
        {"user": user_email, "doc_id": doc_id},
        {
            "$set": {
                "filename": doc["filename"],
                "questions": quiz,
                "num_questions": num,
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    return {"quiz": quiz}

# ---------------------------------------------------------------
# DELETE QUIZ
# ---------------------------------------------------------------

@router.delete("/quizzes/{qid}")
async def delete_quiz(qid: str, current_user=Depends(get_current_user)):

    user_email = current_user["email"]
    db = get_mongo_client()[config.MONGO_DB_NAME]

    try:
        oid = ObjectId(qid)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    res = await db.quizzes.delete_one({"_id": oid, "user": user_email})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")

    return {"message": "Deleted"}
