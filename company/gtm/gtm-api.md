# The GTM API: selling go-to-market per call, the Monid way

**Status:** a proposal, written 7 Oct 2026. Prices and new offers are Edidiong's to decide, so every price here is proposed, and nothing reaches `packages/catalog` until he decides it. Sources: `research/agent-tool-gateways.md` (Monid, the comparables, approval as a service) and our own code. Read it with `harness-plan.md`, whose decisions it continues (10–18).

## 1. The idea

Monid sells other people's data to agents, one call at a time:

- one key and a prepaid balance;
- free discovery, paid runs;
- a vendor error costs nothing;
- a 10% fee on the supplier's price.

**Shonin sells the judgment and the proof.** Agents and founders call us before they send: to plan, to score, to review, and to get a person's approval with a signed receipt. Suppliers sell data and pipes. The founder sends.

The opening is real. Approval services exist (HumanLayer, gotoHuman, Pushary), but none ties an approval to a hash of the exact text, none decides first whether a person is needed at all, and none hands back a signed receipt a third party can check. Shonin already has all three:

- **Gate** returns execute, confirm or escalate.
- **The harness** binds every approval to the text's hash, and signs it.
- **`signReceipt`** in `packages/agents` signs receipts.

## 2. What we have today

| Piece | State |
|---|---|
| Paid routes over x402 | Check, Gate, Receipt, Triage, Lead Score and Content Gate at $0.01; Grant Fit at $0.05. Failures answer 400 or above, so they never settle |
| Rails | USDC and USDT on Celo. Base only once `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` are set |
| Discovery | `llms.txt`, the agent card and the catalog JSON, all built from `offers.ts`. Nothing reaches the x402 Bazaar or x402scan without Base |
| MCP | `shonin-mcp` for the agent products; the GTM workspace server (`pnpm gtm mcp`). Neither is published |
| GTM Harness | Plans with any model. A reviewer. Claim, slot and phrase checks in code. Signed, hash-bound approvals and verdicts. Telegram cards. `do_not_contact` enforced. Send links. A trace |
| People paying | Stripe Checkout, for fixed offers only. No API keys, no balances |
| The market | Routes with 3 or more paying buyers declared about $10,722 in 30 days; 74% of listings had one payer or none (`research/first-customers.md`) |

## 3. What to sell per call

| # | Endpoint | Unit | Proposed price | Cost behind it | Build or resell | Rail |
|---|---|---|---|---|---|---|
| 1 | `POST /api/v1/gtm/plan` | One plan: scorecard, sources, three reviewed drafts, the workspace files | **$1.00** | About $0.22 at most: `claude-opus-5` at $5 and $25 per million tokens (`packages/brain/src/cost.ts`), about 4k tokens in and the 8k output cap | Build. On a model failure it answers 503, never templates | x402; balance |
| 2 | `POST /api/v1/gtm/review` | One outreach draft: ready, revise or blocked, with fixes | **$0.01; blocked free** | About $0.0001 on Jev; $0.01–0.04 if Claude answers (estimate) | Build: the harness's reviewer behind a paid route | x402; balance |
| 3 | `POST /api/v1/gtm/claims` | One draft against its source: invented numbers, unfilled slots, banned phrases | **Free**, rate-limited | About $0: it's code (`claims.ts`, `check.ts`) | Build | None |
| 4 | `POST /api/v1/gtm/prospect-score` | One prospect against the founder's scorecard | **$0.01** | About $0.0002 on Jev. The model judges each criterion and code adds the weights (`pipeline.ts`) | Build | x402; balance |
| 5 | `POST /api/v1/approvals` | One decided approval: a card bound to the text's hash, a signed receipt, and the send link if approved | **$0.05**, charged when the decision is collected; an expired request costs nothing | About $0: Telegram and Slack messages are free | Build, from the harness's ledger | x402; balance |
| 6 | Research and enrichment | One supplier call | **Not sold** | Monid on x402: $0.01 (Exa) to $0.10 (company data) | Through the founder's own Monid key | The founder's balance |
| 7 | WhatsApp template sends | — | **Not offered** | — | — | — |
| 8 | `POST /api/v1/gtm/schedule-post` | One approved post on the founder's own channel | **Provider cost + $0.02** | X charges $0.015 a post, $0.20 with a link | Build the scheduler; buy the APIs | Balance |

**Why these prices:**

- **The plan:** $1 keeps at least a 75% margin on the costliest run. The eval cost column (`pnpm gtm eval`) replaces the estimate once it has run.
- **The approval:** $0.05 matches Arcade's charge for one user consent. The scarce resource is the founder's attention, and the daily card cap protects it.
- **The review:** $0.01 loses money whenever Claude answers instead of Jev. Each decision's logged cost says how often that happens; alert above 10%.
- **Check, Gate and Receipt** stay at $0.01.
- **WhatsApp sends** would break the never-send rule and put the founder's number at risk.

## 4. The Approval API

This is the product no one else has. The mechanics:

1. **Link once.** A founder links their Telegram once through a start link (`t.me/<bot>?start=<token>`). Nobody can push cards to a stranger.
2. **Ask.** An agent calls `POST /api/v1/approvals` with the exact text, the channel, the recipient if any, and the Gate decision that asked for confirmation.
3. **Decide.** The founder gets the card with Approve and Reject and decides.
4. **Collect.** The agent polls `GET /api/v1/approvals/{id}`, free, until a decision arrives. Collecting a decision is the paid call: $0.05, approved or rejected.
5. **Prove.** The receipt carries `{approvalId, actionHash, decision, approverRef, channel, decidedAt, expiresAt, gateDecisionId}`, signed with `RECEIPT_SIGNING_KEY`. Anyone holding the text can check that this exact text was approved, by whom and when.

**Limits:**

- The receipt is our attestation, not the approver's signature. For money, require a passkey tap.
- Approvals at volume turn into rubber stamps, so the daily card cap carries over from the harness.

## 5. Rails

**x402 (exists).** Four changes:

- **Base:** set the CDP keys. The Bazaar, x402scan and Monid's own x402 host all work on Base first.
- **Signed receipts:** add the Offer & Receipt extension from the installed `@x402/extensions` 2.27.0, so every paid call returns a signed receipt.
- **Per-payer caps:** read the payer from `PAYMENT-SIGNATURE`.
- **Free polls:** Sign-In-With-X, so polling an approval needs no payment.

**A key and a balance (new), for people and teams who don't hold a wallet.** Monid's model:

- hashed API keys;
- a Postgres ledger that holds an estimate, settles the actual cost, and releases the hold on any status of 400 or above or a blocked verdict;
- Stripe top-ups in catalog amounts;
- spending caps enforced in code;
- a signed receipt for every debit.

Build it with the hosted alpha (harness plan, stage 3).

## 6. Policies

- **Failures are free** on both rails. That's already true on x402: nothing settles at 400 or above.
- **Blocked drafts are free.**
  - On x402, the review answers 422 with the full verdict, so nothing settles, with a per-payer daily cap on free blocks.
  - On the balance, a blocked draft isn't debited.
  - A blocked draft costing nothing is the honest incentive: we earn when the draft is good enough to send.
- **Approvals cost nothing until decided.**
- **Every paid call and every approval gets a receipt.**
- **No data resale.** Research runs on the founder's own supplier keys. We never resell raw data without a licence (`research/agent-payments.md`).
- **Shonin Check vets every supplier's 402** before an agent of ours pays it.

## 7. Monid: a channel and a supplier, not a rival

- **As a channel:**
  - list Shonin's endpoints in Monid's catalog, through a connector pull request (which needs our key rail);
  - or front them on `x402.monid.ai` at our price plus their 10% (which needs Base).

  Either way, write each description "like it is the product", because Monid's discovery ranks on it.
- **As a supplier:**
  - the founder brings their own Monid key, and the harness calls it through an allowlist in code;
  - the allowlist excludes the LinkedIn actor that takes cookies and the "anti-bot bypass" scrapers, which break our rulebook.
- **The risk:** Monid owns the buyer and adds 10% to our price. Keep our own discovery (§8) first.

## 8. Discovery

1. **Automatic.** `llms.txt`, the agent card and the catalog list every API in `offers.ts`.
2. **A `/SKILL.md` for agents, as Monid ships.** It says: call Gate before acting, Check before paying, review before any send, and collect the approval receipt.
3. **MCP.** Publish `shonin-mcp` and the GTM workspace server to the MCP registry. Add a remote MCP with OAuth for chat clients that can't hold a wallet.
4. **The x402 Bazaar.** Turn on Base. The listing follows the first real paid call. Never pay ourselves to trigger it (`conflicts-of-interest.md`, rule 8).
5. **x402scan:** add a `/.well-known/x402` file.
6. **Monid's catalog** (§7).

## 9. Packaging

| Tier | Who | What | Proposed price |
|---|---|---|---|
| Free | Everyone; the only tier offered in Celo channels | The MIT workspace, the CLI, the web run, claim checks | $0 |
| Per call | Agents and builders | §3 | $0.01–$1.00 a unit |
| Hosted Solo | Founders | One workspace, 300 approved messages a month | $29 (`harness-plan.md` §8) |
| GTM Sprint | Founders who want the result | Done for you | $750 for the first five |

**The bundle and the meter agree.** 300 approvals ($15), 600 reviews ($6) and two plans ($2) come to $23 at per-call prices; Solo adds the hosting for $29. Founders buy convenience; agents buy units.

**Conflicts.**

- Celo channels get the free tier only, with no prices or paid links (`conflicts-of-interest.md`, rules 1–2).
- Builders in programs Edidiong supports get no paid follow-up.
- No calls from our own wallets to seed any listing.

## 10. Risks

1. **Margin.** A review answered by Claude costs more than $0.01. Watch the share.
2. **Free blocked verdicts invite abuse,** and a 422 for a finished review bends HTTP's meaning. The per-payer daily cap limits both.
3. **Invisible on Celo.** The Bazaar, x402scan and Monid's x402 host all work on Base first. Base needs the CDP keys.
4. **Personal data.** Email finding is personal-data processing under Nigeria's NDPA and the GDPR. Suppliers carry scrapers our rulebook bans: allowlist only.
5. **Prepaid balances may count as stored value** [unverified]. Check before launching the balance rail.
6. **Monid as a competitor:** it owns the buyer and takes 10%.
7. **Demand.** Expect cents in the first month. The bundle and the sprints carry the cash.

## 11. Decisions for Edidiong

These continue `harness-plan.md` §13.

| # | Decision | Recommendation | By |
|---|---|---|---|
| 10 | Per-call prices | Plan $1.00; review $0.01, blocked drafts free; prospect score $0.01; approval $0.05; claim checks free | Fri 16 Oct |
| 11 | Free blocked drafts on x402 | A 422 with the verdict, plus a per-payer daily cap | Fri 16 Oct |
| 12 | The Base leg | Set the CDP keys | Now |
| 13 | The Approval API | Telegram first, then Slack, then email; charged when the decision is collected | Fri 16 Oct |
| 14 | Monid as a channel | Ask Monid how it fronts outside sellers | Fri 23 Oct |
| 15 | Monid as a supplier | The founder's own key plus our allowlist; no resale | Fri 23 Oct |
| 16 | The balance rail | Build it with the hosted alpha | Fri 23 Oct |
| 17 | WhatsApp template sends | Stay off | Confirm |
| 18 | The paid plan route | Answer 503 when the model fails, never templates | Fri 16 Oct |

## 12. Build order, once the decisions land

1. **The Base leg** (12): Edidiong sets the CDP keys.
2. **The review route,** with the 422 for blocked drafts (10, 11), and the prospect-score route (10). New routes go through the apis line, each with its catalog entry.
3. **The Approval API** (13): the harness's ledger behind a route, with Telegram linking and signed receipts.
4. **The plan route** (18): the eval cost column sets its final price.
5. **`/SKILL.md`, `/.well-known/x402`** and the registry listings.
6. **The key-and-balance rail and the remote MCP,** with the hosted alpha (16).
7. **The Monid conversation** (14, 15).
