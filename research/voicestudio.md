# VoiceStudio: licences, API, dubbing pipeline and what Shonin can use

*Compiled 2026-09-27 for Shonin's content engine (Edidiong Umana). VoiceStudio was read at commit `3197571` on `main` (2026-09-27), app version 0.5.6.*

**Method.**
- **Read first-hand:**
  - A depth-1 clone of [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio). A `path:line` citation means a file in that clone at that commit.
  - Upstream READMEs and LICENSE files on raw.githubusercontent.com: OmniVoice, VoxCPM, Chatterbox, CosyVoice, MOSS-TTS, MOSS-TTS-Nano, dots.tts, Supertonic, pocket-tts, Confucius4-TTS, KittenTTS, Qwen3-TTS, CSM, Dia, F5-TTS, Fish Speech, index-tts (the bilibili licence), Higgs Audio, Demucs, AudioSeal, Perth, WhisperX, MeloTTS, mlx-audio, sherpa-onnx, GPT-SoVITS, YarnGPT and Omnilingual ASR (including its per-language error table). Also Whisper's `tokenizer.py`.
  - Two third-party licence tables. audio.cpp's [`docs/model_licenses.md`](https://github.com/0xShug0/audio.cpp/blob/main/docs/model_licenses.md) records each model card's licence, "checked" 2026-09-21 or -22. The [AACTools sherpa-onnx TTS registry](https://github.com/AACTools/sherpa-onnx-tts-models) (`models.json`) lists 1,760 models.
  - GitHub pages through WebFetch: the VoiceStudio repo page, [arena-personal-ai PR #228](https://github.com/unic-backend/arena-personal-ai/pull/228), [audio.cpp PR #648](https://github.com/0xShug0/audio.cpp/pull/648), the [omnivoice.cpp README](https://github.com/ServeurpersoCom/omnivoice.cpp) and [sherpa-onnx issue #3947](https://github.com/k2-fsa/sherpa-onnx/issues/3947).
  - The GitHub search API, through the GitHub connector, for the star count.
- **Blocked:**
  - huggingface.co, so no model card was read first-hand;
  - github.com and api.github.com from curl (403);
  - platform pages: blog.youtube, www.tiktok.com, about.fb.com, elevenlabs.io;
  - EU pages: artificialintelligenceact.eu, digital-strategy.ec.europa.eu;
  - arxiv.org, research.google, cert.gov.ng (the NDPA PDF), k2-fsa.github.io;
  - third-party pages: star-history.com, stashbase.ai, promptcrates.com.

  I did not download a model or run the app.

Tags:
- **[REPO]**: a VoiceStudio file and line.
- **[PAGE]**: another page or file read first-hand.
- **[SEARCH]**: seen only in a search summary. Treat as unverified. "Official domain" means I restricted the search to the publisher's own site.
- **"Our arithmetic"**: a number I derived from sourced numbers.

Nothing here is legal advice. Conflicts and weak sources are listed in **Unverified notes** at the end.

---

## 0. TL;DR

1. **VoiceStudio runs locally under AGPL-3.0-only, but its default voice model is non-commercial.** The model behind "646 languages" is k2-fsa's OmniVoice. Its weights changed from Apache-2.0 to CC-BY-NC on 2026-07-03, "due to constraints from its training data (e.g., Emilia)" [PAGE, audio.cpp table]. VoiceStudio's own notice says the same (`LICENSE-NOTICE.md:44-48`) [REPO]. Out of the box, its audio is not usable in paid client work.
2. **It serves an OpenAI-compatible `POST /v1/audio/speech` on port 3900**, plus transcription, a native REST API, dubbing endpoints and an MCP server (`backend/api/routers/openai_compat.py:9-15`) [REPO].
   - Shonin's `local` voice provider can call it unchanged. Set `LOCAL_TTS_MODEL` to an engine id such as `voxcpm2`.
   - Never send `tts-1`: VoiceStudio routes the OpenAI model names to the active engine, which is OmniVoice by default (`openai_compat.py:337-338`) [REPO].
3. **It has 17 TTS engine ids, not 14.**
   - Three of them run the same OmniVoice weights, and two are wrappers around many models (`backend/services/tts_backend.py:3022-3135`) [REPO].
   - **Commercial and able to clone:** VoxCPM2, MOSS-TTS-v1.5, CosyVoice 3, dots.tts, Confucius4-TTS and MOSS-TTS-Nano (Apache-2.0); PocketTTS (CC-BY-4.0); GPT-SoVITS (MIT). IndexTTS 2.5 is conditional.
   - **Non-commercial:** all three OmniVoice ids, audio.cpp's Breeze-TTS-2, OuteTTS inside MLX-Audio, and Meta's MMS voices inside Sherpa-ONNX (§3).
4. **Most of the 646 languages have little training data.** 528 of them have under 20 hours; the median is 10.2 hours (our arithmetic on `docs/lang_id_name_map.tsv`) [REPO]. Yoruba has 15.7 h, Hausa 17.8 h, Igbo 13.7 h and Nigerian Pidgin 11.0 h. A dub also needs speech recognition and translation:
   - Whisper has no Igbo or Pidgin [PAGE].
   - The built-in offline translator, NLLB-200, is CC-BY-NC-4.0 [SEARCH].
5. **How it dubs:**
   - Demucs `htdemucs` splits the voice from the music.
   - WhisperX (Whisper `large-v3`) transcribes with word timings, and pyannote 3.1 separates speakers.
   - Argos, NLLB or an LLM translates.
   - The active engine **clones every speaker from their own source audio by default**.
   - ffmpeg `atempo` and `setpts` fit the timing.
   - The dub is mixed over the separated music bed, and the original audio is kept outside speech.

   There is no lip-sync model. The "Lip sync" button is a timing mode (§5).
6. **Its safeguards are thin.** A spoken "own voice" consent lock is enforced only for outbound phone calls. An AudioSeal watermark is on by default but ships audio unmarked if it fails. Local synthesis, `/v1/audio/speech`, MCP `clone_voice` and dubbing never check consent [REPO] (§6).
7. **Law and platforms require consent and labels:**
   - Nigeria's Data Protection Act treats biometric data as sensitive personal data [SEARCH].
   - EU AI Act Article 50 requires machine-readable marking of synthetic audio and disclosure of deep fakes from 2026-08-02 [SEARCH].
   - YouTube, TikTok and Meta all require an AI label on realistic synthetic voices. TikTok bans AI likenesses of private adults used without their permission [SEARCH, official domains].
8. **Recommendation:**
   - Run VoiceStudio headless in Docker on a GPU box, pinned to `OMNIVOICE_TTS_BACKEND=voxcpm2`, and call it through Shonin's existing `local` provider.
   - Keep the licence allowlist per engine in code.
   - Verify the watermark before approval.
   - Clone only with a signed release plus a spoken consent recording.
   - Sell French and Swahili dubs now.
   - For Yoruba, Hausa, Igbo and Pidgin, sell subtitles and licensed narration first. Sell cloned dubs in those languages only after we fine-tune a commercial model on WAXAL (CC-BY-4.0) and our own consented recordings (§7).

---

## 1. The viral claim, line by line

| Claim | Finding | Source |
|---|---|---|
| "100% FREE replacement for ElevenLabs" | **Partly.**<br>• The app is free under AGPL-3.0-only, "including for commercial and internal business use".<br>• A paid Pro tier adds workflow tools (remote devices, remote workers, GPU sharing) at **$99 per user a year or $299 per user lifetime**.<br>• A separate commercial licence is sold for closed-source embedding.<br>• The default model's weights are non-commercial, so "free" doesn't mean "free for client work" | `LICENSE-NOTICE.md:11-27`; `CHANGELOG.md:19`; `electron/src/renderer/src/features/pro/pro-page.tsx:28-37`; `electron/src/renderer/src/i18n/locales/en.json:3141-3142` [REPO] |
| "runs on your own machine" | **Yes.**<br>• The backend is "loopback-only and unauthenticated by default".<br>• The first run downloads about 2.4 GB of model weights.<br>• Remote services are optional, and analytics needs consent | `docs/api-auth.md:6`; `docs/install/docker.md:84-85`; `README.md:34` [REPO] |
| "19.4K stars" | **Out of date.**<br>• The GitHub API reports **38,469 stars and 4,570 forks on 2026-09-27**; the repo page shows "38.5k". The repo was created 2026-04-09.<br>• The post is dated 2026-09-12 (our arithmetic from its ID). Third-party pages had put the count at 22.8k and 31.4k on unclear dates [SEARCH].<br>• I can't date when the repo passed 19.4K | GitHub search API; [repo page](https://github.com/debpalash/VoiceStudio) [PAGE]; [the post](https://x.com/mikenevermiss/status/2098689336858309094) [SEARCH] |
| "Clone a voice from a clean reference clip" | **Yes.** Accepts clips up to 75 s and recommends 5–15 s of clean speech | `docs/engines/README.md:52-53` [REPO] |
| "dub any video into 646 languages" | **Overstated:**<br>• 646 is OmniVoice's TTS list, and its weights are non-commercial;<br>• 528 of the 646 have under 20 h of training data;<br>• a dub also needs recognition and translation in that language (§4) | `docs/languages.md:3-9` [REPO] |
| "audiobooks, dictation, transcription" | **Yes.** All three are shipped features | `docs/feature-catalog.md:7-19` [REPO] |
| "14 TTS engines" | **17 engine ids today.** One repo page still says "14 engines". MLX-Audio alone wraps "14+" | `tts_backend.py:3022-3135`; `docs/migration/real-time-voice-cloning.md:28`; `docs/engines/mlx-audio.md:3` [REPO] |
| "ElevenLabs supports 32 languages" | **Only one model.** Flash v2.5 supports 32. Eleven v3 lists 74, including Hausa and Swahili | [ElevenLabs models](https://elevenlabs.io/docs/overview/models), official domain [SEARCH] |

---

## 2. What it is

| Item | Finding | Source |
|---|---|---|
| **Licence** | **`AGPL-3.0-only`** (SPDX) in `LICENSE-NOTICE.md`, `package.json` and `pyproject.toml`. GitHub's licence API reports "AGPL-3.0" | `LICENSE-NOTICE.md:5`; `package.json:4`; `pyproject.toml:14` [REPO]; GitHub API [PAGE] |
| **Key terms** | • §2: "unlimited permission to run the unmodified Program". Output is covered "only if the output, given its content, constitutes a covered work" (`LICENSE:143-148`).<br>• §4–6: copies you convey carry the source under the same licence.<br>• §13: if you **modify** it and users interact with it over a network, you must offer them the source (`LICENSE:540-551`).<br>• §15–16: no warranty and no liability | [REPO] |
| **What the licence doesn't cover** | "Model weights, tokenizers, and other third-party assets retain their own terms". The maintainer's commercial licence "does not replace any of those terms" | `LICENSE-NOTICE.md:14-16, 44-48` [REPO] |
| **Licence history** | • Relicensed to FSL-1.1-ALv2 in 0.2.6 (unreleased).<br>• Then to AGPL-3.0 in 0.3.6 (2026-06-16).<br>• Contributors grant the maintainer the right to sell their code under the commercial licence | `CHANGELOG.md:2552-2557, 2236, 2440-2448`; `.github/CONTRIBUTING.md:327-337` [REPO] |
| **Stack** | • Python 3.11 backend (FastAPI and uvicorn, SQLite with Alembic), which bundles the `omnivoice/` model package.<br>• Electron 44 desktop app (React 19, TypeScript, Vite).<br>• A Rust desktop bridge in `native/desktop-bridge`.<br>• Built with Bun.<br>GitHub reports Python as the main language | `.python-version`; `electron/package.json:80-111`; `backend/core/db.py:2` [REPO]; GitHub API [PAGE] |
| **How it runs** | • The Electron desktop app, which is also the web UI in Docker. Tauri was retired at 0.5.3.<br>• A headless backend on **:3900** (REST, OpenAI-compatible routes, WebSockets, MCP at `/mcp`).<br>• A Rust control sidecar on :3902, desktop only.<br>• CLIs: `omnivoice-infer`, `omnivoice-infer-batch` and `omnivoice-dub`. `omnivoice-dub` defaults to `http://localhost:8000`, so pass `--api http://localhost:3900` | `README.md:117`; `docs/speech-platform.md:13-24`; `docs/mcp.md:5-17`; `pyproject.toml:262-266`; `omnivoice/cli/dub.py:124` [REPO] |
| **OpenAI-compatible API** | `POST /v1/audio/speech`, `POST /v1/audio/transcriptions`, `POST /v1/audio/translations`, `GET /v1/models`, `GET /v1/audio/voices`. Errors use OpenAI's `{"error": {...}}` shape; validation failures return 400 | `openai_compat.py:9-21, 589, 1130, 1163, 1218, 1239` [REPO] |
| **Native API** | • `POST /generate` (multipart).<br>• `POST /profiles`: creates a voice, `kind=clone` with `ref_audio`, or `kind=design`.<br>• `POST` and `DELETE /profiles/{id}/consent`.<br>• Dubbing: `/dub/upload`, `/dub/ingest-url`, `/dub/transcribe/{id}`, `/dub/translate`, `/dub/generate/{id}`, `/dub/qc/{id}`, `/dub/download/{id}`, and SRT, VTT and ASS exports.<br>• `POST /watermark/detect`, `POST /models/install`, `GET /engines`, `GET /openapi.json` | `backend/api/routers/` [REPO] |
| **Auth** | Loopback calls need nothing. For other devices, set `OMNIVOICE_API_KEY` and send `Authorization: Bearer <key>`. The Docker guide has you set the key first, because Docker's network makes host calls look remote | `docs/api-auth.md:6-8, 104`; `docs/install/docker.md:52-60` [REPO] |
| **Hardware** | • **CPU only:** KittenTTS, Supertonic-3, PocketTTS, MOSS-TTS-Nano, OmniVoice GGUF (Q4_K_M) and Sherpa-ONNX are built for it. Other engines run, slowly, under a 600 s generation budget.<br>• **GPU:** OmniVoice has a 6 GB VRAM floor; VoxCPM2 needs about 8 GB (upstream); dots.tts 12–16 GB; MOSS-TTS-v1.5 16 GB or more.<br>• **Platforms:** Apple Silicon (MPS and MLX) and AMD ROCm on Linux are supported. Docker images are x86-64 only.<br>• **Disk:** about 10 GB free | `docs/engines/README.md:30-48`; `docs/engines/omnivoice.md:22-27`; `docs/engines/dots-tts.md:27`; `docs/engines/moss-tts-v15.md:22-24`; `docs/install/linux.md:30`; `docs/install/docker.md:14` [REPO]; [VoxCPM README:380](https://github.com/OpenBMB/VoxCPM) [PAGE] |
| **Measured speed** | • The repo's benchmark table says "No verified rows yet".<br>• A maintainer note on a Tesla T4 (16 GB) timed about **1 s** per warm `/v1/audio/speech` request with OmniVoice, after the 2.3 GB download.<br>• VoxCPM2 upstream: real-time factor about 0.30 on an RTX 4090, 0.13 with Nano-vLLM. That's about 18 s and 8 s for 60 s of audio (our arithmetic) | `docs/benchmarks.md:31-37`; `docs/hardware-notes-tesla-t4.md:9-22` [REPO]; [VoxCPM README:378-379](https://github.com/OpenBMB/VoxCPM) [PAGE] |
| **Install** | • macOS or Linux: `curl -fsSL https://voicestudio.sh/install \| sh`.<br>• Release downloads: DMG (macOS 13.3+ on Apple Silicon), MSI (Windows 10 21H2+ or 11), Linux packages.<br>• Docker: `ghcr.io/debpalash/voicestudio`. `:latest` is a rolling preview, so pin `:stable` or a version.<br>• From source: `bun install && bun run setup:api && bun run dev` | `README.md:58-110`; `docs/install/docker.md:34-36` [REPO] |
| **Release** | 0.5.6, dated 2026-09-23 | `CHANGELOG.md:88` [REPO] |

**`/v1/audio/speech` request shape** (`openai_compat.py:183-296`) [REPO]:

```bash
curl http://127.0.0.1:3900/v1/audio/speech \
  -H "Authorization: Bearer $OMNIVOICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"voxcpm2","voice":"<voice profile id>","input":"Karibu tena.","language":"sw","response_format":"wav"}' \
  --output line.wav
```

- `model`:
  - An engine id runs that engine. If the engine is missing, the call returns 400 `model_not_available`, with no fallback.
  - `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts` and dated snapshots run **whatever engine is active**.
  - Anything else, such as `kokoro`, returns 400 `model_not_found` (`openai_compat.py:326-357`).
- `input`: up to 4,096 characters.
- `voice`:
  - a voice-profile id, which supplies the reference clip and transcript;
  - or `"default"`;
  - OpenAI names (`alloy`, `coral` and others) map to the engine's default voice;
  - any other string is passed to the engine as a preset name (`openai_compat.py:641-667`).
- `response_format`: `mp3`, `opus`, `aac`, `flac`, `wav` or `pcm` (24 kHz, 16-bit mono).
- `speed`: 0.25–4.0. `stream_format`: `audio` or `sse`.
- VoiceStudio extensions:
  - `language`;
  - `description` (VoxCPM2 voice design);
  - `instruct`;
  - `duration` (target seconds);
  - `seed`, `num_step` (1–128) and `guidance_scale`.
- Errors:
  - 429 with `Retry-After` when the GPU queue is full;
  - 503 marked retryable when a model is still loading.

No response header names the engine that served the request, so record the engine id from `GET /v1/models` before each job (`openai_compat.py:780-800`).

---

## 3. The TTS engines

### 3a. The 17 engine ids

"Commercial?" means the **weights** licence allows paid client work. "CPU" means the repo or upstream says the engine runs usefully on a CPU.

| Engine id (model) | Weights licence | Commercial? | Clones? | Languages | CPU | Licence source |
|---|---|---|---|---|---|---|
| `omnivoice`: the default (k2-fsa/OmniVoice) | CC-BY-NC since 2026-07-03. Code Apache-2.0. The audio tokenizer is under the Boson Higgs Audio 2 Community License | **No** | Yes | 646 | Runs but slow; use the GGUF build | `LICENSE-NOTICE.md:44-48` [REPO]; audio.cpp table, PR #228 quoting the card [PAGE] |
| `omnivoice-subprocess` (same model in a separate process) | Same | **No** | Yes | 646 | As above | `docs/engines/omnivoice-subprocess.md:3-6` [REPO] |
| `omnivoice-gguf` (Serveurperso/OmniVoice-GGUF) | CC-BY-NC-4.0, inherited | **No** | Yes | 646 | **Yes** (Q4_K_M) | PR #228 quoting the GGUF card [PAGE]; `docs/engines/omnivoice-gguf.md:18-26` [REPO] |
| `voxcpm2` (openbmb/VoxCPM2, 2B) | **Apache-2.0**, "free for commercial use" | **Yes** | Yes, plus voice design | 30, **including Swahili and French** | Runs; CUDA recommended | [VoxCPM README:54-57](https://github.com/OpenBMB/VoxCPM), LICENSE [PAGE]; audio.cpp table [PAGE] |
| `moss-tts-nano` (100M) | Apache-2.0 | Yes | Yes (reference only) | 20, including French | **Yes**, real time on 4 cores | audio.cpp table; MOSS-TTS-Nano LICENSE [PAGE]; `docs/engines/moss-tts-nano.md:3-7` [REPO] |
| `kittentts` (kitten-tts-mini-0.8) | Apache-2.0 | Yes | No (8 preset voices) | English | **Yes**, CPU only | audio.cpp table; KittenTTS README:202-204 [PAGE] |
| `mlx-audio`: a wrapper, code MIT | Per model (§3b). OuteTTS is CC-BY-NC-SA-4.0 | Depends on model | CSM model only | Per model | Apple Silicon only | mlx-audio LICENSE [PAGE]; `docs/engines/mlx-audio.md:3-8, 47-55` [REPO] |
| `cosyvoice` (Fun-CosyVoice3-0.5B-2512) | Apache-2.0 | Yes | Yes | 9 (zh, en, ja, ko, de, es, fr, it, ru) plus 18 Chinese dialects | Runs | audio.cpp table; CosyVoice LICENSE and README:15 [PAGE] |
| `gpt-sovits` (lj1995/GPT-SoVITS; runs as its own server) | MIT | Yes | Yes | zh, en, ja, yue, ko | Separate server | GPT-SoVITS LICENSE [PAGE]; model card MIT [SEARCH] |
| `sherpa-onnx`: a runtime, Apache-2.0 | Per model. Of 1,760 registry models, **1,138 are CC-BY-NC-4.0**, 538 MIT, 38 Apache-2.0 | Depends on model | No | Per model | **Yes** | AACTools registry `models.json` [PAGE]; `docs/engines/sherpa-onnx.md:3-7, 55-60` [REPO] |
| `indextts2` (IndexTTS 2.5) | bilibili Model Use License | **Conditional**:<br>• a separate licence is needed above 100M monthly users or RMB 1bn revenue;<br>• the model can't be used to improve other commercial AI models;<br>• Chinese law governs | Yes, plus emotion control | zh, en, ja, es, ar | Runs | [bilibili licence, §2.2, 3.4(c), 6.1](https://github.com/index-tts/index-tts/blob/main/LICENSE) [PAGE]; `docs/engines/indextts.md:160-174` [REPO] |
| `supertonic3` | BigScience OpenRAIL-M. Its use restrictions apply and must be passed on | Yes, with restrictions | No (7 presets) | 31, including French; **no Swahili** | **Yes**, CPU only | [Supertonic README:550-554](https://github.com/supertone-inc/supertonic) [PAGE]; audio.cpp table [PAGE]. The upstream repo is **archived**, with no security patches (README:1-3) |
| `moss-tts-v15` (8B) | Apache-2.0 | Yes | Yes | 31, **including Swahili and French** | Runs, slowly. A 16 GB+ GPU is the realistic target | [MOSS-TTS README:184, 739](https://github.com/OpenMOSS/MOSS-TTS) [PAGE]; audio.cpp table [PAGE] |
| `dots-tts` (dots.tts-soar, 2B) | Apache-2.0 | Yes | Yes | 24 in its benchmark set, including French; no African language | Slow. Needs a 12–16 GB GPU; no Windows | [dots.tts README:590-625, 781-783](https://github.com/rednote-hilab/dots.tts) [PAGE] |
| `pockettts` (kyutai/pocket-tts, 100M) | CC-BY-4.0 weights, so credit Kyutai; code MIT. The weights are gated on Hugging Face, and Kyutai's terms ban "voice impersonation or cloning without explicit and lawful consent" | Yes, with attribution | Yes | en, fr, de, pt, it, es | **Yes**, CPU only; 8–9x real time on an M3 Pro | audio.cpp table; [pocket-tts README:403](https://github.com/kyutai-labs/pocket-tts) [PAGE]; `docs/engines/pockettts.md:3-7, 35-42` [REPO] |
| `confucius4-tts` | Apache-2.0 | Yes | Yes, across languages | 14, including French | Slow: about 100 s of compute for 6 s of audio | audio.cpp table [PAGE]; `docs/engines/confucius4-tts.md:9, 18-23` [REPO] |
| `audiocpp` (Breeze-TTS-2) | BreezeBlue Research and Non-Commercial License. The bundle also ships Sortformer diarization v1, which is CC-BY-NC-4.0 | **No** | Yes, plus voice design | en, zh | Runs on CPU, Vulkan, Metal or CUDA | `docs/engines/audio-cpp.md:14-22`; `backend/config/models.yaml:48-60` [REPO]; audio.cpp table [PAGE] |

**Read.**
- 17 ids cover 15 model families, since three ids are OmniVoice.
- **Commercially licensed and able to clone:**
  - VoxCPM2, MOSS-TTS-v1.5, CosyVoice 3, dots.tts, Confucius4-TTS and MOSS-TTS-Nano;
  - PocketTTS, with credit to Kyutai;
  - GPT-SoVITS;
  - CSM, through MLX-Audio on Apple Silicon only.
- Of our six dub targets, French is covered by most of these engines. Swahili is covered only by VoxCPM2 and MOSS-TTS-v1.5, plus Chatterbox outside VoiceStudio. Yoruba, Hausa, Igbo and Pidgin are covered by none.

### 3b. Models inside the two wrapper engines

| Wrapper | Model | Weights licence | Clones? | Languages | Source |
|---|---|---|---|---|---|
| MLX-Audio | `kokoro` (Kokoro-82M) | Apache-2.0 | No | 8, including French | audio.cpp table [PAGE]; `research/explainer-shorts.md` §6c |
| MLX-Audio | `csm` (csm-1b) | Apache-2.0 | **Yes**. The only curated model VoiceStudio lets clone | English. Its README: non-English "likely won't do well" | [CSM README:139-147](https://github.com/SesameAILabs/csm) [PAGE]; [model card](https://huggingface.co/sesame/csm-1b) [SEARCH] |
| MLX-Audio | `qwen3-tts` (1.7B VoiceDesign) | Apache-2.0 | Voice design. The Base model does 3-second cloning | 10, including French | audio.cpp table; [Qwen3-TTS README:50](https://github.com/QwenLM/Qwen3-TTS) [PAGE] |
| MLX-Audio | `dia` (Dia-1.6B) | Apache-2.0 | Via an audio prompt | English only | [Dia README:9, 24](https://github.com/nari-labs/dia) [PAGE] |
| MLX-Audio | `chatterbox` (4-bit) | MIT. Every output carries Resemble's Perth watermark | Yes | English. The Multilingual V3 model does 23; the MLX conversion may be the English one | [Chatterbox LICENSE, README:144-147, 173-175](https://github.com/resemble-ai/chatterbox) [PAGE] |
| MLX-Audio | `melotts` (English v3) | MIT | No | English | MeloTTS LICENSE [PAGE] |
| MLX-Audio | `outetts` (Llama-OuteTTS-1.0-1B) | **CC-BY-NC-SA-4.0** | — | — | audio.cpp table [PAGE] |
| Sherpa-ONNX | Meta MMS voices: `mms_yor`, `mms_hau`, `mms_pcm`, `mms_swh` | **CC-BY-NC-4.0** | No | Yoruba, Hausa, Pidgin, Swahili. The registry has no Igbo | AACTools registry [PAGE] |
| Sherpa-ONNX | Piper `sw_CD-lanfrica-medium` | The registry says MIT but links Piper's *code* licence. The voice's own card wasn't read | No | Swahili | AACTools registry [PAGE] |
| Sherpa-ONNX | Piper voices built on the Lessac base | The Lessac dataset allows non-commercial use only. A question about this has been open, unanswered, since 2026-09-10 | No | English and others | audio.cpp table; [sherpa-onnx #3947](https://github.com/k2-fsa/sherpa-onnx/issues/3947) [PAGE] |

### 3c. The traps, checked

| Model | In VoiceStudio? | Weights licence | For client work? | Source |
|---|---|---|---|---|
| Meta MMS-TTS | Only if loaded into Sherpa-ONNX | CC-BY-NC-4.0 | **No** | [facebook/mms-tts](https://huggingface.co/facebook/mms-tts) [SEARCH]; registry [PAGE] |
| Coqui XTTS-v2 | Only through the optional SoniTranslate sidecar, which also bundles Edge TTS, Piper and RVC | Coqui Public Model License 1.0.0: "non-commercial use of a machine learning model **and its outputs**". Coqui shut down in January 2024, so there is no one to buy a commercial licence from | **No** | [coqui/XTTS-v2](https://huggingface.co/coqui/XTTS-v2), [Local AI Master](https://localaimaster.com/blog/xtts-coqui-commercial-license) [SEARCH]; `backend/services/sonitranslate.py:1-6` [REPO] |
| F5-TTS | No | Code MIT. "The pre-trained models are licensed under the CC-BY-NC license due to the training data Emilia" | **No** | [F5-TTS README:276-278](https://github.com/SWivid/F5-TTS) [PAGE] |
| Fish Speech, OpenAudio | No | Code and weights under the "Fish Audio Research License". Fish Speech 1.5 and OpenAudio S1-mini are CC-BY-NC-SA-4.0 | **No** | [fish-speech README:45-46](https://github.com/fishaudio/fish-speech) [PAGE]; audio.cpp table (S2-Pro) [PAGE]; [fish-speech-1.5](https://huggingface.co/fishaudio/fish-speech-1.5) [SEARCH] |
| Kokoro-82M | Via MLX-Audio or Sherpa-ONNX | Apache-2.0 | Yes; no cloning | audio.cpp table [PAGE] |
| Chatterbox | Via MLX-Audio | MIT | Yes, with cloning. Multilingual V3 covers 23 languages, including Swahili and French | Chatterbox LICENSE and README [PAGE] |

Every licence on the founder's list checks out. OmniVoice falls into the same trap as F5-TTS: both were trained on Emilia.

---

## 4. The "646 languages"

- **Source.** Only OmniVoice supplies it, through the ids `omnivoice`, `omnivoice-subprocess` and `omnivoice-gguf`.
  - The repo's `docs/languages.md` copies OmniVoice's own table ("646 languages, 581k hours") [REPO]; upstream's is at [OmniVoice `docs/languages.md`](https://github.com/k2-fsa/OmniVoice/blob/master/docs/languages.md) [PAGE].
  - VoiceStudio says the list "describes the OmniVoice model. Other engines have their own language sets" (`docs/languages.md:5-6`) [REPO].
  - The next-widest engines cover 30–31 languages [REPO].
- **Licence.**
  - Weights: **CC-BY-NC**, changed from Apache-2.0 on 2026-07-03. The model card, as quoted in PR #228: "The pre-trained model is licensed under the CC-BY-NC due to constraints from its training data (e.g., Emilia)" [PAGE].
  - Code: Apache-2.0 [PAGE, upstream LICENSE].
  - The audio tokenizer, `bosonai/higgs-audio-v2-tokenizer`, carries the Boson Higgs Audio 2 Community License [PAGE, audio.cpp table]. A search summary says that licence allows commercial use under 100,000 annual active users [SEARCH].
- **Is it usable for paid client work? No.**
  - CC-BY-NC excludes commercial use. VoiceStudio's paid commercial licence covers only its own code (`LICENSE-NOTICE.md:44-48`) [REPO].
  - Our reading: drafts made for a paying client are commercial use too. That leaves OmniVoice for R&D on our own test scripts only.
- **Depth** (our arithmetic on `docs/lang_id_name_map.tsv`) [REPO]:
  - 581,489 hours in total, but the median language has **10.2 hours**;
  - 265 languages have under 10 h and 528 under 20 h.

| Target language | OmniVoice training hours | Row in `docs/languages.md` |
|---|---|---|
| French | 23,675.32 | line 195 |
| Swahili | 418.41 | line 554 |
| Hausa | 17.75 | line 236 |
| Yoruba | 15.66 | line 655 |
| Igbo | 13.69 | line 258 |
| Nigerian Pidgin | 11.04 | line 434 |

- **Accent.** "In cross-lingual voice cloning ... the generated speech will carry an accent from the reference audio's language" ([OmniVoice README:194](https://github.com/k2-fsa/OmniVoice)) [PAGE]. An English speaker cloned into Yoruba will sound foreign.
- **The rest of the pipeline:**
  - Whisper's language list includes French, Swahili, Yoruba and Hausa, but **not Igbo or Nigerian Pidgin** ([`whisper/tokenizer.py`](https://github.com/openai/whisper/blob/main/whisper/tokenizer.py)) [PAGE].
  - The built-in offline translator, `facebook/nllb-200-distilled-600M` (`backend/services/translation_engines.py:30`) [REPO], is CC-BY-NC-4.0 ([model card](https://huggingface.co/facebook/nllb-200-distilled-600M)) [SEARCH].

---

## 5. How it dubs a video

| Step | What VoiceStudio does | Model or tool (licence) | Source |
|---|---|---|---|
| 1. Ingest | Upload a file, or ingest a URL through yt-dlp, optionally with a cookies file. ffmpeg extracts 16 kHz mono audio for recognition and a full-quality copy for separation | yt-dlp, ffmpeg | `docs/electron-dubbing.md:86-87`; `backend/services/dub_pipeline.py:1361-1370` [REPO] |
| 2. **Separate the voice from the music** | **Yes**: `demucs.separate --two-stems vocals -n htdemucs` writes `vocals.wav` and `no_vocals.wav`. If Demucs fails, it falls back to the mixed audio and warns | Demucs `htdemucs` (MIT) | `dub_pipeline.py:1486-1523` [REPO]; audio.cpp table, Demucs LICENSE [PAGE] |
| 3. Transcribe | WhisperX, the default, with word timestamps. Faster-Whisper, Parakeet, FunASR or any OpenAI-compatible server are alternatives | Whisper `large-v3` (MIT); WhisperX (BSD-2-Clause) | `docs/engines/README.md:72-84`; `backend/services/asr_backend.py:642` [REPO]; WhisperX LICENSE [PAGE] |
| 4. Tell speakers apart | pyannote, or FunASR's built-in speaker labels; a heuristic if neither is set up | `pyannote/speaker-diarization-3.1`: gated on Hugging Face, pipeline MIT [SEARCH]; pyannote.audio code MIT [PAGE] | `backend/config/models.yaml:275-295`; `docs/engines/README.md:86-88` [REPO]; [pyannote.audio LICENSE](https://github.com/pyannote/pyannote-audio) [PAGE]; [model card](https://huggingface.co/pyannote/speaker-diarization-3.1) [SEARCH] |
| 5. Cut voice references | For each speaker, the longest clean 5–15 s passage from the separated vocals. Also a per-line reference of at least 3 s | Code | `backend/services/speaker_clone.py:1-40` [REPO] |
| 6. Translate | • Offline: Argos or NLLB-200 (CC-BY-NC-4.0).<br>• Online: Google's free web endpoint through `deep_translator` (no API key), DeepL, Microsoft, MyMemory.<br>• Any OpenAI-compatible LLM.<br>• "Translate with Agent" hands the dialogue to a local Codex, Claude Code, OpenCode or Pi CLI.<br>• You can also paste your own translation.<br>Quality modes:<br>• Fast: direct machine translation.<br>• Cinematic: an LLM refines it.<br>• Autofit: the LLM also rewrites each line to fit its time slot.<br>A glossary pass and a "reflect" pass cost 3 LLM calls per segment | Per engine | `docs/dubbing/translation-engines.md:3-16, 103-141`; `translation_engines.py:49-120`; `docs/electron-dubbing.md:97-106` [REPO] |
| 7. Predict the fit | Before synthesis, predicts each line's spoken length against its slot plus the silence it can borrow. Badges read "Tight fit" or "Won't fit +Ns". "Suggest shorter lines" asks the LLM for a rewrite | Code; LLM optional | `docs/dubbing/translation-engines.md:142-159` [REPO] |
| 8. Synthesize | The **active** engine, which must be able to clone. The default, `per_line`, clones each line from **that speaker's own source audio**; `consistent` uses one reference per speaker | Active engine: OmniVoice unless pinned | `backend/services/tts_backend.py:3934-3951`; `backend/api/routers/dub_generate.py:1034-1050`; `backend/schemas/requests.py:118-133`; `electron/src/renderer/src/features/dub/dub-session.ts:180-181` [REPO] |
| 9. Align timing | • `concise` (API default): never compresses audio; fails on overflow.<br>• `smart_fit`: speeds audio up by at most 1.2x alone, or 1.5x combined with slowing the video by at most 2.0x.<br>• `stretch_video`: lengthens the video instead.<br>• `strict_slot` (desktop default, labelled "Lip sync"): forces the speech into the original start and end times.<br>Audio is sped up with ffmpeg `atempo`, which keeps pitch; video is slowed with `setpts` | ffmpeg | `requests.py:90-110`; `electron/src/shared/components/dub/DubRightColumn.jsx:105`; `backend/services/fit_planner.py:1-35`; `backend/services/ffmpeg_utils.py:485-510` [REPO] |
| 10. Check quality | A second recognition pass on the dub is compared with the script; lines that drift are flagged. The generated text stays authoritative | ASR | `backend/services/dub_qc.py:1-17` [REPO] |
| 11. Mix | Keeps the original audio outside speech and the Demucs bed inside speech, with 10 ms crossfades. The mono voice is laid over the stereo bed at the bed's original level with ffmpeg `amix` | ffmpeg | `backend/services/dub_background.py:1-40`; `ffmpeg_utils.py:84-109`; `backend/api/routers/dub_export.py:41-60` [REPO] |
| 12. Mark and export | • AudioSeal invisible watermark (on by default).<br>• MP4 with several audio tracks, burned or dual subtitles, karaoke.<br>• SRT, VTT and ASS files; per-language stem ZIPs; WAV or MP3.<br>• The desktop save dialog **overlays a VoiceStudio logo on MP4s** unless you switch it off | AudioSeal (MIT, weights included) | `docs/electron-dubbing.md:108-116`; `backend/api/routers/exports.py:60-80`; `backend/services/watermark.py:318-320` [REPO]; [AudioSeal README:24](https://github.com/facebookresearch/audioseal) [PAGE] |

**Read.**
- The architecture is sound: it separates the voice from the music, keeps the ambience, fits the timing, checks the dub by transcribing it again, and lets a person edit every segment.
- Four defaults are wrong for client work:
  - the non-commercial default engine;
  - automatic cloning of every speaker;
  - `strict_slot` squeezing speech into its slot;
  - translators that are non-commercial (NLLB) or unofficial (Google's free endpoint).
- There is no lip-sync video model; a search for Wav2Lip, LatentSync and MuseTalk in `backend/` found nothing [REPO].

---

## 6. Voice-cloning safeguards, law and platform rules

### 6a. In the app

| Safeguard | What it does | What it doesn't do | Source |
|---|---|---|---|
| "Voice ownership" consent lock | You record yourself reading "I confirm that this voice profile is my own voice, and I consent to VoiceStudio cloning it on my behalf". It stores the text, the audio and a timestamp, and can be revoked. Outbound phone calls enforce it: only your own verified voice or a designed voice may call. Exported voice bundles carry the record as an advisory `consent.json` | • It covers **your own** voice only; there's no flow for a third party's consent.<br>• "The recording is provenance, not a voiceprint check".<br>• The UI says verification "will be required for agentic features and community sharing"; in the code I read, only the phone-call path enforces it.<br>• Local synthesis, `/v1/audio/speech`, MCP `clone_voice` and dubbing never check it | `backend/api/routers/profiles.py:833-937`; `backend/services/telephony/calls.py:455-476`; `backend/services/persona_bundle.py:120-147`; `electron/src/shared/i18n/locales/en.json:1193-1203`; `backend/mcp_server.py:678-708` [REPO] |
| Invisible watermark | AudioSeal embeds a 16-bit message, "OM", through one function (`mark_synthetic`) that every synthesis route calls. It is on by default, and `POST /watermark/detect` checks a file. The code cites EU AI Act Article 50(2) | It **fails open**: "a no-op when AudioSeal isn't installed, and it NEVER raises — on any failure the original audio passes through unchanged". A user can switch it off | `backend/services/watermark.py:65, 299-301, 326-372`; `openai_compat.py:521-543`; `backend/api/routers/watermark.py:19` [REPO] |
| Visible marks | Optional audio signature tone (off by default); logo overlay on desktop MP4 exports (on by default) | Not machine-readable provenance | `watermark.py:313-320`; `exports.py:60-80` [REPO] |
| Licence gates | Supertonic-3 and PocketTTS stay unavailable until you accept their terms in the app | No gate on OmniVoice's non-commercial weights | `docs/engines/supertonic3.md:28-32`; `docs/engines/pockettts.md:35-42` [REPO] |
| README | "Clone voices only with permission" | Not enforced | `README.md:140` [REPO] |

Upstream model terms add more:
- PocketTTS forbids "voice impersonation or cloning without explicit and lawful consent" ([README:403](https://github.com/kyutai-labs/pocket-tts)) [PAGE].
- VoxCPM says "It is strictly forbidden to use VoxCPM for impersonation, fraud, or disinformation", and recommends "clearly marking any AI-generated content" ([README:652](https://github.com/OpenBMB/VoxCPM)) [PAGE].
- CSM says not to mimic "real individuals without their explicit consent" ([README:147](https://github.com/SesameAILabs/csm)) [PAGE].
- Chatterbox watermarks every file with Perth (MIT) ([README:173-175](https://github.com/resemble-ai/chatterbox)) [PAGE].

### 6b. Law

| Where | Rule | Date | Source | Tag |
|---|---|---|---|---|
| Nigeria | The Nigeria Data Protection Act 2023 treats genetic and **biometric data** "for the purpose of uniquely identifying a natural person" as sensitive personal data. Section 30 bars processing it without a listed basis, such as the person's consent | Act 2023. The NDPC's implementing directive (GAID) took effect 2025-09-19 | [FPF](https://fpf.org/blog/nigerias-new-data-protection-act-explained/); [Hogan Lovells](https://www.hoganlovells.com/en/publications/key-changes-brought-by-the-nigerian-data-protection-act-2023); [Aluko & Oyebode](https://www.aluko-oyebode.com/insights/ndpc-gaid-takes-effect-on-19-september-is-your-organisation-prepared/) | [SEARCH] |
| Nigeria | Cybercrimes (Amendment) Act 2024, s.22: impersonating a person or entity is identity theft. Up to 5 years or a ₦7m fine | 2024-02-28 | [Hamu Legal](https://hamulegal.com/highlights-of-cybercrimes-prohibition-prevention-etc-amendment-act-2024/) | [SEARCH] |
| Nigeria | Copyright Act 2022: performers control the recording and reproduction of their performances, including reproduction for purposes they didn't consent to. AI isn't addressed | 2022 | [Mondaq](https://www.mondaq.com/nigeria/copyright/1332056/an-overview-of-the-copyright-act-2022) | [SEARCH] |
| Nigeria | ARCON (the advertising regulator) publicly warned about an AI-faked investment ad using Tinubu, Oyedele and Dangote. It plans to present a digital advertising and AI framework at its conference on 11–13 Nov 2026 | 2026-09-16 | [Brand Communicator](https://brandcom.ng/2026/09/16/arcon-warns-nigerians-against-fake-ai-generated-naira-refinery-investment-ad-on-facebook/); [Marketing Edge](https://marketingedge.com.ng/arcon-set-to-unveil-digital-advertising-and-ai-regulatory-framework-at-nac-2026/) | [SEARCH] |
| EU | AI Act Article 50: providers must mark synthetic audio in a machine-readable, detectable way, and deployers must disclose deep fakes. It applies from 2026-08-02. The "Omnibus" amendment gives systems already on the market before that date until **2026-12-02** for the marking duty | 2026 | [Article 50](https://artificialintelligenceact.eu/article/50/); [Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/); [Usercentrics](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/) | [SEARCH] |
| US, Tennessee | The ELVIS Act bars unauthorized commercial use of a voice "readily identifiable and attributable to a particular individual" | In force 2024-07-01 | [Davis Wright Tremaine](https://www.dwt.com/blogs/artificial-intelligence-law-advisor/2024/04/tennessee-elvis-act-ai-voice-replica) | [SEARCH] |
| US, California | AB 2602: a contract clause allowing a digital replica of someone's voice is unenforceable without a "reasonably specific" description of the uses, and without the person having a lawyer or union in the negotiation | In force 2025-01-01 | [leginfo](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2602) | [SEARCH] |
| US, federal | The NO FAKES Act of 2026 (S.4591) would create a federal right over digital replicas of voice and likeness. The Senate Judiciary Committee advanced it on 2026-06-18. **It is not law** | 2026 | [Congress.gov](https://www.congress.gov/bill/119th-congress/senate-bill/4591); [Holland & Knight](https://www.hklaw.com/en/insights/publications/2026/06/senate-judiciary-committee-advances-legislation-to-protect-name) | [SEARCH] |

### 6c. Platforms

| Platform | Rule | Source | Tag |
|---|---|---|---|
| YouTube | Creators must disclose realistic altered or synthetic content at upload. The examples include "synthetically generating a person's voice to narrate a video". The label sits in the description, or on the video for sensitive topics. Creators who keep failing to disclose risk removal or suspension from the Partner Program. YouTube's own auto-dubbed tracks are labelled "auto-dubbed" | [YouTube Help 14328491](https://support.google.com/youtube/answer/14328491?hl=en), [YouTube blog](https://blog.youtube/news-and-events/disclosing-ai-generated-content/), official domain | [SEARCH] |
| TikTok | Creators must label AI-generated content that contains realistic images, **audio** or video. TikTok doesn't allow AI likenesses of anyone under 18, of adult private figures without their permission, or of public figures used for political or commercial endorsements. Unlabelled AI content may be removed | [Community Guidelines](https://www.tiktok.com/community-guidelines/en/integrity-authenticity), [TikTok Support](https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content), official domain | [SEARCH] |
| Meta (Facebook, Instagram, Threads) | People must use the AI-disclosure tool when they post "photorealistic video or realistic-sounding audio that was digitally created or altered". Meta may penalize those who don't. It shows an "AI info" label | [Meta newsroom, 2024-04](https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/), official domain | [SEARCH] |

**Read.** Every legal and platform source points the same way:
- consent from the person whose voice it is, specific to the use;
- a machine-readable mark;
- a visible label wherever it's published.

VoiceStudio supplies the mark, with gaps, and none of the rest for third-party voices.

---

## 7. What Shonin should copy and build

### 7a. Which engines for which work

| Use | Engines | Why |
|---|---|---|
| **Client work: cloned voices** | **VoxCPM2** first; **MOSS-TTS-v1.5** and **Chatterbox Multilingual V3** as second opinions for Swahili. CosyVoice 3, Confucius4-TTS, dots.tts and PocketTTS for French | Apache-2.0 or MIT (PocketTTS: CC-BY-4.0 with credit). They clone. VoxCPM2 covers 30 languages including Swahili and French, runs at 48 kHz, and does design from a description. Chatterbox runs outside VoiceStudio unless we're on a Mac |
| **Client work: narration, no cloning** | Azure `en-NG` voices (Shonin's default today), Kokoro, KittenTTS | Already cleared in `research/explainer-shorts.md` §6 |
| **Don't use** | IndexTTS 2.5, Supertonic-3, GPT-SoVITS | IndexTTS: conditions and Chinese governing law, and none of our languages. Supertonic-3: no cloning, archived upstream. GPT-SoVITS: none of our languages |
| **R&D only, never client material, never a draft of a paid job** | OmniVoice (all three ids), Breeze-TTS-2 via audio.cpp, OuteTTS, MMS voices, NLLB-200, XTTS-v2 through the SoniTranslate sidecar | Non-commercial weights. Use them only to test whether a language works at all, on our own scripts |
| **Watch** | MLX-Audio, Sherpa-ONNX | The licence depends on the model loaded. Treat them as draft-only unless the model is declared |

VoiceStudio's "design" voice profiles are rendered by the OmniVoice core model (`backend/api/routers/archetypes.py:309-336`; `profiles.py:104-108`) [REPO]. For a designed voice in client work, use VoxCPM2's own description prompt, the `description` field.

### 7b. Integration: VoiceStudio as a local `/v1/audio/speech` server

1. **Host.**
   - Run `ghcr.io/debpalash/voicestudio:0.5.6` on an x86 CUDA box. VoxCPM2 alone needs about 8 GB of VRAM. To A/B against MOSS-TTS-v1.5, size for its "16 GB+"; only one engine stays loaded at a time by default (`docs/performance.md:92`) [REPO].
   - Bind to `127.0.0.1` or Tailscale. Set `OMNIVOICE_API_KEY` and `OMNIVOICE_TTS_BACKEND=voxcpm2`; the variable overrides the UI choice, so dubbing can't slip back to OmniVoice (`docs/engines/omnivoice.md:39-45`) [REPO].
   - Pre-install the weights with `POST /models/install {"repo_id":"openbmb/VoxCPM2"}`. A first call that downloads weights can hit the 300 s timeout (`docs/hardware-notes-tesla-t4.md:9-33`) [REPO].
2. **Shonin's environment**, for the video line's `local` provider:
   - `LOCAL_TTS_URL=http://<host>:3900/v1`;
   - `LOCAL_TTS_KEY=<OMNIVOICE_API_KEY>`, sent as a Bearer token, which VoiceStudio accepts;
   - `LOCAL_TTS_MODEL=voxcpm2`. The code defaults to `kokoro`, which VoiceStudio rejects with 400;
   - `LOCAL_TTS_VOICE=<voice profile id>`. The default `af_heart` is a Kokoro preset;
   - `LOCAL_TTS_LICENCE=Apache-2.0`.

   See `LOCAL_ENGINES` and `speechRequest` in `packages/video/src/short/voice.ts`.
3. **Code changes for the `video` line** (done 2026-09-27: `LOCAL_ENGINES` in `packages/video/src/short/voice.ts`; non-commercial engines are refused at render). `voiceLicence` used to trust one `LOCAL_TTS_LICENCE` string for a server that can run 17 engines. It now uses an allowlist keyed by `LOCAL_TTS_MODEL`:

   | Engine id | Licence | Use |
   |---|---|---|
   | `voxcpm2`, `moss-tts-v15`, `cosyvoice`, `confucius4-tts`, `dots-tts`, `moss-tts-nano`, `kittentts` | Apache-2.0 | publish |
   | `pockettts` | CC-BY-4.0, with a credit line | publish |
   | `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts`, `omnivoice*`, `audiocpp`, `mlx-audio`, `sherpa-onnx` and anything unknown | — | draft, always |

   The current non-commercial pattern `/\bNC\b|non-?commercial|personal|research|evaluation/` doesn't catch "Coqui Public Model License". Add it, and "CPML".
4. **Per job, in code:**
   - Before rendering, call `GET /v1/models` for the installed engines and `GET /health` for the version, and write both to the ledger.
   - After rendering, send each file to `POST /watermark/detect`. If there's no mark, refuse approval: fail closed where VoiceStudio fails open.
5. **Cloning flow:**
   - Create the voice with `POST /profiles` (`kind=clone`, `ref_audio`, `ref_text`, `language`) **only after** Shonin's release record exists (§7c).
   - Store the profile id against the release id.
   - On revocation, call `DELETE /profiles/{id}` and delete the reference clips. OmniVoice keeps encoded references in `prompt_cache/` on disk (`docs/engines/omnivoice.md:88-93`), so check that it's gone.
6. **AGPL.** Calling an unmodified VoiceStudio over HTTP doesn't put Shonin's code under the AGPL. Delivered audio isn't a covered work (`LICENSE:143-148`). If we **modify** VoiceStudio and let clients use it over a network, §13 obliges us to offer them our source (`LICENSE:540-551`) [REPO]. Our reading, not legal advice.

**Copy from VoiceStudio:**
- the OpenAI speech contract with explicit engine ids, typed errors and no silent fallback. It matches our "no 2xx without the work" rule;
- one watermark chokepoint with a test that every synthesis route calls it (`watermark.py:339-346`);
- the spoken consent record: text, audio, timestamp, revocable;
- the fit badges predicted before rendering;
- the second recognition pass on the dub;
- the dialogue-only replacement bed;
- engines that reject an unsupported language instead of speaking it with an accent (`docs/languages.md:5-9`).

**Don't copy:**
- a non-commercial default engine;
- a watermark that fails open;
- cloning every speaker by default;
- OpenAI model aliases that route to "whatever is active";
- scraped translation endpoints.

### 7c. Consent-first voice-cloning policy

1. **No release, no clone** (a person approves). A signed release per voice names:
   - the person, Shonin and the one client;
   - the languages, uses and channels;
   - the term, the fee and how to revoke;
   - that the output will be labelled as AI.

   This follows AB 2602's "reasonably specific" uses and the NDPA's consent basis for biometric data [SEARCH]. Edidiong approves every release.
2. **Spoken consent in the same voice** (code records, a person checks). The speaker reads a statement naming Shonin and the client. Store the text, the audio, a timestamp and a hash, as VoiceStudio's consent lock does, but for third parties.
3. **Voiceprint match** (code). Compare the consent recording with the reference clip using a speaker-embedding model, and block a mismatch. VoiceStudio skips this step [REPO].
4. **Never clone:**
   - anyone under 18;
   - politicians or public figures;
   - anyone who can't sign;
   - voices taken from media the client doesn't own.

   TikTok bans AI likenesses of minors outright, of private adults without their permission, and of public figures in political or commercial endorsements [SEARCH].
5. **Dubbing:** every diarized speaker needs a release. Otherwise that speaker gets a licensed or designed voice, or subtitles. Turn off VoiceStudio's automatic per-line cloning for speakers without a release.
6. **Mark and label.**
   - Watermark every render and verify it in code.
   - Switch on YouTube's altered-or-synthetic disclosure, TikTok's AI-generated label and Meta's AI disclosure on every post with a synthetic voice.
   - Add a line to the description.
   - For EU audiences, Article 50 applies [SEARCH].
7. **Storage.**
   - Reference clips, consent recordings and profiles live only in `video-jobs/` (git-ignored) and on the VoiceStudio data volume.
   - Decision logs keep hashes.
   - Delete the material at job end unless the release allows reuse.
8. **Revocation.** Stop new renders as soon as a revocation arrives, and delete the profile, clips and caches. Published work is handled per the release.
9. **Ledger:** release id, engine id, weights licence, watermark result, approver.

### 7d. Dubbing into African languages

| Language | Commercial TTS that clones | Other commercial options | Non-commercial only (never ship) | Transcription (Omnilingual ASR, Apache-2.0: CER / training hours) | Verdict now |
|---|---|---|---|---|---|
| **French** | VoxCPM2, MOSS-TTS-v1.5, CosyVoice 3, Confucius4-TTS, dots.tts, MOSS-TTS-Nano, PocketTTS (with credit), Chatterbox (MIT) | Kokoro, Qwen3-TTS, Supertonic-3 (presets) | OmniVoice | 2.2 / 4,615 h; Whisper also covers it | **Sell** |
| **Swahili** | VoxCPM2 (CER 1.07% on its own benchmark), MOSS-TTS-v1.5, Chatterbox Multilingual V3 | ElevenLabs v3 [SEARCH] | OmniVoice (418 h); MMS `swh` | 2.8 / 462 h; Whisper also covers it | **Sell**, after a native-speaker listening test |
| **Hausa** | None found | ElevenLabs v3 lists Hausa [SEARCH]; Spitch API (price unknown); YarnGPT2 | OmniVoice (17.8 h); MMS `hau` | 3.5 / 836 h; Whisper also covers it | Subtitles and narration first |
| **Yoruba** | None found | Spitch; YarnGPT2 | OmniVoice (15.7 h); MMS `yor` | 9.0 / 828 h; Whisper also covers it | Subtitles and narration first |
| **Igbo** | None found | Spitch; YarnGPT2 | OmniVoice (13.7 h) | 9.1 / 730 h; **Whisper doesn't** | Subtitles and narration first |
| **Nigerian Pidgin** | None found | None found. To test: Nigerian-English voices (Azure `en-NG`, YarnGPT) reading Pidgin | OmniVoice (11.0 h); MMS `pcm` | 4.6 / 24 h; **Whisper doesn't** | Subtitles, or a human voice actor |

Sources for the table:
- Omnilingual ASR's [licence](https://github.com/facebookresearch/omnilingual-asr) ("code and models are released under the Apache 2.0", README:182) and its [per-language table](https://github.com/facebookresearch/omnilingual-asr/blob/main/per_language_results_table_7B_llm_asr.csv) [PAGE].
- VoxCPM's README:554, for the Swahili CER [PAGE].
- The Chatterbox README:147 [PAGE].
- The sherpa-onnx registry [PAGE].
- `research/explainer-shorts.md` §6c, for Spitch and YarnGPT.
- YarnGPT: its GitHub README says "License: MIT" and was trained on "Nigerian movies, podcasts, and open-source audio", which puts the rights to that data in doubt [PAGE]. The YarnGPT2 model card says Apache-2.0 [SEARCH].

**Plan.**
1. **Now:** French and Swahili dubs with consented cloning on VoxCPM2, with MOSS-TTS-v1.5 or Chatterbox as the A/B voice. English sources.
2. **Now:** Yoruba, Hausa, Igbo and Pidgin as translated, burned-in subtitles plus SRT files. Offer narration by a licensed voice or a human actor.
3. **R&D:** fine-tune VoxCPM2 with LoRA per language.
   - Upstream claims 5–10 minutes of audio adapts it to "a specific speaker, language, or domain" ([README:591](https://github.com/OpenBMB/VoxCPM)) [PAGE]. Test that claim; don't trust it.
   - Train on Google's **WAXAL** TTS recordings. Summaries say they are CC-BY-4.0, cover Hausa, Igbo, Yoruba and Kiswahili, and total about 235 hours across 13 languages ([Google Research](https://research.google/blog/waxal-a-large-scale-open-resource-for-african-language-speech-technology/), [arXiv 2602.02734](https://arxiv.org/abs/2602.02734)) [SEARCH]. Add paid, released recordings of our own speakers.
   - Don't use 9jaVoice Consent-1: it is CC-BY-NC-4.0 [SEARCH].
   - Gate the launch on two things: the dub transcribed back with Omnilingual ASR close to the script (code), and blind approval by native speakers (a person).
4. **Translation:** Claude drafts with a glossary (LLM writes). Code computes each line's time budget. A native speaker approves every line.
   - MADLAD-400 (Apache-2.0) is an offline fallback; its Pidgin coverage is unverified [SEARCH].
   - Never NLLB-200, and never the free Google endpoint.
   - Code flags Yoruba lines that lack tone marks before TTS.

### 7e. The split for one dub job

| Step | Who | What |
|---|---|---|
| Speaker consent lookup | Code | Match each diarized speaker to a release id; missing means no clone |
| Voice source per speaker | System One, Choice | {consented clone, licensed stock voice, designed voice, original audio plus subtitles, other}. Policy: external (.85) |
| Separate, transcribe, diarize | Code | Demucs; Omnilingual ASR or WhisperX; pyannote |
| Translate | LLM writes | One draft per segment, with the glossary |
| Time budget | Code | Predicted seconds, from characters per second for the language, against the slot. Flag lines that won't fit |
| Shorter rewrite | LLM writes | Flagged lines only |
| Translation fidelity | System One, Score | Back-translation against the source, 1–5. Below 4: rewrite or escalate |
| New words in a real mouth | System One, Noul | "Does the target line have the speaker state something absent from the source (a claim, price, endorsement or promise)?" Yes: escalate to Edidiong |
| Render, fit, mix, loudness | Code | Pinned engine; `atempo` at most 1.2x; bed mix; the loudness targets in `research/video-editing.md` §4 |
| Watermark and round-trip check | Code | `POST /watermark/detect`; character error rate per line against the script |
| Disclosure | System One, Choice | Per platform: {AI label plus description line, AI label only, none (not realistic), other}. Code sets the toggles |
| Script and final dub | A person | A native speaker approves each language. Edidiong approves each delivery or post |

---

## For the rulebook

- Never ship audio from OmniVoice. That covers VoiceStudio's default and the `omnivoice-gguf` and `omnivoice-subprocess` ids. Also never ship audio from Breeze-TTS-2 (audio.cpp), OuteTTS, MMS voices, XTTS-v2, F5-TTS or Fish Speech/OpenAudio. Their weights are non-commercial. They are for R&D on our own scripts, never a paid job's drafts. Source: `research/voicestudio.md` §3.
- Call VoiceStudio with an explicit engine id (`"model":"voxcpm2"`). Never send `tts-1`, `tts-1-hd` or `gpt-4o-mini-tts`: VoiceStudio runs them on the active engine, which defaults to OmniVoice.
- Pin `OMNIVOICE_TTS_BACKEND` on any VoiceStudio host we run. Record the engine id and version in the job ledger.
- A local voice's licence comes from a per-engine allowlist in code, not from one environment variable.
- No signed release and spoken consent, no clone. In a dub, every speaker without a release gets a licensed or designed voice, or subtitles.
- Verify the watermark on every synthetic file before approval, and fail closed.
- Every post with a realistic synthetic voice carries the platform's AI label and a line in the description.
- Translation for dubbing: an LLM drafts, code sets the time budget, and a native speaker approves every line. Never use NLLB-200 or the free Google endpoint.
- Switch off VoiceStudio's logo overlay before exporting client MP4s.
- Credit Kyutai when a PocketTTS voice ships.

---

## Unverified notes

- **Access.** No Hugging Face model card loaded. Weights licences come from these, in that order: upstream READMEs and LICENSE files; audio.cpp's table, which says "The license text at the source is what counts"; VoiceStudio's notices; search summaries.
- **OmniVoice's licence.**
  - The CC-BY-NC status and the 2026-07-03 date rest on audio.cpp's table (checked 2026-09-21), PR #228's quote of the card, and VoiceStudio's `LICENSE-NOTICE.md`.
  - Against that: one search summary said the card is tagged Apache-2.0, and the omnivoice.cpp README still says "Apache 2.0" for the weights. Both are probably out of date.
  - The Higgs Audio v2 tokenizer: the "under 100,000 annual active users" condition comes from a search summary. omnivoice.cpp says Apache 2.0.
- **Stars.**
  - 38,469 comes from the GitHub API on 2026-09-27.
  - The 22.8k (star-history) and 31.4k ("early September", promptcrates) figures are search summaries; both pages were blocked.
  - The post's date, 2026-09-12, is decoded from its ID. I couldn't see when the repo passed 19.4K.
- **"14 engines".** It may come from an older README or from MLX-Audio's "14+". Only the current registry (17 ids) was checked; the clone has one commit of history.
- **ElevenLabs.** Summaries of its docs disagree: one lists Igbo in Eleven v3, another doesn't; Yoruba is "not listed". The docs site was blocked.
- **WAXAL.** Summaries give "20 studio hours", "over 180 hours" and "about 235 hours across 13 languages" for the TTS set. The language split and the CC-BY-4.0 licence also come from summaries.
- **Chatterbox Multilingual V3.** Its README calls the repo MIT, and audio.cpp lists `ResembleAI/chatterbox` as MIT. The V3 checkpoint's own card wasn't read.
- **Piper's Swahili voice.** The registry's "MIT" links to Piper's code licence, not to the voice's card.
- **VoxCPM2's Swahili CER** (1.07%) is upstream's own test, scored by a Gemini ASR model. We haven't listened to it.
- **Omnilingual ASR.** Meta's table gives Igbo a CER of 9.1. A separate paper summary reports over 75% *word* error for Igbo on a different test set [SEARCH]. Test on our own audio.
- **Law.**
  - Every legal row is [SEARCH]. The NDPA text itself (cert.gov.ng) was blocked.
  - The Omnibus details come from law-firm and vendor summaries: the 2026-12-02 deadline, and, in one summary, "Regulation (EU) 2026/1744" published 2026-07-24.
  - Whether CC-BY-NC restricts a model's *outputs* isn't settled. We treat non-commercial weights as off-limits for any paid work.
- **Platforms.** YouTube, TikTok and Meta pages were blocked, so all three rows are official-domain search summaries. One secondary source says cloning your own voice for dubs needs no YouTube disclosure (`research/explainer-shorts.md` §4). We label anyway.
- **pyannote 3.1's MIT licence** comes from a search summary; the model card was blocked. The pyannote.audio code is MIT [PAGE]. The pipeline is gated either way.
- **Speed.** VoiceStudio has no verified benchmarks. The T4 "about 1 s" note doesn't give the input length. Measure VoxCPM2 on our own GPU, on our first 10 jobs (our data), before pricing a dub.
