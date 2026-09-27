# Content engine

Content is the cheapest distribution you have: you already have the audience, the proof, and a stream of real work to write about. The goal is **one strong idea per day, produced by agents, gated by the brain, and finished by you.**

## Formats that work (from Greg Isenberg's playbook, adapted)

1. **The 24-hour explainer.** Within a day of a major launch (a new model, protocol or API), post "the clearest explanation of X, and the businesses it unlocks". The next morning, post "10 products I'd build with X in Lagos". Long numbered lists get far more bookmarks than short takes.
2. **Build in public, with numbers.** Every Saturday: cash collected, jobs, mistakes, what changed in the rulebook. Real numbers beat polish.
3. **Teardowns.** Take one open-source project, protocol or agent and show what the code actually does (see the company-brain post).
4. **"Sell the screenshot" case studies.** Before-and-after of what AI said about a real business (with permission), and what fixed it.
5. **Lesson threads.** One concept from the study group per week, with a code sample and a "try it" step.
6. **Africa field notes (Griot).** Sourced, dated notes on AI in Africa: summits, policy, infrastructure, builders.
7. **Audio and video.** Keep CeloIQ Sessions and Based Conversations going. Each episode becomes 3 clips and a thread. The clips, trailer and chapters come from the Video Desk (`ops/playbooks/video-desk.md`); these shows are its first jobs.
8. **Explainer shorts.** Each research post becomes a 30–60 second short, sourced from the post itself (`ops/playbooks/explainer-shorts.md`). Every quote and number is checked in code before it's voiced.

## The pipeline

```
signals (launches, client work, research) ──► LLM draft in your voice
        ──► content gate: hook, specificity, voice, unsourced numbers
        ──► you edit and publish
        ──► repurpose: thread → LinkedIn post → Griot article → newsletter → clips
```

The content gate is live as a recipe (`contentQuestions` in `packages/brain`, and `POST /api/v1/content-gate`). A draft with unsourced numbers never ships.

## Weekly calendar

| Day | Post |
|---|---|
| Mon | A study-group lesson thread |
| Tue | A client or build story ("sell the screenshot", or a teardown) |
| Wed | Africa field note (Griot) |
| Thu | The big idea: a numbered list or explainer |
| Fri | A short demo video of something shipped this week |
| Sat | Build in public, with the week's numbers |
| Sun | Rest, or a reply guy day in builder threads |

## Voice rules

- Lead with the most surprising specific: a number, a name, a line of code.
- Every number has a source or says "our data".
- No filler openers ("In today's fast-paced world…"); no "game-changer"; no emoji walls.
- Write like you'd explain it to a builder at Café Cursor.
- Always one clear call to action: the free audit, the cohort, or the API.

## Ready-to-post drafts

See `content/threads/`:
1. Launch thread
2. The Jev explainer (the 24-hour format)
3. "10 AI-native services I'd start in Lagos"
4. AI Study Group v2 and the cohort
5. Selling to agents on Celo with x402
