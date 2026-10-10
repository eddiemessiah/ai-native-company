# Design brief: Shonin GTM private beta

**For:** Claude Design. **From:** Edidiong Umana, founder of Shonin. **Written:** Sat 10 Oct 2026. **Build:** the working code is in `apps/web/app/beta` and `packages/gtm-cloud`; this brief defines the flows and artifacts the design must cover, so the build can follow it on Sunday. Spec: `company/gtm/beta-plan.md`.

## 1. The product in one paragraph

Shonin GTM runs a founder's go-to-market with agents in the tools the founder already uses.

- **Agents draft:** posts, messages and updates.
- **Code checks every draft** against the founder's own rules: invented numbers, unfilled [slots], banned phrases, length, people who opted out.
- **A reviewer marks each draft** ready, revise or blocked.
- **The founder approves**, on the web or with one tap in Telegram. The approval is bound to the exact text.
- **On approval:** posts on the founder's own channels (X, their Telegram channel or group, Slack) run by themselves. A message to a person becomes a one-tap link that opens WhatsApp, email or Telegram with the text filled in, and the founder's tap sends it.
- **Records:** everything leaves a signed receipt.
- **Bring your own agents:** any agent (Claude Code and its subagents, Codex, Cursor, a custom bot) connects through one URL and can draft and ask, but never send or approve.

**Who it's for:** founders, marketers and operators, many in Lagos, Accra and Nairobi, who sell through WhatsApp and Telegram and live on their phones.

## 2. What the design must get right

1. **Trust at a glance.** On any card, the founder must see in under 2 seconds:
   - who wrote it;
   - what checks found;
   - where it goes;
   - what happens when they tap Approve: "posts now" or "gives you a link".
2. **Phone first.** The Desk and the Telegram cards are the product. The desktop layout is the phone layout with more room, not a different app.
3. **One meaning per colour.** The site's split colours are the only accents:
   - saffron `--write` (an LLM wrote this);
   - indigo `--decide` (the reviewer judged it);
   - bone `--code` (code checked or ran it);
   - vermilion `--human` (you approve; your seal).
   
   Everything else is monochrome on `--bg #0b0b0a` (dark) or `#f2eee4` (light).
4. **The seal.** Approval is the brand moment: the vermilion 承 seal (from the temple site and the launch film) stamps the card. Receipts carry it small.
5. **Plain words.** Copy follows `company/gtm/content-engine.md`: lead with a number, a name or a line of code; no hype words, no "Welcome to", no emoji.

## 3. Brand system to reuse (don't invent a new one)

- **Type:**
  - Bricolage Grotesque (UI and headings);
  - Instrument Serif italic (one emphasised word per heading, at most);
  - JetBrains Mono (ids, hashes, commands, labels);
  - Shippori Mincho B1 (kanji only).
- **Tokens:** `apps/web/app/globals.css`, with `--bg`, `--bg-2`, `--fg`, `--dim`, `--faint`, `--line`, the four split colours and `--live` (green, for "connected" and "posted").
- **Reference screens:**
  - the temple home page (`/`);
  - `/gtm` (the free harness, with the four-colour split row);
  - the launch film (`packages/video/launch/gtm-harness-v2`): the Telegram card, the WhatsApp compose and the `check` terminal are the visual language for cards.
- **Avoid** (gstack's AI-slop blacklist):
  - purple gradients;
  - three-column icon grids;
  - icons in coloured circles;
  - centred everything;
  - uniform bubbly radius;
  - coloured left-border cards;
  - stacked generic SaaS cards as the whole app;
  - system-ui as the main font.

## 4. Flows to design, end to end

For each flow, design every screen and every state: loading, empty, error, success, partial.

**F1. Front door and sign-up** (`/beta`)
- The visitor reads what it is in 5 seconds, then signs up with a name, an optional email and an invite code (shown only when the gate is on).
- States:
  - gate open;
  - gate on with a wrong code;
  - already signed in, which redirects;
  - a sign-in link from Telegram that expired.

**F2. Onboarding** (`/beta/new`)
- Product, pitch, URL, audience, stage, goal, channels, regions, onchain.
- Then a 30–90 second wait while the plan is written. Design the wait as progress the founder can read ("scorecard… sources… three first drafts… checks"), not a spinner.
- States:
  - model unavailable, so templates wrote the plan: a calm note, not an error;
  - validation errors inline.

**F3. The Desk** (`/beta/desk`): the daily loop
- **Information hierarchy:**
  - **First:** what's waiting for me.
  - **Second:** "Ask the desk" (one line: "a post about Friday's demo").
  - **Third:** connections and the plan.
- **Queue tabs:** Waiting, Held, Approved (links to tap), Done, Failed.
- **The card**, the core artifact. Design all seven statuses:
  - held: checks found errors, each with its fix;
  - draft;
  - pending: asked in Telegram too;
  - approved: shows the link button and "I sent it";
  - done: shows the receipt;
  - failed: shows the error and Retry;
  - rejected.
- **Card parts:**
  - channel and destination;
  - author: plan, agent, Telegram or you;
  - the reviewer's verdict chip;
  - the text, editable;
  - the findings;
  - the X cost note ("about $0.015; $0.20 with a link");
  - the actions.
- **Editing** an approved card visibly voids the approval.
- **Composer:** write a draft by hand (channel, to, subject, text).
- **Empty states:**
  - no drafts yet;
  - nothing waiting ("All clear. Ask the desk for today's post.");
  - daily cap reached ("15 approvals today. The rest wait until tomorrow.").

**F4. Telegram remote control**: design the bot's messages as artifacts
- **Linking:** the Desk's "Connect Telegram" opens `t.me/<bot>?start=…`, and the bot confirms.
- **The approval card** (Telegram message plus inline buttons):
  - channel, destination, reviewer, the text;
  - what Approve does;
  - the workspace name and id.
- **After a tap:** the buttons become "Open in WhatsApp" (for a person) or "Posted: open it" (for an own channel), or an error with "Retry from the Desk".
- **Draft by chat:** the founder types a request; the bot answers "Drafting…", then the card, or "held by checks" with the fixes.
- **Messages:** `/queue` and `/digest` (today in one message), `/login` (a sign-in button), help.
- **Groups and channels:** the founder adds the bot as an admin, and the bot confirms "approved posts can go there".

**F5. Connect tools** (a panel on the Desk)
- **Telegram:** linked as @username; the groups and channels where the bot is an admin; how to add one.
- **Slack:** paste an incoming webhook URL and a label; a test message lands; disconnect.
- **X:** Connect (OAuth), then @username, the per-post cost note, disconnect, and an expired-connection state.
- **Agents:**
  - "Create token" shows the token once, with a copyable `claude mcp add --transport http shonin <url> --header "Authorization: Bearer …"`.
  - It explains that subagents share the workspace and nothing can send or approve.
  - "Rotate" kills the old token.
- **Coming soon** (greyed, honest):
  - Google Drive export;
  - model choice;
  - Cencori;
  - `buy` for agent purchases, prepare-only.

**F6. Receipts and activity**
- **Receipt:** what ran, where, when, the post link, the approval (who, via web or Telegram, when), the text hash shortened (`sha256:3f9a…e2b7`), "signed".
- **Activity:** a timeline of the last 30 events (drafted, held, asked, approved, posted, failed, connected), each coloured by its actor's split colour.

## 5. Artifacts to deliver

1. Screen designs for F1–F6 at 390×844 and 1440×900, dark and light.
2. The card component in all seven statuses, plus the editing state.
3. The Telegram card and bot messages as mockups (a phone frame, Telegram's dark theme).
4. The receipt component.
5. The connections panel with every connector in each state.
6. A one-page user-flow diagram: sign-up, plan, Desk, approve (web or Telegram), then run or link, then receipt.
7. A short DESIGN.md: the components, their states, spacing and type scale, mapped to the existing tokens.

## 6. Acceptance

- **Approve does what it says.** A founder can tell what Approve will do on every card without reading help text.
- **Phone first.** Every action works one-handed at 390 px wide, with touch targets of 44 px or more.
- **Readable.** Body text is 16 px or more, contrast is 4.5:1 or more, and every input has a label.
- **States are covered.** No state in §4 is left undesigned.
- **Colour has meaning.** No colour appears without one of the four meanings, or `--live`.
