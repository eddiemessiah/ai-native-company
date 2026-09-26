"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/lib/site";
import { Wordmark } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Nav({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-500 ${
          scrolled ? "border-b border-line bg-bg/75 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <div className="wrap flex h-16 items-center justify-between gap-6">
          <Link href="/" aria-label={`${name} home`} className="shrink-0">
            <Wordmark name={name} />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-2 font-mono text-[12.5px] tracking-[0.02em] transition-colors ${
                    active ? "text-fg" : "text-dim hover:text-fg"
                  }`}
                >
                  {active && <span className="dot mr-2 bg-decide align-middle" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/start" className="btn btn-solid hidden h-9 sm:inline-flex">
              Start a job
            </Link>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-line-2 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 h-px w-4 bg-fg transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`}
                />
                <span
                  className={`absolute left-0 h-px w-4 bg-fg transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-bg/95 px-6 backdrop-blur-xl transition-opacity duration-500 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {[...nav, { href: "/start", label: "Start a job" }].map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-baseline gap-4 py-2 text-[clamp(30px,9vw,44px)] font-medium tracking-[-0.04em] transition-all duration-500"
              style={{ transitionDelay: open ? `${60 + i * 45}ms` : "0ms", transform: open ? "none" : "translateY(14px)", opacity: open ? 1 : 0 }}
            >
              <span className="font-mono text-xs text-faint">0{i + 1}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
