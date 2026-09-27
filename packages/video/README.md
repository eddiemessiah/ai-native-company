# @repo/video: the Video Desk pipeline

A long recording and its transcript go in. Out come captioned vertical clips, a trailer, YouTube chapters and a tighter long-form cut. It uses the firm's split:

- **Code** transcribes, cuts on word timings, removes pauses and fillers, reframes, burns in captions, levels the audio and checks every length.
- **The brain** scores each candidate moment through `clipQuestions` in `@repo/brain`: hook, payoff, whether it stands alone, what kind of moment it is, money claims, private details.
- **An LLM** writes titles, post copy and chapter names from `brief.md`.
- **A person** approves every clip by name. Nothing here publishes anything.

The delivery process is `company/ops/playbooks/video-desk.md`, and the numbers behind the rules are in `research/video-editing.md`.

## Setup

Run it on the machine that holds the footage.

```bash
brew install ffmpeg            # or: sudo apt install ffmpeg · winget install ffmpeg (needs libass, which these have)
pip install faster-whisper     # optional: or bring an SRT, VTT or whisper.cpp JSON
export AI_GATEWAY_API_KEY=…    # Jev through the Vercel AI Gateway, or ANTHROPIC_API_KEY for Claude
pnpm install
pnpm video doctor
```

To reuse the web app's keys: `set -a; source apps/web/.env.local; set +a`.

## A recording, end to end

```bash
pnpm video transcribe ~/Videos/ep12.mp4 --glossary "Celo, MiniPay, x402, Nova"
pnpm video ingest ~/Videos/ep12.mp4 --transcript ~/Videos/ep12.whisper.json --title "CeloIQ Sessions 12"
pnpm video plan video-jobs/celoiq-sessions-12            # scores every moment, proposes 8 clips
open video-jobs/celoiq-sessions-12/review.md              # frames with the 9:16 crop drawn on them
pnpm video set video-jobs/celoiq-sessions-12 3 --focus 0.7   # move the crop onto the speaker
pnpm video render video-jobs/celoiq-sessions-12           # drafts in renders/
pnpm video approve video-jobs/celoiq-sessions-12 1 2 5 --by "Edidiong"
pnpm video copy video-jobs/celoiq-sessions-12 copy.json   # titles and posts written from brief.md
pnpm video render video-jobs/celoiq-sessions-12 --approved
pnpm video trailer video-jobs/celoiq-sessions-12 --seconds 45
pnpm video tighten video-jobs/celoiq-sessions-12          # --mode screen for tutorials
pnpm video chapters video-jobs/celoiq-sessions-12 chapters.txt --tightened
```

Paths are relative to the directory you run pnpm from. Jobs go to `video-jobs/`, which git ignores.

## Transcripts

| Source | How | Word timings |
|---|---|---|
| faster-whisper (MIT) | `pnpm video transcribe`, default model `large-v3-turbo`; `--model small` for quick drafts | Measured |
| whisper.cpp (fast on Apple silicon) | `ffmpeg -i ep.mp4 -ar 16000 -ac 1 ep.wav`, then `whisper-cli -m ggml-large-v3-turbo.bin -f ep.wav -oj -ml 1 -sow` | Measured |
| Your recording tool's SRT or VTT (Riverside, Zoom, YouTube Studio) | pass the file to `ingest` | Spread across each cue, so cuts get extra padding and fillers stay in |

## Formats and framing

- `--format 9x16` (1080×1920, the default for clips), `1x1` or `16x9` (the trailer's default).
- `crop` fills the frame from one region. Its centre is `--focus`: 0 is the left edge, 1 the right. Pick it from the frame in `review.md`.
- `fit` puts the whole frame over a blurred copy. `plan` picks it for `how_to` moments from landscape sources, since screen demos need the whole screen.
- Captions use the brand face, Bricolage Grotesque (OFL-1.1, shipped as a dependency), with the spoken word in saffron.

## Known limits

- No face tracking. The crop centre is set once per clip, from its frame.
- No speaker labels, and no multi-camera switching.
- It doesn't add B-roll or music.
- `--demo` ranks with the lexical heuristic. That checks the machinery, but it can't tell a good clip from a greeting.
