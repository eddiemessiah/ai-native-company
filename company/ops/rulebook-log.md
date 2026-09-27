# Rulebook log

The rulebook is the product. Every mistake caught in review becomes an entry here, and when a pattern repeats, a rule in the offer's `rulebook` in `packages/catalog/src/offers.ts`. After a few dozen jobs per offer, this list is what nobody else has.

## How to log a mistake

Add a row the same day it's caught:

| Date | Offer | Job | What went wrong | Caught by | Root cause | New rule (if any) |
|---|---|---|---|---|---|---|
| 2026-09-27 | ai-visibility-audit | example | Assistant quoted last year's price as current | Founder review | Business's own site still showed the old price | "Check the client's own pages for stale facts before blaming the assistant." |

**Root cause is one of:** missing context in the state · an ambiguous question or criteria · the model's known weak spot (counting, dates, literal reading) · a data problem at the client · a process gap (we skipped a step) · a genuine model error.

## When a row becomes a rule

- The same root cause appears **twice** in one offer.
- Or it caused, or nearly caused, harm with money, legal exposure or reputation.

When you add a rule, also decide whether it belongs in:
- **code:** a check that runs automatically (preferred);
- **the brain:** a new typed question, or a better criterion description;
- **review:** something a person must look at every time.

## Weekly review (Saturday)

1. Read the week's rows.
2. Promote repeats to rules.
3. Look at every decision with confidence under 0.6: were the criteria distinguishable? Flat distributions mean fix the question, not the model.
4. Update thresholds only on decisions with enough history, and record the old and new values.
