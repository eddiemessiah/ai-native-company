# Shonin

**The work, done.** An AI-native firm for agents and businesses worldwide: agents do the work, a person owns the outcome.

Agents come first. They buy Shonin Check (should I pay this?), Shonin Gate (should I do this?) and Shonin Receipt (did that payment settle?) per call over x402, with no account. Businesses anywhere buy finished work (audits, agents in production, grant applications, company brains) through Stripe, priced per unit against the human alternative. Every job runs on the same split:

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
| [`packages/catalog`](packages/catalog) | The single source of truth: brand, every offer with its unit, rulebook, review layer and price, the paid API routes, Stripe checkout prices, study tracks and chapters. |
| [`packages/agents`](packages/agents) | What agents buy: Shonin Check (code checks of any x402 payment request against the x402 SDK's own token tables, plus an intent check) and Shonin Receipt (settlement read from the chain, matched and signed). |
| [`packages/mcp`](packages/mcp) | `shonin-mcp`: the agent products as MCP tools for Claude, Cursor or any MCP client, paid with the operator's wallet. |
| [`apps/web`](apps/web) | The Next.js 16 site: animated home page with a live decision demo, a filterable directory of every product and service, intake with lead routing, the AI Study Group, the agents page, the research blog and the company page. |
| [`apps/web/app/api/v1`](apps/web/app/api/v1) | Agent-payable endpoints behind x402 v2: check, gate, receipt, triage, lead score, grant fit, content gate. USDC or USDT on Celo; USDC on Base with CDP keys. |
| [`apps/web/app/api/checkout`](apps/web/app/api/checkout) | Stripe Checkout for people: fixed prices and deposits from the catalog, with a webhook that alerts the founder. |
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
| `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET` | Adds Base (USDC) through Coinbase's facilitator, which also lists the endpoints in the x402 Bazaar |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | "Pay and start" buttons on offer pages, and payment alerts |
| `RECEIPT_SIGNING_KEY` | Signs Shonin Receipts (a dedicated key that holds no funds) |

The full list is in [`apps/web/.env.example`](apps/web/.env.example).

## For agents

```bash
# Before your agent pays another API, ask Shonin Check.
curl -i -X POST https://<your-domain>/api/v1/check \
  -H 'content-type: application/json' \
  -d '{"paymentRequired":"<their PAYMENT-REQUIRED header>","url":"https://api.example.com/v1/rates","budgetUsd":0.05}'
# HTTP/1.1 402 Payment Required
# PAYMENT-REQUIRED: <base64 JSON: exact scheme, eip155:42220, USDC, $0.01>
```

Pay with any x402 v2 client (`@x402/fetch` with an EVM account) and retry with `PAYMENT-SIGNATURE`; the answer is `pay`, `confirm` or `block` with the reasons. Settlement happens only when the call succeeds. Discovery: `/llms.txt`, `/.well-known/agent-card.json`, `/agent.json` (ERC-8004), `/api/v1/catalog` and the MCP server in [`packages/mcp`](packages/mcp).

## Deploy (Vercel)

1. Import the repo and set the **Root Directory** to `apps/web`. Keep "Include files outside the root directory" on: the research pages read `content/posts` at build time.
2. Nothing else is required for a first deploy: without `NEXT_PUBLIC_SITE_URL`, the build uses the Vercel production domain. Set it (before building) once you add a custom domain, because llms.txt, the agent card, the sitemap and OG tags bake it in.
3. Add the provider, alert and payment variables above. For Stripe, point a webhook at `/api/stripe/webhook` for `checkout.session.completed`.

The full day-0 list (entity, payments, Telegram bot, x402, ERC-8004) is in [`company/ops/setup-checklist.md`](company/ops/setup-checklist.md).

## Working in parallel

Each product line gets its own branch and worktree, so several agents can work at once:

```bash
pnpm worktree lines     # brain, catalog, web, apis, study, company-brain, research, gtm, ops, agents
pnpm worktree apis      # ../ai-native-company-apis on branch line/apis
```

See [`CLAUDE.md`](CLAUDE.md) for what each line owns.
