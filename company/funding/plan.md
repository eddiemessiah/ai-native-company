# Funding plan (Oct–Dec 2026)

Full research, sources and application outlines are in `research/funding.md`. This page is the action list.

## What Prezenti and the Frontier pool are

- **Prezenti** runs Celo's community-governed direct-grants program, paid from the Celo Community Treasury in **USDm**.
  - Grants are one-off and milestone-based: **20% on contract, 80% on delivery**, with KYC and a 4-month delivery window.
  - Season 3 applications close in **December 2026** (listed as 29 Dec). Confirm directly that the round is open; one snapshot of the site said both "open" and "concluded".
- **The Frontier pool** is the open, rolling pool for **AI and agent-economy infrastructure on Celo**.
  - 45,000 USDm, **capped at 15,000 per grant**, roughly 3 grants; decisions in 2–4 weeks.
  - In Season 2, 34 teams applied and 2 were funded, so **apply early**.
  - Eligibility asks for Celo mainnet activity, **ERC-8004 registration**, a **Self Protocol Agent ID** and verifiable on-chain activity.

## Our Frontier application: "Omni402: pay-per-call and trust rails for Celo agents"

**Ask: 12,000 USDm over 4 months.** Omni402 (x402 gateway, buyer SDK, ERC-8004 CLI, MCP server, dashboard) plus Verdict (reputation written to the ERC-8004 Reputation Registry). The full form answers, milestones, budget and KPIs are in `research/funding.md` §4.1.

### Gaps to close before submitting (target: submit Oct 6–10)

- [ ] Message @prezenti_grants: confirm Frontier is open and how much is left; ask whether a Nigerian entity can sign.
- [ ] **Fix Omni402's payment ordering.** Settle only after the upstream call succeeds (today it charges first), and remove the fallback mode that serves content without settling.
- [ ] Add an MIT licence to `omni402` and `relay-verdict`; tag v1.0.0; add repo topics.
- [ ] **Remove the relay-verdict "swarm"** that pays its own treasury in a loop. It inflates volume, breaks hackathon rules, and would poison the ERC-8004 reputation this application is built on.
- [ ] Self Agent ID (app.ai.self.xyz), using the wallet that owns ERC-8004 agent #9765.
- [ ] Fix `agent.json` endpoints (live MCP and x402 URLs), then re-validate on 8004scan.
- [ ] ERC-8021 attribution tag on every settlement.
- [ ] KarmaGAP profile with the four milestones.
- [ ] Company registration for the contract and KYC.
- [ ] A 2–3 minute demo: wrap an API → an agent pays → Celoscan receipt → Verdict score.

## Everything else, in priority order

| # | Opportunity | Value | Do it by |
|---|---|---|---|
| 1 | Prezenti Frontier (above) | 12,000 USDm | Submit Oct 6–10 |
| 2 | Cloud credits: Cloudflare $5K, Microsoft $5K, Google $2K, AWS $1K | ~$13K in credits | Oct 3, after incorporation |
| 3 | Anthropic Claude for Startups | ~$5K in credits | Oct 3, after incorporation |
| 4 | Celo Devs agent hackathons (Q4) | ~$1–5K pools | When announced |
| 5 | Sandbox Africa Hackathon 2026 | ₦10M pool | Oct 15 |
| 6 | Open Agent Hackathon 2026 | up to $20K pool | Register by Oct 5; build Oct 15–20 |
| 7 | Long shots: YC W2027 (Nov 2), a16z speedrun (Oct 12–Nov 1), Celo Builder Fund (only with traction), TEF (opens Jan 1) | — | — |

## Prezenti Boost: read this before you pursue it

Boost (3–5K USDm) is **invite-only, and the nominations come from Celo Core Co.'s DevRel & Growth team**. That's the team you work with as Regional Ambassador. Asking your own team to nominate your own company is a conflict of interest, even if the product (Ajo Circle) is good.

**Recommendation: skip Boost this season.** The alternative is full written disclosure to Prezenti and the DevRel lead, recusal from any discussion of the nomination, and a decision made entirely by people with no reporting line to you. Frontier is open and independently judged, so put the effort there. See `ops/conflicts-of-interest.md`.

## Referrals instead of applications

Prezenti's **AI Builder Sponsorship** (AI tools for builders from *outside* Celo) closed its public round on Sept 24 and is aimed at newcomers. You're more valuable here as a **referrer**: send it strong study-group graduates who are new to Celo.
