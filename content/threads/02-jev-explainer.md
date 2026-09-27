# Thread 2: Jev, the clearest explanation (24-hour format)

1/
Everyone's talking about Jev.

Here's the clearest explanation I can give, and the businesses it unlocks in Africa 🧵

2/
Jev (by TypeSafe AI) is a "System One" model.

It doesn't generate text. At all.

You send it state + typed questions. It answers every question in ONE parallel pass, with probabilities.

3/
Three primitives, that's the whole API:

• Choice: pick one option from a list ("billing / technical / other")
• Score: place on a scale you define ("calm → frustrated → furious")
• Noul: probability of yes ("is the customer asking for a refund?")

4/
Pricing: $0.042 per million input tokens. Output is free.

A public pipeline summarized 1,018 papers with a generative model for $3.99, then classified all of them with Jev for $0.08, at a median 256 ms each.

5/
The mental model: Jev is a smart if-statement.

`if order.total > 100`: code can do that.
`if customer is angry`: code can't. That's the branch Jev is for.

6/
The split that matters:

• Creates text? → LLM
• Picks from a list, scores, yes/no? → Jev
• Exact rule (limits, counts, dates)? → code

The biggest savings aren't the cheaper model. They're the requests that skip the model entirely.

7/
The part people miss: gate on confidence, one bar per risk.

Read-only lookup? Run at modest confidence.
Anything that moves money? Prepare it. A person approves.

A calibrated number is a reason to route aggressively, never a reason to fire something irreversible.

8/
Know the weak spots (TypeSafe publishes them):

• reads literally
• can't count
• dates are text
• worse with irrelevant state stuffed in

Count in code. Compare dates in code. Always include an "other" option.

9/
Be honest about the benchmark: ~68% on TypeSafe's own eval, level with mid-tier frontier models, scored against labels from two frontier models.

That's agreement, not ground truth. Test on YOUR traffic.

10/
No API key yet? It's waitlisted, but you can reach Jev through the Vercel AI Gateway (`typesafe-ai/jev-latest`) or OpenRouter today.

Our brain package supports all three, with a Claude fallback.

11/
Tomorrow: 10 businesses I'd build with this in Lagos.

(Spoiler: WhatsApp order lines, fintech support triage, AML alert triage, grant scoring, and a spend firewall for agents that pay.)
