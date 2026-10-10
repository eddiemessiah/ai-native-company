# The GTM Harness: one plan for everything

**Status:** written Sat 10 Oct 2026. Owner: Edidiong; Claude builds; Edidiong decides prices, offers, editions and anything sent. This file sits above the others and points to them: `harness-plan.md` (v2, connectors, pricing, stages), `beta-plan.md` (the hosted Desk, this weekend), `gtm-api.md` (per call), and two Drive docs, *Shonin GTM Harness – Publish scheduler spec v0.1* and *AI sync & scheduling – key points* (both 8 Oct). Numbers are sourced or marked "target".

## 1. The decision

**Shonin is a GTM harness.** Every go-to-market feature we've written up in the repo, Drive and Notion is now one product with modules, sold in four editions, from a founder on a laptop to a ministry on its own servers.

One line, unchanged: **"Your go-to-market, run by agents you can check. Any model. Nothing leaves without your yes."**

What's new in this plan:

1. **One map** of every feature, wherever it was written (§2).
2. **The company graph:** go-to-market grounded in the company's own data through Helix Foundry. The first piece is built (§4.5).
3. **Agent HQ** and **Publish** move out of side docs and into the harness as modules (§4.3, §4.4).
4. **Enterprise and government editions** (§6).
5. **The track to the YC application:** build, deploy on `staging.edidiongumana.tech`, research, draft, review, apply (§8).

## 2. Every feature we've already written down

| Feature | Where it's written | State on 10 Oct |
|---|---|---|
| The workspace: brain, workflows, 11 skills, campaigns, checks, pipeline, one-tap links, MCP (15 tools), evals, signed approvals | `harness-plan.md` §2; `packages/gtm-harness` | **Built** (MIT), 70 tests |
| Any model: Claude, any `provider/model` via AI Gateway or OpenRouter, any `/chat/completions` endpoint | `harness-plan.md` §3 | **Built**; the eval table isn't run yet |
| Telegram approvals, Slack review copies | `harness-plan.md` §2 | **Built** (local CLI) |
| The hosted Desk: sign-in, onboarding, one queue, server-signed approvals and receipts, Telegram bot, X posting, the agent bridge (remote MCP, no send or approve tool) | `beta-plan.md`; `packages/gtm-cloud`; `apps/web/app/beta` | **Built and merged**; deploy to staging pending |
| Run-once execution, caps, kill switch (`BETA_RUNS=off`) | `beta-plan.md` §10 | **Built** |
| The GTM API: plan $1.00, review $0.01, prospect score $0.01, approval $0.05, claims free (all proposed) | `gtm-api.md` §3 | **Spec**; decisions 10–18 open |
| Publish: a Buffer-style queue, Postiz as an unmodified AGPL sidecar, approval bound to `content_hash`, slots, calendar, X spend ledger | Drive: *Publish scheduler spec v0.1* (8 Oct); `harness-plan.md` §7 | **Spec** |
| GTM scheduler: scheduled research, follow-ups that wait 3 working days, scheduled posts | `harness-plan.md` §7 (Vercel Workflow); `gtm-api.md` row 8 (`schedule-post`); `beta-review.md` (deferred: undo window, daily digest) | **Spec**; follow-up dates are already counted by code (`pnpm gtm due`) |
| Agent HQ: Chief of Staff HQ (Capture Inbox, Review Queue, Contacts, Reminders), the AI Work Log, Agent Lookout on the laptop, Slack `#ai-sessions`, the 08:30 and 17:00 briefs | Notion: *Chief of Staff HQ*, *CoS Operating Manual*, *AI Work Log*; Drive: *AI sync & scheduling – key points* | **Running by hand** for Edidiong; not in the harness |
| Done-for-you GTM Sprint ($750 for the first five, proposed) | `harness-plan.md` §8 | **Offer proposed** |
| Hackathon activations on WhatsApp and Telegram, run on the harness | `hackathon-activations.md` | **Running** 12 Oct – 9 Nov |
| Headless browser for logged-out research only | `harness-plan.md` §5 | **Policy**; Playwright MCP locally |
| Company graph (Helix Foundry) | `research/helix-foundry.md`; `src/connectors/graph.ts` | **First piece built today** |

## 3. The product, as modules

```
                         People approve: Desk (web) · Telegram · Slack · (Teams, enterprise)
                                              │  every approval bound to the text's hash, signed by the server
 ┌──────────────────────────────── The GTM Harness ─────────────────────────────────┐
 │ Workspace (MIT)   brain · rules · skills · campaigns · pipeline · checks · evals  │
 │ Desk              one queue: drafts, posts, HQ items, what ran                   │
 │ Agent HQ          capture → triage → review queue · briefs · agent sessions      │
 │ Publish           queue slots · calendar · run once on approval · spend ledger    │
 │ Scheduler         research runs · follow-ups after N working days · digests      │
 │ Company graph     evidence from the company's own data (Helix Foundry), totals only│
 │ Connectors        channels · work tools · data · enterprise systems              │
 │ Ledger            approvals, verdicts, receipts: append-only, signed             │
 └───────────────────────────────────────────────────────────────────────────────────┘
       ▲ any agent over MCP (no send, no approve tool)        ▲ any model (evals decide which)
       │ the GTM API over x402 or a balance                    │ @repo/brain reviews and scores
```

The split holds in every module: **LLM writes** drafts, plans and SQL; **System One decides** routing, scores and verdicts; **code executes** counts, dates, slots, caps, hashes and sends to the founder's own channels; **a person approves** every message and post, and anything with money.

## 4. The modules that change

### 4.1 Workspace: unchanged

It stays MIT and free, and it stays the funnel (`harness-plan.md` §1). The repo split (decision 4) still comes before Show HN.

### 4.2 Desk: becomes the one queue

The beta's Desk is the inbox for every module: drafts, scheduled posts, HQ items and company-graph evidence waiting to be accepted. One rule for all of them: nothing runs that a person didn't approve in that exact form.

### 4.3 Agent HQ

**What it is:** the Chief of Staff HQ pattern Edidiong already runs in Notion, inside the harness, for anyone.

| Piece | From | In the harness |
|---|---|---|
| Capture | Notion *Capture Inbox*; email with subject `cos:` | Telegram chat to the bot ("met Ama, Kudi CTO, wants a grants intro"), the Desk, or email. The brain routes each capture (Choice: lead, task, reminder, content idea, other) |
| Review Queue | Notion *Review Queue* (Approved, Changes requested, Rejected) | The Desk. Same three states; "changes requested" goes back to the agent with the note |
| Contacts | Notion *Contacts* | `pipeline.csv` and the hosted leads table; `do_not_contact` enforced in code |
| Reminders and briefs | 08:11 morning brief; proposed 08:30 and 17:00 AI-work briefs | The daily digest the beta deferred (`beta-review.md`): what waits on you (oldest first), what ran, what failed, what's due today |
| Agent sessions | Agent Lookout (laptop), Slack `#ai-sessions`, the AI Work Log | Agents that connect over MCP report session start and end (the tools exist: `session_start`, `session_end`). The Desk shows which agents are working, waiting or stalled. Prompts stay on the founder's machine |
| Notion | The HQ itself | A Notion connector: read the Capture Inbox, write approved items back. Optional; the Desk works without it |

**What it won't do:** send email for the founder (the CoS manual already says "the EA does not send email on your behalf"); approved emails become Gmail drafts or `mailto` links.

### 4.4 Publish and the scheduler

The Drive spec stands, with three changes so it fits what's built:

1. **Two publishers behind one interface.** The beta already posts to X, Telegram channels and groups, and Slack directly. Postiz, as the unmodified AGPL sidecar the spec describes, adds LinkedIn (personal), Instagram and YouTube. Both sit behind the spec's `PublisherAdapter`.
2. **The queue lives where the beta's data lives.** The spec says Postgres and pg-boss; the beta runs on Upstash Redis. Proposal: Vercel Workflow for waits and sleeps (`harness-plan.md` §7), Redis for slots and run markers, and Postgres only when an enterprise install needs it (decision G4).
3. **Approval in chat.** The spec's open question 4 (approve from Telegram) is already answered by the beta: Telegram cards carry the hash, and the server re-checks it before running.

Kept from the spec: a job exists only after approval; any edit to an approved variant voids it; Shonin publishes with `type: "now"` after re-checking the hash, so nothing sits in Postiz where it could be edited; the X cost shows on the card ($0.015 a post, $0.20 with a link); the spend ledger; no `approve`, `publish` or `delete` tool for agents.

The scheduler does three jobs, all code: research runs on a schedule, follow-up drafts after the working days `pipeline.ts` counts, and the daily digest. A scheduled run only ever produces drafts.

### 4.5 Company graph (new)

**The idea:** most GTM tools guess who the customer is. Helix Foundry (Apache-2.0) connects a company's Postgres, Stripe, PostHog, REST APIs and files into one ontology on its own machine, and answers with executed SQL (`research/helix-foundry.md`). We use it so every number in a draft comes from the company's own data, with the query that produced it.

**Built today** (`packages/gtm-harness/src/connectors/graph.ts`, 11 tests, no network):

- `pnpm gtm ground <workspace> --queries <file>` sends each `{claim, inputs, sql}` to the founder's Foundry with a read-only token.
- Code refuses anything but one SELECT, and any answer that isn't one row with one number.
- Each value goes to `brain/products/evidence.md` with its SQL and date. The claims check already reads that folder, so drafts may quote those numbers and no others.
- Rows never enter the workspace. Only totals reach a model, the Desk or a Telegram card.
- `pnpm gtm doctor` shows it as "Company graph", connected or not.

**Next:**

1. **ICP from data.** An evidence pack per segment (who pays, who churned, median deal size); the brain scores prospects against it with Score questions.
2. **Ask.** Foundry's Analyst (`/assistant/runs`, `intent: "answer"`), once its answer shape is documented, with the executed SQL on the card.
3. **Hosted.** Foundry can't be on a network ("never expose it"), so the hosted Desk receives the evidence file, never a connection. That's the selling point for enterprise and government: their data never leaves.

### 4.6 Connectors

The rule from `beta-plan.md` §2 decides every one: **the founder's own channels run on approval; a person gets a one-tap link; money is prepare-only.**

| Group | Now | Next | Enterprise and government |
|---|---|---|---|
| Approvals | Desk, Telegram, Slack copies | Slack buttons | Microsoft Teams; email approval links; SSO-bound approvers |
| Own channels (run on approval) | X, Telegram channel or group, Slack | LinkedIn (personal), Instagram, YouTube via Postiz | Corporate pages after each platform's review; an organisation's own newsletter tool |
| People (one-tap links) | WhatsApp, email, X, Telegram share | Gmail drafts (decision 8) | Outlook drafts through Microsoft Graph |
| Data | `pipeline.csv`; company graph (Foundry) | Google Sheets (`drive.file`); Notion | Salesforce, HubSpot, Dynamics, read-only first; the data warehouse through Foundry |
| Work tools | MCP into the founder's own agent | Notion (HQ), Google Calendar | Jira, ServiceNow for approvals that need a ticket |
| Long tail | The founder's own MCP servers | Composio or Pipedream | The client's own integration platform |
| Payments | x402 for the GTM API | The balance rail (`gtm-api.md` decision 16) | Invoices and purchase orders |

Build vs buy holds (`harness-plan.md` §4): build the gate, the ledger and the core channels; buy the long tail.

## 5. Who it's for, in the order we sell

1. **Founders who sell through conversations**, WhatsApp and Telegram first (`harness-plan.md` §10).
2. **Teams and agencies:** one approval inbox, a workspace per client.
3. **Agent builders:** the GTM API and the MCP bridge.
4. **Enterprises:** marketing and comms teams in regulated sectors (banks, fintechs, telcos, insurers) that need every outbound word approved and logged. `company/strategy.md` already names fintechs and banks whose regulators want evidence of control.
5. **Governments and public bodies:** public communications that must be approved, multilingual and kept on record. `research/africa-ai.md` documents the pull: Kenya's 22,000 digital services on manual back ends and its plan to link systems through APIs before deploying agents; Nigeria's GovGuide covering federal services while states and agencies remain uncovered; NITDA's sovereign cloud guidelines (August 2026).

## 6. Editions

Prices are Edidiong's to set; the hosted ones are already proposed in `harness-plan.md` §8 (decision 1).

| Edition | Who | What's different | Where it runs |
|---|---|---|---|
| **Workspace** | Anyone | The full loop, local, MIT | The founder's machine, their model key |
| **Hosted** (Solo, Team, Agency) | Founders, teams, agencies | The Desk, Telegram, own-channel posting, Agent HQ, Publish | Shonin's cloud (`beta-plan.md`) |
| **Enterprise** | Regulated marketing and comms teams | SSO (SAML or OIDC) and SCIM; roles with maker-checker (the drafter can't approve, two approvers for set channels); approval policies per channel; audit export to their SIEM; the company graph inside their network; their own model endpoint; a DPA | Their cloud account or ours in their region; self-hosted on request |
| **Government** | Ministries, agencies, state governments, and the integrators who serve them | Everything in Enterprise, plus: a sovereign or on-premises install; a public-communications desk (announcements, service updates, FAQs in local languages, each approved and kept on record); records retention set by the agency; no prospect outreach at all | Sovereign cloud or the agency's own servers |

**What stays the same in every edition:** no send to a person without their tap, approvals bound to the hash, agents with no approve tool, money prepare-only, opt-outs in code.

**What enterprise and government need that we don't have yet**, in build order: Postgres storage; organisations, roles and maker-checker; SSO; audit export; a self-hosted package (Docker Compose, then Helm); Teams approvals; then the paperwork (a security questionnaire, a DPA, and SOC 2 Type I only once a buyer asks for it in writing).

**How we sell to them:** a paid pilot priced per unit, one comms team or one agency, with a finish line: "30 days, every outbound post approved and logged, zero sent without approval." Government goes through integrators first (the SIs named in `research/africa-ai.md`, A10), never through Celo programmes (`ops/conflicts-of-interest.md`).

## 7. Rolling it out to the target market, on the harness itself

We run Shonin's go-to-market on the harness, and the run is the proof (`harness-plan.md` stage 1).

| When | What | Done when |
|---|---|---|
| **Sun 11 – Mon 12 Oct** | Deploy the beta to `staging.edidiongumana.tech` (`beta-plan.md` §3); Shonin's own workspace on it | Edidiong approves from his phone; one post per own channel |
| **Mon 12 Oct** | Ground Shonin's workspace: Foundry on the laptop with the intake log, Stripe and the catalog; `pnpm gtm ground` | `evidence.md` has our first real numbers |
| **Mon 12 – Fri 16 Oct** | Evals on four models; five design partners recruited outside the programmes Edidiong supports | Eval table in the repo; five confirmed |
| **Mon 19 – Fri 23 Oct** | Design-partner week; Agent HQ capture and digest; Publish with LinkedIn through Postiz | 50+ approved messages; corrections logged; 3 of 5 say what they'd pay |
| **Mon 26 Oct – Fri 6 Nov** | Enterprise groundwork: Postgres, organisations, roles, maker-checker. Two enterprise and one government conversation from the warm network | Two discovery calls held; one pilot proposal sent by Edidiong |
| **Domain day (end of Oct)** | Public launch with the firm (`shonin-gtm-plan.md` §3) | Launch gates in `harness-plan.md` §9 |

Targets for Mon 30 Nov stay as in `harness-plan.md` §11, plus one enterprise or government pilot proposal accepted (target).

## 8. Build, deploy, research, apply: the YC track

YC's Winter 2027 deadline is widely reported as **Mon 2 Nov 2026, 8pm PT**; YC's own page hasn't confirmed it in our search, so check ycombinator.com before relying on it. `company/funding/plan.md` already lists it as a long shot.

| When | Step | Who | Done when |
|---|---|---|---|
| **Sun 11 – Mon 12 Oct** | Build and deploy: the beta on `staging.edidiongumana.tech` | Claude builds; Edidiong deploys | A full approved run on staging |
| **Mon 12 – Mon 19 Oct** | Market research: `research/gtm-market.md`. Market size from sources, not guesses; the competitors in `research/gtm-harnesses.md` updated; the enterprise and government buyer; why now (agents that act need approvals); our own numbers from stage 1 | Claude researches; every claim cited | Every number has a source or says "our data" |
| **Tue 20 – Fri 23 Oct** | The application, drafted: `company/funding/yc-w27.md`. The one line; the demo video from staging; traction from the approval ledger; the founder story | Claude drafts; Edidiong writes the parts only he can | A complete draft |
| **Sat 24 – Tue 27 Oct** | Review: the gstack CEO and engineering modes on the application, the way `beta-review.md` ran; then one person who has been through YC reads it | Edidiong picks the reader | Findings folded in, listed at the foot of the draft |
| **By Fri 30 Oct** | Submit | **Edidiong only**: a submission in the firm's name is his to make | Submitted before the deadline |

Nothing in the application may claim more than the ledger shows on the day it's sent.

## 9. What we measure

The north star stays **approved messages and posts sent per week, across all workspaces** (`harness-plan.md` §11). Added:

| Measure | Source |
|---|---|
| Workspaces with a company graph, and drafts quoting evidence | `evidence.md` files; the claims check |
| HQ captures triaged per day, and the median time to a decision | The Desk's log |
| Posts published on approval; failures; X spend against the limit | The publish receipts; the spend ledger |
| Enterprise and government: conversations, pilot proposals, pilots signed | Edidiong's pipeline |
| Incidents: a send without an approval; a row of client data outside their network | The audit log. **Target: zero** |

## 10. Risks

| Risk | What we do |
|---|---|
| Scope: four editions before one paying founder | Enterprise and government are groundwork and conversations until a design partner pays; the hosted beta comes first |
| Helix Foundry is weeks old (17 commits, no release) | Pin a commit; our client has its own read-only and one-number checks; nothing depends on its undocumented shapes without failing loudly |
| Client data leaks through a model | Only aggregates leave Foundry; rows are refused in code; the hosted Desk never holds a connection to client data |
| Postiz's AGPL | Unmodified sidecar, HTTP only, no copied code; counsel before we sell Publish to customers (Drive spec §2) |
| A government deal pulls the firm into a long sale | Through integrators, on a paid pilot with a finish line; no free custom work |
| The YC application overclaims | Every number from the ledger or `research/`; the review step checks each one |

## 11. Decisions for Edidiong

| # | Decision | Recommendation | By |
|---|---|---|---|
| G1 | Shonin's main product is the GTM Harness, with the agent products (Check, Gate, Receipt) as its trust layer | Yes: one story for users, investors and YC | Mon 12 Oct |
| G2 | Agent HQ in the harness, with Notion as an optional connector | Yes; capture and digest in design-partner week | Fri 16 Oct |
| G3 | Helix Foundry: connect (done), contribute upstream, or fork for sign-in | Connect now; contribute a sign-in proposal upstream before forking | Fri 30 Oct |
| G4 | Storage for Publish and enterprise | Redis plus Vercel Workflow for hosted; Postgres for enterprise installs | Fri 23 Oct |
| G5 | The enterprise and government editions | Yes as editions on the page and in conversations; build only the groundwork in §6 until a pilot is signed | Fri 23 Oct |
| G6 | Who reviews the YC application, beyond the gstack modes | Someone who has been through YC, outside the programmes you support | Fri 23 Oct |
| G7 | Apply to YC W27 | Yes, if staging runs and stage 1 numbers exist by 23 Oct; otherwise apply late with real numbers rather than on time with targets | Fri 23 Oct |
