# The video line: rollout plan

*Drafted 2026-09-27 for Edidiong. What's built is in PR #3 (`packages/video`). Numbers are our data unless a research file is named.*

## One line

Finished video from a recording or a set of sources:
- clips, trailers, chapters and tighter cuts from a recording;
- sourced explainer shorts;
- the same short in another language.

Code cuts, checks and renders; the brain scores moments and checks facts; a person approves every file. A unit costs cents in software plus minutes of review. A freelancer charges $130–$550 for the same short (`research/explainer-shorts.md` §2a).

## What exists today

| Capability | State | Evidence |
|---|---|---|
| **Video Desk:** clips, trailer, chapters and a tighter cut from one recording | Built; command line | A synthetic 76 s episode: 9:16 clips, a crossfaded trailer, cuts within one frame |
| **Explainer Shorts:** topic and sources in, a sourced short out | Built | The x402 short: 41 s at −14.06 LUFS and −1.89 dBTP, 7 beats, 10 claims checked |
| **Scenes:** number, code, diagram and headline beats via HyperFrames (Apache-2.0) | Built; optional install | A 6 s 1080×1920 scene renders in 13.7 s on 4 cores, identical frame for frame across runs (`research/hyperframes.md`) |
| **Voices:** Azure's Nigerian English voices by default; Kokoro free and offline | Built | Kokoro runs at about 1.3× real time on 4 CPU cores. Azure isn't run yet (no key here) |
| **Cloned voices:** consent registry, and a release gate at render and approval | Built | Walked through: refused without a release, allowed with one, refused after revocation |
| **Dubs:** the same short in another language | Built | The x402 short in French with Kokoro: 42 s, −14.05 LUFS |
| **Controls:** publish packet with AI labels, licence ledger, named approvals | Built | Written on every render; approval refuses a draft voice, a label that's off, a missing disclosure or unlicensed music |

**Not run yet:**
- faster-whisper on real footage;
- Claude writing scripts and translations through the API;
- Jev scoring;
- Azure, OpenAI and ElevenLabs voices;
- Pexels footage;
- VoxCPM2 on a GPU.

This session had no keys, and its network blocked those hosts. Phase 0 runs each of them.

## What we sell

The request covered ad campaigns, podcast edits and promotions, clips and vlogging. It maps onto units like this:

| Request | Unit | Price | Status |
|---|---|---|---|
| Podcast edits and promos, clips, vlogs, livestreams | **Video Desk:** one recording up to 60 min, giving 8 clips, a trailer, chapters and a tighter cut | $200 · ₦100,000. Editors charge $484–$1,675 (`research/video-editing.md`) | `soon` in the catalog |
| Explainers, launches, changelogs, promos from your own material | **Explainer Short:** 30–60 s from your sources | $75 or $720 for 12 · ₦35,000 or ₦360,000 (`research/explainer-shorts.md` §2d) | `soon` |
| The same short for another audience | **Dub:** French now; Swahili after a native listening test | Not priced. Dubbing rates per minute need research first | Not in the catalog |
| Ad campaigns | **Ad variants** | Not offered yet. First we need a rulebook for ad claims, each platform's ad policy and ARCON's AI rules, due at NAC 2026 on 11–13 Nov (`research/voicestudio.md` §6b) | Later |

Every price is set against the human alternative, never against our costs. Edidiong confirms each one.

## Phases, and the gates between them

### Phase 0: our own channel (now to week 2)

- **Do:**
  - 3 episodes of CeloIQ Sessions and Based Conversations through the Video Desk;
  - 5 explainer shorts from our research posts;
  - 1 French dub.
- **Measure:**
  - human minutes per unit, from brief to approval;
  - corrections per unit;
  - render minutes;
  - the first real runs of Whisper, Claude, Jev and Azure.
- **Gate:**
  - 5 shorts and 3 episodes approved by Edidiong;
  - every correction in `ops/rulebook-log.md`;
  - human time per short measured on at least 5;
  - then Edidiong reviews the prices against that time.

### Phase 1: private beta, 3 to 5 paying design partners (weeks 3 to 8)

- **Who:** the warm network: SME website clients, podcasters, and ecosystem teams that ship docs and launches. Follow `ops/conflicts-of-interest.md`: no selling through Celo channels.
- **How:**
  - catalog prices, with `firstJobFree` if Edidiong chooses;
  - each partner gets a named reviewer from the AI Study Group;
  - the rulebook is reviewed every week.
- **Gate:**
  - 30 shorts and 10 recordings delivered;
  - at least 90% on time (24 h a short, 48 h a recording);
  - no more than one revision round per unit on average;
  - no licence, consent or false-claim incident;
  - a positive margin per unit, with human time counted.

### Phase 2: public launch (weeks 9 to 12)

- **Do:** move the offers from `soon` to `beta`, then to `live`. The site already lists offers, takes intake and checks out through Stripe and Paystack.
- **Build:**
  - a job queue and render workers;
  - a review page where the client watches, approves by name or asks for changes;
  - private storage with a retention rule.
- **Gate:**
  - automated QA on every job;
  - turnaround met on at least 95% of units for 4 weeks;
  - support load measured.

### Phase 3: agents and self-serve (after week 12)

- **Agents:** an x402 route that turns sources into a short.
  - x402 settles on the response, and we never charge before the work is done. A render takes minutes, so this needs a design first: either a quote call plus a paid delivery call, or payment on delivery.
- **Self-serve:** upload, pick sources, preview a draft (draft voice), pay for the final. A person still approves anything published.

## From one machine to a service

1. **Intake** (`apps/web`): the order, the recording or sources, and a voice release when a voice is cloned.
2. **Queue.** One job per unit. It moves through the states `status.json` already uses: new, written, checked, rendered, approved, then delivered.
3. **Render workers.**
   - Each is a CPU box with ffmpeg (with libass), HyperFrames 0.8.80 with a headless shell, and the Kokoro server.
   - A 45 s short with 4 scenes renders in 125–171 s on 4 cores.
4. **A GPU box, only for cloned voices and dubs on VoxCPM2.** It needs about 8 GB of VRAM (`research/voicestudio.md` §2). Start it per batch, not around the clock.
5. **Storage.**
   - Private, per client.
   - Client footage is deleted after delivery on a rule Edidiong sets.
   - Footage, transcripts and renders never go into git; that rule already exists.
6. **Review page.** It shows the render and the checks from `review.md`, and records who approved. Dubs also record the native reviewer.

**Software cost per short:**
- voice about $0.014 on Azure (`research/explainer-shorts.md` §6b), or nothing on Kokoro;
- footage nothing on Pexels;
- render 2–3 CPU minutes.

The cost that decides the margin is review time, so Phase 0 measures it.

## Tests and reviews

**Every code change:**
- `pnpm check`: typecheck, plus unit tests with no network. Today: brain 77, video 91, agents 17, gtm-harness 10, mcp 5, catalog 5, web 12.
- **CI: there is none yet.** First action: run `pnpm check` on every pull request (workflow below).
- **A nightly render test** on a fixture short: draft voice, demo brain, no keys. It asserts:
  - frame counts match the timeline;
  - no decode errors;
  - −14 ± 0.5 LUFS;
  - true peak at or under −1 dBTP;
  - clear headline and caption zones;
  - scene frames identical to the night before.

**Every job, already enforced in code:**
- script checks: lengths, quotes, numbers, the AI disclosure, no expert persona;
- the claim checks and the content gate;
- voice licence and clone release;
- AI labels and the music licence;
- loudness, zones and frame counts.

**People:**
- One named approver per unit, and a native speaker per dub.
- Health, money, legal and political shorts go to a person whatever the brain's score, and name their source on screen (`research/explainer-shorts.md` §4).
- Reviewers come from the AI Study Group, as the flywheel in `strategy.md` intends.
- Every week: the corrections log becomes rules, and four numbers go on the dashboard:
  - first-pass approval rate;
  - revisions per unit;
  - human minutes per unit;
  - incidents.

**Incidents:**
- **A wrong claim goes out:** we tell the client within 24 hours, since they posted it, and add a rule.
- **A voice is revoked:** code stops its renders at once, and a person deletes the voice on its server.

## Risks

- **Platforms change their rules.** YouTube tightened its inauthentic-content policy in July 2026 (`research/explainer-shorts.md` §4a). Our answer: the AI label always on, sources on screen, and variety across a client's shorts.
- **Engines change their licences.** OmniVoice went non-commercial on 2026-07-03 (`research/voicestudio.md` §4). The allowlist lives in code; re-check it every quarter.
- **Language coverage.** Nigerian English comes only through Azure. Yoruba, Hausa, Igbo and Pidgin have no licensed synthetic voice yet, so those clients get subtitles or a voice actor.
- **Tool churn.** HyperFrames is at 0.8.x and moves fast; we pin a version and re-test before upgrading.
- **Review time may cost more than the price allows.** We measure it before opening the offer.

## Decisions for Edidiong

1. **A name for the line.** In the tradition of `brand/names.md`: **Dùndún**, the Yoruba talking drum that carries a message from village to village, or **Akụkọ**, Igbo for story. Run the name checks first.
2. **CI:** add the workflow below now?
3. **Dubs:** commission the price research for French and Swahili dubbing before listing the offer.
4. **The GPU for cloned voices:** rent per batch, or wait until a client asks.
5. **Ads:** go or no-go once the ads rulebook research is in.
6. **Retention:** we propose deleting client footage 30 days after delivery unless the contract says otherwise.

## The next ten actions

| # | Action | Owner | Done when |
|---|---|---|---|
| 1 | Add CI: `pnpm check` on every pull request | Video line; Edidiong approves | Green on PR #3 |
| 2 | Merge PR #3 | Edidiong | Merged |
| 3 | Set up the rendering machine: Kokoro server, HyperFrames, ffmpeg | Edidiong, with an agent | `pnpm video doctor` shows a publishable voice and scenes on |
| 4 | An Azure Speech key for the Nigerian English voices | Edidiong | A short rendered with `en-NG-EzinneNeural` |
| 5 | Five shorts from our research posts | An agent writes, Edidiong approves | 5 approved, with times logged |
| 6 | Three episodes through the Video Desk | An agent cuts, Edidiong approves | Clips posted from our accounts |
| 7 | The nightly render test | Video line | Green for 7 nights |
| 8 | Dub price research | Research line | `research/dubbing.md` with sourced rates |
| 9 | Review page spec: watch, approve, ask for changes | Web line | Spec agreed |
| 10 | A release template for cloned voices, reviewed by a lawyer | Edidiong | Signed template on file |

## Proposed CI workflow

`.github/workflows/check.yml`:

```yaml
name: check
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
```

No secrets are needed: the tests never touch the network.
