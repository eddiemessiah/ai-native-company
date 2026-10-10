# Shonin GTM plan: from live site to launch

**Status:** written 27 Sep 2026; timeline revised 7 Oct, and again 10 Oct with the weekend film and the hackathon activations. The domain (`shonin.ai`, about $160) moves to the end of October, and the public launch moves with it: the firm and the GTM Harness v2 launch together (`harness-plan.md`). Until then the site runs on its Vercel URL. Numbers below are either sourced (with the file) or marked as targets.

## 1. What we're launching

**Shonin is an AI-native firm: agents do the work, every step is checked, and a person approves anything that matters.**

The name carries the model: 商人 merchant (agents trade the work), 証人 witness (every decision is recorded), 承認 approval (a person signs off). The site tells it as a walk through a temple, and the dragon section explains the four steps: you ask, agents work, every step is checked, a person seals it.

One sentence per audience:

| Audience | What we say | First step we ask for |
|---|---|---|
| **Agents and the people who build them** | "Before your agent pays or acts, it asks Shonin: pay, confirm with a person, or block. $0.01 a call, no account." | Point the agent at `/api/v1/check`, or add `shonin-mcp` |
| **Businesses, anywhere** | "Hand us a job with a finish line. Fixed price per unit, never per hour: from a $150 audit to an agent in production." | Pick an offer in `/directory`, or describe the job at `/start` |
| **Founders** | "Your go-to-market, run by agents you can check. Free and open source." | Run the GTM Harness at `/gtm` |
| **Learners** | "Learn to run agents. The best join the bench that delivers our jobs." | Join the AI Study Group at `/study` |

Prices come from `packages/catalog`; never quote one that isn't there.

## 2. The offer ladder

Each rung opens the next. Free things earn trust; small paid things prove the work; big things come from the relationship.

| Rung | Offers (catalog prices) | Job it does |
|---|---|---|
| **Free** | GTM Harness (MIT); AI Study Group free tracks; a free Shonin Check report on a prospect's own 402; the first five Agent Readiness or AI Visibility Audits for design partners | Reach and proof. Every free run and report is a reason to talk |
| **Per call** | Shonin Check, Gate and Receipt ($0.01 each) | Agents buy with no sales cycle. Small money, big signal: paying wallets we don't control |
| **Entry** | AI Visibility Audit ($150); Agent-Ready Website (from $200 + $25/month); Grant & RFP Desk ($350); Pro cohort seat ($49) | First cash from people who already know us |
| **Core** | Agent Readiness Audit ($490); Agent Launch Sprint (from $2,500); Company Brain ($3,500 + $900/month) | Repeatable delivery with a playbook |
| **High ticket** | Agent Reliability Audit (from $3,000); Acquisition Automation Map ($2,500); 100-Day Agent Integration (from $12,000 + $1,500/month) | Teams whose agents move money, and acquirers |

## 3. Launch sequence

Revised 7 Oct. The 29 Sep timeline put the domain and the announcement in early October; the domain now comes at the end of the month, and the GTM Harness v2 launches with it.

| When | Move | Owner | Done when |
|---|---|---|---|
| **Wed 7 – Sat 10 Oct** | Deploy from the Vercel Pro account if it isn't live yet (`ops/deploy-vercel.md`). Submit Frontier (6–10 Oct, `funding/plan.md`) | Edidiong | The vercel.app URL serves the temple page; Frontier submitted |
| **Sat 10 Oct, 12:00 GMT** | The GTM Harness v2 film (60 s, 16:9 and 9:16, `packages/video/launch/gtm-harness-v2`) on personal X; Reels, Shorts and TikTok the same day; LinkedIn Mon 12 Oct, 08:00 GMT. Copy in `content/threads/09-gtm-harness-film.md`. Sunday stays clear for the Jarvis launch (Sun 11 Oct, 15:30 GMT) | Edidiong posts; Claude rendered the film | Posted; impressions and replies logged after 48 hours |
| **Mon 12 Oct – Mon 9 Nov** | Hackathon activations on WhatsApp and Telegram, run on the harness as a free tool (`gtm/hackathon-activations.md`). Ambassador work, not a Shonin campaign: no Shonin in Celo channels | Edidiong approves and sends | The §5 counts filled in from the workspace, so the result can be quoted |
| **From Thu 8 Oct, daily** | Run Shonin's own go-to-market on the harness: `pnpm gtm` with Telegram approvals (`harness-plan.md`, stage 1) | Edidiong; agents prepare | 20 approved messages sent from the harness by 16 Oct |
| **Mon 12 Oct** | First AI Study Group Pro cohort starts | Edidiong | First session held |
| **Mon 12 – Fri 16 Oct** | Harness: evals on four models, Gmail drafts and a Sheets pipeline (Google app in testing mode); recruit 5 design-partner founders (`harness-plan.md`, stage 2) | Claude builds; Edidiong recruits | Evals published in the repo; 5 founders confirmed |
| **Mon 19 – Fri 23 Oct** | Design-partner week, by concierge: our agents run each founder's workspace, and the founder approves in their own Telegram and taps to send; their corrections become rules (stage 3). The first GTM Sprints are offered outside the programs Edidiong supports | Founders approve; Edidiong reviews | 5 workspaces running; corrections logged; 3 of 5 say what they'd pay |
| **Mon 26 – Fri 30 Oct** | Domain day: register `shonin.ai`, attach it, set `NEXT_PUBLIC_SITE_URL`, redeploy (`ops/deploy-vercel.md` §5). Record the trailer (§5) and the harness demo | Edidiong buys; Claude checks the redeploy and prepares the footage | `https://shonin.ai/llms.txt` lists the new URL; trailer approved |
| **The day after the domain works** | Public launch: the trailer, the "Shonin is open" thread (§6) and the GTM Harness v2 thread, pinned | Edidiong | Live on X, LinkedIn, YouTube Shorts, Instagram Reels, TikTok |
| **Launch +1 to +7** | One post a day (`gtm/content-engine.md`); reply to every comment within a working day; Product Hunt for the harness on a Tuesday after the first 50 public runs | Edidiong, drafts by agents | Seven posts out |

**What we know on 10 Oct:**

- On 6 Oct `shonin.ai` did not resolve, and nothing in the Drive confirms the domain or the trailer since. Treat the domain as end of October, as above.
- The GTM Agent Harness milestone post (6 Oct, 16:04) drew 291 impressions and 2 replies (our data, Drive: *Weekend Plan*, §1.5). A personal milestone told as a story beat the plain announcements, so the film's post leads with the story.

The past items (deploy, GTM Harness v1 launch on 29 Sep, Office Hours demo on 1 Oct, week-1 numbers on 3 Oct) are recorded in the 29 Sep revision in git history.

## 4. Channels, in the order they pay

From `research/first-customers.md` §4, with the new site in each:

1. **Warm-network DMs.** Existing website clients, founders, NBW contacts outside Celo programs. The site is now the proof you send after the first reply: "Here's how we work", linking to `/#how` (the dragon).
2. **Show them their own data.** A free Shonin Check report on a target's live 402, or a free AI Visibility screenshot for an SME. Then the audit.
3. **Integrations into wallets that already pay.** Opt-in Shonin Check in Run402, opencrowd, tryx402, ArisPay and AgentCash (`gtm/outbound.md` §10). Merged code keeps paying.
4. **Machine discovery.** Base leg, CDP Bazaar (automatic after the first real settlement), x402scan, the MCP registry, llms.txt, the agent card, ERC-8004. A prerequisite, not demand.
5. **Content.** The trailer, the threads in `content/threads/`, the weekly calendar. Every post links to one page, not the home page, when a deeper page answers better.
6. **Founder communities.** The GTM Harness as a free tool. In Celo channels, free tools only.
7. **Launch directories** (week 2+). Product Hunt for the GTM Harness on a Tuesday, after the first 50 runs and the corrections from the demo are in. Hacker News "Show HN" only for something technical and open (the harness, or a sourced x402 post).

## 5. The trailer (45–60 seconds)

**Goal:** someone who has never heard of Shonin knows in under a minute what it is, who it's for and where to go. It is shot from the live site, so what people see in the trailer is what they get when they click.

**Formats:** 16:9 (X, YouTube, LinkedIn) and 9:16 (Reels, Shorts, TikTok). Burned-in captions; most people watch muted.

**Sound:** a shakuhachi or koto line over a slow taiko pulse; three sound effects: the gate doors (wood), a seal pressing (a dull thud), the temple bell at the end. Use licensed or royalty-free audio only, and keep the licence with the files.

| Time | Picture (from the site) | On screen / voice-over |
|---|---|---|
| 0–4 s | Black. The gate doors, closed. The gold plaque 山門 glows. | "Agents are fast." |
| 4–8 s | The doors open on the temple at dusk; lanterns flicker, leaves fall. | "But they can be wrong." |
| 8–13 s | The hero headline settles; "seals" is underlined in vermilion. | "Shonin: agents do the work. A person seals what matters." |
| 13–25 s | The dragon section: the dragon carries the pearl through 一 二 三 四; the vermilion 承 seal lands on step four. | Captions, one per step: "You ask." "Agents do the work." "Every step is checked." "A person seals it." |
| 25–33 s | The agent stops: the 許 問 止 seals press in one by one; the code strip `POST /api/v1/check → 402 → pay $0.01 → 200 {"verdict":"pay"}`. | "For agents: a check before it pays, a gate before it acts, a receipt after. One cent a call." |
| 33–41 s | The hanging scroll unrolls; a request is routed live. Then the shop boards swing, with prices. | "For businesses: finished work, priced per unit, never per hour." |
| 41–47 s | The paper lantern (GTM Harness), then the kintsugi bowl's gold seams drawing in. | "Every correction becomes a rule, mended in gold." |
| 47–55 s | The bell swings. "Enter." | End card: **shonin.ai** · "Agents, businesses, founders: start free." |

**The harness film is separate.** It is a 60-second motion film of the GTM Harness, rendered from code (`packages/video/launch/gtm-harness-v2`), not shot from the site. It goes out first, on 10 Oct; this trailer stays for domain day.

**How to make it:**

- Record the site at 60 fps, 1920×1080 and 1080×1920, with the cursor hidden (a scripted browser run, or a screen recorder with a hidden cursor). Scroll with an eased script so the pinned dragon section plays through all four steps.
- Cut in CapCut, Premiere or Canva. The Canva connector in claude.ai needs to be re-authorised before Claude can help there.
- Before posting: every price on screen must match the catalog, and the end card must show the domain that works.

## 6. The announcement thread (for domain day)

Draft; run it through the content gate (`POST /api/v1/content-gate`) and edit before posting.

> 1/ Shonin is open. [trailer]
>
> An AI-native firm: agents do the work, every step is checked, and a person approves anything that matters.
>
> 2/ Shōnin is one Japanese word with three meanings. 商人, merchant. 証人, witness. 承認, approval. That's the firm.
>
> 3/ For agents: Shonin Check, Gate and Receipt. Before your agent pays, before it acts, after it pays. $0.01 a call over x402, no account.
>
> 4/ For businesses: finished work priced per unit, never per hour. From a $150 audit to an agent in production.
>
> 5/ For founders: the GTM Harness, free and open source (MIT). For learners: the AI Study Group.
>
> 6/ What's already shipped: Omni402 on Celo mainnet (block 74,479,633), ERC-8004 agent #9765, 22 projects into Proof of Ship. Start here: shonin.ai

Every number in it is in `brand.proofs` or the catalog.

## 7. What we measure

Weekly, every Monday (`strategy.md`, "Measures that matter"):

| Measure | Source |
|---|---|
| Cash collected, and deposits | Stripe, Paystack, the wallet |
| Qualified leads, and replies to outbound | The intake log and the brain's routing |
| Paid agent calls, and **distinct paying wallets we don't control** | Settlement logs; never count our own wallets |
| GTM Harness runs, and founders who sent corrections | Telegram alerts; the rulebook log |
| Study-group applicants and cohort seats | `/api/study/apply` |
| Site: visits to `/`, clicks on the three "Start here" paths, time to first click | Add Vercel Web Analytics before the announcement |

**Targets, not promises** (from `seven-day-sprint.md` and `research/first-customers.md`):

- **Day 7 (3 Oct):** roughly $3,000–4,000 collected from the warm network; 50 harness runs; a pipeline worth $15,000+.
- **Day 30:** the first paid call from a wallet we don't control; one integration merged; 5 case studies from design-partner audits; the first Pro cohort running (starts 12 Oct); the Frontier application submitted (6–10 Oct).
- **Day 60:** a playbook for every offer sold twice; Shonin Gate graduated on Virtuals ACP.
- **Day 90:** the first Agent Reliability Audit or Acquisition Automation Map sold; revenue per offer reviewed and prices revisited (every ten jobs).

## 8. Rules for the launch

1. **No invented proof.** Numbers come from `brand.proofs`, `research/` or our own data. Targets are called targets.
2. **Celo channels get free tools only** (`ops/conflicts-of-interest.md`, rules 1–2): the GTM Harness, study-group tracks, open-source code. No prices, no directory links, no paid pitch.
3. **Nothing sent in a client's name** without Edidiong approving that exact message.
4. **Count only real agent demand.** No calls from our own wallets to trigger a listing or a ranking.
5. **Separate identities.** The firm's own email and accounts, never `@celo.org`.
6. **Log every correction** from the launch week in `ops/rulebook-log.md`; the good ones become catalog rules.

## 9. Risks

| Risk | What we do |
|---|---|
| The temple theme reads as decoration, and people miss what we sell | The soft-launch question ("what do we do?"); the three paths sit right under the hero; every section ends in one clear link |
| Launching before the domain | This week's posts (the harness launch) use the vercel.app URL, which keeps working after the domain arrives. The firm-wide announcement waits for `shonin.ai` |
| The site is slow on low-end phones | The dragon pauses off-screen and stills with reduced motion; check a mid-range Android on 4G before the announcement |
| Traffic spike with no model key | Paid routes answer 503 rather than guess; the demo falls back to the free heuristic and says so; set `ANTHROPIC_API_KEY` before announcing |
| Cultural misread of Japanese words | The words are used for their meanings, with readings shown; ask two Japanese speakers to check the page before the announcement |
