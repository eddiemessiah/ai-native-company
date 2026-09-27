# Strategy

## One line

**An AI-native firm for businesses anywhere and the agents that work for them: finished work priced per unit, decisions agents pay for per call, and every decision inspectable.**

## The thesis, from five places

1. **AI-native services** (Greg Isenberg, Sept 2026). Businesses spend about six times more on services than on software. Sell the finished work, not the tool; price per unit against the human alternative; the rulebook of what "correct" means is the moat. Build in the box where the work is already outsourced and the answer is checkable.
2. **System One models** (TypeSafe's Jev, Sept 2026). Most calls inside an agent are typed decisions (route, score, approve), not text. Put a calibrated decision model at the front of every expensive queue, and let code own anything exact or irreversible. This is what gives a service business software margins.
3. **Agent reliability** (Princeton, 2026). The HAL team moved from leaderboards to reliability: consistency, robustness, calibration and safety. Regulators are moving the same way and asking for evidence of control: the CBN's automated-AML standard in Nigeria, the FCA's AI Live Testing in the UK, the RBI's FREE-AI framework in India. We ship the evidence with every job.
4. **The multiplayer teammate** (Supermemory company-brain). The hard part of an AI teammate isn't answering; it's knowing when to speak, when to check first, and when to stay silent. We deploy that as a product, with the triage moved onto a System One model.
5. **Agents are customers** (x402, Sept 2026). An agent with a wallet buys without procurement: it checks that a service does what it needs, then pays per call. About 73,000 x402 payments a day run on Base, but the paid market is still small: the 2,010 CDP Bazaar routes with three or more paying buyers declared about $10,722 in 30 days (our count, `research/first-customers.md`). Agents are the quickest buyers to close and, for now, the smallest market.

## Why us

- **Distribution we already own.** 25+ events, 11+ workshops, 22 Proof of Ship projects, Café Cursor Lagos (300+), Enugu Tech Fest (15,000), and an existing base of SME website clients.
- **Proven infrastructure.** Omni402 settles x402 payments on Celo mainnet and has an ERC-8004 identity (agent #9765). Ajo Circle and Padi are live agent products.
- **A talent engine.** The AI Study Group trains the reviewers and forward-deployed engineers the firm needs.
- **Lagos costs, global prices.** Built in Lagos and sold worldwide in USD: cards through Stripe, stablecoins through x402. Nigerian SMEs can still pay in naira.

## Agents first; people pay first

Agents are the quickest buyers to close: no procurement, no meetings. An agent buys when it can check that a service does what it needs and pay per call. So everything we sell agents is built to be checked (discovery files, an MCP server, an on-chain identity, a live 402) and priced at $0.01 a call. We push these first and hardest.

| Product | What the agent gets | Price |
|---|---|---|
| **Shonin Check** | Before it pays a 402: ten checks on the request (scheme, network, token, amount, budget, payee, domain, timeout, resource, host) and, given the user's task, a verdict on whether the purchase serves it: pay, confirm with a person, or block | $0.01 |
| **Shonin Gate** | Before it acts: does the action match the request and the approval, and is it riskier than stated? Execute, confirm or escalate, by risk tier | $0.01 |
| **Shonin Receipt** | After it pays: the settlement read from the chain, matched to the payment and signed | $0.01 |

What the research says (`research/first-customers.md`), and what we do about it:

1. **The niche is crowded, and almost nobody in it is paid yet.** 907 Bazaar entries on 102 hosts sell trust checks, preflights, receipts or spend control; the 31 with three or more paying buyers earned about $15 combined in 30 days (our count). Wallets already ship budgets and receipts. **We lead with what they lack:** the task-fit verdict, "confirm with a person" as an outcome, and the decision log.
2. **Celo alone is invisible to buying agents.** 598 of the 600 Bazaar entries that accept Celo belong to one gateway, and x402scan doesn't index Celo. **The Base leg goes on (CDP keys) before any listing push.**
3. **The first agent dollars come through someone else's wallet.** Opt-in integrations into buyer tools that already pay arbitrary sellers (Run402, opencrowd, tryx402, ArisPay, AgentCash), and Virtuals ACP as a provider and evaluator. A listing is a prerequisite, not demand: 74% of Bazaar entries got one payer or none in 30 days.
4. **The first cash is human.** Our estimate for month one on the agent side is cents to tens of dollars. Warm-network services pay in weeks 1–2. After that comes the Agent Reliability Audit (from $3,000) for teams whose agents move money, opened with a free Shonin Check report on their own live 402.

Selling through Celo channels stays off-limits (`ops/conflicts-of-interest.md`, rules 1–2).

**Who pays how.** Agents pay per call with x402: USDC or USDT on Celo, and USDC on Base once the CDP keys are set. People anywhere pay by card through Stripe Checkout; people in Africa can use local rails through Paystack. The amount always comes from the catalog.

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

## AI roll-ups: picks and shovels now, acquire later

About $5 trillion of US businesses will change hands by 2035, many from retiring owners with no successor (McKinsey, via Greg Isenberg's Sep 2026 guide). An AI roll-up buys a services firm at a services price and rebuilds delivery with agents: the clients and revenue stay, and the cost per unit of work drops. Greg's thesis is a move from ~5–10% EBITDA margins to 30–40%. The results behind it are self-reported. Sources and caveats: `research/ai-rollups.md`.

The operating model in the guide is the one we already run:

- a rulebook of what "correct" means (catalog rulebooks and playbooks);
- a corrections log that improves it every week (`ops/rulebook-log.md`);
- a preparer kept apart from a reviewer that can block but never ship (Shonin Gate, the content gate);
- decision logs with confidence;
- the automation map, which is our Agent Readiness Audit pointed at a target.

**Now (H1–H2): sell picks and shovels to acquirers.** Searchers, ETA buyers, small holdcos and PE-backed roll-ups, worldwide. Both offers are in beta:

- **Acquisition Automation Map**, $2,500 per target: every task in the target mapped from 20–50 anonymized work samples and classed (automate now, with review, assist only, keep human), plus the margin model, before the LOI.
- **100-Day Agent Integration**, from $12,000 per firm + $1,500/month: shadow mode, then the back office, then careful expansion, with rulebook interviews, a corrections log and a Monday dashboard of margin and retention.

Each map teaches us one industry's rulebook before we own anything in it.

**Later (H3): buy one small services firm ourselves.** Finance it with a seller note plus the seller's rollover; SBA loans are for US buyers, and elsewhere seller notes and revenue-based financing carry the deal. Candidates fit our rulebooks: bookkeeping and accounting, payroll, insurance agencies, IT managed services, digital agencies. Where: Nigeria, Ghana or Kenya, or anywhere through a partner searcher. We buy only when all of these hold:

1. Services cash flow has covered the firm's costs, founder included, for three months running, without grant money.
2. We have delivered at least one map and one integration in the target's line of work, and that rulebook's corrections are falling week on week.
3. Study-group reviewers can run the review layer without the founder in every loop.
4. The target scores over 80% on the scorecard, and its own automation map shows the margin path.
5. The seller rolls equity and stays through the handoff.
6. Edidiong approves the deal, the financing and every signature.

**Rule:** we never bid for a firm we mapped for a client, and nothing learned in a client's diligence feeds our own deals.

## Horizons

| Horizon | When | Goal | What we sell |
|---|---|---|---|
| **H1: cash, and agents calling** | Weeks 0–4 | First paying customers from our network; first paid calls from agents we don't control; the GTM Harness launched (free) | Shonin Check, Gate and Receipt on x402 (Celo, then Base); Agent-Ready Website, AI Visibility Audit, Agent Readiness Audit, Grant Desk, Pro cohort presale, 1 Agent Launch Sprint or Company Brain |
| **H2: productize** | Months 1–3 | Repeatable delivery through playbooks, agent products inside the wallets that pay, grants in, first acquirer clients | The same services with written playbooks; Check, Gate and Receipt integrated into agent wallets and listed on Virtuals ACP; recipe APIs on x402; the Prezenti Frontier grant for Omni402; team upskilling; Acquisition Automation Map and 100-Day Agent Integration for acquirers |
| **H3: infrastructure, regulated B2B, first acquisition** | Months 3–12 | Infrastructure revenue and regulated buyers; one small services firm bought, only once the six conditions under "AI roll-ups" hold | Agent Reliability Audit, AML Alert Triage and NDPA work for fintechs; Agent Spend Firewall; AfroEval; chapters across Africa; the acquired firm's own services, delivered by our agents |

## Who we sell to

| Segment | Pain | Lead offer | Where we find them |
|---|---|---|---|
| **Agents, and the wallets and marketplaces they buy through** | Paying a 402 they can't vet; acting beyond what the user asked; no receipt their operator's books accept | Shonin Check, Shonin Gate, Shonin Receipt ($0.01 a call) | Integrations into buyer wallets (Run402, opencrowd, tryx402, ArisPay, AgentCash), Virtuals ACP, the CDP Bazaar and x402scan, the MCP registry, llms.txt, the agent card |
| **SMEs, anywhere (our existing clients first)** | Customers on WhatsApp, no staff to answer; AI assistants get their prices wrong | Agent-Ready Website + AI Visibility Audit | Current clients, trade associations, Instagram, WhatsApp |
| **Funded startups** (worldwide; Lagos, Nairobi and remote teams first) | Ops overload; LLM bills | Company Brain, Agent Launch Sprint, Decision Router Retrofit | Founder networks, accelerators, X |
| **Fintechs and banks** | Regulators want evidence of control: the CBN's automated-AML standard, the FCA's AI Live Testing, the RBI's FREE-AI | Agent Reliability Audit, AML Alert Triage | Compliance leads, fintech events, regulatory sandboxes, LinkedIn |
| **NGOs, foundations, ecosystems** | Grant writing, reporting, training their people | Grant Desk, Team AI Upskilling, Ecosystem Intelligence | Development-sector networks, ecosystem teams |
| **Agent builders and x402 sellers** | Need typed decisions and paid data without accounts; payment paths attackers probe ("Five Attacks on x402", arXiv 2605.11781) | Recipe APIs, Omni402, Agent Reliability Audit, Spend Firewall | llms.txt, agent card, x402 discovery, hackathons outside Celo, a free Shonin Check report on their own 402 |
| **Acquirers** (searchers, ETA buyers, small holdcos, PE-backed roll-ups; worldwide) | Buying a services firm at a services price: need to know before the LOI how much of the work agents can take over, then to rebuild delivery without losing clients or key staff | Acquisition Automation Map, then 100-Day Agent Integration | Search-fund and ETA communities, business brokers, deal lawyers and quality-of-earnings accountants, holdco operators on X and LinkedIn |

## Unit economics (planning numbers)

| Offer | Price | Delivery cost | Gross margin (target) |
|---|---|---|---|
| Shonin Check, Gate, Receipt | $0.01 per call | The ten checks and the receipt are code plus one chain read; the task verdict and the gate are one decision call (~$0.0002 on Jev); $0.001 settlement | ~88–90% on Jev or code alone; 0–40% on the Claude fallback |
| AI Visibility Audit | $150 (₦60,000 in Nigeria) | ~1.5 h of review + a few dollars of model calls | 80%+ |
| Agent-Ready Website | From $200 + $25/mo (₦300,000 + ₦35,000/mo in Nigeria) | ~2 days of work + ₦5–10k/mo to run | 60–70% setup; 75%+ care |
| Agent Readiness Audit | $490 (₦150k for SMEs) | ~4 h of review | 70%+ |
| Grant application | $350 | ~3 h of review + edits | 70%+ |
| Company Brain | $3,500 + $900/mo | 1–2 days of deployment; ~2 h/mo of care (client pays their own infrastructure) | 70%+ |
| Recipe API call | $0.01 | ~$0.0002 on Jev; ~$0.005–0.01 on the Claude fallback; $0.001 settlement | 70–95% on Jev |

Rule: **price against the human alternative, never cost-plus.** Revisit prices after every ten jobs.

## Moats, in order

1. **Rulebooks.** Hundreds of caught mistakes per niche; a competitor can download the model in an afternoon but not our mistakes.
2. **Decision logs.** Every decision is logged with its model version, probabilities and outcome. That becomes our evaluation data and our audit trail for regulated buyers.
3. **Distribution and trust.** The builder and SME communities we come from, and a record an agent can check before it buys: an on-chain identity, signed receipts, a live 402.
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
| Currency and payment rails | Price in USD, with naira prices for Nigerian SMEs; cards through Stripe, stablecoins through x402, local rails through Paystack |
| Stripe needs a registered company in a country it supports | Register the company first and confirm Stripe supports its country before card checkout goes on; until then, Paystack and x402 |
| The agent market is small and the niche is crowded | Lead with the task-fit verdict and "confirm with a person"; get into the wallets that already pay; plan no agent cash until we have 60 days of calls |
| Celo alone is invisible to buying agents | The Base leg goes on before any listing push; Celo stays for settlement and identity |
| Mistaking listings for demand | Count distinct paying wallets we don't control, never listings, and never calls from our own wallets |
| Regulation (NDPA, CBN, Ghana's data protection bill; the EU AI Act's transparency duties from 2 Aug 2026) | Data minimization, in-region processing where required, decision logs, human approval on anything consequential |
| Conflict of interest with the Celo role | Written disclosure, recusal, separate company email and accounts |
| Buying or integrating faster than agents can take over the work (ours or a client's) | One firm at a time; the next only after the first one's Monday numbers hold for a quarter; days 1–30 change nothing clients see |
| Key-person and client loss after a close | The seller rolls equity and stays through the handoff; the deal is announced with the former owner; senior staff write and approve the rulebook; client and key-person retention reported every Monday next to margin |
| Advising acquirers while planning to acquire | Never bid for a firm we mapped for a client; client diligence never feeds our own deals; both written into every engagement letter |
| Roll-up results are self-reported | Underwrite every target from its own work samples and books, never from peers' published margins |

## Measures that matter

- **Weekly:** cash collected, new qualified leads, jobs delivered, rulebook entries added, paid agent calls and distinct paying wallets we don't control, GTM Harness runs, study-group applicants.
- **Monthly:** gross margin per offer, founder hours per job, repeat-customer rate, bench members active.
- **Quarterly:** revenue mix (services vs APIs vs community), case studies published, grants won.
