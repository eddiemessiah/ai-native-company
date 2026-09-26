# Day-0 setup checklist

Everything needed to take the first payment and run the site in production.

## Company and money

- [ ] **Register the company** with CAC (a business name is fastest; a limited company is better for grants, credits and investors).
- [ ] Open a business bank account.
- [ ] **Paystack** (naira): products for the ₦25k cohort, the ₦60k visibility audit, the ₦150k SME readiness audit, and deposits.
- [ ] **Stripe payment links** (dollars), if available to the entity; otherwise use Paystack's USD option or invoice.
- [ ] **A stablecoin wallet for the firm** (new address, never a personal one) to receive USDC/USDT on Celo from x402 and from clients who pay in crypto.
- [ ] Domain plus company email (Google Workspace or Zoho).
- [ ] A Cal.com (or Calendly) 20-minute intro call link.

## Deploy the site (Vercel)

1. Import the repo into Vercel. **Root directory: `apps/web`.** Keep "Include files outside the root directory" enabled: the research posts live in `content/` at the repo root.
2. Set the environment variables (the full list is in `apps/web/.env.example`). **`NEXT_PUBLIC_SITE_URL` must be set before the build**, because llms.txt, the agent card and the OG tags are generated at build time.
3. Deploy, then check `/llms.txt`, `/.well-known/agent-card.json`, `/api/v1/catalog` and the homepage demo.

## Lead alerts on your phone (Telegram, 5 minutes)

1. In Telegram, message **@BotFather** → `/newbot`, and copy the token into `TELEGRAM_BOT_TOKEN`.
2. Send your new bot any message. Then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `message.chat.id` into `TELEGRAM_CHAT_ID`. For a group, add the bot to the group and use the group's (negative) id.
3. Submit a test on `/start` and confirm it arrives.

## The decision brain

Providers are tried in order; set whichever you have.

| Provider | How | Env |
|---|---|---|
| **Jev via Vercel AI Gateway** (fastest; skips the TypeSafe waitlist) | Vercel dashboard → AI Gateway → create an API key (on Vercel deployments, OIDC works automatically) | `AI_GATEWAY_API_KEY` |
| Jev direct | Join the waitlist at typesafe.ai; pin the version | `TYPESAFE_API_KEY`, `JEV_MODEL=jev-1.13.0` |
| Jev via OpenRouter | OpenRouter key (model `~typesafe/jev-latest`) | `OPENROUTER_API_KEY` |
| Claude fallback (uncalibrated) | console.anthropic.com | `ANTHROPIC_API_KEY`, optional `BRAIN_FALLBACK_MODEL` |

With no keys, the free demo and intake use the built-in lexical heuristic (clearly labelled "uncalibrated"), and the paid APIs return 503 and never charge.

## Agent payments (x402 on Celo)

1. Connect the firm's wallet at **x402.celo.org** and create an API key. Settlement needs it.
2. Set `X402_PAY_TO` (the receiving address) and `X402_API_KEY`. Use `X402_NETWORK=celo-sepolia` while testing; leave it unset for mainnet.
3. Test with the agent snippet on `/agents`. You need a wallet holding a little USDC on Celo; it needs no CELO for gas.
4. Price every paid route at $0.01 or more. The hosted facilitator charges about $0.001 per settlement.

## Onchain identity (ERC-8004)

1. Deploy the site; `/agent.json` serves the registration file (registration-v1 shape).
2. Register it on the Celo IdentityRegistry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` (see `research/agent-payments.md` §6.4). Or reuse the flow from Omni402's `register-8004` CLI.
3. Set `ERC8004_AGENT_ID` to the new id and redeploy, then check it on 8004scan.

## Before the first client

- [ ] Read `ops/conflicts-of-interest.md`, and check your ambassador and employment agreements.
- [ ] A privacy notice on the site covering what the intake collects, and NDPA basics.
- [ ] A simple services agreement template: scope, deposit, IP, confidentiality, data handling.
