import { describe, expect, it } from "vitest";
import {
  assTime,
  clockTime,
  endsSentence,
  isFiller,
  paddedRange,
  parseSrt,
  parseTimestamp,
  parseTranscript,
  parseVtt,
  parseWhisperJson,
  splitSentences,
  srtTime,
  type Word,
} from "../src/index";

const w = (text: string, start: number, end: number): Word => ({ text, start, end });

describe("timestamps", () => {
  it("parses SRT, VTT and clock styles", () => {
    expect(parseTimestamp("01:02:03,456")).toBeCloseTo(3723.456);
    expect(parseTimestamp("02:03.5")).toBeCloseTo(123.5);
    expect(parseTimestamp("1:02:03")).toBe(3723);
    expect(parseTimestamp("42")).toBe(42);
    expect(() => parseTimestamp("soon")).toThrow(/Not a timestamp/);
  });

  it("formats without losing a carried millisecond", () => {
    expect(srtTime(3723.456)).toBe("01:02:03,456");
    expect(srtTime(59.9996)).toBe("00:01:00,000");
    expect(assTime(3723.456)).toBe("1:02:03.46");
    expect(clockTime(0)).toBe("0:00");
    expect(clockTime(245.9)).toBe("4:05");
    expect(clockTime(3723)).toBe("1:02:03");
  });
});

describe("transcripts", () => {
  it("reads SRT with index lines, CRLF and markup", () => {
    const srt = "1\r\n00:00:01,000 --> 00:00:02,500\r\n<i>Hello</i> there.\r\n\r\n2\r\n00:00:03,000 --> 00:00:04,000\r\nSecond {\\an8}line\r\n";
    expect(parseSrt(srt)).toEqual([
      { start: 1, end: 2.5, text: "Hello there." },
      { start: 3, end: 4, text: "Second line" },
    ]);
  });

  it("drops the repeated line in rolling WebVTT captions", () => {
    const vtt = [
      "WEBVTT",
      "Kind: captions",
      "",
      "NOTE made by a tool",
      "",
      "00:00:00.000 --> 00:00:02.000 align:start position:0%",
      "so the first thing",
      "",
      "00:00:02.000 --> 00:00:04.000",
      "so the first thing",
      "<00:00:02.500><c>is</c> the payment",
      "",
    ].join("\n");
    expect(parseVtt(vtt).map((c) => c.text)).toEqual(["so the first thing", "is the payment"]);
  });

  it("keeps measured word times from whisper and flags spread ones", () => {
    const measured = parseWhisperJson({
      language: "en",
      segments: [{ start: 0, end: 1, text: " Hi there.", words: [{ word: " Hi", start: 0, end: 0.4 }, { word: " there.", start: 0.45, end: 1 }] }],
    });
    expect(measured).toMatchObject({ source: "whisper", approximate: false, language: "en" });
    expect(measured.words.map((x) => x.text)).toEqual(["Hi", "there."]);

    const spreadOut = parseWhisperJson({ segments: [{ start: 2, end: 4, text: " No word times here." }] });
    expect(spreadOut.approximate).toBe(true);
    expect(spreadOut.words[0]!.start).toBe(2);
    expect(spreadOut.words.at(-1)!.end).toBeCloseTo(4);
  });

  it("treats whisper.cpp one-word segments as measured", () => {
    const t = parseWhisperJson({
      result: { language: "en" },
      transcription: [
        { offsets: { from: 0, to: 400 }, text: " Hello" },
        { offsets: { from: 450, to: 900 }, text: " world." },
      ],
    });
    expect(t).toMatchObject({ source: "whisper-cpp", approximate: false, language: "en" });
    expect(t.words[1]).toEqual({ text: "world.", start: 0.45, end: 0.9 });
  });

  it("detects the format from the content", () => {
    expect(parseTranscript('{"segments":[]}').source).toBe("whisper");
    expect(parseTranscript("WEBVTT\n\n00:00.000 --> 00:01.000\nhi\n").source).toBe("vtt");
    expect(parseTranscript("1\n00:00:00,000 --> 00:00:01,000\nhi\n").source).toBe("srt");
  });
});

describe("sentences", () => {
  it("ends on punctuation and long pauses, but not on abbreviations or trailing dots", () => {
    expect(endsSentence("done.")).toBe(true);
    expect(endsSentence('right?"')).toBe(true);
    expect(endsSentence("Dr.")).toBe(false);
    expect(endsSentence("so...")).toBe(false);
    const words = [w("Ask", 0, 0.3), w("Dr.", 0.35, 0.6), w("Ada.", 0.65, 1), w("Then", 1.1, 1.3), w("wait", 1.35, 1.6), w("again", 3, 3.4)];
    expect(splitSentences(words).map((s) => s.text)).toEqual(["Ask Dr. Ada.", "Then wait", "again"]);
  });

  it("breaks a run-on at its widest pause", () => {
    const words = Array.from({ length: 40 }, (_, i) => w(`w${i}`, i, i + (i === 12 ? 0.2 : 0.9)));
    const [first] = splitSentences(words, { maxSec: 25 });
    expect(first!.last).toBe(12);
  });

  it("recognises hesitations only", () => {
    expect(isFiller("Um,")).toBe(true);
    expect(isFiller("uh")).toBe(true);
    expect(isFiller("like")).toBe(false);
  });

  it("pads a cut without reaching into the neighbouring words", () => {
    const words = [w("before", 0, 1), w("clip", 1.1, 1.5), w("ends.", 1.6, 2), w("after", 2.1, 2.5)];
    expect(paddedRange(words, 1, 2)).toEqual({ start: 1.05, end: 2.05 });
    expect(paddedRange([w("alone.", 5, 6)], 0, 0, { duration: 6.2 })).toEqual({ start: 4.88, end: 6.2 });
  });
});
