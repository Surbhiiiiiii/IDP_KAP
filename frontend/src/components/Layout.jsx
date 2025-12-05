import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { setAuthHeader } from "../api";

export default function Layout({ children, title }) {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setAuthHeader(token); // correctly re-applies header
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0b0b0e]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <Topbar title={title} />
        <main className="p-8 text-black dark:text-white">
          {children}
        </main>
      </div>
    </div>
  );
}


  