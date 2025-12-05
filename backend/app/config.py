from dotenv import load_dotenv
from pathlib import Path
import os

# Path to your .env file
BASE_DIR = Path(__file__).resolve().parent  # backend/app
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY")
# print(f"Loaded SECRET_KEY: {SECRET_KEY}")  # Debugging line to confirm loading
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "idp_idp")
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

FAISS_DIR = os.getenv("FAISS_DIR", "./faiss_data")
