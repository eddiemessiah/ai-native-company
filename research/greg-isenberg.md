# Greg Isenberg: research for an agent-native services company

*Compiled 2026-09-26 for Edidiong Umana ("DeFi Messiah"). Covers Greg Isenberg's work up to and including 2026-09-24, with the most weight on Jul–Sep 2026.*

**Method.** x.com, gregisenberg.com, ideabrowser.com, typesafe.ai and most podcast hosts were blocked by the egress proxy. Everything below comes from three kinds of source:
- web-search summaries;
- GitHub-hosted mirrors: full-text tweet corpora, an ingested copy of the X article, English and Chinese episode notes, and show-note transcripts;
- tweet dates decoded from X snowflake IDs, as `(id >> 22) + 1288834974657` ms.

Quotes marked "verbatim" come from the full-text mirrors. The rest are paraphrases. Items I could not verify are in the **Unverified notes** at the end.

The Sep 20, 2026 article "AI-native services: a $100B opportunity" is already known to us. It is only summarized where later material builds on it.

---

## 0. TL;DR, the things that go beyond the Sep 20 article

1. **Greg's follow-up to the Sep 20 article was about solo AI-native service firms, not SaaS** (Sep 23 episode, "The $3,000/Day Solo AI business with Astra + Upwork").
   - Upwork, Fiverr and Contra are a third sales channel, for $100–$25k jobs.
   - The firm is "semi-autonomous": AI does the work and a human approves it.
   - He estimates net margins of 60%+, against 10–15% for a human agency.
   - The best niches have "a creative surface but a boring operational core."
2. **The agent web is a payments story.** Greg's Cloudflare episode (Aug 10) explains HTTP 402 and x402 as "the request becomes the transaction." His take: the next great internet businesses may be "tiny paid doors that agents walk through all day." He sells a crawl-walk-run path from a manual report to a dashboard, then an API, then an MCP tool, and finally agent payment per query. **This is our Celo/x402 thesis in his words.**
3. **Agents with wallets need infrastructure.** His Jul 6 and Jul 31 lists name the pieces:
   - spend controls ("Ramp for agents");
   - escrow for machines;
   - virtual cards per task;
   - receipts;
   - reputation ("Yelp for agents");
   - dispute resolution;
   - agent-to-agent subscriptions;
   - "Fiverr for machines."

   On Sep 19 his #1 Jev-native product was an **agent spend firewall**.
4. **Jev (Sep 18–19).** Greg's frame is "find an expensive queue and put Jev at the front of it." Jev is a typed classifier at $0.042 per 1M input tokens, with output free: it sorted 1,700 emails for about $0.18. The use cases he lists:
   - instant quotes;
   - support triage;
   - application piles (grants, permits, claims, loan docs);
   - local-services matching;
   - fast browser agents.
5. **Websites need agent buttons.** WebMCP (Aug 26) and Muse connectors (Sep 18/24) mean SMEs need "agent-ready" front doors. Greg gives two cash-flow businesses built on this:
   - a **WebMCP conversion agency** for boring local businesses: about $2k setup plus a few hundred dollars a month;
   - an **agent mystery shopper**, which audits whether agents can complete the key journeys on a site.

   This maps directly onto our existing Nigerian SME website clients.
6. **Distribution.** "You're not selling the future. You're selling the screenshot" (Aug 10). Do the first job free. Use a 50-example eval set as the sales asset (Jul 1). Newsjack every major launch within about 24h with a "CLEAREST explanation plus the businesses it unlocks" thread. Long numbered-list posts get roughly **30x the bookmarks** of his short posts (analysis in section 6).
7. **Exit logic (Jul 27).** Private equity has about $2T of dry powder and is paying about 3 turns of EBITDA more than strategic buyers. In 2026 "a profitable business growing 25% beats one growing 50% while burning cash." AI-native services with real EBITDA are sellable.

---

## 1. What Greg runs: gregisenberg.com, Ideabrowser, Late Checkout (Task 1)

### gregisenberg.com (not fetched directly; page list from the search index)

- **Homepage.** "CEO of Late Checkout, a holding company building community-based internet businesses." It pushes **Greg's Letter**, a weekly newsletter with 158,485+ readers per the page snippet. Hosted on Kit at gregisenberg.kit.com, with an archive at latecheckout.substack.com.
- **Resource and lead-magnet pages.** Every page is an email-capture asset.

| Page | What it offers |
|---|---|
| `/ai-agents` | "Build AI Agents": first agent, agent swarms, 10 automations. "Free for now, but not forever." |
| `/directory` | Build a profitable directory business |
| `/6tools` | 6 tools to validate ideas and get paid |
| `/startup-blueprint` | Start a company with $0 |
| `/30startupideas` | Top 30 ideas from the podcast |
| `/growth-guides` | Growth guides |
| `/obsidian-codes` | 12 commands that turn notes into ideas |
| `/fable5` | "Run Fable like a team of 5": hire it to kill your own company, run a copy tournament with 5 judges, make it interview you before it builds, read a contract and find the money buried in the exhibits |
| `/ai-startup` | Build a startup using AI |
| `/about-me` | Exits: 5by (to StumbleUpon), Islands (to WeWork), WallStreetSurvivor (to a PE group) |
| `/blog` | e.g. "How to build a $10M ARR B2B AI startup", "AI and your job", "The rise of the AI affiliate" |

- **Workshops.** "commit 2026: building a cash-flowing startup with AI" (free). "Offline Mode" (private, 2 days, South Florida, Jan 23–24, 2026). Ideabrowser workshops such as "How to build a business in an AI world."

### Ideabrowser.com (his idea-database product)

Launched on Product Hunt on June 4, 2025. Co-founder Jordan Mix. Title tag: "#1 Software to Find Startup Ideas Worth Building."

- **Free "Idea of the Day".** One fully written-up idea per day, available for 24 hours. This is the habit loop and the top of the funnel.
- **Database of 1,000+ ideas.** Each idea page has 11 sections: Value Ladder, Why Now, Proof Signals, Market Gap, Execution Plan, Value Equation, Value Matrix, **ACP (Audience–Community–Product)**, Community Signals, Keywords, and the main idea. Each idea also shows search volume, growth %, pain level, feasibility, founder fit, revenue potential and execution difficulty.
- **Paid features.** An AI idea generator; a **Research Agent** ("40-step research" on your own idea; Pro tier and above); "Greg's Picks"; a Hub workspace with **MCP connectors**.
- **The MCP connector in Greg's own words (Aug 2, 2026).** He calls "Ideabrowser MCP" a source of "outside market signal: startup ideas, trend reports, social/search demand, AI research reports, and builder prompts." Earlier (Apr 2026) he demoed pulling ICP, positioning, offer and growth strategy into Claude Code through it.
- **Pricing.** Annual-only, and raised about 1.7x in 7 months. This is ladder-up pricing plus "lock in launch pricing" urgency.

| Tier | Mid-2026 | Nov 2025 |
|---|---|---|
| Free | Idea of the Day | Idea of the Day |
| Starter | $499/yr | $299/yr |
| Pro | $1,499/yr (3 Research Agent reports/mo) | $999/yr |
| Empire | $2,999/yr (9 reports/mo, weekly group coaching with Jordan Mix, monthly Greg AMAs, builder community) | did not exist |

- **Distribution.** Every podcast show-note, X article and big list ends with "more ideas @ideabrowser (free to sign up)."
- **Criticism** from competitors (preuve.ai, ideagrape): Research Agent claims are not source-linked. It is priced 10–50x a per-report validator. It never says "don't build this."

### Late Checkout (holding company) and portfolio

- **What it is.** An "8-figure holding company with $0 of outside capital" (May 2024 thread). Each business starts as an audience or community. Greg calls himself "the anti-MrBeast": he goes after influential, high-value audiences.
- **LCA (latecheckout.agency, @MeetLCA).** Builds AI-native products and orgs for Fortune 500s and fast-growing startups. Show notes name Warner Music, Fortnite and Dropbox. Greg (Jun 27, 2026): "we've built a SWAT team for building AI-native orgs and AI-native products." Theo Tabah leads the enterprise AI advisory.
- **Other brands:**
  - Boring Marketer (@boringmarketer): AI plus SEO for organic customers;
  - Boring Ads (@imboringads): AI-assisted ads agency;
  - Design Scientist (@DesignScientist): conversion-focused design;
  - The Vibe Marketer (thevibemarketer.com): resources and community for "vibe marketing";
  - Ideabrowser;
  - The Startup Ideas Podcast (SIP).
- **SIP format.** About 2 episodes per week plus "SIP Live" timeline-reaction streams, on YouTube, Spotify and Apple. Sponsors in Sep 2026: Brex, Higgsfield, Google. Every episode ships a free prompt pack or starter brief on a `startup-ideas-pod.link/...` short link, for example the Muse connector prompt, the Creative prompt pack, the local-AI guide and the software-factory skills.
- **Reach.** About 705K X followers (observed Sep 3, 2026).

---

## 2. Core theses (dated)

Dates for tweets are decoded from snowflake IDs, in UTC.

| Date | Thesis | Key line or number | Source |
|---|---|---|---|
| 2026-02-17 | **Skill era of the internet.** Expertise gets packaged as agent skills and becomes infrastructure. | "in the api era, the winners owned the pipes… in the skill era, the winners own the patterns"; scaling "looks less like seats and more like invocations" | X article 2023769860690383065 |
| 2026-03-30 | **Distribution beats building.** 7 distribution weapons. | "200,000+ new vibe coding projects… almost NONE get customers"; "building an MCP in 2026 = mobile in 2010" | tweet 2038706332119797894; episode YeoGehNsrLc |
| 2026-04-01 | **Ambient businesses.** | Agents monitor, sell and execute; "you check in every few days"; 7–8 figure businesses | tweet 2039421756457484432 |
| 2026-04-08 | **Productized agency to software exit.** | Pick one painful deliverable for one buyer; sell the outcome at $3–5k/mo on retainer; 80%+ margin; productize by month 4 | tweet 2041865199485936018 |
| 2026-05-11 | **AI-native means the company is legible to machines.** | "An AI-native company is not a company that uses AI. It is a company that has been rebuilt so AI can actually operate inside it." About 1,000 truly AI-native $5M+ ARR companies exist. "Weird little money machines." | X article 2053843542020063489 (verbatim) |
| 2026-05-13 | **The new buyer is an AI agent.** | "billions of new customers… with money to spend but they only shop via MCP"; "cost of intelligence [falls] faster than the cost of distribution" | tweet 2054584280848769413 |
| 2026-06-02 | **Selling to AI agents is the next $100B market.** | Agent buying journey; agents need identity, tools, inbox, memory, wallet, receipts | episode MlptIfpoLlw |
| 2026-06-08 | **AI-native org = 3 layers.** | People for strategy and taste, agents for execution, a shared context layer. "AI eats the middle… your job is the bookends"; "The moat is the system" | thread 2064054350859649114; episode LztPaNmcWGU |
| 2026-06-27 | **The company is the context layer.** | "The most valuable thing you can build in 2026 is a business so well-documented that an agent can run it. The moat is how legible your company is." Goldmine: "Repetitive enough for an agent, complex enough that the incumbents never bothered." | tweet 2070918939526205494 |
| 2026-07-01 | **Agents are the new SaaS; sell the job done.** | "Spot the niche → find a workflow with a paycheck → shadow the human → spec the agent → run it manually first → build the smallest useful version → sell the pilot like labor → productize the repeatable parts" | tweet 2072426075095736488; episode 83fWzQSWB10 |
| 2026-07-06 | **Build startups for agents** (21 ideas). | Spend controls, memory, sandboxes, docs-as-product, reputation, permissions, escrow, virtual cards, agent courts, agent-to-agent subscriptions, "fiverr for machines" | tweet 2074127490109350221 (verbatim) |
| 2026-07-13 | **How I'd make $10M with AI agents.** | Find apps people pay for and hate; "minimum viable agent" (draft and approve); 50-example eval set; iMessage products; the new OS (Claude Code/Codex/Hermes) is empty; $200k MRR × 4x = about $10M | X article 2076733920834371585 (verbatim) |
| 2026-07-21 | **"So let me get this straight…"**: 20 stacked shifts. | Agents outnumber humans; shadow economy of agents paying and vouching; "Every SOP is turning into a product"; "You charge someone what they'd pay a human, and it costs you a few bucks in tokens" | tweet 2079555200444944811 (verbatim) |
| 2026-07-27 | **M&A for AI-native firms with EBITDA.** | PE has $2T+ dry powder and pays about 3 turns more EBITDA than strategics; profit now beats growth | tweet 2081761054128816414 |
| 2026-07-29 | **The software unfair advantage moved.** | It moved from code to distribution, niche depth, proprietary data, network effects and maintenance. "Agent-first, not AI-bolted-on." | SIP Live, Uslb-G2pc5I |
| 2026-07-31 | **The biggest opportunities right now** (26 items; his top post of the period at 14.5K bookmarks). | Agents that spend money; judgment layer; verifying humans; phone agents; LLM-search land grab; seat-pricing collapse; AI enablement ("95%… use nothing beyond ChatGPT"); "the agency everyone resents"; verticals on 2011 software; reviving dead software; tiny markets; agents hiring agents; anti-AI premium; distribution-first | tweet 2083175325098266931 (verbatim) |
| 2026-08-10 | **The agent web monetizes resources, not attention.** | Cloudflare pay-per-crawl, Monetization Gateway, x402: "the request becomes the transaction"; "tiny paid doors" | episode MNNfat_QP0E; tweet 2086881493641568698 |
| 2026-08-23 | **AX is the new UX.** | "Stripe just paid $8B for OpenRouter betting the main user of the internet is an agent… 1000+ new companies" | tweet 2091600846857416973 |
| 2026-08-26 | **"The MOST asymmetric window I've ever seen."** 5 plays. | 1) Thrive Holdings model: buy boring 20%-margin firms and swap labor for agents. 2) Picks and shovels paid per call. 3) Buy a sleepy SaaS and rebuild it AI-native. 4) An agency outside, agents inside. 5) Productize the Upwork roles still being hired. | tweet 2092665799332745220 (verbatim) |
| 2026-08-26 | **WebMCP: websites grow agent buttons.** | "SEO was about Google understanding your page. AEO was about AI citing you. WebMCP is about the agent actually finishing the job" | tweet 2092699140803211682; episode EoNH3Tn8wYE |
| 2026-09-08 | **Local AI as a wedge.** | Hybrid: local private first pass, cloud reasoning, human approval. A 24-month window for local-AI-native vertical software. | episode UtFo1ZNC2ns |
| 2026-09-11 | **OpenAI Agents API is "the AWS moment for agents."** | Infrastructure is now rented, so value moves to "owning one painful workflow with your own tools, data, approvals, and clear ROI" | tweet 2098396069583319070 |
| 2026-09-12 | **"The only businesses left to build"** (13). | AI-native service firms; offline businesses; distribution; proprietary datasets; domain-specific harnesses; robotics; physical products with fans; compute and energy; health and care; marketplaces and social networks "for people and agents"; real assets; vertical agents; security | tweet 2098755584568828177 |
| 2026-09-18/19 | **Jev: put a typed decision model at the front of expensive queues.** | See section 7 | 2101018750916948237; 2101284640828915995 |
| 2026-09-20 | **AI-native services: a $100B opportunity** (already known to us). | Adds evidence: Harvey ~$100M→$190M ARR in ~5 months; EvenUp about $500/letter and $50M+ revenue; Kick bookkeeping at $300–500/mo with 70%+ gross margin; "price against the human… firm charges $2,500, you charge $800" | article 2101760050108797268 (verbatim) |
| 2026-09-21 | **Email, phone numbers and marketplaces "are about to get destroyed."** | Millions of agents (Muse, Instinct) hit inboxes and phone lines; "channels built for humans… break/be reinvented" | tweet 2102007062372769877 |
| 2026-09-23 | **One-person AI-native service firm** (the promised deep-dive, most likely). | Marketplaces as a channel; semi-autonomous; 60%+ net; six-prompt build; four filters | episode e7s7jRgHWsg |
| 2026-09-24 | **Muse connectors could be the App Store moment.** | "Instead of building apps people have to find and open, founders can build services a personal agent calls"; 4 connector ideas | tweet 2103198565065523426; episode 84q4WA3kA8Q |

---

## 3. The AI-native services checklist (condensed, actionable)

This merges the Sep 20 article with the Jul 1, Jul 13, Aug 10, Aug 14, Sep 8 and Sep 23 material. Use it as a gate before building anything.

### A. Pick the box

- [ ] **Already outsourced?** Then the budget exists and switching costs nothing.
- [ ] **Checkable right answer?** Place the idea on the 2x2:
  - outsourced and checkable: **build here**;
  - outsourced and judgment-heavy: keep a human in the loop and charge a premium;
  - in-house and checkable: sell it as "a tool the team keeps";
  - in-house and judgment-heavy: **skip it**, "that's a job, not a business."
- [ ] **Four filters (Sep 23):**
  1. an existing budget;
  2. a clear unit (per SKU pack, per localized ad, per listing pack);
  3. repeatable, which enables subscriptions and higher exit value;
  4. a concrete definition of "correct."

  Want "a creative surface but a boring operational core."
- [ ] **Paycheck-workflow traits (Jul 1):**
  - high frequency, ideally daily or hourly;
  - a clear finish line;
  - tied to software (Gmail, Slack, Shopify, WhatsApp);
  - learnable edge cases (Zapier can't do it; a lawyer isn't needed);
  - the buyer feels the loss (missed calls, lost leads).
- [ ] **Agent test (Aug 14).** Repeated trigger, stable inputs, clear tools, a measurable finish line, and **judgment in the middle**. The fifth point is what makes it an agent rather than an automation.
- [ ] **Data-product filter (Aug 10).** The data is valuable, repeatable, changing, fragmented, and annoying to collect.
- [ ] **Local-AI filter (Sep 8).** Sensitive data, repeated review work, bad incumbent software, expensive mistakes, work that happens close to the device. "Two out of five is a hobby."
- [ ] **Sourcing method.**
  - List 20 jobs people complain about in one niche and score them on the traits above (Jul 1).
  - Mine Upwork/Fiverr for roles still being hired: "data entry specialist," "appointment setter," "research assistant" (Aug 26).
  - Check Sensor Tower for disliked apps with strong retention (Jul 13).

### B. Design the offer (the 8 pieces)

1. **Unit.** Never hourly. It needs a visible finish line.
2. **Intake.** A form: one upload, five fields, a request. "If you can't define intake as a form, your unit isn't clear enough yet."
3. **Engine.** Model plus instructions plus examples plus vertical context.
4. **Rulebook.** Every observed failure, written down. This is the real product.
5. **Review layer.** Low-stakes, high-confidence output ships. Anything touching money, legal exposure or reputation gets a human.
6. **Delivery.** A dashboard or status portal that replaces the account manager.
7. **Price.** Per unit, or a retainer for a defined scope, priced against the human (about 1/3 of the firm's price). Use contingency where savings are checkable. Greg: "I paid a firm 50% of savings, you can do the same service for 10%."
8. **Distribution.** Cold outreach to the exact check-signer, plus **the first job free**.

### C. Spec the agent (Jul 13, seven questions)

What wakes it? What context does it need? What tools can it call? What can it do alone? What needs approval? When does it escalate? How do you know it worked?

**Start with a minimum viable agent (Jul 1).** Four safe patterns:
- **draft and approve** (the agent drafts, a human sends);
- **triage** (classify and route);
- **coordinator** (chase missing information, send reminders);
- **bounded action** (e.g. refunds under $50).

"Earn the autonomy."

### D. Build the firm in layers (Sep 23, "six prompts, one layer each")

1. **Firm shell.** Service templates, job inbox, production stages, client records, deliverables, costs, margins, approvals, revisions, delivery.
2. **Messy demand to a job.** Extract deliverables, formats, exact copy, deadline, provided assets, **missing inputs**, risks and likely revisions. Recommend accept, review or decline.
3. **Production layer.** One API across many models.
4. **Model router.** Must explain *why* it chose each model; the human can override and see the margin impact.
5. **QA and repair against the approved brief.** Each asset is marked ready, needs a controlled edit, needs regenerating, or needs a human decision.
6. **Controls.** Spend cap per job, repair limits, maximum attempts, approved models, client-message rules, approval gates, and an **audit log**.

Swap the service template and you have a different company on the same machinery.

### E. Trust wrapper and eval (Jul 1)

- "The agent does the work but the wrapper creates the trust." Logs, approvals, a test environment, metrics.
- **Build a 50-example eval set from the client's own history.** For example: "It routed 42 correctly, flagged six for human review, and made two mistakes. Here are the two mistakes, and here's how we fix them."
- This eval set is also the best sales asset you have.

### F. Operate

- Every caught mistake goes into the rulebook; the review layer shrinks over time.
- Keep a daily `what_the_market_is_telling_us.md` (Aug 2). It is updated from Stripe, product analytics, support, call transcripts and the CRM, and records *changes in behavior*, "the receipts behind it," and the decision each change affects.
- Keep skills in a GitHub repo shipped as a plugin with auto-update (Aug 19): "thick skills, thin agents."
- Run your own tooling as a software factory (Sep 14): isolate (worktrees), build (code-structure skill), prove (before/after evidence), ship (AI PR review to 5/5).

### G. Sell

- **Sell the pilot like labor (Jul 1).** 3 customers in one vertical, roughly a $1,500 setup plus $1,000 per month in US terms. "You earn the software by doing the work first."
- **Pitch it as a replacement.** "We do what your current firm does, faster and cheaper."
- **Sell proof, not the future.** "You're not selling the future. You're selling the screenshot" (Aug 10).
- **Use a paid-audit tripwire (Jul 15).** Corey Ganim's $999 AI Tools Assessment comes with a money-back guarantee if fewer than 5 hours a week are found. About 50–60% then buy implementation. He credits the $999 toward the upsell after marking the upsell up by $1,000.

### H. Scale and exit

- After about 10 clients in one niche, productize the repeated fixes.
- Self-serve software is optional ("where the highest valuations are").
- Target margins of 60–80%. PE is buying AI-native EBITDA.

### I. Avoid

- "Point the AI at production and leave everything else the way it was" gives you "a slightly cheaper agency."
- Fully autonomous "AI employee" demos: they "demo great on X and break in production."
- "Chat with an expert" products: build "use the expert's method to do one task" instead.
- Dumping everything into a vector database: that gives you "a search box with confidence."
- Paying the token tax for logic that code can do (Aug 5).
- Building before distribution.

---

## 4. 30+ ideas adapted to Africa, Nigeria, Celo and the agentic economy

Price anchors in NGN are **my estimates** (at roughly ₦1,450–1,550 per $1), not Greg's. Validate them in the first 5 sales calls. Greg's rule: price at about 1/3 of the human alternative, per unit or on a retainer, never hourly. "Greg:" in each idea cell names the source idea and its date.

| # | Idea (Greg source) | Unit | Buyer | Price vs human alternative | Why now | 7-day MVP |
|---|---|---|---|---|---|---|
| 1 | **Agent-Ready Website Upgrade**: llms.txt, schema.org, WebMCP "request quote / book / order" tools, WhatsApp handoff. Greg: WebMCP conversion agency, 08-26 | Per site kit, plus monthly monitoring | Our existing SME clients (restaurants, fashion ateliers, farms, churches, foundations), then new ones | Agency rebuild ₦0.5–2M; Greg's US price is about $2k setup plus a few hundred a month. **Ours: ₦150–300k setup plus ₦20–40k/mo** | WebMCP in Chrome (reportedly heading into ChatGPT); Muse connectors live 09-18; agents booking and buying | Upgrade 3 client sites; record an agent completing a booking; send the video to the whole client list |
| 2 | **"What AI says about you" audit plus a monthly AI-visibility loop.** Greg: Agent Readiness "sell the screenshot", 08-10; Agent Mystery Shopper, 08-26 | Per audit (30 buyer-intent prompts across ChatGPT, Gemini, Meta AI/Muse, Perplexity), plus a monthly re-run | Lagos/Abuja restaurants, hotels, schools, clinics, law firms, churches | Consultant audit ₦250–600k. **Ours: first one free, then ₦60k per audit and ₦30k/mo tracking; $300–1,000 abroad** | LLM search "land grab"; the AI gets prices and hours wrong; Cloudflare's free readiness score does the technical half (use it, sell the fix) | Audit 20 businesses in one category, DM each its screenshot, close 3 |
| 3 | **WhatsApp after-hours lead and booking agent** (draft and approve first). Greg: "the agent that answers the phone… worth thousands a month", 07-31; MVA, 07-01 | Per business per month, or per booked job | Clinics, salons, event centres, mechanics, restaurants, realtors | Receptionist or CSR ₦100–200k/mo. **Ours: ₦35–60k/mo** | WhatsApp is Nigeria's phone line; agent traffic is about to flood human channels (09-21) | Pilot with 2 clients; eval on 50 past chats ("42 right, 6 flagged, 2 wrong") |
| 4 | **Grant and RFP writing per submission.** Greg: 09-20 list | Per submission, plus an optional success fee | NGOs and foundations (existing clients), churches, Celo/Web3 builders (DevRel network), SMEs bidding on tenders | Grant writer $500–3,000. **Ours: $150–400 (₦150–400k) plus 5% on award** | Models now produce finished drafts; each funder's criteria become the rulebook | Write 3 submissions for current grant rounds; start a funder-criteria rulebook |
| 5 | **Filtered grants, tenders and accelerator feed with Jev fit-scoring.** Greg: "nobody wants 300M, they want the 50" (Firecrawl ep.); Jev "application piles", 09-18 | Per subscriber per month; per query via x402 for agents | African founders, NGOs, consultants | Research assistant ₦80k+/mo. **Ours: $9–29/mo (₦5–15k)** | Typed scoring costs fractions of a cent | Scrape 10 sources; run a weekly top-10 WhatsApp/Telegram channel; open a paid tier |
| 6 | **Books closed monthly for SMEs** (the Kick model). Greg: 09-20 | Per month of books (bank plus POS/Moniepoint/Opay exports turned into P&L and VAT schedules) | Restaurants, ateliers, farms, churches | Part-time bookkeeper ₦100–200k/mo. **Ours: ₦40–75k/mo** | Record-keeping pressure from Nigeria's 2025 tax laws (in force 2026, verify) | Close last month for 3 clients by hand plus AI; log every error |
| 7 | **Tax filing per filing** (VAT/WHT/PAYE monthly, annual returns), with a licensed accountant as the review layer. Greg: regulatory filings per filing, 09-20 | Per filing | SMEs, NGOs | Tax consultant ₦50–250k per filing or retainer. **Ours: ₦15–40k per filing** | New tax regime means confusion, which means demand (verify) | Partner one chartered accountant; file for 5 SMEs |
| 8 | **Health-insurance (HMO) claim pre-submission review** (the Nigerian version of home-health note review). Greg: 09-20 worked example | Per claim reviewed | Private clinics and hospitals billing HMOs | Claims officer ₦150–300k/mo plus denial losses. **Ours: ₦300–800 per claim** | Checkable tariff and diagnosis codes; the mandatory-insurance push (NHIA Act 2022) | Review 200 past claims free for 1 clinic; show the denial risks found |
| 9 | **Customs HS-code and duty check, plus overcharge-refund recovery.** Greg: customs classification per shipment, 09-20; "agents… file refund claims for overcharges and only take a cut", 09-02 | Per shipment check; refunds on contingency | SME importers, **sold through clearing agents** ("sell to the people already selling to the industry," 08-10) | Refund firms take 30–50%. **Ours: ₦20k per shipment check; 15% of the amount recovered** | Rule-bound (ECOWAS CET), document-heavy, costly when wrong | Classify 30 past invoices for 2 importers; list errors and refund potential |
| 10 | **Electricity estimated-billing dispute and refund agent** (a bill-renegotiator variant). Greg: Astra prompt #1, 09-04; contract-refund firm "take 25% of savings" | Per dispute, or contingency | SMEs, estates, churches | Most people give up; lawyers charge ₦50k+. **Ours: 20% of credit recovered** | Meter data plus regulator rules on estimated billing (verify the current regulator order) | Audit 6 months of bills for 10 businesses; file 3 complaints |
| 11 | **Lease abstraction and rent-roll for estate managers.** Greg: 09-20 | Per lease, plus a monthly rent-roll | Lagos/Abuja estate managers, developers | Lawyer review ₦30–100k per lease. **Ours: ₦5–10k per abstraction; ₦30k/mo rent-roll** | Checkable clauses and dates | Abstract 50 leases for 1 manager; renewals dashboard |
| 12 | **Corporate-registry filings desk**: annual returns, business names, incorporated trustees for churches and NGOs. Greg: regulatory filings, 09-20 | Per filing | SMEs, churches, NGOs | Agent or lawyer ₦30–150k. **Ours: ₦10–40k plus government fees** (via an accredited partner) | Compliance enforcement (verify) | Build an intake form and checklist; complete 5 filings through a partner |
| 13 | **Always-on creative pack per SKU.** Greg: idea #1, 09-23 | Weekly pack: 10 images, 3 short videos, captions in English and Pidgin | Lagos fashion brands, restaurants, agro-food brands | Shoot plus designer ₦300–800k per campaign; Greg sells a $750–1,500 sprint. **Ours: ₦60–120k per week** | One API reaches 50+ creative models; an image costs about a cent | Paid sprints for 3 fashion clients; publish the portfolio |
| 14 | **Localization into Pidgin, Yoruba, Hausa, Igbo, Swahili and French.** Greg: franchise localization, 09-23; "language stopped being a barrier", 07-21 | Per localized asset or version | FMCG distributors, telcos, NGOs, multi-branch churches, fintechs | Translator plus voice-over ₦30–150k per asset. **Ours: ₦8–30k** | Translation and voice models got good; native speakers act as the review layer | Localize 1 campaign into 3 languages for a pilot client |
| 15 | **Global AI-native studio on Upwork, Fiverr and Contra.** Greg: 09-23; productize the Upwork roles still being hired, 08-26 | Per gig deliverable (product photos per SKU, enrichment batch, lead list) | Global SMEs | Market rate for the role ($100–5,000 per job) at 70–95% gross margin | Marketplaces are a third sales channel | Post 5 listings; deliver the first 3 jobs with human QA |
| 16 | **Lagos hospitality "data refinery" that becomes an x402 API.** Greg: niche data refinery, 08-10 | Monthly report, then dashboard, then **per-query API on Celo via x402 ($0.01–0.05)** | Food-and-beverage suppliers, delivery apps, agencies, investors, landlords; later agents | Research firm ₦0.5–2M per study. **Ours: ₦50–150k/mo per subscriber** | "Clean fuel for agents"; pay-per-request rails are live | Build a spreadsheet of 100 venues (prices, reviews, IG activity, hiring); produce 10 outputs; sell to 3 agencies |
| 17 | **Crowd-sourced Naija price oracle** (market food, diesel, rents). Contributors are paid in stablecoins through MiniPay; agents pay per query. Greg: crowd-sourced datasets where "agents pay per query", 09-07; picks and shovels "paid per call", 08-26 | Per API call, plus free, pro and API tiers | Fintechs, agritech, researchers, journalists, AI agents | Field surveys or data vendors. **Ours: $0.005–0.02 per call** | x402 plus low Celo fees plus MiniPay reach | 30 contributors in 3 markets reporting 20 items daily; an x402 endpoint plus a public dashboard |
| 18 | **x402 agent spend firewall on Celo.** Greg: Jev product #1, 09-19; "Ramp for agents", 07-06; "agents that need to spend money", 07-31 | Per decision ($0.0005–0.002), or per agent per month | Agent builders, DAOs, fintechs | The alternative is a human approving every spend. **Ours: $19–99 per agent per month** | Agents are getting wallets; typed decisions are almost free | Middleware: before an x402 payment is signed, Jev returns approve/review/deny with a confidence score against policy; a Telegram tap for "review" |
| 19 | **Escrow plus receipts for agent-to-agent micro-jobs.** Greg: "escrow for machines", "court for machines", "fiverr for machines", 07-06; "agents hiring agents", 07-31 | 1–3% of each escrowed job | Agent marketplaces, developer teams | Marketplace fees around 10%. **Ours: 1–3%** | Agent-to-agent commerce has started, but trust rails are missing | Escrow contract, verification hook and JSON receipt; demo 2 agents trading a job |
| 20 | **Agent reputation lookup ("Yelp for agents")**, scored from on-chain receipts. Greg: 07-06 #6, 07-21 #17 | Per lookup via x402, or a monthly verification badge | Agent platforms; merchants flooded by agent traffic | KYB and verification services. **Ours: $0.001–0.01 per lookup** | "Agents get scammed by other agents"; inboxes and phone lines are being flooded (09-21) | Registry of agent wallets with a receipts-based score; public API |
| 21 | **Industry skill libraries**: Nigerian SME bookkeeping, 2026 tax rules, registry compliance, Celo development, church administration. Greg: skill era, 02-17; industry skill libraries, 07-13; "every SOP is turning into a product", 07-21 | Per seat per month, or per invocation via x402 | Accountants, agencies, developers | Consultant or trainer hours. **Ours: $10–49/mo or $0.05–0.25 per invocation** | Skills and plugins spread through Claude/Codex | Publish 3 skills as a GitHub plugin with a paid "pro" pack |
| 22 | **Muse connector: Lagos home-repair dispatch** (AC, generators, solar, plumbing). Greg: connector idea #2, 09-24 | Lead fee per booked job (₦2–5k), or a 10% commission | Artisans (pay for leads) and households | Referral middlemen. **Ours: a lead fee** | Muse connector platform opened 09-18; Meta's reach in Nigeria | WhatsApp-first dispatch with 20 vetted artisans in 2 neighbourhoods; connector prototype |
| 23 | **Supplier signal feed** ("new venues and events opening") for linen, catering, security, solar and POS vendors. Greg: connector idea #1 (lead generation for business suppliers), 09-24; signals over lists, 08-05 | Per qualified lead, or a monthly feed | B2B suppliers | Sales rep ₦150–300k/mo. **Ours: ₦50–100k/mo** | Signal-based outbound works; generic lists are commoditized | Build a sample feed from Maps and IG listings; send it to 5 suppliers |
| 24 | **Expert archive turned into a one-task agent tool**, e.g. a pastor's 200 sermons become a study-guide generator, or a vet's archive becomes poultry-disease triage with vet review. Greg: "archive to API", 08-10 | Per user per month ($2–10), or per query | Congregations, fans, farmer cooperatives | 1:1 counselling or consulting. **Ours: ₦2–5k/mo** | "Don't do chat-with-expert; do one specific task"; churches are already our clients | Tag one archive by task; ship one workflow |
| 25 | **AI Tools Assessment, then implementation, then an "AI Concierge" retainer.** Greg: Corey Ganim, 07-15 | Per assessment, money back if under 5 hrs/week are found | SMEs with 2–20 staff; diaspora-owned firms | Corey charges $999. **Ours: ₦150k (about $100) in Lagos; $499–999 abroad** | "95% of businesses use nothing beyond ChatGPT" | 3 assessments this week (1 free); a report template |
| 26 | **AI office hours plus "Agent Operator" cohorts** (the study group, monetized). Greg: AI enablement, 07-31 #12; managing agents, 07-24; co-working office hours, 07-15 | Per seat per 4-week cohort, plus sponsor slots | Professionals and students across Africa and the diaspora; employers | Bootcamps $300–2,000. **Ours: ₦30–75k locally, $99–199 globally** | "Must be able to manage agents" is becoming a job requirement | Announce cohort #1 (20 seats, weekly live builds); accept NGN or stablecoins |
| 27 | **Remote "marketing engineer" or FDE embeds from Africa.** Greg: FDE, 07-20; marketing engineer, 08-31 | Per 30-day embed | US and EU startups and SMEs | Greg's consulting embed is $5–30k/mo. **Ours: $1.5–4k/mo** | Both roles are exploding; the study group is a talent pipeline | Package "Growth OS in 30 days" (the week-by-week plan from the episode); sell 1 embed |
| 28 | **Jev "expensive queue" triage for inbound DMs and forms.** Greg: 09-18 | Per 1,000 items, or per month | Ateliers (buyers vs price-checkers), schools (admissions), foundations (application piles), churches (request routing) | Admin assistant ₦80–150k/mo. **Ours: ₦20–40k/mo** | About $0.18 to sort 1,700 emails | IG/WhatsApp export into Jev scoring into a daily "hot leads" digest for 2 clients |
| 29 | **Hyperlocal agent-run newsletter plus a programmatic "best X in Y" directory.** Greg: Grok Bot and Billy's 6,000-subscriber local newsletter, 08-21; directories at $2–10k/mo, 02-16 | Sponsorship per issue; featured listing per month; lead fees | Local businesses | Radio or print ads. **Ours: ₦20–100k per sponsorship** | Agent teams can run a newsletter with 1 person | Issue #1 to our client network and a WhatsApp channel; a 100-page directory |
| 30 | **"Ideabrowser for Africa"**: validated African opportunity database plus AI-in-Africa research reports. Free idea of the day, paid tiers, MCP and x402 access. Greg: the Ideabrowser model; Ideabrowser MCP, 08-02 | Per subscriber per year; per report; per agent query | Founders, investors, DFIs, corporates entering Africa | Market studies $5–50k. **Ours: $49–299/yr; reports $99–499** | Nobody owns "African AI opportunity data" for agents | 10 idea pages (Why Now, Proof Signals, Market Gap, ACP); a daily idea on X and email |
| 31 | **"Thrive Holdings" roll-up**: partner with or buy a small Nigerian accounting, IT or managed-print firm and swap its labor for agents. Greg: 08-26 #1 | The existing client retainers, at the same price and a higher margin | The customers the firm already has | Keep the price, cut the cost | PE appetite for AI-native EBITDA (07-27) | Identify 5 firms; sign 1 revenue-share LOI to run its back office with agents |

**Best 7-day revenue bets:** #1, #2, #3, #4, #13 and #25. They sell to warm contacts, need no new infrastructure, and have a free first job built in.

**Best infrastructure bets for Celo/x402:** #16, #17, #18, #19 and #21.

**Best community and research bets:** #26, #29 and #30.

---

## 5. Distribution and GTM tactics to copy

1. **Do the first job free** (09-20). Ten items reviewed for nothing and three problems they missed turns them into a customer "that afternoon."
2. **Sell the screenshot, not the future** (08-10). Show "what AI says about you today," or the eval result on their own data.
3. **A 50-example eval set as the sales asset** (07-01, 07-13). "We ran this on 50 of your old requests: 42 right, 6 flagged, 2 wrong. Here's the fix."
4. **Sell the pilot like labor** (07-01). Three customers in one vertical, setup plus monthly, then productize.
5. **A paid-audit tripwire with a guarantee** (07-15). The $999 assessment refunds if fewer than 5 hours a week are found, and half of clients buy implementation. Credit the audit toward the upsell.
6. **Price against the human** (09-20). About 1/3 of the firm's price. Per unit, retainer or contingency. Never hourly. "Being first-mover on outcome pricing is itself a sales hook."
7. **Channels you can reach without an audience** (07-15, 09-24):
   - host local "AI for business" meetups in borrowed co-working rooms;
   - run AI office hours at co-working spaces;
   - knock on doors ("30 doors → 5 meetings → 2 clients");
   - get referral partnerships with accountants, insurance agents and marketing agencies;
   - co-branded workshops;
   - LinkedIn DMs that probe rather than pitch;
   - creator partnerships;
   - product-led sharing (prefer multi-player ideas);
   - connected marketplaces.
8. **Sell to the people already selling to the industry** (08-10). Agencies, consultants and software vendors buy your data or engine first; for example, clearing agents rather than importers.
9. **Upwork, Fiverr and Contra as a third channel** (09-23). Buyers arrive with budgets and written briefs.
10. **Newsjack every platform launch within about 24h** (Jev, Muse, WebMCP, Cloudflare, Astra). Post a "CLEAREST explanation plus the businesses it unlocks plus how to get it" thread, then a next-day "N [X]-native products I'd build" list. "The arbitrage exists when it's experimental" (08-26).
11. **The 7 distribution weapons** (03-30):
    1. an MCP server ("the AI becomes your sales team");
    2. programmatic SEO (10k pages × 30 visits × 2% conversion × $10 = $60k/mo);
    3. one free tool a week;
    4. AEO (FAQ format, comparison tables, schema; Pieter Levels' AI referrals went from 4% to 20% in a month);
    5. viral shareable artifacts;
    6. buying a niche newsletter (5k–50k subscribers for $5–20k);
    7. an AI content-repurposing engine (1 pillar to 7 channels).
12. **List where agents shop.** MCP directories (Smithery, Glama, mcp.so, the official registry), the Muse connector directory ("don't count on" being featured), WebMCP tools on client sites, and llms.txt. "Your docs are now your product" (07-06).
13. **Signal-based outbound** (08-05, Cody Schneider):
    - watch 10–20 niche accounts;
    - scrape who reacts;
    - filter against the ICP;
    - enrich emails through a waterfall of providers;
    - verify;
    - send from secondary domains (about $200/mo of infrastructure).

    Warning (08-30): inbox agents will kill generic cold email. "You'll need a warm intro or be interesting enough."
14. **Workflow teardown content** (07-01). "Old world vs new world" for one specific job, repeated until the internet ties your name to that workflow. Put paid spend behind the winners.
15. **Media first, product second** (07-31 #19, 03-30). A free daily habit loop (Ideabrowser's Idea of the Day), a newsletter (158K), a podcast (2 per week) and live streams all feed paid tiers. Every piece of content cross-sells the portfolio (Ideabrowser, LCA, The Vibe Marketer).
16. **Ladder-up pricing plus urgency.** Annual-only tiers, raised about 1.7x in 7 months, with "lock in launch pricing" deadlines. The top tier adds coaching, AMAs and community.
17. **Sponsor-funded education.** Sponsors (Brex, Higgsfield, Google) pay for episodes. Each episode's free prompt pack or starter brief is the lead capture.
18. **Community as the moat.** Audience, then community, then product (ACP). Greg (attributed): "If people come for the tool, they leave for the price. If they come for the people, they stay for the vibe." He also pushes IRL premium events and small social ("build for solving loneliness", 07-31 #1). An example he cites: an art retreat that earned $90–110k against a typical $5k.
19. **Make your company legible first** (05-11, 08-25). SOPs, pricing rules and decisions go in agent-readable files. It is both an ops advantage and a sales demonstration ("we run on this").
20. **Micro-acquisitions** (08-26 #3, 07-31 #15). Buy sleepy SaaS, abandoned apps with real users, or niche newsletters and communities. Rebuild them AI-native and bolt a media machine on.

---

## 6. Content formats to copy (for DeFi Messiah on X and YouTube)

### What performs (data)

Source: full-text corpus of Greg's 100 most recent original and quote posts, Jun 20 – Sep 3, 2026.

| Format (original posts) | n | Median views | Median bookmarks |
|---|---|---|---|
| Long numbered-list text post (600+ chars, 3+ list items), no media | 12 | 229K | **3,277** |
| Video clip plus long numbered list ("What we get into: 1… 2…") | 10 | 177K | 2,706 |
| Video plus long text without a list | 5 | 145K | 2,041 |
| Short text, no list | 29 | 75K | **111** |

**Top posts by bookmarks:**

| Post | Date | Bookmarks | Views |
|---|---|---|---|
| "The biggest opportunities right now" (26 items) | 07-31 | 14.5K | 585K |
| "what_the_market_is_telling_us.md" | 08-02 | 6.8K | 302K |
| "How to become a $1M FDE in 30 days" (video) | 07-20 | 6.4K | 366K |
| "MOST asymmetric window" (5 plays) | 08-26 | 6.2K | 299K |
| "So let me get this straight…" (20 items) | 07-21 | 5.5K | 332K |
| "My friend Corey makes $1,000/hour…" | 07-15 | 5.4K | 269K |
| "If I was starting a new company today…" | 07-01 | 5.0K | 513K |

**Rule:** bookmarks come from **dense, numbered, save-worthy lists and frameworks**. Short opinions only drive replies.

### X templates, with Greg's original and our adaptation

1. **The mega-list.** "The biggest opportunities right now:" then 20–26 lines of "build for X (parenthetical why)", ending "KEEP BUILDING." Put a soft CTA in the middle ("more ideas @ideabrowser (free to sign up)").
   *Ours:* "The biggest AI opportunities in Africa right now:" then 25 items, with a CTA to our idea database, study group or WhatsApp channel.
2. **The stacked-shifts list.** "So let me get this straight…." then 20 items, each one sentence plus one consequence. Close with "Any one of these would DEFINE a decade… We got ALL of them at once… Build."
3. **The launch explainer, posted within 24h of launch.** "[X] is HERE and this is the CLEAREST explanation of what it is and what NEW businesses it unlocks. (and at the end I'll tell you how to get [X] even if you're on the waitlist)." Sections: WHAT IT IS (a plain-English analogy such as your inbox), BUSINESSES IT UNLOCKS, TLDR in one line, HOW TO GET IT.
   *Ours:* the same, plus "…for Nigerian and African businesses."
4. **The next-day follow-up.** "10 [X]-native products I'd build, ranked by [the variable that matters]:" with each item as the product name plus one mechanism line.
5. **The friend case study with a video.** "My friend [name] makes $[X]/hour doing the simplest AI business I've seen all year." Include one statistic ("95% of businesses…"), the exact offer, a bulleted list of what the episode gives away, and close with "Go get it."
6. **"If I was starting a new company today, I'd…"** followed by an arrow chain framework ("Spot the niche → … → productize") and a video.
7. **The artifact tip.** "Every startup should have a daily markdown file called `what_the_market_is_telling_us.md`." Give numbered data sources, why it matters, and one concrete example output.
   *Ours:* "Every Nigerian SME should have a WhatsApp file called…"
8. **The FAQ framework.** "The question I get most right now is '…'. Here is the 5 part test I use." Then 5 numbered criteria and which one matters most.
9. **Future-casting.** "16 things that will be normal in 3 years and sound insane today."
   *Ours:* "…in Lagos."
10. **The analogy map.** "The computer is being reinvented in the agentic era: The model is the new CPU. The harness is the new OS…" (12 lines), ending on an uplifting close.
11. **The aphorism plus a news peg.** "AX is the new UX. … Stripe just paid $8B for OpenRouter… 1000+ new companies."
12. **The long X Article, once or twice a month.** "Grab a coffee… give it 15 minutes." Sections: Background, What it is, Why now, Why this beats alternatives, The pieces, One built all the way through (real numbers), How to build, The map (a 2x2), The opportunities, What makes it defensible, The one thing to get right. Close with "I'm rooting for you" plus a soft CTA to the product.
13. **Signature closers.** "I'm rooting for you." "KEEP BUILDING." "Build." "Start." "Watch." "Send this to a friend." "What do you think?" Use one consistent sign-off.

### YouTube and podcast formats (Startup Ideas Podcast patterns)

- **"[X] is HERE. How to use it."** Within 72h of a launch, with a guest who has already built on it. Structure: demo, then "how to use it in a business", then 1–3 startup ideas, then how to get access (e.g. the Jev episode, 09-18).
- **Solo thesis with idea chapters.** Chapters run: the parallel (e.g. the App Store in 2008), how it works, "Startup Idea 1/2/3/4", "How to pick an idea", "How people find you", "Building the first version", "Where to start this week" (the Muse episode, 09-24).
- **Income-anchored "full course."** "The $3,000/Day Solo AI business…", "The $1,000/hour Solo AI business (Full Course)". Screen-share the working system, then give away the template or prompts.
- **Career-anchored titles.** "FDE: The $1M/Year AI Job Explained", "Marketing Engineer: The $1M Job with AI Agents", each with a 30-day plan and 4 ways to monetize.
- **Roundups.** "5 GitHub Repos: …". For each: what it does, why it matters, how to install, the first workflow, then decide whether to productize it or keep it as your own leverage.
- **"SIP Live."** Stream the X timeline and call each post "sip or skip", taking chat questions at both ends.
- **Show notes template.** One-paragraph hook, links, timestamps, "Key Points" bullets, numbered section summaries, a lead-magnet short link, and a cross-sell block.

### Voice and volume (Nicolas Cole on SIP, 09-21)

- A point of view is the moat.
- Content comes in three tiers: commodity ("you should…"), personality ("I did…") and original. Push toward personality and original.
- Your life story is "the unmade data set": write it down so AI can remix *your* approved language.
- Voice comes down to 3 dials: word choice, sentence length and structure, and citation habits.
- The baseline is **about 5 posts a day**, because volume is the infrastructure. Weigh timely against timeless before writing.

### Suggested weekly cadence for Edidiong

| Day | Format | Topic |
|---|---|---|
| Mon | Mega-list | African AI opportunities, or "things normal in Lagos in 3 years" |
| Tue | Launch explainer thread plus a YouTube explainer | Whatever shipped this week, with ideas for Africa |
| Wed | Client or friend case study with a video | "My client in Uyo…" plus the numbers |
| Thu | Framework or artifact post | 5-part test, `.md` template, pricing-against-the-human math |
| Fri | Build in public | This company's revenue, x402 receipts on Celo, what broke, the rulebook entries |
| Sat | "Sip or skip" X Space or stream | The week's AI and crypto news for Africa |
| Monthly | Long X Article | e.g. "AI-native services in Africa: the $XB opportunity" |
| Daily | 3–5 short posts | Personality and original tier |

---

## 7. What Greg said about Jev

### The thread (2026-09-18 18:41 UTC; x.com/gregisenberg/status/2101018750916948237; about 1.5K likes)

- **Hook (verbatim):** "Jev is HERE and this is the CLEAREST explanation of what it is and what NEW businesses it unlocks. (and at the end I'll tell you how to get Jev even if you're on the waitlist)"
- **WHAT IT IS.**
  - The inbox analogy: "You know how you open your inbox and have to decide what's junk, what needs a reply, and what can wait…"
  - Jev doesn't talk; it decides. You hand it something (an email, a tweet, a support ticket) plus the possible answers, and it returns a probability for each answer in about a tenth to two-tenths of a second: "this is junk, I'm 94% sure."
  - It sorted **1,700 emails for 18 cents**.
  - Answers are typed: a **Choice** (one of up to 255 options), a **Score** (a place on a defined scale), or yes/no ("noul").
  - "Jev is the sorting part of a job, and a great many jobs are exactly that."
- **Businesses it unlocks** (paraphrased and partly quoted):
  - **Instant quotes** that are actually instant.
  - **Form-submission scoring**: "Score every submission and send the real ones straight to the owner's phone."
  - **Support triage** for companies with no support team: "The ticket gets classified and routed before anyone opens it."
  - **Clipping tools**: "Pass in a transcript, get the best moments scored in three seconds."
  - **Application piles**: "Grants, permits, insurance claims, job apps, loan docs. Someone reads that stack one item at a time today."
  - **Marketplace matching**: "Someone types what they need and gets matched to the right local business instantly instead of waiting for callbacks."
  - **Fast browser agents**: "pulling quotes from five carriers, filing the same form for 200 clients, checking supplier inventory in real time."
- **TLDR:** "find an expensive queue and put Jev at the front of it."
- **How to get it:** skip the waitlist by calling it through the **Vercel AI Gateway**.

### The episode "Jev is HERE. How to use it" (2026-09-18, with Ryan Vogel; YouTube 4mTLpuQpB80)

- **Greg's frame is the "AI traffic cop."** Information comes in and Jev decides what it is, how important it is, and what happens next:
  - high-confidence leads go to a human;
  - medium scores go to automation or an LLM;
  - low scores are ignored.
- **The demos:**
  - the email run: 1,701 emails, about $0.18, 4.3M input and 0.5M output tokens;
  - lead scoring from 0 to 1 on a design agency's contact form;
  - support routing;
  - a video clipper built in about 10 minutes that scores 17 moments in about 3 seconds;
  - Browser Use picking a Zurich-to-London flight in 7.1 seconds.
- **The startup angle.** Local-services matching ("I need my driveway power washed" matched to the best nearby business) and truly instant quotes.
- **Limits.** A buy/hold/sell Bitcoin test lost money. Keep Jev in an **advisory role** and "keep it away from your portfolio." A $5 credit lasted two days of heavy use.
- **Getting started.** Use the Vercel Gateway, and "ask your AI agent which of your daily workflows could use a decision maker like Jev."

### The follow-up (2026-09-19 12:17 UTC; status/2101284640828915995; about 24K views, 499 bookmarks)

"10 Jev native products I'd build, ranked by how much fast, cheap decisions change the product:"
1. **Agent spend firewall.** "Before every purchase, Jev returns approve/review/deny plus a confidence score based on price, vendor, user rules and purchase history."
2. **Self-healing tool calls.** When an API errors, Jev decides in milliseconds whether to retry, change parameters or escalate.
3. Remaining items, per secondary summaries (the full list was not retrieved): dynamic permissions, confidence-based human queues, branch pruning, purchase approvals, retry and permission decisions.

### Facts about Jev and TypeSafe (non-Greg; secondary sources)

- TypeSafe AI opened early access on **2026-09-15**, reportedly after 2 years in stealth and a $40M seed led by DCVC.
- **Price:** $0.042 per 1M input tokens; output is free.
- **Availability:** Vercel AI Gateway (called its fastest-adopted model; free promotion Sep 19–25), Cloudflare, and OpenRouter's alpha `decisions` endpoint. Integrations with LangChain and Langfuse.
- **Question types:** `noul` (yes/no probability), `choice` (probabilities that sum to 1), `score` (a rubric level).
- **OpenJev** is an **independent** open-source server compatible with Jev's wire protocol (github.com/razorback16/openjev). It runs on DiffusionGemma under Apache-2.0 via vLLM or MLX, needs a GPU with 24GB+, and is not affiliated with TypeSafe.

### How we use Jev

- **At the front of SME inbound** (WhatsApp, IG and web forms): serious buyers go to the owner's phone and price-checkers go to an auto-reply. See idea #28.
- **Application and grant piles** for foundations and NGOs. See ideas #5 and #4.
- **The x402 spend firewall on Celo.** See idea #18.
- **A router in our own service engine**, so an expensive LLM call is made only when Jev says the case is hard. This protects margins.
- **OpenJev** as a local fallback for sensitive client data.
- **Caveat.** Treat Jev as an advisor behind our rulebook and the human review layer, not as the final judge. See Unverified notes on accuracy.

---

## 8. Agent-payable APIs and agentic commerce: what Greg said, and what it means for our Celo/x402 infrastructure

### Greg's statements, in order

- **05-13.** "The new buyer on the internet is an AI agent… billions of new customers… with money to spend but they only shop via MCP."
- **06-02 (episode "The Next $100B Market: Selling to AI Agents").**
  - The agent buying journey: discover, evaluate, pay, use tools, recommend.
  - What agents need:
    - identity;
    - tools (APIs, MCP);
    - an inbox (AgentMail, YC);
    - memory;
    - a **wallet** (Stripe's agent wallet: spend caps, approval rules, shared payment tokens, audit trail);
    - **receipts**.
  - The trust analogy: "As your employee gains trust, you might give them a credit card and then you might increase that limit."
  - His rapid-fire ideas:
    - an Agent SEO agency;
    - identity and permissions;
    - receipts and audit trails;
    - an agent-ready docs generator;
    - agent inbox security;
    - **agent-readable pricing pages as a service**;
    - **MCP servers for franchises**;
    - an agent support desk;
    - a sandbox for agents to test SaaS.
- **07-06 ("Build startups for agents," 21 items, verbatim source).**
  - #2 spend controls, "Ramp for agents."
  - #6 track records.
  - #7 a permission layer proving authority to spend.
  - #8 "Escrow for machines. Money that only releases when the job is actually verified done."
  - #10 a court for machines.
  - #11 "Virtual cards for agents, spun up and killed on demand."
  - #12 reliable high-throughput access.
  - #13 an agent-to-agent negotiation protocol.
  - #14 liability and insurance.
  - #16 machines with wallets.
  - #20 "Agents will start subscribing to other agents… Recurring revenue, machine to machine."
  - #21 "fiverr for machines."
- **07-13 (article).** "Agent infrastructure. Payments they can use, memory they can trust, identity they can prove. Eleven people are working on this." "A few thousand MCP servers exist today. There are 30 million businesses in America. Almost none of them are connected."
- **07-21.** "A shadow economy is forming where agents pay, hire, and vouch for other agents"; "The Yelp for agents. The escrow for machines. Wide open."
- **07-31.** #2 "build for agents that need to spend money (they're getting virtual cards and budgets, someone builds the spend controls, fraud protection, receipts)." #17 "agents hiring agents… needs escrow, reputation, and dispute resolution for machines." #11 seat pricing collapses into per-outcome billing.
- **08-10 (Cloudflare episode).**
  - The product pieces: AI Crawl Control; **Pay per Crawl** (a 402 Payment Required response with a price, or a declared payment intent); and the **Monetization Gateway**, which charges for any resource behind Cloudflare (web pages, datasets, APIs, **MCP tool calls**). The gateway is on a waitlist as of the episode.
  - The rail is **x402**, verified at Cloudflare's edge. Cloudflare says it settles in stablecoins; Greg did not say so.
  - "Basically, a request itself becomes the transaction."
  - "A machine doesn't care if the payment is tiny and automatic."
  - Pricing per lookup, per successful call, per answer, per comparison.
  - The five-layer stack: messy internet, cleaned data, agent-readable access, payment rules (free, paid or blocked), trust and analytics.
  - The one question: **"What resource does an agent need badly enough and often enough and reliably enough to pay for?"**
  - "You don't have to wait": sell the human version now and be early when the rails mature.
- **08-23.** "AX is the new UX… Stripe just paid $8B for OpenRouter betting the main user of the internet is an agent."
- **08-26.** WebMCP: "websites with agent buttons"; SEO, then AEO, then agents finishing the job. His "building blocks business": "the clean API or data source that agents call 1000 times a day, and get paid per call instead of per user."
- **09-07.** Niche crowd-sourced datasets (LevelsFYI-style) as a moat: "contributors feed it, agents pay per query," with free, pro and API tiers. Summary only; the URL was not captured.
- **09-11.** The OpenAI Agents API is "the AWS moment for agents": the infrastructure is rentable, so own the workflow.
- **09-12.** Among "the only businesses left": proprietary datasets, and "marketplaces and social networks (for people and agents)."
- **09-15.** Gemini 3.8 Live means vertical SaaS needs a **voice front door**.
- **09-18 (Muse).**
  - "We're witnessing the agentification of consumer apps."
  - "Whoever you connect to becomes your new landlord, so pick carefully."
  - Opportunity map: agent-native APIs, connector agencies, SEO for agents, identity and reliability infrastructure, vertical connector marketplaces.
  - "Humans choosing apps" becomes "agents choosing businesses."
  - Every business will need an agent strategy.
- **09-19.** The Jev agent spend firewall.
- **09-21.** "Email, phone numbers, and marketplaces are about to get destroyed… every inbox, phone line, marketplace… gets hit by millions of agents at once."
- **09-24 (Muse episode).**
  - A connector sits at the step "where someone needs a business that can deliver and money changes hands."
  - Walk-through: a studio booking approved at $160.
  - Duffel's Muse integration has passed $1B in annual transaction value (per Greg).
  - The review form accepts an API or an existing MCP server.
  - Custom connectors for testing.

### Context (not from Greg)

- Meta opened the Muse connector platform on Sep 18 and received 1,500+ applications within a week. Launch partners included the Shopify catalog, Walmart and Best Buy, with Shop Pay and PayPal for payments.
- Amazon blocked Muse's shopping agent, the first big platform friction over agent access.
- The x402 coalition includes Google, Visa, AWS, Circle, Anthropic and Vercel. It is reported at 100M+ transactions and about $600M annualized volume by March 2026.
- Cloudflare ships a free Agent Readiness score at isitagentready.com (Apr 2026).
- **Greg has never mentioned Celo**, and I found no Celo reference in his content. His x402 content is all through Cloudflare.

### Implications for our infrastructure

1. **Position our Celo x402 APIs as "tiny paid doors."** Start with resources agents need *often*:
   - Nigerian and African market prices (#17);
   - registry and compliance lookups (#12, #21);
   - venue and hospitality data (#16);
   - grant and opportunity fit scores (#5).

   Price per lookup or answer at $0.001–0.05, with free tiers for distribution.
2. **Crawl, walk, run.** A manual report and a human-sold subscription pay the bills now. The same data powers an x402 endpoint and an MCP tool for agents. This is Greg's exact path.
3. **Sell the trust layer, which is our DevRel edge.** Spend firewall (#18), escrow and receipts (#19) and reputation (#20) are what Greg keeps saying are "wide open." Use Jev for fast approve/review/deny decisions.
4. **List everywhere agents look.** An MCP server wrapping the x402 endpoints, llms.txt, WebMCP tools on client sites, a Muse connector for one Lagos vertical (#22), and x402 discovery directories (verify Celo support).
5. **Handle the "agents don't have wallets" objection** with Greg's credit-card analogy (limits rise as trust grows) and with MiniPay's retail stablecoin reach in Nigeria, Ghana and Kenya.
6. **Make SME clients agent-ready** (#1, #2). The agent-traffic flood Greg describes (09-21) arrives at their WhatsApp numbers and websites first.

---

## Appendix: Jul–Sep 2026 episodes and key posts

| Date | Type | Title / hook | Takeaway |
|---|---|---|---|
| 07-01 | Ep + post | "AI Agents are the new SaaS" / "If I was starting a new company today…" | The product is the job; paycheck workflows; minimum viable agent; the wrapper creates trust; sell the pilot like labor; a 30-day plan |
| 07-06 | Post | "Build startups for agents" | 21 agent-infrastructure ideas (section 8) |
| 07-09/10 | Eps | GPT 5.6 Sol; "Grok 4.5 is a bigger deal than Fable 5" | Model chaining for cost (about $2.49 vs about $12 per task) |
| 07-13 | Article + ep | "How I'd make $10M with AI agents"; "Making $$$ with Loop Engineering" | Minimum viable agent, eval gym, iMessage products, empty new OS; business loops = task + objective metric + stop condition |
| 07-15 | Ep | "$1,000/hour Solo AI business" (Corey Ganim) | $999 assessment tripwire; 7 zero-audience channels |
| 07-20 | Ep | "FDE: the $1M/Year AI job" | Audit, evals, deploy; free audit then paid on value |
| 07-21 | Post | "So let me get this straight…" | 20 shifts; margins "stupid" |
| 07-24 | Ep | "Most valuable skill of 2026: managing AI agents" | Cloud agents, automations, software factory |
| 07-27/08-05 | Eps | Marketing agents (Cody Schneider) | Ads agent loop; signal-based outbound for about $200/mo |
| 07-27 | Post | M&A for AI startups | PE dry powder; profit over growth |
| 07-29 | SIP Live | "Software is dead?" | The unfair advantage moved to distribution and niche depth |
| 07-31 | Post | "The biggest opportunities right now" | 26 opportunities (top post) |
| 08-02 | Post | `what_the_market_is_telling_us.md` | A daily behavior-change file for PMF |
| 08-03 | Ep | Graph engineering | Structuring agent context |
| 08-10 | Ep + post | "Cloudflare will make 1000+ AI millionaires" | x402 and pay-per-request; 3 ideas; 5 filters |
| 08-12/13 | Ep + post | Allie K. Miller's 34-agent workforce | "Do smart things"; AI chief of staff; "build the factory before the product" |
| 08-14/16 | Posts | 5-part agent test; running list of agent ideas | Judgment in the middle; growth agents (onboarding rescue, pricing-page bounce…) |
| 08-19 | Ep | Skillsmaxxing | Skills repo as plugin with auto-update; thick skills, thin agents |
| 08-21 | Ep + post | Grok Bot (Billy's newsletter) | One non-technical person plus an agent team; 4-week framework; newsletters, Shopify, directories |
| 08-23 | Post | "AX is the new UX" | Stripe and OpenRouter |
| 08-25 | SIP Live | With Jonathan Courtney | "Make your company legible"; support is eating engineering; human support as a premium |
| 08-26 | Ep + posts | WebMCP; "MOST asymmetric window" | Conversion agency plus mystery shopper; 5 plays |
| 08-30 | Post | Inbox agents kill cold email | Warm intros and being interesting win |
| 08-31 | Ep | Marketing engineer | Growth OS repo; 6 systems; $5–30k/mo embeds; 30-day plan |
| 09-02 | Ep + post | 5 GitHub repos; customs refund agents | Install, one workflow, then productize; contingency refunds |
| 09-04/10 | Post + ep | 9 GPT-6 Astra prompts; Astra with Ras Mic | "Turn an agency into software ($500–5,000/mo)"; vibe manufacturing |
| 09-08 | Ep | Local AI | Hybrid architecture; 3 local-AI service ideas |
| 09-11/12 | Posts | "AWS moment for agents"; "only businesses left to build" | Own one painful workflow; 13 categories |
| 09-14 | Ep | Software factory (Ras Mic) | Isolate, build, prove, ship; markdown skills |
| 09-15 | Ep + post | Instinct AI (iMessage agent); voice front doors | Spend-limited virtual cards; trusted-person agent network |
| 09-18/19 | Ep + posts | Jev | Section 7 |
| 09-20 | Article | AI-native services, $100B | Already known to us |
| 09-21 | Ep + post | "$30M Writer" (Nicolas Cole); "email, phones, marketplaces destroyed" | Voice and volume; agent flood |
| 09-23 | Ep | "$3,000/Day Solo AI business with Astra + Upwork" | Most likely the promised AI-native-services deep-dive |
| 09-24 | Ep + post | Muse connectors, "App Store moment" | 4 connector ideas; 4 growth routes |

---

## Sources (URLs)

**Greg's own posts and articles**
- https://x.com/gregisenberg/article/2101760050108797268 (AI-native services, 2026-09-20). Full text via https://github.com/splitwireml/second_brain/blob/main/raw/articles/xarticle-ai-native-services-a-100b-opportunity-2101760050108797268.md
- https://x.com/gregisenberg/status/2101018750916948237 (Jev explainer, 09-18)
- https://x.com/gregisenberg/status/2101284640828915995 (10 Jev-native products, 09-19)
- https://x.com/gregisenberg/status/2101097826730017111 (Muse connectors take, 09-18)
- https://x.com/gregisenberg/status/2103198565065523426 (Muse "App Store moment", 09-24)
- https://x.com/gregisenberg/status/2102007062372769877 (email, phones, marketplaces destroyed, 09-21)
- https://x.com/gregisenberg/status/2099924264988324043 (voice front door, 09-15)
- https://x.com/gregisenberg/status/2098755584568828177 (only businesses left to build, 09-12)
- https://x.com/gregisenberg/status/2098396069583319070 (AWS moment for agents, 09-11)
- https://x.com/gregisenberg/status/2095854071580156338 (9 Astra prompts, 09-04)
- https://x.com/gregisenberg/status/2095172474451190045 (customs refund agents, 09-02)
- https://x.com/gregisenberg/status/2094121629840289894 (inbox agents vs cold email, 08-30)
- https://x.com/gregisenberg/status/2094518013068484826 (marketing engineer, 08-31)
- https://x.com/gregisenberg/status/2092699140803211682 (WebMCP, 08-26)
- https://x.com/gregisenberg/status/2092665799332745220 (MOST asymmetric window, 08-26)
- https://x.com/gregisenberg/status/2091600846857416973 (AX is the new UX, 08-23)
- https://x.com/gregisenberg/status/2090901863814017300 (Grok Bot, 08-21)
- https://x.com/gregisenberg/status/2088988857417044432 (running list of agent ideas, 08-16)
- https://x.com/gregisenberg/status/2088402134190399520 (5-part agent test, 08-14)
- https://x.com/gregisenberg/status/2086881493641568698 (Cloudflare, 08-10)
- https://x.com/gregisenberg/status/2086534549341610457 (23 ways to use agents, 08-09)
- https://x.com/gregisenberg/status/2083954605533065561 (what_the_market_is_telling_us.md, 08-02)
- https://x.com/gregisenberg/status/2083175325098266931 (biggest opportunities, 07-31)
- https://x.com/gregisenberg/status/2081761054128816414 (M&A, 07-27)
- https://x.com/gregisenberg/status/2080360929535853032 (16 things normal in 3 years, 07-23)
- https://x.com/gregisenberg/status/2079555200444944811 (So let me get this straight, 07-21)
- https://x.com/gregisenberg/status/2079279140113416539 (FDE, 07-20)
- https://x.com/gregisenberg/status/2077471201002185195 (Corey Ganim, 07-15)
- https://x.com/gregisenberg/status/2076733920834371585 (How I'd make $10M with AI agents, 07-13). Full text via https://github.com/splitwireml/second_brain
- https://x.com/gregisenberg/status/2074287887466582072 (computer reinvented, 07-07)
- https://x.com/gregisenberg/status/2074127490109350221 (Build startups for agents, 07-06)
- https://x.com/gregisenberg/status/2072426075095736488 (agent business, 07-01)
- https://x.com/gregisenberg/status/2070918939526205494 (context layer, 06-27)
- https://x.com/gregisenberg/status/2064054350859649114 (Theo Tabah summary, 06-08)
- https://x.com/gregisenberg/status/2054584280848769413 (30+ observations on agents, 05-13)
- https://x.com/gregisenberg/article/2053843542020063489 (The truth about being AI native, 05-11). Full text via https://github.com/icaruschan/Idea-Scout (X-Creators-2026-All-Native-Articles-Full.md)
- https://x.com/gregisenberg/status/2041865199485936018 ($10M+ software exit via productized agency, 04-08)
- https://x.com/gregisenberg/status/2039421756457484432 (ambient businesses, 04-01)
- https://x.com/gregisenberg/status/2038706332119797894 (7 distribution strategies, 03-30)
- https://x.com/gregisenberg/article/2023769860690383065 (skill era, 02-17)
- https://x.com/gregisenberg/status/1787482466212610384 (Late Checkout holdco playbook, 2024-05-06)

**Podcast episodes (YouTube IDs)**

| Episode | URL |
|---|---|
| Muse, 09-24 | https://www.youtube.com/watch?v=84q4WA3kA8Q |
| $3,000/Day, 09-23 | https://www.youtube.com/watch?v=e7s7jRgHWsg |
| $30M Writer, 09-21 | https://www.youtube.com/watch?v=YuOSyRj3sXg |
| Jev, 09-18 | https://www.youtube.com/watch?v=4mTLpuQpB80 |
| Instinct, 09-15 | https://www.youtube.com/watch?v=mUAsaprJ66s |
| Software Factory, 09-14 | https://www.youtube.com/watch?v=_LCeJZFIsd4 |
| Astra, 09-10 | https://www.youtube.com/watch?v=nglqTHwuZ-8 |
| Local AI, 09-08 | https://www.youtube.com/watch?v=UtFo1ZNC2ns |
| 5 GitHub repos, 09-02 | https://www.youtube.com/watch?v=9_SZFIW7tus |
| Marketing Engineer, 08-31 | https://www.youtube.com/watch?v=8ZC1G1ezN5o |
| WebMCP, 08-26 | https://www.youtube.com/watch?v=EoNH3Tn8wYE |
| Grok Bot, 08-21 | https://www.youtube.com/watch?v=qQluNEfSVHk |
| Skillsmaxxing, 08-19 | https://www.youtube.com/watch?v=xHsftiyT9pQ |
| Allie K. Miller, 08-12 | https://www.youtube.com/watch?v=EzQAgnjTq2k |
| Cloudflare, 08-10 | https://www.youtube.com/watch?v=MNNfat_QP0E |
| Marketing agents, 08-05 | https://www.youtube.com/watch?v=mD7JpNHLT70 |
| Software is dead (SIP Live), 07-29 | https://www.youtube.com/watch?v=Uslb-G2pc5I |
| FDE, 07-20 | https://www.youtube.com/watch?v=zXysLUTLjw4 |
| $1,000/hour, 07-15 | https://www.youtube.com/watch?v=dhbcVxYhWaQ |
| AI Agents are the new SaaS, 07-01 | https://www.youtube.com/watch?v=83fWzQSWB10 |
| Become AI Native, 06-08 | https://www.youtube.com/watch?v=LztPaNmcWGU |
| Selling to AI Agents, 06-02 | https://www.youtube.com/watch?v=MlptIfpoLlw |
| Stop Vibe Coding, 03-30 | https://www.youtube.com/watch?v=YeoGehNsrLc |

**Sites and products**
- https://www.gregisenberg.com/ (and /ai-agents, /directory, /6tools, /startup-blueprint, /30startupideas, /growth-guides, /obsidian-codes, /fable5, /ai-startup, /about-me, /blog)
- https://gregisenberg.kit.com/ and https://latecheckout.substack.com/
- https://www.ideabrowser.com/ (/database, /features?feature=greg%27s-picks, /workshop/build-a-business-in-ai-world-may-7)
- https://www.producthunt.com/products/ideabrowser-com
- https://preuve.ai/compare/ideabrowser
- https://latecheckout.agency/ and https://www.thevibemarketer.com/

**Mirrors, notes and analysis used (GitHub)**
- https://github.com/ZacSadan/podcasts-summary (show notes of 10 Aug–Sep 2026 episodes, data/transcripts/)
- https://github.com/dimthink/awesome-ai-podcast-notes/tree/main/channels/greg-isenberg (75 episode notes, Chinese)
- https://github.com/jenslaufer/field-notes/tree/main/greg-isenberg (English notes, marketing-playbook.md, business-opportunities.md, Cloudflare vendor verification)
- https://github.com/ham-zax/X-automation (docs/research/x_creator_phase2/corpus_v4/main/gregisenberg.jsonl: full-text posts with engagement)
- https://github.com/hornof/llm-wiki (sources/gregisenberg-*.md, concepts/ai-native-service-companies.md, topics/domain-specific-harness.md)
- https://github.com/vibewatch/vibewatch.github.io (docs/twitter/ai-agent/2026-09-19.md, 2026-07-31.md; docs/youtube/ai/2026-06-02.md)
- https://github.com/clawdbotatg/clawd-morning-update (docs/2026-09-19.html, 2026-09-21.html)
- https://github.com/feraranas/x-following-digests (digests/2026-09-07.md, 2026-09-15.md)
- https://github.com/lafollett-labs/typesafe-jev-dojo/blob/main/docs/jev-research-dossier.md
- https://github.com/razorback16/openjev
- https://github.com/skillselion/ideaelion (docs/research/competitor-teardown.md)

**Jev, Muse, Cloudflare and x402 context**
- https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway
- https://vercel.com/ai-gateway/models/jev
- https://startupfortune.com/typesafe-ais-decision-model-jev-becomes-vercels-fastest-adopted-launch/
- https://www.tomshardware.com/tech-industry/artificial-intelligence/typesafe-ais-jev-offers-an-alternative-to-llms-that-claims-to-be-193x-faster-and-445x-cheaper-system-one-type-model-is-bespoke-for-probabilistic-decision-making
- https://techcrunch.com/2026/09/23/everything-new-coming-to-metas-ai-agent-muse/
- https://techcrunch.com/2026/09/25/meta-opens-early-access-program-for-new-muse-features/
- https://www.x402.org/
- https://www.coinbase.com/developer-platform/discover/launches/google_x402

---

## Unverified notes

- **Access.** No primary page (x.com, gregisenberg.com, ideabrowser.com, typesafe.ai, podcast hosts) could be fetched. Quotes come from GitHub mirrors of full tweet and article text, and from search summaries. Mirrors can contain transcription errors; for example, speech recognition rendered x402 as "X42" and ideabrowser as "ideabser"/"IdeaSeer".
- **The Jev thread.** The exact full text was not retrieved. The WHAT IT IS, businesses and TLDR sections are rebuilt from several search snippets and are close to verbatim but not guaranteed. The "10 Jev-native products" list is only partly recovered (items 1–2 verbatim or near-verbatim; the rest from third-party summaries).
- **The "OpenJev" claim.** One search summary said Greg "open-sourced Jev as OpenJev (runs on a GTX1650)." This looks false. OpenJev is an independent community project, not affiliated with TypeSafe, and needs far more GPU than a GTX 1650.
- **Jev's performance.**
  - TypeSafe's own chart reportedly puts Jev at about 68% accuracy, below frontier models at about 70–73%.
  - "Zero hallucination" refers to schema-valid output, not correct answers.
  - The ~200ms claim became an average of 431ms (p95 about 1.1s) on the real email run.
  - The launch date, funding ($40M seed, DCVC) and Vercel adoption claims come from secondary articles.
- **The follow-up episode.** That Sep 23 ("$3,000/Day Solo AI business") is the podcast deep-dive promised in the Sep 20 article is my inference from timing and topic. Greg's show notes call it a solo episode on "AI-native service firms."
- **Greg's own figures are unsourced.** Harvey, EvenUp and Kick revenue; $4.6T US services spend; "$100B up for grabs"; "~1,000 AI-native companies"; the $8B Stripe–OpenRouter deal; Duffel's $1B+ connector transaction value; Muse at #1 in the App Store. All are his claims, not verified here.
- **Muse context** (1,500+ applications, partner list, Amazon blocking it) comes from TechCrunch and wiki summaries. That OpenAI is integrating WebMCP into ChatGPT comes from a retweet by Greg's guest (@hot_town, 08-26).
- **The 09-07 dataset post.** "Crowd-sourced datasets, agents pay per query" comes from a third-party digest summary. The tweet URL was not captured.
- **Ideabrowser.** Pricing, the 11-section structure, the price history and MCP scope come from competitor or third-party sources (preuve.ai, ideagrape, swipefile, n8n) plus Greg's 08-02 mention of "Ideabrowser MCP." A GitHub doc's "~$1M ARR trajectory" figure is unverified.
- **Reach numbers.** Newsletter subscribers (158,485+) are from a homepage search snippet. X followers (about 705K) were observed on 2026-09-03 by a scraper. YouTube subscriber count is not verified.
- **The Late Checkout "8-figure" claim** is Greg's own (May 2024).
- **Nigerian price anchors** in section 4 are my estimates, not Greg's.
- **Nigerian regulatory "why now" items need checking before use in sales copy:**
  - the 2025 tax laws in force from 2026;
  - NHIA Act 2022 coverage;
  - the regulator's current order on estimated electricity billing;
  - corporate-registry annual-returns enforcement;
  - customs digital-clearance rollout;
  - whether an accredited registry agent is required.
- **Celo payments.** x402 settlement on Celo, facilitator availability and discovery-directory support were not verified here. Greg never mentions Celo.
- **The engagement analysis in section 6** uses 100 posts (Jun 20 – Sep 3, 2026) from one scraper corpus. Treat the medians as directional.
