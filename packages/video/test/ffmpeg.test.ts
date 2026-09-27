import { describe, expect, it } from "vitest";
import { Brain, ScriptedProvider } from "@repo/brain";
import {
  beatOffsets,
  clipArgs,
  cropBox,
  fitBox,
  limitArgs,
  limiterFilter,
  parseFfmpegVersion,
  parseLoudnorm,
  parseProbe,
  peakExcess,
  scoreCandidates,
  tightenArgs,
  tightenGraph,
  trailerArgs,
  videoChain,
  type Candidate,
  type SourceInfo,
} from "../src/index";

const hd: SourceInfo = { duration: 600, width: 1920, height: 1080, fps: "30/1", hasAudio: true };

describe("probe", () => {
  it("reads display size after a rotate flag, and skips cover art", () => {
    const info = parseProbe({
      format: { duration: "62.500000" },
      streams: [
        { codec_type: "video", width: 600, height: 600, disposition: { attached_pic: 1 } },
        {
          codec_type: "video",
          width: 1920,
          height: 1080,
          avg_frame_rate: "30000/1001",
          side_data_list: [{ side_data_type: "Display Matrix", rotation: -90 }],
        },
        { codec_type: "audio" },
      ],
    });
    expect(info).toEqual({ duration: 62.5, width: 1080, height: 1920, fps: "30000/1001", hasAudio: true });
  });

  it("falls back to a sane frame rate", () => {
    const info = parseProbe({ format: { duration: "1" }, streams: [{ codec_type: "video", width: 640, height: 360, avg_frame_rate: "0/0", r_frame_rate: "25/1" }] });
    expect(info).toMatchObject({ fps: "25/1", hasAudio: false });
  });

  it("knows which ffmpeg reads option values from files", () => {
    expect(parseFfmpegVersion("ffmpeg version 6.1.1-3ubuntu5 Copyright (c) 2000-2023")).toBe(6);
    expect(parseFfmpegVersion("ffmpeg version n7.1 Copyright")).toBe(7);
    expect(parseFfmpegVersion("ffmpeg version N-117000-g1a2b3c Copyright")).toBe(99);
    expect(tightenArgs("in.mp4", "graph.txt", "out.mp4", { hasAudio: true, ffmpegMajor: 6 })).toContain("-filter_complex_script");
    expect(tightenArgs("in.mp4", "graph.txt", "out.mp4", { hasAudio: true, ffmpegMajor: 7 })).toContain("-/filter_complex");
  });
});

describe("framing", () => {
  it("crops 16:9 to 9:16 around the focus point, in even pixels", () => {
    expect(cropBox(hd, "9x16")).toEqual({ x: 657, y: 0, w: 606, h: 1080 });
    expect(cropBox(hd, "9x16", 0).x).toBe(0);
    expect(cropBox(hd, "9x16", 1).x).toBe(1314);
    expect(cropBox(hd, "1x1")).toEqual({ x: 420, y: 0, w: 1080, h: 1080 });
    expect(cropBox(hd, "16x9")).toEqual({ x: 0, y: 0, w: 1920, h: 1080 });
    expect(cropBox({ width: 1080, height: 1920 }, "9x16")).toEqual({ x: 0, y: 0, w: 1080, h: 1920 });
  });

  it("fits the whole frame over a blurred copy", () => {
    expect(fitBox(hd, "9x16")).toEqual({ w: 1080, h: 606 });
    const chain = videoChain("0:v", "v", { source: hd, format: "9x16", mode: "fit", tag: "t" });
    expect(chain).toContain("boxblur");
    expect(chain).toContain("overlay=(W-w)/2:(H-h)/2");
    expect(chain.endsWith("fps=30/1,format=yuv420p,setsar=1[v]")).toBe(true);
  });
});

describe("render commands", () => {
  it("seeks before decoding, burns captions and levels the audio in one pass", () => {
    const args = clipArgs({
      src: "/footage/ep12.mp4",
      range: { start: 61.2, end: 98.7 },
      frame: { source: hd, format: "9x16", mode: "crop" },
      ass: "clip-01-9x16.ass",
      fontsDir: "fonts",
      loudness: { input_i: "-27.6", input_tp: "-4.5", input_lra: "18", input_thresh: "-39.2", target_offset: "0.6" },
      out: "clip-01-9x16.mp4",
    });
    expect(args.slice(2, 8)).toEqual(["-ss", "61.200", "-t", "37.500", "-i", "/footage/ep12.mp4"]);
    const graph = args[args.indexOf("-filter_complex") + 1]!;
    expect(graph).toContain("crop=606:1080:657:0,scale=1080:1920");
    expect(graph).toContain("[vr]ass=clip-01-9x16.ass:fontsdir=fonts[v]");
    expect(graph).toContain("measured_I=-27.6");
    expect(graph).toContain("linear=true,aresample=48000");
    expect(args.at(-1)).toBe("clip-01-9x16.mp4");
    expect(() => clipArgs({ src: "x", range: { start: 0, end: 1 }, frame: { source: hd, format: "9x16", mode: "crop" }, ass: "bad name:.ass", out: "o.mp4" })).toThrow(
      /plain relative path/,
    );
  });

  it("drops the audio chain for silent sources", () => {
    const args = clipArgs({ src: "x.mp4", range: { start: 0, end: 5 }, frame: { source: { ...hd, hasAudio: false }, format: "1x1", mode: "crop" }, out: "o.mp4" });
    expect(args).toContain("-an");
    expect(args).not.toContain("[a]");
  });

  it("chains crossfades at offsets that account for each overlap", () => {
    expect(beatOffsets([6, 5.2, 5], 0.3)).toEqual([0, 5.7, 10.6]);
    const args = trailerArgs({
      src: "ep.mp4",
      beats: [
        { start: 0, end: 6 },
        { start: 20, end: 25.2 },
        { start: 40, end: 45 },
      ],
      source: hd,
      format: "16x9",
      mode: "crop",
      fade: 0.3,
      out: "trailer.mp4",
    });
    expect(args.filter((a) => a === "-i")).toHaveLength(3);
    const graph = args[args.indexOf("-filter_complex") + 1]!;
    expect(graph).toContain("xfade=transition=fade:duration=0.300:offset=5.700[xv1]");
    expect(graph).toContain("xfade=transition=fade:duration=0.300:offset=10.600[xv2]");
    expect(graph.match(/acrossfade/g)).toHaveLength(2);
  });

  it("joins kept stretches with concat so audio and video stay aligned", () => {
    const graph = tightenGraph(
      [
        { start: 0, end: 1.5 },
        { start: 2.2, end: 9 },
      ],
      { hasAudio: true, fps: "30/1" },
    );
    expect(graph).toContain("[0:v]split=2[sv0][sv1]");
    expect(graph).toContain("[0:a]asplit=2[sa0][sa1]");
    expect(graph).toContain("[v0][a0][v1][a1]concat=n=2:v=1:a=1[vc][a]");
    expect(graph).toContain("[vc]fps=30/1,format=yuv420p[v]");
  });

  it("reads loudnorm's measurement and ignores silence", () => {
    const stderr = `[Parsed_loudnorm_0 @ 0x55]\n{\n\t"input_i" : "-27.61",\n\t"input_tp" : "-4.47",\n\t"input_lra" : "18.06",\n\t"input_thresh" : "-39.20",\n\t"output_i" : "-16.58",\n\t"normalization_type" : "dynamic",\n\t"target_offset" : "0.58"\n}\n`;
    expect(parseLoudnorm(stderr)).toEqual({ input_i: "-27.61", input_tp: "-4.47", input_lra: "18.06", input_thresh: "-39.20", target_offset: "0.58" });
    expect(parseLoudnorm(stderr.replace('"-27.61"', '"-inf"'))).toBeNull();
    expect(parseLoudnorm("no json here")).toBeNull();
  });

  it("limits the peaks first when one linear gain to -14 LUFS would pass the ceiling", () => {
    const kokoro = { input_i: "-22.70", input_tp: "-0.40", input_lra: "3.1", input_thresh: "-33.0", target_offset: "0.1" };
    // +8.7 dB of gain would put peaks at +8.3 dBTP against a -2 dBTP ceiling: 10.3 dB too many.
    expect(peakExcess(kokoro)).toBeCloseTo(10.3, 5);
    // Peaks go to -0.4 - 10.3 - 1 = -11.7 dBFS, a linear 0.2600.
    expect(limiterFilter(kokoro, peakExcess(kokoro))).toBe("alimiter=limit=0.2600:attack=2:release=80:level=false");
    const quiet = { ...kokoro, input_i: "-20.00", input_tp: "-9.00" };
    expect(peakExcess(quiet)).toBeLessThanOrEqual(0);
    const args = limitArgs("short.raw.mp4", kokoro, "short.limited-1.mkv");
    expect(args).toEqual(expect.arrayContaining(["-c:v", "copy", "-c:a", "pcm_f32le"]));
    expect(args.at(-1)).toBe("short.limited-1.mkv");
    // The limiter never asks for less than -24 dBFS, alimiter's floor.
    expect(limiterFilter({ ...kokoro, input_tp: "-20" }, 10)).toContain("limit=0.0631");
  });
});

describe("scoring", () => {
  const candidates: Candidate[] = Array.from({ length: 10 }, (_, id) => ({ id, first: id, last: id, start: id * 30, end: id * 30 + 25, text: `moment ${id}` }));
  const sentences = candidates.map((c) => ({ index: c.id, first: c.id, last: c.id, start: c.start, end: c.end, text: c.text }));
  const strong = {
    hook: { type: "score", score: 2.6, level: 3, probabilities: [0.05, 0.05, 0.2, 0.7], confidence: 0.9 },
    payoff: { type: "score", score: 2.2, level: 2, probabilities: [0.05, 0.1, 0.45, 0.4], confidence: 0.85 },
    standalone: { type: "noul", noul: 0.9 },
    kind: { type: "choice", choice: "insight", probabilities: { insight: 0.9, other: 0.1 }, confidence: 0.9 },
    sensitive: { type: "noul", noul: 0.05 },
    private_info: { type: "noul", noul: 0.01 },
  };

  it("scores every candidate through the clip recipe", async () => {
    const brain = new Brain({ providers: [new ScriptedProvider(() => strong, "jev")], sinks: [] });
    const { scored, failed } = await scoreCandidates(brain, candidates, sentences, { recording: "Test", job: "t", concurrency: 3 });
    expect(failed).toBe(0);
    expect(scored).toHaveLength(10);
    expect(scored.every((s) => s.route.verdict === "keep" && s.provider === "jev")).toBe(true);
  });

  it("stops after five failures in a row", async () => {
    const down = new ScriptedProvider(() => {
      throw new Error("503 from provider");
    }, "jev");
    const brain = new Brain({ providers: [down], sinks: [] });
    await expect(scoreCandidates(brain, candidates, sentences, { recording: "Test", job: "t", concurrency: 2 })).rejects.toThrow(
      /Stopped after 5 failed decisions/,
    );
  });
});
