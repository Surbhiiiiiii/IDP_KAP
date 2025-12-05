import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";

import {
  MdDarkMode,
  MdLightMode,
} from "react-icons/md";

import {
  FaRobot,
  FaFilePdf,
  FaBrain,
  FaImage,
  FaFileWord,
  FaQuestionCircle,
  FaSearch,
  FaComments,

    FaChartLine
} from "react-icons/fa";

export default function LandingPage() {
  const { theme, setTheme } = useContext(ThemeContext);
  const nav = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div
      className={`min-h-screen transition-all ${
        theme === "light"
          ? "bg-gray-100 text-black"
          : "bg-[#0d0d10] text-white"
      }`}
    >

      {/* THEME TOGGLE */}
      <button
        onClick={toggleTheme}
        className="
          fixed top-6 right-6 z-50
          p-3 rounded-xl text-2xl shadow-lg
          bg-black/10 dark:bg-white/10
          hover:bg-black/20 dark:hover:bg-white/20
          backdrop-blur-md
          transition
        "
      >
        {theme === "light" ? <MdDarkMode /> : <MdLightMode />}
      </button>

      {/* BACKGROUND GLOW */}
      <div className="
        absolute inset-0 pointer-events-none
        bg-gradient-to-br from-purple-600/40 via-pink-500/25 to-blue-600/30
        blur-[140px] opacity-40
      "></div>

      {/* HERO SECTION */}
      <section className="relative z-10 text-center px-6 pt-32 pb-24">
        <h1 className="
          text-5xl md:text-6xl font-extrabold mb-6 leading-tight
          bg-clip-text text-transparent
          bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500
          animate-pulse
        ">
          Your AI-Powered Intelligent Document Assistant
        </h1>

        <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
          Upload any file. Summarize instantly. Generate quizzes.  
          Ask questions to your documents.  
          A complete AI Knowledge Platform — designed for students, teachers, analysts, and professionals.
        </p>

        <button
          onClick={() => nav("/login")}
          className="
            mt-12 px-12 py-4 rounded-2xl text-lg font-semibold
            btn-grad shadow-xl hover:shadow-purple-500/30
            transition-all tracking-wide
          "
        >
          Start Exploring →
        </button>
      </section>

      {/* SUPPORTED FORMATS */}
      <section className="relative z-10 px-8 md:px-20 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12 grad-text">Multi-Format Support</h2>

        <div className="grid md:grid-cols-4 gap-10 text-center">
          <div className="glass-card p-6 rounded-2xl">
            <FaFilePdf className="text-5xl mx-auto text-red-400 mb-3" />
            <p className="font-semibold text-lg">PDF</p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <FaFileWord className="text-5xl mx-auto text-blue-500 mb-3" />
            <p className="font-semibold text-lg">DOCX</p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <FaImage className="text-5xl mx-auto text-purple-400 mb-3" />
            <p className="font-semibold text-lg">Images (JPG/PNG)</p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <FaSearch className="text-5xl mx-auto text-green-400 mb-3" />
            <p className="font-semibold text-lg">Extracted Text</p>
          </div>
        </div>
      </section>

      {/* FEATURES EXPANDED */}
      <section className="relative z-10 px-8 md:px-20 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12 grad-text">Everything You Need — Powered by AI</h2>

        <div className="grid md:grid-cols-3 gap-10">
          <FeatureCard
            icon={<FaBrain className="text-5xl mb-4 text-purple-400" />}
            title="AI Summarization"
            desc="Get crystal-clear summaries of long PDFs, research papers, and notes — in seconds."
          />

          <FeatureCard
            icon={<FaQuestionCircle className="text-5xl mb-4 text-indigo-400" />}
            title="Quiz Generator"
            desc="Automatically generate 10–20 MCQs from your document for exams, study, or training."
          />

          <FeatureCard
            icon={<FaRobot className="text-5xl mb-4 text-pink-400" />}
            title="Chat With Documents"
            desc="Ask anything and get contextual answers, grounded in your uploaded content."
          />

          <FeatureCard
            icon={<FaComments className="text-5xl mb-4 text-green-400" />}
            title="Conversational AI"
            desc="Your personal assistant — always ready to help, explain, or analyze."
          />

          <FeatureCard
            icon={<FaChartLine className="text-5xl mb-4 text-blue-400" />}
            title="Smart Knowledge Extraction"
            desc="AI extracts clean and structured content from PDFs, images, and DOCX."
          />

          <FeatureCard
            icon={<FaSearch className="text-5xl mb-4 text-yellow-400" />}
            title="Duplicate Detection"
            desc="Advanced fingerprinting ensures you're not uploading the same content twice."
          />
        </div>
      </section>

      {/* CTA LARGE */}
      <section className="relative z-10 text-center py-24 px-6">
        <h2 className="text-4xl font-bold mb-6 grad-text">
          Transform the Way You Study & Work
        </h2>

        <p className="text-lg opacity-80 max-w-xl mx-auto mb-10">
          Powered by AI. Designed for speed. Built for productivity.
        </p>

        <button
          onClick={() => nav("/login")}
          className="
            px-12 py-4 rounded-2xl text-lg font-semibold
            btn-grad shadow-xl hover:shadow-purple-500/30
            transition
          "
        >
          Get Started →
        </button>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass-card p-8 rounded-2xl shadow-lg hover:shadow-purple-500/20 transition transform hover:-translate-y-1">
      {icon}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="opacity-80">{desc}</p>
    </div>
  );
}
