# Helix Foundry: an open-source company ontology, and what the GTM Harness takes from it

**Checked:** Sat 10 Oct 2026, from the repo's README, `docs/API.md` and `docs/HOSTING.md`. Tags: **[PAGE]** read on the repo; **[SEARCH]** a search result only; **[OURS]** our own reading.

## 1. What it is

- **One line:** "Your company's data, connected into one ontology, on your own computer." [PAGE]
- **Licence:** Apache-2.0, attribution in a NOTICE file. [PAGE] That lets us call it, ship alongside it, or fork it; it is not AGPL like Postiz.
- **Maturity on 10 Oct:** 841 stars, 119 forks, 17 commits on `main`, 9 open issues, no tagged release. [PAGE] Young and moving: pin a commit.
- **The launch post** (DataChaz on X, linked by Edidiong) frames it as "an open-source alternative to Palantir Foundry". A search for that framing found nothing beyond the repo [SEARCH]; treat the comparison as the poster's, not the project's.

## 2. How it works [PAGE]

| Part | What it does |
|---|---|
| Sources | Neon, Supabase, PlanetScale, Postgres, MySQL, Stripe, WorkOS, PostHog, REST APIs, S3-compatible storage, CSV/JSON/JSONL/Parquet uploads, an ingestion API (10,000 rows per call) |
| Change capture | Native CDC for Postgres and MySQL where it works; otherwise snapshot refreshes on a UTC schedule (default every 5 minutes) |
| Snapshots | Immutable Parquet with profiles, schema-drift review and history |
| Ontology | Stored in HelixDB as objects and relationships; graph traversal at `/objects/:id/neighbors` |
| Analyst | Questions answered "backed by executed SQL with snapshot citations"; SQL runs in a separate DuckDB executor "on an internal network with no internet access" |
| Models | Ollama `qwen3:4b` locally by default; Claude or OpenAI by choice |
| Changes | AI-proposed changes are validated and "wait for your review"; a change is previewed, returns a hash, and only that exact hash executes (`/actions/change/preview` → `/actions/change/execute`) |
| API | `/api/v1/workspaces/:id/…`, OpenAPI at `/api/docs`, a TypeScript SDK, workspace-scoped tokens that can be read-only |

**The same shape as ours [OURS].** Preview → hash → execute exactly that hash is our approval gate (`packages/gtm-harness/src/outbox.ts`, `packages/gtm-cloud`). "Answers backed by executed SQL" is the split: the model writes the query, code counts.

## 3. Limits that decide how we use it [PAGE]

- **One person, one machine.** "Helix Foundry is built for one person on their own computer." "Anyone who can reach the app controls every workspace."
- **Never on a network.** "Never expose it with a reverse proxy, tunnel or port forward." `HOSTING.md`: "Foundry has no sign-in and must not be exposed to a network."
- **Platform.** Built and validated on macOS (Apple Silicon); CI on Linux; Windows untested; scripts need bash. First run downloads several GB.
- **Keys.** Lose the key and stored credentials can't be recovered. `docker compose down -v` deletes everything.
- **Undocumented:** the response shape of `/query` ("a read-only result and profile") and of Analyst runs.

## 4. What the GTM Harness does with it

**Decision [OURS]: connect to it; don't host it, don't fork it yet.**

1. **The company graph connector** (built, `packages/gtm-harness/src/connectors/graph.ts`, MIT). It holds no `@repo/brain` code.
   - The founder runs Foundry on their own machine and makes a read-only token.
   - `pnpm gtm ground <workspace> --queries <file>` sends each evidence query (`{claim, inputs, sql}`) to `POST /query`.
   - Code refuses anything but one SELECT, and refuses any answer that isn't one row with one number. So the workspace gets aggregates ("1240 merchants paid in September"), never customer rows.
   - Each value goes to `brain/products/evidence.md` with its SQL and date. The claims check already reads `brain/products/`, so a draft may quote that number and no other.
2. **Why only aggregates.** Foundry can't be on a network, and our hosted Desk shouldn't hold a client's customer table. Aggregates with their SQL can go anywhere: the Desk, a Telegram card, an approval receipt. The raw data stays where it is.
3. **Next, in order:**
   - **ICP from the data.** An evidence pack per segment (who pays, who churned, median deal size), then the brain scores prospects against it (Score questions, not model labels).
   - **Ask, gated.** `foundry.ask()` through `/assistant/runs` with `intent: "answer"`, once its response shape is documented; the SQL it ran is shown on the card.
   - **Enterprise and government.** Foundry runs inside the client's own network or sovereign cloud next to the self-hosted harness (`company/gtm/gtm-harness-master-plan.md` §6). We'd need sign-in in front of it; that is the fork-or-contribute decision (G3 there).

## 5. Sources

- https://github.com/HelixDB/helix-foundry (README) [PAGE]
- https://github.com/HelixDB/helix-foundry/blob/main/docs/API.md [PAGE]
- https://github.com/HelixDB/helix-foundry/blob/main/docs/HOSTING.md [PAGE]
- https://x.com/DataChaz/status/2108808425329340699 (the launch post Edidiong shared; not fetched, x.com is blocked from our tools)
- https://openalternative.co/tags/helixdb (HelixDB: Apache-2.0, Rust graph-vector database) [SEARCH]
