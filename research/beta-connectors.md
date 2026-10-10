# Connectors and infrastructure for the hosted beta

**Checked:** Sat 10 Oct 2026. The sandbox proxy blocked several official doc sites (cencori.com, usebuy.ai, core.telegram.org, docs.x.com, developers.google.com, docs.slack.dev, modelcontextprotocol.io). Each fact is marked by how it was checked:

- **[V]:** read from the shipped npm package or its source.
- **[S]:** an official page, seen through a search summary.
- **[3P]:** a third-party page.
- **Unverified:** said so in the line itself.

Recheck any [S] or [3P] line before quoting it publicly.

## Cencori

- **What it is:** a hosted AI layer: a multi-provider gateway (routing, PII filtering, budgets, failover), web search, billing, and embedded agents with an approval step [V, npm `cencori` 1.8.2, 7 Oct 2026].
- **API:**
  - Native chat: `POST https://cencori.com/api/ai/chat`.
  - OpenAI-shaped: `POST https://cencori.com/api/v1/chat/completions`.
  - Auth header: `CENCORI_API_KEY: csk_…`, not `Authorization` [V, SDK source].
  - Unverified: whether the OpenAI SDK works with a Bearer token.
- **SDK:** `npm i cencori`; `cencori/vercel` is an AI SDK provider [V].
- **Pricing:** credits-based [S]. Free-tier terms unverified.
- **Over x402:** `@celo/buy`'s registry lists `cencori/inference` at `gateway.usebuy.ai/cencori/v1/chat/completions` [V]. It costs 0.01 USDC a call, serves one model (`maximo-atlas-1.3`), has no streaming or tools, and is a closed beta.
- **For us:** one more model route, added after the evals. Check conflicts first: Cencori is a partner of the Celo hackathon Edidiong supports.

## `@celo/buy` (usebuy.ai)

- **What it is:** a cLabs CLI and MCP server that pays HTTP 402 challenges with USDC, USDT or USAT on Celo [V, npm 0.8.2, 9 Oct 2026, Apache-2.0].
  - The README says it is pre-1.0, without an external security review, and "not intended for production use".
  - The wallet key lives in the OS keychain.
  - It sends an `X-PAYMENT` header, v1-style naming. Compatibility with our x402 v2 `PAYMENT-SIGNATURE` is unverified.
- **What it can buy** [V, bundled registry]:
  - Google Places and Routes;
  - disposable cloud VMs;
  - a rentable agent browser;
  - about 170 social and data APIs, including X, Instagram, TikTok, Reddit, YouTube and LinkedIn;
  - Chainstack Celo RPC;
  - Cencori inference.
  - No ads products.
- **For us:**
  - Prepare-only. The approval card shows the quoted price.
  - The founder buys locally with `buy curl --max-amount`.
  - No hosted wallet: serverless functions have no keychain, and payments are irreversible.

## Telegram Bot API

- **Posting:** a bot that is an admin of a channel or group can post with `sendMessage` to the numeric id or `@username` [3P].
- **Deep links:** `t.me/<bot>?start=<payload>`. The payload is up to 64 characters from `A–Z a–z 0–9 _ -`, and it arrives as `/start <payload>` [S].
- **Webhooks:**
  - `setWebhook` with `secret_token`. Telegram sends it back as `X-Telegram-Bot-Api-Secret-Token`.
  - Supported ports: 443, 80, 88, 8443.
  - `getUpdates` stops while a webhook is set [3P mirror of the official text].
- **Button presses:** each arrives as a `callback_query`. Always answer it, or the client keeps spinning [3P].
- **Rate limits:** about 1 message per second per chat, and 20 per minute per group [S].
- **Automating a user account:**
  - The API terms forbid acting for a user without their knowledge and consent [S].
  - Accounts on unofficial clients are "put under observation", and spam leads to permanent bans [S].
  - Driving Telegram Web specifically: no official statement found. Treat it as the same risk or higher.
  - **We use the Bot API only.**

## X API v2

- **Posting:** `POST https://api.x.com/2/tweets` with a user-context token.
  - OAuth 2.0 with PKCE (S256).
  - Scopes: `tweet.read tweet.write users.read offline.access`.
  - Access tokens last 2 hours; the refresh token comes only with `offline.access` [S].
- **Price:** pay-per-use, $0.015 a post and $0.20 a post with a URL [S, docs.x.com pricing].
  - When it launched and changed is reported only by third parties (unverified).
  - The Developer Console is the source of truth.
- **For us:** text posts first. Show the cost on the card, and keep a per-workspace spend cap in code.

## Slack

- **Posting:** an incoming webhook posts to one channel with no token.
- **Rate limit:** about 1 message per second per channel [S].
- **Interactive approvals** need a Slack app with a Request URL and signing-secret verification (HMAC-SHA256 of `v0:{timestamp}:{body}`) [S].
- **For us:** the webhook now; interactive approvals later.

## Google Drive and Gmail

- **Testing mode:** at most 100 test users, and their authorisations expire 7 days after consent [S].
- **Unverified apps** with sensitive or restricted scopes are capped at 100 users for life [S].
- **Scopes:**
  - `drive.file`: listed as non-sensitive; one page says sensitive [S, conflicting].
  - `gmail.compose`: restricted. Production needs verification plus an annual CASA assessment [S].
- **For us:**
  - `drive.file` only, after the weekend.
  - Email stays a one-tap `mailto:` or Gmail compose link.

## Remote MCP

- **Spec:** the current revision is 2026-07-28. It is stateless (no `Mcp-Session-Id`), and auth stays OAuth 2.1-style [S].
- **Our SDK:** `@modelcontextprotocol/sdk` 1.30.1 speaks 2025-11-25.
  - It ships `WebStandardStreamableHTTPServerTransport`, whose `handleRequest(Request) → Response` drops into a Next.js route [V].
  - We run it stateless with JSON responses.
- **Clients:**
  - Claude Code: `claude mcp add --transport http … --header "Authorization: Bearer …"`.
  - The Grok API: `tools: [{ type: "mcp", server_url, authorization }]` [S].
  - claude.ai and ChatGPT connectors need OAuth or no auth, not a static header [3P].
  - So OAuth comes after the beta.

## Storage

- **Upstash Redis:** the free tier gives 256 MB and 500K commands a month [S].
- **Env names:** the Vercel integration injects `KV_REST_API_URL`/`KV_REST_API_TOKEN`, or the `UPSTASH_REDIS_REST_*` pair. Sources disagree, so `storeFromEnv` reads both.
- **Neon Postgres:** the free tier gives 0.5 GB [S]. It's for when the audit log needs queries.
