# Deploy the beta to staging.edidiongumana.tech

About 20 minutes, from Edidiong's personal Vercel account. Not the `celoiq` team: the firm keeps its own accounts (`conflicts-of-interest.md`, rule 1).

The domain `edidiongumana.tech` lives in the `celoiq` team's Vercel DNS. The project lives in the personal account, and one DNS record points the subdomain at it. Claude's Vercel connection can read the team but can't create projects (403 on 10 Oct), so these steps are yours.

## 0. Before you start

**Accounts and keys:**

- **A Telegram bot** for the beta. In Telegram, open @BotFather, send `/newbot`, name it (for example "Shonin GTM", username `ShoninGtmBot`), and keep the token.
- **An X developer app** (developer.x.com):
  - User authentication: OAuth 2.0, type "Web App".
  - Callback URL: `https://staging.edidiongumana.tech/api/beta/x/callback`.
  - Permissions: read and write.
  - Keep the Client ID and Client Secret.
  - X charges per post: $0.015, or $0.20 with a link (`research/beta-connectors.md`).
- **A model key:** `ANTHROPIC_API_KEY`, or `GTM_MODEL` with `AI_GATEWAY_API_KEY` or `OPENROUTER_API_KEY`.

**Four random secrets.** Run this once on your laptop and keep the output out of chat and out of git:

```bash
for k in BETA_SESSION_SECRET BETA_SIGNING_KEY BETA_ENCRYPTION_KEY TELEGRAM_BETA_WEBHOOK_SECRET BETA_ADMIN_TOKEN; do echo "$k=$(openssl rand -hex 32)"; done
```

## 1. The project (5 minutes)

1. Go to vercel.com/new from your personal account and import `eddiemessiah/ai-native-company`.
2. Project name: `shonin-staging`. Root Directory: `apps/web`. Leave the other defaults.
3. **Production branch:** Settings → Git → Production Branch → `claude/eager-wozniak-eoex2g`, the branch the beta is on. Switch it to `main` once the beta is merged there.

## 2. Storage (2 minutes)

Go to the project → Storage → Marketplace → **Upstash** (Redis) → create the free database and connect it to the project. It injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or the `UPSTASH_REDIS_REST_*` pair; the app reads either.

Without it, the beta refuses to run in production rather than lose state between requests.

## 3. Environment variables (Production and Preview)

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://staging.edidiongumana.tech` |
| `BETA_SITE_URL` | `https://staging.edidiongumana.tech` |
| `BETA_GATE` | `open` (switch to `invite` and set `BETA_INVITE_CODES=code1,code2` before sharing widely) |
| `BETA_SESSION_SECRET`, `BETA_SIGNING_KEY`, `BETA_ENCRYPTION_KEY` | From step 0 |
| `BETA_ADMIN_TOKEN` | From step 0 |
| `TELEGRAM_BETA_BOT_TOKEN` | From BotFather |
| `TELEGRAM_BETA_BOT_USERNAME` | The bot's username, without @ |
| `TELEGRAM_BETA_WEBHOOK_SECRET` | From step 0 |
| `X_CLIENT_ID`, `X_CLIENT_SECRET` | From the X app |
| `ANTHROPIC_API_KEY` | Your key (or the gateway pair) |
| `GTM_MAX_CARDS_PER_DAY` | `15` |

Then redeploy: Deployments → the latest → Redeploy.

## 4. The subdomain (5 minutes)

1. In `shonin-staging` → Settings → Domains, add `staging.edidiongumana.tech`. Vercel shows the record it needs: a CNAME to `cname.vercel-dns.com`, and maybe a TXT record to verify.
2. Switch to the `celoiq` team → Domains → `edidiongumana.tech` → DNS Records, and add exactly those records.
3. Wait for the domain to show "Valid Configuration".

## 5. Wire up Telegram (1 minute)

```bash
curl -X POST https://staging.edidiongumana.tech/api/beta/telegram/setup -H "authorization: Bearer $BETA_ADMIN_TOKEN"
```

It answers `{"ok":true}` once Telegram has the webhook.

## 6. Smoke test (5 minutes)

1. `https://staging.edidiongumana.tech/api/beta/health` should show `store: "upstash"`, `telegram: true`, `x: true`, `model: true`, `missing: []`.
2. **The founder's run:**
   - Open `/beta`, sign up, and describe Shonin. On the Desk:
     - Connect Telegram, then tap the link and press Start.
     - Add the bot as an admin to a test channel.
     - Connect X.
   - In Telegram, write "a post about the beta for my test channel". The card arrives. Approve it, and it posts to the channel.
   - On the Desk: approve a WhatsApp draft, tap the link, then tap "I sent it".
3. **The agent bridge:**
   - Create a token on the Desk, then run the `claude mcp add` command it shows.
   - In Claude Code, ask: "start a session and draft a post about the beta".
   - The draft lands on the Desk and in Telegram.

## Rollback

Each deployment is immutable: Deployments → the last good one → Promote to Production.

To stop the bot, set `TELEGRAM_BETA_BOT_TOKEN` to empty and redeploy. Then call `deleteWebhook` in the Telegram Bot API, or revoke the token in BotFather.
