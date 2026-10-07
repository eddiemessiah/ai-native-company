# GTM Harness

A founder describes their product and gets a go-to-market workspace their agents keep running:

- a plan: an ideal-customer scorecard, where those customers gather, a 7-day sprint and a Monday dashboard;
- three first messages, each checked by a reviewer that can block a draft but never send one;
- a workspace any agent can run: a marketing brain, workflows, a skill per role and a first campaign.

It runs at `/gtm` on Shonin's site, and locally with the `pnpm gtm` CLI.

## The split

- **An LLM writes** the plan, with any model (`src/models.ts`). With no model configured, templates write it.
- **The brain reviews** every draft: ready, revise or blocked (`src/review.ts`).
- **Code packs** the workspace (`src/harness.ts`), checks every approval against the exact text (`src/outbox.ts`) and builds one-tap send links.
- **The founder approves and sends** everything. Nothing in this package messages a prospect.

## Any model

| Set | Route |
|---|---|
| `ANTHROPIC_API_KEY` | Claude through the Anthropic API (`claude-opus-5` unless `GTM_MODEL` names another) |
| `GTM_MODEL=openai/gpt-5` (any `provider/model`) and `AI_GATEWAY_API_KEY`, or the OIDC token on Vercel | Vercel AI Gateway; bring provider keys to the gateway in the Vercel dashboard |
| `GTM_MODEL=provider/model` and `OPENROUTER_API_KEY` | OpenRouter |
| `GTM_BASE_URL` and `GTM_MODEL` (and `GTM_API_KEY`) | Any `/chat/completions` endpoint: xAI, a local model in Ollama or LM Studio |

A `provider/model` id never silently becomes another model: with no router configured, the run falls back to templates and says so. Every route asks for the same strict JSON schema, and `normalizePlan` validates what comes back.

## The workspace

```
AGENTS.md            the manual for any agent (CLAUDE.md imports it)
brain/               brand, product, audience and scorecard, positioning, channels,
                     design, assets, templates, history, observations, lessons
workflows/           router.md (task → skill), tools.md (what's connected), approvals.md
.claude/skills/      source-leads, score-leads, prepare-drafts, review-drafts, follow-up,
                     weekly-review, research-market, plan-campaign, produce-creative,
                     review-campaign, record-learnings
campaigns/<name>/    state, research, brief, concepts, selections, approval, results, outbox/
drafts/  rules/  pipeline.csv  corrections-log.md  sprint.md  dashboard.md
```

The campaign loop is: goal → research → directions → the founder's choice → production → review → results → lessons. Production waits for `approval.md`.

## The CLI

```bash
pnpm gtm doctor                                   # what's connected
pnpm gtm new gtm-workspaces/acme --input acme.json  # build a workspace (any model, or templates)
pnpm gtm review gtm-workspaces/acme               # review drafts, then ask for approval in Telegram
pnpm gtm review gtm-workspaces/acme --local       # …or approve here in the terminal
pnpm gtm wait gtm-workspaces/acme                 # record the Telegram decisions
pnpm gtm links gtm-workspaces/acme                # one-tap send links for approved drafts
pnpm gtm eval --input acme.json --models anthropic/claude-opus-5,openai/gpt-5 --runs 5 --out packages/gtm-harness/evals
```

**Evals before claims.** `pnpm gtm eval` runs the same founder input through each model and writes a table. A model is supported only when every run returns a valid plan and no draft carries a claim-like number the founder didn't give.

Add `--env apps/web/.env.local` to load keys. `examples/shonin.json` is Shonin's own run. `gtm-workspaces/` is git-ignored: it holds leads and approvals.

**Approvals.** Each draft goes to the founder's Telegram chat with Approve and Reject (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`; `GTM_APPROVER_IDS` limits who can approve). Decisions land in `approvals.jsonl`, bound to a hash of the exact text: edit an approved draft and it needs approving again. `GTM_SLACK_WEBHOOK_URL` posts review copies to Slack.

**Sending.** An approved draft becomes a link that opens the app with the message filled in: WhatsApp click-to-chat, an email, an X post, a Telegram share. The founder's tap is the send. LinkedIn and Discord have no such link, so the founder copies the text.

## Use it in code

```ts
import { buildHarness, generatePlan, gtmInputSchema, routeModel, templatePlan } from "@repo/gtm-harness";
import { zipHarness } from "@repo/gtm-harness/zip";

const input = gtmInputSchema.parse(form);
const route = routeModel(process.env);
const { plan } = route ? await generatePlan(input, { route }) : templatePlan(input);
const zip = zipHarness(buildHarness(input, plan, []));
```

`@repo/gtm-harness/outbox` and `@repo/gtm-harness/connectors` are Node-only; the rest is safe in the browser.

## Licence

The MIT licence in `LICENSE` covers:

- this package;
- the page, component and API route marked `SPDX-License-Identifier: MIT` in `apps/web`: `app/gtm/page.tsx`, `components/gtm-harness.tsx` and `app/api/gtm/run/route.ts`.

The draft reviewer runs on `@repo/brain`, Shonin's decision layer, which this licence doesn't cover. Your plan, your drafts and the workspace you download are yours.
