# AI Study Group: version 2 and the plan to go global

## Where it stands (v1)

The existing academy (`edidiongumana-codes-ai.vercel.app/academy/`) is a well-built, **free, self-paced** course.

- **Tracks:** T1 Agentic AI Engineer and T2 Ethical AI in Africa are open; T3 Inference Engineering and T4 Onchain Agents on Celo are outlined.
- **How it works:** numbered lessons with inline checks, phase quizzes graded on the server, XP, levels, streaks and three certificate tiers.
- **Certificates:** a soulbound certificate contract (`ASGCertificate.sol`) is written and tested but not yet deployed.
- **Accounts:** no sign-up. Progress stays on the learner's device.

**What's missing is the "group".** There are no cohorts, peers, deadlines, mentors, local presence or path to income. Self-paced courses have single-digit completion rates; groups finish.

## What v2 adds

| Piece | What it is | Why it matters |
|---|---|---|
| **Pods** | 5–8 people at the same level and timezone, meeting weekly for an hour with a rotating host | Accountability; nobody drops out quietly |
| **Cohorts** | 4-week live runs per track: 2 sessions a week, a mentor, demo day | Deadlines and a public finish line |
| **Chapters** | A city lead, a monthly build night and a group chat | Local trust and venues; the global footprint |
| **Ship weeks** | Every phase ends with a deployed artifact, not just a quiz | Portfolios that get people hired |
| **The bench** | Builder-certified members get paid work on the firm's jobs | A path to income, which is the real retention driver |
| **Onchain certificates** | Deploy `ASGCertificate` on Celo (Sepolia first, then mainnet) | Verifiable proof for employers |
| **Brain placement** | Applicants placed in a track, level and pod in one typed decision (live on `/study`) | Right pod from day one; mentors check placements |
| **Padi as tutor** | Your ₦20-a-question x402 study buddy, wired into lessons | Help at 2 a.m.; a real x402 product in use |
| **New tracks** | T5 Forward-Deployed AI Engineering; T6 AI-Native Services for Founders | Feeds the firm directly and gives founders a way to pay |

## Pricing

| Tier | Price | Includes |
|---|---|---|
| Free | ₦0 | Every track, lesson, quiz and certificate, self-paced |
| Pro cohort | ₦25,000 / $49 | Live cohort, pod, mentor reviews, demo day, bench priority |
| Team | From $4,000 per 20 seats | Private cohort, capstones on company workflows, manager reports (sold as **Team AI Upskilling**) |
| Sponsor | From $2,500 per cohort | Scholarships, logo on certificates, first look at graduates |

Scholarships: at least 25% of every cohort's seats, funded by sponsors.

## The rollout

### Phase 1: October (Lagos and online)
- **Oct 12:** the first Pro cohort starts: T1, 20 paid seats plus 5 scholarships. Weekly pods online.
- Deploy the certificate contract on Celo Sepolia, test, then deploy on mainnet.
- Recruit the first mentors from people you've taught (Base Batches Enugu alumni, Sui workshop alumni, Proof of Ship builders).
- **Targets:** 150 applicants, 20 paid, 80% week-4 completion, 10 demo-day projects.

### Phase 2: November (the Nigerian chapters, then Accra)
- Activate the five chapters where you've already run events: Lagos, Enugu, Abakaliki, Makurdi and Jos (Jos with Blockfuse Labs).
- Start Accra through PAAIS contacts, the University of Ghana Digital Youth Village and the MEST network.
- **Chapter lead program:**
  - **Requirements:** has shipped a project, can host 10+ people monthly, one cohort completed.
  - **Gets:** 20% of Pro seats sold in their city, a sponsor stipend, swag, a lead badge on the site and a direct line to paid bench work.
  - **Duties:** a monthly build night, local pod hosting, recruiting.
- The second cohort runs T1 and T2 together.

### Phase 3: December to February (East and Southern Africa, the diaspora)
- Nairobi, Kigali, Kampala and Johannesburg: chapter leads recruited from cohort graduates and partner communities.
- Diaspora chapters (London, Toronto, Houston) meet online at Lagos-friendly hours. Diaspora members make natural mentors, sponsors and clients.
- Launch T4 Onchain Agents on Celo, pitched to the Celo ecosystem as a sponsored track (disclose your role; see `ops/conflicts-of-interest.md`).

### Phase 4: beyond Q1 (truly global)
- **Translate T1** into French for Dakar and Abidjan, and Portuguese for Luanda and Maputo, with native-speaker reviewers.
- Put T3 Inference Engineering on donated GPU credits (Nigeria AI Collective, cloud credit programs).
- Open **annual demo days** with hiring partners, and run an AI Study Group track at major African events.

## Channels

- **X threads** (Greg-style numbered lists, weekly lesson threads) and pinned cohort announcements.
- **Universities:** UNILAG, UNN, UI, OAU, KNUST, the University of Ghana and Makerere, through student tech clubs and GDSC chapters.
- **Hubs:** CcHUB, Ventures Park, Blockfuse Labs, MEST.
- **Programs:** 3MTT fellows, Ethereum Nigeria, Nigeria Blockchain Week, and ecosystem DevRel partners.
- **Your channels:** CeloIQ Sessions, Based Conversations, workshop attendee lists.

## What to build next in the academy (engineering backlog)

1. Optional accounts with server-side progress, so cohorts and mentors can see progress.
2. A cohort calendar and pod rooms (Telegram topics or Discord threads, created automatically from placements).
3. A mentor review queue for capstones, with brain pre-grading of short answers so mentors review exceptions.
4. Deploy the certificate contract, then use sponsor gas to mint for learners without CELO.
5. A cross-learner leaderboard by chapter; certificates shown on a public profile.
6. Padi integration: ask-a-tutor in every lesson, pay-per-question via MiniPay or x402.

## Metrics

**Weekly:**
- applicants
- activation (lesson 1.1 done within 48 hours)
- weekly active learners
- pod attendance

**Per cohort:**
- completion by phase
- demo-day projects
- certificates minted
- NPS
- revenue per cohort
- scholarship share

**Firm link:**
- bench members active
- paid hours delivered by bench members
- graduates hired
