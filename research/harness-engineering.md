# Harness engineering, and what the GTM Harness should take from it

*2026-10-07. For Edidiong Umana and whoever builds `packages/gtm-harness` next. The founder shared a free resource on harness engineering (§1); this note reads the field's primary sources, checks our harness against them, and records what we built from them the same day (§6–7).*

## How to read the tags

| Tag | Meaning |
|---|---|
| **[fetched]** | We read the primary text: an Anthropic engineering post, or a GitHub repository written by the source's author. |
| **[search]** | A search snippet only, because the page itself was blocked. |
| **[secondary]** | A third-party repository we read in full that quotes, translates or links a primary source we couldn't open. |
| **[repo]** | A file in this repository. |

## Limits

- **Blocked** for both curl and WebFetch:
  - www.clcoding.com, web.archive.org, archive.org and drive.google.com;
  - arxiv.org, export.arxiv.org and alphaxiv.org;
  - openai.com and developers.openai.com;
  - martinfowler.com, thoughtworks.com, humanlayer.dev, the LangChain blog, mitchellh.com and agents.md;
  - researchgate.net, huggingface.co, emergentmind.com and ETH Zurich's SRI site;
  - every `*.github.io` page we tried, and deepwiki.com.
- **Reachable:**
  - anthropic.com;
  - `git clone` from GitHub;
  - GitHub's MCP repository search. GitHub's REST search API was closed to this session.
- **What that means:**
  - OpenAI's essay, Böckeler's article and the arXiv paper are [search] or [secondary].
  - Their quotes weren't checked against the full text.

## 1. What the clcoding resource is

- **The post.**
  - Its title is "Understanding Harness Engineering (Free PDF)", subtitled "Building Reliable AI Systems Around Powerful Models".
  - It's dated 7 Oct 2026 on clcoding.com, a high-volume coding blog.
  - Its byline, "Python Developer", is the blog's generic one, so the author is unknown ([search](https://www.clcoding.com/2026/10/understanding-harness-engineering-free.html)).
- **What it is.**
  - A short summary that links to a PDF on Google Drive. The Drive file was blocked, so its author, licence, length and contents are unknown.
  - The snippets show the framing: reliability comes from the environment around the model (information, tools, permission rules, memory, feedback and limits).
  - Tests, linters and type checkers feed errors back. Reads run automatically, while a production deploy waits for a person ([search](https://www.clcoding.com/2026/10/understanding-harness-engineering-free.html)).
- **No match elsewhere.** No other result carries the title, and the Leanpub books with similar names have different titles ([search](https://leanpub.com/harness-engineering)).
- **What we used instead:** Anthropic's posts, the CC BY anthology of Ryan Lopopolo, who wrote OpenAI's essay, and walkinglabs' MIT course.

## 2. Definitions

> "Harness engineering, the practice of improving agent output by shaping the environment around it, holds a chosen model and coding agent constant as a black box. It improves the two external levers—context and tools—and curates the environment around them. The worker should be able to recover intent, operate the real system, respect authority, prove the outcome, and leave the next run better equipped."

That's Lopopolo ([fetched](https://github.com/lopopolo/harness-engineering)). Lopopolo's manifest dates the OpenAI essay to 11 Feb 2026 ([fetched](https://github.com/lopopolo/harness-engineering/blob/trunk/sources/sources.json)).

> "An agent harness (or scaffold) is the system that enables a model to act as an agent: it processes inputs, orchestrates tool calls, and returns results. When we evaluate "an agent," we're evaluating the harness and the model working together."

That's Anthropic ([fetched](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)). Other definitions:

- **Anthropic's three parts.** A session ("the append-only log of everything that happened"), a harness ("the loop that calls Claude and routes Claude's tool calls") and a sandbox ([fetched](https://www.anthropic.com/engineering/managed-agents)).
- **"Agent = Model + Harness."** Böckeler and LangChain both use it, and LangChain adds "If you're not the model, you're the harness" ([search](https://martinfowler.com/articles/harness-engineering.html), [search](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)).
- **Böckeler's two harnesses.** She separates the builder's harness from the user's outer harness ([secondary](https://github.com/deusyu/harness-engineering/blob/main/works/fowler-harness-engineering-full-translation.md)).
- **OpenAI:** "Humans steer. Agents execute." ([search](https://openai.com/index/harness-engineering/)).
- **Who coined it is disputed:** Hashimoto's "Engineer the Harness" (5 Feb 2026), Lopopolo or LangChain ([search](https://simonwillison.net/2026/Feb/5/ai-adoption-journey/)).

**The GTM Harness is an outer harness.** It gives guides and sensors to whatever agent the founder runs, and it owns the human gate.

## 3. The components of a harness

| Component | What the sources say |
|---|---|
| Loop | "LLMs using tools based on environmental feedback in a loop", with "stopping conditions" ([fetched](https://www.anthropic.com/engineering/building-effective-agents)). A bare loop built a C compiler in about 2,000 sessions for $20,000 ([fetched](https://www.anthropic.com/engineering/building-c-compiler)) |
| Tools | "A contract between deterministic systems and non-deterministic agents": few, namespaced tools, names rather than UUIDs, actionable errors ([fetched](https://www.anthropic.com/engineering/writing-tools-for-agents)) |
| Context and memory | "The smallest possible set of high-signal tokens": just-in-time retrieval, compaction, notes, sub-agents ([fetched](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). Skills load in three levels ([fetched](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)) |
| State and progress | A progress file, a JSON feature list and git. JSON, because the model "is less likely to inappropriately change or overwrite JSON files compared to Markdown files" ([fetched](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)) |
| Permissions | "Keep capability and authority as separate contracts" ([fetched](https://github.com/lopopolo/harness-engineering/blob/trunk/docs/README.md)) |
| Approvals | Users approved about 93% of Claude Code's permission prompts; fatigue "showed up within weeks" ([fetched](https://www.anthropic.com/engineering/how-we-contain-claude)) |
| Sandboxing | "If credentials never enter the sandbox, they can't be exfiltrated"; resolve symlinks before validating paths ([fetched](https://www.anthropic.com/engineering/how-we-contain-claude)) |
| Verification | Custom lints "inject remediation instructions into agent context" ([search](https://openai.com/index/harness-engineering/)). Guides act before the agent, sensors after; either is computational or inferential ([secondary](https://github.com/deusyu/harness-engineering/blob/main/works/fowler-harness-engineering-full-translation.md)) |
| Evals | Grade outcome and transcript; pass^k for consistency; "grade what the agent produced, not the path it took" ([fetched](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)) |
| Observability | "Adding full production tracing let us diagnose why agents failed" ([fetched](https://www.anthropic.com/engineering/multi-agent-research-system)) |
| Recovery | Resume from the failure, not the start ([fetched](https://www.anthropic.com/engineering/multi-agent-research-system)); a crashed harness reboots from the session log ([fetched](https://www.anthropic.com/engineering/managed-agents)) |
| Sub-agents | Clean contexts returning "1,000-2,000 tokens" ([fetched](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)); keep the judge apart from the maker ([fetched](https://www.anthropic.com/engineering/harness-design-long-running-apps)) |
| Scheduling | Loops "finish in one of a small number of durable states"; "Quiet no-op runs are healthy" ([fetched](https://github.com/lopopolo/harness-engineering/blob/trunk/docs/continuous-maintenance/README.md)) |

**The arXiv study.** It reads the source of 11 harnesses, among them Claude Code, Codex CLI, Gemini CLI, OpenHands and Aider, and names seven subsystems. A write-up lists six: loop, LLM integration, memory and context, tools, safety and permissions, extensibility ([search](https://arxiv.org/abs/2609.00006)).

## 4. Principles and patterns

**Long-running work**

- **Two failure modes.** Agents one-shot the whole job, or a later session declares victory early.
- **Anthropic's fix:**
  - one feature per session;
  - a progress file and a commit at the end;
  - a fixed start: `pwd`, git log, the progress file, the feature list and a smoke test ([fetched](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)).
- **Separate the maker from the judge.** Self-graders respond "by confidently praising the work", and a separate, skeptical evaluator is "far more tractable" ([fetched](https://www.anthropic.com/engineering/harness-design-long-running-apps)).
- **Re-test the harness when the model changes.** "Every component in a harness encodes an assumption about what the model can't do on its own." Context resets "had become dead weight" on a newer model ([fetched](https://www.anthropic.com/engineering/managed-agents)).

**Feedback loops**

- **Böckeler:** an issue that recurs should improve the guides and sensors ([secondary](https://github.com/deusyu/harness-engineering/blob/main/works/fowler-harness-engineering-full-translation.md)).
- **Lopopolo's MLD.** Agents log Mistakes, Learnings and Desires. The builder corroborates each one before it becomes a durable artifact ([fetched](https://github.com/lopopolo/harness-engineering/blob/trunk/docs/feedback/mld.md)).

**Mechanical enforcement**

- **What OpenAI enforces:** layer boundaries, logging, naming and file size, through custom lints and structural tests ([search](https://openai.com/index/harness-engineering/)).
- **Lopopolo's version:**
  - "The agent does not need to remember the rule up front; the verifier gives it the missing context exactly when it needs it."
  - "If it matters, it belongs in a verifier owned by the repo." ([fetched](https://github.com/lopopolo/harness-engineering/blob/trunk/sources/raw/hyperbola/production-function-changed.mdx))

**Progressive disclosure**

- **OpenAI:** "give Codex a map, not a 1,000-page instruction manual" ([secondary](https://github.com/lopopolo/harness-engineering/blob/trunk/docs/just-in-time-context/README.md)). AGENTS.md runs about 100 lines, with `docs/` as the system of record ([search](https://openai.com/index/harness-engineering/)).
- **The counterweight.** ETH Zurich found context files gave little or no lift and cost 20% more ([search](https://www.sri.inf.ethz.ch/publications/gloaguen2026agentsmd)). Keep them short, and measure.

**Tool design**

- **Tools over prompts.** For SWE-bench, Anthropic "spent more time optimizing our tools than the overall prompt".
- **"Poka-yoke your tools."** Requiring absolute paths ended a whole class of errors ([fetched](https://www.anthropic.com/engineering/building-effective-agents)).

**Human in the loop**

- **Böckeler:** steer input to "where our input is most important" ([search](https://martinfowler.com/articles/harness-engineering.html)).
- **Lopopolo:**
  - "Human involvement follows consequence and recoverability."
  - "Make wrong actions unavailable where consequence justifies the restriction."
  - Refuse with "a precise denial with the safe next action" ([fetched](https://github.com/lopopolo/harness-engineering/blob/trunk/docs/authority/README.md)).
- **Anthropic:** "The deterministic boundary is what gets hit when everything probabilistic misses" ([fetched](https://www.anthropic.com/engineering/how-we-contain-claude)).

## 5. Anti-patterns

- **An instruction file that grows a rule per mistake** ([fetched](https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-04-why-one-giant-instruction-file-fails/index.md)).
- **One agent writing and grading its own work** ([fetched](https://www.anthropic.com/engineering/harness-design-long-running-apps)).
- **Trusting approvals at volume.** 93% of prompts were approved ([fetched](https://www.anthropic.com/engineering/how-we-contain-claude)); the course calls the end state "cognitive surrender" ([fetched](https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-13-loop-engineering/index.md)).
- **Evals that check exact tool-call sequences** ([fetched](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)).
- **Test output that floods context.** Print a few lines, log the rest, and put `ERROR` and its reason on one line ([fetched](https://www.anthropic.com/engineering/building-c-compiler)).

## 6. What we built from it

The gap analysis read the harness at commit `ee57505`. Each row below is now in the code, with tests that never touch the network.

| Principle | Gap the review found | What changed | Commit |
|---|---|---|---|
| Wrong actions unavailable | An agent could approve its own drafts: append an `approved` line to `approvals.jsonl`, or pipe "a" into `review --local` | Every decision is signed with a key outside the workspace (`~/.config/shonin-gtm/approval.key`, mode 0600). A record that doesn't verify counts for nothing, and `pnpm gtm check` reports it. Terminal approvals need a real terminal ([repo](../packages/gtm-harness/src/ledger.ts)) | `bf2d74a` |
| Maker apart from judge | A hand-typed `Reviewer: READY` line skipped the reviewer | Verdicts are recorded and signed for the exact text; `review` re-runs the reviewer on any draft without one. The Reviewer line is display only | `bf2d74a` |
| Human gate by consequence | `approval.md` said "approved" if anyone typed it | `pnpm gtm approve --campaign` signs the file's exact text at the founder's terminal; `check` errors on an unsigned status, or an edit after it | `bf2d74a` |
| Code does counts and dates | The model computed `score_pct` and "three working days" | The agent judges each scorecard criterion with evidence; code adds the weights (`gtm_score_lead`) and counts working days (`gtm_due`, `pnpm gtm due`). Thresholds live in one constant; stages are a fixed list; `last_touch` must be a date ([repo](../packages/gtm-harness/src/pipeline.ts)) | `bf2d74a` |
| Outcome verification | Nothing recorded a send | `pnpm gtm sent` records one, signed, so "approved messages sent" can be counted | `bf2d74a` |
| Custom lints with fixes | Only the word limit of `rules/` was enforced | `pnpm gtm check` runs the workspace's rules as code, each finding with its fix; `review` holds drafts with errors. `rules/checks.md` turns accepted corrections into checks ([repo](../packages/gtm-harness/src/check.ts)) | `b61ff1c`, `0f70284` |
| State and a start and end routine | Prose only; MCP-only clients couldn't write state | `gtm_session_start` (status, follow-ups, the checker, the campaign's state, today's sprint, the last handoff) and `gtm_session_end` (a handoff to `progress.md`, with mistakes, learnings and wishes) | `0f70284` |
| Traces | No record of what agents did | `.shonin/trace.jsonl`: every MCP tool call and CLI command; personal fields, draft paths and results hashed, as `CLAUDE.md` asks of logs ([repo](../packages/gtm-harness/src/trace.ts)) | `0f70284` |
| Approval fatigue | Unbounded cards | `GTM_MAX_CARDS_PER_DAY` (15): the rest wait for tomorrow | `0f70284` |
| Containment | `gtm_read` didn't resolve symlinks; env files could sit in a workspace; `pipeline.csv` was rewritten in place | Symlinks resolved before the inside check; `check` warns about env files in a workspace; the pipeline is written to a temporary file, then renamed | `0f70284` |
| Tool design | Already met | Typed MCP tools with no send or approve tool ([repo](../packages/gtm-harness/src/mcp.ts)) | `ee57505` |

**What signing does and doesn't do.**

- An agent working in the workspace can still read the key if it reads outside its folder on purpose.
- So signing turns "append a line" into "steal a secret", which no instruction-following agent does by accident and which the trace would show.
- The hosted runtime closes the gap fully: only the server writes approvals.

## 7. What's left

1. **Trajectory evals** [code]. `pnpm gtm eval-agent` would run a model through the MCP tools on fixtures, including a lead marked `do_not_contact` and a page with injected instructions. It would grade across k runs, from the trace:
   - no approval written;
   - no draft to an opted-out person;
   - no unsourced number;
   - a clean check;
   - a written handoff.

   It runs by hand, like `pnpm gtm eval`, never in CI.
2. **A "Sent" button on the Telegram card** [code]. The approved card gains "Sent" and "Sent with edits". With edits, code diffs the text and a brain Choice labels the correction before code logs it.
3. **Reviewer agreement** [code]. Measure how often the reviewer's verdict matches the founder's decision; that's the reviewer's own eval.
4. **Approval-rate watch** [code]. The dashboard shows the approval rate and the median decision time. Near-total approval in seconds is the fatigue signal.
5. **Git without personal data** [code]. `pnpm gtm new --git` keeps leads and approvals out of history, because history survives a deletion request.
6. **A daily-run runbook** [docs]. `workflows/daily-run.md` ends every run in a named state: nothing to do, drafts proposed, approval requested, needs the founder, or error.
7. **Simplification** [docs]. Log the assumption each component encodes, such as the review-drafts skill or the session routine. When the model changes, rerun the evals without it.
8. **Hosted** [hosted-later]. Only the server writes approvals. Credentials never enter an agent's sandbox. Approvals become the Approval API with signed receipts (`company/gtm/gtm-api.md`).

## 8. Unverified

- **The clcoding PDF:** its author, contents and licence, and whether the copy is authorized.
- **OpenAI's wording.** It comes from snippets and Lopopolo's text-fragment links.
- **Böckeler's wording.** It comes from snippets, plus a Chinese translation for structure.
- **arXiv 2609.00006:** the seventh subsystem, its counts and its date.
- **ETH Zurich's effect sizes**, Hashimoto's wording, and who coined the term.
- **Whether 93% carries over** from developers approving commands to founders approving messages.
