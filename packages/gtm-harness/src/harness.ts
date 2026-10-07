import { CHANNEL_LABELS, STAGE_LABELS, type GtmInput } from "./input";
import type { GtmPlan } from "./plan";
import type { OutreachReview } from "./review";
import { DEFAULT_TOOLS, type ToolStatus } from "./tools";

/**
 * The workspace a founder takes home: a marketing brain, workflows, skills and a first
 * campaign, around the outreach loop (pipeline, drafts, rules, corrections). Any agent can
 * run it: AGENTS.md is the manual, CLAUDE.md imports it for Claude Code, and the skills are
 * plain markdown runbooks in .agents/skills/ (the folder Codex, Gemini CLI, Cursor and Copilot
 * read), copied to .claude/skills/ for Claude Code. Agents prepare; the reviewer can block but
 * never send; the founder approves and sends.
 *
 * Browser-safe: no Node imports, so the server can build it and the page can zip it.
 */

export type HarnessFiles = Record<string, string>;

/** Where the skills live; the copy for Claude Code is generated from it (`pnpm gtm sync`). */
export const SKILLS_DIR = ".agents/skills/";
export const CLAUDE_SKILLS_DIR = ".claude/skills/";

export interface HarnessOptions {
  /** Live tool status for workflows/tools.md; defaults to what works without setup. */
  readonly tools?: readonly ToolStatus[];
  /** Folder name for the first campaign. */
  readonly campaign?: string;
}

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "draft";

const VERDICT_LABEL: Readonly<Record<OutreachReview["verdict"], string>> = {
  ready: "READY: fill any [slots], then it goes to the founder for approval",
  revise: "REVISE: fix the points below first",
  blocked: "BLOCKED: breaks a rule; rewrite before anyone sees it",
};

function skill(name: string, description: string, body: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n${body.trim()}\n`;
}

export function buildHarness(
  input: GtmInput,
  plan: GtmPlan,
  reviews: readonly (OutreachReview | null)[],
  now = new Date(),
  opts: HarnessOptions = {},
): HarnessFiles {
  const date = now.toISOString().slice(0, 10);
  const p = input.product;
  const productFile = `brain/products/${slug(p)}.md`;
  const campaign = opts.campaign ?? "first-campaign";
  const c = `campaigns/${campaign}`;
  const totalWeight = plan.icp.criteria.reduce((sum, x) => sum + x.weight, 0);
  const channels = input.channels.map((ch) => CHANNEL_LABELS[ch]).join(", ");
  const assumptions = [plan.positioning.problem, plan.positioning.whyNow].filter((s) => s.startsWith("Assumption:"));
  const tools = opts.tools ?? DEFAULT_TOOLS;
  const files: HarnessFiles = {};

  // ── The manual ─────────────────────────────────────────────────────────────
  files["README.md"] = `# ${p}: GTM harness

Built by Shonin's GTM Harness on ${date}. A workspace your agents research from, decide in and prepare work through, and that you come back to every week. Agents prepare. The reviewer can block but never send. You approve, and you send.

## Start

- **Claude Code:** \`cd gtm-harness && claude\`, then say: *Read AGENTS.md and run today's tasks in sprint.md.*
- **Codex, Cursor, Copilot or Gemini CLI:** open this folder; they read AGENTS.md and the skills in \`.agents/skills/\` (Gemini CLI through \`.gemini/settings.json\`).
- **Any other agent:** point it at AGENTS.md. The skills are plain markdown runbooks it can follow.
- **Any MCP client, even a chat app that can't read files:** \`pnpm --silent gtm mcp <folder>\` serves this folder as tools: leads, drafts, checks and approval requests. No tool sends or approves.

The skills live in \`.agents/skills/\`; \`.claude/skills/\` is the same set, copied for Claude Code. Change a skill in both places, or edit \`.agents/skills/\` and run \`pnpm gtm sync <folder>\`.

## The two loops

**Every day (30 minutes):** find leads → score them → prepare drafts → review them → you approve and send → log every edit you made in corrections-log.md.

**Every campaign:** goal → research → directions → your choice → production → review → results → lessons for the next one.

## What's here

| Path | What it's for |
|---|---|
| AGENTS.md | The operating manual every agent reads first (CLAUDE.md imports it) |
| brain/ | What the agents know: brand, product, audience and scorecard, positioning, channels, design, assets, templates, history, lessons |
| workflows/ | Which skill does which task (router.md), what's connected (tools.md), what needs you (approvals.md) |
| .agents/skills/ | One runbook per role: source, score, prepare, review, follow up, weekly review, research, plan, produce, review a campaign, record learnings |
| .claude/skills/ | The same skills, copied for Claude Code |
| ${c}/ | Your first campaign: state, research, brief, concepts, selections, approval, results, outbox |
| drafts/ | This week's first messages, already reviewed |
| rules/ | Voice, outreach and claims rules |
| pipeline.csv | One row per lead |
| corrections-log.md | Every edit you make to a draft: how the rules get better |
| sprint.md | Seven days of tasks |
| dashboard.md | Five numbers, every Monday |
`;

  files["AGENTS.md"] = `# AGENTS.md: go-to-market for ${p}

You run ${p}'s go-to-market with its founder. You research, decide what to propose, and prepare. The founder approves and sends.

**Product:** ${input.pitch}
**For:** ${input.audience}
**Stage:** ${STAGE_LABELS[input.stage]}
**This month's goal:** ${input.goal}
**Channels:** ${channels}${input.regions ? `\n**Regions:** ${input.regions}` : ""}

## Never

- Send, post, email or DM anything yourself. Messages wait in drafts/ or ${c}/outbox/ for the founder.
- Invent traction, numbers, customers, partners or quotes. Claims come from brain/products/ with a source.
- Contact anyone marked do_not_contact in pipeline.csv, or anyone who asked not to be contacted.
- Scrape private data, log into someone's WhatsApp or Telegram with a bot, or use bought lists. Public information only, with its URL and date.
- Spend money or start anything paid without a written amount in ${c}/approval.md.

## Read first

- For any marketing task: brain/index.md, then workflows/router.md, then the files the router names.
- Before planning: the relevant files in brain/lessons/. Say which lessons shaped your recommendation.
- Before using a tool: workflows/tools.md. Don't assume a tool is connected.
- Before anything leaves this folder: workflows/approvals.md.

## Roles: keep them apart

| Role | Skill | Can | Can't |
|---|---|---|---|
| Sourcer | source-leads | Add leads to pipeline.csv, with a source | Message anyone |
| Scorer | score-leads | Score leads with brain/audience.md | Change the scorecard |
| Preparer | prepare-drafts | Write drafts | Send anything, mark its own drafts ready |
| Reviewer | review-drafts | Mark drafts ready, revise or blocked | Edit a draft and approve it, send |
| Researcher | research-market | Collect evidence into ${c}/research.md | Present a guess as evidence |
| Planner | plan-campaign | Propose directions and concepts | Start production before approval |
| Producer | produce-creative | Make the approved outputs | Change the approved scope |
| Founder | | Approve, send, accept new rules | |

Skills live in \`.agents/skills/<name>/SKILL.md\`, with the same files in \`.claude/skills/\` for Claude Code. If you change a skill, make the same change in both.

## How to decide

- Lead score of 80% or more: reach out. 60–80%: nurture (follow, reply, invite to content). Under 60%: skip.
- A draft that breaks any rule in rules/ is not ready.
- Facts and assumptions stay apart: anything you inferred starts with "Assumption:".
- When unsure, stop and ask the founder in one line.

## Keep state

Each campaign keeps its own state.md: completed steps, blockers, the next action. Update it at the end of every session, so the next one starts where you stopped.

## Every session

1. **Start:** read the campaign's state.md and today's part of sprint.md. If the \`pnpm gtm\` CLI is available, run \`pnpm gtm status\` on this folder.
2. **Before anything goes to the founder:** run \`pnpm gtm check\` on this folder and fix every error. Each finding names the rule it breaks and how to fix it, and drafts with errors are held back from approval.
3. **End:** update state.md with what's done, any blockers and the next action. If this folder is a git repository, commit with a one-line summary of the session.

## Today

Open sprint.md, find today's day, do the tasks in order, and stop at anything that needs the founder.
`;

  files["CLAUDE.md"] = `@AGENTS.md

## In Claude Code

The roles are skills in \`.claude/skills/\`, a copy of \`.agents/skills/\`. Ask for one by name ("run score-leads") or describe the task, and the matching skill loads. If you change a skill, change it in both folders.
`;

  // ── The brain ──────────────────────────────────────────────────────────────
  files["brain/index.md"] = `# Brain index

Which file answers which question. Read this first for any marketing task.

| Question | File |
|---|---|
| What do we sell, and what may we say about it? | ${productFile.replace("brain/", "")}, brand.md |
| Who buys, and how do we score a lead? | audience.md |
| Why us, and which angles are worth testing? | positioning.md |
| Where do they already gather? | channels.md |
| How should it look? | design.md |
| Which photos, videos and references can we use? | assets.md |
| Which formats and message recipes fit which ideas? | templates.md |
| What did we try before, and what happened? | history.md, observations/, lessons/ |

## Sources

- Website: ${input.url || "none given"}
- The founder's answers on ${date}

Anything not confirmed by the founder or a source starts with "Assumption:". Correct these files before using them in a campaign.
`;

  files["brain/brand.md"] = `# Brand

**What ${p} does:** ${input.pitch}
**For:** ${input.audience}
**Stage:** ${STAGE_LABELS[input.stage]}
**Website:** ${input.url || "none given"}

## Voice

rules/voice.md is the voice. Add a line there whenever the founder corrects the same thing twice.

## Never say

- Traction, users, revenue, customers, partners or quotes that aren't in ${productFile} with a source.
- Prices or terms that aren't on the founder's price list.
- That the product does something it doesn't do today.

## Constraints

Fill these in: legal, regulatory and platform rules the company works under.

## Confirmed facts

- ${input.pitch} (the founder, ${date})

## Assumptions to check

${assumptions.length ? assumptions.map((a) => `- ${a}`).join("\n") : "- None recorded yet."}
`;

  files[productFile] = `# ${p}

**Offer:** ${input.pitch}
**For:** ${input.audience}
**Source:** ${input.url || "the founder's answers"} · last checked ${date}

## Approved claims

Only claims with a source go here, and only these may appear in messages and creative.

| Claim | Source | Checked |
|---|---|---|

## Variants and prices

Fill in from your price list. Never guess a price.

## Restrictions

What we must not promise.
`;

  files["brain/positioning.md"] = `# Positioning

**One line:** ${plan.positioning.oneLiner}

**For:** ${plan.positioning.forWho}

**The problem:** ${plan.positioning.problem}

**Why now:** ${plan.positioning.whyNow}

## Proof to show

${plan.positioning.proofToShow.map((x) => `- ${x}`).join("\n")}

Only show proof you have. If it's early, say it's early.

## Angles to test

Add angles here as research suggests them. Mark each one "hypothesis" until your own results support it.

## Winners

Only angles your own campaign results support, with the result and its source.
`;

  files["brain/audience.md"] = `# Audience and the scorecard

${plan.icp.summary}

## The scorecard

Score every lead the same way, so excitement doesn't make the decision. A lead's score is the sum of the weights of the criteria it meets, divided by ${totalWeight}.

| Criterion | Weight | What to look for |
|---|---|---|
${plan.icp.criteria.map((x) => `| ${cell(x.name)} | ${x.weight} | ${cell(x.lookFor)} |`).join("\n")}

- **80% or more:** reach out this week.
- **60–80%:** nurture: follow, reply usefully, invite to your content.
- **Under 60%:** skip for now.

## Disqualifiers

${plan.icp.disqualifiers.map((d) => `- ${d}`).join("\n")}

## Objections heard

| Objection | Who said it (role, not name) | How we answered | Date |
|---|---|---|---|
`;

  files["brain/channels.md"] = `# Where they already are

${plan.sources.map((s, i) => `## ${i + 1}. ${s.channel}: ${s.where}\n\n- **How to find them:** ${s.howToFind}\n- **First step:** ${s.firstStep}`).join("\n\n")}
`;

  files["brain/design.md"] = `# Design

Fill this in from your brand guide or your best posts, then confirm it with the founder.

- **Fonts:**
- **Colours:**
- **Look and feel:**
- **Logo use:**

## Reference posts and ads

| Link | Why it's a good reference | Date |
|---|---|---|
`;

  files["brain/assets.md"] = `# Assets

The index of photos, videos, screenshots and references. Keep large files in your asset library and link them here, so an agent can find the right input for an idea.

| Asset | Link | What it shows | Product or variant | Format | Rights and limits |
|---|---|---|---|---|---|
`;

  files["brain/templates.md"] = `# Templates

Reusable recipes. Each names the inputs it needs and the ideas it suits.

| Recipe | Inputs | Suits |
|---|---|---|
| Product in use | A photo or clip of the product in a real setting, one headline | Showing the situation the product fixes |
| Before and after | Two screenshots or clips, one line each | A result you can show honestly |
| Founder note | A 60-second clip or a short text from the founder | Trust, early-stage stories |
| Customer words | A quote, with written permission | Proof from someone else |
| First message | A personal line from the lead's public work, one small ask | Outreach (see drafts/) |

## Show your reasoning

For every output, write the link between the idea, the input and the format:

> **Idea:** show the product in a trader's day. **Input:** the market-stall photo. **Format:** product in use, one headline. **Reason:** the setting explains the use.
`;

  files["brain/history.md"] = `# History

One row per campaign. Results come from your own data, with the source.

| Campaign | Dates | Goal | What we made | Decision | Measured result | Lesson |
|---|---|---|---|---|---|---|
`;

  files["brain/observations/README.md"] = `# Observations

Raw notes, one file per campaign or week (for example \`${date}-${campaign}.md\`). Keep two kinds apart:

- **Review comments:** what the founder prefers ("warmer photo", "shorter headline").
- **Results:** channel, dates, reach, replies, conversions, and where the numbers come from.

Never edit an old observation. Add a new one.
`;

  files["brain/lessons/README.md"] = `# Lessons

Dated lessons proposed from observations. A lesson becomes a rule only when the founder accepts it.

Each lesson has:

- **Lesson:** one sentence.
- **Evidence:** the observation and its source.
- **Type:** a preference or a performance hypothesis.
- **Applies to:** audience, channel, product or offer.
- **Limits:** why it might not hold, and when to revisit it.

Read the relevant lessons before planning, and say which ones shaped the plan. A recent result can be weak evidence; an old lesson can still hold. Review conflicting lessons with the founder instead of treating everything saved as permanent.
`;

  // ── Rules ──────────────────────────────────────────────────────────────────
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
2. Every number has a source you could show. Approved claims live in ${productFile}.
3. Name a customer or user only with their permission.
4. If it's early, say it's early. "10 teams are testing it" beats a vague "growing fast".
`;

  // ── Workflows ──────────────────────────────────────────────────────────────
  files["workflows/router.md"] = `# Router

Which skill does which task, what it reads first and where it saves its work.

| Task | Skill | Read first | Save to |
|---|---|---|---|
| Find leads | source-leads | brain/audience.md, brain/channels.md | pipeline.csv |
| Score leads | score-leads | brain/audience.md | pipeline.csv |
| Write first messages | prepare-drafts | brain/positioning.md, ${productFile}, rules/ | drafts/ or ${c}/outbox/ |
| Review drafts | review-drafts | rules/ | the draft's Reviewer line |
| Follow up | follow-up | pipeline.csv | the lead's draft |
| Weekly review | weekly-review | corrections-log.md, dashboard.md | rules/, brain/lessons/ |
| Research a goal, market or channel | research-market | brain/index.md, brain/lessons/ | ${c}/research.md |
| Plan a campaign | plan-campaign | ${c}/research.md, brain/lessons/, brain/ | ${c}/brief.md, concepts.md, selections.md |
| Produce what was approved | produce-creative | ${c}/approval.md, selections.md, brain/design.md, assets.md, templates.md | ${c}/outputs/, ${c}/outbox/ |
| Review a campaign | review-campaign | ${c}/outputs/, rules/ | ${c}/review.md, state.md |
| Record learnings | record-learnings | ${c}/results.md, brain/observations/ | brain/lessons/, brain/history.md |

## Shared actions

- **Find an asset:** search brain/assets.md; never invent one.
- **Fetch a source:** save the URL and the date next to what you took from it.
- **Check a claim:** it must be in ${productFile} with a source.
- **Build a send link:** see workflows/approvals.md.
`;

  files["workflows/tools.md"] = `# Tools

What's connected today, and what isn't. Check here before planning work that needs a tool.

| Tool | Connected | What it does | Needs |
|---|---|---|---|
${tools.map((t) => `| ${cell(t.name)} | ${t.connected ? "yes" : "no"} | ${cell(t.does)} | ${cell(t.needs ?? "")} |`).join("\n")}

## Limits

- Research uses public pages only. Save the URL and date.
- No bot logs into anyone's WhatsApp or Telegram account, and nothing scrapes sites that need a login.
- Browse at a person's pace: no stealth tools, no CAPTCHA solving.
- The first WhatsApp message to anyone is the founder's own tap on the link. The WhatsApp Business API is only for people who opted in to hear from this business, and outside the 24-hour reply window it sends only approved templates.
- A Telegram bot can't message someone first. It reaches the founder; the founder reaches everyone else.
- Competitors' public ads show what they run, not what works. Use them for hypotheses; judge results with your own data.
`;

  files["workflows/approvals.md"] = `# Approvals

Nothing leaves this folder without the founder.

## Decision points

1. **The campaign direction** in ${c}/approval.md, before any production.
2. **Every message to a person,** by its exact text. A draft edited after approval needs a new approval.
3. **Any spend** (ads, paid tools), with the amount written down.

## Publishing permissions

None granted. Agents prepare; the founder sends. A standing permission must be written here: the channel, what may be posted, a limit and an end date, signed by the founder with the date. Messages to people still need their own approval.

## How a draft gets approved

- **With the Shonin GTM CLI and Telegram:** each draft arrives in your chat with Approve and Reject. An approved card turns into a one-tap send link. Decisions go to approvals.jsonl, tied to the exact text.
- **Without it:** read the draft, edit it if needed, send it yourself, and log your edits in corrections-log.md.

## One-tap send links

The app opens with the message filled in; your tap is the send.

| Channel | Link |
|---|---|
| WhatsApp | \`https://wa.me/<number>?text=<message>\` |
| Email | \`mailto:<address>?subject=<subject>&body=<message>\` |
| X post | \`https://x.com/intent/post?text=<message>\` |
| Telegram | \`https://t.me/share/url?url=&text=<message>\` |

LinkedIn and Discord have no such link: copy the text and send it yourself.
`;

  // ── Skills ─────────────────────────────────────────────────────────────────
  files[".agents/skills/source-leads/SKILL.md"] = skill(
    "source-leads",
    "Find people who match the scorecard and add them to pipeline.csv with their source. Use when asked to find leads, or when sprint.md says to add names.",
    `Read brain/audience.md and brain/channels.md.

Find up to 20 people or teams who match the scorecard, starting with the first channel in brain/channels.md you haven't used this week. For each, add a row to pipeline.csv: name, handle or email, channel, the exact source (a URL or the group name), stage "new". Public information only. Put anything you inferred in notes, starting with "Inference:". Never message anyone.`,
  );

  files[".agents/skills/score-leads/SKILL.md"] = skill(
    "score-leads",
    "Score new leads in pipeline.csv against the scorecard and set their stage. Use after sourcing, or when asked who to contact.",
    `Score every lead in pipeline.csv with stage "new" against brain/audience.md. For each criterion, decide met or not met from public evidence and write one line of evidence in notes. Set score_pct to the met weights divided by ${totalWeight}. Set stage to "reach out" (80% or more), "nurture" (60–80%) or "skip" (under 60%). Don't change the scorecard; if a criterion seems wrong, tell the founder instead.`,
  );

  files[".agents/skills/prepare-drafts/SKILL.md"] = skill(
    "prepare-drafts",
    "Write a first message for every lead ready for outreach, following the rules. Use when leads are at 'reach out' with no draft yet.",
    `For every lead in pipeline.csv with stage "reach out" and no draft yet, write a draft in ${c}/outbox/<name>.md in the format in ${c}/outbox/README.md, using the closest example in drafts/ as a starting point. Follow every rule in rules/. Use only claims from ${productFile}. Fill the personal line from the lead's public work and cite where it came from. Fill every [slot]: a draft with a slot left is held back from the founder. Then run \`pnpm gtm check\` and fix every error it lists. You can't send anything, and you can't mark your own drafts ready.`,
  );

  files[".agents/skills/review-drafts/SKILL.md"] = skill(
    "review-drafts",
    "Check new drafts against the voice, outreach and claims rules and mark each ready, revise or blocked. Use after drafts are written.",
    `Check every new draft in drafts/ and ${c}/outbox/ against rules/voice.md, rules/outreach.md and rules/claims.md. Set its **Reviewer:** line to one verdict:

- **READY**: it meets every rule; once any [slots] are filled, it can go to the founder.
- **REVISE**: list each fix, one line each.
- **BLOCKED**: name the rule it breaks.

You can block. You can't edit a draft and then approve it yourself, and you never send anything.`,
  );

  files[".agents/skills/follow-up/SKILL.md"] = skill(
    "follow-up",
    "Write one short follow-up for leads who haven't replied after three working days. Use when sprint.md says to follow up.",
    `For every lead contacted three or more working days ago with no reply and no follow-up yet, write one short follow-up in their draft file: two sentences, a new detail or a smaller ask, no guilt. After one follow-up, set next_step to "stop" in pipeline.csv.`,
  );

  files[".agents/skills/weekly-review/SKILL.md"] = skill(
    "weekly-review",
    "Turn the week's corrections into proposed rules and fill the dashboard. Use on Mondays.",
    `Compare each message the founder sent this week with the draft that was prepared. Classify every change as a factual error, an audience preference, missing information or a style change, and log it in corrections-log.md. Propose a rule for any correction that happened more than once; nothing becomes a rule until the founder approves it, then add it to the right file in rules/ with the original and the sent version as an example.

Then fill this week's column in dashboard.md and say in three lines what to change next week.`,
  );

  files[".agents/skills/research-market/SKILL.md"] = skill(
    "research-market",
    "Research a goal, market, channel or competitor and save the evidence. Use before planning any campaign.",
    `Read brain/index.md, brain/audience.md, brain/positioning.md and the relevant files in brain/lessons/. Ask the founder for any missing goal or constraint in one line.

Collect evidence from public sources and connected tools (workflows/tools.md), saving each source's URL and date. Save ${c}/research.md with:

- the audience's problems, each with its evidence;
- what competitors and peers publish (hypotheses, not proof of what works);
- observations about each channel;
- gaps, and assumptions marked "Assumption:".

End with 2 to 4 opportunities and the questions only the founder can answer.`,
  );

  files[".agents/skills/plan-campaign/SKILL.md"] = skill(
    "plan-campaign",
    "Propose distinct campaign directions from the research, then turn the chosen one into concepts and a production plan. Use after research-market.",
    `Read ${c}/research.md and the relevant lessons. Propose 2 or 3 distinct directions. For each: the audience, the problem, the evidence, the angle, the channels, what to make, the effort and any cost, and the lessons that shaped it.

Save them to ${c}/brief.md and ask the founder to choose. For the chosen direction, write ${c}/concepts.md (hook, message, format, channel, evidence) and ${c}/selections.md (the assets and templates chosen, and why). Record the scope, deliverables and any budget in ${c}/approval.md with status "awaiting approval". Don't produce anything until the founder marks it approved.`,
  );

  files[".agents/skills/produce-creative/SKILL.md"] = skill(
    "produce-creative",
    "Produce the outputs the founder approved: posts, scripts, email copy, image or video briefs, and messages to people. Use only when the campaign's approval.md says approved.",
    `Check ${c}/approval.md first. If it isn't approved, stop and say so.

Produce exactly the approved scope, following ${c}/selections.md, brain/design.md, brain/assets.md and brain/templates.md. Link every output to its concept and inputs. Save creative under ${c}/outputs/ and messages to people in ${c}/outbox/ (format in ${c}/outbox/README.md). Check every claim against ${productFile}. Then run review-drafts on the outbox. Update ${c}/state.md.`,
  );

  files[".agents/skills/review-campaign/SKILL.md"] = skill(
    "review-campaign",
    "Prepare the campaign for the founder's review and apply corrections as new versions. Use after production.",
    `Write ${c}/review.md: each output with its concept, version and the reviewer's verdict. Check product accuracy, whether the concept comes through, readability on a phone, and every rule in rules/.

Apply the founder's corrections as new versions (keep the old ones) and log every correction in corrections-log.md. Update ${c}/state.md with what's approved and the next action.`,
  );

  files[".agents/skills/record-learnings/SKILL.md"] = skill(
    "record-learnings",
    "Save the campaign's results and the founder's comments, and propose dated lessons. Use when results come in.",
    `Save raw observations in brain/observations/<date>-${campaign}.md. Keep review comments (preferences) and measured results apart, and give each number its source: channel, dates, reach, replies, conversions.

Propose dated lessons in brain/lessons/ (evidence, preference or performance hypothesis, what it applies to, its limits and when to revisit it). Add a row to brain/history.md. Nothing becomes a rule until the founder accepts it.`,
  );

  // ── The first campaign ─────────────────────────────────────────────────────
  files[`${c}/state.md`] = `# State: ${campaign}

**Goal:** ${input.goal}

- [ ] Research (research-market)
- [ ] Directions proposed (plan-campaign)
- [ ] Direction chosen and approved (approval.md)
- [ ] Production (produce-creative)
- [ ] Review (review-campaign)
- [ ] Results recorded (record-learnings)

**Blockers:** none.
**Next action:** run research-market for the goal.
`;

  files[`${c}/research.md`] = `# Research: ${campaign}

Evidence first, each item with its URL and date. Assumptions start with "Assumption:".

## The audience's problems

## What others publish

## Channels

${plan.sources.map((s) => `- ${s.channel}: ${s.where}`).join("\n")}

## Gaps and questions for the founder
`;

  files[`${c}/brief.md`] = `# Brief: ${campaign}

**Goal:** ${input.goal}
**Audience:** ${plan.icp.summary}
**One line:** ${plan.positioning.oneLiner}
**Channels:** ${channels}

## Directions

To be proposed by plan-campaign, from research.md.

## Deliverables

To be agreed in approval.md.
`;

  files[`${c}/concepts.md`] = `# Concepts: ${campaign}

| Concept | Hook | Message | Format | Channel | Evidence |
|---|---|---|---|---|---|
`;

  files[`${c}/selections.md`] = `# Selections: ${campaign}

For each concept: the idea, the input from brain/assets.md, the recipe from brain/templates.md, and why.

> **Idea:** … **Input:** … **Format:** … **Reason:** …
`;

  files[`${c}/approval.md`] = `# Approval: ${campaign}

**Status:** not approved
**Direction:**
**Deliverables:**
**Budget:** $0 unless written here
**Approved by:**
**Date:**

Production starts only when the status says approved, signed with a date.
`;

  files[`${c}/results.md`] = `# Results: ${campaign}

Your own numbers, each with its source.

| Output | Channel | Dates | Reach | Replies | Conversions | Source |
|---|---|---|---|---|---|---|
`;

  files[`${c}/outbox/README.md`] = `# Outbox

One file per message to a person, in this format:

\`\`\`
# WhatsApp · Ada (Lagos traders' group)

**To:** +2348000000000
**Source:** where you found them (a URL or the group name)
**Reviewer:** not reviewed yet

---

The message itself.
\`\`\`

The reviewer fills in the Reviewer line. Nothing here is sent until the founder approves it (workflows/approvals.md).
`;

  // ── The outreach loop ──────────────────────────────────────────────────────
  files["pipeline.csv"] = "name,handle_or_email,channel,source,score_pct,stage,last_touch,next_step,notes,do_not_contact\n";

  files["corrections-log.md"] = `# Corrections log

Every time you edit a draft before sending it, add a row. On Monday, the weekly-review skill turns repeated corrections into rules.

| Date | Draft | What you changed | Type | Rule proposed |
|---|---|---|---|---|
| ${date} | drafts/example.md | Removed "fastest-growing" | Factual error | rules/claims.md #2 |

**Type** is one of: factual error, audience preference, missing information, style.
`;

  plan.drafts.forEach((d, i) => {
    const review = reviews[i];
    const verdict = review
      ? `**Reviewer:** ${VERDICT_LABEL[review.verdict]}${review.fixes.length ? `\n\n${review.fixes.map((f) => `- ${f}`).join("\n")}` : ""}\n\n_Reviewed by ${review.provider}${review.calibrated ? "" : " (uncalibrated)"}._`
      : "**Reviewer:** not reviewed yet. Run the review-drafts skill.";
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

  // ── Every agent ────────────────────────────────────────────────────────────
  // Claude Code reads skills only from .claude/skills/; Codex, Gemini CLI, Cursor and Copilot read
  // .agents/skills/. Gemini CLI reads AGENTS.md once its settings name it (research/gtm-harnesses.md).
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith(SKILLS_DIR)) files[`${CLAUDE_SKILLS_DIR}${path.slice(SKILLS_DIR.length)}`] = content;
  }
  files[".gemini/settings.json"] = `${JSON.stringify({ context: { fileName: ["AGENTS.md"] } }, null, 2)}\n`;

  return files;
}
