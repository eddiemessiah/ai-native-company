import { clockTime } from "./time";
import type { Sentence } from "./types";

export interface Chapter {
  readonly start: number;
  readonly title: string;
}

/**
 * YouTube only shows chapters when the first starts at 0:00, there are at
 * least three, and each runs at least 10 seconds (research/video-editing.md).
 * Code checks these; a model never counts them.
 */
export function chapterProblems(chapters: readonly Chapter[], duration: number): string[] {
  const problems: string[] = [];
  if (chapters.length < 3) problems.push(`YouTube needs at least 3 chapters (got ${chapters.length})`);
  if (chapters[0] && chapters[0].start !== 0) problems.push(`The first chapter must start at 0:00 (starts at ${clockTime(chapters[0].start)})`);
  chapters.forEach((c, i) => {
    if (!c.title.trim()) problems.push(`Chapter ${i + 1} has no title`);
    const next = chapters[i + 1];
    if (next && next.start <= c.start) problems.push(`Chapter ${i + 2} starts before chapter ${i + 1} ends`);
    const length = (next ? next.start : duration) - c.start;
    if (length < 10) problems.push(`Chapter ${i + 1} "${c.title}" runs ${length.toFixed(1)}s; YouTube needs 10s or more`);
  });
  return problems;
}

/** Moves each chapter (after the first) to the nearest sentence start, so no chapter begins mid-sentence. */
export function snapChapters(chapters: readonly Chapter[], sentences: readonly Sentence[]): Chapter[] {
  return chapters.map((c, i) => {
    if (i === 0 || sentences.length === 0) return { ...c, start: i === 0 ? 0 : c.start };
    let best = sentences[0]!.start;
    for (const s of sentences) if (Math.abs(s.start - c.start) < Math.abs(best - c.start)) best = s.start;
    return { ...c, start: best };
  });
}

/** The block to paste into a YouTube description. */
export function formatChapters(chapters: readonly Chapter[]): string {
  return chapters.map((c) => `${clockTime(c.start)} ${c.title.trim()}`).join("\n");
}
