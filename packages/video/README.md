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

## Explainer shorts: a topic and its sources in, a finished short out

Modelled on [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) (MIT): script, voice, captions, visuals and music, assembled automatically. Ours adds the parts that stop it becoming slop: every factual sentence quotes a source, code verifies each quote word for word and each number said aloud, the brain checks each claim against its quote, and a person approves before anything is posted.

```bash
pnpm video short new "x402 on Celo: your API gets paid per call" \
  --source content/posts/x402-on-celo.md --seconds 30-50 --voice edge:en-NG-EzinneNeural
pnpm video short write video-jobs/shorts/x402-on-celo-your-api-gets-paid-per-call   # Claude writes script.json from brief.md
pnpm video short check video-jobs/shorts/x402-on-celo-your-api-gets-paid-per-call   # code checks + content gate + claim checks
pnpm video short render video-jobs/shorts/x402-on-celo-your-api-gets-paid-per-call
pnpm video short approve video-jobs/shorts/x402-on-celo-your-api-gets-paid-per-call --by "Edidiong"
```

| Step | Who | What happens |
|---|---|---|
| `new` | Code | Copies the sources into the job and writes `brief.md`: word budget, rules, the sources with ids |
| `write` | LLM | Claude returns `script.json` through structured outputs: beats of narration, on-screen text, a visual, and claims with quotes. No API key? Any writer can fill in `script.json` from `brief.md` |
| `check` | Code, then System One | Code: 3–10 beats, length at 2.5 words a second, on-screen text ≤ 6 words, title ≤ 100 and post ≤ 280 characters, every quote found in its source, every number backed by a quote. Brain: the content gate on the whole draft, and `claimQuestions` on each claim |
| `render` | Code | Voices each beat, lays the beats on whole frames, builds the visuals, burns in captions and headlines, adds a progress bar, ducks music under the voice, levels to -14 LUFS |
| `approve` | A person | Recorded by name against the exact script that was rendered. Nothing is posted by the tool |

Voices (`--voice`), each optionally followed by `:<voice>`:

| Voice | Needs | Use it for |
|---|---|---|
| `edge` | `pip install edge-tts` | Our own channel and drafts. It's free, and it has Nigerian English voices (`en-NG-EzinneNeural`, `en-NG-AbeoNeural`). It isn't an official API |
| `azure` | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | Client work. It's the licensed route to the same neural voices |
| `openai` | `OPENAI_API_KEY` | Client work |
| `elevenlabs:<voice id>` | `ELEVENLABS_API_KEY` | Client work |
| `say` | macOS | Drafts |
| `pico`, `espeak` | Nothing (offline) | Tests only: they sound robotic |

`auto` picks the best voice that needs no key.

Visuals (`--visuals`): `brand` (a slow beam in the beat's accent colour on the dark ground, drawn by ffmpeg), `stock` (Pexels, with `PEXELS_API_KEY`; each clip is logged in `renders/credits.json`) or `local` (`--local <folder>`: your own clips and photos, matched to each beat by file name).

The pronunciation lexicon in `short.json` changes only what the voice hears (`"x402": "x four oh two"`); captions keep the written form.

## Known limits

- No face tracking. The crop centre is set once per clip, from its frame.
- No speaker labels, and no multi-camera switching.
- Clips from recordings get no added B-roll or music (shorts do: stock, local footage and a ducked music bed).
- `--demo` ranks with the lexical heuristic. That checks the machinery, but it can't tell a good clip from a greeting, or a supported claim from an unsupported one.
- Shorts: caption timing is spread across each beat's voice by word length (the script is known, so there's no transcription); stock search takes Pexels' top portrait result.
