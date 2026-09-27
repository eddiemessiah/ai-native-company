/** Parses 01:02:03,456 · 01:02:03.456 · 02:03.456 · 1:02:03 · 3.5 into seconds. */
export function parseTimestamp(input: string): number {
  const parts = input.trim().replace(",", ".").split(":");
  if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) {
    throw new Error(`Not a timestamp: "${input}"`);
  }
  return parts.reduce((total, p) => total * 60 + Number(p), 0);
}

export function round3(t: number): number {
  return Math.round(t * 1000) / 1000;
}

function clock(t: number, unitsPerSecond: number) {
  const units = Math.max(0, Math.round(t * unitsPerSecond));
  const whole = Math.floor(units / unitsPerSecond);
  return {
    h: Math.floor(whole / 3600),
    m: Math.floor((whole % 3600) / 60),
    s: whole % 60,
    frac: units % unitsPerSecond,
  };
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** 01:02:03,456 */
export function srtTime(t: number): string {
  const c = clock(t, 1000);
  return `${pad(c.h)}:${pad(c.m)}:${pad(c.s)},${pad(c.frac, 3)}`;
}

/** 01:02:03.456 */
export function vttTime(t: number): string {
  return srtTime(t).replace(",", ".");
}

/** 1:02:03.45: ASS counts in centiseconds. */
export function assTime(t: number): string {
  const c = clock(t, 100);
  return `${c.h}:${pad(c.m)}:${pad(c.s)}.${pad(c.frac)}`;
}

/** 0:00 · 4:05 · 1:02:03: the style YouTube reads chapters in. Rounds down, so a chapter never starts after its first word. */
export function clockTime(t: number): string {
  const whole = Math.max(0, Math.floor(t + 1e-6));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** 37s · 1m 05s */
export function shortDuration(seconds: number): string {
  const s = Math.round(seconds);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${pad(s % 60)}s`;
}
