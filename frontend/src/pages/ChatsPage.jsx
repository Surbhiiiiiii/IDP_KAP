// src/pages/ChatsPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import axios from "axios";
import { setAuthHeader } from "../api";

export default function ChatsPage() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }
    setAuthHeader(token);
    fetchChats(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChats = async (token) => {
    try {
      const res = await axios.get("http://localhost:8000/api/chat/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(res.data.chats || []);
    } catch (e) {
      console.error("fetch chats failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <NavBar />
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Chats</h2>
            <Link to="/chat" className="px-3 py-2 rounded bg-indigo-600 text-white">New Chat</Link>
          </div>

          <div className="grid gap-3">
            {chats.length === 0 && <div className="text-gray-500">No chats yet. Click "New Chat" to start one.</div>}
            {chats.map(c => (
              <Link key={c.chat_id} to={`/chat/${c.chat_id}`} className="block p-3 border rounded hover:shadow-sm">
                <div className="font-semibold">{c.title || "Untitled chat"}</div>
                <div className="text-xs text-gray-500 mt-1">Updated: {c.updated_at ? new Date(c.updated_at).toLocaleString() : "-"}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
