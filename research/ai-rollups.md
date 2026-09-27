# AI roll-ups: buying services firms and rebuilding delivery with agents

Compiled 2026-09-27 for Edidiong Umana ("DeFi Messiah"). Source: Greg Isenberg's guide "$5T opportunity: AI Roll Ups" (late September 2026, gregisenberg.com). Purpose: decide how Nova plays the AI roll-up wave, and what to sell to the people doing it.

**Evidence tags**

| Tag | Meaning |
|---|---|
| **[G]** | From Greg's guide, as the founder pasted it. Not checked against Greg's own sources. |
| **[SR]** | A company's result, quoted in the guide. **Self-reported.** Greg's own caution: these are young companies raising money, and none has been tested by a recession. |
| **[N]** | Nova's reading, decision or arithmetic: our data, not Greg's. |
| **[A]** | A planning anchor. Validate it in the first five sales calls before relying on it. |

**Method and limits.** One source: the key content of the guide, pasted by the founder into the session on 2026-09-27. I did not fetch gregisenberg.com, the McKinsey figures, or any company's own announcement. Every company number below is that company's claim, repeated by Greg. Read each one as a claim, not a benchmark.

---

## 0. Bottom line

- **About $5 trillion of US businesses will change hands by 2035**, most of them owned by retiring baby boomers, many with no successor. McKinsey expects more than 1M boomer-owned businesses to sell by 2035. [G, citing McKinsey]
- **An AI roll-up buys a services firm at a services price and rebuilds delivery with agents.** Clients and revenue stay; the cost per unit of work drops. Greg's thesis: from the ~5–10% EBITDA margins of a traditional services firm to 30–40%. [G]
- **The evidence is early and self-reported.** Larson Gross, a ~200-person accounting firm, says AI processed 7,000 returns this tax season and saved its accountants 31% of their time on average. Long Lake, Crescendo, Dwelly and Titan MSP report doubled, tripled (a target) or 4x margins. [SR]
- **Individuals can win.** Funds need big deals and ignore the ~$2M-revenue firms that make up most of the market. The tools are the same (Claude Code, Codex), and a solo owner-operator *is* the integration. [G]
- **The operating model is the one Nova already runs.** Greg's three files (`target-criteria.md`, `rules/`, `corrections-log.md`), the preparer kept apart from the reviewer, and a weekly dashboard map onto our catalog rulebooks, the rulebook log, Nova Gate and our decision logs. The automation map he calls "the most valuable document in the deal" is our Agent Readiness Audit, pointed at a target. [N]
- **Nova's play: picks and shovels now, acquire later.** Sell acquirers an **Acquisition Automation Map** ($2,500 per target) and a **100-Day Agent Integration** (from $12,000 per firm + $1,500/month). Buy one small services firm ourselves only after services cash flows and a rulebook is proven in that line of work (H3 in `company/strategy.md`). [N]

---

## 1. The thesis

### 1.1 What an AI roll-up is [G]

A roll-up buys many small firms in one industry and combines them. An **AI roll-up** buys a services business at a services price and rebuilds delivery so agents do a large share of the work. The customers and the revenue stay. The cost per unit of work drops.

### 1.2 Why now [G]

1. **Models are good enough.** The output "needs checking, not redoing."
2. **Owners are retiring.** About $5T of US businesses change hands by 2035; more than 1M boomer-owned businesses are expected to sell (McKinsey). Many owners have no successor.
3. **Services firms are priced as if their margins are stuck.** They sell at low multiples because markets assume the margin can't move.

### 1.3 Buy vs build [G]

The client list, the trust, the licenses and the unwritten knowledge of what "correct" means all come with the firm. The firm's past work is training material for the agents. A startup selling the same service from zero has to earn every one of those. [N]

### 1.4 The margin math

- **Greg's example [G].** Buy a firm for about $800k. Move the margin from 10% to 30% and hold it, and the business is worth about 3x at the same multiple. Finance it with an SBA loan and a seller note.
- **The arithmetic [N].** Value = multiple × revenue × margin. Hold revenue and the multiple, triple the margin, and the value triples: about $2.4M on an $800k purchase.
- **The catch [N].** "And hold it." The gain only exists if revenue holds too. A margin bought by losing clients is not a gain (see the dashboard, §3.6).

### 1.5 One firm, worked through: Larson Gross [SR]

| | |
|---|---|
| Firm | Accounting firm in Bellingham, WA. Founded 1949. 5 offices, ~200 staff. |
| Owner | Thrive Holdings bought a stake. |
| Results this tax season | AI processed 7,000 returns. Accountants saved 31% of their time on average. One job went from 180 hours a year to 15. |
| Stack | The tax agents run on OpenAI's Codex. |

---

## 2. Who's doing it

Every result in this table is **self-reported** by the company, via Greg's guide. None has been through a recession. Titan MSP's margin figure is a target, not a result.

| Company | Industry | What it reports | Self-reported |
|---|---|---|---|
| **Long Lake** | Property management | 18 businesses acquired; $100M EBITDA in under two years; margins doubled | Yes |
| **Crescendo** | Contact centers | 90% of frontline tickets resolved by AI; 4x the margins of traditional operators | Yes |
| **Titan MSP** | IT managed services | 30%+ of workflows automated; *targeting* tripled net margins | Yes |
| **Dwelly** | UK real estate | Problem resolution down from 50 days to 20; margins doubled | Yes |
| **Thrive Holdings** | Accounting | ~50 local accounting practices bought in two years; $1B more committed; a stake in Larson Gross | Yes |
| **Larson Gross** (Thrive stake) | Accounting | 7,000 returns processed by AI this tax season; 31% of accountants' time saved on average; one job from 180 hours a year to 15 | Yes |
| **General Catalyst** | Investor | $1.5B set aside; $750M+ into at least ten companies; deals of ~60–70% cash at close with ~30% rolled into founder equity | Yes |

Greg made the same bet earlier: see `research/greg-isenberg.md` §2 (2026-07-27 on private equity buying AI-native EBITDA; 2026-08-26, play #1, "the Thrive Holdings model") and §4, idea #31, which adapted it to Nigeria.

---

## 3. The operating model [G]

### 3.1 The holdco folder

Every acquired firm plugs into the same folder shape. Three files do most of the work:

| File | The question it answers |
|---|---|
| `target-criteria.md` | What do we buy? |
| `rules/` | Can the agents be trusted? |
| `corrections-log.md` | How do the rules get better every week? |

### 3.2 Agents before the deal

1. **Sourcing.** State licensing boards, Secretary of State filings, association directories and BizBuySell. Go to owners directly before going through brokers.
2. **Scorecard.** Score every target. Under 60% is a job; over 80% deserves a letter of intent (LOI).
3. **Work-sample diligence.** Collect 20–50 anonymized completed jobs. Turn them into an **automation map**: for each task, its trigger, inputs, steps, output, time, monthly volume, how checkable it is, and its risk. Classify every task:
   - automate now;
   - automate with human review;
   - assist only;
   - keep human.

   "The automation map is the most valuable document in the deal."

### 3.3 Agents after the deal

A **preparer** and a **reviewer**, kept apart: "the reviewer can block but never ship, and the preparer can ship nothing on its own." So a person ships. [N]

### 3.4 The rulebook

- **Interview senior staff** on four things: the common mistakes, the special clients, their final checks, and when they would stop and ask. Turn the answers into numbered rules. **Nothing is active until they approve it.**
- **Every week:**
  1. compare the agents' drafts with the approved versions;
  2. classify each change as a factual error, a client preference, missing information, or style;
  3. propose a rule for any correction that repeats;
  4. add each approved rule as a test case.

### 3.5 The first 100 days

| Days | Goal | Moves |
|---|---|---|
| 1–30 | Change nothing clients see | Meet everyone. Announce the deal together with the former owner. Run agents in shadow mode. Start the rulebook interviews. |
| 31–60 | Move the back office | Intake and document collection first. Put the preparer on the highest-volume, lowest-risk task, and review every draft. Track minutes of human attention per job. Staff who prepared the work become its reviewers. |
| 61–100 | Expand carefully | The next two tasks. A client-comms agent for routine status updates only. A monthly corrections review with senior staff. Measure client and key-person retention alongside margin. |

### 3.6 The Monday dashboard

Five numbers, every Monday, for every firm. The warning that goes with it: if margin rises while client retention falls, "you're selling the asset to pay for the renovation."

The pasted summary doesn't list Greg's five. The five we'd use, all taken from measures the guide names [N]:

1. margin;
2. client retention;
3. key-person retention;
4. minutes of human attention per job;
5. corrections per job, from the corrections log.

---

## 4. Financing

- **The small-deal stack in the US [G].** An SBA loan plus a seller note finances a firm of Greg's ~$800k example size.
- **The fund stack [SR].** General Catalyst pays ~60–70% cash at close and rolls ~30% into founder equity, so the seller stays for the handoff.
- **Why individuals can compete [G]:**
  - funds need big deals, so they ignore the ~$2M-revenue firms that make up most of the market;
  - the tools are the same ones anyone can use: Claude Code, Codex;
  - a solo owner-operator is the integration;
  - many owners prefer to sell to a person;
  - SBA loans and seller notes finance this size in the US.
- **Outside the US [N].** SBA loans are a US program for US buyers. In Nigeria, Ghana and Kenya, plan on a seller note plus a founder rollover to carry the deal, with revenue-based financing where a lender offers it. Check local acquisition finance, its cost and the foreign-exchange rules before any LOI.

---

## 5. What to buy [G]

Greg's list: accounting and bookkeeping, property management, insurance agencies, IT managed services, medical billing, payroll, HOA management, title and escrow, freight brokerage, and staffing.

What they share [N]: recurring clients, document-heavy back offices, and a checkable right answer. That is the "outsourced and checkable: build here" box in `research/greg-isenberg.md` §3A, with the clients already attached.

---

## 6. What breaks

| What breaks [G] | The guard |
|---|---|
| Buying faster than you integrate | One firm at a time. The next only when the first one's Monday numbers have held for a full quarter. [N] |
| Key people leave | Rollover equity keeps the seller in the deal [SR]; senior staff write and approve the rulebook [G]; key-person retention is on the dashboard [N] |
| Clients leave with the owner | Announce with the former owner; change nothing clients see for 30 days [G] |
| Automating trust away | The client-comms agent sends routine status updates only [G] |
| Agents with too much authority | The preparer and the reviewer are kept apart, and a person ships [G] |
| Believing headline numbers | Underwrite from the target's own work samples and books, never from peers' published margins [N] |

---

## 7. What it means for Nova [N]

### 7.1 We already run this operating model

| Greg's piece | Nova today | Where |
|---|---|---|
| `rules/`: can the agents be trusted? | A rulebook on every offer; a playbook per delivered service | `packages/catalog/src/offers.ts`, `company/ops/playbooks/` |
| `corrections-log.md` | The rulebook log, with a weekly review that promotes repeats to rules | `company/ops/rulebook-log.md` |
| Preparer kept apart from reviewer | Nova Gate: execute, confirm or escalate by risk tier; money and irreversible actions are prepare-only. Nova Check and the Spend Firewall: "A model can block a payment. It can never raise a limit." The content gate blocks drafts; it never publishes. | `packages/brain` policy gate, `/api/v1/gate`, `/api/v1/check`, `/api/v1/content-gate` |
| The automation map | The Agent Readiness Audit: each step classed as LLM, System One decision, code or a person, and costed on the client's own volumes | `company/ops/playbooks/agent-readiness-audit.md` |
| Minutes of human attention; trust per task | Decision logs with model version, probabilities and confidence | `packages/brain` decision log |
| Staff who prepare become reviewers | The study group trains the review layer and the bench | AI Study Group, Nova Bench |
| `target-criteria.md` and the scorecard | Not built. It would be a brain recipe: each criterion a `Score`, the total and the 60%/80% bands computed in code | `packages/brain/src/recipes/` (the brain line) |

Greg's four classes map onto our split:

| Greg's class | In Nova's terms |
|---|---|
| Automate now | Code, or a System One decision that clears its confidence gate |
| Automate with human review | An LLM draft or a decision in the confirm band; a person approves before it ships |
| Assist only | The LLM drafts or researches; a person does the work |
| Keep human | A person owns it: money, legal exposure or reputation |

### 7.2 Now (H1–H2): sell picks and shovels to acquirers

**Who buys:** searchers and search funds, ETA (entrepreneurship through acquisition) buyers, small holdcos, and PE-backed roll-ups, anywhere. Most are in the US today, because that's where the guide's $5T and the SBA financing are. The work is remote: samples in, map out.

| Offer | Unit | Price | Instead of [A] |
|---|---|---|---|
| **Acquisition Automation Map** | One target firm, mapped from 20–50 anonymized work samples, with the margin model | $2,500 per target ($1,250 deposit) | Operational diligence from a consulting firm: $10,000–$30,000 |
| **100-Day Agent Integration** | One acquired firm: shadow mode, back office, expansion; rulebook interviews, corrections log, the Monday dashboard | From $12,000 per firm + $1,500/month agent ops ($6,000 deposit) | An operating partner or integration team: $150,000+ a year |

Why this comes first:

1. **No capital at risk.** We are paid to learn how each industry works.
2. **Every map writes a rulebook.** Each one teaches us what "correct" means in one line of work before we would ever own a firm in it.
3. **It fits the split.** Task extraction is LLM work, classification is a System One decision, the margin model is code, and a person signs the map.
4. **It feeds the flywheel.** Once scorecards carry a history of decisions, target scoring can become a recipe API, like triage and grant fit.

Rule for both offers: **we never bid for a firm we mapped for a client, and nothing learned in a client's diligence feeds our own deals.**

### 7.3 Later (H3): buy one firm ourselves

Candidates that fit our rulebooks:

| Target type | Why it fits |
|---|---|
| Bookkeeping and accounting | `research/greg-isenberg.md` §4, ideas #6 and #7; the Thrive model |
| Payroll | Mostly code: dates, sums, limits |
| Insurance agencies | Document-heavy renewals and claims; claim pre-review is idea #8 there |
| IT managed services | The Support Triage Desk rulebook applies to its ticket queues |
| Digital agencies | Our Agent-Ready Website and Weekly Creative Pack rulebooks apply |

Where: Nigeria, Ghana or Kenya, which we know; or anywhere, through a partner searcher who runs the firm while we run the agents.

The deal: a seller note plus the seller's rollover. SBA loans are for US buyers; outside the US, seller notes and revenue-based financing carry the deal.

The conditions that must hold first are in `company/strategy.md`: services cash flow, a proven rulebook in the target's line of work, a bench that can review without the founder, a scorecard over 80%, a seller who stays, and Edidiong's approval of the deal, the financing and every signature.

### 7.4 Risks specific to us

- **Advising buyers and buying ourselves.** Handled by the rule above, written into every engagement letter.
- **Selling a margin story we haven't lived.** Until H3, every case study is a client's numbers, published only with their consent and labelled as theirs.
- **Licensed work.** Tax filing, insurance and title work need a licensed person on the review layer in each market. Agents prepare; the licensed person signs.

---

## 8. Sources

- Greg Isenberg, "$5T opportunity: AI Roll Ups", guide, late September 2026, gregisenberg.com. Key content pasted by the founder on 2026-09-27; the page itself was not fetched.
- Figures quoted inside the guide, not read at source: McKinsey (US business transfers and boomer-owned business sales by 2035); Larson Gross; Thrive Holdings; Long Lake; Crescendo; Titan MSP; Dwelly; General Catalyst.
- Related notes in this folder: `research/greg-isenberg.md` §2 (2026-07-27, 2026-08-26), §3A (the checklist's box) and §4 (ideas #6, #7, #8 and #31).

---

## 9. Unverified notes

1. **No primary source was read.** The McKinsey figures, every company result and General Catalyst's fund figures come through Greg's guide, as pasted.
2. **Every company result is self-reported,** by young companies raising money. Titan MSP's tripled margin is a target.
3. **Greg's margin baselines differ.** His 2026-08-26 post (`research/greg-isenberg.md` §2) describes "boring 20%-margin firms"; this guide says traditional services firms run ~5–10% EBITDA. Use neither: measure each target's own margin in diligence.
4. **The dashboard's five numbers** are not listed in the pasted summary. Ours (§3.6) are a proposal.
5. **Financing outside the US** (seller-note norms, revenue-based lenders, foreign-exchange rules in Nigeria, Ghana and Kenya) is not verified.
6. **The human-alternative prices** for both offers are planning anchors from the founder's brief, not from the guide. Validate them in the first five buyer calls.
7. **The guide's exact publication date** was not captured; "late September 2026" comes from the founder.
8. **Dwelly's segment** is given only as "UK real estate."
