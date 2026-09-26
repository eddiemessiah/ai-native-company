# Nova

**The work, done.** An AI-native firm from Lagos: agents do the work, a person owns the outcome.

Nova sells finished work (audits, agents in production, grant applications, company brains) priced per unit against the human alternative, and sells decisions to other agents per call in USDC on Celo. Every job runs on the same split:

| | Who | Does |
|---|---|---|
| 🟡 | LLM | writes: drafts, briefs, code |
| 🔵 | System One model (Jev) | decides: routes, scores, yes/no, with calibrated confidence |
| ⚪ | Code | executes: counts, dates, limits, payments, records |
| 🔴 | A person | approves anything with money, legal or reputation attached |

## What's in the repo

| Path | What it is |
|---|---|
| [`packages/brain`](packages/brain) | The decision layer. Typed Choice/Score/Noul questions answered in one pass; providers Jev (direct, Vercel AI Gateway or OpenRouter), then Claude, then a heuristic for free demos; per-risk confidence gates; hashed decision logs; recipes for leads, support tickets, grants, study placement, content and a Slack-style teammate. |
| [`packages/catalog`](packages/catalog) | The single source of truth: brand, every offer with its unit, rulebook, review layer and price, the paid API routes, study tracks and chapters. |
| [`apps/web`](apps/web) | The Next.js 16 site: animated home page with a live decision demo, a filterable directory of every product and service, intake with lead routing, the AI Study Group, the agents page, the research blog and the company page. |
| [`apps/web/app/api/v1`](apps/web/app/api/v1) | Agent-payable endpoints (triage, lead score, grant fit, content gate) behind x402 v2 on Celo. |
| [`company/`](company) | The company OS: strategy, the 7-day revenue sprint, GTM, funding, playbooks, the rulebook log. Start at [`company/README.md`](company/README.md). |
| [`research/`](research) | Sourced research: Jev, company-brain, Greg Isenberg's AI-native services, African AI, agent payments, funding. |
| [`content/`](content) | Research posts (rendered at `/research`) and ready-to-post X threads. |
| [`CLAUDE.md`](CLAUDE.md) | The operating manual for agents working in this repo. |

## Quickstart

Needs Node 22+ and pnpm 10.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # every key is optional for local dev
pnpm dev                                       # http://localhost:3000
pnpm check                                     # typecheck + tests
```

With no keys, the homepage demo and intake run on the heuristic provider and the paid API answers 503. Add a key to switch providers:

| Env var | Effect |
|---|---|
| `TYPESAFE_API_KEY` | Jev direct (pin `JEV_MODEL=jev-1.13.0`) |
| `AI_GATEWAY_API_KEY` | Jev through the Vercel AI Gateway, available without the waitlist |
| `OPENROUTER_API_KEY` | Jev through OpenRouter |
| `ANTHROPIC_API_KEY` | Claude fallback (`claude-opus-5`, uncalibrated, so gates demand +0.1) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Every intake and study application lands on your phone |
| `X402_PAY_TO`, `X402_API_KEY` | Turns on the paid API: your receiving wallet and a Celo facilitator key from x402.celo.org |

The full list is in [`apps/web/.env.example`](apps/web/.env.example).

## For agents

```bash
curl -i -X POST https://<your-domain>/api/v1/triage \
  -H 'content-type: application/json' \
  -d '{"message":"Where is my order #1042?"}'
# HTTP/1.1 402 Payment Required
# PAYMENT-REQUIRED: <base64 JSON: exact scheme, eip155:42220, USDC, $0.01>
```

Pay with any x402 v2 client (`@x402/fetch` with a Celo account) and retry with `PAYMENT-SIGNATURE`. Settlement happens only when the call succeeds. Discovery: `/llms.txt`, `/.well-known/agent-card.json`, `/agent.json` (ERC-8004) and `/api/v1/catalog`.

## Deploy (Vercel)

1. Import the repo and set the **Root Directory** to `apps/web`. Keep "Include files outside the root directory" on: the research pages read `content/posts` at build time.
2. Nothing else is required for a first deploy: without `NEXT_PUBLIC_SITE_URL`, the build uses the Vercel production domain. Set it (before building) once you add a custom domain, because llms.txt, the agent card, the sitemap and OG tags bake it in.
3. Add the provider, alert and payment variables above.

The full day-0 list (entity, payments, Telegram bot, x402, ERC-8004) is in [`company/ops/setup-checklist.md`](company/ops/setup-checklist.md).

## Working in parallel

Each product line gets its own branch and worktree, so several agents can work at once:

```bash
pnpm worktree lines     # brain, catalog, web, apis, study, company-brain, research, gtm, ops
pnpm worktree apis      # ../ai-native-company-apis on branch line/apis
```

See [`CLAUDE.md`](CLAUDE.md) for what each line owns.
