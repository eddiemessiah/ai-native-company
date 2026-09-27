# Jev (TypeSafe AI "System One") — verified technical reference

Compiled 2026-09-26 for the agent-native agency (Edidiong Umana / DeFi Messiah). Stack assumed: Next.js + TypeScript (+ Solidity).

**Versions pinned in this document:** `@typesafe-ai/sdk@0.6.0` (npm latest), `typesafe-sdk==0.7.1` (PyPI latest), model `jev-1.13.0` (behind `jev-latest`), `ai@7.0.116` + `@ai-sdk/typesafe-ai@3.0.8` + `@ai-sdk/gateway@4.0.94`, `@langchain/typesafe@0.0.1`, `@openrouter/sdk@1.3.32`.

### Evidence legend (every claim below carries one)

| Tag | Meaning |
|---|---|
| **[SRC]** | Read in published package source or `.d.ts` (npm tarball, PyPI wheel, source maps, public SDK repo tests). **[SRC+RUN]** = also executed here: `tsc --noEmit` and/or a local mock server capturing the exact bytes the SDK sends. |
| **[DOCS]** | Official docs.typesafe.ai page content. docs.typesafe.ai is blocked from this sandbox, so these were read through `datawhalechina/jev-cookbook/content/*`, a page-for-page Chinese translation of the official Mintlify docs (cloned 2026-09-26), and translated back here. The official skill repo `typesafe-ai/skills` is read directly (primary). |
| **[REPO]** | Read first-hand in a public GitHub repo (official or community; the repo is named). |
| **[SEARCH]** | Seen only in search-engine summaries or secondary write-ups; not read first-hand. Treat as unverified. |

---

## 0. TL;DR and audit of the viral article's claims

- Jev is a **decision model, not a text model**. You send one `state` plus named typed questions (`choice` / `score` / `noul`). All questions are answered **independently and in parallel** in one pass. You get back probabilities (plus a `confidence` statistic for choice and score).
- In TypeScript: `new TypeSafeClient()` → `await client.systemOne({ state, questions: { x: choice(...), y: score(...), z: noul(...) } })` → `res.answers.x.choice`. The client option is `defaultModel` (not `model`). Retries go under `retry: { maxRetries }`. `usage` fields are snake_case.
- Direct API access is **waitlisted**. It is reachable **today** through the Vercel AI Gateway (AI SDK 7 `experimental_evaluate`, model `typesafe-ai/jev-latest`) and OpenRouter (`POST /api/alpha/decisions`, model `~typesafe/jev-latest`).

| Viral-article claim | Verdict | Evidence |
|---|---|---|
| Endpoint `POST https://api.typesafe.ai/v1/systemone` | ✅ True | [SRC+RUN] |
| Env var `TYPESAFE_API_KEY` | ✅ True for both official SDKs and LangChain. ⚠️ The Vercel `@ai-sdk/typesafe-ai` provider reads **`TYPESAFE_AI_API_KEY`** instead | [SRC] |
| `pip install typesafe-sdk` (Python ≥3.10) | ✅ True (`Requires-Python >=3.10`); latest 0.7.1 | [SRC] |
| `npm install @typesafe-ai/sdk` (Node 20+) | ✅ True (`engines.node >=20`); latest 0.6.0 | [SRC] |
| Default model `jev-latest` → `jev-1.13.0` | ✅ True (`jev-preview` → `jev-1.13.0` too) | [SRC] default, [DOCS] alias table |
| $0.042 / 1M input tokens, output free | ✅ True (listed as $42/Btok). The OpenAPI schema says output tokens are "currently free of charge". Early-access price | [DOCS], [SRC] OpenAPI description |
| 70–500 ms latency | ⚠️ Vendor claim, not an SLA. Community measurements run from ~0.2 s to ~1.4 s per call (see §5) | [SEARCH], [REPO] |
| 64k tokens (state + all questions), 32k (state + longest question) | ✅ True | [DOCS] |
| 250k tokens/s and 1,200 req/min | ✅ True, but docs warn these limits are "being dynamically adjusted" and "may change without notice" | [DOCS] |
| SDKs retry with backoff | ✅ True: 2 retries by default, 500 ms doubling to a 5 s cap, 25% jitter, retries 408/429/5xx, honours `Retry-After` | [SRC] |
| Choice up to 255 options → `.choice/.probabilities/.confidence` | ✅ True. The SDK does not enforce 255 locally; the AI SDK provider does | [SRC], [DOCS] |
| Score 2–10 ordered levels → `.score` (fractional) / `.probabilities` / `.confidence` | ✅ True, plus **`.legend`**. `score` is the probability-weighted mean level | [SRC], [DOCS] |
| Noul → `.noul` = P(yes), no confidence field | ✅ True | [SRC] |
| Answers under `response.answers[name]` | ✅ True in TS and Python. The Python SDK also exposes typed views `.nouls` / `.choices` / `.scores` | [SRC] |
| State = string, JSON object, or array of messages | ✅ Mostly true: string, JSON object, or any JSON array (one state, not a batch). The TS types also allow `null`, but the OpenAPI schema does not | [SRC] |
| Trained with RLCD | ✅ Vendor statement ("Reinforcement Learning for Calibrated Decisions"). No paper published | [DOCS], [SEARCH] |
| Reachable via Vercel AI Gateway | ✅ True, **but not via chat/`generateText`**. It uses a separate "evaluation model" API | [SRC] |
| Official coding-agent skill exists | ✅ `typesafe-ai/skills` (Claude Code plugin `typesafe@typesafe-ai`) | [REPO] |
| A "jaggedness" page lists failure modes | ✅ `docs.typesafe.ai/model-jaggedness/jev-1.13` lists 9 failure modes | [DOCS] |

---

## 1. What Jev is

- **Company:** TypeSafe AI, San Francisco, founded 2024. It came out of stealth on **2026-09-15** with a reported $40M seed led by DCVC and Jev as its first public model [SEARCH]. Founder Diogo Almeida (ex-OpenAI, RLHF / InstructGPT) [SEARCH]; `diogo149 <diogo@typesafe.ai>` is an npm maintainer of the SDK [SRC]. Launch post: `typesafe.ai/blog/introducing-system-one-models-and-jev` [SEARCH].
- **"System One" model:** named after Kahneman's fast, intuitive thinking. It returns typed judgments and probabilities that code consumes directly. It does no text generation and no explanations. The vendor pitches it as "programmable common sense" / "smart if-statements". Code owns control flow; Jev supplies narrow semantic judgments [REPO: `typesafe-ai/skills` SKILL.md].
- **Mechanics:**
  - Jev reads `state` once and evaluates every question against it in parallel.
  - **Questions cannot see each other's answers.** A second request is only warranted when one answer is needed to build new state or new options.
  - Extra questions add little latency but do cost tokens [DOCS; REPO SKILL.md].
- **Question IDs (the keys) are never sent to the model.** Put the complete meaning in `instructions` [REPO SKILL.md, DOCS primitives]. Reference nested state with backticked paths such as `` `ticket.messages[0].text` `` [REPO SKILL.md].
- **Primitives** [DOCS, SRC]:

| Primitive | Asks | Criteria shape | Answer |
|---|---|---|---|
| `choice` | Which one of a defined set? (relative) | `{ label: description \| null }`, ≤ 255 labels | `choice` (the argmax label), `probabilities` over **all** labels (sum ≈ 1), `confidence` |
| `score` | Where on an ordered rubric? | `[desc0, desc1, …]`, 2–10 levels, index = level | `score` (probability-weighted mean, can be fractional), `probabilities` keyed `"0".."n-1"`, `legend`, `confidence` |
| `noul` | Is this proposition true? (absolute) | optional `{ true?: desc, false?: desc }` | `noul` = P(yes) in [0, 1]. **No** confidence field |

- **Confidence** is a statistic derived from how concentrated the distribution is. It is not the selected option's probability [DOCS confidence; SRC `@ai-sdk/typesafe-ai` docs].
  - The docs' interactive demo approximates it as `(N·p_max − 1)/(N − 1)`; for 3 options that is `(3·p_max − 1)/2`.
  - This matches the published example: p = 0.95 over 3 levels gives confidence 0.92. The exact production formula is not published [DOCS].
- **Output values are rounded to 2 decimal places**, so probabilities may not sum to exactly 1 [SRC `@ai-sdk/typesafe-ai` source comment: "The API rounds displayed probabilities and scores to two decimal places"].
- **Determinism:** in the official parallel-questions cookbook, most answers were identical across 5 repeats (std dev 0.0). Batching questions added no noise [DOCS cookbook].
- **Customization:** there is no fine-tuning or LoRA. All accounts share the same weights. You shape answers via `state`, `instructions`, `criteria`, and decomposition [DOCS models].
- **Other properties** [DOCS models]:
  - Input is **text only** (no image, audio, or video).
  - English is the primary training language; other languages "work but vary".
  - TypeSafe does not train on customer requests or responses.
  - Zero data retention (ZDR) is available for enterprise customers.

---

## 2. TypeScript SDK API (verified against `.d.ts`, with the compiled example)

### 2.1 Package facts [SRC]

- **Package:** `@typesafe-ai/sdk`, MIT, **zero runtime deps**, ESM + CJS + `.d.ts`, `engines.node >= 20`, `sideEffects: false`.
- **Publishing:** npm provenance via GitHub Actions OIDC. Maintainers `alliesafe <allie@typesafe.ai>` and `diogo149 <diogo@typesafe.ai>`.
- **Repo:** `github.com/typesafe-ai/typesafe-sdk-js` (a public mirror; commits come from `typesafe-public-bot`). A JSR config also exists.
- **Versions:**

| Version | Published | Notes |
|---|---|---|
| `0.0.0-bootstrap.0` | 2026-09-12 | bootstrap tag |
| `0.5.7` | 2026-09-12 | first public release |
| `0.6.0` | 2026-09-15 | **breaking:** Score criteria must be an ordered **array** of ≥ 2 levels. 0.5.7 accepted a map keyed by integers. |

- **Runtime:**
  - Uses global `fetch`.
  - Sends an `X-TypeSafe-Runtime` header and detects `node` / `bun` / `deno` / `vercel-edge` / `cloudflare-workers`.
  - **Throws in a browser** unless `dangerouslyAllowBrowser: true`.
- **No streaming, batch, or idempotency helpers.** One call = one HTTP request.

### 2.2 Exports (exact) [SRC]

```ts
// values
TypeSafeClient, choice, noul, score, APIPromise, ENV, LOG_LEVELS, VERSION,
TypeSafeError, APIError, BadRequestError /*400*/, AuthenticationError /*401*/, PermissionDeniedError /*403*/,
NotFoundError /*404*/, UnprocessableEntityError /*422*/, RateLimitError /*429, .retryAfterMs*/,
InternalServerError /*>=500, incl. 529*/, APIConnectionError, APITimeoutError /*extends APIConnectionError, .timeoutMs*/,
APIUserAbortError
// types
ChoiceCriteria, ChoiceQuestion, ChoiceResponse, Description, EntryType, EnvVar, Fetch, JsonValue, LogLevel, Logger,
ModelCard, Models, NoulQuestion, NoulResponse, Question, Questions, RequestOptions, ResultFor, RetryPolicy,
ScoreCriteria, ScoreLegend, ScoreOf, ScoreQuestion, ScoreResponse, SystemOneRequest, SystemOneRequestPayload,
SystemOneResult, TypeSafeClientConfig, Usage, WithResponse
```

### 2.3 Client [SRC]

```ts
new TypeSafeClient(config?: {
  apiKey?: string;            // else TYPESAFE_API_KEY; throws TypeSafeError if missing
  baseURL?: string;           // note casing; else TYPESAFE_BASE_URL, else "https://api.typesafe.ai"
  defaultModel?: string;      // else TYPESAFE_DEFAULT_MODEL, else "jev-latest"   (there is NO `model` option)
  timeout?: number;           // ms PER ATTEMPT, default 10_000; there is no total retry budget
  retry?: Partial<RetryPolicy>; // there is NO top-level `maxRetries`
  logLevel?: "debug" | "info" | "warn" | "error" | "off"; // else TYPESAFE_LOG_LEVEL, else "warn"
  logger?: Logger;            // console-compatible
  defaultHeaders?: Record<string, string>;
  dangerouslyAllowBrowser?: boolean; // default false
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
})
```

- `RetryPolicy` defaults:
  - `maxRetries: 2`, `backoffInitialMs: 500` (doubling), `backoffMaxMs: 5000`, `backoffJitter: 0.25`.
  - `httpStatuses: Set{408, 429, 500–599}`.
  - `respectRetryAfter: true`: prefers `retry-after-ms`, else `Retry-After` in seconds or as an HTTP date.
  - `maxRetryAfterMs: 60000`: a longer server delay falls back to backoff.
  - `apiConnectionError: true`, `apiTimeoutError: true`.
  - Retries send `X-TypeSafe-Retry-Count: n`. Caller aborts are never retried.
- **Logging gotcha:** `logLevel: "debug"` logs headers (credentials redacted) and **request and response bodies unredacted**. That means your `state`, and so client data, lands in logs. Keep production at `warn`.

### 2.4 Methods [SRC]

```ts
client.systemOne<const Q extends Questions>(
  request: { state: EntryType; questions: Q; model?: string /* per-call override */ },
  options?: { signal?: AbortSignal; timeout?: number; retry?: Partial<RetryPolicy>; headers?: Record<string, string> },
): APIPromise<SystemOneResult<Q>>;          // POST /v1/systemone

client.models.list(options?): APIPromise<ModelCard[]>; // GET /v1/models, unwraps { models: [...] }
// ModelCard = { name: string; description: string; release_date: string }
// Lists aliases; versioned IDs such as "jev-1.13.0" are accepted even if not listed [DOCS]
```

- `APIPromise<T>` is awaitable and adds three methods:
  - `.withResponse()` → `{ data, response, requestId }`. `requestId` comes from the `x-typesafe-request-id` header and looks like `req_…`.
  - `.asResponse()` → the raw `Response`.
  - `.map(fn)`.
- Extra properties on a request object are forwarded verbatim in the body (forward compatibility) [SRC test "forwards extra fields"].
- **Client-side validation** (throws `TypeSafeError` before any network call):
  - `questions` must be non-empty.
  - Score criteria must be an array with ≥ 2 entries.
  - `choice()` rejects an array.
  - `score()` rejects a map.
- **Not validated locally** (the server returns 422, or silently accepts):
  - more than 255 labels or more than 10 levels;
  - a single-label choice;
  - non-JSON description types.

### 2.5 Question builders (factory functions returning plain objects) [SRC]

```ts
choice<const T extends Record<string, EntryType>>(instructions: EntryType, criteria: T): ChoiceQuestion<T>
score<const T extends readonly [EntryType, EntryType, ...EntryType[]]>(instructions: EntryType, criteria: T): ScoreQuestion<T>
noul(instructions?: EntryType /* default null */, criteria?: { true?: EntryType; false?: EntryType } | null): NoulQuestion
// EntryType = string | JSON object | JSON array | null   (rich descriptions allowed:
//   e.g. { meaning: "...", examples: ["billed twice"] })
// Plain objects work too: { type: "choice", instructions, criteria } / { type: "score", ... } / { type: "noul", ... }
```

Typing notes [SRC+RUN]:

- Choice labels infer as a literal union (`res.answers.route.choice: "a" | "b"`).
- Score tuple literals type `probabilities` and `legend` as `{0: number; 1: number; …}`.
- A plain `string[]` rubric does **not** type-check. Type dynamic rubrics as `readonly [string, string, ...string[]]`.
- **Gotcha:** spreading a runtime `Record<string, NoulQuestion>` into a literal question map drops its index signature from the inferred answer type. Read dynamic keys through a narrow cast, or send the dynamic set as its own map (see §2.8).

### 2.6 Result types [SRC]

```ts
interface SystemOneResult<Q> {
  readonly model: string;                         // resolved version, e.g. "jev-1.13.0" (not the alias)
  readonly answers: { readonly [K in keyof Q]: ResultFor<Q[K]> };
  readonly usage: { readonly input_tokens: number; readonly output_tokens: number }; // snake_case
}
interface ChoiceResponse<T> { type: "choice"; choice: keyof T & string; confidence: number;
                              probabilities: { [label in keyof T]: number } }
interface ScoreResponse<T>  { type: "score"; score: number /* expected level */; confidence: number;
                              legend: { [i]: T[i] }; probabilities: { [i]: number } }
interface NoulResponse      { type: "noul"; noul: number /* P(yes) */ }   // no confidence
```

- There is no request id in the body; use `.withResponse().requestId`.
- Pre-release fields `stats` and `assets_used` were removed.

### 2.7 Compiled example (production-shaped)

**Proof:** `tsc --noEmit` exits 0 against the real `@typesafe-ai/sdk@0.6.0` declarations [SRC+RUN]. It passes on **TypeScript 7.0.2 and 5.9.3** with:

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `skipLibCheck: false`;
- and again with a Next.js-style config (`moduleResolution: bundler`, `skipLibCheck: true`).

The eight `@ts-expect-error` probes at the bottom prove the negative claims. `tsc` fails with "Unused '@ts-expect-error'" if any of those lines were valid. As a control, removing one directive produced `TS2353: 'maxRetries' does not exist in type 'TypeSafeClientConfig'`.

```ts
import {
  APIConnectionError, APIError, APITimeoutError, RateLimitError, TypeSafeClient, TypeSafeError, VERSION,
  choice, noul, score,
} from "@typesafe-ai/sdk";

// Env fallbacks: TYPESAFE_API_KEY, TYPESAFE_BASE_URL, TYPESAFE_DEFAULT_MODEL, TYPESAFE_LOG_LEVEL.
export const jev = new TypeSafeClient({
  defaultModel: process.env.JEV_MODEL ?? "jev-1.13.0", // pin a version once thresholds are tuned
  timeout: 5_000, // ms per attempt (SDK default 10_000); there is no total retry budget
  retry: { maxRetries: 2 }, // retries live under `retry` (defaults: 2 retries, 500ms doubling to 5s)
  logLevel: "warn",
});

type Lead = { text: string; source: string };

export async function triageLead(lead: Lead) {
  const { data, requestId } = await jev
    .systemOne({
      state: { lead },
      questions: {
        // Question keys are for code only; the model never sees them.
        route: choice("Which delivery pod should own the request described in `lead.text`?", {
          smart_contracts: "Solidity work: audits, contract development, upgrades",
          agent_infra: "AI agents, MCP servers, automations",
          web_app: "Next.js or TypeScript product work",
          other: "None of the above, or not a request for engineering services",
        }),
        fit: score("How clearly does `lead.text` describe work we could scope and start?", [
          "No engineering need is described",
          "An engineering need outside Solidity, AI agents, and Next.js",
          "A need in our stack, but the scope or timeline is unclear",
          "A need in our stack with a clear scope and timeline",
        ]),
        regulated: noul(
          "Does `lead.text` ask us to hold user funds, give legal or investment advice, or run KYC checks?",
        ),
      },
    })
    .withResponse();

  const { route, fit, regulated } = data.answers;
  // route.choice: "smart_contracts" | "agent_infra" | "web_app" | "other"
  // route.probabilities.agent_infra: number; route.confidence: number
  // fit.score: expected level (fractional); fit.probabilities[3]; fit.legend[3]; fit.confidence
  // regulated.noul: P(yes). Noul answers have no confidence field.

  const decision =
    regulated.noul >= 0.5
      ? { action: "human_review" as const, reason: "possible regulated activity" }
      : route.choice === "other" || route.confidence < 0.6
        ? { action: "human_review" as const, reason: `route uncertain (${route.confidence})` }
        : fit.score >= 2.5 && fit.confidence >= 0.8
          ? { action: "auto_assign" as const, pod: route.choice }
          : { action: "nurture" as const, pod: route.choice };

  // One append-only decision-log record per call: enough to audit and to re-tune thresholds later.
  const record = {
    requestId, // `x-typesafe-request-id`, e.g. "req_..."
    model: data.model, // resolved version, e.g. "jev-1.13.0", not the alias
    sdk: VERSION,
    inputTokens: data.usage.input_tokens,
    answers: data.answers,
    decision,
  };
  return record;
}

export async function safeTriage(lead: Lead) {
  try {
    return await triageLead(lead);
  } catch (err) {
    if (err instanceof RateLimitError) return { fallback: "queue", retryAfterMs: err.retryAfterMs };
    if (err instanceof APIError) return { fallback: "llm", status: err.status, requestId: err.requestId };
    if (err instanceof APITimeoutError) return { fallback: "llm", timeoutMs: err.timeoutMs };
    if (err instanceof APIConnectionError) return { fallback: "llm", network: true };
    if (err instanceof TypeSafeError) throw err; // local validation (e.g. empty questions): a bug
    throw err;
  }
}

export const models = await jev.models.list(); // GET /v1/models -> [{ name, description, release_date }]

// Negative probes: each line below MUST be a type error, or tsc fails with "Unused '@ts-expect-error'".
declare const sample: Awaited<ReturnType<typeof triageLead>>;
// @ts-expect-error there is no `model` constructor option (it is `defaultModel`)
new TypeSafeClient({ model: "jev-latest" });
// @ts-expect-error there is no top-level `maxRetries` (use `retry: { maxRetries }`)
new TypeSafeClient({ maxRetries: 3 });
// @ts-expect-error Noul answers have no confidence field
sample.answers.regulated.confidence;
// @ts-expect-error unknown labels are not keys of probabilities
sample.answers.route.probabilities.maybe;
// @ts-expect-error score criteria must be an array (tuple) of >= 2 levels, not a map
score("q", { 0: "bad", 1: "good" });
// @ts-expect-error a rubric needs at least two levels
score("q", ["only"]);
// @ts-expect-error choice criteria must be a record of label -> description, not a list
choice("q", ["a", "b"]);
// @ts-expect-error there is no snake_case system_one in the TS SDK
jev.system_one;
```

### 2.8 Compiled dynamic-questions pattern (runtime label maps, rubrics, multi-label fan-out) [SRC+RUN]

```ts
import { TypeSafeClient, choice, noul, score, type NoulQuestion, type NoulResponse, type Questions, type ScoreCriteria } from "@typesafe-ai/sdk";
const client = new TypeSafeClient({ apiKey: "x" });

const pods: Record<string, string | null> = { contracts: "Solidity", agents: "Agent infra", other: null }; // labels widen to string
const rubric: readonly [string, string, ...string[]] = ["none", "weak", "strong"]; // plain string[] is rejected
const asCriteria: ScoreCriteria = rubric;

const tags = ["defi", "nft", "gaming"] as const; // multi-label => one Noul per label, not one Choice
const perTag = Object.fromEntries(tags.map((t) => [`tag_${t}`, noul(`Is \`lead.text\` about ${t}?`)])) as Record<string, NoulQuestion>;

const qs = { route: choice("Which pod?", pods), fit: score("Fit?", asCriteria), ...perTag } satisfies Questions;
const r = await client.systemOne({ state: { lead: { text: "..." } }, questions: qs });
const route: string = r.answers.route.choice;
const fit: number = r.answers.fit.score;
// Spreading a runtime Record into the literal drops its index signature from the inferred answer type:
const dyn = r.answers as unknown as Readonly<Record<string, NoulResponse | undefined>>;
const pDefi: number = dyn["tag_defi"]?.noul ?? 0;
// Alternative: send the dynamic set as its own Record<string, NoulQuestion> map.
const only = await client.systemOne({ state: "x", questions: perTag });
const pNft: number = only.answers["tag_nft"]?.noul ?? 0;
```

---

## 3. Raw HTTP schema

**Sources:**

- the TS SDK source and tests;
- the Python SDK's `_schemas/models.py`, which is "generated by datamodel-codegen from `https://api.typesafe.ai/openapi.json`";
- a local capture of the bytes both SDKs actually send [SRC+RUN].

### 3.1 Request

```
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <TYPESAFE_API_KEY>
Content-Type: application/json
Accept: application/json
User-Agent: typesafe-sdk/0.6.0            (SDK-added; optional)
X-TypeSafe-SDK: typesafe-sdk/0.6.0        (SDK-added; optional)
X-TypeSafe-Runtime: node/22.22.2 (linux; x64)   (SDK-added; optional)
X-TypeSafe-Retry-Count: 1                 (SDK-added on retries only)
```

Exact body emitted by `@typesafe-ai/sdk@0.6.0`, captured by a local server (pretty-printed) [SRC+RUN]:

```json
{
  "state": [{ "role": "user", "content": "Need a Celo audit + agent integration" }],
  "questions": {
    "route": { "type": "choice", "instructions": "Which pod?",
               "criteria": { "smart_contracts": "Solidity", "agent_infra": "Agents", "web_app": null, "not_a_fit": null } },
    "fit":   { "type": "score", "instructions": "ICP fit?",
               "criteria": ["no fit", "weak fit", "good fit", "ideal fit"] },
    "needsHuman": { "type": "noul", "instructions": "Regulated activity?" }
  },
  "model": "jev-latest"
}
```

The Python SDK 0.7.1 sends the same structure; only key order differs (`state, model, questions`) [SRC+RUN].

**Field schema** (OpenAPI-generated models) [SRC]:

| Field | Type | Notes |
|---|---|---|
| `model` | string, **required on the wire** | The SDKs fill in the default. Alias or versioned ID. An unknown model → `400 Unknown model: <id>` |
| `state` | `string \| object \| array`, required | "The content all questions in this request refer to". The TS types also allow `null`; OpenAPI does not, so **don't send null** |
| `questions` | `{ [name]: Question }`, min 1 | Discriminated by `type` |
| `choice` | `{type:"choice", instructions?: str\|obj\|arr\|null, criteria: {label: str\|obj\|arr\|null}}` | A label without a description "is interpreted by its name alone". ≤ 255 labels [DOCS] |
| `score` | `{type:"score", instructions?, criteria: [str\|obj\|arr, …]}` | "Each description's position determines its score, starting at zero". Docs: ≥ 2 and ≤ 10 levels. OpenAPI states `min_length=1` |
| `noul` | `{type:"noul", instructions?, criteria?: {true?: …, false?: …} \| null}` | One side may be described alone |

### 3.2 Response (200)

The shape is verified [SRC]; the numbers below are illustrative:

```
x-typesafe-request-id: req_...
```

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "route": { "type": "choice", "choice": "agent_infra", "confidence": 0.91,
               "probabilities": { "smart_contracts": 0.06, "agent_infra": 0.90, "web_app": 0.03, "not_a_fit": 0.01 } },
    "fit": { "type": "score", "score": 2.4, "confidence": 0.7,
             "legend": { "0": "no fit", "1": "weak fit", "2": "good fit", "3": "ideal fit" },
             "probabilities": { "0": 0.02, "1": 0.08, "2": 0.38, "3": 0.52 } },
    "needsHuman": { "type": "noul", "noul": 0.07 }
  },
  "usage": { "input_tokens": 143, "output_tokens": 9 }
}
```

The official docs' own example [DOCS api]:

```json
{"model":"jev-1.13.0","answers":{"frustration":{"type":"score","score":1.05,"legend":{"0":"Calm","1":"Frustrated","2":"Very angry"},"probabilities":{"0":0.0,"1":0.95,"2":0.05},"confidence":0.92}},"usage":{"input_tokens":304,"output_tokens":18}}
```

- `answers` uses the question names you sent. Each answer's `type` equals its question's `type`.
- `model` "may differ from the alias supplied in the request". Log it [SRC OpenAPI description].

### 3.3 Other endpoints and errors

- **`GET /v1/models`** → `{"models":[{"name":"jev-latest","description":"General-purpose system one model.","release_date":"2026-09-15"}]}`. That is the OpenAPI example [SRC]. It currently lists **aliases** [DOCS].
- **Errors** [DOCS api + SRC tests]:
  - `401` bad or missing key.
  - `422` validation, FastAPI/Pydantic style: `{"detail":[{"loc":["body","questions","q","score","criteria",0],"msg":"...","type":"...","input":...,"ctx":...}]}`. The SDK renders it as `422 questions.q.score.criteria.0: ...`.
  - `400` e.g. unknown model. The live test asserts `"400 Unknown model: no-such-model"`; a test fixture shows `{"detail":{"error_type":"api_usage_error","message":"..."}}`.
  - `429` rate limit, with `Retry-After` / `retry-after-ms`.
  - **`529 Overloaded`**: back off exponentially.
- The SDK maps `400/401/403/404/422/429` to specific classes and ≥500 (including 529) to `InternalServerError`. It retries 408/429/5xx.
- Community reports an error code `max_tokens_exceeded` when state plus the longest question exceeds 32k [REPO nexibeo/jev-cookbook; observed via OpenRouter].
- **Silent mis-read to guard against:**
  - `{"type":"choice","criteria":{"options":["a","b"]}}` is *valid JSON for the schema*. The API treats it as a single label called `options` and answers it at confidence 1.0 every time [REPO chr-kelly/jev-cookbook: "We shipped that bug"].
  - Neither SDK catches this. Our wrapper must enforce ≥ 2 labels and include an explicit fallback label.

### 3.4 curl

```bash
curl -sS https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"jev-latest","state":"Customer: I was charged twice and I am furious.",
       "questions":{"topic":{"type":"choice","instructions":"What is the issue about?",
                             "criteria":{"billing":"money problems","bug":"broken product","other":null}},
                    "urgent":{"type":"noul","instructions":"Should a human handle this now?"}}}'
```

---

## 4. Python SDK

`pip install typesafe-sdk` → `import typesafe_sdk`. Versions 0.5.7 → 0.6.0 → 0.7.0 → **0.7.1** (2026-09-21) [SRC wheel + repo changelog]. Everything below is [SRC], with the wire format also [SRC+RUN].

**Package facts:**

- Python ≥ 3.10.
- Depends on `httpx2>=2.0.0`, `pydantic>=2.12`, `tenacity>=9`.
- Sync and async clients: `TypeSafeClient` / `AsyncTypeSafeClient`.
- Repo `github.com/typesafe-ai/typesafe-sdk-python`; maintainer Daniel Gafni.

**Changelog:**

| Version | Changes |
|---|---|
| 0.6.0 | Score criteria becomes a list (same break as TS) |
| 0.7.0 | msgspec → pydantic; new `response_model=` |
| 0.7.1 | Early API-key validation; "examples for usage with AI gateways" (the examples are not in the public mirror) |

```python
from typesafe_sdk import TypeSafeClient, AsyncTypeSafeClient, Choice, Noul, Score, RetryPolicy

with TypeSafeClient(                      # all keyword-only
    api_key=None,                         # else TYPESAFE_API_KEY (validated: printable ASCII, no whitespace)
    model=None,                           # DEFAULT model (TS calls this defaultModel); else TYPESAFE_DEFAULT_MODEL, else "jev-latest"
    retry=RetryPolicy(max_retries=2, backoff_initial=0.5, backoff_max=5.0, backoff_jitter=0.25,
                      http_statuses={408, 429, *range(500, 600)}, respect_retry_after=True,
                      timeout=30.0),      # Python has a TOTAL retry budget (30 s); TS does not
    timeout=None,                         # seconds per HTTP operation, default 10.0
    headers=None, transport=None, http_client=None, base_url=None,
) as client:
    r = client.system_one(
        state={"lead": "Need a Celo audit"},                      # str | Mapping | Sequence
        questions={
            "route": Choice(instructions="Which pod?", criteria={"agent_infra": "Agents", "other": None}),
            "fit": Score(instructions="ICP fit?", criteria=["no", "weak", "good", "ideal"]),
            "regulated": Noul(instructions="Regulated activity?"),  # or raw dict {"type": "noul", ...}
        },
        # model=, retry=, timeout=, extra_headers=, extra_body=, response_model=MyPydanticModel
    )
    r.model; r.usage.input_tokens; r.request_id; r.raw_http_response
    r.answers["route"]                      # union answer
    r.choices["route"].choice; r.choices["route"].confidence; r.choices["route"].probabilities
    r.scores["fit"].score; r.scores["fit"].legend[3]  # score legend/probabilities keyed by int in Python
    r.nouls["regulated"].noul
```

- **Errors:**
  - `TypeSafeError`, `TypeSafeAPIError` (`.status .body .headers .endpoint .request_id`).
  - `TypeSafeBadRequestError`, `TypeSafeAuthenticationError`, `TypeSafePermissionDeniedError`, `TypeSafeNotFoundError`, `TypeSafeUnprocessableEntityError`.
  - `TypeSafeRateLimitError` (`.retry_after_ms`), `TypeSafeInternalServerError`.
  - `TypeSafeAPIConnectionError`, `TypeSafeAPITimeoutError`.
  - `TypeSafeAPIResponseValidationError` (`.field_path`).
- Unknown future answer types are dropped with a warning; the raw payload stays on `raw_http_response`.
- **Differences from TS:**
  - Python only rejects *empty* score criteria; TS requires ≥ 2.
  - Python uses `model=` for the default model; TS uses `defaultModel`.
  - Python has a total retry budget; TS does not.
  - Python integer-keys score maps; the TS JSON keys are `"0"`, `"1"`, ….
  - The README reads answers via `response.choices["category"]`, but `response.answers[...]` works too.
- **Official LLM-backed stand-in:** `typesafe-ai/system-one-adapter-python` (MIT, v0.2.1, 2026-09-22) is a drop-in `SystemOneAdapterClient.system_one(...)` backed by OpenAI, Anthropic, or Gemini with the same question types. It is useful for A/B testing and as a fallback while waitlisted [REPO]. It re-implements the contract; it is not Jev.

---

## 5. Pricing, limits, latency, access

| Item | Value | Evidence |
|---|---|---|
| Model | Jev 1.13 = `jev-1.13.0`. Aliases `jev-latest` → 1.13.0 (latest stable), `jev-preview` → 1.13.0 (no preview build yet). Aliases move without notice | [DOCS models] |
| Price | **$0.042 per 1M input tokens** ($42/Btok). **Output tokens free**. Early-access pricing; TypeSafe "expects prices to go down" and "cannot prove its pricing is not subsidized" | [DOCS], [SEARCH] |
| Rate limits | **250,000 tokens/s and 1,200 requests/min**. Search summaries call these account limits. Exceeding either → `429`. "Being dynamically adjusted… may change at any time without notice". Higher limits via sales@typesafe.ai | [DOCS], [SEARCH] for "account" |
| Context | **64k tokens per request** (state + all questions) and **32k for state + the single longest question** | [DOCS] |
| Choice / Score limits | ≤ 255 options; 2–10 levels | [DOCS], [SRC AI SDK provider] |
| Input | Text only: a string, a JSON object, or an array of text values | [DOCS] |
| Latency (vendor) | "70–500 ms", answers all questions in one parallel pass | [SEARCH] launch coverage; repeated in the `@langchain/typesafe` README [SRC] |
| Latency (measured by others) | 0.27 s for 13 questions over a ~54k-char doc (official cookbook) · ~0.2 s per query (Greg Isenberg / Ryan Vogel) · ~0.4 s via OpenRouter · 732 ms via the Vercel gateway vs 1,431 ms direct in one user's setup · 0.35 s median (Every, per Forkast) | [DOCS], [REPO], [SEARCH] |
| Cost examples | 13-question GDPR briefing: **$0.000497 per call** vs $0.006090 as 13 separate calls (**12.2× cheaper, 10.0× faster**) · 1,700 emails, 4.2M input tokens: **$0.18** · CLINC150 run, 5,500 items, one 151-way choice: ≈ **$0.63** · 16,711 LinkedIn connections ICP-scored: **$0.73** | [DOCS cookbook], [REPO], [REPO chr-kelly], [REPO bcharleson/jev-gtm-cookbook] |

**Access status (2026-09-26):**

- **Direct TypeSafe API.** Early access "behind a waitlist" [SEARCH]; still "gated behind a waitlist" as of 2026-09-21 [REPO chr-kelly].
  - Once in: sign in at `console.typesafe.ai/playground`; keys at `console.typesafe.ai/keys` [DOCS quickstart].
  - A **$5 intro credit** is reported [REPO Greg/Ryan video notes].
- **Instant access (no TypeSafe waitlist):**
  - Vercel AI Gateway [SRC]. Greg/Ryan: "Instant access runs through the Vercel Gateway".
  - OpenRouter [SRC `@openrouter/sdk`].
  - Also reported: NanoGPT, Venice API (beta), Cloudflare [REPO/SEARCH].
- **Beware:** `codaaiteam/jev-typesafe-ai` is an unaffiliated single-README repo (2026-09-18). It promotes a third-party "free playground, no waitlist" at `jevtypesafeai.com`. Do not send keys or client data there [REPO].

---

## 6. Failure modes ("jaggedness")

### 6.1 Official: `docs.typesafe.ai/model-jaggedness/jev-1.13` [DOCS]

Applies to `jev-1.13`; last reviewed 2026-09-17 per the translation (one search summary says 09-16).

| # | Failure mode | What goes wrong | Official workaround |
|---|---|---|---|
| 1 | Literal reading | Answers the question as written. Qualifiers, negations, and implied conditions are read at face value | State exact conditions; put edge cases in criteria. If you catch yourself explaining "what I meant", that is the missing half of the instruction. Otherwise split into two literal questions |
| 2 | Math and numbers | **Cannot count reliably** (characters, occurrences, list lengths). Weak on numeric representations (hex colours, RGB closeness, low-level or binary code). **Score levels are not numerically calibrated for interpolation** | Do arithmetic in code; count with one Noul per item and sum in code; pass computed values or named buckets. Use the expected score only for threshold checks |
| 3 | Date and time comparison | Reads dates as text, not ordered quantities | Extract components with Choices (month, day, year, plus "not mentioned") and compare in code |
| 4 | Indirection | Double negatives, properties of properties, and multi-hop reasoning lose accuracy | Write plainly; name the relevant state fields |
| 5 | Large state full of irrelevant detail | **Context rot**: irrelevant fields act as distractors | Retrieve and filter in code first; send only what the question needs; or use a Noul relevance filter |
| 6 | Adversarial content | State is not treated as hostile. Injected instructions or self-justifying text can change answers | Explicit criteria; test edge cases before wide deployment |
| 7 | Contradictory instructions and criteria | e.g. a Noul whose `true` means "no" | Keep criteria consistent with the instruction |
| 8 | Common-sense structural invariants | A Noul and a yes/no Choice on the same question are **not comparable**: noul 0.22 vs choice yes 0.01 / no 0.99, confidence 0.97. P(q) + P(not q) ≠ 1: 0.72 + 0.47 = **1.19** | Don't reuse thresholds across Noul and Choice. Don't demand arithmetic identities between questions. Choice is relative (which option); Noul is absolute (could be low for all options) |
| 9 | Text generation | Not trained for it; chaining Choices to generate text is slow and poor | For extraction: have code or an LLM propose candidates, then let Jev *select* |

### 6.2 Community-observed issues [REPO]

- **A closed set always gets an answer.** Off-topic input still gets a confident label.
  - In chr-kelly's CLINC150 run (jev-1.13.0, 2026-09-21): **54 of 162 out-of-scope items the fallback missed were assigned a wrong intent at confidence ≥ 0.9**.
  - The same run's calibration was good overall (ECE 0.025, 90.6% in-scope accuracy, 83.8% OOS recall).
  - Always include `other`, and review what lands there.
- **The mis-shaped single-label Choice** is silently accepted (§3.3).
- **Compaction critiques.**
  - Theo (2.6k likes): per-tool-call keep/drop scoring is a poor compaction strategy.
  - 0xthe0: pruning a 1M-token session to 86k "is scoring and deleting"; one replay dropped **16 fragments needed later**.
- **Confidence is not portable.** Several analysts (Ranjan Kumar, dnakhoa) say to trust Jev's *ordering* but fit thresholds locally. Per-hop calibration does not compose across multi-step pipelines.
- **Weak for trading-style decisions.** Ryan Vogel's minute-by-minute Bitcoin buy/hold/sell test "performs poorly" [REPO transcript notes].
- **Values are 2-decimal rounded** (§1). Treat probability sums of 0.99 or 1.01 as normal.

---

## 7. Ecosystem (AI Gateway, skill, plugins, harness patterns)

### 7.1 Vercel AI SDK 7 and the AI Gateway [SRC+RUN]

Jev is **not** a chat model: `generateText` / chat completions won't work. AI SDK 7 adds an **experimental evaluation API**:

- `import { experimental_evaluate } from "ai"` (in `ai@7.0.116`).
- The provider spec is `EvaluationModelV4` in `@ai-sdk/provider@4.0.18`.
- Question types are `choice | score | boolean`. **`boolean` = Noul**, and its answer is `{ type: "boolean", probability }`.
- TypeSafe confidence is **not** on the answer. It is at `result.providerMetadata.typesafe.confidence[questionId]`.
- `result.rounding = { probabilityDecimals: 2, scoreDecimals: 2 }`.
- `maxRetries` defaults to 2 (429/529 are retried by core).
- For tests: `Experimental_EvaluationMockModelV4` from `ai/test`.
- The API is flagged "experimental; may change in patch releases".

**Three ways to reach Jev from the AI SDK:**

1. **Direct provider** `@ai-sdk/typesafe-ai@3.0.8` (created 2026-09-16):
   - `typeSafeAi.evaluationModel("jev-latest")` or `createTypeSafeAi({ apiKey, baseURL, headers, fetch })`.
   - Default `baseURL` is `https://api.typesafe.ai/v1`. **The env var is `TYPESAFE_AI_API_KEY`.**
   - It posts to `/v1/systemone` and maps `boolean`→`noul` (verified by local capture).
   - It enforces ≤ 255 options and ≤ 10 levels.
2. **Vercel AI Gateway via a string ID**: `model: "typesafe-ai/jev-latest"`.
   - Auth is `AI_GATEWAY_API_KEY` or Vercel OIDC.
   - Strings resolve through the gateway unless you set `globalThis.AI_SDK_DEFAULT_PROVIDER`.
   - **Model ID nuance:** the AI SDK docs use `typesafe-ai/jev-latest`, while `@ai-sdk/gateway@4.0.94` types `GatewayEvaluationModelId = 'typesafe-ai/jev' | (string & {})`. Community code uses `typesafe-ai/jev` successfully. Verify with `gateway.getAvailableModels()` before hard-coding.
   - **Gateway wire:**
     - `POST https://ai-gateway.vercel.sh/v4/ai/evaluation-model` with headers `ai-evaluation-model-specification-version: 4` and `ai-model-id: typesafe-ai/jev`, plus `ai-gateway-protocol-version: 0.0.1` (the last header comes from community code).
     - Body `{ state, questions }`.
     - Response `{ answers, usage: { inputTokens, outputTokens }, providerMetadata: { typesafe: { confidence }, gateway: { cost } } }` [SRC gateway source; REPO DoGMaTiiC/hermes-jev].
3. **Registries and aliases**: `customProvider({ evaluationModels: { native: typeSafeAi.evaluationModel("jev-latest") } })`.
   - OpenAI, Anthropic, and Google also expose `evaluationModel(...)` adapters. These are LLM-based: **no distributions on choice or score, uncalibrated booleans, all questions in one prompt**.
   - This gives a same-interface LLM fallback.

Vercel resources named in the AI SDK docs [SRC]:

- `vercel.com/kb/guide/typesafe-jev-and-ai-sdk`;
- a form-router guide;
- a Next.js template `vercel.com/templates/next.js/jev-and-ai-sdk` (routes form submissions, with an LLM fallback for uncertain or failed evaluations).

Secondary reports say the gateway added Jev the day after launch, calling it the fastest-adopted model in the gateway's history [SEARCH].

Compiled against the real packages (`tsc` exit 0 on TS 7.0.2 and 5.9.3, Next.js-style config) [SRC+RUN]:

```ts
import { experimental_evaluate } from 'ai';
import { createTypeSafeAi, typeSafeAi } from '@ai-sdk/typesafe-ai';

// Direct to TypeSafe (reads TYPESAFE_AI_API_KEY -- note: NOT TYPESAFE_API_KEY).
const typesafe = createTypeSafeAi({ apiKey: process.env.TYPESAFE_API_KEY });

const direct = await experimental_evaluate({
  model: typesafe.evaluationModel('jev-latest'),
  state: { message: 'I was charged twice. Please refund the duplicate.' },
  questions: {
    department: {
      type: 'choice',
      instructions: 'Which team should handle this?',
      criteria: { billing: 'Charges and refunds', support: 'Other requests' },
    },
    severity: {
      type: 'score',
      instructions: 'How severe is the issue?',
      criteria: ['Cosmetic', 'Workaround exists', 'Blocking; no workaround'],
    },
    requestsRefund: { type: 'boolean', instructions: 'Is the customer requesting money back?' },
  },
});
const dept: 'billing' | 'support' = direct.answers.department.choice;
const pBilling: number | undefined = direct.answers.department.probabilities?.billing;
const sev: number = direct.answers.severity.score;
const pRefund: number = direct.answers.requestsRefund.probability; // Noul -> boolean.probability
const conf = (direct.providerMetadata?.typesafe?.confidence as Record<string, number> | undefined)?.department;
console.log(dept, pBilling, sev, pRefund, conf, direct.response.modelId, direct.usage.inputTokens, direct.rounding);

// Through Vercel AI Gateway: plain string id (AI_GATEWAY_API_KEY or Vercel OIDC).
const viaGateway = await experimental_evaluate({
  model: 'typesafe-ai/jev-latest',
  state: 'Please refund the extra charge.',
  questions: { refund: { type: 'boolean', instructions: 'Is the customer asking for a refund?' } },
});
console.log(viaGateway.answers.refund.probability, viaGateway.providerMetadata?.gateway);

void typeSafeAi;
// @ts-expect-error the AI SDK uses 'boolean', not 'noul'
await experimental_evaluate({ model: 'typesafe-ai/jev', state: 'x', questions: { q: { type: 'noul', instructions: 'x' } } });
```

Runtime capture of the direct provider (mock `fetch`) [SRC+RUN]:

- It sent `POST https://api.typesafe.ai/v1/systemone` with body `{"model":"jev-latest","state":…,"questions":{…,"requestsRefund":{"type":"noul",…}}}`.
- It mapped `noul: 0.97` → `{type:"boolean", probability:0.97}`.
- It surfaced `providerMetadata.typesafe.confidence = {department: 0.93}` and `response.modelId = "jev-1.13.0"`.

### 7.2 OpenRouter [SRC `@openrouter/sdk@1.3.32`; REPO nexibeo/jev-cookbook]

- **Endpoint:** `POST https://openrouter.ai/api/alpha/decisions`. The SDK hard-codes this path. `/api/v1/chat/completions` returns 400 ("is a decisions model").
- **Model:** `~typesafe/jev-latest` (the tilde matters) or a pinned `typesafe/jev-1.13`.
- **Body:** same `{ model, state, questions }` plus optional `provider`, `session_id` / `sessionId`, `trace`, `user`.
- **Response:** `model` reports e.g. `typesafe/jev-1.13-20260917`; `usage` includes `cost`.
- **SDK call:** `openRouter.alpha.decisions.create({ decisionsRequest: {...} })`.
- One community README lists `/api/v1/decisions` instead. The SDK source says `/api/alpha/decisions`.

### 7.3 Official coding-agent skill [REPO typesafe-ai/skills, 2.1k★]

- **Install in Claude Code:** `claude plugin marketplace add typesafe-ai/skills && claude plugin install typesafe@typesafe-ai`. Invoke with `/typesafe:typesafe-ai`.
- **Install for other agents:** `npx skills add typesafe-ai/skills --skill typesafe-ai`.
- **What it does:** tells the agent to read the live docs index `https://docs.typesafe.ai/llms.txt`, fetching pages as `.md` (Mintlify), and to fall back to installed SDK types when offline.
- **Doc map:** `/concepts/system-one`, `/concepts/how-to-build-with-system-one`, `/concepts/use-case-map`, `/concepts/state`, `/primitives{,/choice,/noul,/score,/advanced}`, `/confidence`, `/api`, `/sdk/{python,javascript}`, `/migrating-to-v1`, `/patterns/{fan-out,composite-scoring,confidence-routing,intent-routing}`, and 18 cookbooks under `/cookbooks/*`.
- **Key rules it encodes:**
  - one narrow judgment per question;
  - named JSON state;
  - include a no-match outcome;
  - independent questions in one request (including speculative ones);
  - thresholds evaluated on your data;
  - "Typed output guarantees the interface, not truth";
  - keep credentials server-side.

### 7.4 Cookbooks [DOCS, REPO]

Official cookbooks (18):

- autoformat, autoresearch_feature_discovery, citation_check, classification_using_confidence, classifying_rag_passages;
- consistency_choice / consistency_noul, date_extraction, entity_alignment, function_calling, hierarchical_classification;
- llm_guardrails, **parallel_questions**, pre_parsed_value_extraction, rerank, sde_cascade (extraction cascade), semantic_find, skill_suggestion.

**The "13-question briefing" = `cookbooks/parallel_questions`:**

- Setup: the GDPR Wikipedia article (~54,000 chars), 13 questions (8 Noul, 2 Choice, 3 Score), `jev-1.12`.
- Result: one batched call **$0.000497 / 0.27 s** vs 13 single calls **$0.006090 / 2.71 s**. That is **12.2× cheaper and 10.0× faster, with identical answers**.
- Batching adds no noise: each question is scored independently.
- It uses the `cooksafe` helper package and a shareable playground link.

**Community:**

- `nexibeo/jev-cookbook` (OpenRouter recipes, incl. a browser agent);
- `chr-kelly/jev-cookbook` (`jev_lint` shape linter, eval harness, CLINC150 results);
- `bcharleson/jev-gtm-cookbook` (15 outbound/GTM recipes: ICP scoring, reply triage);
- `datawhalechina/jev-cookbook` (Chinese translation of all docs).

### 7.5 Demos

- **Browser Use flights** [REPO browser-use/jev-ultrafast]:
  - "Zürich → London on Google Flights in **7.1 s**" (a 7,073 ms run).
  - One request per step returns an **operation** (CLICK / TYPE_TEXT / SELECT / SCROLL / WAIT / DONE / BLOCKED) plus **speculative target heads**; code executes only the matching target.
  - A small LLM (`inception/mercury-2.5`) writes text only for TYPE_TEXT.
  - Model output never becomes selectors, coordinates, or code.
- **1,018-paper classification** [SEARCH, attributed to the dev.to/valyuai guide]: 24 categories, **256 ms median per paper, $0.08 total**. Not verified first-hand.
- **Launch side-by-side** [SEARCH, via MarkTechPost 2026-09-19]: a churn judgment took Jev **0.114 s / $0.000081** vs GPT-5.6 Terra **8.566 s / $0.013880**.
- **Other reported demos** [SEARCH]:
  - Doom played at ~10 decisions/s for about $7/hour;
  - Droidrun `mobile-jev`;
  - Guillermo Rauch: up to 18× faster than GPT Luna at p95.

### 7.6 Claude Code plugins, including "instant compaction" [REPO]

- **`tamaratran/fast-jev-compaction`** (6.9k★; npm `fast-jev-compaction`) replaces Claude Code's LLM compaction summary with Jev keep/drop decisions:
  - **Two Nouls per tool call**: keep the call? keep the result verbatim?
  - State is the whole conversation with results elided, fitted to ≤ 25k tokens.
  - Requests are batched to ≤ 30k to stay under Jev's 32k limit.
  - `keepThreshold` is 0.5. Nothing kept is ever rewritten.
  - It requires Claude Code **function hooks**, an early-access feature in CC 2.1.274+.
  - See §6.2 for critiques.
- **Siblings:** `0x7067/claude-jev` (rule checks, verbatim compaction, prompt routing), `piyushsonawane07/trueKeep-jev`, `imsukhe/jev`.
- **Skill routers:** `Dicklesworthstone/skillranker`, `ShivamPansuriya/jev-skill-gate` (12,750 → 3,185 manifest tokens), `DoGMaTiiC/hermes-jev` (three backends, fail-open).

### 7.7 LangChain

- **`@langchain/typesafe@0.0.1`** [SRC] (npm, 2026-09-18, published by LangChain):
  - `new TypeSafeClassifier({ questions, model?, apiKey? (TYPESAFE_API_KEY), baseUrl?, timeout? = 30000 ms, fetch?, dangerouslyAllowBrowser? })`.
  - It is a `Runnable`: `.invoke(state)` → `{ model, answers, usage }` plus non-enumerable `.choices/.nouls/.scores`.
  - ⚠️ `dangerouslyAllowBrowser` **defaults to `true`** here. Set it to `false`.
  - No Python LangChain package exists on PyPI (`langchain-typesafe` → not found).
- **LangChain blog "Building a harness with Jev"** (`langchain.com/blog/building-a-harness-with-jev`) [SEARCH]. It reportedly describes:
  - (1) **model-routing middleware**: Jev reads the request and picks a cheap or strong model;
  - (2) **AutoModeMiddleware**: Jev checks a pending tool call for risk before execution.
  - No such middleware ships in `langchain@1.5.12` core [SRC grep]. Treat these as patterns to build with `createMiddleware` + `TypeSafeClassifier`.

### 7.8 Other harness patterns reported [SEARCH]

- A 12-page TypeSafe PDF on a "Jev harness for coding agents" (summarized by @0xMovez): Opus→Sonnet→Opus hand-offs; reading and search are 56.2% of tool turns.
- omarsar0: LLM-as-judge evals, agent-harness routing, subagent creation.
- Guidance from Vercel on what to delegate: next tool or subagent, continue/retry/stop, urgency and risk, output validation.

---

## 8. Greg Isenberg's take

Sources:

- The post `x.com/gregisenberg/status/2101018750916948237` (2026-09-18, ~1.5k likes; titled "Businesses Jev unlocks" in `Li-Evan/awesome-jev`) is a clip of his YouTube episode **"Jev is HERE. How to use it"** with Ryan Vogel (`youtube.com/watch?v=4mTLpuQpB80`).
- I could not read x.com. The points below come from the episode's published show notes (repo `ZacSadan/podcasts-summary`) and the awesome-list summary [REPO; the post text itself is unverified].

**His points:**

- **Framing: "an AI traffic cop" / a sorter.** Information comes in; Jev decides what it is, how important it is, and what happens next.
  - High-confidence, high-value items → a human.
  - Middling items → automation or an LLM.
  - Lowest → ignored.
  - Input + output schema in, a probability per choice out, **~200 ms** per query "whatever the input and output structure".
- **Demo economics:**
  - Ryan scored **1,700 of his emails** (category, priority, spam score, reply likelihood) for **$0.18 total**: 4.2M input tokens plus 0.5M output tokens.
  - A **$5 intro credit** lasted his team two days of heavy use; ~$10 might last ~3 months.
  - A design agency uses Jev to score contact-form leads 0–1 so hot leads get fast replies.
- **Business thesis: "find a business with an expensive queue of incoming information and put Jev at the front of it."** Example: local-services matching ("driveway power washed" → best nearby business) turning "instant quote" forms into truly instant quotes. Also lead scoring and support routing (200 ms answers replacing slow streaming responses).
- **Limits:** keep Jev **advisory**; save frontier models for high-intelligence tasks. A minute-by-minute Bitcoin buy/hold/sell test performed poorly ("keep it away from your portfolio").
- **Other demos:**
  - a video auto-clipper scoring 17 moments in ~3 s, built in ~10 minutes;
  - the Browser Use flight pick in 7.1 s.
- **Getting started:** use the **Vercel AI Gateway** for instant access (direct access is waitlisted). Ask your AI agent which of your daily workflows could use a decision-maker like Jev.
- **Follow-up post** (2026-09-19, `…/2101284640828915995`): "10 Jev native products I'd build, ranked by how much fast, cheap decisions change the product: 1. Agent …". He also listed purchase approvals, retries, permission grants, branch pruning, and human queues as decision problems that shouldn't need a full generative pass [REPO vibewatch/aligned-news summaries; full list unverified].

---

## 9. Design implications for an agent company

**Principle:** "LLMs write, Jev routes/scores/flags, code executes, humans own irreversible calls."

- Jev's value is volume × latency × cost on **bounded, semantic, low-to-medium-stakes** judgments.
- Its outputs are typed, but typed ≠ correct: "Typed output guarantees the interface, not truth" [REPO SKILL.md].

### 9.1 Which decisions to move to Jev (and which not)

| Move to Jev (high volume, bounded answer space) | Primitive pattern |
|---|---|
| Inbound triage: leads, email, Discord/Telegram DMs, forms → pod/owner, priority, spam/scam, needs-human | Choice (+`other`) · Score (concrete levels) · Noul flags |
| Agent-harness control: which agent/skill/model handles a task; retry/continue/stop/escalate; "is the task done?" | Choice + a Noul "any of these fits?" gate (the skill_suggestion pattern) |
| Pre-execution **risk flags** on tool calls (destructive, irreversible, touches prod/keys/funds?) | Noul per risk. **Fail closed**: an error or mid-band value → human |
| QA gates on LLM deliverables before a client sees them (on-brief, tone, contains secrets/PII, each claim supported by a source) | Score per rubric dimension; one Noul per claim (citation_check) |
| Web3 ops: classify governance proposals, grant applications, and community posts (phishing/scam, off-topic); triage monitoring alerts | Choice / Score / Noul |
| GTM: ICP-score lead lists and reply triage | Score + Nouls (cf. 16,711 connections for $0.73) |
| Selection instead of generation: pick the right template, snippet, or extracted candidate that code or an LLM proposed | Choice over candidates |

**Keep in code:** amounts, balances, gas, dates and deadlines, counting, allowlists, signatures, permissions, pricing math, schema checks (jaggedness #2, #3).

**Keep in an LLM or human:**

- drafting proposals, code, and contracts;
- explanations;
- multi-hop reasoning;
- anything needing outside knowledge;
- **final approval of payments, deployments, on-chain transactions, quotes, and legal/compliance decisions.** Jev may *flag* or *deny*, never solely *approve*.

### 9.2 Confidence-gating patterns

- **Per-action risk tiers,** not one global threshold. The official example uses a 0.6 floor → human for everything, low-stakes acts at ≥ 0.6, and a high-stakes action acts only above 0.85, otherwise confirm [DOCS patterns/confidence-routing]. Suggested starting points, to be tuned in shadow mode:

| Tier | Examples | Act automatically if | Else |
|---|---|---|---|
| T0 reversible/internal | tagging, sorting, internal queue | Choice/Score `confidence ≥ 0.6`; Noul outside [0.2, 0.8] | LLM second opinion (AI SDK `anthropic.evaluationModel(...)` or `system-one-adapter`) |
| T1 client-visible, reversible | assign pod, pick reply template, nurture vs sales | `confidence ≥ 0.8` **and** label ≠ `other` | human queue |
| T2 costly/irreversible | send quote, merge/deploy, any fund movement | never automatic on Jev alone | human with deterministic checks; Jev only prioritizes or flags |

- **Noul needs a band, not a threshold.** 0.5 means uncertainty, not medium intensity; there is no confidence field.
- Always add an **`other` / `none_of_the_above`** label. Audit that bucket; confident misroutes happen (54/162 OOS at ≥ 0.9 in CLINC150).
- **Multi-label → one Noul per label.** A single Choice forces a false either/or.
- **Never transfer thresholds** between Noul and Choice, between questions, or across model versions. **Pin `jev-1.13.0`** in production and re-tune when you move `jev-latest`.
- **Speculative fan-out:** ask every branch's questions in one request; code consumes the relevant ones. State dominates cost, so questions are nearly free: 12.2× cheaper than one per call.
- **Two-pass:** a cheap 5–7 question gate on everything → a detailed checklist on survivors → an LLM only where prose is needed.
- **State hygiene:** a named JSON state with only the needed fields; full meaning in `instructions` (keys are invisible); concrete, self-standing Score levels (each level is judged without seeing its number or neighbours); ≥ 2 Choice labels; stay under 32k (state + longest question).

### 9.3 Logging (decision ledger) — log every call

```json
{
  "decision_id": "uuid", "ts": "2026-09-26T12:00:00Z", "workflow": "lead_triage", "question_set": "lead_triage@v3#sha256",
  "transport": "typesafe|ai-gateway|openrouter|llm-fallback", "model_requested": "jev-1.13.0", "model_resolved": "jev-1.13.0",
  "sdk": "0.6.0", "request_id": "req_...", "state_ref": "s3://…/hash (not raw PII)", "state_tokens": 143,
  "answers": { "route": { "choice": "agent_infra", "confidence": 0.91, "probabilities": {} } },
  "policy": { "tier": "T1", "thresholds": { "route": 0.8 } }, "action": "auto_assign|human_review|llm_fallback",
  "latency_ms": 212, "cost_usd": 0.000006, "error": null,
  "outcome": { "human_override": null, "correct": null, "labeled_at": null }
}
```

- Store the raw distributions, not just the winner. That allows re-thresholding offline without re-inference.
- Compute a weekly **reliability curve / ECE per question** from outcomes.
- Cache by `(state hash, question-set hash, model version)`; answers are near-deterministic.
- Keep SDK `logLevel` at `warn`: `debug` dumps bodies (client data).

### 9.4 Next.js integration checklist

- **Server-only:** route handlers, server actions, queues/workers. The SDK refuses browsers.
- **A thin `DecisionEngine` interface with adapters:**
  - TypeSafe direct (`@typesafe-ai/sdk`) once off the waitlist;
  - AI Gateway (`experimental_evaluate`, `typesafe-ai/jev…`) now;
  - OpenRouter (`/api/alpha/decisions`) as a secondary;
  - an LLM evaluation adapter as fallback;
  - `Experimental_EvaluationMockModelV4` for tests.
  - Normalize `boolean`↔`noul` and where `confidence` lives.
- **Deadlines:** the TS SDK timeout is per attempt with no total budget. Pass `signal: AbortSignal.timeout(…)` and set `retry.maxRetries` consciously. Use a circuit breaker.
- **Error policy:** fail closed for risk gates (→ human); fail over for routing (→ LLM or default queue).
- **Rate limits:** 1,200 rpm / 250k tok/s. Concurrency-limit, batch questions per state, honour `RateLimitError.retryAfterMs`. Handle `529`.
- **Validation layer** before sending: ≥ 2 Choice labels, a fallback label present, ≤ 255 labels, 2–10 Score levels, token estimate < 32k. See `jev_lint` ideas.
- **Security:** treat inbound text as adversarial (jaggedness #6). Never let Jev alone gate on attacker-controlled content; pair with deterministic checks.
- **Privacy:** no secrets or private keys in `state`. TypeSafe says it doesn't train on customer data; a DPA exists; ZDR is enterprise-only.

### 9.5 Rollout

1. **Shadow mode:** log Jev beside the current process (LLM or human).
2. Measure agreement and calibration per question.
3. Enable T0 automation.
4. Enable T1 after ≥ a few hundred labeled outcomes per question.
5. Keep T2 human.
6. Re-run the eval set on every model or alias change.

### 9.6 Terms of service: reselling or wrapping Jev decisions in a paid API

What is known:

- The governing document is the **Master Customer Agreement**: `typesafe.ai/legal/mca`. The DPA is at `/legal/data-processing` and privacy at `/legal/privacy-policy` [DOCS legal].
- Quoted by a third party (the shimo4228/contemplative-agent RFC-0040, which checked the MCA on 2026-09-20 and 2026-09-22) [REPO, second-hand]:
  - **§2.3(b)** prohibits using Output for **model distillation, training models that imitate outputs, or developing competing products**. This clause remains after the 2026-09-19 revision.
  - The earlier **§2.3(f)** ban on **publishing benchmarks or performance information** (MCA dated 2026-08-27) was **removed** in the 2026-09-19 revision (§2.3 is now items (a)–(l)).
- **Not verified:** any explicit clause on resale, sublicensing, "service bureau", or providing the Services to third parties. The MCA could not be read from this sandbox.

Implications:

- Do **not** build a "Jev-as-a-service" API that exposes raw Jev outputs or near-pass-through access. That risks the "competing product" and third-party-access restrictions.
- Selling **outcomes** (triage, scoring, and QA as part of our services and products) is the lower-risk pattern.
- Do **not** use Jev outputs to train or distill our own classifier.
- Get **written confirmation from sales@typesafe.ai** before launching any paid API whose core value is Jev decisions.
- Gateway and OpenRouter usage additionally falls under Vercel's and OpenRouter's terms.

---

## 10. Confidence / unverified

**High confidence (verified in source, plus executed):**

- TS/Python SDK APIs, types, defaults, retry/timeout behaviour, and error classes;
- the exact request body and headers;
- the response shape (from OpenAPI-generated models and SDK tests);
- the AI SDK 7 `experimental_evaluate` / `@ai-sdk/typesafe-ai` / gateway evaluation-model mechanics;
- the OpenRouter decisions path;
- the LangChain.js classifier;
- all four compiled examples (`tsc` exit 0 on TS 7.0.2 and 5.9.3).

**Medium** (official docs via a community translation; the wording is back-translated, but numbers, tables, and code are unchanged):

- pricing, rate limits, context limits, aliases;
- the jaggedness list;
- confidence guidance and the confidence-formula approximation;
- the cookbook numbers;
- error table entries (e.g. `529 Overloaded`).

**Low / unverified (search summaries or secondary sources only):**

- 70–500 ms, "40–200× faster", "two orders of magnitude".
- **Vendor workflow evals** (evals.typesafe.ai): reportedly Jev 67.8% over 711 cases on 4 workflows (security incidents, agent-trajectory observability, invoices, customer service). Reference labels are the *average of GPT-6 Astra and Claude Fable 5.1 outputs*, not human gold labels.
  - Secondary sources **disagree** on the comparator: one says Claude Fable 5.1 at 74.1%; another says GPT-5.6 Sol at 74.1%, Opus 5 at 73.1%, and GPT-5.6 Terra at 67.9%.
  - Claims of 193.6× speed and 444.6× cost are self-reported and not independently reproduced (ts2.tech).
- RLCD internals: no paper. Parameters and architecture undisclosed.
- Funding, valuation, founders.
- HN 1,913 points; 36M video views.
- MarkTechPost (2026-09-19 and 2026-09-23), flaviocopes.com/jev, the dev.to/valyuai guide (1,018-paper demo), the LangChain harness blog: content seen only through summaries.
- Greg Isenberg's X post text (only the video show notes and the curated summary were read).
- Gateway model ID: `typesafe-ai/jev` (typed in `@ai-sdk/gateway`) vs `typesafe-ai/jev-latest` (AI SDK docs). Gateway pricing and markup.
- The `max_tokens_exceeded` error code.
- Whether the server accepts `state: null`, a 1-level Score (OpenAPI says `min_length=1`; docs say ≥ 2), or a 1-label Choice (the community says yes).
- MCA clauses (second-hand quotes only); reselling terms unknown.
- Waitlist status may change at any time. Rate limits are explicitly volatile.

**Sandbox constraints:** typesafe.ai, docs.typesafe.ai, api.typesafe.ai, x.com, ai-gateway.vercel.sh, and fxtwitter were blocked (403). The session's WebSearch budget ran out after 7 searches, so the remaining research went through GitHub (clone, raw, code search), npm, and PyPI.

---

## 11. Sources

**Package source / registries (first-hand):**

- npm `@typesafe-ai/sdk` 0.6.0 / 0.5.7 tarballs + source maps — https://www.npmjs.com/package/@typesafe-ai/sdk
- https://github.com/typesafe-ai/typesafe-sdk-js (src, tests incl. `test/integration/api.integration.ts`, `docs/changelog.md`, `examples/demo.ts`)
- PyPI `typesafe-sdk` 0.7.1 wheel (incl. `_schemas/models.py` generated from https://api.typesafe.ai/openapi.json) — https://pypi.org/project/typesafe-sdk/
- https://github.com/typesafe-ai/typesafe-sdk-python (changelog, tests)
- https://github.com/typesafe-ai/skills (official skill / Claude Code plugin)
- https://github.com/typesafe-ai/system-one-adapter-python
- npm `ai@7.0.116` (`docs/03-ai-sdk-core/32-evaluation.mdx`, `src/evaluate/*`), `@ai-sdk/provider@4.0.18` (evaluation-model v4), `@ai-sdk/gateway@4.0.94` (`gateway-evaluation-model.ts`), `@ai-sdk/typesafe-ai@3.0.8` (src + `docs/105-typesafe-ai.mdx`) — https://github.com/vercel/ai
- npm `@openrouter/sdk@1.3.32` (decisions models, `/api/alpha/decisions`)
- npm `@langchain/typesafe@0.0.1`; npm `langchain@1.5.12` (checked for middleware)

**Official docs (read via the community translation mirror):**

- https://github.com/datawhalechina/jev-cookbook (`content/models.md`, `model-jaggedness/jev-1.13.md`, `api.md`, `confidence.md`, `primitives/*`, `patterns/*`, `cookbooks/parallel_questions.md`, `legal.md`, `introduction/quickstart.md`, `agent-skill.md`)
- Originals:
  - https://docs.typesafe.ai/models
  - https://docs.typesafe.ai/model-jaggedness/jev-1.13
  - https://docs.typesafe.ai/api
  - https://docs.typesafe.ai/confidence
  - https://docs.typesafe.ai/cookbooks/parallel_questions
  - https://docs.typesafe.ai/llms.txt
  - https://typesafe.ai/legal/mca

**Community repos (first-hand):**

- https://github.com/tamaratran/fast-jev-compaction
- https://github.com/browser-use/jev-ultrafast
- https://github.com/nexibeo/jev-cookbook (`docs/GUIDE.md`, `lib/jev.mjs`)
- https://github.com/chr-kelly/jev-cookbook
- https://github.com/DoGMaTiiC/hermes-jev
- https://github.com/codaaiteam/jev-typesafe-ai
- https://gist.github.com/pjburnhill/adf8d28efcad9df037bfdece178ef965
- https://github.com/dbreunig/building-with-jev-skill
- https://github.com/0x7067/claude-jev
- https://github.com/okooo5km/jev
- https://github.com/dog-last/awesome-jev
- https://github.com/Li-Evan/awesome-jev (`pages/learn-techniques.md`)
- https://github.com/shimo4228/contemplative-agent/blob/main/rfcs/0040-jev-system-one-local-decision-backend.md (MCA quotes)
- https://github.com/bcharleson/jev-gtm-cookbook
- ZacSadan/podcasts-summary — "Greg Isenberg _ Jev is HERE_ How to use it" show notes (raw.githubusercontent.com)

**Search-summary / secondary only:**

- https://typesafe.ai/blog/introducing-system-one-models-and-jev
- https://www.marktechpost.com/2026/09/19/typesafe-ai-releases-jev/
- https://www.marktechpost.com/2026/09/23/a-coding-guide-to-typesafe-ai-jev/
- https://flaviocopes.com/jev/
- https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e
- https://www.langchain.com/blog/building-a-harness-with-jev
- https://x.com/gregisenberg/status/2101018750916948237
- https://x.com/gregisenberg/status/2101284640828915995
- https://www.youtube.com/watch?v=4mTLpuQpB80
- https://evals.typesafe.ai/
- https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway
- https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk
- https://openrouter.ai/typesafe/jev-1.13
- https://developers.cloudflare.com/ai/models/typesafe/jev/
- https://www.datacamp.com/blog/system-one-models-jev
- https://ts2.tech/en/typesafe-ai-raises-40-million-for-jev-but-its-445x-cost-claim-is-still-self-tested/
- https://www.eesel.ai/blog/typesafe-jev-pricing
- https://www.turingpost.com/p/what-is-jev-rlcd
- https://www.mindstudio.ai/blog/typesafe-jev-rlcd-vs-rlhf
- https://www.truefoundry.com/blog/typesafe-ai-jev
- Chinese research notes in `datawhalechina/jev-cookbook/main/11_知识库/jev-cookbook/10-feishu-research/` (secondary synthesis with citations)

**Verification artifacts** (scratch, not committed): `…/scratchpad/jev/tscheck/{example.ts,dynamic.ts,aisdk-example.ts,wire.mjs,aisdk-wire.mjs}`, `…/scratchpad/jev/py/wire_py.py`.
