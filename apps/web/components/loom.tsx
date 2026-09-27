"use client";

import { useEffect, useRef } from "react";

/**
 * The hero: a loom weaving the firm's decisions.
 *
 * Warp threads run vertically. Each shuttle is one unit of work crossing the
 * warp, leaving a plain weave behind it; its colour says who did the work
 * (write = LLM, decide = System One, code = code, human = a person approves).
 * When a shuttle lands it prints the decision it made, like a log line. The
 * cloth fades as it ages, so the pattern is always being rewoven.
 */

type Kind = "write" | "decide" | "code" | "human";

interface Shuttle {
  row: number;
  x: number;
  from: number;
  to: number;
  speed: number;
  kind: Kind;
  label: string;
}

interface Chip {
  x: number;
  y: number;
  text: string;
  kind: Kind;
  born: number;
}

const LABELS: Record<Kind, readonly string[]> = {
  decide: [
    "choice → grant-desk · 0.91",
    "noul refund · 0.97",
    "score urgency · 1.62/2",
    "choice → company-brain · 0.88",
    "gate → execute · 0.93",
    "noul spam · 0.02",
    "choice → billing · 0.94",
    "score frustration · 0.41/2",
    "choice → investigate · 0.72",
    "noul needs approval · 0.89",
    "choice → t4 onchain · 0.83",
    "score fit · 2.71/3",
  ],
  write: ["draft → reply", "draft → audit §3", "rewrite → milestones", "summary → 212 tok", "draft → proposal", "brief → tomorrow 07:00"],
  code: ["lookup_order A-104 ✓", "slot 14:00 free ✓", "total €4,500 ✓", "x402 settle 0.01 USDC", "deadline in 3d ✓", "limit 10 actions ✓"],
  human: ["approve? refund $125", "approve? send proposal", "escalate → founder", "approve? transfer 120 USDC"],
};

const WEIGHTS: readonly [Kind, number][] = [
  ["decide", 0.55],
  ["write", 0.18],
  ["code", 0.19],
  ["human", 0.08],
];

function pickKind(r: number): Kind {
  let acc = 0;
  for (const [k, w] of WEIGHTS) {
    acc += w;
    if (r < acc) return k;
  }
  return "decide";
}

export function Loom({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 16;
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let dpr = 1;
    // Per cell: birth time (ms) of the weave, 0 if empty; and its kind.
    let born = new Float64Array(0);
    let kinds = new Uint8Array(0);
    const kindIndex: Kind[] = ["decide", "write", "code", "human"];
    const shuttles: Shuttle[] = [];
    const chips: Chip[] = [];
    const pointer = { x: -9999, y: -9999 };
    let colors: Record<Kind | "fg" | "bg", string> = { decide: "", write: "", code: "", human: "", fg: "", bg: "" };
    let raf = 0;
    let running = true;
    let lastSpawn = 0;
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    function readColors() {
      const s = getComputedStyle(document.documentElement);
      colors = {
        decide: s.getPropertyValue("--decide").trim() || "#7480ff",
        write: s.getPropertyValue("--write").trim() || "#ffb000",
        code: s.getPropertyValue("--code").trim() || "#ede8dc",
        human: s.getPropertyValue("--human").trim() || "#ff5a36",
        fg: s.getPropertyValue("--fg").trim() || "#ede8dc",
        bg: s.getPropertyValue("--bg").trim() || "#0b0b0a",
      };
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      born = new Float64Array(cols * rows);
      kinds = new Uint8Array(cols * rows);
      shuttles.length = 0;
      chips.length = 0;
    }

    function spawn(now: number) {
      if (shuttles.length > Math.min(14, rows)) return;
      const kind = pickKind(rand());
      const row = 2 + Math.floor(rand() * Math.max(1, rows - 4));
      if (shuttles.some((s) => s.row === row)) return;
      const from = Math.floor(rand() * cols * 0.55);
      const span = 10 + Math.floor(rand() * Math.min(38, cols * 0.5));
      const labels = LABELS[kind];
      shuttles.push({
        row,
        x: from,
        from,
        to: Math.min(cols - 1, from + span),
        speed: kind === "decide" ? 0.028 + rand() * 0.02 : kind === "write" ? 0.011 + rand() * 0.006 : 0.02 + rand() * 0.01,
        kind,
        label: labels[Math.floor(rand() * labels.length)] ?? "",
      });
      lastSpawn = now;
    }

    function weave(s: Shuttle, now: number) {
      const c = Math.floor(s.x);
      const i = s.row * cols + c;
      if (c >= 0 && c < cols && born[i] === 0) {
        born[i] = now;
        kinds[i] = kindIndex.indexOf(s.kind);
      } else if (c >= 0 && c < cols && now - (born[i] ?? 0) > 3000) {
        born[i] = now;
        kinds[i] = kindIndex.indexOf(s.kind);
      }
    }

    function draw(now: number) {
      ctx!.clearRect(0, 0, width, height);

      // Warp threads, bending gently away from the pointer.
      ctx!.lineWidth = 1;
      for (let c = 0; c < cols; c++) {
        const x0 = c * CELL + CELL / 2;
        const dx = x0 - pointer.x;
        const bend = Math.abs(dx) < 90 ? (dx / 90) * (1 - Math.abs(dx) / 90) * 10 : 0;
        ctx!.strokeStyle = colors.fg;
        ctx!.globalAlpha = 0.05;
        ctx!.beginPath();
        if (bend !== 0 && pointer.y > -1000) {
          ctx!.moveTo(x0, 0);
          ctx!.quadraticCurveTo(x0 + bend * 2, pointer.y, x0, height);
        } else {
          ctx!.moveTo(x0, 0);
          ctx!.lineTo(x0, height);
        }
        ctx!.stroke();
      }

      // The cloth.
      const LIFE = 16000;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const b = born[i] ?? 0;
          if (b === 0) continue;
          const age = now - b;
          if (age > LIFE) {
            born[i] = 0;
            continue;
          }
          const fresh = Math.max(0, 1 - age / 900);
          const fade = 1 - age / LIFE;
          const px = c * CELL;
          const py = r * CELL;
          const near = Math.hypot(px + CELL / 2 - pointer.x, py + CELL / 2 - pointer.y) < 110 ? 0.25 : 0;
          const kind = kindIndex[kinds[i] ?? 0] ?? "decide";
          const over = (c + r) % 2 === 0;
          ctx!.fillStyle = colors[kind];
          ctx!.globalAlpha = Math.min(1, 0.16 + 0.5 * fade + 0.6 * fresh + near);
          if (over) {
            ctx!.fillRect(px + 1, py + CELL / 2 - 2.5, CELL - 2, 5);
          } else {
            ctx!.fillRect(px + 1, py + CELL / 2 - 0.75, CELL - 2, 1.5);
            ctx!.fillStyle = colors.fg;
            ctx!.globalAlpha = 0.08 + 0.25 * fade;
            ctx!.fillRect(px + CELL / 2 - 1.25, py + 2, 2.5, CELL - 4);
          }
        }
      }

      // Shuttles.
      for (const s of shuttles) {
        const hx = s.x * CELL;
        const hy = s.row * CELL + CELL / 2;
        ctx!.globalAlpha = 1;
        ctx!.fillStyle = colors[s.kind];
        ctx!.shadowColor = colors[s.kind];
        ctx!.shadowBlur = 14;
        ctx!.beginPath();
        ctx!.roundRect(hx - 5, hy - 3.5, 12, 7, 3.5);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      // Decision chips: only where there's room for them beside the headline.
      if (width < 640) {
        ctx!.globalAlpha = 1;
        return;
      }
      ctx!.font = "500 11px 'JetBrains Mono Variable', ui-monospace, monospace";
      ctx!.textBaseline = "middle";
      for (const chip of chips) {
        const age = now - chip.born;
        const alpha = age < 250 ? age / 250 : Math.max(0, 1 - (age - 1800) / 900);
        if (alpha <= 0) continue;
        const w = ctx!.measureText(chip.text).width + 16;
        const x = Math.min(chip.x + 10, width - w - 8);
        const y = chip.y - 13 - Math.min(6, age / 200);
        ctx!.globalAlpha = alpha * 0.92;
        ctx!.fillStyle = colors.bg;
        ctx!.beginPath();
        ctx!.roundRect(x, y - 10, w, 20, 10);
        ctx!.fill();
        ctx!.strokeStyle = colors[chip.kind];
        ctx!.globalAlpha = alpha * 0.7;
        ctx!.stroke();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = colors[chip.kind];
        ctx!.fillText(chip.text, x + 8, y + 0.5);
      }
      ctx!.globalAlpha = 1;
    }

    function step(now: number) {
      if (!running) return;
      if (now - lastSpawn > 260) spawn(now);
      for (let i = shuttles.length - 1; i >= 0; i--) {
        const s = shuttles[i]!;
        s.x += s.speed * 16;
        weave(s, now);
        if (s.x >= s.to) {
          // No labels in the band under the nav, where they'd sit on the links.
          if (s.row * CELL >= 96) chips.push({ x: s.to * CELL, y: s.row * CELL, text: s.label, kind: s.kind, born: now });
          shuttles.splice(i, 1);
        }
      }
      for (let i = chips.length - 1; i >= 0; i--) if (now - chips[i]!.born > 2800) chips.splice(i, 1);
      draw(now);
      raf = requestAnimationFrame(step);
    }

    function staticCloth() {
      const now = performance.now();
      for (let n = 0; n < 60; n++) {
        const kind = pickKind(rand());
        const row = Math.floor(rand() * rows);
        const from = Math.floor(rand() * cols);
        const span = 6 + Math.floor(rand() * 30);
        for (let c = from; c < Math.min(cols, from + span); c++) {
          born[row * cols + c] = now - rand() * 6000;
          kinds[row * cols + c] = kindIndex.indexOf(kind);
        }
      }
      draw(now);
    }

    readColors();
    resize();

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) staticCloth();
    });
    ro.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      readColors();
      if (reduced) staticCloth();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(([entry]) => {
      const visible = entry?.isIntersecting ?? true;
      if (reduced) return;
      if (visible && !running) {
        running = true;
        raf = requestAnimationFrame(step);
      } else if (!visible) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      running = false;
      staticCloth();
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden="true" />;
}
