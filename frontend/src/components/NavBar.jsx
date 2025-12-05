import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow mb-6">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-300 flex items-center justify-center text-white font-bold">
          IDP
        </div>
        <div>
          <div className="font-bold text-lg hover:underline">
            Knowledge Assistant Platform
          </div>
          <div className="text-sm text-gray-500"></div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/upload" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">
          Upload
        </Link>
        <Link to="/chat" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">
          New Chat
        </Link>
        <Link to="/changes" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">
          Changes
        </Link>
        <button onClick={logout} className="px-3 py-2 rounded-lg border">
          Logout
        </button>
      </div>
    </div>
  );
}
