import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { setAuthHeader } from "../api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import Skeleton from "../components/Skeleton";
import AILoader from "../components/AILoader";
import { ThemeContext } from "../context/ThemeContext";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [summarizingId, setSummarizingId] = useState(null);
  const [quizId, setQuizId] = useState(null);

  const nav = useNavigate();
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/");

    setAuthHeader(token);
    loadDocs(token);
  }, []);

  const loadDocs = async (token) => {
    try {
      const res = await axios.get("http://localhost:8000/api/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocs(res.data.documents || []);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (docId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `http://localhost:8000/api/documents/view/${docId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (e) {
      alert("Error opening document");
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document?")) return;

    const token = localStorage.getItem("token");

    try {
      await axios.delete(
        `http://localhost:8000/api/documents/delete/${docId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDocs((prev) => prev.filter((d) => d._id !== docId));
    } catch (e) {
      alert("Delete failed");
    }
  };

  const handleSummarize = async (docId, filename) => {
    const token = localStorage.getItem("token");
    setSummarizingId(docId);

    try {
      const res = await axios.get(
        `http://localhost:8000/api/documents/summarize/${docId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const summary = res.data.summary || "";

      const item = {
        id: `sum_${Date.now()}`,
        docId,
        filename,
        text: summary,
        createdAt: new Date().toISOString(),
        savedToPortal: false,
      };

      const existing = JSON.parse(localStorage.getItem("summaries") || "[]");
      existing.unshift(item);
      localStorage.setItem("summaries", JSON.stringify(existing));

      nav("/summaries");
    } catch {
      alert("Summarize failed");
    } finally {
      setSummarizingId(null);
    }
  };

  const handleQuiz = async (docId, filename) => {
    const token = localStorage.getItem("token");
    const num = parseInt(prompt("How many questions? (10–20)", "10"), 10) || 10;

    setQuizId(docId);

    try {
      const res = await axios.post(
        `http://localhost:8000/api/documents/quiz/${docId}`,
        { num_questions: num },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const quiz = res.data.quiz || "";

      const item = {
        id: `quiz_${Date.now()}`,
        docId,
        filename,
        questions: quiz,
        numQuestions: num,
        createdAt: new Date().toISOString(),
        savedToPortal: false,
      };

      const existing = JSON.parse(localStorage.getItem("quizzes") || "[]");
      existing.unshift(item);
      localStorage.setItem("quizzes", JSON.stringify(existing));

      nav("/quizzes");
    } catch {
      alert("Quiz generation failed");
    } finally {
      setQuizId(null);
    }
  };

  return (
    <Layout title="Documents">
      <div className="glass-card grad-card p-8 fade-in">

        {/* Fix: Adjust grid so no overlapping happens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))
          ) : docs.length > 0 ? (
            docs.map((d) => (
              <div
                key={d._id}
                className={`glass-card p-6 rounded-xl shadow-lg 
                w-full
                flex justify-between items-center 
                overflow-hidden transition-all
                ${theme === "light" ? "bg-white/80 text-black" : "bg-white/10 text-white"}`}
              >
                <div className="max-w-[70%]">
                  <div className={`font-semibold text-lg truncate 
                    ${theme === "light" ? "text-black" : "text-white"}`}>
                    {d.filename}
                  </div>

                  <div className={`${theme === "light" ? "text-black/50" : "text-white/40"} text-sm truncate`}>
                    {d._id}
                  </div>
                </div>

                <div className="flex gap-3 items-center shrink-0">

                  <button className="icon-btn" onClick={() => handleView(d._id)}>
                    👁️
                  </button>

                  <button className="icon-btn" onClick={() => handleSummarize(d._id, d.filename)}>
                    {summarizingId === d._id ? <AILoader label="..." /> : "📝"}
                  </button>

                  <button className="icon-btn" onClick={() => handleQuiz(d._id, d.filename)}>
                    {quizId === d._id ? <AILoader label="..." /> : "❓"}
                  </button>

                  <button
                    className="icon-btn text-red-400 hover:bg-red-500/10"
                    onClick={() => handleDelete(d._id)}
                  >
                    🗑️
                  </button>

                </div>

              </div>
            ))
          ) : (
            <div className="text-white/40 p-6">No documents uploaded yet.</div>
          )}

        </div>
      </div>
    </Layout>
  );
}
