---
title: We read company-brain's source. Here's what a multiplayer AI teammate actually runs on.
description: Supermemory open-sourced its company brain. The blog describes 0–100 triage scores; the code runs on a Haiku text reply and per-channel budgets. Both are instructive, and a System One model fits exactly between them.
date: 2026-09-22
tags: [company brain, jev, harness, teardown]
---

Supermemory discontinued its company-brain product and open-sourced the harness under Apache-2.0: one Cloudflare Durable Object per organization, Slack as the surface, Supermemory as memory. We cloned it and read it line by line, because we deploy AI teammates for clients and wanted to know what really keeps one polite.

## What the blog says vs what the code does

The launch blog describes a triage model that scores every message 0–100 on usefulness, confidence, urgency, noise, interruption cost, investigation value and reaction fit, then feeds those into a deterministic evaluator.

**The code has no such scores.** Triage is a Haiku 4.5 call that answers in text: `ANSWER | ACK | INVESTIGATE | PASS`, plus priority, effort, an emoji and a reason. Any parse failure means silence. The deterministic layer is budgets, not thresholds:

- **Per-channel caps:** 12 replies an hour, 3 minutes between normal replies, 15 minutes of quiet before a low-value one.
- **Investigations:** at most 2 at once, and 6 an hour.
- **Reactions:** capped at 30 an hour.

That's not a criticism. Budgets are a very good way to keep a bot from getting annoying. But it's a gap between the story and the system, and it's exactly where a System One model helps.

## The pieces worth stealing

- **Silence is a valid outcome.** An investigation that finds nothing posts nothing.
- **A newer message can replace the request.** A gate decides whether a follow-up should be ignored, appended, or treated as a replacement. Only the person who asked can stop a turn.
- **Approvals are checkpoints, not a second agent.** A consequential tool call pauses the turn with its state saved; an Approve click resumes the same reasoning with the decision recorded.
- **Step budgets are active controls.** At the limit minus three, the model is warned. At the limit minus one, every tool except "finish" is removed, so the agent must answer with what it has instead of launching one more search.
- **Memory is scoped by audience.** There are three scopes: org-shared, per-channel and per-user. One catch: those tags are global inside a memory account, so every customer needs their own account.

## Where Jev fits

Three model calls in the harness return a choice, not prose: triage, the active-turn gate, and the approval classifier. We ported all three to typed questions:

- **Triage: 18 questions in one call.** A route choice, an addressee choice, a priority, an emoji, and the seven 0–100 dimensions the blog promised, now real, each a five-level `Score`. A deterministic evaluator then runs in three proactivity modes: reserved, proactive and eager.
- **Turn gate.** One `Choice` over ignore, append, replace and stop, including "abeg stop am", plus a `Noul` for corrected details.
- **Approval.** An asymmetric gate. The only dangerous mistake is calling a write a read, so a read must be *proven*: 0.9 confidence, 0.95 combined probability of read-or-metadata, and near-zero probabilities that the call changes state or reaches people. Anything else pauses for a person.

Anything the typed model isn't sure about returns "LLM" and falls back to the harness's existing path, so you can roll it out in shadow mode first.

**On cost:** triage drops from roughly half a cent per message to about two-hundredths of a cent. For a 30-person team that's $40–50 a month on the default setup, and up to about $280 on setups where every "cheap" call silently runs on a flagship model.

## If you deploy it for a client

- **Lock `/setup` behind Cloudflare Access before anything else.** Until the owner signs in, whoever signs in first owns the deployment.
- **Rebrand the prompts.** They say "You are Supermemory".
- **Budget honestly.** Expect about $150–300 a month in model and infrastructure costs for a 30-person team, billed to the client's own accounts, plus your care fee.
- **Check the channel's rules.** For WhatsApp, check Meta's policy on general-purpose AI chatbots before promising a WhatsApp teammate. The Slack integration is about 21,700 lines, so a WhatsApp adapter is weeks of work, not days.

We now offer this as a service: [Company Brain](/directory/company-brain). The decision core is open in our brain package as the `teammate` recipe.
