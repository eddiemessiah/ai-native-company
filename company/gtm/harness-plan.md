# GTM Harness v2: build, prove, launch

**Status:** written 7 Oct 2026. Owner: Edidiong; Claude builds, and Edidiong approves prices, offers and anything sent.

- **What's built:** the first build of v2 is on `claude/eager-wozniak-eoex2g`, tested but not yet merged.
- **Launch:** the public launch goes out with the domain at the end of October (`shonin-gtm-plan.md` §3).
- **Sources:** `research/gtm-harnesses.md` and our own runs. A number marked "target" is a goal, not a result.

## 1. The decision

Shonin builds the harness founders run their go-to-market in. It has three layers:

| Layer | What it is | Who pays |
|---|---|---|
| **The workspace** (free, MIT) | A folder any agent can run with any model: a marketing brain, workflows, a skill per role, campaigns, approvals and one-tap send links | Nobody. It's the top of the funnel, and it's built |
| **The hosted runtime** (paid) | The same workspace on shonin.ai, with real connectors, scheduled research, an approval inbox on the phone, an audit log, and model access on the founder's key or ours | Founders and agencies, per workspace per month |
| **Done for you** (the firm) | A go-to-market sprint run by Shonin's agents and reviewed by a person, priced per campaign | Founders who want the result, not the tool |

Three rules hold in every layer:

- **Any model.** The founder uses the model they already pay for, and the evals say which models we support.
- **Approval first.** Agents research, plan and prepare. The founder approves each message, and their tap sends it.
- **Official routes only.** Tools connect through their official APIs and links. No bot ever logs into someone's WhatsApp, Telegram or LinkedIn.

## 2. What exists today

| Piece | Where | What it does |
|---|---|---|
| Web run | `/gtm`, `app/api/gtm/run` | Product in, plan and three reviewed drafts out, plus the workspace as a zip |
| Model router | `src/models.ts` | Claude direct; any `provider/model` through Vercel AI Gateway or OpenRouter; any `/chat/completions` endpoint (xAI, a local model). Records tokens, and cost when the router reports it |
| Workspace | `src/harness.ts` | 59 files: `AGENTS.md`, the brain (brand, product, audience, positioning, channels, design, assets, templates, history, lessons), rules, workflows, 11 skills, a first campaign, drafts, pipeline, corrections log, sprint, dashboard |
| Any agent | `src/harness.ts`, `pnpm gtm sync` | Skills in `.agents/skills/` (Codex, Cursor, Copilot, Gemini CLI) with a copy in `.claude/skills/` (Claude Code); `.gemini/settings.json` points Gemini CLI at `AGENTS.md` |
| Reviewer | `src/review.ts` on `@repo/brain` | Ready, revise or blocked for every draft. It can block but never send |
| Approval gate | `src/outbox.ts` | Approvals bound to a hash of the exact text, in an append-only log. Edit an approved draft and it needs approving again |
| Opt-outs | `src/outbox.ts`, `src/cli.ts` | Anyone marked `do_not_contact` in `pipeline.csv` gets no approval card and no link, even for a draft approved earlier |
| Telegram approvals | `src/connectors/telegram.ts` | Each draft reaches the founder's phone with Approve and Reject; `GTM_APPROVER_IDS` limits who can approve |
| Slack copies | `src/connectors/slack.ts` | Review copies to a channel |
| One-tap sends | `sendLink` in `src/outbox.ts` | WhatsApp click-to-chat, email, an X post, a Telegram share. The founder's tap is the send |
| CLI | `pnpm gtm` | `doctor`, `new`, `status`, `review`, `wait`, `links`, `sync`, `eval` |
| Evals | `src/evals.ts` | Per model: valid plans, honest drafts, seconds, tokens, cost |
| Tests | `packages/gtm-harness/test` | 32 tests; none touch the network |

## 3. "Works like Grokbot": any model, honestly

**What was announced** (search results only; x.com was blocked from our research tools, `research/gtm-harnesses.md` §6):

- Grok Bot is xAI's always-on agent, with its own cloud computer per bot. Its beta opened on 11–12 Aug 2026.
- On 6 Oct 2026, Musk posted that SpaceX "will use the best back end model for any given task, including Claude Opus 5.5, MidJourney, Suno and other leading APIs."

**Two corrections to how it's being retold:**

- **GPT isn't named.** The post names Claude Opus 5.5 and no OpenAI model.
- **xAI picks the model, not the user.** xAI's docs say neither members nor admins get a model picker, and it isn't on the roadmap.

**So we offer both:**

- **Auto:** we pick the model per task, from the models that passed our evals. That's the Grok Bot pattern.
- **My model:** the founder picks, and pays their provider directly. That's what Grok Bot doesn't offer, and what founders who already pay for a model want.

**What we built:** one router with three kinds of route:

- Claude direct;
- any `provider/model` through Vercel AI Gateway or OpenRouter;
- any `/chat/completions` endpoint, including xAI and a model running on a laptop.

Every route asks for the same strict JSON schema, and code validates the answer, so a weaker model fails loudly instead of quietly. The workspace runs in Claude Code, Codex, Cursor, Copilot and Gemini CLI: `AGENTS.md`, skills in `.agents/skills/` with a copy for Claude Code, and `pnpm gtm sync` to keep the copy current.

What's left:

- **Evals before claims.** A model counts as supported only after 20 runs of the same founder input are all schema-valid with zero invented numbers. The table lives in the repo, records seconds, tokens and cost, and reruns with each model release. The research adds seven checks:
  1. the real plan schema on Gemini and on OpenAI's strict mode;
  2. tool calls with `toolChoice: 'auto'`, since forced tool calls aren't portable, and zero sends without an approval;
  3. `do_not_contact` and the claims rules followed, including when a fetched page carries injected instructions;
  4. refusal and truncation rates;
  5. the model that answered is the one requested, with fallbacks off during evals;
  6. median cost and 95th-percentile latency;
  7. a rerun on every model version change.
- **"My model", hosted.** The safest route for a founder's own key is the OpenAI-compatible route to their own OpenRouter, xAI or local endpoint: they pay their provider, and nothing can fall back to our account. AI Gateway also takes keys per request (`providerOptions.gateway.byok`), but if that key fails the gateway may fall back to our credentials. So that route always runs under a per-founder quota.
- **"Auto", hosted.** Through AI Gateway:
  - pinned model ids;
  - fallbacks only to models that passed the evals;
  - each request tagged with the founder (`providerOptions.gateway.user`);
  - spend reported per user and capped by budgets.

  That covers metering and limits without a billing system of our own.
- **Per-task models.** The planner, the drafter and the researcher can each run a different model; the reviewer stays on the brain. The brain's +0.1 threshold penalty for uncalibrated providers stays: the AI SDK's docs say Jev and OpenAI return native probabilities, while Anthropic and Google return prompted estimates.
- **The MCP server for hosted workspaces** targets the 2026-07-28 MCP spec and SDK v2 (`@modelcontextprotocol/server`), not the 1.30 SDK `packages/mcp` pins today.

## 4. Connectors

What the platforms allow is in `research/gtm-harnesses.md` §4. What we connect, and when:

| Channel | Now (stages 1–3) | Public launch and after | The rule that shapes it |
|---|---|---|---|
| **Approvals** | Telegram cards with Approve and Reject (built) | Plus Slack buttons, and an approval inbox on the web | Each approval records the text's hash, the approver and the time |
| **WhatsApp** | `wa.me` links the founder taps (built) | Plus the Cloud API from the founder's own verified number, for people who opted in; through a provider (360dialog about $49 a number a month, or Twilio at $0.005 a message) or direct | The Business API sends only to people who opted in, and only templates outside 24 hours. Meta bars general-purpose AI assistants. So no chatbot, and no cold messages through the API |
| **Telegram** | Share links (built) | Plus Business-connection replies in chats active in the last 24 hours, each approved | A bot can't message anyone first |
| **Email** | `mailto` links (built); Gmail drafts in our own Google project for Edidiong and the design partners, under Google's personal-use and testing exemptions (100 users at most) | Decision 8: a CASA assessment for drafts, or links only | `gmail.compose` is a restricted scope: a yearly assessment ($675–$3,600 at one lab's prices) for public use |
| **Pipeline** | `pipeline.csv` (built); a Google Sheet with `drive.file` | Same | `drive.file` isn't sensitive; `spreadsheets` would be |
| **Slack** | Review copies by webhook (built) | Approval buttons in a Slack app | Posting and buttons are fine; reading history is limited outside the Marketplace, and Slack's terms bar feeding it to models |
| **Social posts** | Intent links for X and Telegram (built) | Scheduled posts after per-post approval (decision 2): X's API ($0.015 a post, $0.20 with a link), Share on LinkedIn, Meta's Graph API after review; Buffer once its OAuth for third-party apps ships | LinkedIn messages are partner-only, and its terms ban automation. Posts yes, DMs no |
| **The long tail** (CRMs, Notion, calendars) | The founder's own MCP servers inside their agent | Composio or Pipedream; Nango if we keep tokens ourselves | Buy it. The gate is what we build |

**Build vs buy:**

- **Build:** the approval gate, the outbox, the audit log and the four core channels: Telegram, WhatsApp, email and Slack.
- **Buy:** WhatsApp hosting, headless browsers and the long tail.

## 5. The headless browser

The question was whether the harness should run WhatsApp Web or Telegram Web in a headless browser. **No.** Three reasons:

- **The terms forbid it.** WhatsApp's forbid "bulk messaging, auto-messaging, auto-dialing" and class unofficial clients as adversarial. The best-known libraries say in their own READMEs that WhatsApp doesn't allow them. Telegram puts unofficial-client logins "under observation" and bans spam "forever".
- **The risk lands on the founder.** A ban takes the founder's main number, often the business line. That's true even for the founder's own account at low volume.
- **It's the opposite of our promise.** "Nothing leaves without your yes" and a bot logged into your WhatsApp can't both be true.

**What a headless browser does do in the harness: research.**

- It reads public, logged-out pages: a prospect's site, public directories, competitors' public pages.
- It goes at a person's pace, with no stealth tools and no CAPTCHA solving.
- The courts drew the line at logins: logged-out collection of public pages held up (Meta and X against Bright Data); logged-in collection didn't (BrandTotal, hiQ).
- **Where it runs:** Playwright MCP on the founder's machine now, then Browserbase ($20 a month for 100 hours) or Steel ($0.10 an hour) in the hosted runtime.

**What founders get instead of a bot in their WhatsApp:**

- The draft, approved in Telegram.
- A link that opens WhatsApp with the message filled in.
- One tap to send.

That's one tap more than a bot that sends by itself, and their number stays theirs.

## 6. Who else does this, and where we win

The landscape is in `research/gtm-harnesses.md` §2–3.

**The three names:**

- **Buffer** schedules social posts on 11 networks, at $6–$12 per channel a month. It has no agent, and no email, WhatsApp or Telegram. It's a channel we can publish through.
- **AntSeed** sells AI inference peer to peer.
- **Monid** sells paid tools to agents. Its $7.7M seed is real.

Neither AntSeed nor Monid is a GTM tool. Monid sells to the same buyers as Shonin Check, Gate and Receipt, so it may be a place to list them.

**The real competitors:**

- **Gooseworks** is closest: MIT skills, credits at $29–$299 a month, and an agent you message on WhatsApp or Telegram that "can work autonomously for hours".
- Lindy, Relevance AI, Clay, 11x, Artisan, n8n, Zapier, OpenClaw and respond.io each do part of it.

| They | We |
|---|---|
| Offer approval as a setting (Lindy, Zapier, Artisan's Copilot mode) or not at all (11x) | Make approval the product: every message bound to its exact text, an edit voids the approval, opt-outs enforced in code, an audit log |
| Run one model, or don't say which | Run any model, and publish an eval table that says which ones pass |
| Start from email and LinkedIn (Clay, 11x, Artisan) | Start from WhatsApp and Telegram, legitimately: tap-to-send now, the Cloud API for opted-in contacts later |
| Reach WhatsApp through WhatsApp Web (OpenClaw, through the unofficial Baileys library) | Use official routes only |
| Keep the workspace closed, or open the skills but not the loop | Open the whole workspace (MIT): brain, skills, campaigns, approvals |
| Sell seats or credits, with billing complaints (Lindy, Clay) | Sell units: a workspace a month with approvals included. Blocked and rejected drafts never count |

**Where they're stronger:**

- **Breadth.** Zapier has 9,000+ apps; n8n 400–1,500+. We buy the long tail rather than race them.
- **Data.** Clay and Apollo own enrichment. We research public pages and the founder's own lists.
- **Money.** Clay raised at $7.1B, and respond.io raised $62.5M in June. We stay small and specific.

**Unproven:**

- whether founders will approve every message at volume;
- whether "never sends" beats "works for hours";
- whether founders in Lagos or Nairobi will pay. We found no 2026 funding round for an African WhatsApp sales agent.

Stages 1–3 measure the first two before we commit to the full hosted build.

## 7. Architecture: the hosted runtime on Vercel Pro

```
 Founder's phone: Telegram · Slack · the web inbox ── approve / reject (bound to the text's hash)
                         │
 shonin.ai on Vercel Pro ▼
 ├─ /gtm                 the free run (exists)
 ├─ /app                 workspaces, the approval inbox, connectors, runs, the audit log
 ├─ Vercel Workflow      research → plan → drafts → review → wait for approval (a hook) →
 │                       send link, scheduled post or sheet row → wait 3 days (sleep) → follow-up draft
 ├─ AI Gateway           "Auto": pinned models that passed evals, tagged per founder, capped by budget
 ├─ "My model"           the founder's own OpenRouter, xAI or provider endpoint; nothing falls back to us
 ├─ Postgres             workspaces, runs, approvals (append-only), connector grants, the audit log
 ├─ Connectors           Telegram, WhatsApp, email, Slack (built by us); the long tail (bought)
 ├─ Browser              Browserbase or Steel, logged-out research only
 └─ MCP server           any agent reads the workspace and asks for approval; there is no send tool
                         ▲
 Local: `pnpm gtm` runs the same workspace and the same approval log, with no account
```

- **Workflows that wait.** Vercel Workflow persists a run and pauses it on a hook until the approval arrives (`defineHook`, then `resume` from the Telegram or Slack callback). It sleeps between follow-ups without paying for compute. Every action re-checks the approval's hash before it runs.
- **One approval log.** The hosted table mirrors `approvals.jsonl`: who, which hash, when, through which channel.
- **Connector grants.**
  - Each grant gets the narrowest scope that works.
  - Its token is encrypted at rest.
  - The founder can revoke it in one click, and a revoked grant fails closed.
- **Isolation and data.**
  - Each workspace sees only its own files, leads and grants.
  - Leads are personal data: they stay in the founder's workspace, export and delete work, nothing trains a model, and opt-outs hold the same day.
- **Model spend.**
  - "Auto" runs on our AI Gateway key, with each request tagged by founder and capped by a budget.
  - "My model" uses the founder's endpoint, so a failed key can't fall back to our account. The gateway's per-request key can, so we don't use it without a quota.
- **Billing.** Stripe subscriptions through the existing client; agents pay per call over x402.

## 8. Pricing and profit

**What the market charges** (`research/gtm-harnesses.md` §7):

| Product | Price |
|---|---|
| Gooseworks | $29–$299 a month in credits |
| Lindy | $29.99 a seat |
| Relevance AI | $29 a month for 2,500 actions |
| Zapier | $19.99 a month billed yearly |
| respond.io | $79–$279 a month |
| Clay | $185–$495 |
| Artisan | about $280–$660 |
| 11x | $3,750 a month |

- Buffer charges $6–$12 per channel.
- Outcome pricing exists: Intercom $0.99 and HubSpot $0.50 per resolution.
- Credits draw billing complaints. Bringing your own key removes the model charge but never the platform charge.

**Proposed, for Edidiong to decide.** Units, never hours; the market's entry point is $29.

| Rung | Unit | Proposed price | Why |
|---|---|---|---|
| **Workspace** (MIT) | — | Free forever | The funnel. It runs on the founder's machine and key, so it costs us nothing |
| **Review API** (x402) | One draft reviewed | $0.01 | The open-source harness and other agents call our brain per draft. Same price as the Content Gate API |
| **Hosted Solo** | One workspace, one month, 300 approved messages | $29; founding price $19 for the first 20, locked for a year | Matches Gooseworks, Lindy and Relevance AI. 300 approvals is about 10 a day: enough for personal outreach, and itself a guard against spam. Blocked and rejected drafts never count |
| **Hosted Team** | 5 workspaces, 3 approvers, Slack approvals, one month | $99 | Small teams and studios |
| **Hosted Agency** | 20 client workspaces, one month | $249 | Agencies: one approval inbox, a rulebook per client |
| **Model credits** ("Auto") | Per run | At cost plus a margin you set (proposal: 20%) | Metered by AI Gateway's spend report. "My model" carries no model charge |
| **WhatsApp Cloud API** | Per message | Meta's fee at cost, on the founder's own WhatsApp Business account | respond.io's pass-through model; our margin stays in the subscription |
| **GTM Sprint** (done for you) | One two-week campaign: scorecard, 50 sourced leads, 50 reviewed first messages, follow-up drafts, the Monday dashboard | $750 for the first five, then reprice from the delivery time we record | Between the AI Visibility Audit ($150) and the Agent Launch Sprint (from $2,500). The founder approves and sends; Edidiong reviews |

**How it makes money, in order of when the cash comes:**

1. **Sprints, from stage 3.** Cash without new infrastructure, using the firm's delivery and the harness itself.
2. **Hosted subscriptions, from the public beta.** Recurring revenue. With "My model" our cost is infrastructure, and the evals will give the real number per run.
3. **Agencies.** One account, many workspaces: the way Buffer and respond.io grow with their customers.
4. **The review API.** Small money per call, but every open-source install that turns it on becomes a paying agent.
5. **The firm's offers.** A founder whose go-to-market works is the best lead for an Agent Launch Sprint or a Company Brain.

**A planning example for month 3, not a forecast:**

- 40 Solo at $29;
- 5 Team at $99;
- 2 Agency at $249;
- 4 sprints at $750.

That's about $5,150 that month. Gross margin waits for measured costs: the eval cost column, Vercel's bill and delivery hours. The industry figure to beat is ICONIQ's 45% for AI products in 2025.

**Rules:**

- Builders in programs Edidiong supports get the free tier only (`ops/conflicts-of-interest.md`, rule 2).
- Prices go into `packages/catalog` only after Edidiong decides them.

## 9. Proving it: internal, local, real world, public

| Stage | Dates | What happens | Exit criteria |
|---|---|---|---|
| **1. Internal** | Thu 8 – Fri 16 Oct | Shonin's own go-to-market runs on `pnpm gtm` with Telegram approvals, 20 minutes a day | 20 approved messages sent; every edit logged; no message without an approval record; draft-to-send time measured |
| **2. Local, evals, connectors** | Mon 12 – Fri 16 Oct | Evals on four frontier models and one local model, 20 runs each. Gmail drafts and the pipeline sheet (`drive.file`) under Google's exemptions. Five design partners recruited, each with their own Telegram bot from BotFather, so approvals never cross. If stage 1's first days show value, the hosted alpha starts: sign-in, workspaces in Postgres, the approvals table, Telegram by webhook | The eval table in the repo, with cost per run; connector tests pass with no network; five founders confirmed |
| **3. Design partners** | Mon 19 – Fri 23 Oct | Concierge: Shonin's agents run each founder's workspace with `pnpm gtm`, on the founder's own model key. The founder approves in their own Telegram and taps to send. Technical founders can run it in their own agent instead. This is the hosted product by hand, before it's code. The first GTM Sprints are offered to founders outside the programs Edidiong supports | 5 workspaces active on 4 of 5 days; 50+ approved messages; corrections logged; 3 of 5 say what they'd pay; no incidents |
| **4. Public** | The day after the domain works | The v2 launch thread and demo; the free harness for everyone; the hosted beta opens to a waitlist at the founding price; Product Hunt on a Tuesday after 50 public runs | See the launch gates below |

**Start stage 1 (Thu 8 Oct, 15 minutes once).**

1. Make a second Telegram bot for approvals, so approval cards don't mix with the site's lead alerts. Get its token and your chat id as in `ops/setup-checklist.md`, "Lead alerts on your phone"; your user id is `message.from.id` in the same `getUpdates` answer.
2. Write `gtm-workspaces/shonin.env`. The folder is git-ignored, and this file's values win over anything your shell exports:

   ```
   ANTHROPIC_API_KEY=…            # or GTM_MODEL=provider/model with AI_GATEWAY_API_KEY=…
   TELEGRAM_BOT_TOKEN=…           # the approvals bot
   TELEGRAM_CHAT_ID=…             # your chat with it
   GTM_APPROVER_IDS=…             # your Telegram user id: only you can approve
   ```

3. Run:

   ```bash
   pnpm gtm doctor --env gtm-workspaces/shonin.env
   pnpm gtm new gtm-workspaces/shonin --input packages/gtm-harness/examples/shonin.json --env gtm-workspaces/shonin.env
   ```

**Then every day (20 minutes):**

1. Open the workspace in your agent and say: "Read AGENTS.md and run today's tasks in sprint.md."
2. Send the drafts for approval:

   ```bash
   pnpm gtm review gtm-workspaces/shonin --env gtm-workspaces/shonin.env
   ```

3. Approve or reject each card in Telegram.
4. Record your decisions, then get the send links:

   ```bash
   pnpm gtm wait gtm-workspaces/shonin --env gtm-workspaces/shonin.env
   pnpm gtm links gtm-workspaces/shonin
   ```

5. Tap each link to send.
6. Log every edit in `corrections-log.md`, and every reply in `pipeline.csv`.

**Launch gates.** The launch goes out only when all of these hold:

- `shonin.ai` serves the site;
- the eval table is published;
- the design partners' numbers are in;
- the hosted product has a privacy policy and terms on the domain;
- no incident is open.

## 10. Going to market

**One line:** "Your go-to-market, run by agents you can check. Any model. Nothing leaves without your yes."

**Who it's for, in order:**

1. **Founders who sell through conversations**, especially where business runs on WhatsApp and Telegram. Most GTM tools are built around email and LinkedIn; we start with the channels these founders actually use.
2. **Agencies and studios** that run go-to-market for several clients: one approval inbox, a workspace per client.
3. **Agent builders**, who call the review API per draft or plug the workspace into their own agents over MCP.

**How they hear about it, cheapest first:**

1. **Our own numbers.** Shonin's internal run (stage 1) becomes post 7 of the launch thread: the messages approved, the replies, the calls. Real numbers, or no post.
2. **Design partners.** Five founders, five short case studies, each with their permission.
3. **Open source.** The harness in its own public repo (decision 4), listed where agents look for skills and MCP servers. A Show HN post leads with the eval table, because it's technical and open.
4. **Content.** Thread 08, a 60-second demo cut by the Video Desk, and one post a day in launch week (`content-engine.md`).
5. **Founder communities.** In Celo channels, only the free tool, with no prices and no links to paid tiers (`conflicts-of-interest.md`, rules 1–2).
6. **Product Hunt** on a Tuesday, after 50 public runs.

**The funnel:**

1. A free run at `/gtm`.
2. The workspace, with Telegram approvals.
3. The hosted waitlist.
4. A paid workspace.
5. For founders who want the result rather than the tool, the done-for-you sprint, and from there the firm's other offers.

## 11. What we measure

**North star:** approved messages sent per week, across all workspaces. It only grows when founders get value and stay in control.

| Measure | Source |
|---|---|
| Free runs (web and CLI) | Telegram run alerts; the run route's logs |
| Activated workspaces: a first approval within 24 hours | The approval log |
| Drafts approved as written, approved after edits, rejected | The approval log and `corrections-log.md` |
| Corrections per 100 drafts: should fall as rules accumulate | `corrections-log.md` |
| Replies per 100 messages sent | `pipeline.csv`, logged by the founder |
| Hosted: waitlist, weekly active workspaces, paying workspaces, revenue, gross margin per workspace | The database, Stripe, the AI Gateway report |
| Incidents: a send without an approval, an account flagged by a platform | The audit log; founders' reports. **The target for both is zero.** |

**Targets for Mon 30 Nov, not promises:**

- 300 free runs;
- 50 activated workspaces;
- 30 founders on the hosted waitlist, and 5 paying at the founding price;
- 3 GTM Sprints sold;
- zero incidents.

## 12. Risks and rules

| Risk | What we do |
|---|---|
| A platform restricts accounts that automate messages | Official routes only. No bot logs into a founder's account; their tap sends each message; nothing goes out in bulk |
| Messages read as spam and hurt the founder's name | The reviewer blocks pushy drafts and invented claims; one follow-up, then stop; `do_not_contact` is enforced in code |
| A model invents numbers | Numbers come only from the founder's words; the evals measure invented numbers per model; the reviewer blocks them |
| Model spend runs away on our credits | "My model" by default; "Auto" runs under a per-founder budget; the evals record cost per run |
| A founder's own key fails on AI Gateway, and the gateway bills our account instead | "My model" goes through the founder's own endpoint, where nothing can fall back; the gateway's per-request key runs only under a per-founder quota |
| WhatsApp's rules change again: it bars general-purpose AI assistants, and its prices changed on 1 Oct 2026 | The harness is never a WhatsApp chatbot; first contact is the founder's tap; Cloud API fees pass through at cost |
| Google's assessment for Gmail drafts costs $675–$3,600 a year and takes weeks | Drafts stay for Edidiong and the design partners under the exemptions; the public launch decides between the assessment and links only (decision 8) |
| Leads are personal data | They stay in the founder's workspace, with export and delete; no model is trained on them; a data processing agreement for hosted workspaces; opt-outs honoured the same day |
| Our ecosystem roles collide with selling | Builders in programs Edidiong supports get the free tier only, and design partners for paid plans come from outside those programs |
| A hosted SaaS distracts the firm from revenue | The hosted build starts only after stage 1 shows value internally; design partners run by concierge first; GTM Sprints bring cash first |
| Funded competitors | We don't compete on breadth. We compete on approval first, WhatsApp and Telegram, any model, and an open workspace |

## 13. Decisions for Edidiong

| # | Decision | Recommendation | By |
|---|---|---|---|
| 1 | Hosted prices and the GTM Sprint price (§8) | Solo $29 (founding $19 for the first 20), Team $99, Agency $249; the GTM Sprint at $750 for the first five | Fri 16 Oct, before design partners are asked what they'd pay |
| 2 | Scheduled publishing of the founder's own posts, each approved with its time | Yes for the founder's own posts on their own channels; messages to people stay one tap by the founder (the `CLAUDE.md` rule stands) | Mon 19 Oct |
| 3 | Model access on hosted plans | "My model" by default, through the founder's own endpoint; "Auto" on our credits, capped, at cost plus a margin you set (proposal: 20%) | Fri 16 Oct |
| 4 | Split the MIT harness into its own public repo | Yes, before Show HN. The reviewer runs behind Shonin's API, so no brain code is published | Fri 23 Oct |
| 5 | The five design partners | Founders outside the programs you support, or inside them on the free tier only | Fri 16 Oct |
| 6 | The hosted product's name | Keep "GTM Harness by Shonin" for both, with "hosted" as the plan name | Fri 23 Oct |
| 7 | Spend before launch | The domain (about $160) and the eval runs (measured on 12 Oct); nothing else until design partners say what they'd pay | Now |
| 8 | Gmail for the public launch | `mailto` links only at launch; Gmail drafts for Edidiong and design partners. Pay for the CASA assessment only when paying founders ask for drafts. Sending through `gmail.send` would change the "founder sends" rule in `CLAUDE.md`, so it's yours to call | Fri 23 Oct |
| 9 | The review API: the brain behind an x402 route at $0.01 a draft, so the public open-source harness can use it | Yes, built through the apis line with the repo split (decision 4) | Fri 23 Oct |
