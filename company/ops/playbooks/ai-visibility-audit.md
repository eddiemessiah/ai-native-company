# Playbook: AI Visibility Audit

**Unit:** one audit, 25 buyer questions across 4 assistants (ChatGPT, Claude, Gemini, Perplexity). **Price:** ₦60,000 / $150. **Turnaround:** 48 hours. **Free** for existing clients and as a sales lead magnet.

## 1. Intake (10 min)
- Business name, website, city or cities served.
- Top 5 products or services with current prices.
- 5 competitors.
- The owner's own facts: opening hours, delivery areas, payment options, phone and WhatsApp.

## 2. Build the question set (15 min)
Write 25 questions a buyer would ask. Mix:
- **Discovery (8):** "best {category} in {area}", "where can I buy {product} in {city}".
- **Brand (8):** "{business} prices", "is {business} legit", "does {business} deliver to {area}", "{business} opening hours".
- **Comparison (5):** "{business} vs {competitor}".
- **Purchase (4):** "how do I order from {business}", "{business} WhatsApp number".

## 3. Run it (agents; 20 min of your time)
- Ask every assistant every question in a fresh session. Record the question, assistant, date, full answer, and a screenshot.
- The brain scores each answer with typed questions (use `Brain.decide` with state = {facts, answer}):
  - `accurate` (Score): wrong · partly wrong · correct but vague · correct and specific;
  - `mentioned` (Noul): the business is named;
  - `recommended` (Noul): the business is recommended over others;
  - `sentiment` (Score): negative · neutral · positive.
- Code computes the share of answers where the business is mentioned, recommended and accurate, per assistant.

## 4. Review (30–45 min, a person)
- Read every answer scored "wrong" or "partly wrong" against the owner's facts. **Check the business's own pages first:** stale prices on their own site are the most common root cause.
- Remove anything you can't verify.

## 5. Write the fixes (LLM drafts, you edit)
Ranked by impact:
1. Wrong facts on their own site, Google Business Profile and social bios.
2. A clear facts page (prices, delivery, hours, contact) plus `llms.txt`.
3. Structured data (LocalBusiness, Product, Offer).
4. Listings and reviews on the platforms the assistants cited.
5. The Agent-Ready Website upgrade, if the site can't be fixed cheaply.

## 6. Deliver
- A one-page summary: the headline numbers ("mentioned in 6 of 100 answers; wrong price in 4"), the three worst answers quoted verbatim, and the fix list.
- An offer: monthly tracking (₦25k: the same 25 questions re-run and diffed) or the Agent-Ready Website.

## Rulebook
- Quote answers verbatim, with date and assistant; never paraphrase an error into something worse.
- Accuracy is judged against the owner's published facts, not our guess.
- Every fix must be something the owner controls.
- Re-run the same 25 questions for tracking; don't change the question set between months.
