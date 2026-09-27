# The 7-day revenue sprint (Sat 26 Sep → Sat 3 Oct 2026)

**Goal: by day 7,**

- **real money in the account from people who already know you;**
- **agents calling Nova Check from wallets we don't control;**
- **the GTM Harness launched (Tue) and demoed to founders (Thu).**

People pay first; agents get pushed hardest. The fastest money is still finished work sold to your network. The agent products need a week of groundwork before they can earn (the Base leg, listings, integrations into wallets that already pay), so that groundwork starts now (`strategy.md`, "Agents first; people pay first").

Everything below uses what exists today: the site, the brain, Nova Check, Gate and Receipt, `nova-mcp`, Omni402, the GTM Harness and your track record.

## Targets (targets, not promises)

| Offer | Pitch to | Close | Cash this week |
|---|---|---|---|
| Nova Check, Gate and Receipt ($0.01 a call) | Base leg on; `nova-mcp` in the MCP registry; 5 free Check reports sent; 2 integration asks | The first paid call from a wallet we don't control | Cents: this week is groundwork |
| Agent-Ready Website ($200 setup; ₦300k in Nigeria) | 10 existing website clients | 3 | 50% deposits: $300 (₦450,000 at Nigerian prices) |
| AI Visibility Audit ($150; ₦60k in Nigeria) | 20 free "screenshot" audits sent | 5 | $750 (₦300,000 at Nigerian prices) |
| Grant Desk ($350) | 15 builders and NGOs (no programs where you have a role) | 2 | $700 |
| AI Study Group Pro cohort ($49; ₦25k in Nigeria) | 300 people reached | 20 seats | $980 (₦500,000 at Nigerian prices) |
| Agent Launch Sprint or Company Brain | 10 funded startups, anywhere | 1 | 50% deposit ≈ $1,250–1,750 |
| Acquisition Automation Map ($2,500) | 10 searchers and holdcos (`gtm/outbound.md` §9) | 0–1 | Up to a $1,250 deposit |
| Agent Reliability Audit (from $3,000) | 3 x402 sellers or facilitators, each sent a free Check report | 0 | $0 (pipeline) |
| Agent Readiness Audit | 5 design partners, free | 5 case studies | $0 (pipeline) |
| GTM Harness (free) | The launch thread; Celo Devs Office Hours | 50 runs | $0, by design |

**Week-one target: roughly $3,000–4,000 collected, plus a pipeline worth $15,000+.** Deposits are 50% upfront, the balance on delivery.

## Day 0 · Saturday 26 Sep: set up (evening)

- [ ] Run the name checks for **Nova** (domains, trademark class 42, CAC, handles) before buying a domain: `company/brand/names.md`.
- [ ] Write the list of 100:
  - existing clients;
  - founders from your network, anywhere;
  - x402 wallet teams and sellers (`research/first-customers.md` §3);
  - searchers and holdcos;
  - NGOs and foundations you know.

  Grant work only for programs you have no role in.

## Day 1 · Sunday 27 Sep: deploy, and sell the screenshot

- [ ] Read and merge the two pull requests. Merge the GTM Harness first (it merges into the firm's branch), then the firm into `main`. Make `main` the default branch.
- [ ] Deploy to Vercel from your personal account, with root directory `apps/web` (`ops/setup-checklist.md`). Set:
  - `X402_PAY_TO` and `X402_API_KEY`, so agents can pay on Celo;
  - `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`, for the Base leg;
  - `ANTHROPIC_API_KEY`, for GTM Harness plans and the decision fallback;
  - `RECEIPT_SIGNING_KEY`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`;
  - `NEXT_PUBLIC_PAYSTACK_URL` for naira, and `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` once the company can hold a Stripe account;
  - a Cal.com 20-minute call link in `NEXT_PUBLIC_BOOKING_URL`.
- [ ] Run 10 **free AI Visibility Audits** on existing clients and warm SMEs.
  - Ask ChatGPT, Claude, Gemini and Perplexity five buyer questions each: "best poultry farm near Lekki", "Jonsine Farms egg prices", and so on.
  - Screenshot the wrong or missing answers.
- [ ] Send each owner their screenshot with the **"what AI says about you"** script (`gtm/outbound.md` §1). Offer the fix: the Agent-Ready Website.
- [ ] Post the launch thread (`content/threads/01-launch.md`) and pin it until Tuesday.

## Day 2 · Monday 28 Sep: agents day, and outbound

- [ ] Make a first paid call possible:
  - check that `/api/v1/check` answers 402 with both a Celo and a Base option;
  - publish `nova-mcp` to npm and the official MCP registry (`packages/mcp/README.md`);
  - register the paid routes on x402scan (a URL that returns a valid 402 is enough).

  Never pay from our own wallets to trigger a listing or show volume.
- [ ] Run Nova Check on 5 live 402s from `research/first-customers.md` §3 and send the reports (`gtm/outbound.md` §10):
  - Run402 and opencrowd get the opt-in-flag ask;
  - three sellers or facilitators get the audit ask.

  Edidiong approves each message before it goes out.
- [ ] Get the GTM Harness ready (`gtm/gtm-harness-launch.md`): time one real run and record the 60-second capture. The licence is done (MIT).
- [ ] Start the company registration (CAC). Grant KYC, cloud credits, business banking and Stripe all need it.
- [ ] Send outbound messages:
  - 30 to SMEs (scripts §1–2);
  - 10 to founders (§3);
  - 10 to fintechs (§4);
  - 10 to NGOs and foundations (§5);
  - 10 to acquirers (§9).
- [ ] Open the **AI Study Group Pro cohort** presale: T1 Agentic AI Engineer, a 4-week live run starting Mon 12 Oct, $49 (₦25,000 in Nigeria), with 5 scholarships. Post the study-group thread (`content/threads/04-study-group.md`).

## Day 3 · Tuesday 29 Sep: GTM Harness launch, first deliveries

- [ ] **Launch the GTM Harness.** Post `content/threads/07-gtm-harness.md` with the recording, and pin it.
- [ ] Deliver the first two design-partner Agent Readiness Audits (`ops/playbooks/agent-readiness-audit.md`), and book the rest.
- [ ] Take calls. Send fixed-scope proposals the same day: one page, one unit, one price, one deposit link.
- [ ] Start two grant applications for paying clients (`ops/playbooks/grant-desk.md`).

## Day 4 · Wednesday 30 Sep: close, build, prepare the demo

- [ ] Chase every open proposal once, with a deadline: "we start the next batch Thursday".
- [ ] Start the Agent-Ready Website builds for deposits received (`ops/playbooks/agent-ready-website.md`).
- [ ] Follow up the Check reports. Where a maintainer says yes, open the integration PR, with Edidiong's approval.
- [ ] Prepare Thursday's demo: a volunteer founder, three leads to paste, and the run sheet (`gtm/gtm-harness-launch.md`).
- [ ] Prezenti Frontier prep:
  - add an MIT licence to `omni402` and `relay-verdict`;
  - fix Omni402's charge-before-upstream bug;
  - apply for the Self Agent ID;
  - create the KarmaGAP profile.

  See `funding/plan.md`.

## Day 5 · Thursday 1 Oct: the demo

- [ ] **Demo the GTM Harness at Celo Devs Office Hours.** It's a free tool there: no pitch and no prices. The run sheet and the rules are in `gtm/gtm-harness-launch.md`.
- [ ] Post the Jev explainer thread (`content/threads/02-jev-explainer.md`). Next morning, post the numbered list, "10 AI-native services I'd start in Lagos" (`03-ten-services.md`).
- [ ] Host a 45-minute info session for the study group on X Spaces or Telegram live; close cohort seats on the call.
- [ ] Deliver the paid AI Visibility Audits.

## Day 6 · Friday 2 Oct: credits, delivery, and the harness's first rules

- [ ] Log every correction founders sent after the demo. Turn repeats into rules in the harness (`gtm/gtm-harness-launch.md`, "After the demo").
- [ ] If the entity is registered, apply for the credit stack: Anthropic, Cloudflare, Microsoft, Google and AWS (`research/funding.md` §4.3).
- [ ] Register for the Open Agent Hackathon (the deadline is Oct 5). First confirm Nova has no judging role there. Then offer teams free Nova Check calls while they build.
- [ ] Deliver the grant drafts to clients for review. Hand over the first website previews.

## Day 7 · Saturday 3 Oct: review and publish the numbers

- [ ] Count the week:
  - cash collected, deals, pipeline, jobs delivered and hours spent per job;
  - paid agent calls, and distinct paying wallets we don't control;
  - GTM Harness runs, and founders who sent corrections.
- [ ] Add every mistake from the week to the offer rulebooks (`ops/rulebook-log.md`).
- [ ] Post "Week 1 of building an AI-native firm in public", with real numbers.
- [ ] Plan week 2:
  - Submit Frontier (Oct 6–10).
  - Register on Virtuals ACP and start the 10 sandbox jobs it needs before graduation.
  - First cohort session (Oct 12).
  - Apply to Sandbox Africa (Oct 15).
  - Open Agent Hackathon build week (Oct 15–20).
  - Deliver the websites.

## Rules for the sprint

1. **Deposit before work.** 50% upfront, except the five free design-partner audits.
2. **A fixed scope in writing, one unit, one price.** No hourly work, no "let's see how it goes".
3. **The brain routes every lead** (the site intake), and a person replies within a working day.
4. **Log every mistake.** It's the most valuable output of week one.
5. **Stay inside the conflict rules.**
   - No paid work for builders you support in your Celo role.
   - Paid grant work only for programs you have no part in.
   - The GTM Harness stays free.
6. **Count only real agent demand.** That means paid calls from wallets we don't control. Never pay our own wallets for a listing, a ranking or volume.
