# Hackathon activations on WhatsApp and Telegram

**Status:** written Sat 10 Oct 2026, for the Agents on Open Rails hackathon (Celo, 6 Oct – 9 Nov). This is Edidiong's ambassador work, run with the GTM Harness as a free tool. It is not a Shonin campaign: nothing here sells, prices or names Shonin in a Celo channel (`ops/conflicts-of-interest.md`, rules 1–2). The Celo-side targets, the community map and partner details stay in Edidiong's Drive, not in this repo.

## 1. What already happened

- **6 Oct:** the hackathon was posted in WhatsApp and Telegram builder groups across Africa, picked from the community map (Drive: *Community Map*, source `group_scan.md`). Edidiong ran the campaign with an agent harness connected to his own accounts.
- **Admin-only groups:** these were marked for a ready-to-forward message to the admin. Groups whose rules ban promotion were marked not suitable and skipped.
- **People reached out.** Edidiong reports that the campaign worked and that builders contacted him afterwards (his post on X). Neither this repo nor his Drive has the counts yet. Add them in §5 from the post and his DMs before anyone quotes a number.
- **Next touch:** Mon 12 Oct, a value follow-up in the same groups, not a repeat of the first post (the community map's note).

## 2. The facts every message can use

Source: the CeloDevs newsletter for 1 and 6 Oct. Check the hackathon page before posting, because dates move.

| | |
|---|---|
| Window | Tue 6 Oct (kick-off 12:00 GMT) to Mon 9 Nov, 09:00 GMT: the registration and submission deadline |
| Winners | Fri 13 Nov in the newsletter; the content calendar also flags Mon 16 Nov. Don't quote either until it's confirmed |
| Prizes | $5,000 in CELO across three tracks, plus partner perks |
| Track 1 | Stable Agents: LatAm (Ripio wFIAT stablecoins), $2,000 |
| Track 2 | Open Corridors, $2,000: Textile FX (live corridors include cNGN) and USA₮ with Celo's x402 |
| Track 3 | Build with `buy`, $1,000 across five projects ($200 each) |
| Requirements | A public GitHub repo; an ERC-8004 agent ID in every track; the attribution tag |
| Register | https://www.loops.house/agents-on-open-rails/playground/ideate |
| Help | Office hours every Thursday, 12:00 GMT; the Telegram group https://t.me/realworldagentshackathon; Celopedia |

**The Africa angle:** cNGN is a live corridor in Track 2, so a Nigerian builder can ship a naira agent and compete for a share of $2,000 without leaving home. Lead with that, not with "a hackathon is happening".

## 3. The plays, by week

The weeks follow the hackathon's phases (Drive: *Cencori x Celo content plan*).

| Week | Play | WhatsApp | Telegram |
|---|---|---|---|
| **Onboarding, 11–17 Oct** | The 12 Oct value follow-up: one track card per group, with the one link that gets a builder unstuck | A 60-second voice note in English and Pidgin, plus one image: "Track 2 pays for naira agents" | A pinned message with the four links (register, office hours, Telegram group, Celopedia), and a poll: "Which track are you building?" |
| | Admin-only groups | A ready-to-forward message for each admin, written to that group's rules | The same, by DM to the admin |
| **Education, 18–25 Oct** | Build-live: the corridor session on Tue 20 Oct, 12:00 GMT (Drive: *Hackathon #6 Africa plan*) | A reminder to the groups whose members voted for Track 2, on the morning of the session | A reminder 1 hour before, then the recording link afterwards |
| | The campus pilot (UNIZIK × AECES) | Nothing public until due diligence clears; the workshop date is still open (24 or 31 Oct) | The existing Celo × AECES UNIZIK group carries the logistics |
| **Build, 26 Oct – 2 Nov** | Unblock: answer every builder question within a working day; route bugs to office hours | Reply in the group, then DM only if they asked | A weekly "stuck?" thread in the hackathon group |
| **Final push, 3–9 Nov** | Submission checklist: repo public, ERC-8004 ID, attribution tag | Reminders at 72 hours and 24 hours before 9 Nov, 09:00 GMT | The same, plus the checklist pinned |

## 4. How the harness runs it

The harness only does the preparation. Edidiong approves each post and sends it himself.

1. **Workspace:** `pnpm gtm new gtm-workspaces/open-rails`, with the hackathon as the "product" and builders in Africa as the audience. `gtm-workspaces/` is git-ignored.
2. **Pipeline:**
   - Every group is a row in `pipeline.csv`, with its source, platform, rules and admin-only flag.
   - Every builder who reaches out is a row too, with the group they came from as the source.
   - Anyone who asks to stop is marked `do_not_contact` the same day.
3. **Drafts:** one per group, written to that group's rules and members. `pnpm gtm check` flags the same text going to many places, so each draft needs its own line for that group.
4. **Approval:**
   - Every draft goes to Edidiong's Telegram, bound to the hash of its exact text.
   - The send link (a WhatsApp or Telegram share) opens with the post filled in, and his tap is the send.
   - No bot joins a group and nothing is posted in bulk.
5. **Follow-up:** `pnpm gtm due` lists who is owed their one follow-up, counted in working days by code.
6. **Corrections:** every edit Edidiong makes goes into `corrections-log.md`. A correction that happens twice becomes a row in `rules/checks.md`.

**Rules:**

- **Groups:** post only where the group's rules allow it. Never DM members found through a group unless they wrote first.
- **Celo-owned groups:** hackathon and Celo content only.
- **The harness on X:** on his personal X account, Edidiong can say he used a free, open-source tool. In Celo channels the tool goes unnamed unless someone asks.

## 5. What to measure, so the result can be quoted

Log these in the workspace while the campaign runs. They become the proof line in thread 09 and the case study.

| Measure | Where it comes from | Count |
|---|---|---|
| Groups posted on 6 Oct | `pipeline.csv` rows with status Posted | [fill] |
| Members reached (sum of group sizes, an upper bound) | The community map | [fill] |
| People who reached out first | Edidiong's DMs, logged as leads | [fill] |
| Registrations from Africa that mention a WhatsApp or Telegram group | A "where did you hear about it" answer on registration, if the organisers add one; otherwise ask each new builder | [fill] |
| Submissions from those registrations | The hackathon's submission list, after 9 Nov | [fill] |
| Time Edidiong spent approving | The approval timestamps in `approvals.jsonl` | [fill] |

Members reached is an upper bound, not reach: say "posted in groups with N members", never "reached N builders".
