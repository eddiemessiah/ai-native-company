# CLAUDE.md: operating manual

This repo is **Shonin**, an AI-native firm for agents and businesses worldwide. Agents come first: they buy checks, gates and receipts per call over x402, with no account. Businesses buy finished work (audits, agents in production, grant applications, company brains) priced per unit. Agents do the work; a person owns the outcome. Read this before changing anything.

## Who decides what

The firm is led by a person, Edidiong Umana, and an agent, Shonin One (the decision brain in `packages/brain`).

| Decision | Owner |
|---|---|
| Routing, scoring, triage, drafts, research, first-pass review | Shonin One, logged with its confidence |
| Anything below its confidence gate | Escalates to Edidiong |
| Prices, new offers, what we won't do | Edidiong |
| Money, contracts, signatures, submissions, anything sent in a client's name | Edidiong approves each one; agents only prepare |
| Rulebook changes | An agent proposes them from corrections; Edidiong accepts |

## Layout

```
packages/brain      @repo/brain (proprietary): the System One decision layer. Choice/Score/Noul questions, providers
                    (Jev, then Claude, then a heuristic for free demos), confidence gates, decision log, recipes
packages/catalog    @repo/catalog: the single source of truth for brand, offers, prices, APIs, study tracks, chapters
packages/agents     @repo/agents: what agents buy. Shonin Check (pre-payment checks of x402 requests) and
                    Shonin Receipt (on-chain settlement receipts); Shonin Gate's recipe lives in brain
packages/mcp        @repo/mcp: shonin-mcp, the MCP server that exposes the agent products to any MCP client
packages/video      @repo/video: the Video Desk pipeline. A recording and its transcript in; brain-scored clips,
                    trailers, chapters and tightened cuts out. Also explainer shorts: topic + sources in, a sourced
                    vertical video out. Rendered by ffmpeg
apps/web            Next.js 16 site: home, directory, intake, study group, agents, research, company pages;
                    agent-payable x402 API under app/api/v1; Stripe Checkout under app/api/checkout
content/posts       research blog (markdown + frontmatter), rendered at /research
content/threads     ready-to-post X threads
company/            the company OS: strategy, 7-day sprint, GTM, funding, ops playbooks, rulebook log, names
research/           source research with citations; read it before making a claim
scripts/worktree.sh one git worktree per product line
```

## Commands

```bash
pnpm install
pnpm dev                          # site on :3000; with no keys the demo uses the heuristic brain
pnpm check                        # typecheck + tests in every package; run before each commit
pnpm --filter web build           # production build; set NEXT_PUBLIC_SITE_URL for a custom domain
pnpm --filter @repo/brain test
pnpm --filter @repo/mcp build     # build the shonin-mcp CLI into packages/mcp/dist
pnpm worktree <line>              # open a product line in its own worktree (see below)
pnpm video doctor                 # Video Desk: checks ffmpeg, the transcriber, the brain keys and the font
pnpm video short                  # Explainer shorts: topic + sources → a sourced 30–60 s vertical video
```

Video Desk jobs follow `company/ops/playbooks/video-desk.md`: `pnpm video` ingests a recording, scores it, renders drafts, records who approved each clip, and cuts trailers and tighter long-form edits. Explainer shorts follow `company/ops/playbooks/explainer-shorts.md`: every factual sentence quotes a source, code verifies each quote and number, the brain checks each claim, a person approves. Both need ffmpeg with libass on the PATH.

Env vars are documented in `apps/web/.env.example`.

## The split: apply it to every feature

Every step of every job is exactly one of these:

- **LLM writes:** drafts, briefs, code, summaries.
- **System One decides:** pick from a list (Choice), place on a scale (Score), yes or no (Noul). Use `@repo/brain`.
- **Code executes:** counts, sums, dates, limits, lookups, payments, records. Never ask a model to count or compare dates.
- **A person approves:** anything with money, legal or reputation attached.

About to call an LLM so it outputs a label? Write a Choice instead. About to ask a model whether 3 > 2? Write code.

## Adding a decision

1. Write the questions with `Choice`, `Score` and `Noul` from `@repo/brain`. Always include an "other" option. Make criteria concrete and describe the state fields they depend on.
2. Run `lintQuestions` on them in a test and fix every finding except `negation`, which is informational.
3. Put the routing in a pure function (`routeX(answers)`) and test it with `ScriptedProvider`. Tests never touch the network.
4. Pass `policies` to `brain.decide`, so the gate returns execute, confirm or escalate by risk tier: read .5, write .7, external .85, money .9, irreversible .95. Money and irreversible actions are prepare-only at any confidence.
5. Uncalibrated providers (Claude, the heuristic) get a +0.1 threshold penalty. Keep it.

Recipes live in `packages/brain/src/recipes/`; `lead.ts` is the reference.

## Adding or changing an offer

Edit `packages/catalog/src/offers.ts` and nothing else. The directory, offer pages, llms.txt, the agent card, the sitemap and the 402 payment requirements all read from it, so they can't disagree. Every offer needs a unit (never an hour), a price set against the human alternative, a rulebook, a review layer and the split. `pnpm --filter @repo/catalog test` enforces this.

## Adding a paid API route

1. Add `api: { method, path, priceUsd, description, inputExample }` to the offer.
2. Add a zod schema, a handler and a discovery schema in `apps/web/lib/paid-handlers.ts`.
3. Create `apps/web/app/api/v1/<name>/route.ts`:
   ```ts
   export const runtime = "nodejs";
   export const POST = paid("<slug>", handler, discovery.name);
   ```
4. Return 400 or above on any failure. x402 settles only below 400, so a failed call is never charged. Paid routes use `getPaidBrain()`, which never falls back to the heuristic: no real provider means a 503, not a guess.
5. Price at $0.01 or more. Celo's hosted facilitator costs about $0.001 per settlement.

## Who pays how

- **Agents** pay per call with x402 v2: USDC or USDT on Celo always, and USDC on Base when `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` are set (that also lists us in the x402 Bazaar). The accepts list is built once in `apps/web/lib/x402.ts`; routes don't repeat it.
- **People anywhere** pay through Stripe Checkout for any offer with a `checkout` price in the catalog (`apps/web/app/api/checkout`). The webhook alerts the founder. Paystack stays as the local option in Africa; crypto-native buyers can pay a USDC invoice.
- The amount always comes from the catalog, never from the request.

## The rulebook

A person correcting an agent's output is a new rule. Log it in `company/ops/rulebook-log.md` (date, job, what was wrong, the rule), then fold it into the offer's `rulebook` in the catalog and into the matching playbook in `company/ops/playbooks/`. The rulebook is the moat; don't let corrections evaporate. Rules that come from research or a platform's policy skip the log: add them to the catalog rulebook and the playbook directly, citing the source in `research/`.

## Voice

Plain, specific, short. Lead with a number, a name or a line of code. Every number has a source or says "our data". No hype words, filler openers or emoji walls. One call to action. The full rules are in `company/gtm/content-engine.md`.

## Never

- Send, pay, sign, submit or publish on a client's behalf without a person approving that specific action.
- Copy `@repo/brain` code into MIT-licensed files, or publish it. The brain is proprietary; only the GTM Harness is MIT.
- Let a paid route fall back to the heuristic provider, or answer 2xx when it couldn't do the work.
- Let a model raise a spending limit, an auto-approve limit or a verdict. Shonin Check and Shonin Gate can only lower a verdict.
- Charge before the work is done, or serve paid content without settling.
- Pay our own wallets to inflate volume or reputation.
- Resell raw Jev decisions (`decide-api`) before TypeSafe confirms in writing that its terms allow it.
- Store raw client state in decision logs. The log keeps a hash unless `includeStateInLogs` is set.
- Commit client footage, transcripts or renders. Video jobs live in `video-jobs/`, which git ignores.
- Commit secrets. `.env*` is ignored except `.env.example`.
- Publish a claim, number or proof that isn't in `brand.proofs`, `research/` or our own data.
- Apply to Prezenti Boost, or judge a program we compete in. See `company/ops/conflicts-of-interest.md`.

## Parallel work: one product line per worktree

`pnpm worktree <line>` creates branch `line/<line>` in a sibling checkout, installs dependencies and copies local env files, so agents working in parallel never share a working tree. `pnpm worktree lines` prints this table; keep the two in sync.

| Line | Port | Owns |
|---|---|---|
| brain | 3001 | `packages/brain` |
| catalog | 3002 | `packages/catalog` |
| web | 3003 | `apps/web` pages, components and styles |
| apis | 3004 | `apps/web/app/api/v1`, `lib/x402.ts`, `lib/paid-handlers.ts` |
| study | 3005 | study pages, `catalog/src/study.ts`, the study-group GTM |
| company-brain | 3006 | Company Brain client deployments and playbook |
| research | 3007 | `research/`, `content/posts` |
| gtm | 3008 | `company/gtm`, `content/threads` |
| ops | 3009 | `company/ops`, `company/funding` |
| agents | 3010 | `packages/agents`, `packages/mcp` |
| gtm-harness | 3011 | GTM Harness for founders: `packages/gtm-harness`, `apps/web/app/gtm`, `apps/web/app/api/gtm` |
| video | 3012 | `packages/video`, `company/ops/playbooks/video-desk.md`, `company/ops/playbooks/explainer-shorts.md`, `research/video-editing.md`, `research/explainer-shorts.md` |

Stay inside your line's files. Changes to the public API of `@repo/brain` or `@repo/catalog` go through their own line. Run `pnpm check` before each commit and merge back through a pull request.

## Stack notes

- **Next.js 16:** Turbopack by default, async `params` (`PageProps<'/route'>`), `proxy.ts` instead of middleware. Check `node_modules/next/dist/docs` before assuming an API.
- **Styling:** Tailwind v4 with tokens in `apps/web/app/globals.css`. `--write`, `--decide`, `--code` and `--human` are the split colours (saffron, indigo, bone, kola). Motion v13 comes from `motion/react`. Fonts ship through fontsource, not Google Fonts.
- **Packages:** internal packages are TypeScript source, consumed through `transpilePackages`. Use extensionless relative imports.
- **Claude:** calls default to `claude-opus-5` with structured outputs. Don't downgrade the model to save money; save by skipping the model (code) or by using Jev.
- **x402 v2** (`@x402/*` 2.27.0): headers PAYMENT-REQUIRED, PAYMENT-SIGNATURE and PAYMENT-RESPONSE; networks as CAIP-2 ids (`eip155:42220`). The old unscoped `x402-*` 1.x packages don't support Celo. Token and network tables come from `@x402/evm` (`findDefaultAsset`, `EVM_NETWORK_CHAIN_ID_MAP`); don't hand-copy addresses.
- **Stripe** (`stripe` 22): one client in `apps/web/lib/stripe.ts`. **MCP** (`@modelcontextprotocol/sdk` 1.30): `packages/mcp` is a stdio server; the CLI imports use `.js` extensions because it runs on plain Node.
