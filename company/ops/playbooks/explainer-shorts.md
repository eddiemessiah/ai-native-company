# Playbook: Explainer Shorts

**Unit:** one sourced vertical explainer of 30–60 seconds, made from a topic and the sources the client supplies or approves. **Price:** see the `explainer-shorts` offer in `packages/catalog/src/offers.ts`; it's proposed from `research/explainer-shorts.md`, and Edidiong confirms it before launch. **Turnaround:** 24 hours per short.

**Tooling:** `pnpm video short` in `packages/video`. The engine is modelled on MoneyPrinterTurbo (MIT): topic → script → voice → captions → visuals → music → render. What we add is what makes it sellable: sources, checks and a person.

## Our own channel first

The offer stays `soon` until it has shipped our own shorts:

1. Turn each Nova research post (`content/posts`) and each launch explainer into one short, with the post itself as the source.
2. Ship 5 shorts from our own posts, with Edidiong approving each one.
3. Log every correction in `ops/rulebook-log.md`: script rewrites, claims cut, pronunciation fixes, visual swaps.
4. Time each short from brief to approval. That time is the real cost of the unit.
5. After 5 shorts, Edidiong reviews the rulebook and the price, then flips `status` to `beta`.

## Before the job

- **Sources.** The client supplies or approves every source. Docs, posts, changelogs and research only; no "general knowledge". If a claim isn't in a source, it isn't in the short.
- **Rights.**
  - Stock footage only from Pexels (`--visuals stock`) or the client's own library (`--visuals local`).
  - Music only from a licensed library or the client.
  - Every stock clip is logged in `renders/credits.json`.
- **Voice.**
  - Our own channel can use `edge` for drafts and for our posts.
  - For client work, use a voice with a commercial licence (OpenAI, or Azure or ElevenLabs once wired in). The terms are in `research/explainer-shorts.md`.
  - Never clone a real person's voice without their written consent.

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
| 8. Approve by name, then post it from the right account | A person | `pnpm video short approve <job> --by "Name"` |

## What code checks every time

- 3–10 beats; the spoken length (at 2.5 words a second) inside the brief's range; on-screen text of 6 words and 40 characters at most.
- Every quote appears word for word in its source; every number said aloud appears in that beat's quotes.
- Title 100 characters at most; post 280 at most (`research/video-editing.md`, §8).
- Beats laid on whole frames, so picture and voice never drift; audio at -14 LUFS with true peak at or under -1 dBTP.
- Approval is recorded against the hash of the exact script that was rendered; any edit after the render needs a new render and a new approval.

## Rulebook

The rules live in the `explainer-shorts` offer in `packages/catalog/src/offers.ts`. The ones a person holds:

- One idea per short. The hook is the most surprising specific in the sources, not a greeting.
- A claim the brain marks `check` is read against its source before approval. A claim it marks `cut` is rewritten or removed.
- No stock footage that implies a real person endorses the client, and no footage presented as the client's own staff, customers or premises.
- No batch uploads of near-identical shorts. Each short is made from its own source.
- We never post from a client's account; the client approves and posts.

Every correction goes into `ops/rulebook-log.md` the same day, with the offer set to `explainer-shorts`.
