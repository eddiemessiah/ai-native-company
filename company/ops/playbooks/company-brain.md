# Playbook: Company Brain

**Unit:** one deployed brain for one organization, plus monthly care. **Price:** $3,500 setup + $900/month (SMEs: ₦1.2M + ₦300k/month). The client's model and infrastructure costs (~$150–300/month for 30 people) are billed to their own accounts. **Turnaround:** 7 days to first answers.

Read the teardown first: `research/company-brain.md`. It has the architecture, file paths, costs and every risk below.

## Before signing
- Confirm the channel. Slack works today. WhatsApp and Telegram adapters are weeks of work, so scope them separately, and check Meta's current rules on AI assistants in WhatsApp.
- The client provides:
  - a Cloudflare account on Workers Paid ($5/month);
  - Slack admin access;
  - their own Supermemory account (memory tags are global inside an account, so **never** share one between customers);
  - their model API key(s).

## Deploy (60–120 min hands-on)
1. Fork the upstream (Apache-2.0) into the client's GitHub. **Rebrand the prompts:** they say "You are Supermemory".
2. Deploy with the one-click Cloudflare flow.
3. **Immediately lock `/setup` behind Cloudflare Access.** Until the owner signs in, whoever signs in first owns the deployment.
4. Set the secrets (`SUPERMEMORY_API_KEY`, `MODEL_API_KEY`), then complete the Slack app setup at `/setup`.
5. Configure per channel: proactivity (proactive / quiet), the home channel, and which actions need approval (email, payments, deletions, anything external).
6. Load the documents and wikis to learn from.

## Move triage onto the decision model (week 2, in shadow mode)
- Use the `teammate` recipe in `packages/brain`:
  - `triageQuestions` (18 questions) with `evaluateTriage`, in reserved, proactive or eager mode;
  - `activeTurnQuestions` with `resolveTurn`;
  - `approvalQuestions` with `classifyApproval`.
- Swap three function bodies in the harness (triage, the active-turn gate, the approval classifier), keeping their signatures. Anything that returns `{ via: "llm" }` falls back to the existing path.
- Run in **shadow mode** for 1–2 weeks: log both decisions and compare. Then accept Jev PASS/ACK at high confidence, then go primary.
- Validate Pidgin, Yoruba, Hausa and Igbo "yes" and "stop" phrases with native speakers before relying on them.

## Monthly care
- Review every approval, every PASS in the home channel, and a sample of answers; tune thresholds per channel.
- Check spend and cost per message; the evaluator's audit strings explain every decision.
- Report monthly: questions answered, investigations, approvals, the silence rate, and time saved (estimated from answered questions).

## Rulebook
- Silence is a valid outcome.
- Private channels and DMs never leak into shared answers.
- Consequential actions wait for an Approve click from the asker.
- Live facts come from connected apps, not memory.
