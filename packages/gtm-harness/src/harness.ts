import { CHANNEL_LABELS, STAGE_LABELS, type GtmInput } from "./input";
import type { GtmPlan } from "./plan";
import type { OutreachReview } from "./review";

/**
 * The harness folder a founder takes home. Three files do most of the work:
 * target-customers.md decides who to talk to, rules/ decides whether a draft
 * can go out, and corrections-log.md is how the rules get better every week.
 * Agents prepare; the reviewer can block but never send; the founder sends.
 */

export type HarnessFiles = Record<string, string>;

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "draft";

const VERDICT_LABEL: Readonly<Record<OutreachReview["verdict"], string>> = {
  ready: "READY: the founder can send it after filling the [slots]",
  revise: "REVISE: fix the points below first",
  blocked: "BLOCKED: breaks a rule; rewrite before anyone sees it",
};

export function buildHarness(input: GtmInput, plan: GtmPlan, reviews: readonly (OutreachReview | null)[], now = new Date()): HarnessFiles {
  const date = now.toISOString().slice(0, 10);
  const p = input.product;
  const totalWeight = plan.icp.criteria.reduce((sum, c) => sum + c.weight, 0);
  const files: HarnessFiles = {};

  files["README.md"] = `# ${p}: GTM harness

Built by Nova's GTM Harness on ${date}. This folder is your go-to-market, run by agents you can check.

- **target-customers.md** decides who you talk to.
- **rules/** decide whether a draft can go out.
- **corrections-log.md** is how the rules get better every week.

Agents prepare. The reviewer can block but never send. You send.

## Run it with Claude Code

\`\`\`bash
cd gtm-harness
claude
\`\`\`

Then say: *Read CLAUDE.md and run today's tasks in sprint.md.*

## Every day (30 minutes)

1. **Sourcer** adds leads to pipeline.csv with where it found them (prompts/sourcer.md).
2. **Scorer** scores new leads against target-customers.md (prompts/scorer.md).
3. **Preparer** drafts a message for every lead at 80% or more (prompts/preparer.md).
4. **Reviewer** marks each draft ready, revise or blocked against rules/ (prompts/reviewer.md).
5. **You** send the ready ones, and log every edit you made in corrections-log.md.

## Every Monday (20 minutes)

Fill dashboard.md, then run prompts/weekly-review.md to turn repeated corrections into rules.

## What's here

| File | What it's for |
|---|---|
| CLAUDE.md | The operating manual your agent reads first |
| positioning.md | What you say, to whom, and why now |
| target-customers.md | Your ideal customer and the scorecard |
| sources.md | Where those customers already gather |
| pipeline.csv | One row per lead |
| drafts/ | This week's first messages, already reviewed |
| rules/ | Voice, outreach and claims rules |
| prompts/ | One prompt per agent role |
| corrections-log.md | Every edit you make to a draft |
| sprint.md | Seven days of tasks |
| dashboard.md | Five numbers, every Monday |
`;

  files["CLAUDE.md"] = `# CLAUDE.md: go-to-market for ${p}

You run ${p}'s go-to-market with its founder. You prepare; the founder sends.

**Product:** ${input.pitch}
**For:** ${input.audience}
**Stage:** ${STAGE_LABELS[input.stage]}
**This month's goal:** ${input.goal}
**Channels:** ${input.channels.map((c) => CHANNEL_LABELS[c]).join(", ")}${input.regions ? `\n**Regions:** ${input.regions}` : ""}

## Never

- Send, post, email or DM anything yourself. Drafts go in drafts/ and wait for the founder.
- Invent traction, numbers, customers, partners or quotes.
- Contact anyone marked do_not_contact in pipeline.csv, or anyone who asked not to be contacted.
- Scrape private data or use bought lists. Public information only, with its source.

## Roles: keep them apart

| Role | Prompt | Can | Can't |
|---|---|---|---|
| Sourcer | prompts/sourcer.md | Add leads to pipeline.csv, with a source | Message anyone |
| Scorer | prompts/scorer.md | Score leads with target-customers.md | Change the scorecard |
| Preparer | prompts/preparer.md | Write drafts in drafts/ | Send anything |
| Reviewer | prompts/reviewer.md | Mark drafts ready, revise or blocked | Edit a draft and approve it, send |
| Founder | | Send, edit, approve new rules | |

## How to decide

- Score of 80% or more: reach out. 60–80%: nurture (follow, reply, invite to content). Under 60%: skip.
- A draft that breaks any rule in rules/ is not ready.
- When unsure, stop and ask the founder in one line.

## Today

Open sprint.md, find today's day, do the tasks in order, and stop at anything that needs the founder.
`;

  files["positioning.md"] = `# Positioning

**One line:** ${plan.positioning.oneLiner}

**For:** ${plan.positioning.forWho}

**The problem:** ${plan.positioning.problem}

**Why now:** ${plan.positioning.whyNow}

## Proof to show

${plan.positioning.proofToShow.map((x) => `- ${x}`).join("\n")}

Only show proof you have. If it's early, say it's early.
`;

  files["target-customers.md"] = `# Target customers

${plan.icp.summary}

## The scorecard

Score every lead the same way, so excitement doesn't make the decision. A lead's score is the sum of the weights of the criteria it meets, divided by ${totalWeight}.

| Criterion | Weight | What to look for |
|---|---|---|
${plan.icp.criteria.map((c) => `| ${cell(c.name)} | ${c.weight} | ${cell(c.lookFor)} |`).join("\n")}

- **80% or more:** reach out this week.
- **60–80%:** nurture: follow, reply usefully, invite to your content.
- **Under 60%:** skip for now.

## Disqualifiers

${plan.icp.disqualifiers.map((d) => `- ${d}`).join("\n")}
`;

  files["sources.md"] = `# Where they already are

${plan.sources.map((s, i) => `## ${i + 1}. ${s.channel}: ${s.where}\n\n- **How to find them:** ${s.howToFind}\n- **First step:** ${s.firstStep}`).join("\n\n")}
`;

  files["pipeline.csv"] = "name,handle_or_email,channel,source,score_pct,stage,last_touch,next_step,notes,do_not_contact\n";

  files["rules/voice.md"] = `# Voice

1. Plain, specific, short. Lead with something only you could say: a number you can source, a name, a result.
2. No hype words: revolutionary, game-changing, cutting-edge, unlock, seamless, synergy.
3. No filler openers ("Hope you're well", "In today's fast-paced world").
4. Write the way you'd explain it to a builder you respect.
5. One call to action per message.

Edit these to sound like you. Add a rule whenever you correct the same thing twice.
`;

  files["rules/outreach.md"] = `# Outreach

1. Under 90 words.
2. One personal line only this person could receive, from their public work.
3. One small ask: a reply, a 10-minute call or a demo.
4. No links or attachments in the first message unless they asked.
5. Follow up once, after three working days. Then stop.
6. Never send the same text to a group or to many people at once.
7. Anyone who says no or asks you to stop: mark do_not_contact in pipeline.csv, the same day.
`;

  files["rules/claims.md"] = `# Claims

1. Never invent traction, users, revenue, customers, partners or quotes.
2. Every number has a source you could show.
3. Name a customer or user only with their permission.
4. If it's early, say it's early. "10 teams are testing it" beats a vague "growing fast".
`;

  files["corrections-log.md"] = `# Corrections log

Every time you edit a draft before sending it, add a row. On Monday, prompts/weekly-review.md turns repeated corrections into rules.

| Date | Draft | What you changed | Type | Rule proposed |
|---|---|---|---|---|
| ${date} | drafts/example.md | Removed "fastest-growing" | Factual error | rules/claims.md #2 |

**Type** is one of: factual error, audience preference, missing information, style.
`;

  files["prompts/sourcer.md"] = `# Sourcer

You are the sourcer for ${p}. Read target-customers.md and sources.md.

Find up to 20 people or teams who match the scorecard, starting with the first source in sources.md you haven't used this week. For each, add a row to pipeline.csv: name, handle or email, channel, the exact source (a URL or the group name), stage "new". Use public information only. Put anything you inferred in notes, starting with "Inference:". Never message anyone.
`;

  files["prompts/scorer.md"] = `# Scorer

Score every lead in pipeline.csv with stage "new" against target-customers.md. For each criterion, decide met or not met from public evidence and write one line of evidence in notes. Set score_pct to the met weights divided by ${totalWeight}. Set stage to "reach out" (80% or more), "nurture" (60–80%) or "skip" (under 60%). Don't change the scorecard; if a criterion seems wrong, say so to the founder instead.
`;

  files["prompts/preparer.md"] = `# Preparer

For every lead in pipeline.csv with stage "reach out" and no draft yet, write a draft in drafts/<name>.md using the matching example in drafts/ as a starting point. Follow every rule in rules/. Fill the personalization line from the lead's public work and cite where it came from at the bottom of the file. You can't send anything, and you can't mark your own drafts ready.
`;

  files["prompts/reviewer.md"] = `# Reviewer

Check every new draft in drafts/ against rules/voice.md, rules/outreach.md and rules/claims.md. At the top of each file write one verdict:

- **READY**: the founder can send it after filling any [slots].
- **REVISE**: list each fix, one line each.
- **BLOCKED**: name the rule it breaks.

You can block. You can't edit a draft and then approve it yourself, and you never send anything.
`;

  files["prompts/follow-up.md"] = `# Follow-up

For every lead contacted three or more working days ago with no reply and no follow-up yet, write one short follow-up in their draft file: two sentences, a new detail or a smaller ask, no guilt. After one follow-up, set next_step to "stop" in pipeline.csv.
`;

  files["prompts/weekly-review.md"] = `# Weekly review (Mondays)

Compare each message the founder sent this week with the draft the preparer wrote. Classify every change as a factual error, an audience preference, missing information or a style change, and log it in corrections-log.md. Propose a rule for any correction that happened more than once. Nothing becomes a rule until the founder approves it; then add it to the right file in rules/ with the original draft and the sent version as an example.

Then fill this week's column in dashboard.md and say in three lines what to change next week.
`;

  plan.drafts.forEach((d, i) => {
    const review = reviews[i];
    const verdict = review
      ? `**Reviewer:** ${VERDICT_LABEL[review.verdict]}${review.fixes.length ? `\n\n${review.fixes.map((f) => `- ${f}`).join("\n")}` : ""}\n\n_Reviewed by ${review.provider}${review.calibrated ? "" : " (uncalibrated)"}._`
      : "**Reviewer:** not reviewed yet. Run prompts/reviewer.md.";
    files[`drafts/${String(i + 1).padStart(2, "0")}-${slug(d.channel)}.md`] = `# ${d.channel} · ${d.audience}

${verdict}

---

${d.text}
`;
  });

  files["sprint.md"] = `# This week's sprint

Goal: ${input.goal}

${plan.sprint.map((d) => `## Day ${d.day}: ${d.focus}\n\n${d.tasks.map((t) => `- [ ] ${t}`).join("\n")}`).join("\n\n")}
`;

  files["dashboard.md"] = `# Monday dashboard

Five numbers, every Monday. If a number goes up while replies or conversations go down, fix the list or the message before doing more of it.

| Number | This week's target | Why it matters | Week 1 | Week 2 | Week 3 | Week 4 |
|---|---|---|---|---|---|---|
${plan.metrics.map((m) => `| ${cell(m.name)} | ${cell(m.target)} | ${cell(m.why)} | | | | |`).join("\n")}

## Risks to watch

${plan.risks.map((r) => `- ${r}`).join("\n")}
`;

  return files;
}
