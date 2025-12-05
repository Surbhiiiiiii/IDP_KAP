import React, { useState } from "react";
import axios from "axios";
import { setAuthHeader } from "../api";
import Layout from "../components/Layout";
import Skeleton from "../components/Skeleton";
import AILoader from "../components/AILoader";

export default function ChatPage() {
  const [q, setQ] = useState("");
  const [ans, setAns] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/";
  setAuthHeader(token);

  const ask = async () => {
    if (!q.trim()) {
      alert("Ask a question");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/ask", {
        question: q,
      });
      setAns(res.data.answer);
    } catch (e) {
      alert("Ask failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Chat Assistant">
      <div className="glass-card grad-card card-hover p-8 fade-in">

        <h3 className="text-2xl font-semibold mb-6 grad-text">
          Ask a question based on your uploaded documents
        </h3>

        {/* Input Row */}
        <div className="flex gap-3">
          <input
            className="flex-1 p-3 rounded-lg
              bg-black/30 dark:bg-black/40 
              text-white placeholder-white/40
              border border-white/20 focus:border-purple-400
              outline-none backdrop-blur-md"
            placeholder="Type your question..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <button
            className="px-6 py-2 rounded-lg btn-grad"
            onClick={ask}
            disabled={loading}
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>

        {/* Answer Box */}
        <div
          className="
            mt-6 p-5 rounded-xl border
            bg-white/60 dark:bg-white/5
            border-black/20 dark:border-white/10
            text-black dark:text-white/90
            min-h-[160px]"
        >
          <h4 className="font-semibold text-black dark:text-white/80 mb-2">
            Answer
          </h4>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="whitespace-pre-line text-black dark:text-white/70">
              {ans || "No answer yet."}
            </div>
          )}

          {loading && (
            <div className="mt-3">
              <AILoader label="Generating answer..." />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
