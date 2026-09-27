import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import {
  captionWords,
  checkScript,
  concatList,
  finalArgs,
  forSpeech,
  mix,
  normalizeText,
  numbersIn,
  parseVoice,
  pickLocal,
  pickPexels,
  renderBrief,
  speechRequest,
  shortLength,
  timeline,
  toScript,
  voiceArgs,
  voiceCommand,
  writeScript,
  type ShortScript,
} from "../src/index";
import { titleOf } from "../src/short/cli";

const source =
  "The request becomes the transaction. **`withX402` only settles if your handler answers below 400.** " +
  "The hosted facilitator charges about $0.001 per settlement after free credits.";
const sources = new Map([["post", source]]);

function script(over: Partial<ShortScript> = {}): ShortScript {
  const beat = (narration: string, onscreen: string, quote?: string) => ({
    narration,
    onscreen,
    visual: { kind: "brand" as const },
    claims: quote ? [{ text: narration, source: "post", quote }] : [],
  });
  return {
    version: 1,
    title: "x402 on Celo",
    post: "Agents pay per call.",
    sources: [{ id: "post", title: "x402 on Celo" }],
    beats: [
      beat("The request becomes the transaction, one call at a time.", "The request is the payment", "The request becomes the transaction."),
      beat("A handler that answers below 400 settles; an error never does.", "Errors are never charged", "withX402 only settles if your handler answers below 400."),
      beat("Settlement costs about $0.001 each, so price every call with some room.", "Price with room", "charges about $0.001 per settlement"),
      beat("That is the whole trick, and it works on any route you already serve today.", "Follow for part two"),
    ],
    ...over,
  };
}

describe("script checks", () => {
  it("passes a sourced script and estimates its length at 2.5 words a second", () => {
    const report = checkScript(script(), sources, { minSec: 10, maxSec: 60 });
    expect(report.problems).toEqual([]);
    expect(report.estimatedSeconds).toBeCloseTo(report.words / 2.5, 1);
  });

  it("finds quotes through markdown and curly quotes, but not paraphrases", () => {
    expect(normalizeText("**`withX402` only settles**")).toBe("withx402 only settles");
    expect(normalizeText("it\u2019s \u201cfine\u201d")).toBe('it\'s "fine"');
    const bad = script();
    const edited = { ...bad, beats: [{ ...bad.beats[0]!, claims: [{ text: "x", source: "post", quote: "The request turns into the transaction." }] }, ...bad.beats.slice(1)] };
    expect(checkScript(edited, sources, { minSec: 10, maxSec: 60 }).problems[0]).toMatch(/not in post word for word/);
  });

  it("rejects a number no quote backs, an unknown source and oversized text", () => {
    const s = script();
    const beats = [...s.beats];
    beats[3] = { ...beats[3]!, narration: "It works on 1,700 routes already, and on any route you already serve today." };
    beats[1] = { ...beats[1]!, claims: [{ text: "x", source: "blog", quote: "anything" }] };
    beats[0] = { ...beats[0]!, onscreen: "This headline is far too long to read" };
    const problems = checkScript({ ...s, beats }, sources, { minSec: 10, maxSec: 60 }).problems.join("\n");
    expect(problems).toMatch(/Beat 4 says 1700/);
    expect(problems).toMatch(/cites "blog"/);
    expect(problems).toMatch(/Beat 1: on-screen text is 8 words/);
  });

  it("checks length, title and post in code", () => {
    const long = checkScript({ ...script(), title: "t".repeat(101), post: "p".repeat(281) }, sources, { minSec: 45, maxSec: 60 });
    expect(long.problems.join("\n")).toMatch(/aim for 45–60s/);
    expect(long.problems.join("\n")).toMatch(/YouTube allows 100/);
    expect(long.problems.join("\n")).toMatch(/X allows 280/);
  });

  it("reads numbers the way people write them, and leaves names alone", () => {
    expect(numbersIn("1,700 emails for $0.18, about 42% off, 3.0 times")).toEqual(["1700", "0.18", "42", "3"]);
    expect(numbersIn("x402 on web3 with ERC-8004 v2 is 3x faster")).toEqual(["3"]);
  });

  it("changes only what the voice hears", () => {
    expect(forSpeech("x402 settles in USDC; x4021 stays")).toBe("x four oh two settles in U S D C; x4021 stays");
    expect(forSpeech("Price at $0.01 or more", { "$0.01": "one cent" })).toBe("Price at one cent or more");
  });
});

describe("voices", () => {
  it("parses providers and builds each command", () => {
    expect(parseVoice("edge")).toEqual({ provider: "edge", voice: "en-NG-EzinneNeural" });
    expect(parseVoice("edge:en-NG-AbeoNeural").voice).toBe("en-NG-AbeoNeural");
    expect(() => parseVoice("siri")).toThrow(/Unknown voice/);
    expect(voiceCommand(parseVoice("edge"), "Hi", "a.mp3")).toEqual({
      cmd: "edge-tts",
      args: ["--voice", "en-NG-EzinneNeural", "--text", "Hi", "--write-media", "a.mp3"],
    });
    expect(voiceCommand(parseVoice("pico"), "Hi", "a.wav")?.cmd).toBe("pico2wave");
    expect(voiceCommand(parseVoice("openai:ash"), "Hi", "a.wav")).toBeNull();
    expect(() => parseVoice("elevenlabs")).toThrow(/needs a voice id/);
  });

  it("builds licensed API requests without touching the network", () => {
    const azure = speechRequest(parseVoice("azure"), "Fees & gas <1 cent>", { AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "westeurope" });
    expect(azure.url).toBe("https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1");
    expect(azure.init.body).toBe('<speak version="1.0" xml:lang="en-NG"><voice name="en-NG-EzinneNeural">Fees &amp; gas &lt;1 cent&gt;</voice></speak>');
    const eleven = speechRequest(parseVoice("elevenlabs:abc123"), "Hi", { ELEVENLABS_API_KEY: "k" });
    expect(eleven.url).toContain("/v1/text-to-speech/abc123?output_format=mp3_44100_128");
    expect(JSON.parse(String(speechRequest(parseVoice("openai:ash"), "Hi", { OPENAI_API_KEY: "k" }).init.body))).toMatchObject({ voice: "ash", input: "Hi" });
    expect(() => speechRequest(parseVoice("azure"), "Hi", {})).toThrow(/needs AZURE_SPEECH_REGION/);
  });
});

describe("visuals", () => {
  it("blends brand colours", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#0b0b0a", "#ffb000", 0)).toBe("#0b0b0a");
  });

  it("picks the client's own footage by file name, unused first", () => {
    const files = ["/f/crowd-lagos.mp4", "/f/laptop-code.mp4", "/f/stage.jpg"];
    expect(pickLocal(files, "code on a laptop", new Set())).toBe("/f/laptop-code.mp4");
    expect(pickLocal(files, "code on a laptop", new Set(["/f/laptop-code.mp4"]))).toBe("/f/crowd-lagos.mp4");
    expect(pickLocal([], "x", new Set())).toBeNull();
  });

  it("picks the first portrait Pexels clip long enough, at the size closest to 1080×1920", () => {
    const fixture = {
      videos: [
        { id: 1, duration: 20, url: "p1", user: { name: "A", url: "u" }, video_files: [{ file_type: "video/mp4", width: 1920, height: 1080, link: "landscape" }] },
        { id: 2, duration: 2, url: "p2", user: { name: "B", url: "u" }, video_files: [{ file_type: "video/mp4", width: 1080, height: 1920, link: "short" }] },
        {
          id: 3,
          duration: 12,
          url: "https://www.pexels.com/video/laptop-3/",
          user: { name: "C", url: "https://www.pexels.com/@c" },
          video_files: [
            { file_type: "video/mp4", width: 720, height: 1280, link: "sd" },
            { file_type: "video/mp4", width: 1080, height: 1920, link: "hd" },
            { file_type: "video/mp4", width: 2160, height: 3840, link: "uhd" },
          ],
        },
      ],
    };
    expect(pickPexels(fixture, 6)).toMatchObject({ id: 3, link: "hd", author: "C", height: 1920 });
    expect(pickPexels({ videos: [] }, 6)).toBeNull();
  });
});

describe("assembly", () => {
  it("lays beats on whole frames so picture and voice never drift", () => {
    const beats = timeline([2.01, 3.337, 1.5], { gap: 0.25, tail: 0.8 });
    for (const b of beats) {
      expect(Math.abs(b.length * 30 - Math.round(b.length * 30))).toBeLessThan(0.02);
      expect(b.length).toBeGreaterThanOrEqual(b.voice + (b.index === 2 ? 0.8 : 0.25) - 1e-6);
    }
    expect(beats[1]!.start).toBeCloseTo(beats[0]!.length, 3);
    expect(shortLength(beats)).toBeCloseTo(beats.reduce((s, b) => s + b.length, 0), 3);
    const words = captionWords(["one two", "three four five", "six"], beats);
    expect(words).toHaveLength(6);
    expect(words[2]!.start).toBeCloseTo(beats[1]!.start, 3);
    expect(words[4]!.end).toBeLessThanOrEqual(beats[1]!.start + beats[1]!.voice + 1e-6);
  });

  it("pads each beat's voice to its length and joins them", () => {
    const beats = timeline([2, 3]);
    const args = voiceArgs(["a.wav", "b.wav"], beats, "voice.wav");
    const graph = args[args.indexOf("-filter_complex") + 1]!;
    expect(graph).toContain(`[0:a]apad=whole_dur=${beats[0]!.length.toFixed(3)}[p0]`);
    expect(graph).toContain("[p0][p1]concat=n=2:v=0:a=1[a]");
    expect(concatList(["beat-01.mp4", "it's.mp4"])).toBe("file 'beat-01.mp4'\nfile 'it'\\''s.mp4'\n");
  });

  it("ducks music under the voice only when there is music", () => {
    const base = { visual: "v.mp4", voice: "voice.wav", total: 12.5, ass: "short.ass", fontsDir: "fonts", out: "o.mp4" };
    const plain = finalArgs(base);
    expect(plain.join(" ")).not.toContain("sidechaincompress");
    expect(plain[plain.indexOf("-filter_complex") + 1]).toContain("overlay=x='-w+w*t/12.500'");
    const withMusic = finalArgs({ ...base, music: "bed.mp3" });
    expect(withMusic).toContain("-stream_loop");
    expect(withMusic[withMusic.indexOf("-filter_complex") + 1]).toContain("[m][sc]sidechaincompress");
  });
});

describe("writer", () => {
  const briefSources = [{ id: "post", title: "x402 on Celo", text: source }];

  it("gives the writer the rules, the word budget and the sources", () => {
    const brief = renderBrief({ topic: "x402", audience: "builders", minSec: 30, maxSec: 50, visuals: "stock" }, briefSources);
    expect(brief).toContain("75–125 words");
    expect(brief).toContain("### post: x402 on Celo");
    expect(brief).toContain(source);
    expect(brief).toContain('"kind": "stock"');
  });

  it("maps the writer's JSON to a script with the job's own source list", () => {
    const s = toScript(
      { title: "T", post: "P", beats: [{ narration: "n", onscreen: "o", visual: { kind: "brand", query: "" }, claims: [] }] },
      briefSources,
    );
    expect(s).toMatchObject({ version: 1, title: "T", sources: [{ id: "post", title: "x402 on Celo" }] });
    expect(s.beats[0]!.visual).toEqual({ kind: "brand" });
    expect(() => toScript({ title: "T" }, briefSources)).toThrow(/missing title, post or beats/);
  });

  it("asks Claude for structured output with refusal fallbacks, and refuses to guess on a refusal", async () => {
    let request: Record<string, unknown> = {};
    const reply = (stop_reason: string) =>
      ({
        beta: {
          messages: {
            create: async (body: Record<string, unknown>) => {
              request = body;
              return {
                stop_reason,
                model: "claude-opus-5",
                usage: { input_tokens: 900, output_tokens: 300 },
                content: [{ type: "text", text: JSON.stringify({ title: "T", post: "P", beats: [] }) }],
              };
            },
          },
        },
      }) as unknown as Anthropic;
    const { script: written, model } = await writeScript("brief", briefSources, { client: reply("end_turn") });
    expect(model).toBe("claude-opus-5");
    expect(written.title).toBe("T");
    expect(request).toMatchObject({ model: "claude-opus-5", fallbacks: "default", betas: ["server-side-fallback-2026-07-01"] });
    expect((request.output_config as { format: { type: string } }).format.type).toBe("json_schema");
    await expect(writeScript("brief", briefSources, { client: reply("refusal") })).rejects.toThrow(/declined/);
  });

  it("titles a source from its front matter, then its first heading", () => {
    expect(titleOf("---\ntitle: Selling to agents\ndate: 2026-09-23\n---\n# Other", "f")).toBe("Selling to agents");
    expect(titleOf("# A heading\ntext", "f")).toBe("A heading");
    expect(titleOf("plain", "fallback")).toBe("fallback");
  });
});
