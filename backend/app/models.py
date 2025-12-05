from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str 
    email: EmailStr
    password: str

class LoginJSON(BaseModel):
    email: EmailStr
    password: str
