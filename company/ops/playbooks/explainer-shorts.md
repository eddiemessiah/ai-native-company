# Playbook: Explainer Shorts

**Unit:** one sourced vertical explainer of 30–60 seconds, made from a topic and the sources the client supplies or approves, with one revision round.

**Price:** $75 a short or $720 for 12 a month; ₦35,000 or ₦360,000 for Nigerian clients. $75 is 25% of Fiverr's $300 midpoint for a 60-second explainer, and ₦35,000 is 35% of the ₦100,000 midpoint for a Nigerian social animation (`research/explainer-shorts.md` §2d). It's proposed, and Edidiong confirms it after the first 5 shorts. The prices live in the `explainer-shorts` offer in `packages/catalog/src/offers.ts`.

**Turnaround:** 24 hours per short.

**Tooling:** `pnpm video short` in `packages/video`. The engine is modelled on MoneyPrinterTurbo (MIT): topic → script → voice → captions → visuals → music → render. What we add is what makes it sellable: sources, checks and a person.

## Our own channel first

The offer stays `soon` until it has shipped our own shorts:

1. Turn each Shonin research post (`content/posts`) and each launch explainer into one short, with the post itself as the source.
2. Ship 5 shorts from our own posts, with Edidiong approving each one.
3. Log every correction in `ops/rulebook-log.md`: script rewrites, claims cut, pronunciation fixes, visual swaps.
4. Time each short from brief to approval. That time is the real cost of the unit.
5. After 5 shorts, Edidiong reviews the rulebook and the price, then flips `status` to `beta`.

## Before the job

- **Sources.** The client supplies or approves every source. Docs, posts, changelogs and research only; no "general knowledge". If a claim isn't in a source, it isn't in the short.
- **Rights.**
  - Stock footage only from Pexels (`--visuals stock`) or the client's own library (`--visuals local`). Every stock clip is logged in `renders/credits.json` with its id, page, creator and download date.
  - No identifiable person on screen in a short about health, crime or debt, and no third-party logo in a stock shot (Pexels and Pixabay licences, §5).
  - Music only from the client's licensed library, Pixabay Music with its certificate saved, or a paid library licensed for every platform we deliver for. Never TikTok's or Meta's business libraries in a master, never commercial releases (§7). `--music` needs `--music-licence`.
- **Voice.**
  - Published shorts, ours included, use a voice with a commercial licence: `azure` by default (`en-NG-EzinneNeural` or `en-NG-AbeoNeural`), `openai`, `elevenlabs` on a paid plan, or a `local` engine in the allowlist (`LOCAL_ENGINES` in `packages/video/src/short/voice.ts`: Kokoro, VoxCPM2 and the other Apache-2.0 engines). Approval refuses anything else, and render refuses non-commercial engines such as OmniVoice (`research/voicestudio.md` §3).
  - `edge`, `say`, `pico` and `espeak` are for drafts only. edge-tts imitates Edge's read-aloud client and its maintainer says it's for personal use (§6a).
  - Never clone a real person's voice without a signed release and a spoken consent (`research/voicestudio.md` §7c). Code enforces it:
    1. `pnpm video voice add` records the release and the consent recording. The release names the person, the one client, the languages, the uses, the channels and the end date; the recording names the person, Shonin and the client. Edidiong approves every release.
    2. `voice link` ties the release to the voice made from that person's audio.
    3. A voice on an engine that can clone counts as a clone unless it's a preset or declared stock (`voice stock`). Render and approval both refuse a clone that no active release covers.
    4. On revocation (`voice revoke`), code deletes the consent recording, and we delete the voice on its server.
  - Never clone anyone under 18, a politician or public figure, or a voice taken from media the client doesn't own. A person checks this before approving the release; code can't.

## The job, step by step

| Step | Who | Command |
|---|---|---|
| 1. Collect the sources and write the brief: word budget, rules, sources with ids | Code | `pnpm video short new "<topic>" --source <file or url> --seconds 30-50` |
| 2. Write the script: beats, on-screen text, visuals, claims with quotes | LLM writes | `pnpm video short write <job>`, or an agent fills in `script.json` from `brief.md` |
| 3. Check lengths, limits, every quote and every number | Code | `pnpm video short check <job>` |
| 4. Run the content gate on the draft and check each claim against its quote | System One decides | (same command) |
| 5. Fix what failed. Rewrite, don't argue with the check | LLM writes, then a person | edit `script.json`, check again |
| 6. Voice, visuals, captions, music, loudness | Code | `pnpm video short render <job>` |
| 7. Watch it with the sound on and with it off. Read every flagged claim against its source | A person | `review.md` |
| 8. Approve by name. The client posts it from their account with the AI label switched on, using `renders/publish.json` | A person | `pnpm video short approve <job> --by "Name"` |

## What code checks every time

- 3–10 beats; the spoken length (at 2.5 words a second) inside the brief's range; on-screen text of 6 words and 40 characters at most.
- Every quote appears word for word in its source; every number said aloud appears in that beat's quotes.
- Scene beats (`number`, `code`, `diagram`, `headline`): the writer fills the data and never writes HTML.
  - Code checks every limit.
  - A figure shown on screen must appear in that beat's quotes, like one said aloud.
  - A line of code must appear in a source, word for word.
  - After the render, code checks that the headline and caption zones stayed empty, and `credits.json` records the result.
- Title 100 characters at most; post 280 at most (`research/video-editing.md`, §8).
- The post says the voice is AI ("Voiced with AI."), and no narration presents the narrator as a human expert.
- Every render writes `renders/publish.json`: the post, YouTube's `containsSyntheticMedia`, TikTok's AI-generated label and Meta's AI info switched on, and every sentence with the passage it rests on. Approval refuses the render if a label is off, the disclosure is missing, the voice is draft-only, or the music has no licence on record.
- Beats laid on whole frames, so picture and voice never drift; audio at -14 LUFS with true peak at or under -1 dBTP.
- Approval is recorded against the hash of the exact script that was rendered; any edit after the render needs a new render and a new approval.

## Rulebook

The rules live in the `explainer-shorts` offer in `packages/catalog/src/offers.ts`. The ones a person holds:

- One idea per short. The hook is the most surprising specific in the sources, not a greeting.
- An AI narrator never poses as a human expert. Health, money, legal and political shorts name the human or institutional source and go to a person, whatever their score (YouTube's inauthentic-content policy, `research/explainer-shorts.md` §4a).
- Every short puts at least one sourced number, name or date on screen, and one client's shorts vary hook, structure and footage. Never a verbatim reading of a page.
- A claim the brain marks `check` is read against its source before approval. A claim it marks `cut` is rewritten or removed.
- No stock footage that implies a real person endorses the client, and no footage presented as the client's own staff, customers or premises.
- No batch uploads of near-identical shorts. Each short is made from its own source.
- We never post from a client's account; the client approves and posts.

Every correction goes into `ops/rulebook-log.md` the same day, with the offer set to `explainer-shorts`.
