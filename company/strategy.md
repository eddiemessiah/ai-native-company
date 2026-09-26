# Strategy

## One line

**An AI-native firm for Africa's businesses and the agent economy: finished work, priced per unit, with every decision inspectable.**

## The thesis, from four places

1. **AI-native services** (Greg Isenberg, Sept 2026). Businesses spend about six times more on services than on software. Sell the finished work, not the tool; price per unit against the human alternative; the rulebook of what "correct" means is the moat. Build in the box where the work is already outsourced and the answer is checkable.
2. **System One models** (TypeSafe's Jev, Sept 2026). Most calls inside an agent are typed decisions (route, score, approve), not text. Put a calibrated decision model at the front of every expensive queue, and let code own anything exact or irreversible. This is what gives a service business software margins.
3. **Agent reliability** (Princeton, 2026). The HAL team moved from leaderboards to reliability: consistency, robustness, calibration and safety. Regulators in Ghana and Nigeria are moving the same way, asking for evidence of control. We ship the evidence with every job.
4. **The multiplayer teammate** (Supermemory company-brain). The hard part of an AI teammate isn't answering; it's knowing when to speak, when to check first, and when to stay silent. We deploy that as a product, with the triage moved onto a System One model.

## Why us

- **Distribution we already own.** 25+ events, 11+ workshops, 22 Proof of Ship projects, Café Cursor Lagos (300+), Enugu Tech Fest (15,000), and an existing base of SME website clients.
- **Proven infrastructure.** Omni402 settles x402 payments on Celo mainnet and has an ERC-8004 identity (agent #9765). Ajo Circle and Padi are live agent products.
- **A talent engine.** The AI Study Group trains the reviewers and forward-deployed engineers the firm needs.
- **Location.** Lagos pricing, global delivery, and a live view of what African businesses actually need.

## The flywheel

```
  paid services ──► rulebooks and decision logs ──► APIs and infrastructure
        ▲                                                     │
        │                                                     ▼
  study-group graduates ◄── sponsors and employers ◄── credibility and case studies
  (the review layer and
   the forward-deployed bench)
```

- Every job teaches us what "correct" means, and that becomes a rulebook entry.
- Rulebooks plus decision logs become recipe APIs (triage, lead score, grant fit, content gate) that agents pay for per call.
- Case studies and research (Griot) bring sponsors and employers to the study group.
- The study group produces the people who run the review layer and the forward-deployed work, so delivery scales without the founder in every loop.

## Horizons

| Horizon | When | Goal | What we sell |
|---|---|---|---|
| **H1: cash** | Weeks 0–4 | First paying customers and case studies from our existing network | Agent-Ready Website, AI Visibility Audit, Agent Readiness Audit, Grant Desk, Pro cohort presale, 1 Agent Launch Sprint or Company Brain |
| **H2: productize** | Months 1–3 | Repeatable delivery through playbooks, paid APIs live, grants in | The same services with written playbooks; recipe APIs on x402; the Prezenti Frontier grant for Omni402; team upskilling |
| **H3: infrastructure and regulated B2B** | Months 3–12 | Infrastructure revenue and regulated buyers | Agent Reliability Audit, AML Alert Triage and NDPA work for fintechs; Agent Spend Firewall; AfroEval; chapters across Africa |

## Who we sell to

| Segment | Pain | Lead offer | Where we find them |
|---|---|---|---|
| **SMEs (our existing clients first)** | Customers on WhatsApp, no staff to answer; AI assistants get their prices wrong | Agent-Ready Website + AI Visibility Audit | Current clients, markets, trade associations, Instagram |
| **Funded startups** (Lagos, Nairobi, remote) | Ops overload; LLM bills | Company Brain, Agent Launch Sprint, Decision Router Retrofit | Founder networks, accelerators, X |
| **Fintechs and banks** | CBN automated-AML deadline; auditors are coming | Agent Reliability Audit, AML Alert Triage | Compliance leads, fintech events, regulatory sandboxes |
| **NGOs, foundations, ecosystems** | Grant writing, reporting, training their people | Grant Desk, Team AI Upskilling, Ecosystem Intelligence | Development-sector networks, ecosystem teams |
| **Agent builders and agents** | Need typed decisions and paid data without accounts | Recipe APIs, Omni402, Spend Firewall | llms.txt, agent card, x402 discovery, hackathons |

## Unit economics (planning numbers)

| Offer | Price | Delivery cost | Gross margin (target) |
|---|---|---|---|
| AI Visibility Audit | ₦60,000 | ~1.5 h of review + a few dollars of model calls | 80%+ |
| Agent-Ready Website | ₦300,000 + ₦35,000/mo | ~2 days of work + ₦5–10k/mo to run | 60–70% setup; 75%+ care |
| Agent Readiness Audit | $490 (₦150k for SMEs) | ~4 h of review | 70%+ |
| Grant application | $350 | ~3 h of review + edits | 70%+ |
| Company Brain | $3,500 + $900/mo | 1–2 days of deployment; ~2 h/mo of care (client pays their own infrastructure) | 70%+ |
| Recipe API call | $0.01 | ~$0.0002 on Jev; ~$0.005–0.01 on the Claude fallback; $0.001 settlement | 70–95% on Jev |

Rule: **price against the human alternative, never cost-plus.** Revisit prices after every ten jobs.

## Moats, in order

1. **Rulebooks.** Hundreds of caught mistakes per niche; a competitor can download the model in an afternoon but not our mistakes.
2. **Decision logs.** Every decision is logged with its model version, probabilities and outcome. That becomes our evaluation data and our audit trail for regulated buyers.
3. **Distribution and trust** in the Nigerian builder and SME community.
4. **The bench.** A trained, certified reviewer workforce that competitors would have to build from scratch.

## What we won't do

- Let a model fire anything that moves money or can't be undone. It prepares; a person approves.
- Invent traction, users or partners, for us or for clients.
- Take paid work that conflicts with an ecosystem role (see `ops/conflicts-of-interest.md`).
- Resell raw Jev decisions as a generic API until TypeSafe confirms in writing that its terms allow it.
- Inflate on-chain volume. Every transaction we report is between independent parties.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Model vendor terms (Jev resale, distillation) | Sell recipes with rulebooks, not raw decisions; get written confirmation; keep the Claude fallback path |
| Platform policy (Meta's rules on general-purpose AI chatbots in WhatsApp) | Business-specific assistants tied to the business's own catalogue and policies; confirm the policy per deployment |
| Founder time is the bottleneck | Playbooks from day one; study-group reviewers from month two; say no to custom work |
| FX volatility | Quote SMEs in naira, everyone else in USD; accept USDC/USDT on Celo |
| Regulation (NDPA, CBN, Ghana's data protection bill) | Data minimization, in-region processing where required, decision logs, human approval on anything consequential |
| Conflict of interest with the Celo role | Written disclosure, recusal, separate company email and accounts |

## Measures that matter

- **Weekly:** cash collected, new qualified leads, jobs delivered, rulebook entries added, paid API calls, study-group applicants.
- **Monthly:** gross margin per offer, founder hours per job, repeat-customer rate, bench members active.
- **Quarterly:** revenue mix (services vs APIs vs community), case studies published, grants won.
