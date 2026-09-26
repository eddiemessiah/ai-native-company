# Playbook: Agent Readiness Audit ("the split")

**Unit:** one report covering up to 12 workflows. **Price:** $490 (₦150,000 for SMEs). The first five are free for design partners, in exchange for a case study. **Turnaround:** 72 hours after the walkthrough.

## 1. Walkthrough (45 min, recorded)
Ask the owner or ops lead to show, not tell:
- The 5–12 recurring workflows that take the most staff time: orders, support, invoicing, reporting, hiring, collections, scheduling.
- For each workflow: who does it, the tools, the monthly volume, time per item, and what "done" and "wrong" look like.
- Who approves what, especially money and customer communication.

## 2. Decompose (agents draft, 1 h of review)
Transcribe the call and break each workflow into steps. Classify each step with the brain:
- `kind` (Choice):
  - generate text (LLM);
  - pick, score or approve (System One);
  - exact rule or calculation (code);
  - judgment with money, legal or reputation at stake (a person);
  - other.
- `automation_value` (Score): volume × time × error cost.
- `risk` (Score): the cost of being wrong.
- `data_ready` (Noul): the inputs already exist in digital form.

## 3. Cost the before and after (code)
For each step: monthly volume × minutes × loaded cost per hour today, against model cost per unit plus review minutes after. Use `compareCost` in `packages/brain` for model costs, and show the formula next to every number.

## 4. Write the report
Structure:
1. **The headline.** "{N} hours a month can move to agents; ₦{X} a month saved; payback in {Y} weeks."
2. **The split map.** Each workflow as a strip: saffron (LLM), indigo (decide), bone (code), kola (a person).
3. **The top 3 opportunities,** ranked by value over risk, each with the exact steps, tools, approval points and monthly saving.
4. **The first agent to ship.** Must be shippable in under 14 days; scope it as an Agent Launch Sprint.
5. **What stays human, and why.**
6. **Risks and data notes** (NDPA, customer data, approvals).

## 5. Review (1 h, the founder, line by line)
- Every saving has a volume from the client.
- Anything that moves money or can't be undone is marked prepare-then-approve.
- A tool the client already pays for is recommended before a custom build.

## 6. Deliver
A 20-minute recorded walkthrough, plus a proposal for the first agent (the Agent Launch Sprint), crediting the audit fee against it if they start within 30 days.
