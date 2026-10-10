# Beta plan review: CEO and engineering (Sat 10 Oct 2026, night)

**Reviewed:** `beta-plan.md`, with `harness-plan.md` §7–13, `gtm-api.md`, the harness README, and `packages/gtm-cloud/src` as of 02:53 (store, crypto, config, types, repo, auth, actions, connectors). `bridge.ts`, the routes and the tests don't exist yet. **Method:** gstack `plan-ceo-review` (SELECTIVE EXPANSION) and `plan-eng-review`, run by hand. Wherever a skill says to ask, the reviewer took the recommended option; the choices that need the founder are under Decisions. The outside voice was skipped because there was no second model.

**Verdict:** the shape is right and the code is clean, but it isn't safe to deploy. Three gaps can post text the founder didn't approve, or post it twice: an approval binds to the stored text rather than the text the founder saw; `decide` and `execute` can race; a crashed run leaves an unknown outcome. Config fails open too. About 35 files is too much for one Sunday, so cut to a Telegram-first wedge.

## Part 1: CEO review

### 0A. Premise

- **Real outcome:** activation, meaning a first approval within 24 hours (`harness-plan.md` §11). The plan's done-line, "five people signed in", is a stand-in for it.
- **It breaks its own rule.** `harness-plan.md` §12 says: "The hosted build starts only after stage 1 shows value internally." Stage 1 began Thu 8 Oct, and its exit is 20 approved messages. Pulling hosting forward is defensible, since marketers can't run a CLI, but make that choice on purpose (D4).
- **The cost of doing nothing is low:** concierge, through `pnpm gtm` and a bot per founder, works today. Hosting adds sign-in, the Desk, auto-posting and a remote MCP URL.

### 0B. What already exists

| Sub-problem | Existing | Reused? |
|---|---|---|
| Plan, workspace, export | `generatePlan`, `normalizePlan`, `buildHarness`, `zipHarness`; `/api/gtm/run` | Yes (export not yet used) |
| Draft checks, links | `checkDraft`, `draftContext`, `sendLink` (pure) | Yes, in `actions.ts` |
| Signed approvals | harness `ledger.ts` | Rebuilt in `crypto.ts`; justified, because it needs a server key |
| MCP toolset | harness `mcp.ts` | **No.** It uses `node:fs/promises` throughout, so it can't run "unchanged" on Vercel with Redis. Plan §4 is wrong here |
| Ops alerts | the site's lead-alert bot | Not mentioned; reuse it |

### 0C. Dream state

```
CURRENT                       THIS PLAN                         12-MONTH IDEAL
pnpm gtm, local ledger,  ---> hosted /beta on Upstash,     ---> Postgres + durable workflows,
bot per founder,              shared bot, posts to 3 own        scheduled posts, eval'd models,
1 user                        channels, bearer MCP, 5 users     OAuth MCP, verifiable receipts
```

It moves toward the ideal, provided the Action, Approval and Receipt types survive the move to Postgres. Only `repo.ts` knows the Redis keys, which helps.

### 0D. Alternatives

| | A. As written | B. Telegram-first (recommended) | C. Ideal |
|---|---|---|---|
| Scope | Every surface; X, Slack, Telegram; 16-tool MCP | Sign-in, plan, Desk, Telegram approvals, posts to their Telegram channel and Slack, links for DMs, 7-tool MCP; X for Edidiong only | Vercel Workflow, Postgres, OAuth MCP |
| Effort / risk | L / High | M / Med | XL / High |
| Con | 35+ files with untested races | Other users wait for X | Not a weekend |

**Choose B.** It is the narrowest product that still proves "approve on your phone, it runs on your channel", and it holds back the two pieces with the most cost and build risk.

### 0E. Temporal interrogation

- **Hour 1:** Next 16 routes take a Web `Request`. Use the MCP SDK's web-standard Streamable HTTP transport, stateless, with a new server per request. Add `@repo/gtm-cloud` to `apps/web` and to `transpilePackages`.
- **Hours 2–3:** The reviewer runs on the server, never from agent input. A draft is an `Action`; files hold brain, rules and pipeline.
- **Hours 4–5:** One webhook per bot means a separate dev bot. The X callback URL must match exactly. X bills Shonin's developer account per post. Plan generation takes 30–90 seconds, so set `maxDuration`. Certificate-transparency logs expose the staging host within minutes.
- **Effort:** about 2 weeks for a human team, about 1.5 days of Claude Code (scope B).

### Expansions

| Expansion | Effort | Why | Call |
|---|---|---|---|
| Kill switch `BETA_RUNS=off` (own-channel actions become link-only) | S | A rollback for auto-posting | **Accept** (MUST 7) |
| Ops alerts plus a read-only `/beta/admin` | S–M | Running five strangers' accounts blind is the top Monday risk | **Accept** (SHOULD 3) |
| Export and delete a workspace | S | Leads are personal data; §7 promises both | **Accept** (SHOULD 4) |
| Reviewer provider on each card; decision latency | S | The rubber-stamp metric in §11 | **Accept** (SHOULD 9) |

**Deferred:** a 60-second undo window (needs a scheduler); the daily digest (cron and time zone); public Ed25519 receipts (HMAC can't be checked by a third party); OAuth MCP; a bot per founder; editing by Telegram reply; alternative C. **Skipped:** driving Telegram Web or MTProto as the founder. The plan already rejects it, correctly.

**The 10-star version:** a founder sends the bot a voice note, "we demo Friday, announce it". Two minutes later they have an X post, a channel post and three DMs to the leads most likely to come, each reviewed and checked, and the posts carry an undo window. Their subagents draft overnight through MCP, and anyone can verify every receipt.

**The Monday wedge:** invite, describe the product, get a plan and three drafts. Link Telegram and approve on the phone; the post lands in their channel or Slack, and DMs come back as one-tap links. The Desk mirrors the queue and its receipts. MCP has 7 tools, and X runs only in Edidiong's workspace.

### Sections 1–11

| # | Section | Label | Finding |
|---|---|---|---|
| 1 | Architecture | WARNING | `execute` runs inside the request; every state change is a Redis read-modify-write; the bridge needs a new server. Rollback is Vercel rollback, plus the kill switch and `deleteWebhook` |
| 2 | Errors | CRITICAL GAP | A post that succeeds before a failed save, or a function killed mid-post, leads to a re-post or to `approved` stuck with no retry. `execute`'s catch-all merges rate limits, auth failures and unknown outcomes |
| 3 | Security | CRITICAL GAP | Dev-key fallback, open sign-up, CSRF/XSS on approve, forged agent reviews (threat model below) |
| 4 | Edge cases | CRITICAL GAP | `decide` signs the stored text, not the text the founder saw; an old Telegram card approves edited text (`decide` accepts `draft`); double clicks and approve/reject taps race |
| 5 | Code quality | OK | Small modules with `fetch` passed in. `xAccess` saves a stale workspace; `void ws`; `linkFor` is called twice |
| 6 | Tests | CRITICAL GAP | `test/` is empty, so `vitest run` exits 1 and `pnpm check` fails CI |
| 7 | Performance | WARNING | 200 GETs per Desk load; admin bots receive all group chatter; plan generation takes 30–90 seconds |
| 8 | Observability | WARNING | A good per-workspace event log, but no ops alerts and no admin view |
| 9 | Deployment | WARNING | Env checklist, webhook secret, B5, Upstash in the functions' region, no smoke test |
| 10 | Trajectory | OK | Reversibility 4/5. Debt: the Redis model, HMAC receipts, the bridge drifting from the harness MCP |
| 11 | Design | WARNING | Ship 3 screens, not 7; onboarding needs a progress state; mobile-first; measure "a minute later" before claiming it; `beta-design-brief.md` isn't in the repo |

## Part 2: Engineering review

### Step 0: scope

The plan is about 35 files: gtm-cloud (12), 7 pages and about 10 routes, plus three new services (store, executor, bridge). That trips the 8-file gate. **A smaller arrangement with the same features:** 3 pages; 6 routes (`session`, `workspace`, `actions` with an `op` field, `telegram/webhook`, `x/[step]`, `mcp`); all logic in `@repo/gtm-cloud`. That's about 20 files. Scope is accepted with the B cuts (D1, D3).

### Architecture

```
 Telegram (phone)            browser /beta                 agent (Claude Code, bot)
   │ update                    │ POST + cookie                │ Bearer token
   ▼                           ▼                              ▼
 /api/beta/telegram/webhook  /api/beta/{session,workspace,actions}  /api/beta/mcp
  secret → update_id dedupe    Origin check → ownedWorkspace     tokenHash → wsId, 7 tools
  → from.id = linked user
   └──────────────┬────────────┴───────────────┬──────────────────┘
                  ▼                             ▼
   @repo/gtm-cloud: createAction → requestApproval → decide(expectedHash)
                  │                   SET decision:id NX → sign approval
                  ▼
   execute: lock → reload → SET ran:id:hash NX → post → signed receipt → done
                  │                                   (crash after marker → unknown)
       X API v2 · Telegram Bot API · Slack webhook        Upstash REST: state, locks, caps
```

**Action states:** `held ⇄ draft → pending → approved → running → done | failed | unknown`, plus `pending → rejected`. Any edit, except on `done` or `running`, goes back to `draft` or `held` and voids the approval. `unknown` is left only through a founder's "it didn't post".

### Failure modes (no tests exist, so TEST is N throughout)

| CODEPATH | FAILURE MODE | RESCUED? | TEST? | USER SEES? | LOGGED? |
|---|---|---|---|---|---|
| onboarding | model timeout, 429, refusal, bad JSON; no `maxDuration` | Partly (templates) | N | a template plan or a 504 | N |
| onboarding | double submit | N | N | two workspaces at twice the cost | N |
| web decide | double click finishes after the first run | N | N | double post | partly; **CRITICAL** |
| web decide | approve and reject race | N | N | posted but shown as rejected | N; **CRITICAL** |
| web decide | text changed after the founder looked | N | N | **silent: unseen text posts** | N; **CRITICAL** |
| web decide | CSRF | N | N | **silent post** | N; **CRITICAL** |
| TG webhook | forged update; callback from a non-owner | not written | N | a stranger approves | N; **CRITICAL** |
| TG webhook | retried update; slow work, then a retry | partly (status check) | N | duplicate drafts or replies | N |
| TG webhook | reject arrives after approve | Y | N | "already decided" | Y |
| TG webhook | group chatter reaches the admin bot | N | N | cost; private messages stored | N |
| `xAccess` | expired token; racing refreshes (single-use refresh tokens) | partly | N | "Connect X again" | Y |
| connectors | X 429/402/403-duplicate; bot removed; Slack 404 | Y (`failed`, retry) | N | the error text | Y |
| execute | posted, then `saveAction` fails | N | N | `failed`, and retry posts again | partly; **CRITICAL** |
| execute | function killed mid-post | N | N | **silent: stuck `approved`** | N; **CRITICAL** |
| bridge | forged `review` in the arguments | N | N | **silent: "Reviewer: ready"** | N; **CRITICAL** |
| bridge | token leak; injection in workspace files | rotation planned | N | lead data read; agent steered | N |
| auth | no email verification and no Telegram linked | N | N | locked out after clearing cookies | N |
| config | production keys missing, so dev keys are used | only if each route checks `missing` | N | **silent: forgeable sessions** | N; **CRITICAL** |
| store | KV env missing, so the memory store is used | N | N | **silent: data lost per instance** | N; **CRITICAL** |
| store | Upstash outage or hang (no timeout) | N | N | a 500 or a hang | Vercel only |
| caps | web decide on a draft skips the card cap; runs are uncapped; `INCR` then `EXPIRE` isn't atomic | N | N | nothing | N |

### Threat model

| Threat | L | I | Mitigated? |
|---|---|---|---|
| A route skips `cfg.missing`, so sessions sign with keys derived from a string in the source | Med | High | No (MUST 1) |
| Open sign-up burns plan generations (~$0.22 each, `gtm-api.md` §3) | High | Med | No (MUST 8) |
| CSRF, or stored XSS from agent drafts, triggers approve → posts on X | Med | High | No (MUST 11) |
| A forged or foreign Telegram callback | Med | High | Partly (MUST 5) |
| A leaked link code makes its redeemer the approver; X OAuth state not bound to the session | Low | High | No (MUST 6) |
| A leaked agent token reads leads, spams cards, and a tired founder approves | Med | Med | Partly (token stored as a hash) |
| Injection in research or lead files steers the founder's local agent | High | Med | No (SHOULD 7) |
| `telegram_post` aimed at another workspace's group; an action id from another workspace | Med | High | **OK:** targets checked in `createAction` and `execute`; `load()` checks `workspaceId` |
| One user gets Shonin's X app suspended for everyone | Med | High | No (D1) |
| A dump of Redis | Low | High | **OK:** AES-GCM and hashed tokens |

### Tests that must exist before deploy (MemoryStore with fault injection, fake `fetch`)

- **T1:** production without the keys or KV fails closed.
- **T2:** tampering breaks `verify`; an expired seal fails; a bad GCM tag throws.
- **T3:** the happy path per channel ends in a verifying receipt; link channels never call `fetch`.
- **T4:** two `decide` calls with a paused `fetch` post once, in both orders; approve vs reject yields one outcome.
- **T5:** a post followed by a failed save ends `unknown`, and `retry` needs a confirmation.
- **T6:** an edit voids the approval; a stale `expectedHash` or an old card gets a 409.
- **T7:** the 16th card gets a 429; the run and create caps hold.
- **T8:** a bad secret gets a 401 with zero store calls; a duplicate `update_id` is decided once; a foreign `from.id` is refused; group messages write nothing.
- **T9:** concurrent X posts refresh the token once.
- **T10:** the bridge's tool list equals the allowlist; a `review` argument is ignored; one workspace's token can't read another's.
- **T11:** the invite gate holds; a login code works once.
- **T12:** a missing or removed Telegram target fails with a message.

### Worktree lanes

| Step | Modules | Depends on |
|---|---|---|
| A. Core: store, auth, actions, `withLock`, tests | `packages/gtm-cloud` | none |
| B. UI | `apps/web/app/beta` | A's types |
| C. Connector routes | `apps/web/app/api/beta/{telegram,x,slack}` | A |
| D. Bridge | `gtm-cloud/src/bridge.ts`, `app/api/beta/mcp` | A |

Launch A first; once it merges, run B, C and D in parallel. **Conflicts:** `index.ts`, `types.ts`, `apps/web/package.json`, `next.config` and `pnpm-lock.yaml` belong to lane A. `CLAUDE.md` has no line for this work; propose a `beta` line (port 3013) through ops.

## MUST FIX BEFORE DEPLOY

1. **Fail closed.** In production, `config.ts` `betaConfig` throws, or a single `betaRoute()` wrapper answers 503, when a key is missing. `store.ts` `storeFromEnv` refuses the memory store when `VERCEL_ENV` is set.
2. **Bind approval to the text the founder saw.** `actions.ts` `decide(…, expectedHash)` answers 409 on a mismatch. The web form posts the hash, Telegram `callback_data` becomes `a:<id>:<hash12>`, and `editAction` strips the old card's buttons.
3. **Atomic decisions and run-once.** `decide` sets `decision:<id>` with NX before signing. `execute` reloads after taking the lock and stops on `done`, then sets `ran:<id>:<hash>` with NX and no TTL before the external call, and never deletes it.
4. **Unknown outcomes.** Add `running` and `unknown` to `ActionStatus` (`types.ts`). In `execute`, a run marker without a receipt, or `approved` older than 2 minutes, becomes `unknown`. `retry` requires an explicit "it didn't post".
5. **The Telegram webhook route.** Check the secret header with `safeEqual`. Dedupe with `SET tg-update:<update_id> NX EX 86400`. Accept a callback only when `from.id` equals `ws.telegram.userId` for the action's own workspace. Take chat requests only from the linked user's private chat. Drop group messages before any store call. Answer 200 quickly and do the work in `after()`.
6. **Linking flows bound to the session.** The Telegram link code is single-use, lasts 10 minutes and is tied to the workspace; the Desk then shows "@handle approves here" with Unlink. `x-oauth:<state>` holds `{uid, wsId, verifier}`, is read with GETDEL, and its `uid` must match the session on callback.
7. **Caps and kill switch.** Add `cap:run:<ws>:<day>` in `execute` (X: 5 a day) and 100 creates a day in `createAction`. `decide` on a `draft` counts toward the card cap. `BETA_RUNS=off` in `config.ts` makes every action link-only.
8. **Gate and cost.** Default `BETA_GATE` to `invite`. The onboarding route gets a global cap of 40 plan generations a day, at most 3 workspaces per user, and an idempotency key.
9. **The bridge allowlist.** `bridge.ts` has 7 tools that call only reads, `createAction` and `requestApproval`. It drops `review`, `source` and `author` from the arguments and runs the reviewer on the server. It has no decide, execute, retry, markSent or connector tools.
10. **`withLock(ctx, key, fn)`.** Use it around `repo.ts` `saveFiles` and lead writes (concurrent subagents lose rows), and around `actions.ts` `xAccess`, reloading the workspace inside the lock.
11. **CSRF and XSS.** Every `/api/beta/*` POST except the webhook and mcp checks `Origin === cfg.siteUrl`. The cookie is HttpOnly, Secure and SameSite=Lax. The Desk renders drafts and files as plain text or sanitized markdown: no raw HTML and no `javascript:` links.
12. **CI passes.** Add T1–T12 in `packages/gtm-cloud/test/`, and commit `pnpm-lock.yaml` for the new package so the frozen install passes.

## SHOULD FIX BY MONDAY

1. Add `Store.mget` and use it in `listActions`, 50 per page. Poll the Desk no faster than every 15 seconds: 200 GETs every 5 seconds is about 3.4M Upstash commands a day per open tab.
2. `UpstashStore.command` gets `AbortSignal.timeout(5000)` and throws a named `StoreError`; the page says "Storage is down; nothing ran."
3. Ops alerts to Edidiong's existing bot for `failed`, `unknown`, 5xx responses and sign-ups. A read-only `/beta/admin` for his user id.
4. Before external invites: a one-page privacy note and beta terms (the §9 launch gates), and export (`zipHarness`) and delete for a workspace.
5. `createAction` requires `to` for `telegram_post`. `approvalCovers` checks `workspaceId`. `seal` payloads carry a `purpose` field. `decrypt` uses AAD of workspace id plus field.
6. `redeemLoginCode` uses GETDEL and redeems on POST, so link scanners can't spend codes. Add `sessionVersion` for "sign out everywhere".
7. In the bridge, `gtm_read` labels its output as data with its source. Setup uses `claude mcp add --scope user`, never a project `.mcp.json`. Every tool call is logged with the token hint.
8. The onboarding route gets `maxDuration = 300` and says "made with templates" when the model failed. Draft-by-chat runs in `after()`.
9. Each card shows the reviewer's provider ("ready (heuristic)"). Log decision latency.
10. `updateCard` logs its failures instead of swallowing them. The cap counter becomes `SET NX EX`, then `INCR`. Days are UTC; document it.

## DECISIONS FOR THE FOUNDER

| # | Decision | Recommendation |
|---|---|---|
| D1 | X auto-posting for beta users | Your workspace only on Monday; everyone else gets an X intent link. Posts bill Shonin's developer account ($0.015, or $0.20 with a link), and one spammer can get the app suspended for all |
| D2 | The gate (replaces B4) | Invite-only from the first deploy, one code per person |
| D3 | MCP on Monday | 7 tools on a new thin server in gtm-cloud; the fs-bound 16-tool server later |
| D4 | Hosting before stage 1 proves value (harness plan §12) | Accept it on purpose; send invites only after one full day on staging, with 5 or more approved actions and a post on each channel |
| D5 | Shared bot vs a bot per founder | Shared for the beta, with MUST 5's `from.id` checks; revisit at 20 users |
| D6 | Third-party leads before a privacy note | Not in hosted workspaces until SHOULD 4 ships |

## Lake Score and Completion Summary

**Lake Score: 5/6.** The complete option won on run idempotency, webhook hardening, the test plan, session revocation and store errors. The partial option won on abuse: an invite gate and caps, not per-IP rate limiting.

```
+====================================================================+
|            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
+====================================================================+
| Mode selected        | SELECTIVE EXPANSION                         |
| System Audit         | harness MCP fs-bound; no tests; CI fails    |
| Step 0               | Approach B (Telegram-first); D1–D6          |
| Section 1  (Arch)    | 4 issues found                              |
| Section 2  (Errors)  | 21 rows mapped, 10 CRITICAL GAPS            |
| Section 3  (Security)| 10 threats, 6 High impact unmitigated       |
| Section 4  (Data/UX) | 6 edge cases mapped, 5 unhandled            |
| Section 5  (Quality) | 3 issues found                              |
| Section 6  (Tests)   | Plan produced, 12 gaps (zero tests exist)   |
| Section 7  (Perf)    | 3 issues found                              |
| Section 8  (Observ)  | 3 gaps found                                |
| Section 9  (Deploy)  | 5 risks flagged                             |
| Section 10 (Future)  | Reversibility: 4/5, debt items: 3           |
| Section 11 (Design)  | 4 issues                                    |
+--------------------------------------------------------------------+
| NOT in scope         | written (7 deferred, 1 skipped)             |
| What already exists  | written                                     |
| Dream state delta    | written                                     |
| Failure modes        | 21 rows, 10 CRITICAL GAPS                   |
| Scope proposals      | 12 proposed, 4 accepted                     |
| Outside voice        | skipped (no second model in this run)       |
| Lake Score           | 5/6                                         |
| Diagrams produced    | 3 (dream state, architecture, states)       |
| Parallelization      | 4 lanes: A first, then B, C, D in parallel  |
| Unresolved decisions | 6 (D1–D6, for Edidiong)                     |
+====================================================================+
```

**Status:** DONE_WITH_CONCERNS. Deploy once MUST 1–12 pass `pnpm check`.
