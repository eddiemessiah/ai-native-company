# Funding plan: money we can realistically win by end of 2026

*Research date: 2026-09-26. Horizon: October to December 2026.*

**Evidence tags.** **[V]** = verified in a primary source (a Celo governance proposal, a program's own repo or terms, or our founder's repos). **[S]** = secondary (a search-engine summary, a third-party write-up, or another builder's dated notes). **[U]** = unverified or inferred.

**Research limits.** The network proxy blocked prezenti.xyz, forum.celo.org, blog.celo.org, celopg.eco and celobuilders.xyz. The web-search budget ran out partway through (200 of 200). So the Prezenti facts come mainly from three places: Celo governance proposal **CGP-0249** (the Season 3 mandate, executed 2026-08-10), **Prezenti's public repo** `prezenti/talent-engine`, and Celo's official **Celopedia** skill repo, `celo-org/celopedia-skills`, which was updated 2026-08-28 and 2026-09-01.

---

## 0. Bottom line

- **Prezenti** runs Celo's community-governed direct-grants program. The grants are one-off and milestone-based: 20% is paid up front and 80% on delivery. They are paid in **USDm** on Celo. The money comes from the Celo Community Treasury through governance proposals. **Season 3** has three pools (Boost, Frontier, Anchor) plus a small AI-tools sponsorship trial. Applications close in **December 2026**; the public listing says 29 December.
- **The Frontier pool** is the open, rolling pool for **AI and agent-economy infrastructure on Celo**. In Season 3 it has **45,000 USDm, grants capped at 15,000 USDm, and room for about 3 grants**, with decisions in 2 to 4 weeks. A reserve can top it up. In Season 2 it got 34 applications and funded 2, committing 40,000 USDm.
- **Does the founder qualify?** Mostly yes. Omni402 already has an **ERC-8004 identity on Celo mainnet (agent #9765)** and a **verified gasless x402 settlement on mainnet**. Four gaps remain: a **Self Agent ID**, an **open-source licence** (the repos have none), a **KarmaGAP** profile, and a **legal entity for KYC and the contract**. He does not qualify for Anchor, which needs 10K+ daily transactions. The AI-tools sponsorship's public round **closed on 2026-09-24**, and it targets builders from *outside* Celo anyway.
- **This week:** apply for the credit programs, fix the four Frontier gaps, message Prezenti to "discuss fit", and **submit to Frontier by about 10 October**. With only about 3 grants and heavy demand, applying early matters.
- **Realistic 90-day haul.** Weighted by probability, about **$4–5K in cash** and about **$9–10K in credits**. The upside case is about **$20K cash**: Frontier, plus Boost, plus a hackathon placing.

---

## 1. Prezenti and the Frontier pool

### 1.1 What Prezenti is (verified)

| | |
|---|---|
| Operator | Prezenti: prezenti.xyz, X `@prezenti_grants`, `prezenti.eth`. It describes itself as the operator of "Celo's direct-grants program" and a strategic grants partner of **Celo Core Co.**, the 2026 merger of cLabs and the Celo Foundation. [V: CGP-0249, CGP-0247] |
| Money source | The Celo Community Treasury, approved through Celo Governance Proposals. Season 2 was funded by CGP-227 (3.43M CELO, about $276K). Season 3 (CGP-249) asked for **$0 of new money**: it redeploys 279,274 USDm and 600,000 CELO that Prezenti already held. [V] |
| Chain and currency | Celo mainnet (an Ethereum L2). Grants are paid in **USDm**. [V] |
| Model | **One-off, milestone-based direct grants: 20% at project start, 80% after agreed milestones.** Contracts and KYC are required. Delivery is due 4 months after the contract is signed. It is **not** streaming, quadratic or retroactive funding. [V: CGP-0249 "Grant Terms"] |
| Track record | Running since 2022. More than 575 applications, 120+ grant contracts, and about $2M deployed. Alumni include Glo Dollar, Brale and BitGifty. [S: Celo blog, Jul 2026] |
| People and wallets | Founders and 2-of-3 multisig signers: **Wade Abel, Maya Brown, Aaron Boyd**. Master Safe: `0xa5c9…d44`. **Frontier Pool Safe: `0xA4884D80E72461D8274fa6e3d0d75B6221694997`**. The sponsorship trial is operated by `zozDOTeth`. [V] |
| How to apply | Tally forms at **frontier.prezenti.xyz** and **anchor.prezenti.xyz**. Applications moved from CharmVerse to Tally, and the old links are dead. Boost is invite-only. Prezenti encourages applicants to **"discuss fit before applying"**. [V: CGP-0249, Celopedia] |
| Season 3 calendar | September 2026: all programs live. **November 2026: mid-season forum update**, including every reserve deployment. **December 2026: applications close** (listed as 12 Aug to 29 Dec 2026). January to February 2027: season close and retrospective. Operations are funded only to a planned **July 2027 close**, and a wind-down clause means **Season 4 is not guaranteed**. [V] |

### 1.2 Season 3 pools (CGP-0249, executed 2026-08-10) [V]

| Pool | S3 allocation | Access | Grant size | About how many | Our fit |
|---|---:|---|---|---:|---|
| **Frontier** | 45,000 USDm | Open, rolling | **Cap 15,000 USDm** | ~3, plus reserve top-ups | **High**: Omni402 plus Verdict |
| **Boost** | 70,000 USDm | **Invite-only**. Celo Core Co. DevRel & Growth source the teams; Prezenti handles contracts, KYC and payment. | 3,000–5,000 USDm | ~15 | Medium: needs a DevRel nomination |
| **Anchor** | 50,000 USDm | Sourced first; an open form remains | ~25,000 USDm | ~2 | Low: needs about 10K–100K estimated daily transactions |
| AI Builder Sponsorship (trial) | 7,000 USDm | **Public round closed 2026-09-24**; private invite links only (see 1.4) | $1,400 in AI tools per person | 5 people | Low: aimed at builders from outside Celo |
| Reserve | 107,274 USDm + 600,000 CELO | Discretionary. It can start a new pool when a clear category signal appears, top up a pool whose qualified pipeline exceeds its allocation, or fund a larger Anchor grant. | — | — | Indirect: strong Frontier demand can unlock top-ups |

Context: CELO traded at about **$0.064–0.076** in July and August 2026 (per CGP-246, 247 and 251). That is why USD-denominated pools matter more than CELO prizes. [V]

### 1.3 Frontier pool: verified facts

- **What it funds.** "Foundational AI and agent economy infrastructure on Celo: protocols, tooling, and services that other builders and agents rely on." [S: prezenti.xyz snippet] Its scope in Seasons 2 and 3 covers five areas: **agent identity and discovery; agent-to-agent transaction rails; AI-native developer tooling; verification and trust systems; interoperability layers.** [V: CGP-0249]
- **Eligibility.** "Demonstrable Celo activity, including **Celo mainnet deployment, ERC-8004 registration, Self Protocol Agent ID, and verifiable on-chain activity** where applicable." [V]
- **Size.** Season 3 has 45,000 USDm with a **15,000 USDm cap per grant**. The Season 3 design says it deliberately funds "more teams at smaller individual grant sizes while maintaining a high technical bar". In Season 2, 40,000 USDm went to **2 grants**, about $20K on average; the Season 2 listing said "up to 25K". [V; the 25K figure is S]
- **Terms.** USDm. 20% at onset and 80% after milestones. Contract and KYC required. Delivery within 4 months. [V]
- **Timeline.** Rolling. **Decisions within 2–4 weeks** of submission, on a rolling basis until the money is allocated. Season 3 applications close in December 2026 (listed 29 Dec). [V: Celopedia, CGP-0249]
- **Application form fields.** These come from a public Season 2 draft in `zkos-labs/bastion`. [S] The fields are:
  - product name, team, website, X handle, **KarmaGAP profile**
  - **ERC-8004 registration** (yes/no plus details), **fully open source?**, **deployed on Celo mainnet?**, **Self Agent ID?**
  - project description, **infrastructure focus**, **verifiable on-chain activity**, demo
  - **prior Celo-ecosystem collaborations** (multiple choice, including "None of the above")
  - **clear contribution to the ecosystem**, **technical credibility**, additional information
  - a delivery block: policy agreement, lead applicant's legal name (for KYC), email, **country where the company is registered**, tech category, logo, and a Celo delivery address
- **How applications are judged.** No Frontier rubric is published. Four signals:
  - the form sections above;
  - Prezenti keeps "traction and technical-quality thresholds" and will not lower its bar just to spend money [V];
  - **every rejected applicant gets rubric-tied feedback** (100% of 56 in Season 2), so a rubric does exist [V];
  - Season 2 applications were judged on "existing user base, on-chain impact, and core ecosystem alignment" [S].
- **Past grantees (Season 2 Frontier).** **Aigora**, which ranks bidding agents by ERC-8004 reputation, and **Celina** (Canvassing / andrewkimjoseph), an open-source MCP tool catalog and agent stack for Celo mainnet. [S: search summaries of the Celo blog and X; amounts not public]
- **Reporting.** Milestone evidence releases the 80%. A KarmaGAP profile is requested. Prezenti publishes **aggregated grantee transaction metrics** and case studies at season close, so tag every transaction with ERC-8021 attribution. Completion reports on the Celo forum are the precedent. [V for Prezenti's KPIs; S for the forum precedent]
- **Competition.** In Season 2, **34 Frontier applications arrived in about 7 weeks**: 45% of all applications, of which 47% were AI or agent projects. **2 were funded (about 6%).** **Half of Frontier applicants were from Africa.** [V/S] Season 3 applicants are already visible on GitHub; for example, `zuemen/agent-passport` names the "Celo Prezenti Frontier Pool" and was pushed on 2026-09-24. With about 3 grants in the committed pool, **submit in early October**.
- **Specific to AI agents, Africa and Celo.** Frontier is the AI and agent pool. African builders led Season 2 applications (41% of all). The Season 3 sponsorship trial gives extra scoring weight to MCP, ERC-8004, x402 and A2A work. Celo's **Agent Visa** (run by Self) and ERC-8021 attribution tags complement Frontier (see section 2).

### 1.4 Prezenti AI Builder Sponsorship (trial): verified from `prezenti/talent-engine`

- **What it gives.** 5 places for 4 months. Each place is worth **$1,400**: Claude Max 20x ($200 × 4), ChatGPT Pro ($100 × 4) and a $200 allowance. It is reimbursed against monthly receipts. Finalists are first routed to Claude for Open Source and Codex for OSS where they are eligible.
- **Status.** The policy file still says `open` with applications closing `2026-12-29`. However, commit `a57c692` (2026-09-23) added a runtime close flag, and its script says the round **"closed at 12:00 AM Pacific on September 24, 2026"**. Commit `4fd59bb` (2026-09-25) then added a **private late-application route**, `/invite/<token>.html`: "The public round is closed; use this form only if this link was sent to you directly." The live page was unreachable from here.
- **How applicants are selected.** An open-source engine scores 100 points from **6 months of public GitHub activity**:
  - shipped original work: 40
  - cadence (distinct active weeks): 20
  - PRs merged into other people's repos: 10
  - code reviews: 5
  - blockchain footprint: 10
  - "frontier" agent-protocol signal (MCP, ERC-8004, x402, A2A, agentkit and similar): 15

  Stars and followers score nothing. About 15 applicants are shortlisted; then humans decide. Selection also checks that the tool cost is a real access barrier, that there is a Celo plan, and requires a Celo mainnet deliverable by month two.
- **What recipients give back.** A public **2% pledge to Prezenti**. It covers Celo revenue *and any grant, prize or retro-funding income won with the sponsored work*. It is capped at $14K, expires after 36 months, and is recorded as a public Celo EAS attestation. Prezenti takes no equity but gets a right of first offer.
- **What it means for us.** The trial explicitly aims "not to fund people already circulating inside Celo", so a Celo ambassador is an off-target applicant. The founder is more useful here as a **referrer**: the trial takes Celo regional-scout referrals, and he could refer AI study-group builders. If he takes an invite, note that the 2% pledge would also apply to a Frontier grant won with the same work, about $240–300.

### 1.5 Does the founder qualify? (checked against his public repos)

| Frontier requirement | Status | Evidence | Fix before submitting |
|---|---|---|---|
| Celo mainnet deployment and activity | **Yes** | Omni402's gateway settles on Celo mainnet through the hosted facilitator. Proof: tx `0xf6f71df2…a38b38`, block 74,479,633, a gasless 0.001 USDC transfer using EIP-3009 (`omni402/apps/video/src/proof.ts`). | Build up *independent* buyer transactions and tag them with ERC-8021. |
| ERC-8004 registration | **Yes** | **Agent #9765** on Celo Identity Registry `0x8004A169…a432` (8004scan.io/agents/celo/9765). A `register-8004` CLI is in the repo. | `agent.json` lists its "mcp" endpoint as a GitHub URL. Point it at a live MCP or x402 endpoint and re-validate on 8004scan. |
| Self Protocol Agent ID | **Not found** | No references in the repos. | Register at app.ai.self.xyz. Mainnet needs a real passport scanned in the Self app. Reuse the wallet that owns agent #9765. |
| "Fully open source" | **Partial** | The code is public, but **there is no LICENSE file** in `omni402`, `relay-verdict` or `ajo-agent`. There are no releases or topics. | Add an MIT or Apache-2.0 licence, tag v1.0.0, and add topics (x402, erc-8004, celo, mcp). |
| Infrastructure that others rely on | **Yes** | Omni402 wraps any API with x402 in one command and includes a buyer SDK, the ERC-8004 CLI and a dashboard. Relay is an A2A settlement rail and service directory. **Verdict** is a reputation oracle that writes to the ERC-8004 Reputation Registry `0x8004BAa1…9b63`. | Package them as one product (outline in section 4.1). |
| KarmaGAP profile | Unknown | — | Create it and add the milestones from section 4.1. |
| KYC and contracting entity | Unknown | The form asks for the "country company is registered". | Register or confirm the company (for example with Nigeria's CAC). The credit programs need this too. |
| Anchor traction (~10K+ daily tx) | No | — | Skip Anchor. |

### 1.6 Prezenti unknowns

1. **Is Season 3 really open?** Celopedia (2026-08-28) records that prezenti.xyz showed "Open 12th Aug 2026 – 29th Dec 2026" **and** "We are currently closed for applications. Season 3 has concluded" at the same time. CGP-0249 and the forum post "Prezenti Season 3 Is Open" (t/13714) point to open. **Confirm with Prezenti before submitting.**
2. How much of the 45K Frontier allocation is already committed, and whether a reserve top-up is likely.
3. The Frontier rubric and its weights, especially traction versus technical merit.
4. Whether a Nigerian business-name registration or an individual can sign the grant contract, and how long it takes from approval to the first 20% payment.
5. Season 2 Frontier grant amounts and milestones for Aigora and Celina.
6. Whether there will be a Season 4.

---

## 2. Opportunity table

Fit scale: 5 = strong fit and eligible now; 1 = poor fit or not eligible now; 0 = closed.

| Name | Type | Amount | Deadline / status | Fit | Link | Ev. |
|---|---|---|---|:-:|---|:-:|
| **Prezenti Frontier Pool (S3)** | Milestone grant in USDm (20/80) | ≤15,000 USDm; pool 45K plus reserve | Rolling; S3 closes Dec 2026 (listed 29 Dec); decisions in 2–4 weeks | **5** | https://frontier.prezenti.xyz/ | V |
| **Prezenti Boost (S3)** | Invite-only grant, sourced by Celo Core Co. DevRel & Growth | 3,000–5,000 USDm; pool 70K (~15 grants) | Through S3 (Dec 2026) | **4** | No public form; ask DevRel/Growth | V |
| Prezenti Anchor (S3) | Traction-stage grant | ~25,000 USDm | Dec 2026 | 1 | https://anchor.prezenti.xyz/ | V |
| Prezenti AI Builder Sponsorship | AI-tool sponsorship with a 2% pledge | $1,400 per person, 5 seats | **Public round closed 2026-09-24**; invite links only | 2 | https://sponsorships.prezenti.xyz/ | V |
| Prezenti S3 reserve | Discretionary top-ups or new pool | 107,274 USDm + 600K CELO | Reported at the Nov 2026 update | 3 | CGP-0249 | V |
| **Celo Devs agent hackathons (next edition)** | Hackathon, on-chain-metric tracks | About $5K pools | **Not yet announced.** 2026 cadence: Mar, May–Jun, Jul–Aug, Aug–Sep | **5** | https://celobuilders.xyz (`npx skills add https://celobuilders.xyz`) | S |
| Agents at Work hackathon: results | Prize payout | $5,000 total | Closed Sep 14; **winners announced Sep 25**. Check our `ajo-agent` / WiBA entry. | 4 | https://celoplatform.notion.site/Agents-at-Work-Hackathon-3c1d5cb803de81139de7f4f3d09e55dc | V |
| Celo Builder Fund | Uncapped YC SAFE | $25K per project | Through **Dec 31, 2026**. Needs 2 of 4: 1K+ MAU, 500+ daily tx for 2 weeks, $50K TVL, or $5K+/month revenue or volume | 2 now (4 with traction) | https://www.celopg.eco/programs/celo-builder-fund (lena.hierzi@celo.org) | V |
| Celo Agent Visa (Self) | Non-cash tiers | Co-marketing and mentorship; the Work Visa adds DeFi incentives, liquidity and featured placement | Rolling. Work Visa: Self Agent ID, 1,000+ tx, $5K+ volume | 4 | https://agentvisa.self.xyz/agents/visa | V |
| ERC-8021 attribution tags | Eligibility for future usage rewards | — | Tag now; there is no backfill | 4 | Celopedia `attribution-tags.md` | V |
| Celo Core Co. S3 builder and regional budgets | Programs and regional support | $490K builder growth + $100K regional (ecosystem-wide, Jul–Dec) | Through DevRel and ambassador channels | 3 | CGP-0247 | V/U |
| Proof of Ship; CeloPG Support Streams, Proof of Impact, Builder Rewards (Divvi-era) | Builder rewards | — | **Sunset or past.** No live successor found. | 0 | https://www.celopg.eco/programs | V |
| **Anthropic Claude for Startups** | API credits | **$5K** direct; up to $100K through a partner VC | Rolling. Needs an incorporated company, company email and a Claude Console account. | **5** | https://claude.com/programs/startups | S |
| **Cloudflare for Startups** | Credits | $5K (bootstrapped tier) up to $250K | Rolling | **4** | https://www.cloudflare.com/forstartups/ | S |
| Microsoft for Startups | Azure credits (covers Azure OpenAI, not Claude) | $1K, then $4K after verification; $100K with a partner referral | Rolling | 3 | https://www.microsoft.com/en-us/startups | S |
| Google for Startups Cloud | GCP credits | $2K (Start tier). The $350K AI-first tier needs seed to Series A VC funding. | Rolling | 3 | https://cloud.google.com/startup | S |
| AWS Activate Founders | Credits (Bedrock includes Claude) | $1K, up to $5K for some | Rolling. Account must be on the Paid plan. | 3 | https://aws.amazon.com/activate | S |
| OpenAI Codex for Open Source | 6 months ChatGPT Pro + API credits | ~$1.2K plus up to $25K in credits | Rolling; judged on maintainer role and project usage | 2 | https://developers.openai.com/community/codex-for-oss | S |
| Claude for Open Source | 6 months Claude Max 20x | ~$1.2K | Rolling, capped at 10K recipients. High thresholds (e.g., 20+ external contributors). | 1 | https://claude.com/contact-sales/claude-for-oss | S |
| Nigeria AI Collective: Open GPU Compute | Compute, mentorship and a showcase at the Oct 2026 AI Summit | In-kind | Rolling | 3 | https://bit.ly/AIComputeSupport | S |
| NVIDIA Inception | Non-cash perks | — | Rolling | 2 | https://www.nvidia.com/en-us/startups/ | U |
| **Open Agent Hackathon 2026** (GenAI Works) | Online hackathon, 4 tracks | Up to $20K pool | **Register by Oct 5**; build Oct 15–20 | 3 | https://hackathon.genai.works/ | S |
| **Sandbox Africa Hackathon 2026** | Hackathon: software, AI, robotics | ₦10M total (₦5M / ₦3M / ₦2M), roughly $6–7K at ~₦1,500/$ | **Apply by Oct 15** | 3 | https://msmeafricaonline.com/call-for-applications-sandbox-africa-hackathon-2026-for-startups-up-to-%E2%82%A610-million-in-cash-prizes/ | S |
| Amazon Developer Hackathon (Alexa+ MCP / Agent Skill track) | Devpost | Not captured | Oct 23, 12:00 PDT | 2 | https://amazonappdev2026.devpost.com | S |
| ETHGlobal Mumbai (Devcon 8 week) | In-person; sponsor bounties | Sponsor prizes | Nov 5–7 or 6–8 (sources differ) | 2 | https://ethglobal.com/events/mumbai | S |
| Nebius × NVIDIA Global AI Hackathon | Devpost | Not captured | Oct 30 | 1 | https://nebiusglobalaihackathon.devpost.com | S |
| Colosseum Crypto World's Fair | Solana hackathon | $840K pool | Oct 12 | 1 | https://colosseum.com/worldsfair | S |
| Africa Deep Tech Challenge (Laptop LLM) | Challenge | $20K+ | Gate 1 **closed Aug 25** | 0 | https://africadeeptech.org/challenge-2026/ | S |
| Tony Elumelu Foundation 2027 | Seed grant | $5,000 | **Next window Jan 1 – Mar 1, 2027** | 3 | https://www.tefconnect.com | S |
| Google for Startups Accelerator Africa | Equity-free accelerator + up to $350K credits | — | 2026 cohort closed Mar 18 (15 picked from ~2,600); next date TBA | 2 | https://startup.google.com/programs/accelerator/africa/ | S |
| Google Africa Applied AI Lab (Accra) | Non-dilutive co-development + early model access | — | **Closed Aug 31**; demo day Dec 2026. Watch for the next call. | 3 | Google Cloud Summit Africa, Jul 2026 | S |
| Nigeria AI Scaling Hub: SAID Challenge (Gates) | Pairs mature AI solutions with government agencies | Part of a $7.5M hub over 3 years | Unknown | 2 | https://naish.lbs.edu.ng | S |
| Anthropic × Gates Foundation ($200M, May 2026) | Grants and credits for health, education and agriculture | — | Intake route unknown | 2 | https://www.anthropic.com/news | S |
| AfricArena 2026 | Pitch competition and investor access | — | Open; Grand Summit Dec 2–3, Cape Town | 2 | https://www.africarena.com/applications | S |
| AU–EU Youth Action Lab Innovation Grants | Grant | €30–40K | Unknown | 2 | https://aueuyouth.com | U |
| Y Combinator W2027 | Investment | $500K | **Nov 2, 20:00 PT** | 3 (long shot) | https://www.ycombinator.com/apply | S |
| a16z speedrun SR008 | Investment | Up to $1M | Priority window Oct 12 – Nov 1 | 2 | https://speedrun.a16z.com/apply | S |
| Z Fellows | Stipend | $10K | Rolling | 2 | https://www.zfellows.com | S |
| Gitcoin Grants | Quadratic-funding rounds | GG24 (Oct 2025) had a Celo domain with $100K matching | **No Q4 2026 round confirmed** | 3 if a Celo or Africa round opens | https://grants.gitcoin.co | S/U |
| x402 Foundation (Linux Foundation) | "Grants, tools, resources" (claimed) | Unknown | Unknown | 4 if it exists | https://x402.org | U |
| Optimism Retro Funding S7; Base Batches 004; Base Builder Grants | Retro rewards / accelerator | — | S7 **ended Jul 31**; Batches **closed Sep 10**; Builder Grants are nomination-only | 0–1 | — | S |

---

## 3. Top 7, prioritized

**Scoring method.** Score = cash-equivalent value × P(win) × speed.
- Speed is 1.0 if the benefit arrives within about 6 weeks, 0.75 within about 3 months, and 0.4 later.
- Credits count at 40% of face value: roughly the spend we would actually avoid.
- Only items with P ≥ 5% qualify as "realistic". The long shots are listed below the table.
- Where two scores are within about 20%, cash ranks ahead of credits.

| # | Opportunity | Value | P | Speed | Score | Do it by |
|---|---|---:|---:|---:|---:|---|
| 1 | **Prezenti Frontier**: ask 12,000 USDm | $12,000 | 0.25 | 0.75 | 2,250 | Submit **~Oct 10** |
| 2 | **Infrastructure credit stack**: Cloudflare $5K, Microsoft $5K, Google $2K, AWS $1K | $13K face → $5.2K | 0.5 | 1.0 | 2,600* | Oct 3 |
| 3 | **Anthropic Claude for Startups** | $5K face → $2K | 0.6 | 1.0 | 1,200 | Oct 3 |
| 4 | **Prezenti Boost**, via a DevRel nomination for Ajo Circle | $4,000 | 0.2 | 0.75 | 600 | Brief sent by Oct 10 |
| 5 | **Celo Devs agent hackathons in Q4**, plus claiming any Agents at Work prize | ~$1,500 | 0.3 | 0.75 | 340 | When announced (Oct–Nov) |
| 6 | **Sandbox Africa Hackathon 2026** | ~$2,200 average prize | 0.08 | 0.75 | 130 | **Oct 15** |
| 7 | **Open Agent Hackathon 2026** | ~$2,500 | 0.05 | 0.75 | 95 | **Register by Oct 5** |

\*Frontier and the credit stack are about tied, so cash wins the tie. Do both this week.

**Long shots worth one day each (P < 5%).**
- **YC W2027**, due Nov 2. Pitch it as an "AI-native services company plus agent-payment infrastructure".
- **Celo Builder Fund**, $25K SAFE. Apply before Dec 31 only if 2 of its 4 thresholds are met (for example, 1K MAU from Ajo circles, and $5K/month of client payments settled on Celo). Otherwise aim for Q1 2027.
- **a16z speedrun**, priority window Oct 12 – Nov 1.
- **Z Fellows**, rolling.
- **TEF 2027**, which opens Jan 1.

### 1. Prezenti Frontier Pool: up to 15,000 USDm (ask 12,000)
- **Pitch angle.** "**Omni402: pay-per-call and trust rails for Celo's agent economy.**" It lets anyone turn an HTTP API into an x402 endpoint that agents pay per call, with USDC or USDT settled gaslessly by the hosted Celo facilitator. Every provider and agent gets an ERC-8004 identity plus a Self Agent ID. **Verdict** adds evidence-based reputation to the ERC-8004 Reputation Registry.
  - This covers **4 of Frontier's 5 categories**: developer tooling, A2A rails, trust, and discovery.
  - It **complements the Season 2 grantees**. Aigora's bidders can consume Verdict scores, and Omni402's paid endpoints ("lanes") can appear as tools in Celina's catalog.
  - It serves Celo Core Co.'s Season 3 goal of **chain revenue**: every call is a fee-paying transaction.
- **Artifacts to submit.** Pass the checklist in section 4.1 first. Then submit:
  - an MIT-licensed repo with a v1.0.0 release;
  - the live gateway, `omni402-production.up.railway.app`, and dashboard, `omni402.vercel.app`;
  - the mainnet proof transaction and **ERC-8004 agent #9765**, plus a Self Agent ID;
  - a 2–3 minute demo (the Remotion video in `apps/video`);
  - a KarmaGAP profile with milestones;
  - a metrics snapshot: paid calls, distinct buyers, providers, and agents scored.
- **First step.** DM @prezenti_grants or post on the forum to confirm Frontier is open and how much is left. Then submit.

### 2. Infrastructure credit stack (Cloudflare, Microsoft, Google, AWS)
- **Pitch angle.** An AI-native services company that runs client pilots and hosts an x402 gateway. For **Cloudflare**, lead with Omni402 on Workers: x402 at the edge, and Cloudflare co-founded the x402 Foundation. For **AWS**, lead with Bedrock-hosted Claude for clients who need AWS.
- **Artifacts.** A registered company, a domain email, a one-page website, product links and a short usage plan (see 4.3).

### 3. Anthropic Claude for Startups
- **Pitch angle.** Claude powers our productized AI-native services: company-brain deployments and the typed decision layer. The credits fund 3–5 subsidized SME pilots in Lagos and Accra.
- **Artifacts.** A Claude Console organization on the company email, a website, a paragraph describing the use case, and an estimate of monthly tokens. Apply only once the company is incorporated.

### 4. Prezenti Boost, via a Celo Core Co. DevRel & Growth nomination: 3,000–5,000 USDm
- **Pitch angle.** Use a different product from Frontier, so there is no double-dipping. **Ajo Circle** is a savings-circle agent (ajo or esusu) running in Telegram, WhatsApp and MiniPay, settled in USDT or USDm on Celo. It was built with Women in Blockchain Africa and is distributed through the Celo Nigeria community. That fits Boost's Season 2 mix, which included stablecoin payments, and it fits MiniPay priorities.
- **Artifacts.** A one-page brief (section 4.2), live mainnet circles with tagged transactions, member counts, and a demo.
- **Route.** Use the founder's ambassador relationship with Celo DevRel and Growth, and copy Prezenti.

### 5. Celo Devs agent hackathons in Q4
- **Pitch angle.** Reuse Omni402, Relay or Ajo, since each recent edition allowed building on existing repos. Target the tracks scored on-chain: value moved between independent parties, real-world adoption, and 8004scan rank.
- **Rules.** Register on day one to get an attribution tag. Use distribution channels we already own (WhatsApp and Telegram groups). Work on mainnet only, and keep the repo public.
- **Artifacts.** A public repo, the attribution tag, the Dune leaderboard entry, an X post and a demo video.
- **Also.** Check the Agents at Work results (announced Sep 25) for the `ajo-agent` / WiBA entry, and whether Relay/Verdict placed in the Agentic Payments & DeFAI hackathon. Any placing strengthens the Frontier application.

### 6. Sandbox Africa Hackathon 2026: ₦10M pool, apply by Oct 15
- **Pitch angle.** A WhatsApp-native AI agent for Nigerian SMEs and savings groups: Ajo Circle plus AI bookkeeping, settled in stablecoins.
- **Artifacts.** A working prototype, a 2-minute video and pilot users from WiBA or Celo Nigeria. The organizer and event format still need checking.

### 7. Open Agent Hackathon 2026: register by Oct 5, build Oct 15–20
- **Pitch angle.** "Agents that buy their own tools": a production agent that finishes a real task by paying per call for APIs through Omni402.
- **Artifacts.** A live agent, a demo, the repo and real paid-call receipts.

**Also do this week (free).**
- Get the Celo **Agent Visa** Tourist tier. It is automatic after one transaction and gives co-marketing and mentorship.
- Tag all transactions with **ERC-8021**.
- List Omni402 in `awesome-erc8004`, `awesome-agent-payments-protocol`, the A2A registries and the MCP directories. Adoption evidence helps Frontier.
- Apply to the **Nigeria AI Collective GPU compute** program for the research arm and study group.

---

## 4. Application outlines

### 4.1 Prezenti Frontier Pool: "Omni402: pay-per-call and trust rails for Celo agents"

**Ask: 12,000 USDm over 4 months.** This is deliberately below the 15,000 cap, because Season 3 prefers more teams at smaller sizes. **2,400 (20%) is paid on contract and 9,600 across milestones.**

**Checklist before submitting (days 1–7).**
1. Message Prezenti to "discuss fit". Confirm Frontier is open, how much allocation remains, and whether a Nigerian entity can sign the contract.
2. Add an MIT licence to `omni402` and `relay-verdict`. Tag v1.0.0, publish `@omni402/x402ify` to npm, and add repo topics.
3. Get a **Self Agent ID** at app.ai.self.xyz with a passport, using the same wallet that owns ERC-8004 agent #9765.
4. Fix `agent.json`: point the endpoints at the live MCP and x402 URLs, then re-validate on 8004scan.
5. Register an **ERC-8021 attribution tag** and route every settlement through it.
6. Create the **KarmaGAP** project and enter the milestones below.
7. Record a 2–3 minute demo: wrap an API, then an agent pays for it, then show the Celoscan receipt, the Verdict score and the ERC-8004 reputation entry.
8. Prepare the KYC documents, the contracting entity and the Celo delivery address. Snapshot the metrics.

**Form answers.**
- Product: Omni402 (with the Verdict trust module).
- Website: omni402.vercel.app. Repo: github.com/eddiemessiah/omni402.
- ERC-8004: **yes, agent #9765** (8004scan.io/agents/celo/9765).
- Mainnet: **yes**, with the proof transaction `0xf6f71df2f84279c483b138a43c8adcfcd7c1e319459f2b1b2497cdb706a38b38`.
- Open source: yes (MIT). Self Agent ID: yes, once step 3 is done.
- Category: Infrastructure / developer tooling / agent payments.
- Prior Celo collaborations: Celo Nigeria Ambassador; Celo Devs hackathons (Agentic Payments & DeFAI; Agents at Work with Women in Blockchain Africa).
- Originality: disclose that the project was inspired by GlassBox402 (ETHGlobal Lisbon), and that Omni402 is its Celo-native successor.

**Problem.**
- Agents cannot sign up for API keys, and API providers, including African data and fintech APIs, have no way to sell per call to machines. Every builder re-implements the x402 plumbing: the 402 challenge, EIP-3009 signing and facilitator settlement.
- Celo's ERC-8004 registry holds 1,000+ agents, but reputation data is sparse. Our Verdict sweep found many broken registrations: localhost URLs, placeholder repos and unreachable metadata.
- So there is little real agent-to-agent commerce, and therefore little fee-paying activity. Celo Core Co.'s Season 3 north-star metric is chain revenue, and it names agentic use cases as a growth driver.

**Solution.**
1. **x402ify.** One command turns any HTTP API into a pay-per-call x402/MPP endpoint. It supports USDC and USDT through the hosted Celo facilitator, which pays the gas for buyers and never holds funds.
2. **Buyer SDK** (`createBuyer` / `fetchWithAgent`). Agents pay transparently, with no account, API key or gas token.
3. **ERC-8004 registration CLI plus Self Agent ID binding** for providers.
4. **Verdict.** Evidence-based scores built from a live x402 probe, on-chain footprint and a quality review. The scores are EIP-191-signed, sold per query and **published to the ERC-8004 Reputation Registry**.
5. **Directory and MCP server**, so agents and any MCP client can discover and call paid endpoints.
6. **Dashboard** showing live settlements with Celoscan receipts.

Why Celo: sub-cent fees, the hosted x402 facilitator, the ERC-8004 registries, Self Agent ID and MiniPay distribution.

**Milestones.**

| # | When | Deliverable | Verifiable evidence | Tranche |
|---|---|---|---|---:|
| 0 | Contract | Contract and KYC signed | — | 20% = 2,400 |
| M1 | Month 1 | **v1.0 open-source release.** MIT licence, npm packages and docs site. USDC and USDT on the hosted facilitator. **USDm and Mento local stablecoins (e.g., NGNm, KESm)** through a facilitator that supports EIP-2612 permits, because the hosted one supports only EIP-3009. **10 paid endpoints live** on mainnet; every transaction ERC-8021-tagged. | Release tag, npm, Celoscan transactions | 25% = 3,000 |
| M2 | Month 2 | **Trust layer.** Verdict merged in; every listed endpoint scored; scores written to the ERC-8004 Reputation Registry; Self Agent ID for providers; public directory API and MCP server. | Registry transactions, 8004scan, API docs | 25% = 3,000 |
| M3 | Month 3 | **Ecosystem adoption.** At least 10 external providers, prioritizing African FX, data and fintech APIs. At least 2 Celo agent projects integrate the SDK or consume Verdict scores (targets: Aigora, Celina). | Integration PRs, provider list, transaction data | 15% = 1,800 |
| M4 | Month 4 | **Growth and reporting.** 2 developer workshops (Celo Nigeria and the AI study group, 50+ developers), a public Dune dashboard, and a forum completion report with a case study. | Dashboard, recordings, report | 15% = 1,800 |

**Budget (12,000 USDm).**

| Item | USDm |
|---|---:|
| Lead engineering (founder, 4 months, partly funded) | 4,800 |
| Contract engineer (TypeScript/Solidity, about 3 months part-time) | 3,000 |
| Infrastructure: hosting, RPC, facilitator credits, monitoring | 900 |
| External security review of the gateway, SDK and key handling | 1,500 |
| Developer onboarding: workshops, docs, integration bounties for the first 10 providers | 1,300 |
| Contingency | 500 |
| **Total** | **12,000** |

**KPIs by month 4.** All on-chain and ERC-8021-attributed.
- At least 25 paid endpoints from at least 10 external providers.
- At least 5,000 settled x402 calls from at least 50 distinct, independent buyer wallets, with no self-dealing.
- At least 300 agents scored, with reputation entries on the ERC-8004 registry.
- At least 3 Celo projects integrated, and at least 1,000 npm downloads.
- 2 workshops with at least 50 developers.
- Monthly public updates, with evidence for every milestone published.

**Team.**
- **Edidiong Umana ("DeFi Messiah")**, founder and lead engineer, GitHub `eddiemessiah`. Celo Nigeria Ambassador with 4+ years of Web3 DevRel and community work across Africa. In 2026 he shipped Omni402, Relay+Verdict and Ajo Agent on Celo, and he runs an AI engineering study group (`aipathway`, `Upskill-Africa`).
- A contract engineer, to be named before the contract.
- Community partners: Women in Blockchain Africa and Celo Nigeria. List only those who confirm.

**Risks and mitigations.**
- Dependence on the facilitator: add a thirdweb fallback path.
- MiniPay's EIP-712 signing limit for human users: agents sign on the server, so they are not blocked.
- Weak demand: seed providers from the community and hackathon teams.
- Wash-trading perception: count only independent buyers and publish the raw data.

### 4.2 Next-best proposal: Prezenti Boost nomination brief for "Ajo Circle"

Credits (#2 and #3) are simple forms (see 4.3). The next-best opportunity that needs a written case is **Boost**. It is invite-only, so the "application" is a **one-page brief to Celo Core Co. DevRel & Growth** asking them to nominate us. Prezenti then handles the contract and KYC.

- **Ask:** 5,000 USDm over 3 months.
- **Problem.** Ajo, esusu and adashe rotating savings are everywhere in Nigeria and West Africa. They run on trust inside WhatsApp groups, which leads to disputes, defaults and manual bookkeeping, and naira inflation erodes the pot.
- **Solution.** **Ajo Circle** is an agent that keeps the book.
  - It collects fixed weekly contributions in dollar stablecoins on Celo (USA₮ or USDT, with USDm as an option).
  - It pays the whole pot to the member whose turn it is.
  - It sends Telegram reminders and receipts, with WhatsApp next, and uses MiniPay `add_cash` deeplinks for deposits.
  - **Self** verification keeps one human to one seat, and every payout is **ERC-8021-tagged**.
  - Payouts run as a dry run by default and need an explicit "execute" before any money moves.
  - It was built live with Women in Blockchain Africa.
- **Milestones.**
  - **M1** (month 1): 20 live circles with 100 members on mainnet, the Telegram bot generally available, and MiniPay deposit links.
  - **M2** (month 2): a WhatsApp flow, missed-payment handling (grace periods and reminders), a dashboard for multiple circles, and an NGNm option.
  - **M3** (month 3): 100 circles with 500 members, a MiniPay mini-app submission and a public completion report.
- **Budget (5,000 USDm).**
  - Engineering: 2,200
  - Community onboarding (10 sessions in 3 cities with Celo Nigeria and WiBA, plus local coordinators): 1,500
  - Infrastructure and gas sponsorship: 400
  - Support and localization (Pidgin, Yoruba, Hausa, Igbo): 500
  - Contingency: 400
- **KPIs.** 500 verified members; at least $15K in contributions settled on Celo; at least 80% of contributions on time; at least 70% of circles completing a full cycle; at least 3,000 attributed transactions; at least 40% of members new to crypto.
- **Team.** Edidiong Umana (lead), a WiBA partner lead and community coordinators.
- **Attach.** A demo video, a Celoscan or Dune view of the tagged payouts and member counts.

### 4.3 Credits kit (one sitting, after incorporation)

**Prerequisites.** A registered company (name, country and registration number), a company-domain email, a one-page site with product and team, founder LinkedIn and X profiles, and demo links.

**Anthropic.**
- Create a Claude Console organization with the company email.
- Use case: productized AI-native services for SMEs (company-brain deployments and a typed decision layer), plus agent-payable APIs.
- Estimate monthly tokens.
- No equity is taken.

**Cloudflare.** Omni402 and x402 at the edge on Workers. **Microsoft:** $1K now and $4K after verification, used for Azure OpenAI fallback models and evals. **AWS:** $1K for Bedrock, and the account must be on the Paid plan. **Google:** $2K for Gemini and Vertex, useful for African-language features.

If we later join an accelerator or raise from a VC, **reapply through the partner for higher tiers**: $100K at Anthropic and Microsoft, and up to $350K at Google.

### 4.4 Action calendar

| When | Action |
|---|---|
| By Oct 3 | Set up the entity, domain and website. Add licences and a release. Get the Self Agent ID. Create KarmaGAP. Register the attribution tag. DM Prezenti. **Apply for all credits.** Check Agents at Work results. |
| Oct 5 | Open Agent Hackathon registration closes. |
| Oct 6–10 | **Submit Frontier.** Send the Boost brief to DevRel & Growth. |
| Oct 15 | Sandbox Africa application deadline. |
| Late Oct – mid Nov | Frontier decision (2–4 weeks), then contract and KYC, then the 20% payment. Watch for the next Celo Devs hackathon. Optional: YC W2027 (Nov 2). |
| November | Prezenti mid-season update, including reserve top-ups. If Frontier says no, use the rubric feedback and resubmit before the December close. |
| December | Deliver Frontier M1. Check the Celo Builder Fund thresholds before Dec 31. Prepare TEF, which opens Jan 1. |

---

## 5. Sources

**Prezenti and Celo governance (primary).**
- CGP-0249, Prezenti Season 3 (executed 2026-08-10): https://github.com/celo-org/governance/blob/main/CGPs/cgp-0249.md
- CGP-0227, Prezenti Season 2: https://github.com/celo-org/governance/blob/main/CGPs/cgp-0227.md
- CGP-0247, Celo Core Co. Season 3: https://github.com/celo-org/governance/blob/main/CGPs/cgp-0247.md
- CGP-0246 (Stabila), CGP-0248 (CICLOPS), CGP-0251 (Communities Guild): https://github.com/celo-org/governance/tree/main/CGPs
- Prezenti sponsorship repo: https://github.com/prezenti/talent-engine
  - `README.md`, `RUBRIC.md`, `docs/PREZENTI_SPONSORSHIP_TRIAL.md`
  - `policies/prezenti-sponsorship-trial.json`, `programs/prezenti-sponsorship-trial.json`
  - `forms/sponsorship-application.json`, `deploy/close-sponsorship-form.sh`
  - commits `a57c692` (2026-09-23) and `4fd59bb` (2026-09-25)
- Prezenti pledge repo: https://github.com/prezenti/prezenti-pledge
- Celopedia grants reference, current and May-2026 versions: https://github.com/celo-org/celopedia-skills/blob/main/skills/celopedia-skill/references/grants-funding.md
- Celopedia `ai-agents.md` (Agent Visa, facilitator, hackathons) and `self-agent-id.md`: https://github.com/celo-org/celopedia-skills/tree/main/skills/celopedia-skill/references
- Celopedia docs-watch snapshot: https://github.com/celo-org/celopedia-skills/blob/main/.claude/skills/docs-watch/snapshot.md

**Prezenti (secondary, or blocked and cited through search).**
- https://www.prezenti.xyz/ · https://frontier.prezenti.xyz/ · https://anchor.prezenti.xyz/ · https://sponsorships.prezenti.xyz/ · https://pledge.prezenti.xyz/ · https://charmverse.prezenti.xyz/how-to-apply-8550294288575042
- Celo Forum:
  - Season 3 Plan: https://forum.celo.org/t/prezenti-grants-season-3-plan/13598
  - Season 3 Is Open: https://forum.celo.org/t/prezenti-season-3-is-open-frontier-anchor-and-boost-grants-for-celo/13714
  - Introducing the Frontier Pool: https://forum.celo.org/t/prezenti-season-2-update-introducing-the-frontier-pool-ai-agent-economy-infrastructure/13277
  - Season 2 retrospective: https://forum.celo.org/t/prezenti-season-2-retrospective-report/13563
  - Move to Tally: https://forum.celo.org/t/prezenti-grant-applications-have-moved-to-tally/13318
  - A public Season 3 Frontier proposal: https://forum.celo.org/t/project-proposal-on-celo-governance-prezenti-3-season-frontier/13766
- Celo blog, Season 2 close: https://blog.celo.org/prezenti-closes-season-2-of-celo-ecosystem-grants-funding-builders-across-agent-infrastructure-and-538f19212945
- X posts: https://x.com/Celo/status/2079189702524227970 · https://x.com/prezenti_grants/status/2026644038439342346
- A public Frontier application draft (form fields): https://github.com/zkos-labs/bastion/blob/main/prezenti-frontier-grant.md
- A current Season 3 applicant: https://github.com/zuemen/agent-passport
- Season 2 grantee Celina: https://github.com/andrewkimjoseph/celina · https://usecelina.xyz/ · https://forum.celo.org/t/celina-unofficial-update-full-governance-validator-staking-for-ai-agents-on-celo-mainnet/13736
- Season 2 Frontier window and size (Jun 2026 notes): https://github.com/akawolfcito/chesscito/blob/main/docs/reviews/2026-06-18-celopedia-ecosystem-fit-and-grants-strategy.md

**Founder's evidence.**
- https://github.com/eddiemessiah/omni402 (`README.md`, `agent.json`, `apps/video/src/proof.ts`, `packages/x402ify/src/erc8004.ts`)
- https://github.com/eddiemessiah/relay-verdict (`docs/PROGRESS.md`)
- https://github.com/eddiemessiah/ajo-agent
- https://github.com/eddiemessiah/ajo-circle
- https://github.com/eddiemessiah/wiba-agents-at-work

**Celo hackathons.**
- https://celoplatform.notion.site/Agents-at-Work-Hackathon-3c1d5cb803de81139de7f4f3d09e55dc
- https://dune.com/celo/agents-at-work-hackathon
- https://www.celopg.eco/insights/and-the-winners-are-in-real-world-agent-hackathon-v2
- Official celobuilders links cited in https://github.com/bilgin-kocak/preflight/blob/main/docs/hackathon/round-two.md
- https://blockchain.news/flashnews/celo-hackathon-adds-agent-infrastructure-track-with-global-scaling-focus

**AI and cloud credits.**
- Anthropic: https://claude.com/programs/startups · https://securityboulevard.com/2026/08/anthropic-claude-for-startups-the-complete-guide-to-credits-tiers-and-eligibility-2026/
- Claude for Open Source: https://claude.com/contact-sales/claude-for-oss · https://simonwillison.net/2026/Feb/27/claude-max-oss-six-months/
- OpenAI Codex for OSS: https://developers.openai.com/community/codex-for-oss
- Google: https://cloud.google.com/startup
- Microsoft: https://creditforstartups.com/resources/microsoft-azure-startup-credits
- AWS: https://klymentiev.com/blog/free-aws-credits
- Cloudflare: https://creditforstartups.com/companies/cloudflare · https://blog.cloudflare.com/x402/
- x402 Foundation: https://www.coinbase.com/blog/coinbase-and-cloudflare-will-launch-x402-foundation · https://www.linuxfoundation.org/press/linux-foundation-announces-operational-launch-of-x402-foundation-to-standardize-internet-native-payments-for-ai-agents-and-applications

**Hackathons and events.**
- Open Agent Hackathon: https://hackathon.genai.works/ · https://ai.ncsa.illinois.edu/illinois-students-invited-to-form-teams-and-build-ai-solutions-on-a-global-stage/
- ETHGlobal Mumbai: https://ethglobal.com/events/mumbai/info/details
- Sandbox Africa Hackathon: https://msmeafricaonline.com/call-for-applications-sandbox-africa-hackathon-2026-for-startups-up-to-%E2%82%A610-million-in-cash-prizes/ · https://hausaloaded.com/2026/09/sandbox-africa-hackathon-2026-up-to-%E2%82%A610-million-in-cash-prizes.html
- Africa Deep Tech Challenge: https://africadeeptech.org/challenge-2026/
- Live-checked sweep dated 2026-09-18 (Amazon, Nebius, Colosseum, YC W27, speedrun, Z Fellows, Optimism S7, Base): https://github.com/nirholas/three.ws/blob/main/marketing/growth/sweep-2026-09-18.md

**Africa programs.**
- Google Accelerator Africa 2026: https://github.com/designevangelist/Design-Tech-News/blob/main/src/content/opportunities/google-startups-accelerator-africa-2026.md
- Google Africa Applied AI Lab: https://github.com/prajwalgajakesari/the-vault-ai/blob/main/editions/2026/07/12/stories/08-google-africa-applied-ai-lab.md
- Africa funding landscape, verified 2026-08-05 (TEF, YC, timbuktoo): https://github.com/abdullibrahim733-pixel/Eagle/blob/main/hermes-backup/skills/research/web-research/references/africa-startup-funding-landscape-2026.md
- AfricArena and next accelerator cohorts: https://github.com/VeriGate-Org/verigate/blob/main/docs/funding/funding-opportunities-research-2026.md
- AU–EU and Accelerate Africa: https://github.com/washingtoneimae-dot/agent/blob/main/skills-library/research/solo-dev-commercialization/references/funding-research-africa.md
- Nigeria (NAISH/SAID, NG AI Collective compute, Anthropic × Gates, Google.org): https://github.com/aicollectiveng/Nigeria-AI-Repository

---

## 6. Unverified notes and open questions

- **Research limits.** The web-search budget ran out (200 of 200 calls), and the proxy blocked prezenti.xyz, forum.celo.org, blog.celo.org, celopg.eco and celobuilders.xyz. Everything tagged [S] or [U] above needs a browser check before we act on it.
- **Is Prezenti Season 3 open?** The live-site text contradicts itself (see 1.6). Confirm by DM.
- **Season 2 Frontier grantees** (Aigora, Celina) come from search summaries, and their amounts are not public. The Season 2 figure of "up to 25K" comes from a builder's notes; the Season 3 cap of 15K is primary.
- **Sponsorship closure.** This is inferred from the repo's close script and the 2026-09-25 invite-route commit. The live page could not be loaded.
- **Omni402 live status.** The gateway at `omni402-production.up.railway.app` and ERC-8004 agent #9765 are taken from the repo's own proof file. Verify both are live before submitting.
- **Next Celo Devs hackathon.** Not announced as of about Sep 18–26. The monthly-ish cadence is inferred from 2026 events: Real World Agents V2 and Synthesis (Mar), Onchain Agents (May 22 – Jun 15), Agentic Payments & DeFAI (winners Aug 14), and Agents at Work (Aug 28 – Sep 14). The founder's placings in those events are unknown.
- **Credit programs.** Amounts and eligibility come from third-party 2026 guides. Confirm on the official pages, especially Cloudflare's "bootstrapped" tier and AWS's Paid-plan requirement.
- **Details we could not confirm.** Sandbox Africa's organizer and format, ETHGlobal Mumbai's dates (Nov 5–7 or 6–8) and prize pool, and the open status of NAISH/SAID, the Nigeria AI Collective compute program, AU–EU grants and Anthropic × Gates. We have only one source for each.
- **Not researched to a verified status (no open Q4 2026 call confirmed):**
  - Mozilla (Foundation, Technology Fund, Builders)
  - Lacuna Fund, which has historically funded labeled datasets
  - Gates Grand Challenges AI calls, beyond NAISH and the Anthropic partnership
  - Africa's Talking, which is useful as an SMS/USSD partner for Ajo but has no grant program on record
  - Smart Africa
  - NITDA's 3MTT, which is training, not company funding; becoming a learning partner might suit the study group [U]
  - Ghana government AI funds
  - timbuktoo hubs other than AgriTech
  - Celo Camp: no 2026 edition found
  - Divvi or MiniPay incentive programs: no live program found. Celo says ERC-8021 data "will be used for future reward distribution".
- **Pan-African AI Summit 2026 (Accra).** No fund announcements found. Google's Accra Applied AI Lab (announced July 2026, closed Aug 31) is the nearest Accra-based program. Follow up with summit contacts directly.
- **x402 Foundation grants.** Only one secondary source says it "supports developers with grants". Ask through its member channels, since Cloudflare, Coinbase and Anthropic are listed members.
- **Gitcoin.** GG24 ran in Oct 2025 with a Celo domain. GG25 was aimed at Q2 2026. No Q4 2026 round is confirmed. If a Celo or Africa round opens, the AI study group and research arm (`aipathway`, `Upskill-Africa`) fit well.
- **Celo Core Co. regional and builder budgets.** Whether the founder can reach them through ambassador channels (for example, to fund study-group events) is inferred, not confirmed.
- **Scoring model.** The probabilities and speed factors in section 3 are judgment calls, stated so they can be challenged.
