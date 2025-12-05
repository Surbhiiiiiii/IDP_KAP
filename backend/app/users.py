from fastapi import APIRouter, Depends
from .deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def read_me(current_user=Depends(get_current_user)):
    return current_user
