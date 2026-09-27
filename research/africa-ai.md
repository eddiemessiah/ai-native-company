# Africa AI: Pan-African AI Summit (Accra, 2026), market map, and what an AI-native firm should ship

Prepared 2026-09-26 for Edidiong Umana ("DeFi Messiah"). Scope: summit readout, Africa AI landscape, 19 solutions (8 infrastructure, 11 application), the Princeton research angle, and a research agenda.

**Evidence tags used throughout**

- **[V] Verified.** I read a primary source (GitHub code, an official page) or at least two independent reports agree.
- **[R] Reported.** The claim comes from a single outlet, a press release, a vendor, or pre-event promotion.
- **[M] Memory.** Analyst knowledge from before June 2026 that I did not re-check in this session.
- **[A] Assumption.** A pricing or cost anchor to validate in customer discovery. Planning FX rate: ₦1,500 = US$1.

**Method and limits.** The egress proxy blocked panafricanaisummit.com and arxiv.org. The shared web-search budget (200 queries) ran out before the talent and AfCFTA checks finished. Instead, I checked the Princeton, x402 and Celo claims against public GitHub source code (read-only clones). The summit ended three days ago, so on-the-day content is limited to what outlets had published by 26 September.

---

## 0. TL;DR

- **The summit.** PAAIS 2026 ran 22–23 September at the Kempinski Hotel Gold Coast City in Accra. Felix Donkor convened it and attendance was free. It was framed as delivery rather than awareness: youth jobs, startup formation, IP ownership and risk-based governance. As of 26 September, no declaration or fund had been announced.
- **The strongest signal came from Ghana's minister.** "We will regulate risks and harms, not curiosity." That means risk-tiered rules, with lending named as high-risk. Ghana's data-protection chief called for African regulators to connect against Big Tech concentration.
- **Regulation is becoming a demand for evidence.**
  - Nigeria: CBN's automated-AML standards (March 2026, 18–24 month window) and the pending Digital Economy & E-Governance Bill (accredited AI auditors, annual audits for finance and automated decisions).
  - Ghana: the Data Protection Bill, which requires automated decisions to be explainable and contestable, with human oversight.
  - South Africa: the draft AI policy was withdrawn over AI-hallucinated citations.
  - Evidence of control is therefore something we can sell.
- **Compute is arriving, but in fragments.** Cassava has about 12k NVIDIA GPUs, Airtel's Nxtra facility in Lagos is 38MW, MTN plans 150MW of AI data centres, and Rack Centre's LGS2 is live. Microsoft/G42's Kenya project stalled on power. The play is to own routing, data residency and reliability rather than GPUs.
- **Language data is no longer the bottleneck.** WAXAL (11k+ hours), African Next Voices (9k+ hours), N-ATLaS, Sunflower and Sahara v2 now exist. A 60-organisation coalition including Anthropic, Google, Microsoft and Gates launched on 21 September. What is missing is evaluation and production reliability in code-switched, voice-first, WhatsApp-first channels.
- **Princeton has moved from leaderboards to agent reliability.** The HAL harness was archived on 1 July 2026. The team now measures consistency, robustness, predictability and safety; its Reliability Dashboard is live and it says there is "more to share soon". The open code turns directly into two products: (a) agent reliability audits for regulated buyers, and (b) a cost-controlled harness for evaluating agents in African languages.
- **Top 8 plays:**
  1. AML alert triage.
  2. Agent Reliability Audit.
  3. AfroEval.
  4. NDPA compliance-as-a-service.
  5. An x402 payment facilitator on Celo using Mento's local-currency stablecoins (NGNm, GHSm, KESm).
  6. WhatsApp order-to-cash agent.
  7. Decision Router audit.
  8. Agent-ready API wrapping for governments.

---

## 1. Summit summary

### 1.1 Facts

| Item | Detail | Tag |
|---|---|---|
| Name | Pan African AI & Innovation Summit (PAAIS) 2026, 2nd edition | V |
| Dates | Tue 22 – Wed 23 September 2026 | V |
| Venue | Kempinski Hotel Gold Coast City, Accra | V |
| Theme | "Scaling Africa's Ethical AI & Innovation Ecosystem: Youth Empowerment, Policy, Partnerships and Skills". Some outlets render the first pillar as "Building Youth Capacity". | V |
| Organiser | Pan African AI Summits & Corporate Training (PACT) Ltd. Summit Director and Convenor: Felix Donkor. | V (convenor); R (entity) |
| Government partners | Ministry of Communication, Digital Technology & Innovations (MoCDTI); Ministry of Youth Development & Empowerment | V |
| Other partners | University of Ghana Digital Youth Village; Brandeis University (Global Development & Sustainability, "GDS"); Estonian Business Angels Network (EstBAN), which co-underwrote the Hack-AI-Thon pitch competition | V |
| Price | Free for every delegate: seats are "underwritten rather than sold" | V |
| Scale (as promoted) | 1,800–2,000+ delegates and 43–45+ speakers. Some promotional copy claims 4,000+ in-person and online registrants from 40+ nations. Actual turnout has not been reported. | R |
| Format | Keynotes, ministerial dialogues, a high-level Policy & Partnerships plenary, roundtables, AI masterclasses (including "live code reviews of African NLP models"), the Hack-AI-Thon pitch competition, a solutions expo with live demos, mentorship labs, and a Smart Destination (tourism) track | R |
| Programme pillars | (1) Youth empowerment through masterclasses and mentorship. (2) Policy through ministerial and expert roundtables. (3) Partnerships and investment through an enhanced pitch competition. (4) Ethical AI in education, agriculture, health and finance. | R |

**Lineage matters for partnerships.** Two organisers are involved and should be treated as separate when following up.

- **2025 edition (AlphaVecta).** The 1st Pan African AI Summit ran 23–24 September 2025 at The Palms by Eagles, Accra. AlphaVecta Technologies organised it with MoCDTI, and it drew about 1,000 in-person and virtual participants, 43 speakers and delegates from 30+ countries. Its headline outcome was a reported US$1B Ghana–UAE Innovation & Technology Hub MoU with Dubai's Ports, Customs and Free Zone Corporation and Presight AI, at Ningo-Prampram [R].
- **2026 split.** AlphaVecta ran a separate **One Vecta Africa AI Week** on 4–9 September 2026 at The Palms by Eagles [R]. Its theme was "From Vision to Execution", with an Innovation Track powered by MEST and the Execute Africa AI Challenge hackathon (200+ innovators from 12+ countries). PAAIS 2026 ran under PACT.

### 1.2 Speakers

Confirmed before the event unless noted.

- **Samuel Nartey George**, Minister, MoCDTI. Keynote, delivered virtually at the opening. [V]
- **Lacina Koné**, DG/CEO, Smart Africa (an AU-endorsed alliance of 40 states). Policy & Partnerships plenary. [V]
- **Dr Arnold Kavaarpuo**, Executive Director, Data Protection Commission Ghana. Spoke on day 1. [V]
- **Darlington Akogo**, founder and CEO, minoHealth AI Labs. [R]
- **Dr G. Ayorkor Korsah**, Ashesi University. [R]
- **Reuben Opata**, CTO, MTN Ghana. [R]
- **Prof. John Jerry Kponyo**, KNUST; Ghana AI strategy lead. [R]
- **Danny Manu**, CEO, Mymanu (UK). [R]
- **Emmanuel Apetsi** and **Prof. Kobby Mensah** (ED, Ghana Tourism Development Company) have speaker pages on the summit site. [R]
- Promoted speaker categories included ministers, central-bank leaders, regulators, executives from Google, Microsoft, IBM and MTN, and VCs. [R]

### 1.3 What was said on the record (Tuesday 22 September)

- **Minister Sam George (virtual opening).** "We will regulate risks and harms, not curiosity." The rules will separate low-risk experimentation by students from high-risk AI systems "used in lending and other critical decisions". He said Ghana had "moved beyond debating whether Africa should have a place at the global AI table" and was now building the skills, infrastructure, data governance and policies to participate "on its own terms". [V]
- **Dr Arnold Kavaarpuo (DPC).** No single regulator or country can govern global tech companies whose power spans communications, cloud infrastructure, digital identity, payments, AI models and access to markets. African regulators must connect. [V]
- **Convenor's framing (op-eds, August 2026).** "Africa's AI gap isn't talent. It's the door": what is scarce is access to the rooms where funding, partnerships and standards are set. PAAIS treats "Pan African" "not as a feeling but as a specification". [V]

### 1.4 Announcements, declarations and funds

- **No declaration, communiqué or fund.** None had been reported by 26 September. The "**Accra Mandate**" (local data plus ethical governance) is a pre-summit op-ed framing from February 2026, not a signed instrument. [V as absence of evidence; recheck in a week]
- **EstBAN pitch partnership** (announced June 2026). Winners get visibility with angel investors, mentors, and a path to deals in the EstBAN network. No cash prize was disclosed, and winners have not been published. [R]
- **Hack-AI-Thon output.** One public repo surfaced: "Avert", a flood monitoring and response workspace for Ghana and Cameroon. [R; repo not opened]
- **Same-week context (not PAAIS outputs).**
  - 21 September, New York: 60 organisations committed to a five-year goal of AI in their own language for about 3.4B speakers of under-served languages [V]. Signatories include Anthropic, Gates Foundation, Google, Microsoft, Mistral, NVIDIA, OpenAI Foundation, UNICEF, World Bank and Zoom, plus Rwanda's IremboGov, Rwanda AI Scaling Hub and Digital Umuganda.
  - GITEX Nigeria 2026 in Abuja focused on sovereign AI [R].
  - The Ghana Tourism Authority's World Tourism Day summit, where GTDC's Prof. Mensah said AI must "enhance human capability, not replace people" [R].

### 1.5 Press coverage

GNA, Ghana Business News, MyJoyOnline, B&FT, Graphic Online, Ghanaian Times, allAfrica, NewsGhana, BusinessGhana, TechLabari, iAfrica, ATTA, Travel Noire (syndicated on Yahoo Tech), Travel And Tour World, and Tourism News Africa. URLs are in section 7.

### 1.6 Ghana context the summit leaned on

- **National AI Strategy (2025–2035).** President Mahama launched it on 24 April 2026. It anchors on ethical AI, data governance, infrastructure and workforce readiness, and prioritises agriculture, health and finance. [V]
- **Compute.** US$250M for a national AI computing centre, with US$20M for short-to-medium-term implementation. Reports differ on whether the total is $250M or $270M. [R]
- **Targets.** 1 trillion tokens of curated Ghanaian-language data by 2030. AI, coding and robotics in the basic-school curriculum by the end of 2026. 300,000 people trained in 2026 under the One Million Coders Programme. [R]
- **Data Protection Bill.** An early draft was published in October 2025, and in March 2026 the minister announced the new bill would cover AI and cross-border data. It requires automated decisions to be explainable, contestable and subject to human oversight; adds a cross-border transfer regime; localises sensitive data categories; and covers deepfakes. [R]

---

## 2. Key themes and takeaways

| # | Theme | Evidence | What it means for us |
|---|---|---|---|
| 1 | **From ambition to execution** | PAAIS 2026 was "repositioned as a delivery-oriented platform" (jobs, startup formation, IP ownership). One Vecta's theme was "From Vision to Execution". | Buyers expect deployed systems with KPIs. Sell outcomes per unit, not workshops. |
| 2 | **Risk-tiered governance turns into evidence requirements** | Ghana: "regulate risks and harms, not curiosity"; ADM duties in the DP Bill. Nigeria: the Digital Economy Bill (NITDA as super-regulator, accredited AI auditors, annual audits); the CBN AML standards; NDPC audit returns. South Africa: policy withdrawn over hallucinated citations. | Audits, compliance packs, and explanation or contest desks are products. Every agent we ship should carry an evidence log. |
| 3 | **Sovereignty across the stack** | The Accra Mandate (local data); NITDA's sovereign cloud instruments; Kavaarpuo on regulator coordination; Ghana's $250M compute; Cassava, Nxtra and MTN building in-country GPU capacity. | Routing that respects data residency, local models for sensitive data, and certifiable logs. |
| 4 | **Language and voice are the access layer** | WAXAL, African Next Voices, N-ATLaS, GovGuide (voice notes in four languages), the 21 September coalition, masterclasses reviewing African NLP models, Ghana's 1T-token target | Evaluation harnesses, data refinery, voice and USSD gateways. Build on open assets; do not pre-train. |
| 5 | **Youth access and the review workforce** | Free seats; mentorship labs; 3MTT has trained 135k+ directly; One Million Coders | Recruit and train reviewers for the "humans review" layer, and run the study group as a talent funnel. |
| 6 | **Tourism as a surprise vertical** | Smart Destination track: AI for biometric, frictionless AfCFTA travel; AI-managed green hotels; predictive traveller analytics; a "$100B experience economy" claim | A hospitality concierge and direct-booking agent (A7) is a low-regulation entry point in Ghana. |
| 7 | **The first cheque is scarce, and infrastructure layers get funded** | AI-native companies took under 2% of H1-2026 funding. Atlantica's four infrastructure bets build no models. EstBAN only offers a pitch stage. | Bootstrap on agent-native services revenue, then raise on infrastructure (eval, audit, payments). |

**Debates visible in the coverage**

1. **Innovation vs protection.** "Regulate harms, not curiosity" against calls for strong recourse when algorithms err (African Arguments, 11 September).
2. **Sovereignty vs dependence.** GovGuide is built with Meta, N-ATLaS is a Llama-3 fine-tune, hyperscalers remain the fallback, and data localisation is rising.
3. **Augmentation vs replacement.** Tourism leaders stress augmentation, while Jumia's AI-driven job cuts show the other side.
4. **Continental vs national.** The convenor pushes "continental collaboration", but the US$60B Africa AI Fund announced in Kigali still lacks an operating framework.

---

## 3. Africa AI landscape map

### 3.1 Infrastructure: compute, data centres, cloud

| Player | What | 2026 status | Tag |
|---|---|---|---|
| Cassava × NVIDIA | "AI factory"; GPU-as-a-service and AI-as-a-service | Cape Town was going live around May–June 2026; a 20MW Johannesburg factory is planned; 12,000 GPUs acquired (target 12–13k); Nigeria, Kenya, Egypt and Morocco next | R |
| MTN | Africa Data Hub Holding with a UAE platform (Tarek Al Ashram) | 150MW of AI data-centre capacity, starting in Nigeria and South Africa (H1-2026 results). BusinessDay reports the network at about $6bn. Plan to put GPUs at tower sites for edge inference. | R |
| Airtel Africa, Nxtra | Lagos (Eko Atlantic): 38MW, about $120M, 3,000+ racks at up to 25kW, PUE 1.3 | Launched early 2026. First of five planned hyperscale data centres. | R |
| Rack Centre, LGS2 | Lagos (Ikeja): 12MW, six halls, up to 70kW per rack, "AI-ready" | Live; powered by gas and diesel, with solar planned | R |
| Raxio | Carrier-neutral Tier III sites in Uganda, Ethiopia, Mozambique, DRC, Côte d'Ivoire and Angola; Tanzania (TZ1, 6MW) next | Over $380M of committed capital (July 2026); contracted power grew sixfold in H1-2026 | R |
| Microsoft / G42 (Kenya) | Olkaria geothermal site: $1B, 100MW initial | **Stalled in May 2026.** Kenya declined to guarantee 1GW of power and the payments. | R |
| Hyperscalers | Google Johannesburg region (2024); AWS Local Zone Lagos (2023); Oracle Nairobi | Nigeria still has no full hyperscaler region | R |
| Governments | Ghana: $250M national AI compute centre. Nigeria: NITDA National Sovereign Cloud Initiative. | NITDA signed the National Cloud Computing Guideline, National Cloud Technical Guideline and NDIAF in August 2026. It plans a regulatory platform to certify cloud and data-centre providers by October 2026 and targets $750M of investment. | R |
| Market size | McKinsey (cited by Raxio): installed capacity grows from 0.4GW to 1.5–2.2GW by 2030 | | R |

**Read.** In-country GPU capacity is going from near zero to tens of thousands of GPUs, while energy and FX remain the binding constraints. Regulated workloads can now run inference locally. The value for a small firm is the policy, routing and evidence layer above the GPUs, not the GPUs themselves.

### 3.2 Models, datasets and language tech

| Asset | Owner | Facts | Tag |
|---|---|---|---|
| N-ATLaS v1 | Awarri with NCAIR/NITDA | Open multilingual, multimodal LLM fine-tuned from Llama-3 8B on 400M+ tokens of multilingual instruction data. Covers Yoruba, Hausa, Igbo and Nigerian-accented English. Launched at UNGA80 (September 2025). On Hugging Face as `NCAIR1/N-ATLaS`. The 2026 National AI Innovation Challenge is "Build with N-ATLAS". | V |
| GovGuide Nigeria | FMCIDE with Meta, NCAIR and Publica AI | Voice and text assistant in English, Hausa, Igbo and Yoruba, launched May 2026. Covers 35+ ministries and 60+ agencies; built on N-ATLaS. | V |
| Sahara v2 / v2.5 | Intron (Nigeria) | ASR for 57 languages and 500+ accents. Vendor benchmark claims up to 64% better than Gemini, GPT-4, Whisper, ElevenLabs and Azure on African entity names. Turns Swahili-English consultations into clinical notes in under 30 seconds. | R (vendor claim) |
| Spitch | Lagos startup | Speech-to-text and text-to-speech for Yoruba, Hausa, Igbo, Nigerian English and Amharic. Integrated into the Cencori AI Gateway in July 2026. | R |
| Cencori | Lagos (founded June 2025) | AI gateway ("Cloudflare for AI production"): routing, security filtering, audit logs, failover. 200+ organic users; in talks with a tier-1 Nigerian bank. **Partner or competitor for I4.** | R |
| InkubaLM, Vulavula | Lelapa AI (South Africa) | InkubaLM is a small multilingual model, 75% smaller after the Buzuzu-Mavi challenge. Vulavula handles code-switched speech and text. $2.5M seed (2023). | R |
| Khaya | GhanaNLP | Translation, ASR and TTS API with Python and JS SDKs. Covers Twi, Ewe, Ga, Dagbani, Frafra and more. | R |
| UlizaLlama | Jacaranda Health (Kenya) | Swahili 7B model (Llama 2 base), extended to Hausa, Yoruba, Xhosa and Zulu. Used for maternal-health messaging. | R |
| Sunflower | Sunbird AI (Uganda) | Open model covering 68 African languages, deepest on 31 Ugandan languages. Claims parity with Gemini 3.1 Pro on translation into African languages. | R (self-reported) |
| Masakhane | Community | MasakhaNER (10 languages), MasakhaPOS (20), MasakhaNEWS (16), and IrokoBench (17 languages: NLI, math reasoning, MCQA). These are the de facto evaluation assets. | V |
| WAXAL | Google Research Africa with African partners | Released 2 February 2026. 21 languages; 11,000+ hours from about 2M recordings; about 1,250 transcribed ASR hours and 20+ studio TTS hours. CC-BY-4.0, owned by the African partners. | V |
| African Next Voices | Gates-funded ($2.2M), university partners | 9,000+ hours in 18 languages across Kenya, Nigeria and South Africa (agriculture, health, education). The wider family covers about 24 languages and 18k+ hours. | R |
| Others to track | EqualyzAI (voice-first agentic AI); Farmerline (voice advisory in 27 languages); Viamo's "Ask Viamo Anything" (IVR, Zambia); Amini (data infrastructure, Kenya); minoHealth (Ghana) | | R |

**Read.** Data and base models exist, but reliable production use is missing. Code-switching (Pidgin and English), tone marks, naira amounts, account numbers and names are where systems break. Measuring those failures, and routing around them to humans, is an open market.

### 3.3 Applications and enterprise adoption

**Capital (H1-2026)**
- TechCabal counted **$1.44B** (equity $818M, debt $614M, grants $9M) across 146 deals, against 252 a year earlier.
- Briter counted **$3.3B**; its median deal was $1.7M, up 235%.
- Egypt led, followed by Nigeria ($254M), Kenya ($126M, its weakest half since 2021) and South Africa (under $100M).
- AI-related companies took about 14% of funding; genuinely AI-native companies took under 2%. About half of AI money went to fintech uses (fraud, credit scoring, payments). Few founders are getting their first $100k. [R]

**Infrastructure-layer investor thesis.** Atlantica Ventures made four infrastructure bets in 18 months, disclosed at under $10M combined: ChipMango ($1.9M, 1 September 2026), NOSIBLE (vector search), Salus Cloud (DevOps) and Cybervergent (compliance orchestration), on top of Lelapa. None of them build models. [R]

**AI restructuring is real.** On 14 May 2026, Jumia said it would cut at least 200 jobs. Customer service was the first function automated, followed by logistics, finance, cybersecurity, seller management and software development. Its headcount fell from 4,300+ (2022) to under 2,000 (March 2026). Over 1,000 AI-attributed layoffs were tracked in H1-2026. [R]

**Enterprise pain points by sector**

| Sector | Pain point (2026) | Tag |
|---|---|---|
| Banks, MMOs, IMTOs (Nigeria) | CBN's Baseline Standards for Automated AML Solutions (March 2026) require automated customer due diligence, sanctions/PEP screening, transaction monitoring, case management, regulatory reporting and fraud detection within 18–24 months. Instant-payment fraud is rising (₦3.29B lost in Q1-2025, up 603%), and deepfakes are bypassing KYC liveness checks. | R |
| Agent banking | Since 1 April 2026, POS agents must be exclusive to one principal. Moniepoint holds about half of POS; OPay has 60M+ users; there are about 2M agents. | R |
| All data-heavy firms (Nigeria) | The NDPA plus GAID (effective 19 September 2025) require annual compliance audit returns from "data controllers and processors of major importance". The 2025 returns deadline moved from 31 March to 30 May 2026, and late filing carries a 50% surcharge. | R |
| Lending (Ghana, Nigeria) | Ghana names lending as high-risk AI; the DP Bill requires explainable and contestable automated decisions; Nigeria's bill targets finance ADM with audits. | V/R |
| Government (Kenya) | 22,000 digital services still run on manual back ends. The state is building a unified operations platform linking MDA systems through APIs before deploying AI agents; MDAs must map their systems and APIs and re-engineer at least two core services. | R |
| Government (Nigeria) | GovGuide covers federal services; states, LGAs and agencies are still uncovered. African Arguments asks who protects citizens when algorithms get it wrong. | V/R |
| Tourism | The PAAIS Smart Destination track. GTDC's wish list: 24-hour enquiry responses, recommendations, voice search, virtual tours, personalised itineraries. | R |
| Agriculture, health, education | Summit focus areas. Smallholders prefer voice; clinical documentation and claims are burdens. | R |

### 3.4 Channels (cross-cutting)

- **WhatsApp**
  - A vendor survey says about 78% of Sub-Saharan SMEs use WhatsApp as a primary sales channel. [R]
  - Meta's **Business Agent** went global in June 2026 and is free at launch. It answers FAQs, shares catalog items, qualifies leads and escalates to humans, so generic WhatsApp bots are now commoditised. [R]
  - Since January 2026, **general-purpose AI chatbots are not allowed on the WhatsApp Business API**; task-specific bots (support, order tracking, FAQs) are allowed. [R]
  - **From 1 October 2026, replies to customer-initiated conversations become billable** beyond 1,000 free per business number per month. [R]
  - Nigeria rates: marketing about $0.0516 per message; utility about $0.0067–0.0101; authentication about $0.0145, or $0.075 when sent from a business account registered outside Nigeria. [R]
- **Voice, IVR and USSD.** This is the low-literacy and feature-phone path, and CGIAR research shows smallholders prefer voice. It is built on Africa's Talking-style APIs; Ask Viamo Anything in Zambia is a precedent. [R]
- **Money**
  - A vendor claim puts Sub-Saharan mobile money at $1.4T in 2025. [R]
  - Nigeria runs on POS agents and instant transfers.
  - On Celo mainnet (chain 42220), Mento's local-currency stablecoins **NGNm, GHSm, KESm, XOFm and ZARm** are live, alongside USDm, EURm and others, with routes to USDC, USD₮ and axlUSDC. [V: mento-sdk, commit of 2026-09-15]
- **Implication.** Build one agent core with channel adapters (WhatsApp, voice, USSD, web, API/MCP). Integrate Meta's agent instead of competing with it. Price in naira or cedi for humans and in stablecoins through x402 for agents.

### 3.5 Policy

| Jurisdiction | Instrument | Status (September 2026) | Tag |
|---|---|---|---|
| African Union | Continental AI Strategy | Endorsed at the Executive Council in Accra, July 2024. Phase 1 (2025–26) covers governance and national strategies; Phase 2 starts in 2028. | V |
| Continental | Africa Declaration on AI, Kigali (April 2025) | Announced a $60B Africa AI Fund and an Africa AI Council. The fund's operating framework was still unclear in 2026. | R |
| Smart Africa | 40-member AU-endorsed alliance | Created an Africa AI Council under the ICT ministers. Koné spoke at PAAIS. | V |
| Ghana | National AI Strategy 2025–2035; Data Protection Bill; risk-based stance | Strategy launched 24 April 2026. The DP Bill (ADM duties, cross-border rules, localisation, deepfakes) is awaiting Parliament. Stance: "regulate risks and harms, not curiosity". | V/R |
| Nigeria | NAIS (2025–2029); NDPA 2023 and GAID 2025; National Digital Economy & E-Governance Bill; CBN AML standards; NITDA sovereign cloud | NAIS published September 2025 (five pillars; NCAIR). The bill was at third reading in July 2026 and described as "ready in weeks", but **enactment is not confirmed**. It would make NITDA a super-regulator with risk classes, algorithmic transparency, **accredited AI auditors**, annual audits for public administration, finance, ADM and surveillance, and licensing. | R |
| Kenya | National AI Strategy 2025–2030 (27 March 2025) with an implementation roadmap | API inventories and a unified platform ahead of government AI agents. AI accelerator call (August 2026). | R |
| Rwanda | National AI Policy | Cabinet approved a National AI Agency (June 2026). Signatories to the 21 September coalition. | R |
| South Africa | Draft National AI Policy | Published 10 April 2026 and **withdrawn 26 April 2026 over AI-hallucinated citations**. A revision goes to Cabinet by November 2026, with release in January 2027. | R |

### 3.6 Talent

- **Nigeria: 3MTT** [R]
  - 135,000+ people trained directly by early 2026, and 300,000+ reached through community learning.
  - Phase 1 trained 30k from December 2023. Phase 2 targets 270k, including DeepTech cohorts.
  - Partnerships: Microsoft AI skilling (target of 1M Nigerians); Meta, the Federal Government and 3MTT launched AI Academy Nigeria (August 2026); a recruitment partnership covers 20,000+ fellows (May 2026).
- **Ghana.** The One Million Coders Programme (300k targeted in 2026), AI in the basic-school curriculum by the end of 2026, and the UG Digital Youth Village (a PAAIS partner). [R]
- **Deep-tech niches.** ChipMango trains chip-design and verification engineers; Data Science Nigeria; Ashesi and KNUST (both represented at PAAIS). [R]
- **Implication.** There is a large pool of junior technical talent. With calibrated routing, reviewers see only the uncertain 10–30% of items, so 3MTT and One Million Coders graduates can staff the human-review layer after a short certification. Run this through the study group.

---

## 4. Solutions

### 4.0 Design rules

1. **Follow the brain split** already encoded in `packages/brain`: *Jev decides, the LLM writes, code executes and owns anything exact or irreversible.*
   - **Jev** is TypeSafe's "System One" model. It returns Choice, Score and Noul answers with probabilities, calibrated against outcomes (RLCD), and costs **$0.042 per M input tokens with no output cost** in the repo's price table.
   - Policy thresholds by risk tier: read 0.50, write 0.70, external 0.85, money 0.90, irreversible 0.95.
   - Money and irreversible actions are prepared only; a human confirms them.
2. **Price per unit at roughly 25–50% of the human or incumbent unit cost.** Bill naira or cedi for human buyers, and stablecoins through x402 for agent buyers.
3. **Every deliverable ships with an evidence log:** decision, probability, model version, reviewer, and timestamp hash. That is what regulators are starting to ask for.
4. **Build on open African-language assets** (N-ATLaS, WAXAL, Masakhane, Sunflower). Do not pre-train.

In the specs below, **Jev** means typed decisions, **LLM** means generation, **Code** means exact or irreversible logic, and **Human** is the review gate.

### 4.1 Summary table

Priority P1 marks the top 8.

| # | Solution | Layer | Buyer | Unit of sale | Human or incumbent anchor | Our price | Pri |
|---|---|---|---|---|---|---|---|
| I1 | **AfroEval**: cost-controlled agent evaluation in African languages | Infra | Model builders (Awarri, Lelapa, Intron, Spitch, Sunbird), deployers (banks, telcos, agencies), funders | Per evaluation run (system × suite × up to 3 languages), plus monitoring | Human linguist evaluation study: about $5–15k and 4–6 weeks [A] | $1.5–4k per run; $300–800 per month monitoring | P1 |
| I2 | **Agent Reliability Audit** (consistency, robustness, predictability, safety) | Infra (assurance) | Banks, MMOs, fintechs, insurers, agencies, and AI vendors selling to them | Per workflow audited, plus quarterly re-audit | Big-4 or IT audit $15–50k; NDPA audit by a licensed compliance firm (DPCO) ₦1–5M [A] | $3–8k per workflow; $1–2k per re-audit | P1 |
| I3 | **Decision Router audit and migration** | Infra | Fintechs, e-commerce, BPOs, telcos with LLM bills | Fixed audit fee plus gainshare | Current LLM spend, e.g. about $45k per month for 10M decisions on a Sonnet-class model | $2–5k audit plus 15–25% of year-1 savings | P1 |
| I4 | **Residency-aware inference router** | Infra | Banks, HMOs and hospitals, government, telcos | Per 1M tokens routed, plus platform fee | 2–3 in-house engineers (about $5–10k per month) [A], or a generic gateway | $0.10–0.30 per 1M tokens plus $500–2k per month | P2 |
| I5 | **x402-on-Celo facilitator** (NGNm, GHSm, KESm, USDm) | Infra (payments) | African API sellers; agent builders | Per settled payment | Card and PSP fees (Paystack local about 1.5% + ₦100, capped at ₦2,000; international about 3.9%) [M], plus USD invoicing and FX spread | 0.5–1% or ₦10–20 flat per settlement | P1 |
| I6 | **Agent-ready API layer** (inventory, then OpenAPI, then MCP) | Infra | Kenyan MDAs through SIs, Nigerian agencies, banks | Per endpoint wrapped and tested; readiness report | SI time: 0.5–1 day per endpoint, about $300–1,500 [A] | $80–250 per endpoint; $2–5k per readiness report | P1 |
| I7 | **Voice and USSD agent gateway** | Infra (channel) | Agri-input firms, MFIs, health programmes, agencies | Per resolved session or per minute | Call-centre agent: about $0.10–0.25 per minute fully loaded [A] | Telephony pass-through plus $0.10–0.30 per resolution | P2 |
| I8 | **Local-language data refinery and consent ledger** | Infra (data) | MoCDTI (1T-token goal), NCAIR, model labs, coalition funders | Per curated speech hour, per 1M curated tokens, per labelled item | Manual transcription: $0.5–1.5 per audio minute, i.e. $30–90 per hour [A] | $15–40 per curated hour; 30–50% of the human cost | P2 |
| A1 | **AML alert triage and suspicious-transaction report (STR) drafting** | App (finance) | Microfinance banks (MFBs), payment service banks (PSBs), MMOs, IMTOs, fintechs | Per alert dispositioned; per STR draft | An analyst costs about $1.0 per alert [A]; vendor suites cost six figures | $0.30–0.50 per alert; $3–5 per STR draft | P1 |
| A2 | **NDPA/GAID compliance-as-a-service** | App (regulatory) | Large data controllers and processors (fintechs, schools, hospitals, e-commerce); DPCOs as white-label partners | Per audit-return pack, per DPIA or ROPA, or subscription | DPCO audit ₦1–5M plus legal time [A] | ₦250–900k per pack; ₦50–150k per DPIA | P1 |
| A3 | **WhatsApp order-to-cash agent** for SMEs | App (SME) | SMEs and distributors, starting with the founder's clients | Subscription plus per order; collections as % recovered | Admin assistant: about ₦190 per order [A] | ₦10–25k per month including 300 orders, then ₦60–100 per order; 3–5% of amounts collected | P1 |
| A4 | **Credit-decision explanation and contest desk** | App (finance) | Digital lenders, MFIs, BNPL, banks | Per notice; per contest packet; per fairness check | Complaint handling: ₦5–15k each [A], plus regulatory exposure | ₦300–800 per notice; ₦3–5k per contest | P2 |
| A5 | **Tender and bid-response factory** | App | Contractors, consultancies, NGOs | Per bid pack plus success fee | Bid consultant: ₦0.5–3M per bid [A] | ₦150–400k plus 1–2% on success | P2 |
| A6 | **AfCFTA trade documents and HS pre-classification** | App (trade) | Exporters, freight forwarders, clearing agents | Per shipment pack; per HS code | Documentation and clearing: ₦50–300k per shipment [A] | $10–30 per pack | P3 |
| A7 | **Hospitality concierge and direct-booking agent** | App (tourism) | Independent hotels, tour operators, destination agencies | % of direct booking, or per enquiry | OTA commission 15–25% [M]; reservations staff | 3–5% of agent-assisted direct bookings | P3 |
| A8 | **Clinical voice scribe and HMO claim pre-audit** | App (health) | Private clinics, HMOs | Per encounter; per claim | Scribe or typist time; claims officer [A] | ₦200–500 per encounter; ₦150–300 per claim | P2 |
| A9 | **Agricultural voice advisory and farm verification** | App (agriculture) | Aggregators, input lenders, programmes | Per farmer-season; per verification | Extension visit: ₦2–5k [A] | ₦200–500 per farmer-season | P3 |
| A10 | **Government service navigator** (GovGuide for states and agencies) | App (government) | State governments, agencies, SIs | Setup fee plus per resolved query | Call-centre contact: ₦300–1,000 [A] | ₦50–150 per resolved query | P2 |
| A11 | **Website plus AI front desk, discoverable by agents** | App (SME) | Nigerian SMEs | Per site plus monthly plan | Agency site: ₦300k–1.5M [A] | ₦150–400k plus ₦15–30k per month | P2 |

### 4.2 Infrastructure-layer specs

#### I1. AfroEval: cost-controlled agent evaluation in African languages
- **Problem.** Vendors grade themselves: Intron claims "up to 64% better"; Sunbird claims parity with Gemini 3.1 Pro. Deployers such as GovGuide, banks and telcos have no neutral, cost-aware test of whether an agent completes tasks in code-switched Pidgin, Yoruba, Hausa, Twi or Swahili. The 21 September coalition and Ghana's 1T-token programme will also need measurement.
- **Buyer.** Model builders (Awarri/NCAIR, Lelapa, Intron, Spitch, Sunbird), deployers (banks, telcos, agencies), funders.
- **Unit of sale.** Per evaluation run (one system × one task suite × up to three languages), plus monthly regression monitoring.
- **Price anchor.** A commissioned linguist evaluation costs about $5–15k and takes 4–6 weeks [A]. **Our price: $1.5–4k per run, with 48-hour turnaround.**
- **Why an agent-native firm wins.**
  - Perturbation generation, grading and statistics are automatable; native speakers review only low-confidence or disputed items.
  - Princeton's harness shows standardisation makes evaluation fast and cheap.
  - We add African perturbations: stripped tone marks, Pidgin/English code-switching, naira amounts, local names.
- **7-day MVP.**
  - D1–2: three 150-item suites (bank or mobile-money customer-service intents in Pidgin, Yoruba and Hausa), plus IrokoBench and MasakhaNEWS slices.
  - D3: perturbation generator.
  - D4: Jev grader, calibrated against 100 native-speaker labels.
  - D5: run N-ATLaS, Sunflower and two frontier models.
  - D6: report accuracy, **cost per correct answer**, C_out, R_prompt and P_cal.
  - D7: public leaderboard page and a paid-pilot pitch.
- **Jev.** Choice: correct / partial / wrong / unsafe. Score: fluency 1–5. Noul: "invented entity or amount?"
- **LLM.** Paraphrases and code-switched variants; failure-mode write-ups.
- **Code.** Dataset versioning; exact match, WER and chrF; bootstrap confidence intervals; token and cost accounting; leaderboard.
- **Human.** Native speakers review items below threshold or where graders disagree.

#### I2. Agent Reliability Audit
- **Problem.** Buyers now need evidence about automated decisions:
  - Ghana's DP Bill: automated decisions must be explainable and contestable, with human oversight.
  - Nigeria's bill: risk classes, accredited auditors, annual audits.
  - CBN's automated-AML standard.
  - NDPA/GAID.
  - South Africa's hallucinated-citation withdrawal shows the reputational cost.
  - Organisations cannot currently show that an agent is consistent, survives outages, knows when it is unsure, and does not leak PII.
- **Buyer.** Chief risk and compliance officers at banks, MFBs, MMOs and insurers; public agencies; AI vendors who need a third-party report to close sales.
- **Unit of sale.** Per workflow audited (one agent, one task family), plus quarterly re-audit.
- **Price anchor.** A Big-4 or IT audit engagement costs $15–50k [A]; an NDPA audit by a DPCO costs ₦1–5M [A]. **Our price: $3–8k per workflow in 5 business days; $1–2k per re-audit.**
- **Why an agent-native firm wins.**
  - Princeton's open `reliability_eval` already codifies the phases and metrics (section 5); we localise them.
  - Local checks: NIN and BVN exposure (11-digit patterns), +234 phone numbers, naira-amount errors, unauthorised reversals.
  - Runs are cheap and continuous; a human auditor signs.
- **7-day MVP.**
  - D1: wrap the target agent over HTTP.
  - D2: port the metric formulas:
    - C_out = 1 − σ²/(p(1−p))
    - R_fault, R_struct, R_prompt: accuracy retained under perturbation
    - P_cal = 1 − ECE; P_auroc; Brier
    - S_safety = 1 − (1 − S_comp)(1 − S_harm)
  - D3: local compliance checks (PII, destructive operations, data minimisation).
  - D4: fault injection (timeouts, NIBSS or PSP outages, rate limits).
  - D5: 5 repetitions × 50 tasks.
  - D6: report mapped to NDPA/GAID, the Ghana DP Bill and CBN AML clauses.
  - D7: sell as a pre-sales evidence pack to one AI vendor.
- **Jev.** Choice per trace: none / PII exposure / destructive operation / policy circumvention / financial error / overcommitment. Score: severity bins. Noul: "abstained appropriately?"
- **LLM.** Findings narrative and remediation plan.
- **Code.** Perturbations, fault injection, metrics, hash-chained evidence bundle.
- **Human.** Auditor sign-off.
- **Caveat.** Position this as a "readiness" audit until Nigeria defines accredited AI auditors.

#### I3. Decision Router audit and migration
- **Problem.** Many African "AI features" are really decisions: route a ticket, flag a transaction, pick a template. They run on generative LLMs billed in USD, which exposes them to FX and gives uncalibrated confidence.
- **Buyer.** CTOs and heads of operations at fintechs, e-commerce firms (Jumia-style restructurers), BPOs and telcos.
- **Unit of sale.** Fixed-fee audit plus gainshare on realised savings, or a per-1k-decision price after migration.
- **Price anchor.** Using the repo's default price table (`packages/brain/src/cost.ts`), take 10M decisions a month at 1,500 input and 150 output tokens each.
  - On a Sonnet-class model ($2 / $10 per M tokens) that is about **$45,000 per month**.
  - On Jev ($0.042 per M input) it is about **$630 per month**, roughly 70× cheaper.
  - **Our price: $2–5k per audit, plus 15–25% of year-1 savings.**
- **Why an agent-native firm wins.** The brain already implements `compareCost` and risk-tier gates. Calibrated probabilities allow more automation at the same risk.
- **7-day MVP.** Ingest 30 days of LLM logs. Classify each call as decision, generation or should-be-code. Shadow-run 1,000 historical decisions on Jev. Report agreement, calibration and savings, plus a migration plan with rollback flags.
- **Jev.** Classifies log entries, then makes the migrated decisions.
- **LLM.** Only the generation that remains.
- **Code.** Log parsers, cost maths, shadow diffs, feature flags.

#### I4. Residency-aware inference router
- **Problem.**
  - NDPA/GAID transfer rules, localisation of sensitive categories in Ghana's DP Bill, and NITDA's cloud-provider certification (platform due October 2026) all push sensitive data to stay in-country.
  - In-country GPU capacity (Nxtra, Rack Centre, Cassava GPUaaS, MTN) is new and fragmented.
  - Enterprises need one endpoint that keeps sensitive prompts local and sends the rest to frontier APIs.
- **Buyer.** Banks, HMOs, hospitals, government, telcos.
- **Unit of sale.** Per 1M tokens routed plus a monthly platform fee; on-premises option.
- **Price anchor.** An in-house build needs 2–3 engineers, about $5–10k per month [A]. Cencori is the local gateway, so either partner with it or differentiate on residency plus audit evidence. **Our price: $0.10–0.30 per 1M tokens plus $500–2k per month.**
- **Why an agent-native firm wins.** The per-request policy is a typed decision costing fractions of a cent on Jev, and we own the compliance mapping.
- **7-day MVP.** An OpenAI-compatible proxy. Detectors for NIN, BVN, account numbers and health terms (regex plus Jev). Sensitive traffic goes to a self-hosted open model (for example N-ATLaS) on in-country compute; the rest goes to frontier APIs. Tamper-evident logs and a residency report.
- **Jev.** Noul: "sensitive?" Choice: route local / regional / global / block.
- **LLM.** Nothing in the control path.
- **Code.** Proxy, redaction, cryptographic logging, billing.

#### I5. x402-on-Celo facilitator with local-currency stablecoins
- **Problem.** African API sellers (voice, translation, identity, credit data, market prices) bill monthly in USD or by card, so agents cannot pay per call.
  - x402 now lives under the **x402 Foundation**; `coinbase/x402` is a development fork. It has HTTP, **MCP** and **A2A** transports and the **`exact`, `upto` and `batch-settlement`** schemes. `upto` is explicitly for usage-based charges such as per-token LLM billing.
  - The reference SDK ships default assets for Base, Polygon, Arbitrum and others, but **Celo (eip155:42220) has no default asset**. It appears only in a bundled paywall chain list (dev fork, last commit 2026-04-21) [V].
  - Mento's NGNm, GHSm, KESm, XOFm and ZARm are live on Celo mainnet [V].
- **Buyer.** Supply side: API vendors (Spitch, Khaya, Intron, KYC providers, our own APIs). Demand side: agent builders and enterprises running agents.
- **Unit of sale.** Per settled payment (basis points or a flat fee), plus an optional hosted paywall and a Bazaar discovery listing.
- **Price anchor.** Paystack Nigeria charges about 1.5% + ₦100 locally (capped at ₦2,000) and about 3.9% internationally [M], on top of FX spread and minimums that make calls under ₦50 uneconomic. **Our price: 0.5–1%, or ₦10–20 per settlement.**
- **Why an agent-native firm wins.** The founder's Celo DevRel edge. The `upto` scheme fits per-token and per-minute pricing, and local stablecoins remove USD pricing friction, which positions us as the default "pay in naira" rail for agent APIs.
- **7-day MVP.**
  - D1: verify Celo USDC (EIP-3009, for `exact`) and the Mento tokens (Permit2, for `upto`).
  - D2–3: facilitator verify and settle service on Celo.
  - D4: put one API behind x402 middleware.
  - D5: a demo agent paying per call in USDm or NGNm.
  - D6: Bazaar listing and the offer-and-receipt extension.
  - D7: docs and two vendor LOIs.
- **Jev.** Noul: abuse or fraud on payment requests. Choice: dynamic price tier.
- **LLM.** Docs and SDK samples.
- **Code.** Signature checks, nonce and replay protection, settlement, receipts, reconciliation.
- **Guardrail.** Money is at the money risk tier: code executes only after cryptographic verification, and no model has discretion over funds.

#### I6. Agent-ready API layer (inventory, then OpenAPI, then MCP)
- **Problem.** Kenya requires MDAs to map systems and APIs and re-engineer at least two core services before government AI agents can be deployed; 22,000 digital services still sit on manual back ends. Nigeria's GovGuide spans 35+ ministries and 60+ agencies. Bank cores look similar.
- **Buyer.** MDAs through system integrators, ICT authorities, banks and telcos.
- **Unit of sale.** Per endpoint documented, wrapped as an MCP tool and tested; plus a readiness assessment per institution.
- **Price anchor.** An SI spends 0.5–1 day per endpoint, about $300–1,500 [A]. **Our price: $80–250 per endpoint; $2–5k per readiness report.**
- **Why an agent-native firm wins.** Coding agents built on the mini-swe-agent pattern (bash-only, above 74% on SWE-bench Verified) generate specs, wrappers and contract tests while humans review diffs. Risk tiers map straight into brain policies.
- **7-day MVP.** For one public e-service or a sandbox: capture traffic and docs, produce OpenAPI, then an MCP server, then contract tests. Add an agent-readiness score (authentication, idempotency, PII, rate limits) and an inventory sheet in the ministry's format.
- **Jev.** Choice: endpoint risk tier (read / write / external / money / irreversible). Noul: "returns PII?"
- **LLM.** Specs and tool descriptions.
- **Code.** Schema inference, the test harness, MCP scaffolding, CI.

#### I7. Voice and USSD agent gateway
- **Problem.** Low-literacy and feature-phone users (farmers above all) prefer voice. WhatsApp is not universal, and USSD sessions are short and text-only.
- **Buyer.** Agri-input companies, MFIs, health programmes, agencies.
- **Unit of sale.** Per resolved session or per minute, plus setup.
- **Price anchor.** A human call-centre minute costs about $0.10–0.25 fully loaded [A]. **Our price: telephony pass-through plus $0.10–0.30 per resolution.**
- **Why an agent-native firm wins.** It composes Spitch, Intron and Khaya speech APIs with calibrated escalation, and one agent core serves WhatsApp, voice and USSD.
- **7-day MVP.** Africa's Talking voice plus a USSD fallback for one use case (order status or appointments) in Pidgin and Yoruba or Hausa. Gate on ASR confidence, hand off to a human, and summarise each call.
- **Jev.** Choice: intent. Noul: escalate. Score: ASR quality.
- **LLM.** Replies constrained to the approved knowledge base.
- **Code.** Telephony, USSD state machine, session timers, logs.

#### I8. Local-language data refinery and consent ledger
- **Problem.** Ghana targets 1T curated Ghanaian-language tokens by 2030. WAXAL (CC-BY-4.0), African Next Voices and coalition money create raw material that still needs segmentation, language ID, PII scrubbing, quality scoring, provenance and consent, and fair payment to contributors.
- **Buyer.** MoCDTI's AI programme, NCAIR, model labs, coalition funders.
- **Unit of sale.** Per curated speech hour, per 1M curated tokens, or per labelled item.
- **Price anchor.** Manual transcription costs $30–90 per audio hour [A]. **Our price: $15–40 per curated hour.**
- **Why an agent-native firm wins.** Automated pre-labelling and QA, with native-speaker review only on uncertain items, and micro-payouts to contributors in GHSm or NGNm on Celo.
- **7-day MVP.** Take a WAXAL slice (Twi, Fante, Hausa). Segment, identify language, deduplicate (MinHash), scrub PII and score quality. Write a datasheet and demo the contributor payout ledger.
- **Jev.** Score: quality 1–5. Choice: language. Noul: PII present.
- **LLM.** Orthography-normalisation suggestions; datasheets.
- **Code.** Segmentation, WER checks, deduplication, manifests, payouts.

### 4.3 Application-layer specs

#### A1. AML alert triage and suspicious-transaction report (STR) drafting
- **Problem.** CBN's March 2026 standards require automated due diligence, sanctions/PEP screening, monitoring, case management and reporting within 18–24 months, for banks, MMOs and IMTOs. Fraud and deepfake KYC are rising. Tier-2 and tier-3 institutions cannot afford big suites or the analyst headcount to clear alerts.
- **Buyer.** Chief compliance officers and money-laundering reporting officers at MFBs, PSBs, MMOs, IMTOs and fintechs.
- **Unit of sale.** Per alert dispositioned; per STR draft.
- **Price anchor.** An analyst costs about ₦660k per month loaded (about $440) and clears about 20 alerts a day, so **about $1.0 per alert** [A]. **Our price: $0.30–0.50 per alert and $3–5 per STR draft.**
- **Unit economics (estimate), about $0.05 per alert before overhead:**
  - Jev triage: about 3k tokens, roughly $0.0001.
  - STR draft on a Sonnet-class model for 10% of alerts: about $0.016 each.
  - Analyst review of the 20% that escalate, at 5 minutes each: about $0.04 per alert.
- **Why an agent-native firm wins.** Triage is a calibrated typed decision, narratives are generation, and sanctions matching and reporting formats are exact code. The analyst reviews escalations only and signs every STR.
- **7-day MVP.** Import historical alerts and outcomes from CSV. Jev triages each alert into close / monitor / escalate / STR, and the LLM drafts STR narratives for the NFIU's goAML format [M]. Report shadow-mode precision, recall and selective accuracy at each threshold against analyst decisions on 500 alerts.
- **Jev.** Choice: disposition. Score: risk. Noul: "true sanctions/PEP match?"
- **LLM.** STR narrative and case summary.
- **Code.** Fuzzy name matching, list refresh, rules, goAML XML, audit trail.
- **Human.** STR filing is irreversible and external, so it is prepared only; the reporting officer confirms.

#### A2. NDPA/GAID compliance-as-a-service
- **Problem.** GAID (effective 19 September 2025) operationalises the NDPA. Large data controllers and processors must file annual audit returns: the 2025 deadline moved to 30 May 2026, and late filing costs a 50% surcharge. Ghana's DP Bill adds duties on automated decisions. Most SMEs have no data protection officer.
- **Buyer.** Large data controllers and processors (fintechs, schools, hospitals, e-commerce, logistics), with licensed DPCOs as white-label partners.
- **Unit of sale.** Per audit-return pack; per DPIA, ROPA or privacy notice; annual subscription.
- **Price anchor.** A DPCO audit costs ₦1–5M plus legal time [A]. **Our price: ₦250–900k per pack and ₦50–150k per DPIA.**
- **Why an agent-native firm wins.** Intake, data mapping, gap analysis and drafting are automatable. A licensed DPCO partner signs, and the evidence log is ready for the NDPC.
- **7-day MVP.** WhatsApp or web intake builds a data inventory and runs the GAID control checklist. It drafts the privacy notice, ROPA, DPIA and breach plan, queues them for DPCO review, and produces a filing checklist with fee calculator and reminders.
- **Jev.** Choice per control: compliant / partial / non-compliant / N/A. Score: risk.
- **LLM.** Policy documents.
- **Code.** Fee and deadline calculators, document assembly, evidence hashes.

#### A3. WhatsApp order-to-cash agent for SMEs
- **Problem.** WhatsApp is the storefront. Meta's free Business Agent (June 2026) now covers FAQs, catalog and lead qualification, so generic bots are commoditised. The painful parts remain:
  - verifying bank-transfer claims ("I've paid, check your alert");
  - invoicing and stock;
  - delivery booking and collections;
  - and from 1 October 2026, service replies cost money beyond 1,000 a month.
- **Buyer.** SMEs and distributors, starting with the founder's existing website clients.
- **Unit of sale.** Monthly subscription with included orders, then per order; collections as a % of recovered amounts.
- **Price anchor.** An admin assistant on ₦150k a month handling about 30 orders a day costs **about ₦190 per order** [A]. **Our price: ₦10–25k per month including 300 orders, then ₦60–100 per order; collections at 3–5% of amounts recovered.**
- **Unit economics (estimate), about $0.02–0.04 per order, i.e. ₦30–60:** one utility template, about four service replies, Haiku-class replies and Jev decisions. Margin depends on lean template use.
- **Why an agent-native firm wins.** Reconciliation is decisions plus exact code (virtual accounts, webhooks), and humans handle exceptions only. Integrate Meta's agent at the front door rather than competing with it.
- **7-day MVP.** WhatsApp Cloud API plus Paystack, Monnify or Moniepoint virtual accounts (or bank-alert parsing). Flow: order, invoice, automatic payment match, Google Sheet or ERP, daily summary, human exception queue.
- **Jev.** Choice: intent. Noul: "payment claim verified?" Escalation.
- **LLM.** Replies in English, Pidgin and Yoruba.
- **Code.** Payment matching on amount, reference and session ID; inventory; invoice PDFs; template selection to minimise fees.

#### A4. Credit-decision explanation and contest desk
- **Problem.** Ghana names lending as high-risk, and its DP Bill requires explainable, contestable automated decisions with human oversight. Nigeria's bill targets finance ADM with audits. Lenders lack plain-language, local-language notices and a contest workflow.
- **Buyer.** Digital lenders, MFIs, BNPL providers, retail credit at banks.
- **Unit of sale.** Per adverse-action notice; per contest packet; quarterly fairness check.
- **Price anchor.** Complaint handling costs ₦5–15k each [A], plus penalty exposure. **Our price: ₦300–800 per notice, ₦3–5k per contest, $1–3k per fairness check.**
- **Why an agent-native firm wins.** Reason codes become multilingual notices; contests are triaged to a human credit officer with an evidence pack. The "AI Snake Oil" lens adds honest model validation.
- **7-day MVP.** Generate notices in four languages from scorecard or SHAP output. Take contests through WhatsApp into a review queue, and produce a monthly approval-rate disparity report.
- **Jev.** Choice: contest outcome (data error / reconsider / uphold). Noul: "notice consistent with the reasons?"
- **LLM.** Notices and letters.
- **Code.** Reason-code mapping, fairness metrics, SLA timers.

#### A5. Tender and bid-response factory
- **Problem.** SMEs and NGOs lose public and donor tenders on paperwork, and bid writing is expensive.
- **Buyer.** Contractors, consultancies, NGOs.
- **Unit of sale.** Per bid pack plus a success fee.
- **Price anchor.** A bid consultant charges ₦0.5–3M per bid [A]. **Our price: ₦150–400k plus 1–2% on success.**
- **Why an agent-native firm wins.** Extracting requirements into a compliance matrix is typed work, drafting is generation, checklists are code, and a bid manager reviews.
- **7-day MVP.** Parse three live RFPs. Produce a compliance matrix, a gap list, a draft technical proposal from the company profile, and a mandatory-documents checklist (in Nigeria, for example CAC, tax clearance, pension/ITF/NSITF and BPP registration [M]).
- **Jev.** Choice: requirement type (mandatory / scored / info). Choice: compliance status.
- **LLM.** Proposal sections.
- **Code.** Parsing, page and format limits, checklist.

#### A6. AfCFTA trade documents and HS pre-classification
- **Problem.** SMEs using AfCFTA preferences need correct HS codes, certificates of origin, and invoices and packing lists that agree with each other. Errors mean delays and duty.
- **Buyer.** Exporters, freight forwarders, clearing agents.
- **Unit of sale.** Per shipment pack; per HS classification.
- **Price anchor.** Documentation and clearing cost ₦50–300k per shipment [A]. **Our price: $10–30 per pack.**
- **Why an agent-native firm wins.** HS classification is a calibrated multi-class decision, rules-of-origin maths is code, and a licensed broker signs.
- **7-day MVP.** Extract the invoice and packing list, return the top-3 HS codes with probabilities, run a rules-of-origin checklist, and fill a certificate draft. The broker reviews.
- **Jev.** Choice: top-k HS code. Noul: "originating?"
- **LLM.** Goods descriptions.
- **Code.** Tariff tables, value-added %, forms.
- **Caveat.** AfCFTA procedures were not re-verified in this session.

#### A7. Hospitality concierge and direct-booking agent
- **Problem.** The PAAIS Smart Destination track and GTDC's wish list (24-hour enquiry response, recommendations, voice search, itineraries) point at hotels losing bookings to slow replies and OTA commissions.
- **Buyer.** Independent hotels, tour operators, destination agencies.
- **Unit of sale.** % of direct bookings, or per resolved enquiry.
- **Price anchor.** OTA commissions run about 15–25% [M]. **Our price: 3–5% of agent-assisted direct bookings.**
- **Why an agent-native firm wins.** Enquiry handling runs around the clock in several languages with humans on exceptions only, and itinerary generation is cheap LLM work.
- **7-day MVP.** A WhatsApp and email agent over the hotel's knowledge base and availability (channel-manager API or sheet), with payment links and human handoff.
- **Jev.** Choice: enquiry type (book / modify / complaint / info). Noul: upsell.
- **LLM.** Itineraries and replies.
- **Code.** Availability, rates, payment links.

#### A8. Clinical voice scribe and HMO claim pre-audit
- **Problem.** Clinicians carry a heavy documentation load; HMOs face claim errors and fraud. Intron shows consultation-to-note in under 30 seconds.
- **Buyer.** Private clinics and hospitals, HMOs.
- **Unit of sale.** Per encounter; per claim.
- **Price anchor.** Scribe or typist time, and claims-officer review [A]. **Our price: ₦200–500 per encounter; ₦150–300 per claim.**
- **Why an agent-native firm wins.** Speech APIs from Intron or Spitch plus typed coding and consistency checks, with the clinician signing every note.
- **7-day MVP.** Record, transcribe (Intron or Spitch), draft a SOAP note, suggest ICD-10 codes, and check the claim against the tariff. The clinician signs. Health data goes through the residency router (I4).
- **Jev.** Choice: ICD code. Noul: "claim consistent with note?" Score: fraud risk.
- **LLM.** SOAP note.
- **Code.** Tariff lookup, claim rules, EMR export.

#### A9. Agricultural voice advisory and farm verification
- **Problem.** Smallholders prefer voice, and aggregators and input lenders need seasonal verification.
- **Buyer.** Aggregators, input companies, MFIs, programmes.
- **Unit of sale.** Per farmer-season; per verification call.
- **Price anchor.** An extension visit costs ₦2–5k [A]. **Our price: ₦200–500 per farmer-season.**
- **Why an agent-native firm wins.** Weekly voice contact in local languages costs a fraction of a field visit, and only agronomy questions the agent is unsure about reach a human.
- **7-day MVP.** A weekly outbound IVR in Hausa or Twi for one crop, inbound Q&A, escalation to an agronomist, and logged planting-verification answers.
- **Jev.** Choice: question type. Noul: "needs an agronomist?"
- **LLM.** Phrasing from vetted content.
- **Code.** Weather API, crop calendars, telephony.

#### A10. Government service navigator (GovGuide for states and agencies)
- **Problem.** The federal government launched GovGuide with Meta, NCAIR and Publica AI. States, LGAs and agencies (tax, registries) still field repetitive queries, and Kenya's eCitizen push is similar.
- **Buyer.** State governments, agencies, SIs.
- **Unit of sale.** Setup fee plus per resolved query.
- **Price anchor.** A call-centre contact costs ₦300–1,000 [A]. **Our price: ₦50–150 per resolved query.**
- **Why an agent-native firm wins.** Knowledge-base ingestion and cited answers in four languages, with calibrated abstention. Bundle the reliability audit (I2) as the trust layer.
- **7-day MVP.** Turn one agency's service catalogue into a WhatsApp and web agent with citations and escalation, plus a weekly report of unanswered questions.
- **Jev.** Choice: intent. Noul: "answer grounded in the cited source?" Escalate.
- **LLM.** Answers.
- **Code.** Retrieval, citation links, forms.

#### A11. Website plus AI front desk, discoverable by agents
- **Problem.** The founder's SME clients need a web presence that works for people, for search, and for AI agents.
- **Buyer.** Nigerian SMEs.
- **Unit of sale.** Per site plus a monthly care plan.
- **Price anchor.** An agency site costs ₦300k–1.5M [A]. **Our price: ₦150–400k plus ₦15–30k per month.**
- **Why an agent-native firm wins.** Generate the site from the WhatsApp catalogue, and publish `llms.txt`, an agent card and optional x402-priced endpoints through `@repo/catalog`.
- **7-day MVP.** Template, catalogue-driven site, Google Business Profile, WhatsApp click-to-chat, `llms.txt`.
- **Jev.** Choice: section and layout.
- **LLM.** Copy.
- **Code.** Static build, schema.org, hosting.

### 4.4 Suggested 90-day sequence

- **Weeks 1–2**
  - A3 with existing clients for fast cash.
  - I3, since the brain is ready.
  - Publish AfroEval v0 (I1) as the research arm's first credibility asset.
- **Weeks 3–6**
  - A1 as a shadow-mode pilot with one MFB or fintech.
  - Offer I2 to two AI vendors as pre-sales evidence packs.
  - I5 on testnet, then mainnet with two API vendors.
- **Weeks 7–12**
  - A2 with a DPCO partner ahead of the next audit-return cycle.
  - Pitch I6 to a Kenyan SI.
  - Pilot I8 in Ghana, tied to the 1T-token goal.
  - Apply to next year's PAAIS masterclass with AfroEval results.

---

## 5. Princeton research and how to use it

### 5.1 What Princeton has produced, and its status

| Work | People | Substance | Status | Tag |
|---|---|---|---|---|
| **AI Agents That Matter** (2024, arXiv 2407.01502) | Kapoor, Stroebl, Siegel, Nadgir, Narayanan | Agent evaluations must be **cost-controlled**. Accuracy-only leaderboards reward expensive, brittle agents, and simple baselines (retry, warming, escalation) matched complex agents at lower cost. Benchmarks need holdouts to stop shortcuts. Downstream developers need different evaluations from model developers. Reproducibility is poor. | Foundational; the HAL README states the cost framing and cites it | V (framing), M (details) |
| **HAL: Holistic Agent Leaderboard** (ICLR 2026) | Stroebl, Kapoor, Narayanan | A third-party, cost-controlled leaderboard and harness (local, Docker or Azure VMs; Weave cost tracking; encrypted trace uploads). Benchmarks: SWE-bench Verified (Mini), USACO, AppWorld, CORE-Bench, tau-bench, SciCode, AssistantBench, ScienceAgentBench, CollaborativeAgentBench. The arXiv version (October 2025) reported about 21.7k rollouts, 9 models, 9 benchmarks and about $40k spent. Higher reasoning effort *reduced* accuracy in most runs. LLM-aided log review caught agents searching Hugging Face for benchmark answers and misusing credit cards in flight-booking tasks. | Paper published | V (README, benchmarks, citation); M (arXiv numbers) |
| **Pivot to reliability (1 July 2026)** | HAL team | The harness is archived and leaderboard results are "no longer being updated through this harness". "We are focusing our current work on agent reliability"; a Reliability Dashboard is at hal.cs.princeton.edu/reliability; "more to share soon". | Live | V |
| **Reliability framework** (code in `hal-harness/reliability_eval`; I believe the paper is "Towards a Science of AI Agent Reliability", 2026) | Princeton HAL group | Four dimensions: **Consistency** (C_out, C_traj, C_conf, C_res), **Robustness** (R_fault, R_struct, R_prompt), **Predictability** (P_rc, P_cal = 1−ECE, P_auroc, P_brier) and **Safety** (S_comp, S_harm, S_safety = 1−(1−S_comp)(1−S_harm)), plus Recovery (V_heal, V_ttr) and Abstention (A_rate, A_prec, A_rec, A_sel, A_cal). Six phases: K-repeat baseline, fault injection, prompt variation, structural perturbation, LLM-judged safety, abstention detection. Benchmarks: tau-bench airline and retail, with constraints on PII handling, destructive operations, data minimisation, policy circumvention, financial accuracy, authentication and overcommitment; plus GAIA. Models range from GPT-4o-mini to GPT-5.2/5.4, Claude 3.5 Haiku to Opus 4.5, and Gemini 2.0 Flash to 3 Pro; scaffolds include the Claude Code and Codex CLIs. A plot in the code claims "GPT 5.4 improves calibration over GPT 5.2" (on GAIA it moves from overconfident to underconfident). The paper's reported headline: capability gains have outpaced reliability gains. | Code public; dashboard live | V (code); M (title and headline) |
| **CORE-Bench** (2024) | Siegel et al. | Can agents reproduce published research code? | In HAL | V (existence); M (details) |
| **Inference Scaling fLaws** (2024) | Stroebl, Kapoor, Narayanan | Resampling against imperfect verifiers (for example unit tests) plateaus because of false positives. Better verifiers beat more samples. | Published | M |
| **AI as Normal Technology** (April 2025) | Narayanan, Kapoor | AI's impact is gated by **diffusion** (adoption, organisational change, regulation), not capability alone. High-stakes use exposes reliability gaps. Human work shifts to specifying, monitoring and controlling AI. Favours resilience over nonproliferation. | Essay plus newsletter | M |
| **AI Snake Oil** (2024) | Narayanan, Kapoor | Predictive AI in hiring, lending and welfare often fails to work as claimed | Book | M |
| **SWE-bench, SWE-agent, mini-swe-agent** | Princeton and Stanford team | SWE-bench (ICLR 2024) and SWE-bench Verified; SWE-agent (NeurIPS 2024, agent-computer interfaces). **mini-swe-agent v2**: about 100 lines, bash-only, linear history, `subprocess.run` actions, above 74% on SWE-bench Verified; used by Meta, NVIDIA, IBM and others; powers Ramp's SWE-Bench. Related: SWE-smith, SWE-ReX, CodeClash, sb-cli. **ProgramBench** (reverse-engineer a binary into fresh source) is hosted under `facebookresearch`; the mini-swe-agent docs call it "our new benchmark". | Active (repo commit 2026-09-03) | V (repo); R (ProgramBench authorship) |
| Earlier agent foundations | Princeton NLP and alumni | ReAct, Tree of Thoughts, Reflexion, WebShop, InterCode, CoALA. τ-bench came out of Sierra with Princeton alumni. | | M |
| AI for development or sustainability (2026) | n/a | **Not verified this session** (see section 8) | | n/a |

### 5.2 Six operating principles to take from Princeton

1. **Price and report per correct outcome, with cost on the axis** (from AI Agents That Matter and HAL). Every offer shows accuracy and ₦ per unit, and each workflow gets an internal cost-accuracy Pareto chart.
2. **Reliability is four numbers, not one** (from `reliability_eval`). Publish consistency, robustness, predictability and safety for each production agent. Starting SLOs [A]: C_out ≥ 0.9, R_fault ≥ 0.8, P_cal ≥ 0.9, S_safety ≥ 0.95.
3. **Calibration is the business model.** Human-review cost = (1 − coverage) × review cost per item. Coverage is set by the threshold at which selective accuracy (A_sel) meets the SLA. P_rc, P_auroc and A_sel are exactly the metrics needed to tune the brain's thresholds (read 0.50 through irreversible 0.95) and to justify its `UNCALIBRATED_PENALTY` for LLM self-reported confidence.
4. **Verifiers bound automation** (from Inference Scaling fLaws). Spend engineering on exact-code verifiers (payment matching, sanctions lists, schema checks, unit tests) instead of resampling LLMs.
5. **Simple scaffolds and complete logs** (from mini-swe-agent and HAL's log inspection). Keep histories linear, log model versions, and run weekly LLM-aided forensics on the logs to catch shortcuts and policy violations.
6. **Diffusion is the bottleneck** (from AI as Normal Technology). The moat in Africa is integration, compliance evidence and change management inside institutions, not access to models.

### 5.3 Productisation map

| Princeton artifact | Our product | Buyer | First step |
|---|---|---|---|
| HAL cost-controlled leaderboard | **AfroEval** (I1) | Model builders, deployers, funders | v0 with N-ATLaS, Sunflower and two frontier models; cost per correct answer |
| `reliability_eval` phases and metrics | **Agent Reliability Audit** (I2) | Banks, MMOs, agencies, AI vendors | Port the formulas; add NIN/BVN PII checks and naira-amount accuracy |
| Fault injection | **"Outage drills" for agents** (part of I2) | Fintechs, telcos | Inject NIBSS or PSP timeouts, power loss and network flaps; report R_fault, V_heal, V_ttr |
| LLM log analyser | **Trace forensics** add-on | Any deployer | Weekly anomaly and violation report |
| mini-swe-agent | **API-wrapping factory** (I6) and internal coding agents | MDAs, banks | Wrap 20 endpoints in a week |
| SWE-bench method | **SWE-bench-Africa**: tasks mined from African open source (payment SDKs, Celo repos) | Screening 3MTT graduates; coding-agent vendors | 50 tasks with tests from public repos |
| tau-bench-style tasks | Customer-service tasks for banking, mobile money and telcos in Pidgin, Yoruba, Hausa, Twi and Swahili | A Princeton collaboration; vendors | Offer as an African extension to the Reliability Dashboard |

### 5.4 What's coming from Princeton, and how to position

- **Near term.** Expect reliability-first outputs: the dashboard is live and a successor platform or paper is signalled ("more to share soon"). The open reliability code is enough to build on today; there is no need to wait.
- **Opportunity.** Propose an **African extension**: task suites in local languages, native-speaker validation, and local compliance constraints (NDPA, the Ghana DP Bill, CBN). That gives the research arm a credible partnership and gives the audit business a moat.
- **Watch for.** Cost-normalised reliability scores, certification criteria for agents, and policy guidance that African regulators could cite. Nigeria's bill anticipates "accredited AI auditors", so being early and methodologically aligned with Princeton is a positioning advantage.

---

## 6. Research agenda for the AI research arm (10 topics, each with a blog-post title)

| # | Blog-post title | Question and method | Feeds |
|---|---|---|---|
| 1 | **"Does your bank's AI still work in Pidgin? A reliability benchmark for African customer-service agents"** | tau-bench-style banking, mobile-money and telco tasks in English, Pidgin, Yoruba, Hausa, Twi and Swahili. Measure C_out, R_prompt (code-switch perturbations), P_cal, and S_comp (NIN/BVN leakage). | I1, I2 |
| 2 | **"Cost per correct answer: ranking African-language models on a budget"** | A HAL-style cost-accuracy Pareto: N-ATLaS, Sunflower, UlizaLlama and InkubaLM against frontier and open models on IrokoBench, MasakhaNEWS and WAXAL ASR slices | I1 |
| 3 | **"How much human review does an agent-native company need? Risk-coverage curves from production"** | Coverage against selective accuracy by risk tier; calibrated Jev against LLM self-reported confidence | Brain policy, pricing |
| 4 | **"Decide, don't generate: typed decisions versus LLMs on 1M African enterprise decisions"** | Decision Router data: agreement, calibration, cost ratio | I3 |
| 5 | **"NEPA-proof agents: fault-injection results under African infrastructure conditions"** | R_fault, V_heal and V_ttr under timeouts, PSP downtime and flaky networks | I2 |
| 6 | **"Names, numbers and naira: where speech AI breaks on African entities"** | Error rates on amounts, account numbers and names across ASR and LLM stacks, and what they mean for voice payments | I7, A3 |
| 7 | **"The hallucinated-citation audit: checking AI-drafted policy before it embarrasses a ministry"** | A citation-verification tool and error rates by model, motivated by South Africa's withdrawn policy | A10, I2 |
| 8 | **"Paying agents in naira: x402 micropayments with Mento stablecoins on Celo"** | Latency, fees, failure modes and price elasticity for per-call APIs, compared with cards and PSPs | I5 |
| 9 | **"From API inventory to agent-ready government: an agent-readiness index for African public services"** | Score endpoints on authentication, idempotency, PII and rate limits for sample Kenyan and Nigerian services | I6, A10 |
| 10 | **"Can AI clear AML alerts safely? A shadow-mode study with Nigerian financial institutions"** | Precision, recall and selective accuracy against analysts; STR quality ratings | A1 |

**Six-week syllabus for the global AI study group.** This doubles as a reviewer-training funnel.

| Week | Reading or hands-on work |
|---|---|
| 1 | *AI Agents That Matter* |
| 2 | HAL, plus running `reliability_eval` on a small agent |
| 3 | *AI as Normal Technology* |
| 4 | SWE-bench and mini-swe-agent (hands-on) |
| 5 | African NLP: IrokoBench, WAXAL, N-ATLaS |
| 6 | x402 and agent payments on Celo; capstone is a mini AfroEval suite |

---

## 7. Sources (URLs)

**Summit (PAAIS 2026, the 2025 edition, One Vecta)**
- https://panafricanaisummit.com/ (official; fetch blocked by the proxy, content seen through search) · https://panafricanaisummit.com/our-story · https://panafricanaisummit.com/opata · https://panafricanaisummit.com/emmanuel · https://panafricanaisummit.com/prof · https://panafricanaisummit.com/sponsor-registration · https://panafricanaisummit.com/public/exhibition
- https://www.ghanabusinessnews.com/2026/09/23/ghana-government-to-regulate-ai-risks-without-stifling-innovation-minister/
- https://www.myjoyonline.com/data-protection-boss-calls-for-connected-regulators-to-tackle-big-tech-power/ · http://www.businessghana.com/site/news/general/356747/Data-Protection-boss-calls-for-connected-regulators-to-tackle-big-tech-power-
- https://thebftonline.com/2025/12/15/pan-african-ai-summit-returns-to-accra-in-2026/
- https://gna.org.gh/2026/04/ghana-to-host-pan-african-ai-summit-in-september/
- https://gna.org.gh/2026/04/pan-african-ai-summit-communications-minister-to-speak-on-data-governance-ethical-ai/
- https://gna.org.gh/2026/01/paais-2026-targets-jobs-enterprise-ownership-as-africa-repositions-youth-for-ai-driven-growth/
- https://gna.org.gh/2026/06/estonian-investors-join-pan-african-ai-summit-to-support-africas-startups/
- https://www.myjoyonline.com/estonian-business-angels-network-partners-with-pan-african-ai-summit-2026/
- https://thebftonline.com/2026/06/18/estonian-business-angels-network-joins-pan-african-ai-summit-to-accelerate-investment-in-africas-emerging-ai-startups/
- https://www.myjoyonline.com/smart-africa-chief-lacina-kone-to-speak-at-pan-african-ai-summit-2026-in-accra-2/ · https://www.graphic.com.gh/tech-news/smart-africa-chief-lacina-kone-to-headline-pan-african-ai-summit-in-accra.html · https://allafrica.com/stories/202607220732.html
- https://www.myjoyonline.com/africas-ai-gap-isnt-talent-its-the-door/ · https://www.myjoyonline.com/in-the-era-of-ai-what-does-africa-build-when-everyone-can-get-in/
- https://thebftonline.com/2026/05/08/3i-africa-made-ai-the-headline-pan-african-ai-summit-makes-it-the-agenda/
- https://thebftonline.com/2026/02/16/the-accra-mandate-securing-africas-ai-future-through-local-data-and-ethical-governance/
- https://www.newsghana.com.gh/accra-becomes-africa-ai-diplomacy-hub-this-september/ · https://www.newsghana.com.gh/ghanas-ai-summit-drive-puts-sovereign-data-in-focus/ · https://www.newsghana.com.gh/pan-african-ai-summit-returns-to-accra/
- https://www.myjoyonline.com/pan-african-ai-summit-2026-to-pivot-africa-as-a-smart-destination/ · https://atta.travel/resource/tourism-to-take-centre-stage-at-pan-african-ai-summit-2026.html · https://travelnoire.com/pan-african-ai-and-innovation-summit-2026-travel-tourism
- https://www.ghanabusinessnews.com/2026/09/26/ai-must-enhance-human-capability-not-replace-people-in-tourism-prof-mensah/
- https://mpetusglobal.com/the-1st-pan-african-ai-summit-2025-paais/ · https://panafricanaisummitsandtraining.com/about-us/ · https://fliphtml5.com/PanAfricanAISummit/ocsk/1st-Pan-African-AI-Summit-PAAIS_BOOKLET/
- https://www.eventbrite.co.uk/e/pan-african-ai-innovation-summit-tickets-1974502713769
- https://github.com/Audran-wol/Avert
- One Vecta: https://onevectasummit.com/ · https://www.myjoyonline.com/ghana-to-host-one-vecta-ai-summit-2026/ · https://techlabari.com/one-vecta-ai-summit-2026-building-practical-ai-systems-that-solve-africas-biggest-challenges/ · https://www.myjoyonline.com/ghana-opens-continental-ai-hackathon-as-accra-positions-itself-at-the-centre-of-africas-push-from-ai-ambition-to-execution-2/ · https://asaaseradio.com/sam-george-pushes-250m-ai-drive-eyes-accra-as-africas-tech-hub-ahead-of-one-vecta-summit/

**Ghana policy**
- https://moc.gov.gh/2026/04/24/ghana-launches-national-ai-strategy-to-drive-digital-transformation-and-economic-growth/ · https://www.citinewsroom.com/2026/04/mahama-launches-ghanas-national-ai-strategy-in-accra/ · https://www.modernghana.com/news/1482906/cabinet-approves-250million-ai-centre-strategy.html
- https://gna.org.gh/2026/03/govt-to-introduce-new-data-protection-bill-to-regulate-ai-cross-border-data-flows/ · https://www.telecomschamber.org/industry-news/ghana-to-regulate-ai-and-deepfakes-under-new-data-protection-bill/

**Compute and cloud**
- https://www.cassavatechnologies.com/cassava-scales-african-ai-infrastructure-with-nvidia-powered-ai-factories-to-accelerate-sovereign-data-capabilities/ · https://techmoran.com/2026/03/19/cassava-technologies-deploys-nvidia-powered-ai-factory-in-south-africa-plans-kenya-nigeria-egypt-launch/ · https://www.billionaires.africa/2026/05/04/zimbabwean-billionaire-strive-masiyiwas-cassava-plans-20mw-joburg-ai-factory-as-cape-town-goes-live/ · https://www.connectingafrica.com/ai/cassava-deploys-ai-factory-in-sa-more-countries-in-the-pipeline
- https://www.bloomberg.com/news/articles/2026-08-27/uae-tycoon-al-ashram-mtn-agree-to-build-africa-ai-data-centers · https://capacityglobal.com/news/mtn-targets-150mw-of-ai-data-centre-capacity/ · https://businessday.ng/technology/article/mtn-dubai-tycoon-strike-deal-to-build-6bn-ai-data-centre-network-across-africa/ · https://iafrica.com/mtn-plans-to-turn-its-african-tower-network-into-a-distributed-ai-compute-grid/
- https://www.datacenterdynamics.com/en/product-news/nxtra-by-airtel-africa-powering-nigerias-digital-future-from-the-heart-of-eko-atlantic/ · https://brandcom.ng/2026/02/04/nigerias-data-game-levels-up-as-airtel-launches-nxtra-data-centre/ · https://aireports.africa/2026/01/21/nigerias-ai-data-center-revolution-a-billion-dollar-bet-on-africas-digital-future/
- https://www.datacenterdynamics.com/en/news/rack-centre-launches-12mw-data-center-in-lagos-nigeria/
- https://www.raxiogroup.com/raxio-tops-us380-million-in-committed-capital-as-roha-and-meridiam-boost-stakes-amid-sixfold-growth-surge-for-its-african-data-centres/ · https://techafricanews.com/2026/07/14/raxio-secures-over-us380-million-to-accelerate-africa-data-centre-expansion/
- https://www.thinkgeoenergy.com/kenya-suspends-plans-for-microsofts-geothermal-powered-data-centre/ · https://khusoko.com/2026/05/08/kenya-microsoft-g42-data-centre-suspended-power-capacity/
- https://restofworld.org/2025/aws-google-cloud-nigeria-alternatives/ · https://www.datacenterdynamics.com/en/news/oracle-plans-cloud-region-in-nairobi-kenya/
- https://nairametrics.com/2026/08/05/nitda-signs-sovereign-cloud-framework-to-boost-ai-data-centre-investment/ · https://von.gov.ng/nigeria-pushes-sovereign-ai-agenda-at-gitex-2026/

**Nigeria policy, finance and government**
- https://oecd.ai/en/dashboards/policy-initiatives/national-artificial-intelligence-strategy-nais · https://tunanihq.org/assets/publication/Policy-Brief-NNAIS-Strategy-final.pdf · https://ncair.nitda.gov.ng/naic/
- https://www.bloomberg.com/news/articles/2026-01-13/nigeria-set-to-pass-sweeping-ai-rules-for-digital-economy · https://iapp.org/news/a/nigeria-moves-toward-comprehensive-ai-regulation · https://www.thisdaylive.com/2026/07/09/national-digital-economy-and-e-governance-act-2026-ready-in-weeks/
- https://oal.law/ndpc-extends-2025-data-protection-audit-return-deadline-to-30-may-2026/ · https://privacymatters.dlapiper.com/2025/06/nigeria-ndpc-issues-gaid-key-compliance-insights/
- https://techcabal.com/2026/03/12/cbn-wants-ai-to-fight-money-laundering/ · https://techafricanews.com/2026/03/12/cbn-mandates-automated-aml-systems-across-nigerian-financial-institutions/ · https://techeconomy.ng/cbn-ai-anti-money-laundering-rules-banks-fintechs-nigeria/
- https://techcabal.com/2025/10/07/cbn-bans-agents-owning-multiple-moniepoint-opay-palmpay-terminals/
- https://fmcide.gov.ng/fmcide-and-meta-launch-govguide-nigeria-an-ai-powered-government-services-chatbot/ · https://africanarguments.org/2026/09/nigeria-is-building-an-ai-economy-who-will-protect-nigerians-when-the-algorithms-get-it-wrong/

**AU, Kenya, Rwanda, South Africa and the language coalition**
- https://au.int/en/documents/20240809/continental-artificial-intelligence-strategy · https://babl.ai/african-leaders-sign-landmark-ai-declaration-in-kigali-pledge-60-billion-fund/ · https://www.newsghana.com.gh/africas-us60-billion-ai-dream-confronts-governance-reality/ · https://smartafrica.org/announcing-the-establishment-of-the-africa-ai-council-to-propel-continental-competitiveness-through-global-collaboration/
- https://www.ict.go.ke/sites/default/files/2025-12/Kenya%20National%20AI%20Strategy%202025-2030%20Implementation%20Roadmap.pdf · https://techtrendske.co.ke/2026/09/23/kenya-ai-agents-government-integration/ · https://techtrendske.co.ke/2026/09/23/state-plans-unified-platform-to-link-government-systems/ · https://techweez.com/2026/09/23/kenya-digital-transformation-backend-interoperability/
- https://www.minict.gov.rw/ai-policy · https://en.webrwanda.com/2026/09/rwanda-joins-global-push-to-bring-ai-to.html
- https://en.wikipedia.org/wiki/Draft_South_Africa_National_Artificial_Intelligence_(AI)_Policy_2026 · https://www.gov.za/sites/default/files/gcis_document/202604/54477gen3880.pdf
- https://www.gatesfoundation.org/ideas/media-center/press-releases/2026/09/ai-language-partnership

**Models, datasets and language tech**
- https://huggingface.co/NCAIR1/N-ATLaS · https://techcabal.com/2025/09/25/nigerian-government-awarri-launch-n-atlas/ · https://fmcide.gov.ng/nigeria-launches-landmark-ai-model-powered-by-awarri-to-advance-languages-and-ai-at-scale/
- https://techcabal.com/2026/03/05/intron-expands-sahara-to-57-languages/ · https://techafricanews.com/2026/03/09/intron-launches-sahara-v2-advancing-african-speech-recognition/
- https://iafrica.com/cencori-and-spitch-partner-to-give-african-developers-yoruba-hausa-igbo-and-amharic-voice-ai-through-one-api/ · https://www.connectingafrica.com/ai/hot-startup-of-the-month-nigeria-s-cencori
- https://lelapa.ai/the-future-of-ai-is-resource-efficient-and-were-building-it/ · https://translation.ghananlp.org/ · https://ghananlp.org/
- https://jacarandahealth.org/jacaranda-launches-open-source-llm-in-five-african-languages/ · https://huggingface.co/Jacaranda/UlizaLlama
- https://sunflower.sunbird.ai/ · https://huggingface.co/Sunbird/Sunflower-Qwen3.8-27B
- https://huggingface.co/masakhane · https://arxiv.org/html/2406.03368v1
- https://research.google/blog/waxal-a-large-scale-open-resource-for-african-language-speech-technology/ · https://arxiv.org/abs/2602.02734 · https://huggingface.co/datasets/google/WaxalNLP
- https://x.com/GatesAfrica/status/1994768311985336582 · https://huggingface.co/datasets/dsfsi-anv/za-african-next-voices · https://equalyz.ai/

**Funding, applications and channels**
- https://techcabal.com/2026/07/03/1-44-billion-raised-in-the-first-half-of-2026/ · https://techround.co.uk/business/inside-the-3-3-billion-funding-spike-transforming-african-tech-infrastructure/ · https://businessday.ng/technology/article/african-ai-startups-exist-but-few-are-getting-the-first-100000/
- https://iafrica.com/atlantica-ventures-has-backed-four-african-ai-infrastructure-startups-in-18-months-none-of-them-build-models/ · https://launchbaseafrica.com/2026/09/03/atlantica-ventures/
- https://www.bloomberg.com/news/articles/2026-05-14/africa-e-commerce-giant-jumia-to-cut-workforce-due-to-ai · https://thenextweb.com/news/jumia-ai-layoffs-profitability-africa-ecommerce · https://technext24.com/reviews/10-ai-driven-layoff-in-h1-2026-and-why/
- https://techcrunch.com/2026/06/03/metas-ai-agent-for-whatsapp-business-is-now-available-globally/ · https://innovation-village.com/whatsapp-now-has-an-ai-business-agent-here-is-what-african-smes-need-to-know/ · https://whatsappbusiness.com/products/platform-pricing/ · https://ominiflow.com/whatsapp-api-pricing/nigeria
- https://techafricanews.com/2026/01/15/leveraging-ai-to-bypass-the-smartphone-barrier-and-advance-digital-inclusion-in-africa/ · https://avodagroup.org/voice-ai-africa-waxal-low-literacy/

**Talent**
- https://3mtt.nitda.gov.ng/ · https://businessday.ng/technology/article/explainer-nigerias-ai-race-is-becoming-a-talent-race/ · https://technext24.com/2026/05/08/over-20000-3mtt-fellows-to-benefit-from/ · https://fmcide.gov.ng/3mtt-nigeria-and-microsoft-deepen-alliance-to-build-nigerias-future-tech-workforce/

**Princeton and agent research (primary sources read in cloned repos)**
- https://github.com/princeton-pli/hal-harness (read at commit 16bb03e, 2026-07-01: README, `reliability_eval/README.md`, `reliability_eval/reliability_evaluation_changes.md`, `analyze_reliability.py`, `plots/social.py`, `hal/utils/compliance_checkers.py`)
- https://hal.cs.princeton.edu/ · https://hal.cs.princeton.edu/reliability/
- https://arxiv.org/abs/2407.01502 (AI Agents That Matter; cited in the HAL README) · https://arxiv.org/abs/2409.11363 (CORE-Bench; cited in the HAL README) · https://arxiv.org/abs/2510.11977 (HAL arXiv; from memory, fetch blocked)
- https://github.com/SWE-agent/mini-swe-agent (read at commit of 2026-09-03) · https://github.com/swe-bench/SWE-bench · https://swe-agent.com · https://github.com/facebookresearch/programbench
- https://knightcolumbia.org/content/ai-as-normal-technology (from memory)

**x402 and Celo (primary sources read in cloned repos)**
- https://github.com/coinbase/x402 (development fork, commit of 2026-04-21: `README.md`, `specs/schemes/upto`, `typescript/packages/mechanisms/evm/src/shared/defaultAssets.ts`) · https://github.com/x402-foundation/x402
- https://github.com/mento-protocol/mento-sdk (commit of 2026-09-15: `src/cache/tokens.ts`, `src/cache/routes.ts`)

---

## 8. Unverified notes

1. **Summit outcomes.** Actual PAAIS attendance, which speakers actually appeared (beyond the minister and Dr Kavaarpuo), Hack-AI-Thon and EstBAN winners, and any communiqué had not been published by 26 September. Recheck GNA, MyJoyOnline and B&FT during the week of 28 September.
2. **Organiser lineage.** It is unclear whether AlphaVecta (2025 edition; One Vecta in 2026) and PACT (PAAIS 2026) split, rebranded, or run as sister events. Felix Donkor is linked to the 2025 booklet, which suggests continuity. Clarify before approaching either as a partner.
3. **"Accra Mandate".** This is op-ed branding; I found no signed document.
4. **Ghana figures.** Reports give the compute budget as either $250M plus $20M or "$270M up front". The 1T-token and 300k-trainees targets come from a single outlet; check them against the strategy document.
5. **Nigeria's Digital Economy & E-Governance Bill.** In July 2026 it was reported "ready in weeks"; I could not confirm passage or presidential assent.
6. **MTN.** The "$6bn" figure is a headline number; MTN's own disclosure cites 150MW. Cassava's GPU count and go-live dates come from press reports.
7. **WhatsApp rules and prices.** The Nigeria rates, the 1 October 2026 service-message charges and the January 2026 general-purpose chatbot restriction come from third-party guides and TechCrunch. Confirm on Meta's pricing and policy pages.
8. **Vendor statistics.** "78% of Sub-Saharan SMEs use WhatsApp as their primary sales channel", "$1.4T mobile money", "$33.7B social commerce", Intron's "up to 64%" and Sunbird's "matches Gemini 3.1 Pro" are all vendor or self-reported claims.
9. **Princeton from memory (arXiv blocked).** The HAL arXiv numbers (21,730 rollouts, about $40k, 2.5B tokens of logs, the reasoning-effort finding, the Hugging Face search and credit-card behaviours) are recalled rather than re-read, as are the reliability paper's title ("Towards a Science of AI Agent Reliability") and its headline finding. The code-level facts are verified: archival, dimensions, formulas, benchmarks, models, and the GPT-5.2 vs 5.4 calibration plot.
10. **ProgramBench authorship.** It is hosted under `facebookresearch`, and the SWE-agent docs call it "our new benchmark"; the exact split of authorship is not verified.
11. **x402 on Celo.** I checked the `coinbase/x402` development fork (last commit 2026-04-21). The `x402-foundation/x402` repo may have added Celo since. Before building, verify EIP-3009 or Permit2 compatibility for Celo USDC and the Mento tokens.
12. **Details from memory.** Paystack fees, OTA commission ranges, the NFIU's use of goAML, whether NDPA audit returns must be filed through a licensed DPCO, and BPP bid documents all come from memory.
13. **Price anchors.** Every [A] anchor is an assumption, including the ₦1,500/$ planning rate. Validate each solution with at least five buyer interviews before publishing prices in `@repo/catalog`.
14. **Princeton and AI for development.** I verified no 2026 Princeton work specifically on AI for development or sustainability, because the search budget ran out. Check CITP, Princeton Language and Intelligence, and the Andlinger Center (data-centre energy) directly.
15. **Not re-verified.** Deep Learning Indaba 2026 venue and dates, the AfCFTA Digital Trade Protocol annex status, PAPSS usage, and the Ghana One Million Coders progress to date.
16. **Hack-AI-Thon repo.** The "Avert" attribution to the PAAIS Hack-AI-Thon comes from a search snippet; I did not open the repo.
17. **South Africa's withdrawal.** The account of the draft AI policy being withdrawn over hallucinated citations comes from Wikipedia and press; confirm with a DCDT statement before citing it in client material.
