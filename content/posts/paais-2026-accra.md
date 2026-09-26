---
title: What we took home from the Pan-African AI Summit in Accra
description: PAAIS 2026 wasn't about whether Africa belongs at the AI table. It was about evidence: regulators want proof of control, and that proof is something a firm can build and sell.
date: 2026-09-25
tags: [africa, policy, summit, enterprise]
---

The Pan African AI & Innovation Summit ran on 22–23 September at the Kempinski Hotel Gold Coast City in Accra, convened by Felix Donkor with Ghana's communications and youth ministries. Seats were free, "underwritten rather than sold". The framing was delivery, not awareness: jobs, startup formation, and who owns the IP.

Here's what we heard, what we think it means, and what we're building because of it.

## 1. Regulation is turning into a demand for evidence

Ghana's minister for communications, Sam George, gave the line of the week in his virtual opening: **"We will regulate risks and harms, not curiosity."** Students experimenting sit in one tier; AI "used in lending and other critical decisions" sits in another.

Around the room, the same shift was visible across the region:

- **Nigeria.** The CBN's automated anti-money-laundering standards give banks and fintechs an 18–24 month window. The pending Digital Economy & E-Governance Bill would bring accredited AI auditors and annual audits for automated decisions in finance.
- **Ghana.** The Data Protection Bill, announced in March, requires automated decisions to be explainable, contestable and subject to human oversight.
- **South Africa.** A draft national AI policy was withdrawn over citations that turned out to be AI-hallucinated.

Our read: **proof of control is becoming a product.** Every agent we ship now carries a decision log (provider, model version, probabilities, confidence, who approved), and we're selling two things directly off the back of it:

- **An Agent Reliability Audit.** Consistency across repeated runs, robustness to reworded and adversarial inputs, calibration of confidence, and safety checks for data leaks and destructive actions.
- **AML Alert Triage.** Alerts scored and closed or escalated, with suspicious-transaction report drafts, where an analyst approves every filing.

## 2. Sovereignty, but not by owning GPUs

Ghana's data protection chief, Dr Arnold Kavaarpuo, argued that no single regulator can govern companies whose power spans cloud, identity, payments and AI models; African regulators have to connect. Compute is arriving in pieces (Cassava's NVIDIA "AI factory", Nxtra's 38 MW Lagos site, MTN's data-centre plans), while flagship projects like Microsoft and G42's Kenya build have stalled over power.

For a firm our size the play isn't GPUs. It's **routing, residency and reliability**: knowing which model a decision went to, where the data went, and whether the answer can be trusted.

## 3. Language and voice are the way in

The data gap is closing fast. Google's WAXAL speech data, Nigeria's N-ATLaS model and a 60-organisation language coalition announced in New York on 21 September all point the same way. What's still missing is **evaluation**: does your agent actually work in Pidgin, Yoruba, Hausa, Igbo, Swahili or Twi, in code-switched, voice-first, WhatsApp-first conversations?

That's why we're building **AfroEval**: native-speaker task suites that report accuracy per dollar, not just accuracy.

## 4. The "what's Princeton saying" question

Several people asked what academic agent research means for builders here. Princeton's answer changed this year: the team behind HAL, the Holistic Agent Leaderboard, archived the harness in July and now focuses on **agent reliability**: consistency, robustness, predictability and safety. That's the right frame for regulated African buyers. Leaderboard scores don't get you through a CBN examination; a reproducible reliability report might.

## 5. Youth access, and who reviews the machines

Free seats, mentorship labs and national training programmes all point at the same resource: a generation of people who can **run and review** agents. AI-native services need exactly that: a small team handling the parts that still need a person. So our AI Study Group is now the talent funnel for the firm. Builder-certified members get paid work on our review layers and agent sprints.

## What we're doing next

- Reliability audits and AML triage for fintechs facing the CBN deadline.
- AfroEval task suites, starting with Nigerian Pidgin and Yoruba.
- Study-group chapters starting in the cities where we've already run workshops, then Accra.

No declaration or fund had been announced by the time we wrote this. If one lands, we'll update this post.

*Sources: Ghana News Agency, MyJoyOnline, B&FT and other outlets covering 22–23 September; details and links in our research notes. Items we could not verify are marked there.*
