import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiBars3 } from "react-icons/hi2";

const NavItem = ({ to, label, icon, collapsed }) => {
  const loc = useLocation();
  const active = loc.pathname === to;

  return (
    <Link
      to={to}
      className={`ripple flex items-center gap-3 px-4 py-3 rounded-lg transition-all
        ${
          active
            ? "bg-purple-600/20 text-white shadow-lg"
            : "text-gray-700 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
        }`}
    >
      <span className="text-xl">{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
  );
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen flex flex-col border-r dark:border-white/10
        bg-white dark:bg-[#0b0b0e] text-black dark:text-white transition-all
        ${collapsed ? "w-20" : "w-64"}`}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <h1 className="text-lg font-semibold tracking-wide text-black dark:text-white/90">
            IDP Assistant
          </h1>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        >
          <HiBars3 className="text-2xl" />
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-2 mt-4">
        <NavItem to="/dashboard" label="Dashboard" icon="📁" collapsed={collapsed} />
        <NavItem to="/upload" label="Upload" icon="⬆️" collapsed={collapsed} />
        <NavItem to="/chat" label="Chat" icon="💬" collapsed={collapsed} />

        <div className="mt-4 border-t border-black/10 dark:border-white/10"></div>

        <NavItem to="/summaries" label="Summaries" icon="📝" collapsed={collapsed} />
        <NavItem to="/quizzes" label="Quizzes" icon="❓" collapsed={collapsed} />

        {/* ⭐ NEW CHANGES MENU ITEM */}
        <NavItem to="/changes" label="Changes" icon="🔍" collapsed={collapsed} />
      </nav>

      <div className="mt-auto px-3 pb-6">
        <Link
  to="/"
  className="text-sm text-black/70 dark:text-white/70 hover:underline"
  onClick={() => {
    localStorage.removeItem("token");
    setAuthHeader(null);       // ⭐ REQUIRED
    window.location.href = "/"; // ⭐ HARD RESET
  }}
>
  {!collapsed ? "Sign out" : "🚪"}
</Link>

      </div>
    </aside>
  );
}
