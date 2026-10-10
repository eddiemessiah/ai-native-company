#!/usr/bin/env node
// Renders index.html to MP4, frame by frame: a headless Chromium seeks the timeline to each frame's time,
// screenshots it and pipes the frame to ffmpeg as a JPEG at quality 97 (PNG encoding of the film grain is
// about 12 times slower, and x264 re-encodes it anyway). Deterministic, so a re-render is identical.
//
//   node render.mjs --format 16x9|9x16 [--fps 30] [--out file.mp4] [--cta "Try it free · link in the post"]
//                   [--plain] [--audio] [--frames 0,300,900 --still-dir dir] [--remux render.mp4 --audio]
//
// Needs playwright-core and ffmpeg-static (RENDER_TOOLS points at their node_modules) and a Chromium
// (CHROMIUM_PATH, or Playwright's own under PLAYWRIGHT_BROWSERS_PATH). Fonts come from the repo's
// fontsource packages (FONT_ROOT, default: this repo), so nothing is fetched from the network.
import { spawn } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const has = (name) => args.includes(`--${name}`);

const format = flag("format", "16x9");
const [width, height] = format === "9x16" ? [1080, 1920] : [1920, 1080];
const fps = Number(flag("fps", "30"));
const out = resolve(flag("out", `gtm-harness-v2-${format}.mp4`));
const tools = process.env.RENDER_TOOLS ?? join(homedir(), ".cache", "shonin-render", "node_modules");
const require = createRequire(join(tools, "noop.js"));
const { chromium } = require("playwright-core");
const ffmpeg = process.env.FFMPEG_PATH ?? require("ffmpeg-static");

// The fonts the composition asks for, mapped to the fontsource packages that ship them.
const repo = process.env.FONT_ROOT ?? resolve(here, "../../../..");
const FONTS = {
  bricolage: ["packages/video/node_modules/@fontsource-variable/bricolage-grotesque", "apps/web/node_modules/@fontsource-variable/bricolage-grotesque"],
  mono: ["packages/video/node_modules/@fontsource-variable/jetbrains-mono", "apps/web/node_modules/@fontsource-variable/jetbrains-mono"],
  serif: ["apps/web/node_modules/@fontsource/instrument-serif"],
  mincho: ["apps/web/node_modules/@fontsource/shippori-mincho-b1"],
};
const fontDir = (name) => FONTS[name]?.map((p) => join(repo, p)).find((p) => existsSync(p));
for (const name of Object.keys(FONTS)) if (!fontDir(name)) throw new Error(`Font ${name} not found under ${repo}. Run pnpm install there, or set FONT_ROOT.`);

const TYPES = { ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".js": "text/javascript" };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file;
  const m = path.match(/^\/fonts\/([a-z]+)\/(.+)$/);
  if (m && fontDir(m[1])) file = join(fontDir(m[1]), normalize(m[2]).replace(/^(\.\.[/\\])+/, ""));
  else if (path === "/" || path === "/index.html") file = join(here, "index.html");
  if (!file || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const port = server.address().port;

const query = new URLSearchParams({ render: "1" });
if (flag("cta")) query.set("cta", flag("cta"));
if (has("plain")) query.set("plain", "1");

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${port}/?${query}`);
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate(() => window.DURATION);
const total = Math.round(duration * fps);

// Stills: a few frames as PNGs, for checking a layout without a full render.
if (flag("frames")) {
  const dir = resolve(flag("still-dir", "stills"));
  mkdirSync(dir, { recursive: true });
  for (const f of flag("frames").split(",").map(Number)) {
    await page.evaluate((t) => window.seek(t), f / fps);
    writeFileSync(join(dir, `${format}-${String(f).padStart(4, "0")}.png`), await page.screenshot({ type: "png" }));
  }
  await browser.close(); server.close();
  process.exit(0);
}

// The soundtrack, made here from sine waves so there is no licence to track: a slow low pulse, a thud
// when each seal lands, and a bell on the end card. Times match the timeline in index.html.
const thuds = [7.2, 37.6, 38.2]; // the 承 seal (scene 2), the Approve tap and the stamp (scene 7)
// 55 Hz carries the weight on headphones; the 110 Hz octave keeps the pulse audible on a phone speaker.
const pulse = "(0.22*sin(2*PI*55*t)+0.12*sin(2*PI*110*t))*exp(-7*mod(t,1.2))*between(t,0.4,54.6)";
// Every envelope uses max(t-start,0): before its start, exp() of a large positive number overflows to inf and
// sin(inf) is NaN, which multiplying by zero does not cancel.
const since = (s) => `max(t-${s},0)`;
const thud = thuds.map((s) => `0.9*sin(2*PI*(48+40*exp(-30*${since(s)}))*${since(s)})*exp(-9*${since(s)})*gte(t,${s})`).join("+");
const bell = [523.25, 1046.5, 1569.75, 2637].map((f, i) => `${[0.35, 0.18, 0.1, 0.05][i]}*sin(2*PI*${f}*${since(55.2)})*exp(-${1.1 + i * 0.6}*${since(55.2)})*gte(t,55.2)`).join("+");
const audio = has("audio") ? ["-f", "lavfi", "-i", `aevalsrc='${pulse}+${thud}+${bell}':s=48000:d=${duration}`] : [];

// --remux <file.mp4>: put the soundtrack on an existing render without re-rendering the frames.
if (flag("remux")) {
  const r = spawn(ffmpeg, ["-y", "-loglevel", "error", "-i", resolve(flag("remux")), ...audio, "-filter_complex", "[1:a]alimiter=limit=0.8,afade=t=in:d=0.3,afade=t=out:st=" + (duration - 1.2) + ":d=1.2[a]", "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], { stdio: "inherit" });
  const rc = await new Promise((ok) => r.on("close", ok));
  await browser.close(); server.close();
  process.exit(rc ?? 1);
}

const enc = spawn(ffmpeg, [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
  ...audio,
  ...(has("audio") ? ["-filter_complex", "[1:a]alimiter=limit=0.8,afade=t=in:d=0.3,afade=t=out:st=" + (duration - 1.2) + ":d=1.2[a]", "-map", "0:v", "-map", "[a]", "-c:a", "aac", "-b:a", "192k"] : []),
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  out,
], { stdio: ["pipe", "inherit", "inherit"] });

const started = Date.now();
for (let f = 0; f < total; f++) {
  await page.evaluate((t) => window.seek(t), f / fps);
  const jpeg = await page.screenshot({ type: "jpeg", quality: 97 });
  if (!enc.stdin.write(jpeg)) await new Promise((ok) => enc.stdin.once("drain", ok));
  if (f % (fps * 5) === 0) process.stderr.write(`\r${format}: ${Math.round((f / total) * 100)}%  ${((Date.now() - started) / 1000).toFixed(0)} s`);
}
enc.stdin.end();
const code = await new Promise((ok) => enc.on("close", ok));
await browser.close(); server.close();
if (code !== 0) { console.error(`\nffmpeg exited with ${code}`); process.exit(1); }
console.error(`\n${format}: wrote ${out} (${total} frames, ${((Date.now() - started) / 1000).toFixed(0)} s)`);
