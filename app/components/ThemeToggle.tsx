"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState<boolean | null>(null);

  useEffect(() => {
    // Only run on client
    const storedTheme = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Priority: localStorage > system preference
    const isDark = storedTheme 
      ? storedTheme === "dark"
      : systemDark;
    
    setDarkMode(isDark);
    
    // Apply to DOM
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    if (darkMode === null) return;
    
    // Update DOM and storage when darkMode changes
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Listen for system preference changes (when no localStorage preference)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      // Only follow system if user hasn't set a preference
      if (!localStorage.getItem("theme")) {
        const isDark = mediaQuery.matches;
        setDarkMode(isDark);
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Don't render until we know the theme (avoid hydration mismatch)
  if (darkMode === null) {
    return (
      <button 
        className="p-2 rounded-lg bg-gray-200 animate-pulse"
        aria-label="Loading theme"
        disabled
      >
        ...
      </button>
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleDarkMode();
        }
      }}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
      aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
      title={`Current mode: ${darkMode ? "dark" : "light"}`}
    >
      {darkMode ? (
        <>
          <span className="sr-only">Switch to light mode</span>
          🌙
        </>
      ) : (
        <>
          <span className="sr-only">Switch to dark mode</span>
          ☀️
        </>
      )}
    </button>
  );
}