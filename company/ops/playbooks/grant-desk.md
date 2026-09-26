# Playbook: Grant & RFP Desk

**Unit:** one submission-ready application. **Price:** $350 per grant application (₦250,000), $1,200 per RFP. **Turnaround:** 3 working days (48-hour rush available).

**Conflict check first:** if anyone at the firm reviews, judges, nominates or allocates for this program, decline the job (`ops/conflicts-of-interest.md`).

## Day 1: intake and score
- Collect the program link, requirements, **rubric** (or reconstruct it from the call text), deadline, word limits, and the client's evidence: repo, demo, metrics, users, team, budget.
- Run the Grant Fit recipe (`POST /api/v1/grant-fit`, or `scoreGrant` in `packages/brain`) on the current draft, using the program's rubric. You get a 0–100 score, per-criterion scores, eligibility, unsupported claims, and the three weakest sections.
- Make an **evidence table**: every claim the application will make, its evidence link, and its date. Claims without evidence become milestones, never assertions.

## Day 2: write
- The LLM rewrites the three weakest sections, using only the evidence table.
- Milestones are dated, measurable and tied to budget lines. The budget is itemized and proportionate.
- Use the funder's language for their priorities, but never paste their call text back at them.

## Day 3: review and hand over
- A person reads the whole application.
- Re-run Grant Fit and include the before and after scorecard in the handover.
- Checklist: word limits, attachments, links working, KYC items, the submission portal account.
- The client submits (never us, unless explicitly asked); we keep a copy and the outcome for the rulebook.

## Rulebook
- Every number links to evidence.
- Never invent traction, users, partners or letters of support.
- Disclose any affiliation the rules require.
- Track outcomes (won, lost, feedback) and feed rejection feedback back into the rubric notes for that funder.
