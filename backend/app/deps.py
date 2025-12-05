from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel
from . import config

_client = None

def get_mongo_client():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.MONGODB_URI)
    return _client

# ---- SWITCHED TO ARGON2 ----
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class TokenData(BaseModel):
    email: str | None = None

async def verify_token(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate":"Bearer"},
    )
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception

async def get_current_user(email: str = Depends(verify_token)):
    client = get_mongo_client()
    db = client[config.MONGO_DB_NAME]
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user.pop("hashed_password", None)
    return user
