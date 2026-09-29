import { describe, expect, it } from "vitest";
import {
  buildAss,
  buildCandidates,
  buildSrt,
  captionStyle,
  chapterProblems,
  chunkWords,
  cutIntervals,
  formatChapters,
  keepIntervals,
  parseFreezes,
  parseSilences,
  remap,
  remapWords,
  sampleEvenly,
  selectClips,
  snapChapters,
  SOCIAL_CHUNKS,
  SUBTITLE_CHUNKS,
  subtract,
  trailerBeats,
  type Sentence,
  type Word,
} from "../src/index";

const w = (text: string, start: number, end: number): Word => ({ text, start, end });
const sentence = (index: number, start: number, end: number, text = `s${index}`): Sentence => ({
  index,
  first: index,
  last: index,
  start,
  end,
  text,
});

describe("candidates", () => {
  it("builds whole-sentence windows inside the length limits", () => {
    const sentences = Array.from({ length: 10 }, (_, i) => sentence(i, i * 10, i * 10 + 10));
    const cands = buildCandidates(sentences, { minSec: 15, maxSec: 60 });
    expect(cands[0]).toMatchObject({ first: 0, last: 1, start: 0, end: 20 });
    for (const c of cands) {
      expect(c.end - c.start).toBeGreaterThanOrEqual(15);
      expect(c.end - c.start).toBeLessThanOrEqual(60);
    }
    expect(new Set(cands.map((c) => `${c.first}-${c.last}`)).size).toBe(cands.length);
  });

  it("spaces starting sentences by the stride and caps the total evenly", () => {
    const sentences = Array.from({ length: 30 }, (_, i) => sentence(i, i * 3, i * 3 + 3));
    const starts = [...new Set(buildCandidates(sentences, { minSec: 15, maxSec: 30, strideSec: 8 }).map((c) => c.start))];
    expect(starts.slice(0, 3)).toEqual([0, 9, 18]);
    expect(sampleEvenly([1, 2, 3, 4, 5, 6], 3)).toEqual([1, 3, 5]);
  });
});

describe("selection", () => {
  it("takes the best clips that don't overlap and skips drops", () => {
    const scored = [
      { id: "a", start: 0, end: 30, rank: 90, verdict: "keep" as const },
      { id: "b", start: 20, end: 50, rank: 85, verdict: "keep" as const },
      { id: "c", start: 60, end: 80, rank: 70, verdict: "review" as const },
      { id: "d", start: 100, end: 120, rank: 95, verdict: "drop" as const },
    ];
    expect(selectClips(scored, { count: 5 }).map((s) => s.id)).toEqual(["a", "c"]);
    expect(selectClips(scored, { count: 1 }).map((s) => s.id)).toEqual(["a"]);
  });

  it("builds trailer beats from whole opening sentences within the length", () => {
    const sentences = [sentence(0, 0, 3), sentence(1, 3.2, 6), sentence(2, 6.2, 14), sentence(3, 20, 25), sentence(4, 25.2, 30)];
    const clips = [
      { n: 1, start: 0, end: 14 },
      { n: 2, start: 20, end: 30 },
    ];
    expect(trailerBeats(clips, sentences, { seconds: 45 })).toEqual([
      { clip: 1, first: 0, last: 1 },
      { clip: 2, first: 3, last: 3 },
    ]);
    expect(trailerBeats(clips, sentences, { seconds: 8 })).toHaveLength(1);
  });
});

describe("tightening", () => {
  it("reads silencedetect and freezedetect output", () => {
    const silence = [
      "[silencedetect @ 0x5] silence_start: 1.5",
      "[silencedetect @ 0x5] silence_end: 3.25 | silence_duration: 1.75",
      "[silencedetect @ 0x5] silence_start: 9.8",
    ].join("\n");
    expect(parseSilences(silence, 12)).toEqual([
      { start: 1.5, end: 3.25 },
      { start: 9.8, end: 12 },
    ]);
    const freeze = "[freezedetect @ 0x5] lavfi.freezedetect.freeze_start: 2\n[freezedetect @ 0x5] lavfi.freezedetect.freeze_duration: 3\n[freezedetect @ 0x5] lavfi.freezedetect.freeze_end: 5";
    expect(parseFreezes(freeze, 10)).toEqual([{ start: 2, end: 5 }]);
  });

  const words = [w("a", 0, 0.5), w("um", 0.6, 0.8), w("b", 0.9, 1.4), w("c", 3, 3.5)];
  const silences = [{ start: 1.4, end: 3 }];

  it("shortens long pauses, cuts fillers, and never cuts a spoken word", () => {
    expect(cutIntervals({ silences, words, fillers: true })).toEqual([
      { start: 0.55, end: 0.85 },
      { start: 1.525, end: 2.875 },
    ]);
    expect(cutIntervals({ silences, words })).toEqual([{ start: 1.525, end: 2.875 }]);
    const loud = cutIntervals({ silences: [{ start: 0, end: 3.5 }], words });
    expect(subtract(loud, words)).toEqual(loud);
  });

  it("only cuts where the picture is still in screen mode", () => {
    expect(cutIntervals({ silences, words, still: [{ start: 2, end: 5 }] })).toEqual([{ start: 2, end: 2.875 }]);
  });

  it("keeps the complement on frame boundaries and maps times onto the new cut", () => {
    const keeps = keepIntervals(4, [{ start: 0.55, end: 0.85 }, { start: 1.525, end: 2.875 }], { fps: 30 });
    expect(keeps).toEqual([
      { start: 0, end: 0.567 },
      { start: 0.867, end: 1.533 },
      { start: 2.867, end: 4 },
    ]);
    expect(remap(0.2, keeps)).toBe(0.2);
    expect(remap(0.7, keeps)).toBe(0.567);
    expect(remap(3, keeps)).toBeCloseTo(0.567 + 0.666 + 0.133, 3);
    expect(remapWords(words, keeps).map((x) => x.text)).toEqual(["a", "b", "c"]);
  });
});

describe("captions", () => {
  const words = [w("Here's", 0, 0.3), w("the", 0.3, 0.45), w("thing:", 0.45, 0.9), w("x402", 1, 1.5), w("settles.", 1.5, 2.1)];

  it("chunks a few words at a time and bridges short gaps", () => {
    const chunks = chunkWords(words, SOCIAL_CHUNKS);
    expect(chunks.map((c) => c.words.map((x) => x.text).join(" "))).toEqual(["Here's the thing:", "x402 settles."]);
    expect(chunks[0]).toMatchObject({ start: 0, end: 1 });
  });

  it("writes one ASS event per word with the spoken word highlighted", () => {
    const ass = buildAss(chunkWords(words, SOCIAL_CHUNKS), captionStyle("9x16"), { title: { text: "Ep. 12", start: 0, end: 2 } });
    const events = ass.split("\n").filter((l) => l.startsWith("Dialogue: 0,"));
    expect(events).toHaveLength(5);
    expect(events[0]).toBe("Dialogue: 0,0:00:00.00,0:00:00.30,Caption,,0,0,0,,{\\1c&H00B0FF&}Here's{\\1c&HFFFFFF&} the thing:");
    expect(ass).toContain("PlayResY: 1920");
    expect(ass).toContain("Dialogue: 1,0:00:00.00,0:00:02.00,Title,,0,0,0,,Ep. 12");
  });

  it("writes SubRip with two lines of at most 42 characters", () => {
    expect(buildSrt(chunkWords(words, SUBTITLE_CHUNKS))).toBe("1\n00:00:00,000 --> 00:00:02,100\nHere's the thing: x402 settles.\n");
    const long = "This sentence is long enough that it has to wrap onto a second line.".split(" ").map((t, i) => w(t, i * 0.3, i * 0.3 + 0.25));
    const [cue] = buildSrt(chunkWords(long, SUBTITLE_CHUNKS)).split("\n\n");
    const lines = cue!.split("\n").slice(2).filter(Boolean);
    expect(lines).toHaveLength(2);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(42);
  });
});

describe("chapters", () => {
  it("applies YouTube's rules in code", () => {
    expect(chapterProblems([{ start: 0, title: "Intro" }, { start: 12, title: "Why" }, { start: 30, title: "How" }], 60)).toEqual([]);
    const bad = chapterProblems([{ start: 5, title: "Late" }], 60);
    expect(bad.join(" ")).toMatch(/at least 3/);
    expect(bad.join(" ")).toMatch(/must start at 0:00/);
    expect(chapterProblems([{ start: 0, title: "A" }, { start: 8, title: "B" }, { start: 30, title: "C" }], 60)[0]).toMatch(/runs 8.0s/);
  });

  it("snaps to sentence starts and formats for the description", () => {
    const sentences = [sentence(0, 0, 11), sentence(1, 11.2, 29), sentence(2, 29.7, 60)];
    const snapped = snapChapters([{ start: 0, title: "Intro" }, { start: 12, title: "Why" }, { start: 30, title: "How" }], sentences);
    expect(snapped.map((c) => c.start)).toEqual([0, 11.2, 29.7]);
    expect(formatChapters(snapped)).toBe("0:00 Intro\n0:11 Why\n0:29 How");
  });
});
