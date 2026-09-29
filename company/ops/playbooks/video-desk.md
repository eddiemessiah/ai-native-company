# Playbook: Video Desk

**Unit:** one recording of up to 60 minutes, turned into 8 captioned vertical clips, a trailer of up to 60 seconds, YouTube chapters and a tightened long-form cut. **Price:** $200 per recording (₦100,000), proposed from `research/video-editing.md`; Edidiong confirms it before launch. **Turnaround:** 48 hours.

**Tooling:** `packages/video`. Run `pnpm video` with no arguments for every command.

## Our own shows first

The offer stays `soon` in the catalog until it has shipped our own recordings: CeloIQ Sessions, Based Conversations, workshops and tutorials.

1. Run the first 3 recordings end to end through this playbook, with Edidiong as the approver.
2. Log every trim, reframe, rejection and caption fix in `ops/rulebook-log.md`.
3. Time the review minutes for each recording. Review time is the real cost of this offer; nobody has measured it yet (`research/video-editing.md`, §1e).
4. After 3 recordings, Edidiong reviews the rulebook and the price, then flips `status` to `beta` in `packages/catalog/src/offers.ts`.

## Before the job

- **Consent.** Every guest has agreed to publication, in writing or on the recording itself. No release, no clips of that guest.
- **Intake.** Collect:
  - the recording, plus the transcript if the recording tool exports one;
  - the speakers, with names spelled right;
  - a glossary of products, tickers, people and places;
  - the brand kit and any licensed music;
  - the platforms the clips will run on.
- **Where to run it.** Run jobs on the machine that holds the footage, since recordings are gigabytes. `pnpm video doctor` checks ffmpeg, the transcriber, the brain keys and the font. A cloud session also needs its network policy to allow the footage host and huggingface.co, where the Whisper models download from.

## The job, step by step

| Step | Who | Command |
|---|---|---|
| 1. Transcribe with word timings, glossary in the prompt | Code | `pnpm video transcribe ep.mp4 --glossary "Celo, MiniPay, x402"` |
| 2. Ingest: probe the file, split sentences, create the job | Code | `pnpm video ingest ep.mp4 --transcript ep.whisper.json --title "…"` |
| 3. Score every candidate moment and propose 8 clips | System One decides | `pnpm video plan video-jobs/<job>` |
| 4. Check each frame's 9:16 crop box; move the crop onto the speaker, or use `fit` for screen recordings | Agent, then a person | `pnpm video set <job> 3 --focus 0.7` |
| 5. Render drafts with captions and levelled audio | Code | `pnpm video render <job>` |
| 6. Watch every draft. Approve, trim, reframe or reject each clip | A person | `pnpm video approve <job> 1 2 5 --by "Name"` |
| 7. Write titles, post copy and chapters from `brief.md` | LLM writes | `pnpm video copy <job> copy.json` |
| 8. Check the chapter rules | Code | `pnpm video chapters <job> chapters.txt` |
| 9. Render the finals, the trailer and the tightened cut | Code | `render --approved`, `trailer`, `tighten` |
| 10. Hand over the folder. The client posts; we never post | A person | |

Notes on the steps:
- **Step 3.** Needs `AI_GATEWAY_API_KEY` (Jev) or `ANTHROPIC_API_KEY`. `--demo` ranks with the lexical heuristic: it checks the machinery, never a client's clips.
- **Step 6.** Trims snap to whole sentences (`--end=-3`), or to words with `--exact`. Any change to an approved clip sends it back to proposed.
- **Step 9.** Use `tighten --mode screen` for tutorials: it cuts a pause only where the picture is still too, so silent typing stays in.

## What code checks every time

- Every cut starts and ends on word timings, never mid-word.
- Clips run 140 seconds or less (X without Premium). Plan, set and render all refuse longer clips.
- Audio: two-pass loudnorm to -14 LUFS, aiming at -2 dBTP. In our tests AAC encoding added 0.5 dB of true peak, which the -2 target absorbs so the delivered file stays at or under -1 dBTP (our data, 2026-09-27).
- Titles are 100 characters or less and posts 280 or less; `copy` refuses longer ones.
- Chapters start at 0:00, there are at least 3, and each runs 10 seconds or more. `chapters` snaps them to sentence starts and fails otherwise.
- Every scored moment is logged in `decisions.jsonl` with the provider, model and confidence. The words themselves are stored only as a hash.

## Rulebook

The rules live in the `video-desk` offer in `packages/catalog/src/offers.ts`. The ones a person holds:
- Captions: names, products and numbers are checked against the glossary before a clip ships.
- A flagged clip (money, health or legal claims, or private details said aloud) is checked before approval, whatever its rank.
- Trailers reorder whole sentences. They never splice words into new ones.
- We don't clone voices, add words nobody said, or use music or B-roll without a licence.

Every correction goes into `ops/rulebook-log.md` the same day, with the offer set to `video-desk`.
