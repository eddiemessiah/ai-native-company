"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "dark" || set === "light") return set;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => setTheme(current()), []);

  function toggle() {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode or blocked storage: the toggle still works for this visit.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      className="grid h-9 w-9 place-items-center rounded-full border border-line-2 text-dim transition-colors hover:border-fg hover:text-fg"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 2a6 6 0 0 1 0 12Z" fill="currentColor" />
      </svg>
    </button>
  );
}

/** Runs before paint so the stored theme never flashes. */
export const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
