from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from jose import jwt
from . import deps, config, models
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = deps.pwd_context

def create_access_token(subject: str, expires_delta: timedelta | None = None):
    to_encode = {"sub": subject}
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)
    return encoded_jwt

@router.post("/signup")
async def signup(user: models.UserCreate):
    client = deps.get_mongo_client()
    db = client[config.MONGO_DB_NAME]
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = pwd_context.hash(user.password)
    doc = {"name": user.name, "email": user.email, "hashed_password": hashed, "created_at": datetime.utcnow().isoformat()}
    await db.users.insert_one(doc)
    return {"message": "User created"}

# OAuth2 form-based login
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    client = deps.get_mongo_client()
    db = client[config.MONGO_DB_NAME]
    user = await db.users.find_one({"email": form_data.username})
    if not user or not pwd_context.verify(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(subject=user["email"])
    return {"access_token": access_token, "token_type": "bearer"}

# JSON login shortcut (frontend uses this)
class LoginPayload(BaseModel):
    email: str
    password: str

@router.post("/login_json")
async def login_json(payload: LoginPayload):
    client = deps.get_mongo_client()
    db = client[config.MONGO_DB_NAME]
    user = await db.users.find_one({"email": payload.email})
    if not user or not pwd_context.verify(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(subject=user["email"])
    return {"access_token": access_token, "token_type": "bearer"}
