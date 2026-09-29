# Deploy Shonin on Vercel

About 30 minutes, from Edidiong's personal Vercel account. Not the `celoiq` team: the firm keeps its own accounts (`conflicts-of-interest.md`, rule 1).

Current `main` passes the same steps Vercel runs (`pnpm install --frozen-lockfile`, then `next build` in `apps/web`) on 29 Sep.

## 0. Before you start (5 minutes)

1. **Make `main` the default branch on GitHub.** Go to the repo's Settings → General → Default branch and switch it to `main` (today it's `claude/eager-wozniak-eoex2g`). Vercel treats the default branch as production.
2. **Pick the plan.** Vercel's Hobby plan is limited to personal, non-commercial use. Shonin sells, so use Pro; check the current terms and trial on vercel.com/pricing.
3. **Have these ready:**
   - an Anthropic API key;
   - a Telegram bot token and chat id (`setup-checklist.md`, "Lead alerts");
   - your Cal.com link.

## 1. Import the repo (10 minutes)

1. Go to vercel.com/new, sign in with GitHub, and import `eddiemessiah/ai-native-company`. If it isn't listed, choose "Adjust GitHub App Permissions" and give Vercel access to this repo.
2. On the import screen:

   | Setting | Value |
   |---|---|
   | Project name | `shonin` (you get `shonin.vercel.app` if it's free) |
   | Framework preset | Next.js (detected) |
   | Root Directory | `apps/web` |
   | Build, install and output commands | Leave the defaults. Vercel reads pnpm 10 from `packageManager` and runs `next build` |
   | Include files outside the Root Directory | On (the default). `packages/` and `content/` live at the repo root |

3. Add the launch environment variables for Production and Preview:

   | Variable | What it does | Without it |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | Writes GTM Harness plans; the brain's Claude fallback | Plans come from templates |
   | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Every intake, study application and harness run reaches your phone | Leads arrive silently |
   | `NEXT_PUBLIC_BOOKING_URL` | The call link shown after intake | No booking link |

   Leave `NEXT_PUBLIC_SITE_URL` unset until the domain is live. Until then the site uses the Vercel production URL.

4. Click Deploy. The build takes a few minutes.

## 2. Check it (5 minutes)

- [ ] `/`: the gate opens, the hero loads, and the dragon moves as you scroll.
- [ ] `/gtm`: run one plan, and time it. The launch thread says "about a minute".
- [ ] `/start`: send a test, and confirm it reaches Telegram.
- [ ] `/llms.txt`, `/.well-known/agent-card.json` and `/api/v1/catalog` show the vercel.app URL.
- [ ] `/api/v1/check` answers 503 until the x402 keys are set (§3). That's correct: no provider means no charge.
- [ ] Settings → Git: Production Branch is `main`.

A changed environment variable takes effect only after a redeploy: Deployments → the latest one → ⋯ → Redeploy.

## 3. Turn on the agent side (Wed 30 Sep)

| Variable | Where it comes from |
|---|---|
| `X402_PAY_TO` | A fresh wallet for the firm, never a personal one |
| `X402_API_KEY` | x402.celo.org, with that wallet connected |
| `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET` | Coinbase Developer Platform. Adds Base (USDC) and the x402 Bazaar listing |
| `RECEIPT_SIGNING_KEY` | A dedicated key that holds no funds |
| `ERC8004_AGENT_ID` | After registering `/agent.json` (`setup-checklist.md`, "Onchain identity") |

Redeploy. Then an unpaid `POST /api/v1/check` answers 402 and offers both Celo and Base.

**The decision brain on Vercel** tries Jev through Vercel AI Gateway first, using the project's OIDC token; enable AI Gateway in the dashboard. If Jev isn't available there, the brain falls back to Claude. The free demo also falls back to the heuristic; paid routes never do. Add `TYPESAFE_API_KEY` if you get direct Jev access.

## 4. Payments from people (when the company can hold them)

- `NEXT_PUBLIC_PAYSTACK_URL`, for local rails.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. These are read at build time, so redeploy after setting them.
  - Webhook: `https://<domain>/api/stripe/webhook`, event `checkout.session.completed`.

## 5. Domain day (next week)

1. Buy `shonin.ai`, through Vercel Domains or any registrar.
2. Project → Settings → Domains: add `shonin.ai` and `www.shonin.ai`, with `www` redirecting to `shonin.ai`.
3. At an outside registrar, add the records Vercel shows. Typically:
   - an A record for `@` pointing to `76.76.21.21`;
   - a CNAME for `www` pointing to the `cname.vercel-dns…` value Vercel shows.

   A domain bought on Vercel needs no records.
4. Set `NEXT_PUBLIC_SITE_URL=https://shonin.ai` and redeploy. llms.txt, the agent card, the sitemap and the OG tags bake the URL in at build time.
5. Check that `https://shonin.ai/llms.txt` shows `shonin.ai`. Move the Stripe webhook to the new domain if it's set.

The vercel.app URL keeps working after that, so this week's links don't break.

## If the build fails

- **`Cannot find module '@repo/…'`:** the Root Directory isn't `apps/web`, or "Include files outside the Root Directory" is off.
- **A Node version error:** Settings → Build → Node.js version → 22.x (the repo needs 22 or newer).
- **Anything else:** copy the build log and send it to Claude.
