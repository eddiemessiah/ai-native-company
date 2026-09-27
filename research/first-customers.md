# First customers for Shonin: where agents buy, who pays first, and how to reach them

*As of 2026-09-27. Prepared for Edidiong Umana. Scope: global and agent-first. The priority is Shonin Check, Shonin Gate and Shonin Receipt at $0.01 per call over x402 (USDC on Celo, with the Base leg already wired in code); human services come second. Read this with `research/agent-payments.md`.*

## How to read the evidence tags

| Tag | Meaning |
|---|---|
| **[src]** | Read in a cloned repo, in a README fetched from GitHub, or in a file in this repo. Commits are listed in §6. |
| **[data]** | Our own count from a public dataset: the CDP Bazaar snapshot of 2026-09-26, the official MCP registry API, or npm search, all run on 2026-09-27. The method is in §6. |
| **[npm]** | Monthly downloads from the npm search API on 2026-09-27. Downloads include CI and bots, so treat them as a ceiling on real use. |
| **[web]** | From a WebSearch result or a fetched web page. Not independently checked. |
| **[unverified]** | Could not be confirmed in this session. |

**Limits of this research:**

- **WebSearch worked; most live hosts did not.** The egress proxy returned policy 403s, which were not retried, for x402.org, api.cdp.coinbase.com, x402scan.com, mpp.dev, Smithery, Glama, mcp.so, olas.network, agentverse.ai, nevermined.app, arxiv.org, solana.com, prnewswire.com, bitquery.io, Reddit and Hacker News.
- **What worked instead:** GitHub (clones, raw files and issue pages), npm, and the official MCP registry API.
- **Two full CDP Bazaar snapshots** (4 Sep and 26 Sep) came from an open CC0 dataset, `savecharlie/x402-census`.
- **No one was contacted, and nothing was posted.**

---

## 1. Bottom line

- **Agents do pay, but the whole public market is small.**
  - On 26 Sep 2026 the CDP Bazaar index held 17,606 paid resources on 2,029 hosts.
  - Routes with 3 or more paying buyers declared about **$10,722 in 30 days**.
  - 74% of listings had one payer or none, and the median route gets about 1.5 calls per buyer [src: census; data].
  - At $0.01 a call, $100 a month means 10,000 calls a month. That is more than most sellers on the rail get.
- **Check, Gate and Receipt enter a crowded niche where nobody is paid yet.**
  - Our count: 907 Bazaar entries on 102 hosts sell x402 trust checks, preflights, receipts or spend control. The 31 of them with 3 or more paying buyers earned **about $15 combined in 30 days** [data].
  - The official MCP registry lists at least 15 pre-payment check servers and 8 receipt or settlement-verification servers [data].
  - A free preflight, `twzrd-x402-gate`, logs about 16k npm downloads a month [npm].
  - Every wallet README we read already ships budgets and receipts.
  - Lead with what they lack: a verdict on whether the purchase serves the user's task, "confirm with a person" as an outcome, the decision log, and Celo.
- **Celo alone is invisible to buying agents.**
  - 600 Bazaar entries accept Celo. 598 of them belong to one gateway (agent402.tools), and none is Celo-only [data].
  - x402scan's code indexes Base, Solana, Polygon, Optimism, Sei and Avalanche, but not Celo [src].
  - Before any listing push, set `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` to turn on the Base leg (`apps/web/lib/chain.ts`). The Bazaar is also what AWS AgentCore agents search [web].
- **The first agent-side dollars will most likely come through someone else's wallet, not through a listing.**
  - Small open-source tools that pay arbitrary x402 sellers can add Shonin Check as an opt-in step within days: Run402's CLI, opencrowd, tryx402, ArisPay and AgentCash.
  - Virtuals ACP is the one venue with subsidized demand: up to $1M a month for agents that sell there [web].
  - Our estimate for month one is cents to tens of dollars.
- **The first real cash will be human-side.**
  - Weeks 1–2: the warm-network sprint already planned (AI Visibility Audit, Agent-Ready Website, Company Brain).
  - After that: the Agent Reliability Audit (from $3,000) for teams whose agents move money. That means x402 sellers and wallets (a May 2026 paper reports attacks on live x402 endpoints that end in unpaid service or in paying without receiving it [web]), Nigerian AML teams under the CBN standard [src], and UK firms in the FCA's AI Live Testing cohort [web].
  - Celo ecosystem channels are off-limits for selling (`company/ops/conflicts-of-interest.md`, rules 1–2).

---

## 2. Where agents buy today

| Venue | What's sold | Evidence agents pay | Can Shonin list there? | Source |
|---|---|---|---|---|
| **Coinbase x402 Bazaar** (the CDP discovery index) | 17,606 resources on 2,029 hosts: data enrichment, LLM inference, search, crypto data | $10,722 declared in 30 days by 2,010 routes with 3+ payers. The top 5 hosts take 72%. stableenrich.dev's four people-data wrappers took about $875, at $0.15–0.28 a call [src: census] | Yes. A listing appears automatically after the first paid call settles through CDP on Base, so it needs the Base leg. Don't trigger it by paying from our own wallet (CLAUDE.md, "Never") | `savecharlie/x402-census`: `WHAT_SELLS.md`, `discovery_20260926.json.gz` |
| **x402 on Base, on-chain** (all facilitators) | The same, plus sellers not in the index | About 73,000 payments a day, scaled from a 0.35% sample. Recurring payees take 63.9% of payments but 1.0% of dollars. The busiest payee grosses about $1,078 a month. From month to month about 58% of heavy sellers persist, against about 6% of heavy buyers [src: census]. The buyer SDK `@x402/fetch` has 448k downloads a month [npm] | n/a (this is the rail) | census `README.md` |
| **x402scan** (Merit Systems) | Explorer and registry of x402 resources | 3.69M transactions and $1.11M in a 30-day window, date not shown [web]. Caution: the x402.org "last 30 days" counter showed the same numbers from March to September [web] | Yes, free. Three routes in: an OpenAPI file with `x-payment-info`, a `/.well-known/x402` file, or a URL that returns a valid 402. Celo is not in its chain list | `Merit-Systems/x402scan` `docs/DISCOVERY.md` [src] |
| **MPP services directory** (mpp.dev) and MPPScan | 142 curated services, including OpenAI, Anthropic, Exa, Firecrawl, Browserbase and seven Merit "stable*" APIs | No volumes published [unverified] | Yes, if Shonin answers MPP. `mppx` serves MPP and x402 `exact` on one route, and the Celo facilitator settles MPP. List by PR to `schemas/services.ts` (curated; duplicates are declined) or by registering on MPPScan. No Celo service is listed today | `tempoxyz/mpp` [src] |
| **Olas Mech Marketplace** | AI task results, sold per request. The main buyers are Olas Predict trader agents buying probability estimates | 11.99M requests, $109,611 gross paid and $812 in protocol fees, cumulative to 25 Sep 2026, across 7 chains [web] | Possible, but it means running a Mech (Open Autonomy, Python), and the demand is for forecasts, not payment checks. The README lists Celo among its chains | olas.network via search snippet (the page was blocked); `valory-xyz/mech` [src] |
| **Virtuals ACP** | Agent-to-agent jobs with escrow and an optional external evaluator | 1.77M completed jobs and "$479M aGDP" by Feb 2026; this is token-denominated, so treat it as a ceiling [web]. Since 12 Feb 2026 the Revenue Network has offered selling agents up to $1M a month; actual payouts are not published [web] | Yes: register at app.virtuals.io/acp/join and build with `acp-node-v2` (v1 is deprecated). Graduation needs 10 successful sandbox jobs. Base, USDC by default, and an 80/20 fee split [src, web] | `Virtual-Protocol/acp-node` [src]; bex.co and the ACP whitepaper [web] |
| **Fetch.ai Agentverse** | Agent services for ASI:One personal AIs | Agent-to-agent payments have been live since Dec 2025 in USDC, FET and Visa, with Stripe and Skyfire integrations. No volume published [web] | Yes, agent registration is open [unverified]. No x402 support found | fetch.ai blog, cryptobriefing [web] |
| **AWS Bedrock AgentCore Payments** | Managed x402 payments for Bedrock agents, built with Coinbase and Stripe | Previewed in spring 2026 (April–May) and now generally available. It ships the Bazaar MCP server (10,000+ endpoints) through AgentCore Gateway, with spending guardrails built in [web] | Indirectly: be in the Bazaar (Base leg) | AWS and Coinbase blogs [web] |
| **Agent wallet platforms**: CDP Agentic Wallets, Crossmint, Skyfire, Payman, Catena Labs, Nevermined | Wallets, cards, know-your-agent checks, facilitation | Limits and approvals are built in: CDP has session caps, limits and KYT (11 Feb 2026); Crossmint has limits, allowlists and human approval above thresholds. Skyfire left beta in Dec 2025, Catena raised $30M (May 2026), and Nevermined self-reports 1.38M transactions since May 2025. None publishes per-service volumes [web] | There is no store to list in; integration only. They build these controls in-house, so they are channels at best, not first customers | [web], URLs in §6 |
| **Catalogs inside wallets**: AgentCash, Locus, Agent402, ArisPay, tryx402 | Curated paid APIs inside the wallet the agent already uses | Locus's proxy (`*.paywithlocus.com`) hosts 53 Bazaar routes with 123 payer-slots in 30 days [data]. Agent402 routes to third-party sellers and pays them on the agent's behalf [src] | Through an integration or a partnership. Agent402's router only routes to sellers with proven on-chain settlement [src] | READMEs [src]; Bazaar [data] |
| **MCP registries**: official, Smithery, Glama, mcp.so | Tools; the paid ones mostly charge through x402 | The official registry lists 186 x402-related servers [data]. Glama has about 20k servers, mcp.so about 19k and Smithery about 6k. Fewer than 5% of MCP servers earn anything [web, secondary] | Yes, free. This repo now has `packages/mcp` (shonin-mcp) ready to publish | registry API [data]; dev.to, thinkneo [web] |
| **OpenClaw / ClawHub** | Skills and plugins for a large agent runtime (`openclaw` has about 13.5M npm downloads a month) | Payments run through plugins: Tempo's `openclaw-mpp`, and ClawRouter wallets paying per call over x402 [src, web]. There is no native x402 yet [web, unverified]. 341 malicious skills were found in Feb 2026 [web] | Yes: publish a skill. `twzrd-trust` already lists a payment-trust skill there [src] | `tempoxyz/mpp` `openclaw.mdx` [src]; npm |
| **Frameworks**: ElizaOS, LangChain, CrewAI, Mastra | Plugins | `@elizaos/plugin-x402` has about 1.2k downloads a month [npm]. We found no first-party LangChain, CrewAI or Mastra x402 package; they reach paid tools through MCP [npm] | Through an MCP server | npm |
| **Celo stack**: hosted facilitator, 8004scan, AskBots | Settlement, identity, and a review marketplace paying $0.10 USDT per accepted review | The facilitator has no catalog [src]. For Celo counts, see the Bazaar row [data] | Omni402 already has an ERC-8004 identity (agent #9765). Selling through Celo channels is off-limits under the conflict rules | `research/agent-payments.md` [src] |

**Who would pay for Check, Gate or Receipt:**

- **Wallets and routers that pay arbitrary sellers:** Run402, opencrowd, AgentCash, tryx402, ArisPay and Agent402.
  - The ones whose READMEs we read (Run402, opencrowd, tryx402, ArisPay) already have spending caps or ceilings and receipts [src].
  - None of the READMEs we read describes a pay, confirm or block verdict on whether a specific purchase serves the user's task. That is the Check pitch.
- **Marketplaces that need trust signals.**
  - ACP pays an evaluator role per job [web].
  - Bazaar ranking tools already rank sellers by paying buyers, for example x402-bazaar-rank and Rencom [data, src].
- **Operators with finance teams, for Receipt.** Receipts are becoming standard, though:
  - Haven feeds Fortnox, tryx402 signs Ed25519 receipts, and Run402 emits `x402-commerce-result.v1`.
  - The x402 spec has its own Signed Offers & Receipts extension [src].
  - Shonin Receipt's opening is checking Celo settlements and producing one normalized format across wallets. It should verify the spec's signed receipts rather than invent another format.
- **Competitors already in the niche** (price and pitch against them):
  - Free or $0.001 preflights such as `twzrd-x402-gate`.
  - Agent402's paid seller checks [src]: seller-trust ($0.005), seller-dossier ($0.05) and seller-payability ($0.10), which also checks the EIP-712 domain.
  - x402-secure (t54), zauth, ActionGate, Kevros, Augur, PEAC receipts and OMATrust [src: x402 ecosystem data].
  - AgentScore's reputation API ($0.001 per lookup, with 650+ wallets indexed by Feb 2026). AgentScore has also proposed a reputation layer for the protocol itself (x402 issue #1277) [web].

---

## 3. First-customer candidates

Confidence is our judgment of the odds that this party pays Shonin within 60 days: **H** high, **M** medium, **L** low. "Region: unknown" means no source said where they are.

| # | Name | Type | Region | Why now | Shonin product | Channel | Source | Conf. |
|---|---|---|---|---|---|---|---|---|
| 1 | Existing website clients and warm SMEs | human | Nigeria | Sprint plan: pitch 10 clients, close 3 [src] | AI Visibility Audit, then Agent-Ready Website | WhatsApp | `company/seven-day-sprint.md`, `company/gtm/outbound.md` §1 | H |
| 2 | Funded startups in the founder's network | human | Lagos, Nairobi, remote | Sprint plan: pitch 10, close 1 [src] | Agent Launch Sprint, Company Brain | X, WhatsApp | `company/strategy.md`, `outbound.md` §3 | M |
| 3 | Run402 (`kychee-com/run402`) | agent | Unknown | Its CLI lets an agent buy from any x402 seller up to a $0.10 default ceiling [src]. About 22.9k downloads a month [npm] | Check, as an opt-in flag | GitHub issue, then PR | README [src] | L–M |
| 4 | opencrowd (`sr33j/opencrowd`) | agent | Unknown | A CLI agent that finds and pays x402/MPP services from an AgentCash wallet on Base, under a local cap. Its purchase flow already runs a reputation check, an approval and a receipt [src]. About 1.7k downloads a month [npm] | Check (task fit, plus "confirm") | GitHub PR (MIT licence) | README [src] | L–M |
| 5 | Virtuals ACP buyer agents | agent | Global, Base | Up to $1M a month paid to selling agents; there is an external-evaluator role per job [web, src] | Gate, as a provider or evaluator; Check | ACP registry | `acp-node` README [src]; bex.co [web] | L–M |
| 6 | Nigerian banks, mobile money operators and international money transfer operators | human | Nigeria | The CBN's Baseline Standards for Automated AML (March 2026) require automated screening and monitoring within 18–24 months [src] | Agent Reliability Audit; AML Alert Triage pilot | Nigeria Blockchain Week (NBW) network, LinkedIn | `research/africa-ai.md` §3.3 | L–M |
| 7 | Merit Systems (AgentCash, x402scan, MPPscan, stableenrich) | agent | Unknown | AgentCash pays any x402 or MPP API from one wallet (about 8k downloads a month) [npm]. stableenrich is the top seller at $0.10 and up, and its buyers make 21–78 calls each [src: census] | Receipt, for buyers' books; a Check hook | x402scan registration, then email or GitHub | census `WHAT_SELLS.md`; `tempoxyz/mpp` [src] | L |
| 8 | tryx402 | agent | France [src] | An open-source "payment governance layer" over AgentCash, with caps, idempotency, a ledger and Ed25519 receipts. It also runs a hosted "verified-tools catalogue" and takes a commission [src] | Check, to vet catalogue entries and task fit | GitHub, email | README [src] | L |
| 9 | ArisPay (`payagent-mcp`) | agent | Unknown | An MCP wallet with spend mandates, receipts and "ArisPay Signal", which is signed evidence that a paid probe settled and delivered. Runs on Base and Solana [src] | Check (task fit, plus "confirm") | Email | README [src] | L |
| 10 | Agent402 (Havok Holdings LLC) | agent | Unknown | Its router pays third-party sellers for the agent. 598 of the 600 Celo-accepting Bazaar entries are its routes [data]. It already sells seller checks, so it is also a competitor [src] | Check, as a second opinion on Celo routes; Gate, as a seller its router can route to | GitHub, email | README [src]; Bazaar [data] | L |
| 11 | Haven (`d-hinders/Haven-AI`) | agent | Sweden (inferred from its Fortnox feed) | A non-custodial agent wallet: budgets are on-chain delegations on Gnosis and Base. About 13–15k downloads a month for each package [npm]. It removed its human approval queue (#2055) [src] | Gate, as an optional "confirm with a person" service | GitHub | README [src] | L |
| 12 | ampersend (Edge & Node) | agent | Unknown | A wallet for agents and a dashboard for humans, with limits and policies, built with Coinbase, Google and the Ethereum Foundation's decentralized-AI team. There is an AWS AgentCore case study [web] | Check, as a policy plugin; Receipt export | Email | coindesk, AWS blog [web] | L |
| 13 | Locus (YC F25) | agent | US [web] | Agent wallets with budgets, approval thresholds, allowlists and an audit trail [web]. Its proxy hosts 53 Bazaar routes [data]. It runs agentic-payments hackathons at YC [web] | Receipt; its hackathons as a channel | Email, X | YC launch page [web] | L |
| 14 | Laso Finance | agent | Unknown | Agents buy $5 prepaid cards in one call. Its get-card route had 39 payers and 51 calls, about $255, in 30 days, and a card can't be un-bought [src: census] | Check, offered to its buying agents | Email, X | census `WHAT_SELLS.md` | L |
| 15 | AWS Bedrock AgentCore agents | agent | US, EU, APAC regions | AgentCore Payments lets Bedrock agents find and pay Bazaar endpoints [web] | Gate or Check, through the Bazaar | Bazaar (needs the Base leg) | AWS blog [web] | L |
| 16 | thirdweb | agent | Unknown | Runs an x402 facilitator and client on 170+ chains, including Celo. Its Permit path uses a non-standard `primaryType: "Permit"` [src], which is where a domain check catches mismatches | Check | Email, X | `research/agent-payments.md` §3.3 | L |
| 17 | AsterPay | agent | EU | Converts USDC and EURC to EUR over SEPA Instant for agents and APIs, and says it is MiCA-compliant [src]. EU sellers need their books in EUR | Receipt, as one EUR line per settlement | Email | coinbase/x402 ecosystem data | L |
| 18 | AEON | agent | Southeast Asia, LatAm, Africa | Lets agents pay real-world merchants through x402 and stablecoins [src]. Spending at merchants can't be reversed | Check | Email | ecosystem data [src] | L |
| 19 | Open Agent Hackathon teams | agent | Online | Registration closes Oct 5 and the build runs Oct 15–20. Teams need paid tools while they build [src] | Check or Gate, free credits first, then $0.01 | Hackathon Discord (first confirm Shonin has no judging role) | `research/funding.md` | L |
| 20 | Celo agent teams outside the founder's programs (e.g., walcert.globalscoreagent.com) | agent | Unknown | One of 3 hosts accepting Celo in the Bazaar [data]. Celo USDC signs as "USDC"/"2" while Base USDC signs as "USD Coin"/"2", which is a common bug [src] | Check, Receipt | Direct only, not through Celo channels | Bazaar [data]; `agent-payments.md` | L (check conflicts first) |
| 21 | Olas Mech buyers (Predict traders) | agent | Gnosis, Base, Celo and others | $109.6k paid across 11.99M requests [web], but the demand is for forecasts | Decision recipes (Score) as a Mech tool | Mech Hub | [web]; `valory-xyz/mech` [src] | L |
| 22 | x402 sellers with repeat buyers: stableenrich, BlockRun, twit.sh, Otto AI | human | Global | "Five Attacks on x402" (arXiv 2605.11781) reports attacks on live endpoints that end in unpaid service or in a buyer paying without receiving it [web]. These hosts have the most paying buyers [data] | Agent Reliability Audit of the payment path | Email or X, with a free Check report | arXiv via search [web]; Bazaar [data] | L |
| 23 | x402 facilitators: PayAI, Corbits, Dexter, Kobaru, Ultravioleta DAO, OpenFacilitator | human | Global | The same paper. Facilitators verify and settle payments for other people's money [web, src] | Agent Reliability Audit | Email, GitHub | x402 `docs/dev-tools/facilitators.md` [src] | L |
| 24 | Coadjute | human | UK | In cohort 2 of the FCA's AI Live Testing, stress-testing an AI-native AML platform for property ahead of AML supervision moving from the SRA to the FCA. Testing ends in 2026, and the FCA's report is due in Q1 2027 [web] | Agent Reliability Audit | LinkedIn, email | FCA press release [web] | L |
| 25 | Aereve, Palindrome | human | UK (FCA programme) | The same cohort, whose use cases include agentic payments, AML and KYC. We found no per-firm detail, and Advai already supports the cohort [web] | Agent Reliability Audit | LinkedIn, email | FCA press release [web] | L |
| 26 | Greenlite AI; Parcha (now Grep AI) | human | US | They sell compliance agents to banks, whose buyers expect validation methods, logging and override handling. OCC Bulletin 2026-13 took agentic AI out of SR 11-7's scope, with a request for information still to come [web] | Agent Reliability Audit, as third-party evidence | LinkedIn, email | arthur.ai, parcha.ai [web] | L |
| 27 | Indian banks, NBFCs and payment operators, and their AI vendors | human | India | RBI FREE-AI (13 Aug 2025) calls for a board-approved AI policy, independent validation and periodic audits, and is to be folded into Master Directions [web]. No named firm yet | Agent Reliability Audit; Team AI Upskilling | LinkedIn | legal500, scrut [web] | L |
| 28 | EU businesses running customer-facing agents | human | EU | The Article 50 transparency duties apply from 2 Aug 2026. The Digital Omnibus (in force 27 Jul 2026) moved the Annex III high-risk duties to 2 Dec 2027 [web]. No named firm yet | Agent Readiness Audit | Content, LinkedIn | Morgan Lewis, Cloud Security Alliance [web] | L |
| 29 | MCP server authors selling through x402: nanotools, webbersites, archtools | human | Global | The official registry lists 186 x402 servers, but 74% of Bazaar listings got one payer or none in 30 days, so a listing alone does not bring buyers [data] | AI Visibility Audit (for agent discovery); Omni402 setup | GitHub, X | registry API, Bazaar [data] | L |
| 30 | codespar (`mcp-dev-brasil`) | human | Brazil (inferred from the repo name) | Publishes MCP servers for Brazilian developer APIs, including an x402 server [data] | Agent Launch Sprint (a paid MCP server) | GitHub, LinkedIn | registry API [data] | L |

---

## 4. Channels ranked by speed to first dollar

| Rank | Channel | First dollar in | First ticket | Effort | Why this rank |
|---|---|---|---|---|---|
| 1 | **Warm-network DMs for human services**: existing clients, founders, NBW contacts | Days | $150 to $1,750 deposits | Low | The scripts already exist (`company/gtm/outbound.md` §1–4). The week-one target is $3–4k [src] |
| 2 | **"Show them their own data"**: run a free Shonin Check report on a target's live 402 or wallet flow, then offer an integration or an Agent Reliability Audit | 1–2 weeks | $0.01 calls; $3,000+ audits | Medium | It is the firm's own lead magnet [src], and each report doubles as proof for content |
| 3 | **Integration PRs into open-source buyer tools**: Run402, opencrowd, tryx402, ArisPay, x402-proxy, three.ws | 1–3 weeks to the first paid call | Cents a day, compounding | Medium | A vendor pitched a $0.03 paid check through ClawRouter's wallet this way on 25 Sep [web: ClawRouter #396]. Merged code keeps paying |
| 4 | **Virtuals ACP**, as a provider and an evaluator | 2–3 weeks | Unknown; subsidized | Medium–high (`acp-node-v2` on Base) | The only venue with paid demand plus a subsidy [web] |
| 5 | **Machine discovery with a Base leg**: Bazaar, x402scan, the MCP registry, llms.txt, the agent card, ERC-8004 | Hours to set up; the first call is uncertain | Cents | Low | A prerequisite for rows 2–4 rather than a source of demand: 74% of Bazaar entries got one payer or none in 30 days [data] |
| 6 | **A ClawHub skill and a Claude Code skill** | Days | Cents | Low | A large runtime, but payment depends on each user's wallet setup [src] |
| 7 | **Hackathons outside Celo**, with credits or a small bounty | Tied to event dates (Open Agent Hackathon, Oct 15–20) | Small | Low | Brings feedback and first calls. Check for judging roles first [src] |
| 8 | **Content**: a sourced "x402 payment safety" post on X, dev.to and GitHub | 2–4 weeks | Indirect | Low | Supports rows 2 and 11 |
| 9 | **MPP directory PR** | Weeks | Cents | Medium (needs MPP) | Curated, and duplicates are declined [src] |
| 10 | **Olas Mech** | Weeks or more | Cents | High | The demand is for forecasts [web] |
| 11 | **Regulated enterprise outbound**: the FCA cohort, US compliance vendors, RBI, EU | Months | $3,000+ | High | Real deadlines, but long sales cycles [web] |

**The three strongest are rows 1, 2 and 3**, with row 5 as their prerequisite.

**Off-limits:**

- Selling through Celo channels, or to builders in programs the founder runs or judges (conflict rules 1–2; `outbound.md` §6).
- Self-paid mainnet calls to trigger a listing or build reputation (CLAUDE.md, "Never"). ACP sandbox test jobs are for graduation only and never count as customers.

---

## 5. A 14-day outreach plan

**Days 1–2: make Shonin findable and demo-able before sending anything.**

- Turn on the Base leg (`CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`). Confirm that `/api/v1/check`, `/gate` and `/receipt` answer 402 with both a Base and a Celo accept.
- Register the three routes on x402scan, through an OpenAPI file with `x-payment-info` or a `/.well-known/x402` file.
- Publish `packages/mcp` (shonin-mcp: `shonin_check`, `shonin_gate`, `shonin_receipt`) to the official MCP registry and to Smithery.
- Build the lead magnet: a script that runs Shonin Check against any public 402 and prints a one-page result. Run it on each agent-side target's own routes before writing to them.
- Make three sample Shonin Receipts from public Base and Celo settlements.

**Days 1–3:** cash from the warm network (targets 1–2). This continues the existing sprint.

**Days 3–6:** agent-side integrations (targets 3–8).

- Send one message to each, with their own check result attached.
- Open a PR only where the repo accepts outside contributions.

**Days 5–10:** register a Shonin Gate provider and evaluator on Virtuals ACP with `acp-node-v2`, and pass the 10 sandbox jobs using test buyers.

**Days 8–10:** regulated buyers (targets 9–10).

**Days 11–14:** follow up, publish and count.

- Follow up once per target, each time with one new fact.
- Publish a sourced post on what agents actually pay for, using the census numbers and our own check results.
- Count cash collected, paid calls from wallets Shonin doesn't control, PRs merged, and ACP graduation.
- Log every correction in `company/ops/rulebook-log.md`.

**Day-14 targets** (targets, not promises): one paid human engagement, one integration merged or agreed, the first paid call from a wallet we don't control, and ACP graduation.

| # | Target | Product | Channel | Day | Opener (one line; personalize it) |
|---|---|---|---|---|---|
| 1 | Existing website clients (Lagos) | AI Visibility Audit, then Agent-Ready Website | WhatsApp | 1 | "I asked ChatGPT '{buyer question}' and it gave {business}'s old price [screenshot]. Want the full 25-question check this week?" |
| 2 | Funded founders in the network | Agent Launch Sprint or Company Brain | X, WhatsApp | 2 | "Congrats on {specific}. I put one agent into production for one workflow in 10 days, with approvals and a decision log. 20 minutes this week?" |
| 3 | Run402 | Shonin Check | GitHub issue | 3 | "`run402` pays any x402 seller up to a $0.10 default ceiling. Shonin Check reads the 402 before signing (token contract, EIP-712 domain, amount, payTo, resource URL) and returns pay, confirm or block for $0.01. Would you take a PR that adds it behind an opt-in flag?" |
| 4 | opencrowd | Shonin Check | GitHub issue | 3 | "OpenCrowd already checks reputation and asks for approval before it pays. Shonin Check adds a verdict on whether the purchase serves the user's task, with 'confirm with a person' as the middle answer, for $0.01. Can I open a PR that adds it as an optional step?" |
| 5 | Merit Systems (AgentCash) | Shonin Receipt | Email, X | 4 | "Your stableenrich buyers make 21 to 78 calls each (CDP index, 26 Sep). Shonin Receipt turns each settlement into one signed line for the buyer's books. Want three samples built from public Base settlements?" |
| 6 | tryx402 | Shonin Check | GitHub, email | 4 | "tryx402 caps budgets, dedupes calls and signs receipts. Shonin Check covers the step before that: is this 402 what it claims, and does the purchase fit the task? Can I run it across your verified-tools catalogue and send you the results?" |
| 7 | ArisPay | Shonin Check | Email | 5 | "ArisPay Signal tells an agent whether a paid probe settled and delivered. Shonin Check answers the question before it: does this purchase fit the task and budget, or should a person confirm it? Worth 20 minutes on returning both in one `pay` result?" |
| 8 | Agent402 | Shonin Check on Celo; Gate as a routable seller | GitHub, email | 5 | "598 of the 600 Celo-accepting entries in the CDP index are yours (26 Sep). Shonin Check knows Celo's token domains: USDC signs as 'USDC'/'2', USD₮ as 'Tether USD'/'1'. Want it as a second opinion before `route/execute` pays a seller on Celo?" |
| 9 | Coadjute (FCA AI Live Testing) | Agent Reliability Audit | LinkedIn, email | 8 | "You're stress-testing an AI AML platform for property in the FCA's AI Live Testing until year-end. I measure one workflow's consistency, robustness and calibration and hand over reproducible traces. Is a 20-minute call useful before the FCA's Q1 2027 report?" |
| 10 | A Nigerian mobile money operator or money transfer operator's compliance lead (warm, via NBW) | Agent Reliability Audit; AML Alert Triage pilot | LinkedIn, WhatsApp | 9 | "The CBN's automated-AML standard gives you 18 to 24 months. Send 200 of last month's anonymized alerts and I'll show you, free, how often an AI triage agrees with your analysts. Can we start this week?" |

Before each send, check the target against `company/ops/conflicts-of-interest.md`, and add the disclosure line wherever a Celo, NBW or Ethereum Nigeria connection exists.

---

## 6. Sources

### Method for [data]

- **Bazaar.** We parsed `discovery_20260926.json.gz` (17,637 entries; the census deduplicates them to 17,606 resources). For each entry we used `quality.l30DaysTotalCalls`, `quality.l30DaysUniquePayers`, `accepts[].network` and the six-decimal stablecoin amounts.
  - **"Celo"** means an entry whose `accepts` include `eip155:42220`.
  - **The trust segment** is a keyword match on the description and URL: x402 verify, lint, preflight, diligence, trust, risk, safety or check; pre-payment check; payment receipt or verification; settlement proof; spend policy, guard or ledger; seller or counterparty trust, risk or score; guardrail, policy gate, admission control or circuit breaker.
  - **Revenue** is calls × price, counted only for routes with one fixed price and 3 or more payers.
- **MCP registry.** We paged `GET https://registry.modelcontextprotocol.io/v0/servers?search=x402` to the end (576 versions, 186 names). Pre-payment and receipt servers were counted by a keyword match on descriptions.
- **npm.** We queried `https://registry.npmjs.org/-/v1/search?text=x402&size=250`, two pages (500 of 5,537 results), and read `downloads.monthly`.

### Cloned repos (2026-09-27, HEAD shown)

- `savecharlie/x402-census` @ `6c9aaf7` (2026-09-26): `README.md`, `WHAT_SELLS.md`, `CORRECTIONS.md`, `discovery_20260904.json.gz`, `discovery_20260926.json.gz`. https://github.com/savecharlie/x402-census
- `x402-foundation/x402` @ `9db8584` (2026-09-27): `docs/dev-tools/{facilitators,third-party-extensions,third-party-sdks}.md`, `docs/extensions/offer-receipt.mdx`, `CONTRIBUTING.md`. https://github.com/x402-foundation/x402
- `coinbase/x402` @ `dd927a2` (2026-04-21): `typescript/site/app/ecosystem/partners-data/*/metadata.json`, 202 entries (75 services, 68 infrastructure, 32 facilitators, 23 client-side). https://github.com/coinbase/x402
- `Merit-Systems/x402scan` @ `131a5d3` (2026-09-16): `README.md`, `docs/DISCOVERY.md`, and a grep of its chain constants. https://github.com/Merit-Systems/x402scan
- `tempoxyz/mpp` @ `7b59156` (2026-09-26): `schemas/services.ts` (142 services), `src/pages/services.mdx`, `src/pages/partner-integrations/openclaw.mdx`, `src/pages/blog/mppx-agent-runtimes.mdx`, `.github/PULL_REQUEST_TEMPLATE/service.md`. https://github.com/tempoxyz/mpp
- `valory-xyz/mech` @ `5dcc409` (2026-09-21): `README.md`. https://github.com/valory-xyz/mech
- `Virtual-Protocol/acp-node` @ `49dafb4` (2026-06-01): `README.md` (deprecated in favour of `acp-node-v2`). https://github.com/Virtual-Protocol/acp-node
- `modelcontextprotocol/registry` @ `bf4e88c` (2026-09-22), used alongside the live registry API. https://github.com/modelcontextprotocol/registry

### READMEs fetched from raw.githubusercontent.com (2026-09-27)

- `MikeyPetrillo/Agent402`
- `d-hinders/Haven-AI`
- `sr33j/opencrowd`
- `twzrd-sol/twzrd-trust`
- `crypto-yannso/tryx402`
- `arispay-inc/payagent-mcp`
- `BlockRunAI/ClawRouter`
- `kychee-com/run402`

### GitHub issues (read with WebFetch)

- x402 #1277, AgentScore's proposal for an identity and reputation layer (2026-02-20). https://github.com/x402-foundation/x402/issues/1277
- x402scan #924, a service submission (2026-05-24). https://github.com/Merit-Systems/x402scan/issues/924
- ClawRouter #396, a paid pre-install check through the wallet (2026-09-25). https://github.com/BlockRunAI/ClawRouter/issues/396
- mech-client #262, a third-party Mech tool proposal (2026-09-25). https://github.com/valory-xyz/mech-client/issues/262

### Web sources [web] (WebSearch results; pages mostly not fetchable)

**Market caution**

- https://www.danielmcglynn.com/the-x402-counter-has-shown-the-same-four-numbers-since-march/
- https://note.com/x402inc/n/nfd6227f13b55

**Olas**

- https://olas.network/mech-marketplace
- https://olas.network/agent-economies/predict

**Virtuals ACP**

- https://bex.co/blog/2026/04/04/virtuals-protocol-ai-economic-operating-system-on-chain-agent-economy
- https://www.prnewswire.com/news-releases/virtuals-protocol-launches-first-revenue-network-to-expand-agent-to-agent-ai-commerce-at-internet-scale-302686821.html
- https://whitepaper.virtuals.io/acp-product-resources/acp-concepts-terminologies-and-architecture

**Fetch.ai**

- https://www.fetch.ai/blog/world-s-first-ai-to-ai-payment-for-real-world-transactions
- https://cryptobriefing.com/fetch-ai-agentic-infrastructure-agentverse/

**Nevermined**

- https://nevermined.ai/blog/nevermined-unlocks-autonomous-agent-card-payments-with-x402-opening-a-new-market-for-publishers-digital-merchants

**AWS AgentCore**

- https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-agentcore-payments-is-now-generally-available-enabling-agents-to-transact-safely-and-autonomously-at-scale/
- https://www.coinbase.com/blog/introducing-amazon-bedrock-agentcore-payments-powered-by-x402-and-coinbase

**Wallet platforms**

- https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets
- https://www.coinbase.com/developer-platform/discover/launches/policy-engine
- https://www.crossmint.com/solutions/agentic-payments
- https://stellagent.ai/insights/skyfire-kyapay-know-your-agent
- https://www.preqin.com/data/profile/asset/catena-labs--inc-/743320

**Locus**

- https://www.ycombinator.com/launches/Oj6-locus-payment-infrastructure-for-ai-agents
- https://events.ycombinator.com/agenticpaymentshackathon

**ampersend**

- https://www.coindesk.com/tech/2025/10/30/the-graph-builders-edge-and-node-unveil-ampersend-dashboard-to-manage-ai-agent-payments
- https://aws.amazon.com/blogs/machine-learning/building-pay-per-intelligence-for-ai-agents-how-ampersend-uses-amazon-bedrock-agentcore-payments/

**MCP monetization**

- https://dev.to/kirothebot/the-state-of-mcp-monetization-in-2026-where-builders-actually-get-paid-34k9
- https://thinkneo.ai/blog/mcp-registries-compared-20260714

**OpenClaw**

- https://clawhub.ai/coinvest518/openclaw-x402-skill

**x402 security**

- https://arxiv.org/abs/2605.11781 ("Five Attacks on x402 Agentic Payment Protocol", May 2026)
- https://arxiv.org/pdf/2605.30998 ("Free-Riding the Agentic Web")

**UK**

- https://www.fca.org.uk/news/press-releases/fca-announces-second-cohort-ai-live-testing
- https://www.fintechfutures.com/ai-in-fintech/fca-unveils-eight-new-participants-for-next-phase-of-ai-live-testing-initiative

**US**

- https://www.arthur.ai/column/ai-agent-compliance-tools-for-banks-a-guide
- https://www.parcha.ai/
- https://www.linkedin.com/company/greenlite-ai

**India**

- https://www.legal500.com/developments/thought-leadership/rbis-free-ai-framework-navigating-the-legal-and-regulatory-landscape/
- https://www.scrut.io/post/rbi-framework-for-responsible-and-ethical-enablement-of-artificial-intelligence

**EU**

- https://www.morganlewis.com/pubs/2026/06/eu-approves-delays-and-other-amendments-to-certain-eu-ai-act-obligations-what-businesses-should-know
- https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-deadline-omnibus-20260/

### In this repo

- `research/agent-payments.md`, `research/africa-ai.md`, `research/funding.md`
- `company/strategy.md`, `company/seven-day-sprint.md`, `company/gtm/outbound.md`, `company/ops/conflicts-of-interest.md`
- `packages/catalog/src/offers.ts` (Shonin Check, Gate and Receipt, the audits), `apps/web/lib/chain.ts` (the Base leg switch)
