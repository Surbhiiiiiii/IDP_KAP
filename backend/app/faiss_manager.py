import os
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# MiniLM-L6-v2 → 384-dim embeddings
EMBED_MODEL = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

BASE_DIR = os.path.join(os.getcwd(), "vectorstores")
os.makedirs(BASE_DIR, exist_ok=True)


class FaissManager:
    def __init__(self, user_email):
        safe = user_email.replace("@", "_at_")

        # FAISS index path
        self.index_path = os.path.join(BASE_DIR, f"{safe}.index")

        # Metadata path
        self.meta_path = os.path.join(BASE_DIR, f"{safe}.json")

        # Per-user text storage directory
        self.text_dir = os.path.join(BASE_DIR, f"{safe}_docs")
        os.makedirs(self.text_dir, exist_ok=True)

        # Load or create FAISS index
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
        else:
            self.index = faiss.IndexFlatL2(384)

        # Load or create metadata JSON
        if os.path.exists(self.meta_path):
            with open(self.meta_path, "r") as f:
                self.metadata = json.load(f)
        else:
            self.metadata = []

    def save(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "w") as f:
            json.dump(self.metadata, f, indent=2)

    def embed(self, text):
        vec = EMBED_MODEL.encode([text], convert_to_numpy=True)
        return vec.astype("float32")

    def add_document(self, text, meta):
        # Save text to a file so FAISS only holds vectors
        doc_id = meta["doc_id"]
        text_path = os.path.join(self.text_dir, f"{doc_id}.txt")

        with open(text_path, "w", encoding="utf-8") as f:
            f.write(text)

        meta["text_path"] = text_path

        # Add vector
        vec = self.embed(text)
        self.index.add(vec)

        # Add metadata
        self.metadata.append(meta)
        self.save()

    def query(self, q, top_k=4):
        if len(self.metadata) == 0:
            return []

        q_vec = self.embed(q)
        scores, ids = self.index.search(q_vec, top_k)

        results = []

        for idx in ids[0]:
            if idx < len(self.metadata):
                item = self.metadata[idx]
                with open(item["text_path"], "r", encoding="utf-8") as f:
                    text = f.read()

                results.append({
                    "text": text,
                    "score": float(scores[0][ids[0].tolist().index(idx)]),
                    **item,
                })

        return results
