import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { MdDarkMode, MdLightMode } from "react-icons/md";

export default function Topbar({ title }) {
  const { theme, setTheme } = useContext(ThemeContext);

  // 🔥 Only Dark ⇆ Light toggle
  const toggleTheme = () => {
    if (theme === "dark") setTheme("light");
    else setTheme("dark");
  };

  const icon = theme === "dark" ? <MdDarkMode /> : <MdLightMode />;

  return (
    <header
      className="flex justify-between items-center px-8 py-4
        bg-white dark:bg-[#0f0f11]
        text-black dark:text-white
        border-b border-black/10 dark:border-white/10
        backdrop-blur-sm transition-all"
    >
      <h1 className="text-xl font-semibold tracking-wide">{title}</h1>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg 
        bg-black/5 dark:bg-white/10
        hover:bg-black/10 dark:hover:bg-white/20
        text-black dark:text-white text-2xl transition"
        title="Toggle theme"
      >
        {icon}
      </button>
    </header>
  );
}
