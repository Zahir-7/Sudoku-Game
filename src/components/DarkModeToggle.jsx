import React from "react";
import { Sun, Moon } from 'lucide-react';

function DarkModeToggle({ darkMode, setDarkMode }) {
  return (
    <button
      className="fixed top-4 cursor-pointer right-4 z-50 bg-gray-800 text-white px-3 py-2 rounded-full shadow hover:bg-gray-600 transition"
      onClick={() => setDarkMode((d) => !d)}
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-white" />}
    </button>
  );
}

export default DarkModeToggle;
