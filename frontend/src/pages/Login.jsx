import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { setAuthHeader } from "../api";
import { ThemeContext } from "../context/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export default function Login() {
  const nav = useNavigate();
  const { theme } = useContext(ThemeContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorShake, setErrorShake] = useState(false);

 const handle = async () => {
  setLoading(true);
  setErrorShake(false);

  try {
    const res = await axios.post("http://localhost:8000/auth/login_json", {
      email,
      password,
    });

    const token = res.data.access_token;

    // Save token + set header
    localStorage.setItem("token", token);
    setAuthHeader(token);

    // ⭐ First navigate to dashboard
    nav("/dashboard");

    // ⭐ THEN reload to refresh axios & layout
    setTimeout(() => {
      window.location.reload();
    }, 50);

  } catch (e) {
    setErrorShake(true);
    setLoading(false);
    setTimeout(() => setErrorShake(false), 500);
    alert("Login failed: " + (e.response?.data?.detail || e.message));
  }
};



  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-all 
      ${theme === "light" ? "bg-gray-100 text-black" : "bg-[#0f0f11] text-white"} relative`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-blue-600/20 blur-3xl opacity-40 pointer-events-none"></div>

      <div
        className={`relative w-full max-w-md backdrop-blur-xl glass-card p-10 
        border border-white/10 rounded-2xl shadow-2xl transition-all duration-300
        ${theme === "light" ? "bg-white/70 text-black" : "bg-white/5 text-white"}
        ${errorShake ? "shake" : ""}`}
      >
        <h1 className="text-4xl font-bold mb-3 grad-text">Welcome Back</h1>

        <p className={`${theme === "light" ? "text-black/60" : "text-white/50"} mb-8`}>
          Login to your Intelligent Document Assistant
        </p>

        {/* EMAIL */}
        <input
          className={`w-full p-3 mb-4 rounded-xl border 
          ${theme === "light"
            ? "bg-white text-black placeholder-black/50 border-black/20"
            : "bg-white/10 text-white placeholder-white/50 border-white/20"} 
          focus:border-purple-400 outline-none`}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <div className="relative">
          <input
            className={`w-full p-3 mb-6 rounded-xl border pr-12
            ${theme === "light"
              ? "bg-white text-black placeholder-black/50 border-black/20"
              : "bg-white/10 text-white placeholder-white/50 border-white/20"}
            focus:border-purple-400 outline-none`}
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className={`absolute right-3 top-3 transition 
            ${theme === "light" ? "text-black/50 hover:text-black" : "text-white/60 hover:text-white"}`}
            onClick={() => setShowPassword(!showPassword)}
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>

        {/* LOGIN BUTTON */}
        <button
          className="w-full p-3 rounded-xl btn-grad text-white font-semibold shadow-lg 
          hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
          onClick={handle}
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "Login"
          )}
        </button>

        <p className={`mt-4 text-center ${theme === "light" ? "text-black/60" : "text-white/60"}`}>
          Don't have an account?{" "}
          <Link to="/signup" className="text-purple-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
