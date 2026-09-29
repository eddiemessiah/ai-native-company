import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BANDS,
  captionStyle,
  checkScript,
  conformArgs,
  fitSize,
  fontFaceCss,
  highlightCode,
  playwrightHeadlessShell,
  RESERVED,
  SCENE_LIMITS,
  SCRIPT_SCHEMA,
  sceneEnv,
  sceneFrames,
  sceneHtml,
  sceneProblems,
  sceneRenderArgs,
  sceneText,
  toScript,
  zoneArgs,
  type SceneVisual,
  type ShortScript,
} from "../src/index";

const number: SceneVisual = { kind: "scene", template: "number", data: { value: "$0.001", label: "per settlement", kicker: "after free credits" } };
const code: SceneVisual = { kind: "scene", template: "code", data: { lines: ["export const POST = paid(", '  "lead-score",', ");"], highlight: 2 } };
const diagram: SceneVisual = { kind: "scene", template: "diagram", data: { nodes: ["Agent", "Your API", "Facilitator"], edges: ["pays", "settles"] } };
const headline: SceneVisual = { kind: "scene", template: "headline", data: { kicker: "x402 on Celo", lines: ["No accounts.", "No API keys."] } };
const render = { seconds: 5.2, accent: "#ffb000", fontCss: "@font-face { font-family: 'Bricolage Grotesque Variable'; src: url(fonts/b.woff2); }" };

describe("scene data", () => {
  it("accepts data within every template's limits", () => {
    for (const v of [number, code, diagram, headline]) expect(sceneProblems(v), v.template).toEqual([]);
  });

  it("names each broken limit in the writer's terms", () => {
    const problems = (v: unknown) => sceneProblems(v as SceneVisual).join("\n");
    expect(problems({ kind: "scene", template: "number", data: { value: "a lot", label: "x" } })).toMatch(/value has no digit/);
    expect(problems({ kind: "scene", template: "number", data: { value: "$0.001", label: "p".repeat(SCENE_LIMITS.label + 1) } })).toMatch(/label is 37 characters; keep it to 36/);
    expect(problems({ kind: "scene", template: "headline", data: { lines: ["a", "b", "c", "d"] } })).toMatch(/use 1 to 3 lines \(got 4\)/);
    expect(problems({ kind: "scene", template: "headline", data: { lines: ["one\ntwo"] } })).toMatch(/line 1 has a line break/);
    expect(problems({ kind: "scene", template: "code", data: { lines: ["x".repeat(37)], highlight: 2 } })).toMatch(/code line 1 is 37 characters[\s\S]*highlight is a line number from 1 to 1/);
    expect(problems({ kind: "scene", template: "code", data: { lines: ["\tx".padEnd(36, "x")] } })).toMatch(/code line 1 is 37 characters/);
    expect(problems({ kind: "scene", template: "diagram", data: { nodes: ["A", "B", "C"], edges: ["one"] } })).toMatch(/give 2 arrow labels/);
    expect(problems({ kind: "scene", template: "diagram", data: { nodes: ["A"], kicker: "k".repeat(37) } })).toMatch(/use 2 or 3 nodes[\s\S]*kicker is 37 characters/);
    expect(problems({ kind: "scene", template: "chart", data: {} })).toMatch(/unknown template "chart"/);
  });

  it("lists every shown string for the number check, except code", () => {
    expect(sceneText(number)).toEqual(["after free credits", "$0.001", "per settlement"]);
    expect(sceneText(diagram)).toEqual(["Agent", "Your API", "Facilitator", "pays", "settles"]);
    expect(sceneText(code)).toEqual([]);
  });
});

describe("script checks for scenes", () => {
  const source = 'The hosted facilitator charges about $0.001 per settlement.\n\n```ts\nexport const POST = paid(\n  "lead-score",\n);\n```';
  const sources = new Map([["post", source]]);
  const script = (visual: SceneVisual, quote?: string): ShortScript => ({
    version: 1,
    title: "t",
    post: "p. Voiced with AI.",
    sources: [{ id: "post", title: "Post" }],
    beats: [
      { narration: "One two three four five six.", onscreen: "One", visual: { kind: "brand" } },
      { narration: "Settlement is cheap.", onscreen: "Two", visual, claims: quote ? [{ text: "Settlement is cheap.", source: "post", quote }] : [] },
      { narration: "Seven eight nine ten eleven.", onscreen: "Three", visual: { kind: "brand" } },
    ],
  });
  const limits = { minSec: 1, maxSec: 60 };

  it("holds a figure on screen to the rule for a figure said aloud", () => {
    expect(checkScript(script(number), sources, limits).problems).toEqual(["Beat 2: the scene shows 0.001, but none of its quotes contains it"]);
    expect(checkScript(script(number, "charges about $0.001 per settlement"), sources, limits).problems).toEqual([]);
  });

  it("shows only code a source contains", () => {
    expect(checkScript(script(code), sources, limits).problems).toEqual([]);
    const invented: SceneVisual = { kind: "scene", template: "code", data: { lines: ["export const POST = paid(", "  retry: 3,"] } };
    expect(checkScript(script(invented), sources, limits).problems).toEqual(['Beat 2: the code line "retry: 3," isn\'t in any source; show code the sources contain']);
  });

  it("reports malformed scene data instead of throwing", () => {
    const broken = [
      { kind: "scene", template: "headline" },
      { kind: "scene", template: "diagram", data: { kicker: "k" } },
      { kind: "scene", template: "code", data: {} },
    ] as unknown as SceneVisual[];
    const report = checkScript(script(broken[0]!), sources, limits);
    expect(report.problems).toEqual(["Beat 2: headline scene: data is missing"]);
    expect(checkScript(script(broken[1]!), sources, limits).problems).toEqual(["Beat 2: diagram scene: use 2 or 3 nodes (got 0)"]);
    expect(checkScript(script(broken[2]!), sources, limits).problems).toEqual(["Beat 2: code scene: use 1 to 6 lines of code (got 0)"]);
    const unknown = toScript(
      { title: "T", post: "P", beats: [{ narration: "n", onscreen: "o", visual: { kind: "scene", template: "chart", data: {} }, claims: [] }] },
      [{ id: "post", title: "Post", text: "" }],
    );
    expect(unknown.beats[0]!.visual).toEqual({ kind: "scene", template: "chart", data: {} });
  });

  it("passes scene problems through with the beat and template", () => {
    const bad: SceneVisual = { kind: "scene", template: "diagram", data: { nodes: ["Agent"] } };
    expect(checkScript(script(bad), sources, limits).problems).toEqual(["Beat 2: diagram scene: use 2 or 3 nodes (got 1)"]);
  });
});

describe("templates", () => {
  it("lays every band clear of the burned-in headline and captions", () => {
    const style = captionStyle("9x16");
    const headlineTop = Math.round(style.height * 0.24);
    const headlineBottom = headlineTop + 2 * Math.round(style.size * 1.25);
    const captionBottom = style.height - style.marginV;
    const captionTop = captionBottom - Math.round(style.size * 1.2);
    expect(RESERVED.headline.top).toBeLessThanOrEqual(headlineTop - 20);
    expect(RESERVED.headline.bottom).toBeGreaterThanOrEqual(headlineBottom + 40);
    expect(RESERVED.caption.top).toBeLessThanOrEqual(captionTop - 10);
    expect(RESERVED.caption.bottom).toBeGreaterThan(captionBottom);
    const overlaps = (a: { top: number; bottom: number }, b: { top: number; bottom: number }) => a.top < b.bottom && b.top < a.bottom;
    for (const band of Object.values(BANDS)) {
      for (const zone of Object.values(RESERVED)) expect(overlaps(band, zone)).toBe(false);
      expect(band.top).toBeGreaterThanOrEqual(0);
      expect(band.bottom).toBeLessThanOrEqual(style.height);
    }
  });

  it("escapes every string the writer filled", () => {
    const hostile: SceneVisual = { kind: "scene", template: "number", data: { value: "<b>1</b>", label: `"><script>alert(1)</script>`, kicker: "a & b" } };
    const html = sceneHtml(hostile, render);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>1</b>");
    expect(html).toContain("&lt;b&gt;1&lt;/b&gt;");
    expect(html).toContain("&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("a &amp; b");
  });

  it("sets the beat's exact length, the accent and the local fonts, and loads nothing remote", () => {
    for (const v of [number, code, diagram, headline]) {
      const html = sceneHtml(v, render);
      expect(html).toContain('data-duration="5.200000"');
      expect(html).toContain("--accent: #ffb000;");
      expect(html).toContain("url(fonts/b.woff2)");
      expect(html).toContain("data-no-timeline");
      expect(html).not.toMatch(/https?:\/\//);
      expect(html).not.toMatch(/infinite/);
      const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(ids).size, v.template).toBe(ids.length);
    }
    expect(sceneHtml(number, { ...render, seconds: 176 / 30 })).toContain('data-duration="5.866667"');
    expect(sceneFrames(176 / 30)).toBe(176);
  });

  it("fills each template's own parts", () => {
    expect(sceneHtml(number, render)).toMatch(/id="value"[^>]*font-size:260px[^>]*>\$0\.001</);
    expect(sceneHtml(number, render)).toContain('id="kicker"');
    expect(sceneHtml(headline, render)).toMatch(/id="line-2" class="hl rise last"/);
    const c = sceneHtml(code, render);
    expect(c).toContain('id="code-mark"');
    expect(c.indexOf('id="code-mark"')).toBeGreaterThan(c.indexOf('id="code-2"'));
    const d = sceneHtml(diagram, render);
    expect(d.match(/class="node pop/g)).toHaveLength(3);
    expect(d).toContain('id="arrow-2-label" class="edge rise"');
    expect(d).toMatch(/id="arrow-1-dot"[^>]*animation-iteration-count:\d+;/);
    expect(d).not.toContain('id="kicker"');
  });

  it("fits type to its box and colours code without trusting it", () => {
    expect(fitSize(6, 940, 260, 0.58)).toBe(260);
    expect(fitSize(10, 940, 260, 0.58)).toBe(162);
    expect(highlightCode('const x = "a<b"; // done')).toBe(
      '<span class="kw">const</span> x = <span class="str">&quot;a&lt;b&quot;</span>; <span class="com">// done</span>',
    );
    expect(highlightCode("pip install x # comment")).toBe('pip install x <span class="com"># comment</span>');
    expect(highlightCode("obj.#field")).toBe("obj.#field");
  });

  it("ships only the font files we copy, pointed at fonts/, and blocks on them", () => {
    const css = `/* a */\n@font-face {\n  font-family: 'X';\n  font-display: swap;\n  src: url(./files/x-latin.woff2) format('woff2-variations');\n}\n/* b */\n@font-face {\n  font-family: 'X';\n  src: url(./files/x-greek.woff2) format('woff2-variations');\n}`;
    const out = fontFaceCss(css, ["x-latin.woff2"]);
    expect(out).toContain("url(fonts/x-latin.woff2)");
    expect(out).toContain("font-display: block");
    expect(out).not.toContain("greek");
  });
});

describe("renderer", () => {
  it("renders near-lossless, fails on lint errors and never sends telemetry", () => {
    expect(sceneRenderArgs("visuals/scene-02", "visuals/scene-02/scene.mp4")).toEqual([
      "render",
      "visuals/scene-02",
      "--output",
      "visuals/scene-02/scene.mp4",
      "--fps",
      "30",
      "--crf",
      "12",
      "--strict",
      "--quiet",
    ]);
    const env = sceneEnv({ PATH: "/bin", DO_NOT_TRACK: "0" }, { headlessShell: "/opt/shell" });
    expect(env).toMatchObject({ PATH: "/bin", HYPERFRAMES_NO_TELEMETRY: "1", DO_NOT_TRACK: "1", PRODUCER_HEADLESS_SHELL_PATH: "/opt/shell" });
    expect(sceneEnv({}, {})).not.toHaveProperty("PRODUCER_HEADLESS_SHELL_PATH");
  });

  it("finds a headless shell Playwright already installed", () => {
    const root = mkdtempSync(join(tmpdir(), "pw-"));
    expect(playwrightHeadlessShell(join(root, "missing"))).toBeUndefined();
    for (const build of ["1180", "1194"]) {
      mkdirSync(join(root, `chromium_headless_shell-${build}`, "chrome-linux"), { recursive: true });
      writeFileSync(join(root, `chromium_headless_shell-${build}`, "chrome-linux", "headless_shell"), "");
    }
    expect(playwrightHeadlessShell(root)).toBe(join(root, "chromium_headless_shell-1194", "chrome-linux", "headless_shell"));
  });

  it("conforms a scene to the beat's frames and the other beats' encoding", () => {
    const args = conformArgs("scene.mp4", 156, "beat-02.mp4");
    const chain = args[args.indexOf("-vf") + 1]!;
    expect(chain).toContain("in_color_matrix=bt709:out_color_matrix=bt601");
    expect(chain).toContain("tpad=stop_mode=clone");
    expect(args.slice(args.indexOf("-frames:v"), args.indexOf("-frames:v") + 2)).toEqual(["-frames:v", "156"]);
    expect(args).toContain("-an");
    expect(args.at(-1)).toBe("beat-02.mp4");
    expect(zoneArgs("b.mp4", RESERVED.headline)[5]).toBe(`crop=1080:${RESERVED.headline.bottom - RESERVED.headline.top}:0:${RESERVED.headline.top},signalstats,metadata=mode=print:key=lavfi.signalstats.YMAX:file=-`);
  });
});

describe("writer schema for scenes", () => {
  it("offers one strict branch per template, every field required", () => {
    const visual = SCRIPT_SCHEMA.properties.beats.items.properties.visual.anyOf;
    expect(visual).toHaveLength(5);
    const walk = (node: unknown): void => {
      if (!node || typeof node !== "object") return;
      const o = node as { type?: string; properties?: Record<string, unknown>; required?: string[]; additionalProperties?: boolean };
      if (o.type === "object") {
        expect(o.additionalProperties).toBe(false);
        expect([...(o.required ?? [])].sort()).toEqual(Object.keys(o.properties ?? {}).sort());
      }
      for (const value of Object.values(node)) walk(value);
    };
    walk(SCRIPT_SCHEMA);
  });

  it("drops the empty fields the writer had to fill", () => {
    const s = toScript(
      {
        title: "T",
        post: "P",
        beats: [
          { narration: "n", onscreen: "o", visual: { kind: "scene", template: "code", data: { lines: ["a"], highlight: 0, kicker: "" } }, claims: [] },
          { narration: "n", onscreen: "o", visual: { kind: "scene", template: "diagram", data: { nodes: ["A", "B"], edges: [], kicker: " " } }, claims: [] },
          { narration: "n", onscreen: "o", visual: { kind: "scene", template: "number", data: { value: "42%", label: "l", kicker: "k" } }, claims: [] },
        ],
      },
      [{ id: "post", title: "Post", text: "" }],
    );
    expect(s.beats.map((b) => b.visual)).toEqual([
      { kind: "scene", template: "code", data: { lines: ["a"] } },
      { kind: "scene", template: "diagram", data: { nodes: ["A", "B"] } },
      { kind: "scene", template: "number", data: { value: "42%", label: "l", kicker: "k" } },
    ]);
  });
});
