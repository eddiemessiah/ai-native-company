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
pnpm video transcribe ~/Videos/ep12.mp4 --glossary "Celo, MiniPay, x402, Shonin"
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
  --source content/posts/x402-on-celo.md --seconds 30-50 --voice azure:en-NG-EzinneNeural
pnpm video short write video-jobs/shorts/x402-on-celo-your-api-gets-paid-per-call   # Claude writes script.json from brief.md
pnpm video short check video-jobs/shorts/x402-on-celo-your-api-gets-paid-per-call   # code checks + content gate + claim checks
pnpm video short render video-jobs/shorts/x402-on-celo-your-api-gets-paid-per-call
pnpm video short approve video-jobs/shorts/x402-on-celo-your-api-gets-paid-per-call --by "Edidiong"
```

| Step | Who | What happens |
|---|---|---|
| `new` | Code | Copies the sources into the job and writes `brief.md`: word budget, rules, the sources with ids |
| `write` | LLM | Claude returns `script.json` through structured outputs: beats of narration, on-screen text, a visual, and claims with quotes. No API key? Any writer can fill in `script.json` from `brief.md` |
| `check` | Code, then System One | Code: 3–10 beats, length at 2.5 words a second, on-screen text ≤ 6 words, title ≤ 100 and post ≤ 280 characters, the post says the voice is AI, no narrator posing as an expert, every quote found in its source, every number backed by a quote. Brain: the content gate on the whole draft, and `claimQuestions` on each claim |
| `render` | Code | Voices each beat, lays the beats on whole frames, builds the visuals and scenes, burns in captions and headlines, adds a progress bar, ducks music under the voice, levels to -14 LUFS, and writes `publish.json`: the post, the AI labels switched on for YouTube, TikTok and Meta, and every sentence with the passage it rests on |
| `approve` | A person | Recorded by name against the exact script that was rendered. Code refuses a draft voice, a label switched off, a post without the AI disclosure or music without a licence on record. Nothing is posted by the tool |

Voices (`--voice` on `new` or `render`), each optionally followed by `:<voice>`. Approval accepts only the ones marked publishable; the terms behind each are in `research/explainer-shorts.md` §6.

| Voice | Needs | Publishable |
|---|---|---|
| `azure` (default: `en-NG-EzinneNeural`; also `en-NG-AbeoNeural`) | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | Yes. Nigerian English, about $0.014 a short, and a free tier of 0.5M characters a month |
| `local:<voice>` | `LOCAL_TTS_URL`: an OpenAI-compatible server you run, such as our Kokoro server or VoiceStudio; `LOCAL_TTS_MODEL` names the engine | When the engine is in `LOCAL_ENGINES` with commercial weights: Kokoro, VoxCPM2 and the other Apache-2.0 engines. Never OmniVoice |
| `openai:<voice>` | `OPENAI_API_KEY` | Yes |
| `elevenlabs:<voice id>` | `ELEVENLABS_API_KEY`, `ELEVENLABS_PLAN` | On a paid plan only; the Free plan has no commercial licence |
| `edge` | `pip install edge-tts` | No. It imitates Edge's read-aloud client, and its maintainer says it's for personal use. Drafts at most |
| `say` | macOS | No: drafts |
| `pico`, `espeak` | Nothing (offline) | No: robotic, for tests |

`auto` picks Azure, then your local server, then OpenAI, whichever is configured, and otherwise a draft voice. It never picks edge-tts. Render a draft with any voice, then the final with `render --voice azure`.

**Free and offline: Kokoro.** Kokoro-82M's weights are Apache-2.0, so its voices can ship. It has American and British English and French voices, but no Nigerian English. It runs at about 1.3× real time on 4 CPU cores (our data). `scripts/kokoro_server.py` serves it with OpenAI's speech API on your machine:

```bash
pip install kokoro-onnx soundfile
# kokoro-v1.0.int8.onnx and voices-v1.0.bin: github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
python3 packages/video/scripts/kokoro_server.py --model kokoro-v1.0.int8.onnx --voices voices-v1.0.bin
export LOCAL_TTS_URL=http://127.0.0.1:8880/v1
pnpm video short render <job> --voice local:af_heart     # or bf_emma, bm_george; ff_siwis for French
```

The same `local` voice reaches VoiceStudio: set `LOCAL_TTS_MODEL` to an engine id, such as `voxcpm2`. Whether an engine can ship comes from `LOCAL_ENGINES` in `src/short/voice.ts`, which follows `research/voicestudio.md` §3:
- Kokoro, VoxCPM2 and the other Apache-2.0 engines can ship.
- OmniVoice, VoiceStudio's default, is refused at render.
- Anything not listed is a draft.

**Cloned voices need a release** (`research/voicestudio.md` §7c).

A voice on an engine that can clone (VoxCPM2, ElevenLabs, any engine we don't know) counts as someone's clone, unless it's one of the engine's presets or a person has declared it a stock voice. Render and approval each check that an active release covers it. The release has to name:
- the person;
- the one client;
- the languages;
- the uses (shorts, dubs, clips, ads, podcasts);
- the channels;
- the last day of use.

The person also records themselves reading a consent statement that names them, Shonin and the client.

```bash
pnpm video voice add "Ada Obi" --client "Kowry" --languages en,fr --uses shorts,dubs --channels youtube,tiktok \
  --until 2027-09-30 --release ada-release.pdf --consent ada-consent.wav --statement "I, Ada Obi, agree that Shonin …" --by "Edidiong"
pnpm video voice link ada-obi-kowry-2026-09-27 --voice local:ada-obi --engine voxcpm2   # the voice made from her audio
pnpm video voice stock elevenlabs:<id> --name "ElevenLabs library voice" --by "Edidiong"  # a voice that is nobody's clone
pnpm video voice revoke ada-obi-kowry-2026-09-27 --by "Edidiong" --reason "she withdrew consent"
```

`short new --client "<who it's for>" --language fr` sets what the release must cover; our own channel is `Shonin`. Revoking deletes the consent recording (its hash stays), and every later render or approval with that voice fails. The registry is `video-jobs/voices`, which git ignores.

**Dubs.** `short dub` makes the same short in another language from a script that passed its check (`research/voicestudio.md` §7e):

```bash
pnpm video short dub video-jobs/shorts/x402-on-celo --language fr --voice local:ff_siwis   # makes video-jobs/shorts/x402-on-celo-fr
pnpm video short write video-jobs/shorts/x402-on-celo-fr      # Claude translates; code puts back what mustn't change
pnpm video short check video-jobs/shorts/x402-on-celo-fr      # code checks the locks; the brain checks each beat's meaning
pnpm video short render video-jobs/shorts/x402-on-celo-fr
pnpm video short approve video-jobs/shorts/x402-on-celo-fr --by "Edidiong" --native "<native speaker>"
```

The steps split as usual:
- **The LLM translates:** narration, on-screen text, claims, scene text, the title and the post.
- **Code puts back what a translation mustn't change:** each claim's quote and source, code lines, figure values and visual choices.
- **Code checks** that every number is written as the source writes it, that product names survive (x402, USDC, Celo and `--glossary`), and that no beat was left untranslated. The post carries the disclosure in its own language ("Voix générée par IA.").
- **The brain (`checkTranslation`)** checks each beat says what the source says and adds nothing.
- **A native speaker** reads every line before approval.

The English pronunciation lexicon doesn't carry over: put the dub's own in its `short.json`. No commercially licensed synthetic voice speaks Yoruba, Hausa, Igbo or Pidgin yet, so for those, plan subtitles or a voice actor (§7d).

Music needs its licence on record: `--music bed.mp3 --music-licence "<Pixabay certificate or licence id>"`. That's what clears a Content ID claim.

Visuals (`--visuals`): `brand` (a slow beam in the beat's accent colour on the dark ground, drawn by ffmpeg), `stock` (Pexels, with `PEXELS_API_KEY`; each clip is logged in `renders/credits.json`) or `local` (`--local <folder>`: your own clips and photos, matched to each beat by file name).

**Scenes.** Any beat can be a scene instead:
- `number`: a figure;
- `code`: up to six lines of code;
- `diagram`: a flow between two or three parties;
- `headline`: one to three short lines.

Each template takes an optional kicker, shown above the headline.
- **What the writer does:** fills the template's data and nothing else, never HTML.
- **What code checks:** every limit. A figure on screen follows the rule for one said aloud (it must appear in that beat's quotes). A line of code must appear in a source.
- **How it renders:** HyperFrames (Apache-2.0) renders each scene frame by frame, from our own templates, in the brand fonts, fetching nothing. Code re-encodes the result to the beat's exact frame count and checks that the headline and caption zones stayed empty.
- **Where it draws:** in the band above the headline and on the stage between headline and captions, never below the captions.
- **Setup:** install it on the rendering machine with `npm i -g hyperframes@0.8.80`; `pnpm video doctor` shows whether it's there. Without it, scene beats get the brand background and a warning.
- **Cost:** a scene adds about 11 s of render time.
- **Telemetry:** always off.

The checks behind it are in `research/hyperframes.md`.

The pronunciation lexicon in `short.json` changes only what the voice hears (`"x402": "x four oh two"`); captions keep the written form.

## Known limits

- No face tracking. The crop centre is set once per clip, from its frame.
- No speaker labels, and no multi-camera switching.
- Clips from recordings get no added B-roll or music (shorts do: stock, local footage and a ducked music bed).
- `--demo` ranks with the lexical heuristic. That checks the machinery, but it can't tell a good clip from a greeting, or a supported claim from an unsupported one.
- Shorts: caption timing is spread across each beat's voice by word length (the script is known, so there's no transcription); stock search takes Pexels' top portrait result.
- Scenes need HyperFrames and a chrome-headless-shell on the rendering machine. A local render can differ from another machine's by a pixel (fonts and Chrome), so `credits.json` records the Chrome version.
