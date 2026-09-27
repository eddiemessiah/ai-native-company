# GTM Harness

A founder describes their product and gets:

- a go-to-market plan: an ideal-customer scorecard, where those customers gather, a 7-day sprint and a Monday dashboard;
- three first messages, each checked by a reviewer that can block a draft but never send one;
- a folder their own agents keep running in Claude Code.

It runs at `/gtm` on Nova's site. The split:

- **An LLM writes** the plan (`src/plan.ts`, Claude with structured outputs). With no model key, templates write it instead.
- **The brain reviews** every draft: ready, revise or blocked (`src/review.ts`).
- **Code packs** the folder and the zip (`src/harness.ts`, `src/zip.ts`).
- **The founder sends** everything.

```ts
import { buildHarness, generatePlan, gtmInputSchema, templatePlan } from "@repo/gtm-harness";
import { zipHarness } from "@repo/gtm-harness/zip";

const input = gtmInputSchema.parse(form);
const { plan } = process.env.ANTHROPIC_API_KEY ? await generatePlan(input) : templatePlan(input);
const zip = zipHarness(buildHarness(input, plan, []));
```

## Licence

The MIT licence in `LICENSE` covers:

- this package;
- the page, component and API route marked `SPDX-License-Identifier: MIT` in `apps/web`: `app/gtm/page.tsx`, `components/gtm-harness.tsx` and `app/api/gtm/run/route.ts`.

The draft reviewer runs on `@repo/brain`, Nova's decision layer, which this licence doesn't cover. Your plan, your drafts and the folder you download are yours.
