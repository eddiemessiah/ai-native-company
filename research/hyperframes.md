# HyperFrames as the scene renderer for Explainer Shorts

*Checked 2026-09-27 for Shonin's Explainer Shorts line (Edidiong Umana).*

**Sources:**
- [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes), cloned at commit `c9b3d9c` (2026-09-27, "fix(engine): SDR renders keep footage and page colours as in the source");
- the npm package `hyperframes@0.8.80`, published 2026-09-27;
- our own renders on this machine: 4 cores (Intel Xeon, 2.1 GHz), 15.7 GB RAM, no GPU, Node 22.22.2, ffmpeg 6.1.1.

**Tags:**
- **[CODE]** read in the clone, with the file path;
- **[NPM]** the registry's metadata;
- **[OURS]** measured here.

## Verdict

**It passes all six checks.** Build it as an optional renderer for scene beats:
- detect it at render time;
- fall back to the ffmpeg gradient with a warning when it's missing;
- keep our own audio chain.

| Check | Result |
|---|---|
| (a) Licence allows client work | **Yes.** Apache-2.0, no per-render fees or commercial thresholds. Telemetry must be switched off |
| (b) What it needs | Node 22+, ffmpeg, and a chrome-headless-shell. The one Playwright preinstalled works through `PRODUCER_HEADLESS_SHELL_PATH`. Nothing downloaded |
| (c) Frame by frame, deterministic | **Yes.** Each frame is seeked to `frame / fps` and captured with Chrome's `HeadlessExperimental.beginFrame`. Two renders gave 180 identical frames |
| (d) Bundled fonts, no Google fetch | **Yes, if every family has an `@font-face`.** A render with no network at all matched the online one frame for frame |
| (e) 1080×1920, 30 fps, 6 s on 4 cores | **13.7 s** (2.3× real time), against 2.6 s for our ffmpeg gradient beat |
| (f) Audio | It mixes `<audio>` and `<video>`, ducks, applies effects and ships Kokoro TTS. We don't use any of it: scenes render silent |

## (a) Licence

- **Apache-2.0.**
  - `LICENSE` at the repo root [CODE].
  - The npm `license` field [NPM].
  - The README: "Open source: Apache 2.0 license, with no per-render fees or commercial-use thresholds" [CODE, `README.md`].
- **What the licence asks of us.** It allows commercial use and modification. Its conditions (keep the licence and notices, mark changes) apply when you redistribute the software. We don't redistribute it: we run the CLI installed on the rendering machine, and the templates are our own HTML.
- **Third-party parts** (`CREDITS.md`) [CODE]:
  - mediabunny (MPL-2.0) in the Studio;
  - GSAP under the "GSAP Standard License (not an OSI open-source licence)", vendored in or loaded by some catalog blocks;
  - two catalog blocks that "load their fonts from Google Fonts at run time".

  None of these is on our path. Our templates use no GSAP, no catalog blocks and no remote assets.
- **Telemetry is on by default and names the user.**
  - It sends events to PostHog, and "`distinctId` is the account email (else username)" (`packages/cli/src/telemetry/events.ts:855`) [CODE].
  - It's switched off by `HYPERFRAMES_NO_TELEMETRY` or `DO_NOT_TRACK` (`packages/cli/src/telemetry/policy.ts:32–36`) [CODE].
  - Our wrapper sets both on every call. A client job never sends telemetry.

## (b) What it needs to run

- **Node and ffmpeg.** Node 22 or later ([NPM] `engines`; README: "Requirements: Node.js 22+, FFmpeg"). It uses ffmpeg and ffprobe from the `PATH`; `hyperframes doctor` found `/usr/bin/ffmpeg` 6.1.1 [OURS].
- **Chrome.** The deterministic path needs chrome-headless-shell. The engine looks in this order (`packages/engine/src/services/browserManager.ts:180–215`) [CODE]:
  1. `config.chromePath`;
  2. `PRODUCER_HEADLESS_SHELL_PATH`;
  3. `HYPERFRAMES_BROWSER_PATH`;
  4. its own cache (`~/.cache/hyperframes/chrome`);
  5. Puppeteer's cache.
- **Here:** `PRODUCER_HEADLESS_SHELL_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`, Chromium 141.0.7390.37, which Playwright had already installed. We ran no `playwright install` and no `hyperframes browser ensure`, and nothing was downloaded [OURS].
  - The engine's own cache is pinned to a "131-era" Chrome (a comment in `packages/cli/src/browser/manager.test.ts`) [CODE]. It ran on 141 without problems.
- **Install.** `npm i hyperframes@0.8.80` added 75 packages, 137 MB, in 6 s (sharp, esbuild, puppeteer-core, prettier and more) [OURS].
  - It stays out of the workspace's dependencies, so the site's build doesn't carry it.
  - Install it on the machine that renders.
- **Doctor.** `hyperframes doctor` passes Node, FFmpeg, FFprobe and Chrome [OURS]. The pieces it marks optional aren't needed for scenes: whisper.cpp, Kokoro, MusicGen and Docker.
- **Memory.** About 256 MB of RAM per worker (`render --help`) [CODE]. It chose 2 workers here.

## (c) Frame by frame, not screen recording

- **The frame clock** (`docs/concepts/determinism.mdx`) [CODE]:
  - "Rendering never plays your video. It asks for one frame at a time."
  - "`time = floor(frame) / fps`. Real time is never consulted."
  - "Chrome's `HeadlessExperimental.beginFrame` grabs the pixels in one atomic operation. No half-painted frames."
- **CSS keyframes are seeked, not played.** The CSS adapter "seeks their browser `Animation` handles when available, and falls back to pausing with negative `animation-delay`" (`skills/hyperframes-animation/adapters/css-animations.md`) [CODE].
- **Our test** [OURS]:
  - The render summary reads "beginframe capture · software gpu", and the trace logs `"captureMode":"beginframe"`.
  - We rendered the same composition twice, the second time in a network namespace with only loopback. The two decode to identical frames: all 180 `framemd5` hashes match.
- **Limit.** "Fonts and Chrome versions differ between computers, so a local render can shift by a pixel from one machine to the next"; `--docker` pins them (`determinism.mdx`) [CODE]. We handle it ourselves:
  - we ship the font files with the templates;
  - we record the Chrome version in each job's `credits.json`.

## (d) Our fonts, offline

- **When it fetches from Google.** The producer builds `@font-face` rules only for families the HTML doesn't already declare. `injectDeterministicFontFaces` removes the declared families before it builds anything (`packages/producer/src/services/deterministicFonts.ts:1462–1480`). The Google request is `https://fonts.googleapis.com/css2?family=…` (line 1186) [CODE].
- **The linter wants the same thing:** "A named CSS `font-family` needs an in-file `@font-face` to a shipped local file, or `lint` fires `font_family_without_font_face`" (`skills/hyperframes-core/SKILL.md`) [CODE].
- **Our test** [OURS]:
  - We declared `@font-face` for two faces, both OFL-1.1 from fontsource, and pointed each at a copied woff2 by relative URL:
    - Bricolage Grotesque (`@fontsource-variable/bricolage-grotesque`, latin, variable weight);
    - JetBrains Mono (`@fontsource-variable/jetbrains-mono`).
  - `hyperframes lint` reported 0 errors.
  - The render ran in a network namespace with no route out and matched the online render frame for frame.
  - The frame shows Bricolage ExtraBold on the number and JetBrains Mono on the code line.

## (e) Speed

The test scene: 1080×1920, 30 fps, 6 s (180 frames), all CSS keyframes. It had:
- a drifting radial gradient;
- a 260 px number popping in;
- a label;
- a line of code in the mono face;
- a bar growing across 5 s.

| Run | Time | Detail |
|---|---|---|
| First render | 13.7 s (15.1 s with CLI start-up) | setup 2.7 s; capture and encode 10.8 s; 2 workers; software GL |
| Same scene, no network | 13 s | frames identical to the first |
| 5.866667 s variant | | exactly 176 frames: a beat's frame-rounded length comes out whole |
| Our ffmpeg gradient beat, 6 s | 2.6 s | `brandArgs` in `packages/video/src/short/visuals.ts` |

All [OURS]. A scene beat costs about 11 s more than a gradient beat. A 46 s short with 3 scene beats should render in about 110 s instead of 74 s (our arithmetic).

## (f) Audio

- **What HyperFrames does with audio.** It mixes audio itself: "FFmpeg turns the captured frames into the MP4 and mixes in the audio from your `<audio>` and `<video>` elements" (`determinism.mdx`) [CODE]. That includes:
  - volume envelopes;
  - an effect chain;
  - "voiceover carve" ducking (the `/hyperframes-audio` skill in the README);
  - local TTS through Kokoro (`packages/cli/src/tts/manager.ts`, model `kokoro-v1.0` from the kokoro-onnx releases) [CODE].
- **What we use.** None of it. Our scenes contain no media, and the output has a single H.264 video stream (ffprobe) [OURS].
- **Our audio chain is unchanged.** Voice, music ducking and two-pass loudness stay in our ffmpeg steps, so the −14 LUFS and ≤ −1 dBTP checks work as before.

## How it fits the shorts pipeline

1. **The beat's visual.** A beat's visual can be `{ kind: "scene", template, data }`.
   - There are four templates: `headline`, `number`, `code` and `diagram`.
   - The writer fills `data` only. Code validates it and escapes every string into our own HTML, so no model ever writes HTML.
2. **One silent MP4 per scene beat.** Code renders it with `data-duration` set to the beat's frame count ÷ 30.
3. **Re-encoded before the concat.** Code re-encodes that MP4 with our x264 settings before the concat step:
   - HyperFrames encodes H.264 High@4.0 with bt709 tags and no B-frames;
   - our segments come from different settings;
   - the concat demuxer copies streams, so every segment has to match.
4. **Clear zones.** The templates keep the headline zone and the caption zone empty, because the burned-in headline and captions still sit on top.
5. **Fallback.** If `hyperframes` or a headless shell isn't found, or a scene fails, the beat falls back to the gradient with a warning. `credits.json` records which happened.
6. **On every call:**
   - `HYPERFRAMES_NO_TELEMETRY=1` and `DO_NOT_TRACK=1`;
   - the version pinned to `hyperframes@0.8.80`;
   - the renderer and Chrome version recorded in `credits.json`.

## Risks

- **It moves fast.**
  - Version 0.8.80 was published the day we checked it (`time.modified` 2026-09-27) [NPM].
  - The `FrameAdapter` interface is "experimental v0 API" (`docs/concepts/frame-adapters.mdx`) [CODE].
  - Mitigation: pin the version and re-run the scene tests before any upgrade.
- **Pixel drift between machines** (fonts, Chrome): the font files ship with the templates, and the Chrome version goes in the ledger.
- **Size and speed.** 137 MB on the rendering machine, and about 5× the render time of a gradient beat. Use scenes where a number, code or a diagram carries the beat, not everywhere.
