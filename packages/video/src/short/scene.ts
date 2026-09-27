import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { run } from "../ffmpeg";
import { BRAND, conformArgs } from "./visuals";

/**
 * Scene beats: a number, a few lines of code, a flow between parties, or a short statement, animated in HTML
 * and rendered frame by frame by HyperFrames (Apache-2.0; research/hyperframes.md). The writer fills a
 * template's data and nothing else. Code checks the data, escapes it into our own HTML, renders a silent clip
 * of the beat's exact length, and checks that the headline and caption zones stayed empty.
 */

export const SCENE_TEMPLATES = ["headline", "number", "code", "diagram"] as const;
export type SceneTemplate = (typeof SCENE_TEMPLATES)[number];

/** Every template takes an optional kicker: a short line above the headline zone, such as the topic or a qualifier. */
interface Kicked {
  readonly kicker?: string;
}
export interface HeadlineScene extends Kicked {
  /** One to three short lines, revealed in turn; the last one in the beat's accent. */
  readonly lines: readonly string[];
}
export interface NumberScene extends Kicked {
  /** The figure itself, as the source writes it: "$0.001", "42%", "1,700". */
  readonly value: string;
  readonly label: string;
}
export interface CodeScene extends Kicked {
  /** Lines copied from a source, as written there. */
  readonly lines: readonly string[];
  /** The line to mark, counting from 1. */
  readonly highlight?: number;
}
export interface DiagramScene extends Kicked {
  /** Two or three parties, left to right. */
  readonly nodes: readonly string[];
  /** One label per arrow, or none. */
  readonly edges?: readonly string[];
}

export type SceneVisual =
  | { readonly kind: "scene"; readonly template: "headline"; readonly data: HeadlineScene }
  | { readonly kind: "scene"; readonly template: "number"; readonly data: NumberScene }
  | { readonly kind: "scene"; readonly template: "code"; readonly data: CodeScene }
  | { readonly kind: "scene"; readonly template: "diagram"; readonly data: DiagramScene };

/** Character limits that keep every field on one line inside its band. */
export const SCENE_LIMITS = {
  kicker: 36,
  headlineLines: 3,
  headlineLine: 20,
  value: 10,
  label: 36,
  codeLines: 6,
  codeLine: 36,
  node: 12,
  edge: 12,
} as const;

/** The version the templates were tested with (research/hyperframes.md). */
export const HYPERFRAMES_VERSION = "0.8.80";

const W = 1080;
const H = 1920;
const FPS = 30;

/**
 * Where the burned-in headline and captions land on a 1080×1920 frame, with a margin: the Headline style sits
 * 24% down with up to two lines at 135 px, and captions end 560 px above the bottom (captions.ts), clear of the
 * platforms' own overlays. Scenes leave these empty, and draw nothing below the captions either.
 */
export const RESERVED = {
  headline: { top: 430, bottom: 800 },
  /** The captions and everything under them, down to the progress bar. */
  caption: { top: 1210, bottom: 1900 },
} as const;

/** Where a scene may draw: the kicker above the headline, the stage between headline and captions. Each band clips its own content. */
export const BANDS = {
  top: { top: 150, bottom: 410 },
  stage: { top: 820, bottom: 1190 },
} as const;

const CONTROL = /[\u0000-\u0008\u000a-\u001f\u007f]/;
const expandTabs = (line: string) => line.replace(/\t/g, "  ").replace(/\s+$/, "");

/** What's wrong with a scene's data, in the writer's terms. Code checks every limit; nothing reaches the renderer unchecked. */
export function sceneProblems(v: SceneVisual): string[] {
  if (!v.data || typeof v.data !== "object") return ["data is missing"];
  const out: string[] = [];
  const L = SCENE_LIMITS;
  const text = (name: string, value: string | undefined, max: number, required = true) => {
    if (value === undefined || value.trim() === "") {
      if (required) out.push(`${name} is empty`);
      return;
    }
    if (CONTROL.test(value)) out.push(`${name} has a line break or a control character`);
    if (value.length > max) out.push(`${name} is ${value.length} characters; keep it to ${max}`);
  };
  switch (v.template) {
    case "headline": {
      const n = v.data.lines?.length ?? 0;
      if (n < 1 || n > L.headlineLines) out.push(`use 1 to ${L.headlineLines} lines (got ${n})`);
      v.data.lines?.forEach((line, i) => text(`line ${i + 1}`, line, L.headlineLine));
      break;
    }
    case "number":
      text("value", v.data.value, L.value);
      if (v.data.value?.trim() && !/\d/.test(v.data.value)) out.push("value has no digit: use the headline template for words");
      text("label", v.data.label, L.label);
      break;
    case "code": {
      const lines = v.data.lines ?? [];
      if (lines.length < 1 || lines.length > L.codeLines) out.push(`use 1 to ${L.codeLines} lines of code (got ${lines.length})`);
      if (lines.length > 0 && lines.every((l) => !l.trim())) out.push("the code is empty");
      lines.forEach((line, i) => {
        if (CONTROL.test(line)) out.push(`code line ${i + 1} has a line break or a control character`);
        const width = expandTabs(line).length;
        if (width > L.codeLine) out.push(`code line ${i + 1} is ${width} characters; keep it to ${L.codeLine}`);
      });
      const h = v.data.highlight;
      if (h !== undefined && (!Number.isInteger(h) || h < 1 || h > lines.length)) out.push(`highlight is a line number from 1 to ${lines.length}`);
      break;
    }
    case "diagram": {
      const n = v.data.nodes?.length ?? 0;
      if (n < 2 || n > 3) out.push(`use 2 or 3 nodes (got ${n})`);
      v.data.nodes?.forEach((node, i) => text(`node ${i + 1}`, node, L.node));
      const edges = v.data.edges ?? [];
      if (edges.length > 0 && edges.length !== n - 1) out.push(`give ${n - 1} arrow labels, one per arrow, or none`);
      edges.forEach((edge, i) => text(`arrow ${i + 1}`, edge, L.edge, false));
      break;
    }
    default:
      out.push(`unknown template "${(v as { template?: string }).template}": use ${SCENE_TEMPLATES.join(", ")}`);
      return out;
  }
  text("kicker", v.data.kicker, L.kicker, false);
  return out;
}

/** Every string a scene shows except code, which is checked against the sources line by line instead. */
export function sceneText(v: SceneVisual): string[] {
  if (!v.data) return [];
  const texts: unknown[] = [
    v.data.kicker,
    ...(v.template === "headline"
      ? (v.data.lines ?? [])
      : v.template === "number"
        ? [v.data.value, v.data.label]
        : v.template === "diagram"
          ? [...(v.data.nodes ?? []), ...(v.data.edges ?? [])]
          : []),
  ];
  return texts.filter((t): t is string => typeof t === "string" && t.trim() !== "");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** The largest font size, up to `max`, at which `chars` characters averaging `em` of the size fit in `width` pixels. */
export function fitSize(chars: number, width: number, max: number, em: number): number {
  return Math.max(12, Math.min(max, Math.floor(width / (Math.max(chars, 1) * em))));
}

const TOKEN =
  /(\/\/.*$|(?:^|(?<=\s))#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|export|import|from|async|await|if|else|new|class|interface|type|def|fn|pub|use)\b/g;

/** Escapes a line of code and colours its comments, strings and keywords. */
export function highlightCode(line: string): string {
  let html = "";
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    html += esc(line.slice(last, m.index));
    html += `<span class="${m[1] ? "com" : m[2] ? "str" : "kw"}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return html + esc(line.slice(last));
}

export interface SceneRenderOptions {
  readonly seconds: number;
  readonly accent: string;
  /** The @font-face rules for the fonts copied next to the page (installSceneFonts). */
  readonly fontCss: string;
}

/** A beat's exact length in frames, as the timeline lays it. */
export const sceneFrames = (seconds: number) => Math.round(seconds * FPS);

/** Fills a template. Pure: the same data always gives the same page. */
export function sceneHtml(v: SceneVisual, r: SceneRenderOptions): string {
  const frames = sceneFrames(r.seconds);
  const duration = (frames / FPS).toFixed(6);
  const band = (name: keyof typeof BANDS, inner: string) =>
    `<div id="band-${name}" class="band band-${name} clip" data-start="0" data-duration="${duration}">${inner}</div>`;
  const glow = `<div id="glow" class="glow"><div id="glow-orb" class="orb"></div></div>`;
  const delay = (ms: number, extra = "") => `style="${extra}animation-delay:${Math.round(ms)}ms"`;
  const kicker = v.data.kicker?.trim()
    ? band("top", `<div id="kicker" class="kicker rise" ${delay(60, `font-size:${fitSize(v.data.kicker.length, 940, 40, 0.56)}px;`)}>${esc(v.data.kicker)}</div>`)
    : "";
  let body = "";
  let css = "";

  switch (v.template) {
    case "number": {
      const { value, label } = v.data;
      const size = fitSize(value.length, 940, 260, 0.58);
      body =
        band(
          "stage",
          glow +
            `<div id="value-wrap" class="breathe"><div id="value" class="value pop" ${delay(120, `font-size:${size}px;`)}>${esc(value)}</div></div>` +
            `<div id="label" class="label rise" ${delay(420, `font-size:${fitSize(label.length, 940, 46, 0.5)}px;`)}>${esc(label)}</div>` +
            `<div id="rule" class="rule grow" ${delay(640)}></div>`,
        );
      css = `.value { font-weight: 800; line-height: .95; letter-spacing: -.035em; color: var(--accent); white-space: nowrap; }
.label { font-weight: 650; line-height: 1.15; margin-top: 14px; white-space: nowrap; }
#rule { margin-top: 26px; }`;
      break;
    }
    case "headline": {
      const { lines } = v.data;
      const longest = Math.max(...lines.map((l) => l.length));
      const size = Math.min(fitSize(longest, 940, 116, 0.54), Math.floor(300 / (lines.length * 1.04)));
      body = band(
          "stage",
          glow +
            lines
              .map((line, i) => `<div id="line-${i + 1}" class="hl rise${i === lines.length - 1 ? " last" : ""}" ${delay(140 + i * 260, `font-size:${size}px;`)}>${esc(line)}</div>`)
              .join("") +
            `<div id="rule" class="rule grow" ${delay(140 + lines.length * 260 + 120)}></div>`,
        );
      css = `.hl { font-weight: 800; line-height: 1.04; letter-spacing: -.03em; white-space: nowrap; }
.hl.last { color: var(--accent); }
#rule { margin-top: 24px; }`;
      break;
    }
    case "code": {
      const lines = v.data.lines.map(expandTabs);
      const n = lines.length;
      const longest = Math.max(1, ...lines.map((l) => l.length));
      const size = Math.min(fitSize(longest, 892, 44, 0.6), Math.floor(316 / (n * 1.4)));
      const rows = lines
        .map((line, i) => {
          const marked = v.data.highlight === i + 1;
          const bar = marked ? `<div id="code-mark" class="mark grow" ${delay(260 + n * 170 + 200)}></div>` : "";
          return `<div id="code-${i + 1}" class="ln rise" ${delay(260 + i * 170)}>${bar}<span class="tx">${highlightCode(line) || " "}</span></div>`;
        })
        .join("");
      body = band("stage", `<div id="card" class="card rise" ${delay(60, `font-size:${size}px;`)}>${rows}</div>`);
      css = `.card { width: 960px; box-sizing: border-box; padding: 20px 32px; background: var(--bg-2); border: 2px solid var(--line-2); border-radius: 28px; font-family: "JetBrains Mono Variable"; font-weight: 500; line-height: 1.4; text-align: left; }
.ln { position: relative; white-space: pre; }
.ln .tx { position: relative; z-index: 1; }
.mark { position: absolute; left: -16px; right: -16px; top: 0; bottom: 0; background: color-mix(in srgb, var(--accent) 22%, transparent); border-left: 6px solid var(--accent); transform-origin: left center; }
.kw { color: ${BRAND.decide}; }
.str { color: ${BRAND.write}; }
.com { color: var(--dim); }`;
      break;
    }
    case "diagram": {
      const { nodes } = v.data;
      const edges = v.data.edges ?? [];
      const n = nodes.length;
      const nodeW = n === 3 ? 236 : 330;
      const arrowW = n === 3 ? 126 : 220;
      const nodeSize = fitSize(Math.max(...nodes.map((x) => x.length)), nodeW - 32, 42, 0.56);
      const parts: string[] = [];
      nodes.forEach((node, i) => {
        parts.push(`<div id="node-${i + 1}" class="node pop${i === n - 1 ? " last" : ""}" ${delay(120 + i * 420, `width:${nodeW}px;font-size:${nodeSize}px;`)}>${esc(node)}</div>`);
        if (i === n - 1) return;
        const shaft = 120 + i * 420 + 300;
        const dotStart = shaft + 700;
        const cycles = Math.max(1, Math.floor((r.seconds * 1000 - dotStart - 200) / 1100));
        const edge = edges[i]?.trim();
        parts.push(
          `<div id="arrow-${i + 1}" class="arrow" style="width:${arrowW}px">` +
            `<div id="arrow-${i + 1}-shaft" class="shaft grow" ${delay(shaft)}></div>` +
            `<div id="arrow-${i + 1}-head" class="head rise" ${delay(shaft + 260)}></div>` +
            `<div id="arrow-${i + 1}-dot" class="dot" ${delay(dotStart, `--a:${arrowW - 44}px;animation-iteration-count:${cycles};`)}></div>` +
            (edge ? `<div class="edge-pos"><div id="arrow-${i + 1}-label" class="edge rise" ${delay(shaft + 400, `font-size:${fitSize(edge.length, 220, 30, 0.52)}px;`)}>${esc(edge)}</div></div>` : "") +
            `</div>`,
        );
      });
      body = band("stage", glow + `<div id="flow" class="flow">${parts.join("")}</div>`);
      css = `.flow { display: flex; align-items: center; justify-content: center; padding-bottom: 56px; }
.node { height: 150px; box-sizing: border-box; flex: none; display: flex; align-items: center; justify-content: center; padding: 0 16px; border-radius: 26px; background: var(--bg-2); border: 3px solid var(--line-2); font-weight: 700; white-space: nowrap; }
.node.last { border-color: var(--accent); }
.arrow { position: relative; height: 150px; flex: none; }
.shaft { position: absolute; left: 12px; right: 26px; top: 73px; height: 4px; border-radius: 2px; background: var(--accent); transform-origin: left center; }
.head { position: absolute; right: 10px; top: 63px; width: 0; height: 0; border-left: 20px solid var(--accent); border-top: 12px solid transparent; border-bottom: 12px solid transparent; }
.dot { position: absolute; left: 12px; top: 67px; width: 16px; height: 16px; border-radius: 8px; background: var(--fg); box-shadow: 0 0 16px var(--accent); animation: travel 1100ms cubic-bezier(.45,0,.55,1) 0ms 1 both; }
.edge-pos { position: absolute; top: 168px; left: -70px; right: -70px; text-align: center; }
.edge { display: inline-block; font-weight: 600; color: var(--dim); white-space: nowrap; }
@keyframes travel { 0% { opacity: 0; transform: translateX(0); } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--a)); } }`;
      break;
    }
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>Scene: ${esc(String(v.template))}</title>
<style>
${r.fontCss}
:root { --bg: ${BRAND.bg}; --bg-2: #121210; --fg: ${BRAND.bone}; --dim: #a8a293; --line-2: rgb(237 232 220 / 0.18); --accent: ${r.accent}; }
html, body { margin: 0; width: ${W}px; height: ${H}px; background: var(--bg); }
body { color: var(--fg); font-family: "Bricolage Grotesque Variable"; }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--bg); }
.band { position: absolute; left: 60px; right: 60px; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
${(Object.keys(BANDS) as (keyof typeof BANDS)[]).map((k) => `.band-${k} { top: ${BANDS[k].top}px; height: ${BANDS[k].bottom - BANDS[k].top}px; }`).join("\n")}
.band > :not(.glow) { position: relative; z-index: 1; }
.glow { position: absolute; inset: 0; z-index: 0; }
.orb { position: absolute; left: 12%; right: 12%; top: 0; bottom: 0; background: radial-gradient(closest-side, color-mix(in srgb, var(--accent) 22%, transparent), transparent); animation: drift ${duration}s linear 0ms 1 both; }
.rise { animation: rise 620ms cubic-bezier(.2,.8,.2,1) 0ms 1 both; }
.pop { animation: pop 820ms cubic-bezier(.2,.8,.2,1) 0ms 1 both; }
.grow { animation: grow 700ms cubic-bezier(.6,0,.2,1) 0ms 1 both; }
.breathe { animation: breathe ${duration}s linear 0ms 1 both; }
.rule { width: 200px; height: 10px; border-radius: 5px; background: var(--accent); flex: none; }
.band-top { justify-content: flex-end; padding-bottom: 12px; box-sizing: border-box; }
.kicker { font-weight: 650; letter-spacing: .04em; line-height: 1.2; color: var(--dim); white-space: nowrap; }
${css}
@keyframes rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes pop { 0% { opacity: 0; transform: translateY(44px) scale(.9); } 55% { opacity: 1; transform: translateY(-6px) scale(1.025); } 100% { opacity: 1; transform: none; } }
@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes breathe { from { transform: scale(1); } to { transform: scale(1.04); } }
@keyframes drift { from { transform: translateX(-4%) scale(1); } to { transform: translateX(4%) scale(1.06); } }
</style>
</head>
<body>
<div id="root" data-composition-id="scene" data-start="0" data-width="${W}" data-height="${H}" data-fps="${FPS}" data-duration="${duration}" data-no-timeline>
${kicker}${body}
</div>
</body>
</html>
`;
}

const SCENE_FONTS = [
  {
    pkg: "@fontsource-variable/bricolage-grotesque",
    css: "standard.css",
    files: [
      "bricolage-grotesque-latin-standard-normal.woff2",
      "bricolage-grotesque-latin-ext-standard-normal.woff2",
      "bricolage-grotesque-vietnamese-standard-normal.woff2",
    ],
  },
  {
    pkg: "@fontsource-variable/jetbrains-mono",
    css: "wght.css",
    files: ["jetbrains-mono-latin-wght-normal.woff2", "jetbrains-mono-latin-ext-wght-normal.woff2"],
  },
] as const;

/** Keeps the @font-face rules for the files we ship, pointed at fonts/, and blocks on them instead of swapping. */
export function fontFaceCss(css: string, files: readonly string[]): string {
  return (css.match(/@font-face\s*\{[^}]*\}/g) ?? [])
    .filter((rule) => files.some((f) => rule.includes(`./files/${f}`)))
    .map((rule) => rule.replace(/url\(\.\/files\//g, "url(fonts/").replace(/font-display:\s*swap/, "font-display: block"))
    .join("\n");
}

/** Copies the brand faces next to a scene page and returns their @font-face rules. Nothing is fetched. */
export function installSceneFonts(dir: string): string {
  const require = createRequire(import.meta.url);
  const target = join(dir, "fonts");
  mkdirSync(target, { recursive: true });
  return SCENE_FONTS.map((font) => {
    const pkg = dirname(require.resolve(`${font.pkg}/package.json`));
    for (const file of font.files) copyFileSync(join(pkg, "files", file), join(target, file));
    return fontFaceCss(readFileSync(join(pkg, font.css), "utf8"), font.files);
  }).join("\n");
}

export interface SceneRenderer {
  readonly bin: string;
  readonly version: string;
  /** The chrome-headless-shell to use; unset lets HyperFrames use its own. */
  readonly headlessShell?: string;
  readonly chrome: string;
}

/** HyperFrames' own arguments for one scene: a near-lossless intermediate, failing on any lint error. Pure. */
export function sceneRenderArgs(dir: string, out: string): string[] {
  return ["render", dir, "--output", out, "--fps", String(FPS), "--crf", "12", "--strict", "--quiet"];
}

/** No telemetry, ever: HyperFrames' events carry the account email (research/hyperframes.md). Pure. */
export function sceneEnv(env: NodeJS.ProcessEnv, renderer: Pick<SceneRenderer, "headlessShell">): NodeJS.ProcessEnv {
  return {
    ...env,
    HYPERFRAMES_NO_TELEMETRY: "1",
    DO_NOT_TRACK: "1",
    ...(renderer.headlessShell ? { PRODUCER_HEADLESS_SHELL_PATH: renderer.headlessShell } : {}),
  };
}

/** A headless shell Playwright already installed, so nothing needs downloading. */
export function playwrightHeadlessShell(root: string): string | undefined {
  if (!existsSync(root)) return undefined;
  const dirs = readdirSync(root).filter((d) => d.startsWith("chromium_headless_shell-")).sort().reverse();
  for (const d of dirs) {
    for (const exe of [join("chrome-linux", "headless_shell"), join("chrome-headless-shell-linux64", "chrome-headless-shell")]) {
      if (existsSync(join(root, d, exe))) return join(root, d, exe);
    }
  }
  return undefined;
}

/** HyperFrames on this machine, or null: then scene beats fall back to the gradient. */
export async function findSceneRenderer(env: NodeJS.ProcessEnv = process.env): Promise<SceneRenderer | null> {
  let bin = env.HYPERFRAMES_BIN ?? "";
  if (!bin) {
    try {
      await run("sh", ["-c", "command -v hyperframes"]);
      bin = "hyperframes";
    } catch {
      return null;
    }
  }
  let version: string;
  try {
    version = (await run(bin, ["--version"], { env: sceneEnv(env, {}) })).stdout.trim().split(/\s+/).pop() ?? "";
  } catch {
    return null;
  }
  const headlessShell = env.PRODUCER_HEADLESS_SHELL_PATH || env.HYPERFRAMES_BROWSER_PATH || playwrightHeadlessShell(env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers");
  let chrome = "the headless shell HyperFrames manages";
  if (headlessShell) {
    try {
      chrome = (await run(headlessShell, ["--version"])).stdout.trim();
    } catch {
      chrome = headlessShell;
    }
  }
  return { bin, version, ...(headlessShell ? { headlessShell } : {}), chrome };
}

/** ffmpeg arguments that print the brightest luma inside one zone, frame by frame. */
export function zoneArgs(file: string, zone: { top: number; bottom: number }): string[] {
  return [
    "-hide_banner",
    "-nostats",
    "-i",
    file,
    "-vf",
    `crop=${W}:${zone.bottom - zone.top}:0:${zone.top},signalstats,metadata=mode=print:key=lavfi.signalstats.YMAX:file=-`,
    "-an",
    "-f",
    "null",
    "-",
  ];
}

/** Luma above this in a reserved zone means something was drawn there; the dark ground reads about 25. */
export const ZONE_LIMIT = 60;

export interface ZoneReport {
  readonly headline: number;
  readonly caption: number;
  readonly clear: boolean;
}

async function brightest(file: string, zone: { top: number; bottom: number }): Promise<number> {
  const { stdout } = await run("ffmpeg", zoneArgs(file, zone));
  return Math.max(0, ...[...stdout.matchAll(/YMAX=(\d+)/g)].map((m) => Number(m[1])));
}

/** Renders one scene beat to a silent clip of the beat's exact length, then checks the reserved zones. */
export async function renderScene(
  visual: SceneVisual,
  opts: { seconds: number; accent: string; dir: string; out: string; renderer: SceneRenderer },
): Promise<ZoneReport> {
  mkdirSync(opts.dir, { recursive: true });
  const fontCss = installSceneFonts(opts.dir);
  writeFileSync(join(opts.dir, "index.html"), sceneHtml(visual, { seconds: opts.seconds, accent: opts.accent, fontCss }));
  const raw = join(opts.dir, "scene.mp4");
  await run(opts.renderer.bin, sceneRenderArgs(opts.dir, raw), { env: sceneEnv(process.env, opts.renderer) });
  await run("ffmpeg", conformArgs(raw, sceneFrames(opts.seconds), opts.out));
  const headline = await brightest(opts.out, RESERVED.headline);
  const caption = await brightest(opts.out, RESERVED.caption);
  return { headline, caption, clear: headline <= ZONE_LIMIT && caption <= ZONE_LIMIT };
}
