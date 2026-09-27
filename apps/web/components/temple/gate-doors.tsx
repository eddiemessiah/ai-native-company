"use client";

import { useEffect } from "react";

const seen = () => {
  document.documentElement.dataset.gate = "seen";
};

export function GateDoors() {
  useEffect(() => {
    // Client-side navigations skip the inline script, so note the visit here as well.
    try {
      sessionStorage.setItem("t-gate", "1");
    } catch {
      // Storage blocked: the gate still opens on its own.
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") seen();
    };
    window.addEventListener("keydown", onKey);
    const done = window.setTimeout(seen, 3300);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(done);
    };
  }, []);

  return (
    <div className="t-gate" aria-hidden="true">
      <div className="t-door t-wood" />
      <div className="t-door t-wood" />
      <div className="t-seam" />
      <div className="t-gate-title">
        <span lang="ja" className="t-kanji">
          山門
        </span>
        <span className="t-gate-name">Shonin</span>
      </div>
      <button type="button" tabIndex={-1} className="t-gate-skip" onClick={seen}>
        Skip
      </button>
    </div>
  );
}
