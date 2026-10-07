# GTM harnesses: who else does this, which tools connect, and how "any model" works

*As of 2026-10-07. Prepared for Edidiong Umana, behind `company/gtm/harness-plan.md`. The question: turn Shonin's MIT GTM Harness into a harness founders run their go-to-market in, connected to real tools and working with whichever model they pay for. Three research passes fed it: competitors, connectors and platform rules, and model-agnostic design.*

## How to read the evidence tags

| Tag | Meaning |
|---|---|
| **[fetched]** | We read the primary text: a GitHub repo or page, an npm package's docs, or Vercel's docs through its docs tool. |
| **[search]** | A search result's snippet. The page itself couldn't be opened, so it wasn't checked further. |
| **[repo]** | A file in this repository. |
| **[unverified]** | Couldn't be confirmed; listed in §9. |

**Limits of this research:**

- **Most vendor, press and news sites were blocked.** The egress proxy refused x.com, x.ai, buffer.com, antseed.com, monid.ai, gooseworks.ai, cursor.com, openrouter.ai and vercel.com, among others.
- **So prices, funding rounds and announcements are [search]** unless marked otherwise.
- **What worked:** GitHub, the npm registry and Vercel's docs tool.
- **No vendor was contacted, and nothing was posted.**

## 1. Bottom line

- **Official routes are enough to build on, and the alternatives break the rules.**
  - WhatsApp's Business API sends only to people who opted in, and only templates outside a 24-hour window. Since 15 Jan 2026 it bars general-purpose AI assistants.
  - Automating WhatsApp Web or Telegram Web breaks both platforms' terms, even on the founder's own account at low volume.
  - So the first message on WhatsApp stays the founder's own tap on a `wa.me` link, which the harness already builds.
- **Telegram is the approval console.** Bots can't message a prospect first, but they can carry Approve and Reject to the founder, and they already do.
- **Google:**
  - Gmail drafts need a restricted scope: free for the founder and design partners, and a yearly security assessment ($675–$3,600 at one lab's prices) for a public launch.
  - The pipeline sheet needs only `drive.file`, which isn't sensitive.
- **Slack, X, LinkedIn and Meta allow posting; reading and messaging are gated.**
  - Slack limits history reads for apps outside its Marketplace.
  - LinkedIn's messaging API is partner-only.
  - X charges per post.
- **Headless browsers are for logged-out public pages.** The courts drew the line at logins.
- **No product we profiled combines all five:** approval first, any model, WhatsApp and Telegram, an open workspace and per-unit pricing. We profiled 13. Gooseworks comes closest:
  - MIT-licensed skills;
  - paid credits;
  - an agent you message on WhatsApp or Telegram that "can work autonomously for hours".
- **Approval is a setting in most tools, not the product.**
- **The three names the founder gave:**
  - **Buffer** schedules social posts.
  - **AntSeed** is a peer-to-peer market for AI inference.
  - **Monid** sells paid tools to agents. Its $7.7M seed is real.

  Only Buffer is in go-to-market, and it has no agent, email, WhatsApp or Telegram.
- **"Like Grokbot" is narrower than it sounds.** Musk's 6 Oct post says Grok Bot will route each task to "the best back end model", naming Claude Opus 5.5. It doesn't name GPT, and xAI, not the user, picks the model.
- **Subscriptions don't carry over to hosted products.** Claude plans stopped covering third-party harnesses on 4 Apr 2026 and were only partly restored. A hosted harness takes API keys; a subscription the founder already pays for is used through the free workspace in their own Claude Code or Codex.

## 2. The three names

**Buffer: social scheduling for small brands and creators.**

- **Channels:** Facebook, Instagram, LinkedIn, X, Pinterest, TikTok, YouTube Shorts, Google Business Profile, Threads, Bluesky and Mastodon ([search](https://support.buffer.com/article/564-connecting-your-channels-to-buffer)). No email, WhatsApp, Telegram or CRM.
- **AI:** an uncapped AI Assistant drafts and rewrites posts on every plan ([search](https://buffer.com/pricing)). We found no agent, and the model isn't disclosed.
- **API:** a public GraphQL API since May 2026, with an MCP server and a CLI ([search](https://buffer.com/resources/buffer-api-is-here/)). The MCP's `create_post` publishes at once, so Buffer advises keeping approval prompts on ([search](https://developers.buffer.com/guides/integrations/mcp.html)).
- **Price:**
  - Free for 3 channels.
  - Essentials: $6 per channel a month, or $5 billed yearly.
  - Team, which adds approval workflows: $12, or $10 billed yearly ([search](https://buffer.com/pricing)).
- **Business:** $3.95M raised, and $3.3M spent buying out investors in 2018 ([search](https://buffer.com/resources/buying-out-investors/)). ARR was $25.02M in May 2026 ([search](https://app.dealroom.co/news/note/buffer-crosses-25m-arr-milestone)).
- **For us:** Buffer is a channel, not a rival. A founder's approved posts can go to Buffer's API to be scheduled. Buffer already publishes to 11 networks, so we don't build that.

**AntSeed: not a go-to-market tool.**

- **What it is:** a peer-to-peer market for AI inference, paid in USDC on Base ([fetched](https://github.com/antseed), [fetched](https://github.com/antseed/antseed)).
  - Buyers run a local proxy that replaces `ANTHROPIC_BASE_URL` and routes by price, latency and reputation.
  - Providers sell inference from frontier APIs, local GPUs, TEEs or agents.
  - Its plugins include a TypeSafe System One provider, the same family as the Jev models behind our brain ([fetched](https://github.com/antseed/antseed)).
- **Funding:** a $2.4M token round led by Spark Capital on 6 Oct 2026 ([search](https://cryptorank.io/insights/deals/antseed-private-token-sale-2026-10-06)).
- **Risk:** a reported critical flaw in its deposits contract, demonstrated on Base mainnet, was closed as "not planned" without a reply ([fetched](https://github.com/Antseed/antseed/issues/1086)).
- **For us:** don't route paid traffic through it until that flaw is answered.

**Monid: "OpenRouter for agent tools".**

- **What it is:** one key and a prepaid balance reach 2,000+ endpoints from 72+ providers: search, scraping, enrichment, social data and media generation ([fetched](https://github.com/monid-ai/monid)).
  - Discovery is free and runs are paid.
  - **A vendor error costs nothing.**
  - No Gmail, Slack or messaging.
- **Price:** from about $0.0013 a call, plus 10% over the provider's price ([search](https://www.kucoin.com/news/flash/monid-raises-7-7m-seed-funding-to-build-agent-tool-platform-with-2500-apis)).
- **Funding:**
  - **Seed:** $7.7M, reported on 6–7 Oct 2026 by three outlets ([search](https://cryptobriefing.com/monid-raises-7-7-million-ai-agents-tools/), [search](https://dealroom.co/news/160477-monid-raises-7-7m-seed-to-be-the-checkout-counter-for-ai-agents/), [search](https://techstartups.com/2026/10/07/startup-funding-news-today-october-7-2026-nous-research-monid-multiply-labs-quanfluence-more/)). Only Crypto Briefing names a lead, Long Journey Ventures.
  - **Pre-seed:** $2.1M on 1 Sep 2026 ([search](https://www.trysignalbase.com/news/funding/monid-raises-2-1m-pre-seed-for-agent-tool-platform)).
- **Traction:** 4M+ agent transactions, by the company's own count ([search](https://en.wowtale.net/2026/09/01/234971/)). No named customers.
- **For us:** Monid sells to the same buyers as Shonin Check, Gate and Receipt: agents with a balance. It's a possible place to list those APIs. We haven't confirmed that Monid supports x402.

## 3. Gooseworks and nine more

**Gooseworks** (YC W23; its founders built Athina AI before it ([search](https://www.ycombinator.com/companies/gooseworks))) sells "AI coworkers" for go-to-market.

- **The open part:** an MIT library of 200+ skills for Claude Code, Codex and Cursor. The skills are free; the data API behind them is paid ([fetched](https://github.com/gooseworks-ai/goose-skills)), at 1–10 credits a run ([fetched](https://github.com/gooseworks-ai/gooseworks)).
- **Connectors:** Gmail and HubSpot in one click; LinkedIn through Apify scraping ([search](https://docs.gooseworks.ai/help-center/integrations-and-tools)).
- **Chat:** users message Goose in Slack, WhatsApp, iMessage, Telegram, Claude or ChatGPT ([search](https://gooseworks.ai/)).
- **Autonomy:** Goose has its own inbox and runs scheduled jobs ([search](https://docs.gooseworks.ai/overview/what-is-goose)). No approval default is published.
- **Price:** from $29 a month for 2,000 credits to $299 for 30,000. Chat with Goose starts at $149 ([search](https://gooseworks.ai/)).

The guide the founder shared on 7 Oct describes the same shape: a brain, a creative kit, workflows, research tools and feedback. Our v2 workspace follows it, with approval as the default rather than a setting.

| Tool | Connectors | Approval and autonomy | Models | Price | Funding | Gaps |
|---|---|---|---|---|---|---|
| **Lindy** | Gmail, Slack, HubSpot, 1,000+ apps, MCP ([search](https://www.lindy.ai/)) | A confirm step on write actions; drafted email replies ([search](https://www.lindy.ai/academy-lessons/human-in-the-loop)) | Several | From $29.99 a seat a month for 3,000 credits ([search](https://www.getmacha.com/blog/lindy-ai-pricing-explained)) | About $50M ([search](https://getlatka.com/companies/lindyai)) | Credits burn fast; billing complaints ([search](https://www.usecarly.com/blog/lindy-ai-review/)) |
| **Relevance AI** | Gmail, Slack, HubSpot, LinkedIn, WhatsApp Business ([search](https://relevanceai.com/docs/integrations/popular-integrations/whatsapp)) | Per action: approve, skip, or let the agent decide ([search](https://relevanceai.com/features)) | Several; your own key replaces their model credit ([search](https://relevanceai.com/changelog/see-exactly-what-you-pay-actions-and-vendorcredits)) | Pro $19 a month billed yearly; Team $234 ([search](https://relevanceai.com/docs/get-started/pricing)) | $24M Series B, May 2025 ([search](https://relevanceai.com/blog/the-ai-workforce-revolution-24m-series-b-to-accelerate-our-mission)) | The BDR agent is enterprise-only |
| **Clay** | HubSpot, Salesforce; its own email sequencer ([search](https://www.clay.com/blog/clay-email-sequencer)) | No approval step found | OpenAI, Anthropic, Gemini; your own key | $185 or $495 a month ([search](https://www.cleanlist.ai/blog/2026-03-12-clay-pricing-changes-2026)) | $115M Series D at $7.1B, Sep 2026 ([search](https://www.clay.com/blog/series-d)) | Real cost about 3× list, per a competitor |
| **11x** | Email, LinkedIn, phone, SMS, WhatsApp ([search](https://docs.11x.ai/alice/overview)) | Picks targets and writes copy; no approval mode documented | Undisclosed | $3,750 a month billed yearly ([search](https://docs.11x.ai/help-center/overview/11x-pricing-overview)) | $24M A, $50M B, 2024 | TechCrunch reported unearned customer logos and 70–80% churn, which 11x disputes ([search](https://techcrunch.com/2025/03/24/a16z-and-benchmark-backed-11x-has-been-claiming-customers-it-doesnt-have/)) |
| **Artisan** | Email, LinkedIn, HubSpot | Copilot (you approve) or Autopilot, per campaign ([search](https://help.artisan.co/articles/6218358204-running-ava-on-copilot-vs-autopilot)) | Undisclosed | Free; about $280 and $660 a month | $25M Series A, Apr 2025 | Generic copy and bad data, per a competitor's review |
| **n8n** | 400–1,500+ integrations, including Telegram and the WhatsApp Cloud API ([fetched](https://github.com/n8n-io/n8n)) | Per-tool review in Slack or Telegram ([search](https://docs.n8n.io/advanced-ai/human-in-the-loop-tools/)) | Any major or open model | Free to self-host; cloud from about €20 a month ([search](https://n8n.io/pricing/)) | $180M Series C, Oct 2025 ([search](https://blog.n8n.io/series-c/)) | Fair-code licence; no go-to-market logic |
| **Zapier** | 9,000+ apps | Per action: "Require approval before running" ([search](https://zapier.com/blog/zapier-agents-is-now-ai-by-zapier/)) | About 35 models, or your own key ([search](https://zapier.com/blog/ai-models-on-zapier/)) | $19.99 a month billed yearly, for 750 tasks ([search](https://www.nocode.mba/articles/zapier-pricing-2026)) | Little outside capital | An AI step can cost up to 5 tasks |
| **OpenClaw** (Hermes Agent is similar) | WhatsApp, Telegram, Slack, iMessage and 20+ more ([fetched](https://github.com/openclaw/openclaw)) | Unknown senders must pair; tools run on the host unless sandboxed | Any | Free, MIT | A nonprofit foundation | WhatsApp through the unofficial Baileys library ([fetched](https://github.com/openclaw/openclaw/blob/main/docs/channels/whatsapp.md)); 65,000+ exposed instances ([search](https://www.cyera.com/research/four-new-openclaw-vulnerabilities-when-ai-agents-become-the-attackers-execution-layer)); malicious skills ([search](https://www.firecrawl.dev/blog/secure-openclaw)) |
| **respond.io** | WhatsApp, Telegram, Instagram, Messenger, TikTok ([search](https://respond.io/blog/telegram-support)) | Agents qualify leads, then hand off to people ([search](https://respond.io/faqs/what-can-respondio-ai-agents-handle-and-how-are-they-trained)) | OpenAI, Gemini, Mistral | $79–$279 a month billed yearly, for 1,000 contacts ([search](https://www.getmacha.com/blog/respond-io-pricing-explained)) | $62.5M Series B, Jun 2026 ([search](https://dealroom.co/news/134969-respond-io-raises-62-5m-series-b-led-by-camber-partners/)) | Bills jump after big campaigns ([search](https://www.eesel.ai/blog/respond-io-pricing)) |

**Also checked:**

- Fullcast bought Copy.ai in Oct 2025 ([search](https://www.copy.ai/fullcast-acquires-copy-ai)).
- Darwin AI raised a $4.5M seed for WhatsApp sales agents in Latin America ([search](https://latamlist.com/darwin-ai-raises-4-5m-seed-round-led-by-base10-partners/)).
- AiSensy (India) starts at ₹1,500 a month ([search](https://aisensy.com/pricing)).
- Relay (Ghana) launched a WhatsApp sales platform in June 2026, with no disclosed funding ([search](https://ghanaaisummit.com/news/482)).
- **We found no 2026 funding round for an African WhatsApp sales agent,** so willingness to pay in Lagos or Nairobi is unproven.

## 4. Connectors and platform rules

### WhatsApp Business Platform (the Cloud API)

The Cloud API is the only legitimate way for a business to send on WhatsApp.

| Topic | Finding |
|---|---|
| Messages | Free-form only within 24 hours of the person's last message; otherwise an approved template ([search](https://api.support.vonage.com/hc/en-us/articles/23794423565852-What-is-the-24-Hour-Customer-Care-Window)). Template categories are marketing (the catch-all), utility (the person's own transaction) and authentication ([search](https://chakrahq.com/article/whatsapp-message-template-categories-new-guidelines-from-july-2025/)). Meta can re-categorise a template after approving it ([search](https://support.infobip.com/why-was-my-whatsapp-template-category-changed-after-registration)) |
| Consent | Recipients must opt in to that business, and the opt-in must name it ([search](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in)). So no cold first messages through the API |
| Pricing | Per delivered template since 1 Jul 2025, by the recipient's country ([search](https://docs.gallabox.com/pricing-and-billing-modules/new-per-message-pricing-effective-july-1-2025)). From 1 Oct 2026, service replies and utility messages inside the window are billed too, after 1,000 free service messages a month per number ([search](https://help.trengo.com/article/whatsapp-pricing-changes-from-1-october-2026)) |
| Nigeria | Marketing about $0.052 per message, utility and authentication about $0.0067 ([search](https://app.wali.chat/help/pricing-table)). Nigerian press on the October 2026 rates: about $0.062 and $0.0101, with provider fees on top ([search](https://msmeafricaonline.com/whatsapp-to-charge-businesses-for-customer-replies-from-october-2026/)). The sources disagree (§9) |
| Limits | Set per business portfolio since 7 Oct 2025 ([search](https://cpaas.8x8.com/id/blog/important-update-whatsapp-messaging-limits-changing-october-7-2025/)): 250, then 2,000, 10,000, 100,000 and unlimited unique people per 24 hours ([search](https://learn.doubletick.io/messaging-limit)) |
| Verification | Business verification needs registration documents and a website ([search](https://www.infobip.com/docs/whatsapp/get-started/sender-registration)); sends fail until the display name is approved ([search](https://help2.egrow.com/en/article/whatsapp-business-api-error-131037-display-name-approval)) |
| AI policy | Providers of LLMs or general-purpose assistants may not use the platform when AI is the primary function, as Meta decides ([search](https://www.whatsapp.com/legal/business-solution-terms)). In force for everyone since 15 Jan 2026; a business's own support AI isn't the target ([search](https://techcrunch.com/2025/10/18/whatssapp-changes-its-terms-to-bar-general-purpose-chatbots-from-its-platform/)). Only EEA and Brazil numbers are exempt, so Nigeria is covered. Data from the platform can't train AI ([search](https://www.whatsapp.com/legal/business-solution-terms)) |
| Providers | Twilio adds $0.005 per message ([search](https://www.twilio.com/en-us/whatsapp/pricing)). 360dialog charges about €49 or $49 per number a month and passes Meta's fees through ([search](https://docs.360dialog.com/docs/360dialog/prices-plans-and-payment-options)) |
| The Business app | No API. The legitimate bridge is Coexistence: the same number linked to the Cloud API, syncing about six months of chats ([search](https://docs.360dialog.com/partner/onboarding/whatsapp-coexistence)) |

**For Shonin:**

- The harness never offers a WhatsApp chatbot.
- First contact is the founder writing to a person, by tapping a `wa.me` link ([search](https://bird.com/explained/whatsapp/what-is-a-whatsapp-click-to-chat-link)). That's built ([repo](../packages/gtm-harness/src/outbox.ts)).
- The Cloud API comes later, for people who opted in, sent from the founder's own verified number. A first-contact template will usually count as marketing: about $0.05–$0.06 a message in Nigeria (our inference from the rates above).

### Automating WhatsApp Web

- **The libraries say so themselves.** whatsapp-web.js drives WhatsApp Web through Puppeteer, and its README says "WhatsApp does not allow bots or unofficial clients" ([fetched](https://raw.githubusercontent.com/pedroslopez/whatsapp-web.js/main/README.md)). The Baileys README: "We discourage any stalkerware, bulk or automated messaging usage" ([fetched](https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/README.md)).
- **So do WhatsApp's rules.**
  - The Terms forbid "bulk messaging, auto-messaging, auto-dialing" ([search](https://conductatlas.com/platform/whatsapp/whatsapp-terms-of-service/provision/CA-P-030669/prohibition-on-bulk-and-auto-messaging/)).
  - The guidelines class unofficial clients as adversarial ([search](https://www.whatsapp.com/legal/messaging-guidelines?lang=en)).
  - WhatsApp banned 9.7 million Indian accounts in February 2025 ([search](https://morungexpress.com/whatsapp-bans-97-million-accounts-in-india-in-february-for-rule-violations)).
- **The packages themselves are a risk.** A fake Baileys package on npm stole sessions across 56,000 downloads ([search](https://thehackernews.com/2025/12/fake-whatsapp-api-package-on-npm-steals.html)).
- **The founder's own account at low volume is no exception.** It's still an unofficial client, and a ban hits the founder's main number, often the business line.

### Telegram

| Topic | Finding |
|---|---|
| First messages | A bot can't message a person first ([search](https://community.make.com/t/telegram-bot-error-bot-cant-initiate-conversation-with-a-user/47720)). Use `t.me/<bot>?start=` deep links, or share links the founder sends ([search](https://core.telegram.org/api/links)) |
| Approvals | Inline buttons carry up to 64 bytes of callback data ([search](https://docs.python-telegram-bot.org/en/v22.1/telegram.inlinekeyboardbutton.html)); webhooks can require a `secret_token` header ([search](https://docs.aiogram.dev/en/latest/api/methods/set_webhook.html)). Built, with an approver allow-list ([repo](../packages/gtm-harness/src/connectors/telegram.ts)) |
| Limits | About 30 messages a second for free; about 20 a minute per group ([search](https://core.telegram.org/bots/faq), [search](https://github.com/python-telegram-bot/python-telegram-bot/wiki/Avoiding-flood-limits)) |
| Replying as the founder | Telegram Business: a bot connected to a business account can reply in chats active in the last 24 hours, if granted `can_reply` ([search](https://docs.aiogram.dev/en/latest/api/types/business_bot_rights.html)). Coverage of 2026's "Secretary Mode" says it needs Premium ([search](https://pasqualepillitteri.it/en/news/3225/telegram-secretary-mode-bots-reply-behalf-2026)) |
| Userbots | Acting without the user's knowledge is forbidden ([search](https://core.telegram.org/api/terms)); unofficial-client logins are "put under observation", and spam is "banned forever" ([search](https://core.telegram.org/api/obtaining_api_id)). Automating web.telegram.org carries the same risk with nothing gained over the Bot API (our assessment) |
| Data | The bot terms ban collecting data for datasets or AI ([search](https://telegram.org/tos/bot-developers)) |

### Slack

- **Posting** needs `chat:write`, with OAuth for other workspaces ([search](https://docs.slack.dev/reference/methods/chat.postMessage/)), at about one message a second per channel ([search](https://docs.slack.dev/apis/web-api/rate-limits)).
- **Approval buttons** post to the app's Request URL, which must answer within 3 seconds ([search](https://docs.slack.dev/interactivity/handling-user-interaction)).
- **Reading is gated:**
  - Since 2025, apps outside the Slack Marketplace can read channel history only once a minute, 15 messages at a time ([search](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps)).
  - The API terms bar bulk export and LLM use of the data ([search](https://www.hunton.com/privacy-and-cybersecurity-law-blog/salesforce-locks-down-slack-data-time-to-review-your-slack-api-terms)).

  Posting and approvals are unaffected, but the harness shouldn't count on reading Slack.

### Google

| Item | Finding |
|---|---|
| Gmail | `gmail.send` is a sensitive scope; `gmail.compose`, which creating drafts needs, is restricted ([search](https://developers.google.com/workspace/gmail/api/auth/scopes), [search](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.drafts/create)) |
| Security assessment | Restricted scopes need a CASA assessment ([search](https://support.google.com/cloud/answer/13465431)), renewed yearly ([search](https://support.google.com/cloud/answer/13463816)). One lab lists Tier 2 at $675–$3,600, taking 1–3 weeks ([search](https://tacsecurity.com/google-casa-cloud-application-security-assessment/)) |
| Exemptions | Personal use by fewer than 100 users skips verification, and Testing mode allows 100 test users ([search](https://support.google.com/cloud/answer/15549945)), whose refresh tokens last 7 days ([search](https://developers.google.com/health/setup)) |
| Sheets and Drive | `drive.file` is non-sensitive and reaches only files the app creates or the user opens with it ([search](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)). `spreadsheets` is sensitive ([search](https://developers.google.com/workspace/sheets/api/scopes)); sensitive review takes 3–5 business days ([search](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)) |
| Official MCP | Google's Workspace MCP servers (Gmail, Drive, Calendar, Chat) are in developer preview ([search](https://workspaceupdates.googleblog.com/2026/05/agent-tools-and-security-updates-for-workspace-developers.html)) |

**For Shonin:**

- Gmail drafts work for the founder and design partners under the exemptions.
- A public launch with drafts means a yearly CASA assessment.
- The other route is sending with `gmail.send` after approval, which changes the harness's "the founder sends" rule. That's Edidiong's decision.
- The pipeline sheet uses `drive.file`, never `spreadsheets`.

### X, LinkedIn, Instagram and Facebook, Buffer

- **X:**
  - New developers have been on pay-per-use only since 6 Feb 2026 ([search](https://www.gigazine.net/gsc_news/en/20260209-x-api-pay-per-use/)).
  - A post costs $0.015, or $0.20 with a link ([search](https://opentweet.io/blog/x-api-link-post-fee)).
  - The X intent link the harness builds costs nothing.
- **LinkedIn:**
  - "Share on LinkedIn" posts as the member ([search](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access)).
  - The Messages API is partner-only ([search](https://learn.microsoft.com/en-my/linkedin/shared/integrations/communications/messages)).
  - The User Agreement bans "bots or other unauthorized automated methods" ([search](https://www.linkedin.com/help/linkedin/answer/a1341387)).
- **Instagram and Facebook:**
  - Instagram publishing works only for professional accounts ([search](https://bundle.social/blog/instagram-posting-api)), at 100 API posts a day ([search](https://developers.facebook.com/documentation/instagram-platform/content-publishing)).
  - Other people's accounts need App Review and Business Verification ([search](https://developers.facebook.com/docs/graph-api/overview/access-levels/)).
  - Facebook Pages can schedule posts 10 minutes to 30 days ahead ([search](https://developers.facebook.com/docs/pages-api/posts)).
- **Buffer:**
  - The new API uses personal keys ([search](https://developers.buffer.com/guides/getting-started.html)).
  - OAuth for third-party apps is "upcoming" ([search](https://developers.buffer.com/guides/rest-migration.md)).
  - For now it fits a founder's own account, not a multi-user product.

### Managed connectors and official MCP servers

| Platform | Price | Holds the tokens | Notes |
|---|---|---|---|
| Composio | Free tier, paid from $29 ([search](https://composio.dev/pricing)) | Composio | Its verified Gmail app spares us Google's assessment, but shows Composio's name ([search](https://composio.dev/content/ship-gmail-integration-in-minutes)) |
| Pipedream Connect | About $99 a month for 100 users ([search](https://costbench.com/software/ai-automation/pipedream/)) | Pipedream | Workday signed a deal to buy Pipedream in Nov 2025 ([search](https://newsroom.workday.com/2025-11-19-Workday-Signs-Definitive-Agreement-to-Acquire-Pipedream)) |
| Nango | Free self-hosted edition ([search](https://nango.dev/docs/guides/platform/free-self-hosting.md)) | Us | Uses our own OAuth apps ([search](https://nango.dev/docs/guides/primitives/auth)) |
| Arcade.dev | $25 a month plus $0.01 per execution ([search](https://www.arcade.dev/pricing/)) | Arcade | Arcade's OAuth client or ours |
| Zapier MCP | 2 plan tasks per call ([search](https://help.zapier.com/hc/en-us/articles/45645738385805)) | Zapier | One user only |
| Official MCP servers | Slack ([search](https://gamut.so/blog/slack-mcp-server-guide)), Google, Notion ([search](https://developers.notion.com/docs/get-started-with-mcp)), Buffer ([search](https://support.buffer.com/article/980-connecting-buffer-to-automation-tools-and-ai-assistants)) | The founder's own client | Good inside the founder's agent; not for our backend |

## 5. The headless browser

| Service | Price |
|---|---|
| Browserbase | $20 a month for 100 hours, then $0.12 an hour ([search](https://docs.browserbase.com/account/plans)) |
| Steel | $0.10 an hour, falling to $0.05 ([search](https://docs.steel.dev/overview/pricinglimits)) |
| Hyperbrowser | $0.10 per browser hour ([search](https://docs.hyperbrowser.ai/reference/pricing)) |
| Browser Use | MIT library ([fetched](https://raw.githubusercontent.com/browser-use/browser-use/main/README.md)); its cloud charges $0.01 a task plus model steps ([search](https://docs.browser-use.com/cloud/pricing)) |
| Playwright MCP | Free, Apache-2.0 ([fetched](https://raw.githubusercontent.com/microsoft/playwright-mcp/main/LICENSE)). It keeps logins in a profile and is "not a security boundary" ([fetched](https://raw.githubusercontent.com/microsoft/playwright-mcp/main/README.md)) |

**The legal line runs between logged-out and logged-in:**

- **Logged-out scraping of public pages has held up in court.** It didn't breach Meta's terms (Bright Data, 2024) ([search](https://techcrunch.com/2024/01/24/court-rules-in-favor-of-a-web-scraper-bright-data-which-meta-had-used-and-then-sued)), and X's suit against Bright Data was dismissed ([search](https://www.proskauer.com/release/proskauer-secures-dismissal-of-scraping-claims-against-bright-data)).
- **Logged-in collection hasn't.**
  - BrandTotal, which collected password-protected data, was found in breach ([search](https://www.courthousenews.com/judge-rules-brandtotals-data-harvesting-violates-metas-terms-of-use-and-anti-hacking-laws/)).
  - So was hiQ, which used logged-in and fake accounts. Its case ended in a $500,000 judgment and a permanent injunction ([search](https://www.proskauer.com/blog/hiq-and-linkedin-reach-proposed-settlement-in-landmark-scraping-case)).

**For Shonin:**

- A headless browser reads public pages for research, at a person's pace.
- Anything behind a login goes through an official API or not at all.
- No stealth tools and no CAPTCHA solving.
- A browser logged into WhatsApp Web or Telegram Web is the unofficial-client case above, whatever runs it.

## 6. Any model

### Grok Bot, and what Musk said

- **What Grok Bot is:** xAI's always-on agent. Each bot gets a cloud computer with a browser, files and a shell.
  - Early beta on desktop and iOS on 11–12 Aug 2026 ([search](https://www.thetechoutlook.com/new-release/software-apps/xai-introduces-grok-bot-available-in-early-beta-on-desktop-and-ios/)).
  - Sold through SuperGrok and Cursor plans ([search](https://x.ai/news/grok-bot-more-plans)).
  - SpaceX bought Cursor on 14 Aug 2026 and put it with xAI ([search](https://aiweekly.co/alerts/spacex-closes-60b-cursor-deal-folds-it-into-spacexai-unit)).
- **What Musk posted on 6 Oct 2026:** "Going forward, @SpaceX will use the best back end model for any given task, including Claude Opus 5.5, MidJourney, Suno and other leading APIs. Whatever is most likely to give you the best outcome." ([search](https://x.com/elonmusk/status/2107724314451878104), [search](https://teslanorth.com/2026/10/07/grok-bot-claude-opus-5-5-midjourney-suno/)).
- **Two corrections to the retelling:**
  - **GPT isn't named.**
  - **xAI picks the model, not the user.** xAI's docs say neither members nor admins get a model selector, and it isn't on the roadmap ([search](https://docs.x.ai/grok-bot/teams-and-enterprises)). Pricing and timing weren't announced ([search](https://www.implicator.ai/grok-bot-claude-model-routing/)).
- **Other products:**
  - **Choice sold to the user:** Perplexity, Poe and Cursor, which pairs a picker with an Auto router ([search](https://cursor.com/help/models-and-usage/available-models)).
  - **Cheaper models:** Lindy moved most of its managed traffic to DeepSeek and says inference spend on that traffic fell about 90% ([search](https://www.lindy.ai/blog/migrating-from-claude-to-deepseek)).

**For us:** "like Grokbot" means two routes.

- **Auto:** we pick, from models that passed our evals.
- **My model:** the founder picks and pays.

### Subscriptions and API keys

- **Claude:** Anthropic stopped Claude subscriptions from covering third-party harnesses on 4 Apr 2026 ([search](https://techcrunch.com/2026/04/04/anthropic-says-claude-code-subscribers-will-need-to-pay-extra-for-openclaw-support/)), then partly restored it, with conditions ([search](https://venturebeat.com/technology/anthropic-reinstates-openclaw-and-third-party-agent-usage-on-claude-subscriptions-with-a-catch)).
- **ChatGPT:** OpenAI allows ChatGPT sign-in elsewhere only informally ([search](https://zed.dev/blog/chatgpt-subscription-in-zed), [search](https://manifest.build/blog/chatgpt-plus-tokens-third-party-harnesses/)).
- **So:** the hosted runtime takes API keys. A founder who pays for a subscription runs the free workspace inside their own Claude Code or Codex, which is exactly what the workspace is built for.

### Routers

**Vercel AI Gateway** is the harness's hosted route already ([repo](../packages/gtm-harness/src/models.ts)).

- **Price:** no markup on tokens, including when founders bring their own keys. A $5 monthly free tier can't use bring-your-own-key ([search](https://vercel.com/docs/ai-gateway/pricing)).
- **Bring your own key:** keys are set per team or passed per request in `providerOptions.gateway.byok` ([fetched](https://vercel.com/docs/ai-gateway/authentication-and-byok/byok)). **Catch:** if a request's key fails, the request "may still fall back to use system credentials", so we pay. We found no setting to turn that off ([fetched](https://www.npmjs.com/package/@ai-sdk/gateway)).
- **Spend:**
  - Requests can carry a `user` and `tags`.
  - The spend report groups cost by user, tag, model, provider or credential type.
  - Budgets cap spend per team, project or API key ([fetched](https://vercel.com/docs/ai-gateway/observability-and-spend/custom-reporting)).
  - `quotaEntityId` caps spend per tenant ([fetched](https://www.npmjs.com/package/@ai-sdk/gateway)).
- **Routing:** `models` sets fallback models, and `order`, `only` and `sort` control providers ([fetched](https://vercel.com/docs/ai-gateway/models-and-providers/model-fallbacks)).

| Alternative | Fees | Fit |
|---|---|---|
| OpenRouter | 5.5% on card top-ups ([search](https://checkout.rozo.ai/blog/openrouter-credit-fees-compared)); 5% on your own keys above a monthly free allowance ([search](https://openrouter.ai/blog/announcements/1-million-free-byok-requests-per-month/)) | Good for founders who bring their own router |
| LiteLLM | MIT, self-hosted, no token fee ([search](https://www.litellm.ai/pricing)) | A Python service to run; PyPI releases 1.82.7 and 1.82.8 were backdoored in March 2026 ([search](https://www.trendmicro.com/en_us/research/26/c/your-ai-stack-just-handed-over-your-root-keys-inside-the-litellm-pypi-breach.html)) |
| Portkey | No cut of token spend; $49 a month for production ([search](https://aitoolpick.org/blog/portkey-pricing-2026/)) | An extra hop |
| Cloudflare | 5% on pooled billing credits ([search](https://developers.cloudflare.com/ai-gateway/reference/pricing/)) | Only if we hosted on Cloudflare |

### Structured output across providers

AI SDK 7 handles structured output the same way for every provider, through `Output.object` ([fetched](https://www.npmjs.com/package/ai)). Each provider has its own limits ([fetched](https://www.npmjs.com/package/@ai-sdk/openai), [fetched](https://www.npmjs.com/package/@ai-sdk/google), [fetched](https://www.npmjs.com/package/@ai-sdk/anthropic), [fetched](https://www.npmjs.com/package/@ai-sdk/xai)):

- **OpenAI:** strict mode is on by default and allows no optional properties.
- **Gemini:** supports part of JSON Schema and may reject large or deeply nested schemas.
- **Claude Sonnet 5.5, Opus 5.5 and Fable 5.1:** they reject forced tool use, so a required or named `toolChoice` becomes `auto`.
- **Grok:** its Responses API can't mix xAI's server-side tools with your own tools in one request.

**So:** a plan schema works everywhere if it stays inside the subset the harness already uses: closed objects, every field required, limits checked in code. Tool calls are portable only with `toolChoice: 'auto'`.

**For the brain:** `experimental_decide` returns native probabilities from Jev and OpenAI, but only prompted estimates from Anthropic and Google ([fetched](https://www.npmjs.com/package/ai)). That supports keeping the brain's threshold penalty for uncalibrated providers.

### One workspace for every agent

- **AGENTS.md** is stewarded by the Agentic AI Foundation under the Linux Foundation, and lists 23 agents that read it ([fetched](https://github.com/agentsmd/agents.md)). Claude Code reads it only as a fallback when there's no CLAUDE.md ([search](https://devops.com/claude-code-adds-agents-md-fallback-cutting-instruction-file-sprawl/)). Gemini CLI needs `context.fileName` in `.gemini/settings.json` ([search](https://geminicli.com/docs/cli/gemini-md)).
- **Agent Skills** lists 46 clients, and its guide calls `.agents/skills/` the widely adopted cross-client folder ([fetched](https://github.com/agentskills/agentskills)).

| Tool | Reads skills from |
|---|---|
| Claude Code | `.claude/skills/` only ([search](https://devops.com/claude-code-adds-agents-md-fallback-cutting-instruction-file-sprawl/)) |
| Codex | `.agents/skills/` ([search](https://codex.danielvaughan.com/2026/05/05/agent-skills-open-standard-portable-skills-codex-cli-cross-agent/)) |
| Cursor | `.agents/`, `.cursor/` or `.claude/skills/` ([search](https://cursor.com/docs/skills)) |
| Gemini CLI | `.gemini/skills/`, with `.agents/skills/` as an alias ([search](https://geminicli.com/docs/cli/using-agent-skills/)) |
| Copilot | `.github/`, `.claude/` or `.agents/skills/` ([search](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills)) |

The workspace now writes its skills to `.agents/skills/`, copies them to `.claude/skills/`, and adds `.gemini/settings.json` ([repo](../packages/gtm-harness/src/harness.ts)).

**MCP:** the 2026-07-28 spec removes sessions and the `initialize` handshake, and replaces dynamic client registration with Client ID Metadata Documents ([fetched](https://github.com/modelcontextprotocol/modelcontextprotocol)). TypeScript SDK v2 (`@modelcontextprotocol/server`) implements it ([fetched](https://www.npmjs.com/package/@modelcontextprotocol/server)). `packages/mcp` pins the 1.30 SDK ([repo](../CLAUDE.md)).

**Agent frameworks:** stay on AI SDK 7.

- **Why it fits:** its `ToolLoopAgent` gates risky tools with `toolApproval`, and the experimental `HarnessAgent` runs Claude Code, Codex, Cursor or Grok Build ([fetched](https://www.npmjs.com/package/ai)).
- **The others:**
  - The OpenAI Agents SDK is still before version 1.0 ([fetched](https://www.npmjs.com/package/@openai/agents-extensions)).
  - The Claude Agent SDK carries a proprietary licence ([fetched](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)).
  - Mastra brings workflows and storage we don't need ([fetched](https://www.npmjs.com/package/@mastra/core)).

## 7. Pricing norms

- **Seats and credits:**
  - Lindy: $29.99 a seat ([search](https://www.getmacha.com/blog/lindy-ai-pricing-explained)).
  - Gooseworks: credits, $29 to $299 a month ([search](https://gooseworks.ai/)).
  - Clay: $185 or $495 a month ([search](https://www.cleanlist.ai/blog/2026-03-12-clay-pricing-changes-2026)).
  - Relevance AI: Pro is $29 a month for 2,500 Actions ([search](https://relevanceai.com/docs/get-started/plans)).

  Credits draw cost complaints ([search](https://www.usecarly.com/blog/lindy-ai-review/), [search](https://marketbetter.ai/blog/clay-pricing-breakdown-2026/)).
- **Your own key:** at Relevance AI and Clay it removes the model charge, never the platform charge ([search](https://www.getmacha.com/blog/relevance-ai-complete-guide), [search](https://parlel.com/guides/clay-pricing)).
- **Per outcome:**
  - Intercom Fin charges $0.99 per resolution ([search](https://www.intercom.com/learning-center/ai-customer-service-agent-pricing-comparison)).
  - HubSpot charges $0.50 per resolution on some Breeze agents ([search](https://martech.org/hubspot-moves-to-outcome-based-pricing-for-some-breeze-ai-agents/)).
  - Only 3.8% of companies price purely on outcomes ([search](https://www.withorb.com/blog/2026-state-of-ai-agent-pricing-models-trends-and-whats-working)).
- **Failures cost nothing at Monid** ([fetched](https://github.com/monid-ai/monid)): the model for charging nothing for a blocked draft.
- **Margins:** ICONIQ puts AI products' gross margin at 45% in 2025, forecasting 53% for 2026 ([search](https://www.iconiq.com/growth/reports/state-of-ai-2026)). No source measured margins when customers bring their own keys.
- **Buying connectors instead of building them:** Composio Pro costs $29 a month plus about $0.30 per 1,000 extra calls ([search](https://pricingsaas.com/companies/composio)).

## 8. What this means for Shonin

**Connectors, in two steps:**

| Need | Now: Shonin and design partners | Public launch |
|---|---|---|
| Approvals | Telegram cards (built) | Telegram, plus Slack buttons; each approval records the text's hash, the approver and the time |
| WhatsApp | `wa.me` links the founder taps (built) | Plus the Cloud API from the founder's own verified number, for people who opted in; Coexistence for Business-app users |
| Telegram | Share links (built) | Plus Business-connection replies, each approved |
| Email | `mailto` links (built); Gmail drafts under Google's personal-use and testing exemptions | Gmail drafts after a CASA assessment, or `mailto` links only, or `gmail.send` after approval if Edidiong changes the "founder sends" rule |
| Pipeline | `pipeline.csv` (built); a sheet with `drive.file` | Same |
| Social posts | Intent links (built) | X's API, Share on LinkedIn and Meta's Graph API after review; Buffer once its third-party OAuth ships |
| Research | Playwright MCP on the founder's machine, logged-out | Browserbase or Steel, logged-out only |
| Everything else | Zapier MCP or official MCP servers in the founder's own agent | Composio or Pipedream; Nango if we keep tokens ourselves |

**Build vs buy:**

- **Build:** the approval gate, the outbox, the audit log and the four core channels (Telegram, WhatsApp, email, Slack). The gate is the product.
- **Buy:** WhatsApp hosting from a provider, browsers, and the long tail of apps.

**Never:**

1. Automate WhatsApp Web, Telegram Web or LinkedIn, with any library, userbot, extension or headless browser.
2. Message WhatsApp numbers that haven't opted in, or label marketing as utility.
3. Send anything without an approval of that exact text.
4. Offer Shonin as a general-purpose assistant on WhatsApp.
5. Scrape Telegram groups, LinkedIn or any page behind a login.
6. Export Slack data in bulk, or feed it to a model.
7. Ask for broader Google scopes than a feature needs.
8. Install unvetted "WhatsApp API" packages.

## 9. Unverified

**Grok Bot and models:**

- **Musk's post:** its exact timestamp. The quoted text comes from the x.com page title in search results; x.com itself was blocked.
- **Grok Bot:** its launch dates and price, and whether GPT joins its model pool. RuntimeWire reports a hidden picker listing 33 models.
- **Prices:**
  - OpenRouter's post-August allowance for your own keys.
  - A reported Vercel fee for zero data retention.
  - Portkey's $49 tier.
- **Untested:** whether AI Gateway's per-tenant quota stops spend when a founder's key falls back to our credentials.
- **Unconfirmed:**
  - Lindy's 90% figure.
  - Codex's skill folder.
  - The details of Claude Code's AGENTS.md fallback.
  - Manus's models and pricing.

**Competitors:**

- **Monid:** the lead investor (one outlet), and whether it supports x402 or USDC.
- **Undisclosed:** Buffer's and Gooseworks' models, Gooseworks' approval defaults, and whether Athina AI's funding carried over.
- **Competitor-sourced:** Lindy's review scores, and a "75% three-month churn" figure for 11x. TechCrunch's 70–80% is the sourced figure.
- **Company data:** AntSeed's usage figures.
- **Unconfirmed claim:** "78% of Sub-Saharan SMEs sell on WhatsApp" (Innovation Village).

**Connectors:**

- **Nigeria's WhatsApp rates:**
  - $0.0516 and $0.0067 ([search](https://app.wali.chat/help/pricing-table));
  - $0.062 and $0.0101 ([search](https://msmeafricaonline.com/whatsapp-to-charge-businesses-for-customer-replies-from-october-2026/));
  - $0.0568 and $0.0074 ([search](https://help.eazybe.com/es/waba/pricing)).
- **Meta:**
  - Whether the 1,000 free messages count sent or delivered messages.
  - Meta's fees on replies outside templates from 1 Oct 2026; sources conflict.
  - Whether Meta has restored free access in the EU.
- **360dialog:** $49 or $59 a month, and a reported 7% markup.
- **X:** $0.015 per post; launch coverage said $0.010 ([search](https://www.medianama.com/2026/02/223-x-developer-api-pricing-pay-per-use-model/)).
- **Instagram:** a cap of 100 posts a day; some Meta pages say 50.
- **Connector platforms:** Composio's free tier, and the Pipedream, Nango and Arcade prices, which come from third-party snapshots.
- **Slack:** the MCP server's general-availability date, and whether the March 2026 limit took effect.
- **Telegram:** the details of "Secretary Mode", and whether it needs Premium.
- **Google:** whether CASA fees are one-time or yearly.

## 10. Sources

Every source is linked where it's used.
