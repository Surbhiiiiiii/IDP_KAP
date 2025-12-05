import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import Skeleton from "../components/Skeleton";
import { setAuthHeader } from "../api";

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename || "quiz"}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Quizzes() {
  const [items, setItems] = useState(null); // null => skeleton
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setAuthHeader(token);
    loadQuizzes(token);
  }, []);

  const loadQuizzes = async (token) => {
    try {
      const res = await axios.get("http://localhost:8000/api/quizzes", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = res.data.quizzes || [];
      setItems(list);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      } else {
        console.error("Failed to load quizzes:", e);
      }
    }
  };

  const remove = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    if (!window.confirm("Delete this quiz?")) return;

    setDeletingId(id);
    try {
      await axios.delete(`http://localhost:8000/api/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      alert("Delete failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout title="Quizzes">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slideUp">
        {items === null ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))
        ) : items.length === 0 ? (
          <div className="p-6 text-black/60 dark:text-white/40 text-lg">
            No quizzes yet. Generate one from Documents.
          </div>
        ) : (
          items.map((qz) => (
            <div
              key={qz.id}
              className="glass-card p-6 rounded-2xl shadow-xl transition-all duration-300 
                bg-white/60 dark:bg-white/5
                hover:bg-white/70 dark:hover:bg-white/10"
            >
              <div className="flex justify-between items-start gap-4">
                {/* Left: info */}
                <div className="flex-1">
                  <div className="text-lg font-semibold grad-text">
                    {qz.filename || "Untitled document"} — {qz.numQuestions} Qs
                  </div>

                  <div className="text-xs text-black/60 dark:text-white/40 mb-3">
                    {qz.createdAt
                      ? new Date(qz.createdAt).toLocaleString()
                      : ""}
                  </div>

                  <div className="text-sm text-black dark:text-white/70 max-h-40 overflow-auto whitespace-pre-wrap leading-relaxed">
                    {qz.questions}
                  </div>
                </div>

                {/* Right: buttons */}
                <div className="flex flex-col gap-2 ml-2 shrink-0">
                  <button
                    onClick={() =>
                      downloadText(`quiz_${qz.id}`, qz.questions)
                    }
                    className="px-3 py-2 rounded-lg btn-grad text-white shadow-sm"
                  >
                    ⬇ Download
                  </button>

                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(qz.questions)
                    }
                    className="px-3 py-2 rounded-lg bg.white/20 dark:bg-white/10 text-black dark:text.white border border-black/10 dark:border-white/10"
                  >
                    📄 Copy
                  </button>

                  <button
                    onClick={() => remove(qz.id)}
                    disabled={deletingId === qz.id}
                    className="px-3 py-2 rounded-lg bg-red-500/70 hover:bg-red-600 text-white text-sm"
                  >
                    {deletingId === qz.id ? "Deleting…" : "🗑 Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
