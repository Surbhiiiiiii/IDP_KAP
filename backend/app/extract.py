import hashlib
import pdfplumber
import docx
import pytesseract
from PIL import Image
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def fingerprint_text(text):
    return hashlib.md5(text.encode()).hexdigest()

def extract_text(path, ext):
    ext = ext.lower()
    text = ""

    # -----------------------------------
    # 1) PDF (unchanged – your original logic)
    # -----------------------------------
    if ext == ".pdf":
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""

    # -----------------------------------
    # 2) TXT + MD (unchanged)
    # -----------------------------------
    elif ext in [".txt", ".md"]:
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()

    # -----------------------------------
    # 3) DOCX Support
    # -----------------------------------
    elif ext == ".docx":
        doc = docx.Document(path)
        text = "\n".join(p.text for p in doc.paragraphs)

    # -----------------------------------
    # 4) Image OCR Support (PNG, JPG, JPEG)
    # -----------------------------------
    elif ext in [".png", ".jpg", ".jpeg"]:
        img = Image.open(path)
        text = pytesseract.image_to_string(img)

    # -----------------------------------
    # 5) Unknown format fallback (safe)
    # -----------------------------------
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    text = text.strip()
    return {
        "text": text,
        "fingerprint": fingerprint_text(text)
    }
