# Agent-tool gateways: Monid, the comparables, and approval as a service

*As of 2026-10-07. Prepared for Edidiong Umana. The question: "how do we offer our services just like monid.ai, but as a GTM harness?" This note is the research; the plan built on it is `company/gtm/gtm-api.md`. Read it with `research/gtm-harnesses.md` (the market for GTM harnesses) and `research/agent-payments.md` (x402).*

## How to read the tags

| Tag | Meaning |
|---|---|
| **[fetched]** | We read the primary text: a cloned repository, an installed npm package, or registry metadata. |
| **[search]** | A search-result snippet only; the page itself wasn't opened. |
| **[repo]** | A file in this repository. |
| **[unverified]** | Not confirmed; listed at the end. |

## Limits

- **Blocked:**
  - monid.ai and docs.monid.ai refused the connection, so Monid's agent skill was read from the copy in its CLI repo.
  - github.com web pages returned 403.
  - docs.cdp.coinbase.com was egress-blocked and not retried.
  - The npm downloads API returned 403.
  - The comparables' sites weren't opened, so their rows are [search].
- **Worked:** `git clone`, the npm registry, PyPI, and the packages installed in this repo.
- **Scoped:** the GitHub API reaches only this session's repos. Monid's repos were found by probing names: `monid` (also served as `connectors`), `cli`, `skills`, `plugins` and `awesome-monid`.
- **Not done:** no account, no key, no paid call, no contact with any vendor, nothing posted. Monid's live API was never called; its x402 behaviour comes from a third party's recorded captures.

## 1. Monid, as it really works

**What's public.**

- `monid` is only the connector layer: declarative, MIT-licensed files describing each vendor's endpoints, auth and usage ([fetched](https://github.com/monid-ai/monid/blob/main/README.md)).
- At commit c57aa3d (28 Sep) it holds **32 providers and 699 endpoints** by our count. The README claims "2,000+ tools across 72+ providers".
- The rest sits in a private v1, `monid-services`, which is being ported ([fetched](https://github.com/monid-ai/monid/blob/main/openspec/changes/add-async-run-protocol/proposal.md)).

**How agents find and call tools.** Discovery and inspection are free; only runs are paid ([fetched](https://github.com/monid-ai/monid/blob/main/README.md)).

- **REST:** `api.monid.ai/v1/discover`, `/inspect`, `/run`, `/runs/{id}` and `/wallet/balance` ([fetched](https://github.com/monid-ai/cli/blob/main/src/api/client.ts)).
- **CLI:** `@monid-ai/cli`, first published 6 Apr 2026. There is no other SDK on npm or PyPI ([fetched](https://www.npmjs.com/package/@monid-ai/cli)).
- **Remote MCP** at `mcp.monid.ai/v1` ([fetched](https://github.com/monid-ai/plugins/blob/main/README.md)):
  - OAuth, with "no API key to paste";
  - 13 tools, of which only `monid_run` spends;
  - one plugin repo for Claude Code, Cursor, Codex and others;
  - an MCP-registry manifest.
- **A `SKILL.md`** agents fetch from monid.ai. It says to run discovery "before writing a scraper", but to use the user's own tools first, because "Monid runs spend the user's Monid balance" ([fetched](https://github.com/monid-ai/cli/blob/main/skills/monid/SKILL.md)).
- **Discovery** returns each endpoint's price, measured health, p50 and p95 run times, and hints.

**Auth, balance and metering.**

- **Key and balance:** a bearer key per workspace and a prepaid USD balance, funded "in the dashboard" ([fetched](https://github.com/monid-ai/skills/blob/main/templates/prerequisites.md)). On this rail, HTTP 402 means "insufficient balance", not x402 ([fetched](https://github.com/monid-ai/cli/blob/main/src/api/client.ts)).
- **Controls:** a budget per period and a cap per run. A breach ends the run as `BLOCKED`, with the control's snapshot ([fetched](https://github.com/monid-ai/cli/blob/main/src/api/types.ts)).
- **Metering:** the service holds estimate × rate card, then settles on units counted from the raw response. "Vendor non-2xx is DATA → zero usage" ([fetched](https://github.com/monid-ai/monid/blob/main/openspec/changes/add-async-run-protocol/design.md)).
- **Results:** each run returns its price and cost. The CLI's types have no signature field ([fetched](https://github.com/monid-ai/cli/blob/main/src/api/types.ts)).

**The fee.** Rates and markups live in a private "broker card", not in the repo.

- **v1's markups varied:** 2× on Hunter ([fetched](https://github.com/monid-ai/monid/blob/main/openspec/changes/add-connector-hunterio/design.md)) and 50% on Suzanne ([fetched](https://github.com/monid-ai/monid/blob/main/openspec/changes/add-connector-suzanne/design.md)).
- **On the x402 rail**, resold sellers' prices divide by 1.1 into round numbers ([fetched](https://github.com/twzrd-sol/monid-x402/blob/main/evidence/useful-cut-matrix.json)). That fits the reported 10%:
  - Strale: $0.0594 = 1.1 × $0.054;
  - Browserbase: $0.011 = 1.1 × $0.010.
- **Monid's own connectors** sit at a $0.01 floor there. TinyFish, which costs Monid nothing and was free in v1, costs $0.01 ([fetched](https://github.com/monid-ai/monid/blob/main/connectors/tinyfish/provider.ts), [fetched](https://github.com/twzrd-sol/monid-x402/blob/main/evidence/catalog-matrix.json)).
- **"From $0.0013 a call"** is unconfirmed ([search](https://www.kucoin.com/news/flash/monid-raises-7-7m-seed-funding-to-build-agent-tool-platform-with-2500-apis)).

**x402: yes, but not Celo.**

- `POST x402.monid.ai/v1/run` answers an x402 v2 402 for USDC on Base and Monad. Results are read back with Sign-In-With-X.
- An independent developer recorded a paid run that settled $0.01 on Base on 12 Sep ([fetched](https://github.com/twzrd-sol/monid-x402/blob/main/evidence/live-402-context-dev.json), [fetched](https://github.com/twzrd-sol/monid-x402/blob/main/evidence/live-pay-200.json)).
- The host also fronts other x402 sellers (Strale, Browserbase, BlockRun) under Monid's payTo. 31 of 40 probed routes answered 402 ([fetched](https://github.com/twzrd-sol/monid-x402/blob/main/evidence/catalog-matrix.json)).
- This answers the open question in `research/gtm-harnesses.md` §9 [repo]: Monid does take x402, on Base and Monad.

**The catalog for go-to-market** ([fetched](https://github.com/monid-ai/monid/tree/main/connectors)):

- **Search and scraping:** Exa, TinyFish, Firecrawl, context.dev, MrScraper, and 46 Apify actors.
- **People, company and email data:** Apollo, Clay, ContactOut, Hunter, People Data Labs, Orbit, Akta, Fundable.
- **SEO and AI answers:** Ahrefs, DataForSEO, cloro.
- **Messaging:** only Saperly's US SMS, which blocks opted-out recipients at no charge ([fetched](https://github.com/monid-ai/monid/blob/main/connectors/saperly/endpoints/messages/send-messages/endpoint.ts)). No email, WhatsApp or Slack.
- **Against our rulebook:**
  - a LinkedIn actor that takes the user's cookies ([fetched](https://github.com/monid-ai/monid/blob/main/connectors/apify/endpoints/linkedin/linkedin-job-search/schema/inputs.ts));
  - MrScraper's "anti-bot bypass" and "real-device stealth mode" ([fetched](https://github.com/monid-ai/monid/blob/main/connectors/mrscraper/endpoints/scrape-html/endpoint.ts)).

**Traction.**

- **Transactions:** 4M+, by the company's count ([search](https://echai.ventures/feed/we-just-killed-everything-introducing-monid-the-openrouter-for-89)).
- **Funding:** the $7.7M seed rests on the 6–7 Oct reports cited in `research/gtm-harnesses.md` [repo]. Today's searches found only a $2.1M pre-seed ([search](https://www.trysignalbase.com/news/funding/monid-raises-2-1m-pre-seed-for-agent-tool-platform)).
- **Community:** its list includes "GTM Skills", ICP workspaces enriched through Monid under spend caps. It is the closest open analog to our harness ([fetched](https://github.com/monid-ai/awesome-monid/blob/main/data/projects.yaml)).

**Copy:**

- free discovery;
- failures settle at zero;
- a key-and-balance rail beside x402;
- platform-enforced caps;
- the cost in every result;
- remote MCP, CLI and skill shipped from one repo;
- "offer, don't override" the user's own tools.

**Avoid:**

- markups that vary under a "10%" headline;
- per-result billing where limits multiply;
- reselling logged-in or anti-bot scraping;
- records nobody can verify.

## 2. Comparable gateways and marketplaces

| Name | Model and pricing | Discovery | Who holds the tokens or keys |
|---|---|---|---|
| **Composio** | Subscription plus calls. 20k calls a month free; $29 a month; about $0.30 per 1k over the allowance. A reported cut is disputed ([search](https://usagepricing.com/blueprint/activity/composio-2026-08-25-packaging)) | Toolkits, MCP | Composio stores and refreshes them. Your own OAuth app changes the consent screen, not custody ([search](https://docs.composio.dev/docs/security/token-custody)) |
| **Arcade.dev** | $25 a month, plus $0.05 per user consent, $0.01 per standard call and $0.50 per pro call ([search](https://blog.arcade.dev/pricing-updates)) | Catalog, MCP | Arcade, with its OAuth client or yours (`research/gtm-harnesses.md` §4) [repo] |
| **Smithery** | Free registry; hosting reportedly $10–30 a month ([search](https://aitoolsatlas.ai/tools/smithery)). Arcade bought it on 5 Aug, per one source ([search](https://rywalker.com/research/smithery)) | 17,300+ MCP servers ([search](https://rywalker.com/research/smithery)) | Smithery Connect, encrypted ([search](https://smithery.ai/docs/use/connect)) |
| **Toolhouse** | $500 a month for 25k credits per one source; another lists a free tier ([search](https://dailyaifixs.com/blog/toolhouse-pricing-2026-the-credit-and-worker-catch)) | Bundles, MCP | None with third-party sign-in; your own client on Pro ([search](https://docs.toolhouse.ai/toolhouse/authenticate-your-end-users)) |
| **Pipedream Connect** | About $99 a month for 100 end users, then $2 each ([search](https://www.usagepricing.com/blueprint/pipedream)) | 2,500+ APIs ([search](https://pipedream.com/docs/connect)) | Pipedream, now part of Workday ([search](https://pipedream.com/connect)) |
| **x402 Bazaar (CDP)** | A free index; sellers set per-call prices ([search](https://docs.cdp.coinbase.com/x402/bazaar.md)) | 23,000+ resources by CDP's count ([search](https://docs.cdp.coinbase.com/x402/seller/get-discovered)); agentic.market | No accounts. A route is listed after its first paid call through CDP, on Base |
| **Nevermined** | 1–2% of settled volume; credit plans; x402 ([search](https://nevermined.ai/pricing/)) | A catalog assistants pay from ([search](https://nevermined.ai/blog/ai-assistant-can-now-pay-for-things)) | Smart accounts ([search](https://nevermined.ai/docs/development-guide/nevermined-x402.md)) |
| **Payman** | A percentage plus a flat fee per payment ([search](https://dupple.com/reviews/payman)) | None | The owner's caps and approval thresholds |
| **AgentCash (Merit)** | A buyer wallet; its seller router reports $40K from 765K transactions ([search](https://merit.systems/blog/introducing-router)) | x402scan, MPPscan | A USDC wallet behind an MCP server ([search](https://skillselion.com/skills/merit-systems/agentcash-skills/agentcash)) |

**Also relevant:**

- **Orthogonal** (YC W26): from $0.01 a call, on prepaid credits or over x402 ([search](https://ycombinator.com/companies/orthogonal)).
- **Tempo Mercator:** quotes are free, and a job runs only after the buyer approves the exact quote ([search](https://mercator.tempo.xyz/about)).
- **Pay.sh:** USDC on Solana, with each payment approved by Touch ID ([search](https://www.dextools.io/news/solana-google-cloud-pay-sh-ai-agent-usdc-api)).

**What the table says:**

- **Connector platforms** sell access to the user's own apps by subscription, and hold the OAuth tokens.
- **Paid-tool gateways** sell other people's APIs per call, and hold the provider keys.
- **Approval appears only around payments.** None reviews what an agent is about to send.

## 3. Approval as a service

| Service | Mechanics | Price |
|---|---|---|
| **HumanLayer** | A `@require_approval` decorator; Slack or email ([search](https://humanlayer.dev)). Its repo now says the code is "pretty much all deprecated" and points to a rebuild ([fetched](https://github.com/humanlayer/humanlayer/blob/main/README.md)) | Was "from $99/month" ([search](https://bestaiagents.it.com/review/humanlayer/)) |
| **gotoHuman** | Review forms built in its app; requests land in an inbox with notifications, and results return by webhook. It keeps reviews as "an evolving training dataset" ([fetched](https://github.com/gotohuman/gotohuman-mcp-server/blob/main/README.md)) | Not published |
| **Pushary** | Decisions over email, Slack or a phone app | $99 a month for 100k decisions ([search](https://pushary.com/agent-notifications-integration)) |
| **The Handover** | One-click answers by email or Slack | Free tier ([search](https://peerpush.com/p/the-handover)) |
| **Open source** | AgentGate; PraisonAI, with Telegram buttons ([search](https://docs.praison.ai/docs/concepts/approval)) | Free |

**The mechanics are the same everywhere:** the agent asks, a person taps on their phone, and the agent learns the result by webhook or poll.

**The gap:**

- **No proof:** we found no signed receipt a third party can check.
- **No binding:** no approval is tied to a hash of the exact text.
- **No triage:** nothing decides first whether a person is needed at all.

**Shonin already has all three** [repo]:

- Gate decides execute, confirm or escalate.
- The harness binds each approval to the text's hash.
- `signReceipt` signs sorted-key JSON.

x402's Offer & Receipt extension (signed offers on the 402, signed receipts on the 200) ships in the installed `@x402/extensions` 2.27.0 ([fetched](https://www.npmjs.com/package/@x402/extensions)).

**The known failure** is rubber-stamping routine prompts ([search](https://www.withone.ai/blog/agent-approval-fatigue-scope-tools-one-cli)). Gate's job is to send a person only what crosses the bar.

## 4. Unverified

- **Monid:**
  - the $7.7M seed;
  - whether 10% applies on the balance rail;
  - "from $0.0013";
  - how balances are funded;
  - whether a vendor error on x402 still settles;
  - its catalog size;
  - how it onboards outside sellers.
- **Comparables:**
  - the current tiers of Composio, Toolhouse, Smithery and Pipedream;
  - Arcade's purchase of Smithery;
  - the Bazaar's count;
  - Merit's figures.
- **Approvals:** gotoHuman's pricing and HumanLayer's rebuild.
- **Shonin:**
  - the cost of a review answered by Claude, and of a plan (estimates);
  - the stored-value rules for prepaid balances.
