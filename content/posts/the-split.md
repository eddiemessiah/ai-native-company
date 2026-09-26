---
title: The split: how an AI-native firm divides work between LLMs, System One models and code
description: Most calls inside an agent aren't text. They're a choice from a list, a number on a scale, a yes or no. Here's how we route every job three ways, and where a person holds the pen.
date: 2026-09-26
tags: [jev, architecture, ai-native services]
---

Open any agent you've built and look at what it spends money on. A frontier model, charged per million tokens, sits in a loop answering questions like: which worker goes next? Is this urgent? Is there enough evidence to write? Does this need approval?

None of those answers are text. They're a choice from a list, a number on a scale, a yes or no.

That's the design principle Nova is built on. Every unit of work we sell, whether an audit, an agent, a grant application or a company brain, is split three ways, and a fourth colour marks where a person approves.

## The four colours

- **LLM writes (saffron).** Research, drafts, briefs, code, explanations. The expensive engine, used only where language is the output.
- **System One decides (indigo).** Route, score, approve, escalate. Typed answers with calibrated confidence, in one parallel pass.
- **Code executes (bone).** Counts, dates, limits, payments, records. Anything you can compute exactly never touches a model.
- **A person approves (kola).** Money, legal exposure, reputation. The system prepares; a person approves.

The colours aren't decoration. They're the same four on our website, in our directory, and in every decision log line, so anyone can see which part of a job was generated, which was decided, which was computed and who signed off.

## Why a System One model

TypeSafe's Jev is the first model built for the middle column. You send it state plus typed questions (`Choice`, `Score`, `Noul`) and it answers all of them in one pass with probabilities, at $0.042 per million input tokens with output free. It doesn't generate text at all; it can't return a value outside the schema you asked for.

The economics are the whole thesis in one line. A public pipeline in September summarized 1,018 research papers with a generative model for $3.99, then classified all of them with Jev for $0.08, at a median 256 ms per paper. TypeSafe's own cookbook reports that batching 13 questions into one call was about 12× cheaper and 10× faster than asking them one at a time, with the same answers.

That doesn't mean "replace your LLM". It means use each model for what it's built for.

## The third bucket matters most

The biggest savings in a well-designed cascade aren't from a cheaper model. They're from the requests that skip the model entirely once a cheap decision routes them to plain code.

Our support-triage recipe is the clearest example. One typed call answers five questions about a ticket (intent, complexity, frustration, refund requested, reproduction steps). Then code decides:

- **Order status goes straight to a database lookup.** No model at all.
- **Product questions load a specialist LLM.**
- **Refunds go to a person.** A model may draft, a person approves, because refunds move money.
- **Very angry customers go to a person first,** whatever the category.

## Gate on confidence, one bar per risk

A calibrated confidence score is a reason to route more aggressively, never a reason to let a model fire an action that can't be undone. So we don't have one global threshold. We have one per kind of risk:

| Risk | Bar | What happens |
|---|---|---|
| read | 0.50 | executes above the bar |
| write | 0.70 | executes above the bar, else a person confirms |
| external | 0.85 | executes above the bar, else a person confirms |
| money | 0.90 | prepared only; a person approves |
| irreversible | 0.95 | prepared only; a person approves |

Below 0.5 a person always decides. Providers whose probabilities aren't trained against outcomes (an LLM self-reporting its confidence, or our lexical fallback) must clear every bar by an extra 0.10, and never execute external actions on their own.

## Know the failure modes

System One models read literally, can't count, treat dates as text, and get worse as you stuff irrelevant state into the call. Our brain package lints every question set for these before it ships: a `Choice` with no `other` option, instructions that ask it to count, questions that compare dates. Flat probability distributions come back flagged: that usually means your options weren't distinguishable, not that the model is confused.

Benchmarks deserve the same scepticism. TypeSafe's own four-workflow evaluation puts Jev around 68%, level with mid-tier frontier models, scored against labels made by averaging two frontier models. That's agreement, not ground truth, and it's self-run. Measure on your own traffic before you trust anyone's number, including ours.

## What this looks like as a business

A firm built this way sells finished work priced per unit, delivers it at software margins, and can show a customer exactly how every decision in their job was made. That's the offer: **the work, done**, with a receipt for every decision.

Start with one repeated decision in your business. Measure it on your own traffic. Then replace the next one.
