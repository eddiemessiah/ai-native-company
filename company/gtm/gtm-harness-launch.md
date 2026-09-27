# GTM Harness: launch and demo

**Launch:** Tue 29 Sep 2026, on X. **Demo:** Celo Devs Office Hours, Thu 1 Oct 2026.

The product is `/gtm` on the site and `packages/gtm-harness` in the repo. A founder describes their product and gets:

- a plan;
- three first messages, each checked by a reviewer;
- a `.zip` harness folder for Claude Code.

It is free, with no upsell. Many of the founders who use it will be builders in programs Edidiong supports, and those builders get free tools only (`ops/conflicts-of-interest.md`, rule 2).

## Before launch (Mon 28 Sep)

- [ ] Merge the GTM Harness pull request first: it merges into the firm's branch. Then merge the firm's pull request into `main`, which brings both.
- [ ] Make `main` the repository's default branch (it's the feature branch today), so Vercel deploys production from `main`. Then deploy (root directory `apps/web`).
- [ ] Set `ANTHROPIC_API_KEY` on the deployment. Without it, every plan comes from templates.
- [ ] Run it once on a product you know well, and time the run.
  - Read the whole plan. Every number in it must come from the form; nothing is invented.
  - If the run takes more than a minute, change "about a minute" on the page and in the thread.
- [ ] Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Each run then reaches you with its draft verdicts.
- [x] License it. MIT, in `packages/gtm-harness/LICENSE`, with SPDX headers on the page, component and API route, and the page says "free and open source (MIT)". The draft reviewer runs on `@repo/brain`, which the licence doesn't cover.
- [ ] Record a 60-second screen capture of a real run, from the form to the zip opened in Claude Code.

## Launch day (Tue 29 Sep)

- [ ] Post `content/threads/07-gtm-harness.md` with the recording, and pin it.
- [ ] Share it in founder communities you belong to. In Celo channels, share it only as a free tool, with no link to paid offers.
- [ ] Reply within a working day to every founder who runs it, with one question: "What did you change in the drafts?"

## The demo (Thu 1 Oct, Celo Devs Office Hours)

The demo runs ten minutes.

**Prepare:**

- Ask a founder beforehand whether you can run their product live on screen.
- Have three public profiles ready to paste in as leads.

| Minutes | Show | Say |
|---|---|---|
| 0–1 | The page | "You shipped. Now: who do you sell to, and what do you say? This gives you a plan, and agents to keep running it." |
| 1–4 | A live run on the volunteer's product | Read the scorecard aloud: the criteria, the weights, and the 80% line for reaching out. |
| 4–6 | The three drafts and their verdicts | Why a draft with an invented number gets blocked. "The reviewer can block but never send. You send." |
| 6–8 | The zip, opened in Claude Code | Walk through `CLAUDE.md`, `target-customers.md` and the prompts. Paste the three leads and score them with `prompts/scorer.md`. |
| 8–10 | `corrections-log.md` | "Every fix you make becomes a rule. Send me yours." Then give the link. |

If the model is slow or down, the page falls back to templates and says so. Click "Fill an example" (Ajo Circle) and keep going.

**Rules for the demo** (`ops/conflicts-of-interest.md`):

- Say it plainly: "I built this with my firm, Nova. It's free and MIT-licensed, and it stays that way."
- No pitch for paid services, no prices, and no links to the directory.
- Emails from the form are for replies about the tool, never for sales.
- If the room shares one network, raise `GTM_RUNS_PER_HOUR` for the day. The default is 6 runs per IP per hour.

## After the demo (Fri 2 Oct)

- Log every correction a founder sends in `ops/rulebook-log.md`, under the job "GTM Harness".
- A correction that comes up twice becomes a rule in the harness's templates and prompts (`packages/gtm-harness`), made through the gtm-harness line.
- Count the week:
  - runs (from the Telegram alerts);
  - drafts marked ready, revise or blocked;
  - founders who replied;
  - corrections received.
