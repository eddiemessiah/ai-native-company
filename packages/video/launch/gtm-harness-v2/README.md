# GTM Harness v2: the launch film

A 60-second motion film, rendered from code. `index.html` is the whole film: one timeline in which `seek(t)` sets every element from the time alone. `render.mjs` steps a headless Chromium through it frame by frame and encodes the frames with ffmpeg. The same input always renders the same film.

| Time | Scene | What it shows |
|---|---|---|
| 0–4.6 s | The flood | Drafts rain in; the counter runs to 1,000 |
| 4.6–8.6 s | The line | "Not one should leave without you."; the 承 seal lands |
| 8.6–13.6 s | The title | GTM Harness v2: free, MIT, any model, any agent |
| 13.6–20.2 s | The split | An LLM writes, the brain reviews, code checks, you approve and send |
| 20.2–27.4 s | The workspace | `pnpm gtm new`: AGENTS.md, brain/, skills, campaigns; the model routes |
| 27.4–34 s | The checks | `pnpm gtm check` finds an invented number, an unfilled slot and a banned phrase, each with its fix |
| 34–41.4 s | Telegram | The draft card, the Approve tap, the seal, the signed hash |
| 41.4–46.6 s | WhatsApp | The approved link opens WhatsApp with the message filled in; your tap is the send |
| 46.6–51 s | MCP | The 15 tools, and the send and approve tools that don't exist |
| 51–54.8 s | Kintsugi | A correction becomes a row in `rules/checks.md` |
| 54.8–60 s | End card | The call to action (`--cta`) |

## Truth in the film

Every name on screen is the product's own, from `packages/gtm-harness`:

- the commands;
- the 15 MCP tool names (`src/mcp.ts`);
- the check findings and their fixes, as in `src/check.ts`, shortened to fit the screen;
- "game-changing", from the seeded `rules/checks.md`;
- 61 files and 11 skills (`src/harness.ts`).

The terminal output is condensed from the real output.

Ada, Kola Pay and the 40% claim are a sample workspace, not a customer, and the film makes no claim about results. The end card shows no domain: `shonin.ai` isn't live yet. Pass `--cta` with a URL only once that URL works.

## Render

```bash
# once: the renderer's tools, outside the workspace (no lockfile change)
npm i --prefix ~/.cache/shonin-render playwright-core@1.56.1 ffmpeg-static@5.3.0

cd packages/video/launch/gtm-harness-v2
node render.mjs --format 16x9 --audio --out gtm-harness-v2-16x9.mp4   # X, LinkedIn, YouTube
node render.mjs --format 9x16 --audio --out gtm-harness-v2-9x16.mp4   # Reels, Shorts, TikTok
node render.mjs --format 9x16 --audio --plain --out plain-9x16.mp4    # unbranded, for free-tools-only groups
node render.mjs --format 16x9 --cta "shonin.ai/gtm" --audio           # domain day
node render.mjs --format 16x9 --frames 0,450,1125 --still-dir stills  # a few PNG stills to check a layout
```

| Variable | Default | What it sets |
|---|---|---|
| `RENDER_TOOLS` | `~/.cache/shonin-render/node_modules` | Where playwright-core and ffmpeg-static are |
| `CHROMIUM_PATH` | Playwright's own Chromium | The browser binary |
| `FONT_ROOT` | this repo | A checkout with `pnpm install` done: the fonts come from its fontsource packages, so nothing is fetched |
| `FFMPEG_PATH` | ffmpeg-static | Another ffmpeg |

Each format takes about 3 minutes at 30 fps. Open `index.html` through any local server to watch it loop live.

## Sound

`--audio` adds a soundtrack synthesised from sine waves inside ffmpeg:

- a low pulse;
- a thud when each seal lands (7.2 s, 37.6 s, 38.2 s);
- a bell on the end card (55.2 s).

There is no sample, so there is no licence to keep. Leave `--audio` off to add licensed music in an editor. If a scene's timing changes in `index.html`, move the thud times in `render.mjs` with it.

## Files

Renders are git-ignored (`*.mp4` under `launch/`). Post from the rendered files, and keep them out of the repo.
