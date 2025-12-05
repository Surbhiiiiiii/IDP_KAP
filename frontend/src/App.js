import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import ChatPage from "./pages/ChatPage";
import Changes from "./pages/Changes";

// extra pages
import Summaries from "./pages/Summaries";
import Quizzes from "./pages/Quizzes";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected pages */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/chat" element={<ChatPage />} />

      {/* ⭐ ADDED CHANGES ROUTE */}
      <Route path="/changes" element={<Changes />} />

      {/* Additional */}
      <Route path="/summaries" element={<Summaries />} />
      <Route path="/quizzes" element={<Quizzes />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
