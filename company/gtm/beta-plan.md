# Shonin GTM: the private beta (10–12 Oct 2026)

**Status:** the build plan for the weekend, written Sat 10 Oct. The goal is a working product by Mon 12 Oct at `staging.edidiongumana.tech`: invite-only, with the invite gate off for now. It moves to `shonin.ai` when the domain works. It continues `harness-plan.md` stage 3, the hosted alpha, and pulls it forward by two weeks. Prices aren't part of the beta: everyone in it is free.

## 1. What a beta user gets

**One line:** your agents run your go-to-market in the tools you already use, and nothing leaves without your yes.

A founder, marketer or operator signs in and describes the product. A minute later they have:

1. **A plan and a workspace.** The scorecard, the channels, the 7-day sprint and the first drafts, written by any model and checked by code. This is the same workspace as the MIT harness.
2. **A Desk.** One queue of everything waiting on them: drafts with the reviewer's verdict and the checker's findings, approvals, and what ran today.
3. **Their tools, connected.**
   - Telegram is the remote control: approve from the phone, ask for a draft in chat, get the daily digest.
   - Slack and their Telegram channel or group take approved updates.
   - X takes approved posts.
   - WhatsApp and email open with the message filled in, so their tap is the send.
4. **Their agents, connected.** Claude Code (with subagents), Codex, Cursor or their own bot reach the workspace through one MCP URL and a token. The agents can read, draft and ask for approval. None of them can send or approve.
5. **A receipt for everything.** Every approval is bound to the hash of the exact text, signed by the server, and logged with what ran.

## 2. The rule that decides every connector

| Where it goes | What happens on approval | Why |
|---|---|---|
| The founder's own channels: an X post, their Telegram channel or group, their Slack channel | **It runs.** The server posts that exact text, then logs the receipt | The founder approved that specific action (`CLAUDE.md`); `harness-plan.md` decision 2 recommended this |
| A person (a prospect, a lead, a partner) on WhatsApp, Telegram DM, email or LinkedIn | **A one-tap link** opens the founder's app with the text filled in; their tap is the send | `CLAUDE.md`: the harness never sends to a prospect |
| Money: ads, data, anything with `buy` | **Prepared only**, at any confidence | Money is prepare-only (`CLAUDE.md`, risk tiers) |

Changing one character of an approved text voids the approval. The server re-checks the hash right before it runs anything.

**What we won't build: driving the founder's Telegram account through Telegram Web.** Edidiong's GrokBot setup did this: it logged into Telegram Web with a QR scan, then clicked and sent as him. It works, but:

- it automates a user account outside Telegram's official APIs, which puts the account at risk;
- it can message anyone as the founder, which the never-send rule forbids;
- a stolen session would be a stolen account.

The beta gets the same experience the official way:

- **A bot as the remote control.** The founder links it with one tap (`t.me/<bot>?start=<code>`). It brings drafts, approvals and the digest to their phone, and takes requests in chat ("draft a post about Friday's demo").
- **The bot in their groups and channels.** Added as an admin, it posts what they approve.
- **The founder's own account:** Telegram's official user API (MTProto, through TDLib) is the only sound route. It stays out of the beta: decision B1 (§9).

## 3. The weekend, by the hour

| When | What ships | Done when |
|---|---|---|
| **Sat night** | This plan; the Claude Design brief (`beta-design-brief.md`); the review (§8). The core package `@repo/gtm-cloud`: store, sessions, invites, workspaces, actions, the signed ledger | `pnpm check` green; the review's must-fix items folded in |
| **Sun morning** | `/beta`: the gate, onboarding (plan to workspace), the Desk, the approval page, the receipts log | A full run on Shonin's own product, approved and logged, in a local build |
| **Sun afternoon** | Connectors: the Telegram bot (link, cards, webhook, posts to groups and channels, draft-by-chat), Slack (webhook), X (OAuth, post), one-tap links; the agent bridge (`/api/beta/mcp`, a token per workspace) | Each connector ran once against the real service from staging |
| **Sun night** | Deploy: a Vercel project on the repo, `staging.edidiongumana.tech`, env set, the Telegram webhook registered | Edidiong runs Shonin's own GTM on staging from his phone |
| **Mon** | Fixes from Sunday's run; five invites out; the demo recording | Five people outside Celo programs are signed in |

Off the weekend, in this order: Google (a Drive export of the plan, then Gmail drafts), the model switcher in the UI (§6), and `buy` (§7).

## 4. Architecture

```
staging.edidiongumana.tech (Vercel, apps/web)
├─ /beta                     gate · onboarding · Desk · approvals · connections · agents · log
├─ /api/beta/*               session, onboarding, drafts, decisions, connector callbacks
│   ├─ telegram/webhook      button presses and chat requests (secret-token header checked)
│   ├─ x/start, x/callback   OAuth 2.0 PKCE; the token is encrypted at rest
│   └─ mcp                   the agent bridge: Streamable HTTP, bearer token per workspace
└─ @repo/gtm-cloud (proprietary)
    ├─ store                 Upstash Redis over REST in production; memory in tests and local dev
    ├─ auth                  invite codes, signed session cookies, BETA_GATE=open|invite
    ├─ workspaces            the harness's files, leads, drafts and settings per workspace
    ├─ actions               draft → review → check → approval (hash-bound) → run or link → receipt
    ├─ ledger                HMAC-signed approvals and receipts; only the server writes them
    └─ connectors            telegram · slack · x · links; each is a pure function with fetch passed in
@repo/gtm-harness (MIT)      plan, review, checks, workspace files: unchanged and reused
@repo/brain                  the reviewer
```

**Choices:**

- **One app.** The beta lives in `apps/web` under `/beta`, so the site, `/gtm` and the beta deploy together. No second app to keep in step.
- **Storage.** Upstash Redis over its REST API, with plain `fetch` and no new dependency. Keys are namespaced per workspace. A memory store runs the tests, so they never touch the network (CI rule).
- **Secrets.** Each workspace's connector tokens are encrypted with AES-256-GCM (`BETA_ENCRYPTION_KEY`) and never sent to the browser.
- **The ledger.** The server signs every approval and receipt (`BETA_SIGNING_KEY`), so an agent with the workspace token can't forge one. This closes the gap the local ledger only narrows.
- **Execution.** Approval and execution are separate steps. The executor reloads the action, checks the hash, checks the connector, runs it, and writes the receipt. A failure leaves the action approved but not run, with the error shown and a retry.
- **Daily cap.** `GTM_MAX_CARDS_PER_DAY` carries over: 15 approval cards a day per workspace.

## 5. The agent bridge

The `pnpm gtm mcp` toolset, served remotely:

- **Tools:** session start and end, status, read, check, leads, add lead, update lead, score lead, due follow-ups, drafts, write draft, request approval, approvals, log correction.
- **Transport:** Streamable HTTP at `/api/beta/mcp`.
- **Auth:** `Authorization: Bearer <workspace token>`. The token is shown once and can be rotated.

Claude Code connects with `claude mcp add --transport http shonin https://staging.edidiongumana.tech/api/beta/mcp --header "Authorization: Bearer …"`. Its subagents (a researcher, a drafter, a reviewer) then share one workspace, and every draft they write lands on the Desk and in Telegram. A custom bot like GrokBot uses the same URL. There is still no send tool and no approve tool.

## 6. Models

- **Plans and drafts** route the way the harness already does: Claude by default, any `provider/model` through AI Gateway or OpenRouter, or any OpenAI-compatible endpoint.
- **The switcher** is a per-workspace setting. It ships after the weekend, once `pnpm gtm eval` has run on four models, because only evaluated models get a place in the menu.
- **Cencori** is a candidate gateway, pending the research below. It goes in as one more OpenAI-compatible route, not as a new code path.

## 7. Infra partners, after the weekend

- **Cencori** (the AI infrastructure partner of the Open Rails hackathon): a model gateway route. The conflict check comes first, because Edidiong works with Cencori through Celo.
- **`buy`** (usebuy.ai, the `@celo/buy` CLI): agents could buy data or services for a campaign. Money is prepare-only, so `buy` would prepare an order and the founder would approve and pay. Nothing is bought on approval alone until decision B3.

## 8. Review before build

The plan goes through the gstack review modes: CEO (scope and the 10-star product), engineering (architecture, edge cases, tests), then design on the brief. The findings and what changed are in §10.

## 9. Decisions for Edidiong

| # | Decision | Recommendation | By |
|---|---|---|---|
| B1 | Telegram as the founder's own account (MTProto user API) | Not in the beta; the bot covers approvals, chat and posting to groups and channels | Later |
| B2 | Approved posts run on the founder's own channels (X, Telegram channel or group, Slack) | Yes; prospects stay one tap | Now: the beta needs it |
| B3 | `buy` in the harness | Prepare-only; revisit after five beta users | After Mon |
| B4 | The gate | Open this weekend; invite codes on before the link is shared beyond friends | Mon |
| B5 | The Vercel team | The domain sits in the `celoiq` team. Host Shonin there only if that team is yours alone; otherwise move the domain or add a personal team | Before deploy |
| B6 | Who's in the first five | Founders and marketers outside the programs you support (`conflicts-of-interest.md`, rule 2) | Mon |

## 10. Review findings

Filled in after the review on Sat night.

## 11. Environment

```
BETA_GATE=open                 # open | invite
BETA_INVITE_CODES=             # comma-separated, used when the gate is invite
BETA_SESSION_SECRET=           # 32+ random bytes, hex
BETA_SIGNING_KEY=              # 32 random bytes, hex: signs approvals and receipts
BETA_ENCRYPTION_KEY=           # 32 random bytes, hex: encrypts connector tokens
KV_REST_API_URL= / KV_REST_API_TOKEN=   # Upstash Redis (Vercel Marketplace); memory store without them
TELEGRAM_BETA_BOT_TOKEN= TELEGRAM_BETA_BOT_USERNAME= TELEGRAM_BETA_WEBHOOK_SECRET=
X_CLIENT_ID= X_CLIENT_SECRET=  # an X developer app with OAuth 2.0, callback /api/beta/x/callback
ANTHROPIC_API_KEY= (or GTM_MODEL + AI_GATEWAY_API_KEY / OPENROUTER_API_KEY)
```
