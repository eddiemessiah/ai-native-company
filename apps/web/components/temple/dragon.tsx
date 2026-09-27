"use client";

import { useEffect, useRef, useState } from "react";
import { DragonEngine, readPalette } from "./dragon-engine";

/*
 * How Shonin works, told by a dragon. The pearl is your job; the dragon carries
 * it through four steps. On wide screens the section pins and scrolling moves
 * the pearl from step to step; on phones the steps cycle on their own and a tap
 * picks one. Nothing here follows the pointer or leaves a mark.
 */

const STEPS = [
  {
    n: "一",
    title: "You ask.",
    body: "An agent calls our API, or a business picks an offer or describes the job. Agents need no account; people fill in one short form.",
    color: "var(--fg)",
  },
  {
    n: "二",
    title: "Agents do the work.",
    body: "Language models draft, research and write code. Plain code does the exact parts: counts, dates, payments and records.",
    color: "var(--write)",
  },
  {
    n: "三",
    title: "Every step is checked.",
    body: "Shonin One, our decision brain, routes, scores and approves each step, and logs how sure it is. Below its bar, it stops and asks a person.",
    color: "var(--decide)",
  },
  {
    n: "四",
    title: "A person seals it.",
    body: "Anything with money, legal or reputation attached waits for a person's yes. Then the work is delivered, and every decision stays on the record.",
    color: "var(--human)",
  },
] as const;

const WIDE = "(min-width: 900px)";

export function Dragon() {
  const section = useRef<HTMLElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<DragonEngine | null>(null);
  const redraw = useRef<(() => void) | null>(null);
  const [active, setActive] = useState(0);
  const [wide, setWide] = useState(true);
  const [tapped, setTapped] = useState(0);

  // The canvas engine: sized to its box, repainted on theme changes, paused out of view.
  useEffect(() => {
    const el = canvas.current;
    const box = art.current;
    const host = section.current;
    if (!el || !box || !host) return;
    const wideMq = window.matchMedia(WIDE);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dragon: DragonEngine;
    try {
      dragon = new DragonEngine(el, wideMq.matches ? 84 : 70);
    } catch {
      return;
    }
    engine.current = dragon;

    const size = () => {
      const r = box.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return;
      dragon.resize(r.width, r.height, window.matchMedia(WIDE).matches);
    };
    size();
    dragon.warm(reduce ? 4 : 2.5);
    dragon.draw();

    let raf = 0;
    let last = 0;
    let visible = false;
    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      dragon.step(dt);
      dragon.draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    redraw.current = reduce
      ? () => {
          dragon.warm(2.5);
          dragon.draw();
        }
      : null;

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) start();
        else stop();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(wideMq.matches ? host : box);

    const ro = new ResizeObserver(() => {
      size();
      if (reduce || !raf) dragon.draw();
    });
    ro.observe(box);

    const repaint = () => {
      dragon.palette = readPalette();
      if (reduce || !raf) dragon.draw();
    };
    const mo = new MutationObserver(repaint);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: light)");
    scheme.addEventListener("change", repaint);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    // Kanji on the stations use the page's mincho font; repaint once it has loaded.
    document.fonts
      ?.load('500 20px "Shippori Mincho B1"', "一二三四承")
      .then(repaint)
      .catch(() => {});

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      scheme.removeEventListener("change", repaint);
      document.removeEventListener("visibilitychange", onVis);
      engine.current = null;
      redraw.current = null;
    };
  }, []);

  // Feed the active step to the engine.
  useEffect(() => {
    engine.current?.setActive(active);
    redraw.current?.();
  }, [active]);

  // Wide screens: scroll position inside the pinned section picks the step.
  // Narrow screens: the steps cycle while the dragon is in view.
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const host = section.current;
    const box = art.current;
    if (!host || !box) return;
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      setWide(mq.matches);
      if (mq.matches) {
        let ticking = false;
        const read = () => {
          ticking = false;
          const r = host.getBoundingClientRect();
          const room = r.height - window.innerHeight;
          const progress = room > 0 ? Math.min(1, Math.max(0, -r.top / room)) : 0;
          setActive(Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length)));
        };
        const onScroll = () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(read);
          }
        };
        read();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        cleanup = () => {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        };
      } else {
        let timer = 0;
        const io = new IntersectionObserver(([entry]) => {
          window.clearInterval(timer);
          timer = 0;
          if (entry?.isIntersecting && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            timer = window.setInterval(() => setActive((a) => (a + 1) % STEPS.length), 4200);
          }
        });
        io.observe(box);
        cleanup = () => {
          io.disconnect();
          window.clearInterval(timer);
        };
      }
    };
    setup();
    mq.addEventListener("change", setup);
    return () => {
      mq.removeEventListener("change", setup);
      cleanup();
    };
  }, [tapped]);

  function choose(i: number) {
    const host = section.current;
    if (wide && host) {
      // Scroll to the middle of that step's stretch of the pinned section.
      const room = host.offsetHeight - window.innerHeight;
      const top = host.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + ((i + 0.5) / STEPS.length) * room, behavior: "smooth" });
    } else {
      setActive(i);
      setTapped((n) => n + 1);
    }
  }

  return (
    <section id="how" ref={section} className="t-dragon" aria-labelledby="how-title">
      <div className="t-dragon-pin">
        <div className="t-dragon-sky" aria-hidden="true" />
        <div className="t-fibers" aria-hidden="true" />
        <div className="t-dragon-scrim" aria-hidden="true" />
        <div className="wrap t-dragon-wrap">
          <div className="t-dragon-copy">
            <div className="flex items-center gap-3" aria-hidden="true">
              <span lang="ja" className="t-kanji text-[26px] leading-none text-human">
                龍
              </span>
              <span className="h-px w-8 bg-line-2" />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">ryū · dragon</span>
            </div>
            <p className="label mt-6">How Shonin works</p>
            <h2 id="how-title" className="mt-4 text-[clamp(34px,4.4vw,60px)] font-semibold leading-[0.98]">
              Follow the pearl. <span className="serif text-dim">It&apos;s your job.</span>
            </h2>
            <p className="mt-5 max-w-[34rem] text-[17px] leading-relaxed text-dim">
              Agents are fast, but they can be wrong. So at Shonin, agents do the work, every step is checked, and a person
              approves anything that matters. Four steps, every time:
            </p>
          </div>

          <div ref={art} className="t-dragon-art" aria-hidden="true">
            <canvas ref={canvas} />
          </div>

          <ol className="t-dragon-steps">
            {STEPS.map((s, i) => (
              <li key={s.n}>
                <button
                  type="button"
                  className={`t-step ${i === active ? "on" : ""}`}
                  aria-current={i === active ? "step" : undefined}
                  onClick={() => choose(i)}
                  style={{ "--step": s.color } as React.CSSProperties}
                >
                  <span className="flex items-baseline gap-3">
                    <span lang="ja" className="t-kanji t-step-n" aria-hidden="true">
                      {s.n}
                    </span>
                    <span className="text-[19px] font-semibold tracking-[-0.02em]">{s.title}</span>
                  </span>
                  <span className="t-step-body">{s.body}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="t-dragon-hint font-mono text-[11.5px] text-faint">
            {wide ? "Scroll to move the pearl. Or pick a step." : "Tap a step to move the pearl."}
          </p>
        </div>
      </div>
    </section>
  );
}
