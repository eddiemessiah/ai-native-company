# Explainer Shorts: human prices, tool prices, platform rules, licences and voices

*Compiled 2026-09-27 for Nova's Explainer Shorts line (Edidiong Umana). Sources dated 2023–2026, with the most weight on 2025–2026.*

**Method.** The egress proxy blocked most hosts again:
- **Blocked when tried:**
  - reviews and news: wavect.io, hollywoodreporter.com, dev.to, a medium.com author subdomain, tubefilter.com, dig.watch;
  - stock libraries: pexels.com, pixabay.com, coverr.co;
  - platform and vendor docs: blog.youtube, learn.microsoft.com.

  The search tool refused bbc.co.uk and bbc.com. I didn't retry the hosts the Video Desk brief found blocked today: support.google.com, openai.com, developers.openai.com, fiverr.com, upwork.com, opus.pro, capcut.com, en.wikipedia.org.
- **Loaded:** github.com pages through WebFetch, and raw.githubusercontent.com through curl. I read these first-hand:
  - the MoneyPrinterTurbo clone (commit 8e259e9, 2026-09-27) and its GitHub page, releases, tags, commit history and issue #680;
  - edge-tts: README, LICENSE, `constants.py`, `drm.py` and discussion #261;
  - Kokoro's README and LICENSE; Piper's old and new READMEs, licences and voice list;
  - the ElevenLabs Python SDK reference and response types;
  - Microsoft's Azure voice table (`MicrosoftDocs/azure-ai-docs`, `tts.md`, dated 2026-07-17);
  - the YouTube Data API v3 discovery document (revision 20260923);
  - LiteLLM's price table (main branch, fetched 2026-09-27);
  - a copy of Pexels' API documentation kept in a third-party repo ([developer-ishan/mcp-pexels](https://github.com/developer-ishan/mcp-pexels/blob/main/docs/official/pexels-api-docs.md)).

Everything else comes from search-engine summaries. Where I could, I restricted the search to the vendor's own domain (marked "official domain"). It is still unverified.

Tags:
- **[PAGE]**: read first-hand.
- **[SEARCH]**: seen only in a search summary. Treat as unverified.
- **"Our arithmetic"**: a number I derived from sourced numbers.
- **"Assumption"**: a number I chose. Measure it on real jobs before relying on it.

Naira conversions use the CBN rate of **₦1,329.5 per US$1 on 2026-09-25** ([Naija News](https://www.naijanews.com/2026/09/26/dollar-to-naira-exchange-rate-today-september-26th-2026/)) [SEARCH], the rate `research/video-editing.md` uses. The house planning rate is ₦1,500 (`research/africa-ai.md`). Conflicts and weak sources are listed in **Unverified notes** at the end.

---

## 0. TL;DR

1. **MoneyPrinterTurbo had 126.2k GitHub stars on 2026-09-27, so the "125k+" tweet holds** [PAGE]. It is MIT-licensed. The first commit is dated 2024-03-11, the first release (v1.1.0) 2024-04-11 and the latest (v1.3.7) 2026-09-13 [PAGE]. It turns a topic into a script, stock footage, a TTS voice, captions and music in one pass. It lacks what Nova sells (§1):
   - it writes from the topic alone, with no source;
   - it deletes anything in brackets or parentheses, so citations vanish;
   - it shuffles 5-second stock clips at random;
   - it ships music its README says came "from YouTube videos";
   - it can post automatically.
2. **A human makes a scripted 30–60 s explainer short for $130–$550 as a freelance assembly, $200–$400 by Fiverr's own guide, or $1,000–$3,000 at an agency** [SEARCH, our arithmetic]. The Fiverr floor is $10–$40 for "faceless" stock montages, often AI-voiced. In Nigeria, a social-media animation costs ₦50,000–₦150,000 and a filmed 30–60 s promo ₦150,000–₦350,000 [SEARCH].
3. **Suggested price: $75 a short, or $720 for a pack of 12 a month. For Nigerian clients, ₦35,000 a short, or ₦360,000 for 12 a month** (our arithmetic, §2d).
   - Our rule is to price a unit at 25–50% of the human alternative (`research/africa-ai.md`).
   - That band is $75–$150 against Fiverr's $300 midpoint and $85–$170 against the $340 freelance midpoint. $75 sits at the bottom because doing it yourself in software costs under $6 (next bullet).
   - ₦35,000 ($26 at the CBN rate) is 35% of ₦100,000, the middle of the Nigerian social-animation band.
4. **Doing it yourself costs $0.15–$5.80 in software credits per 60-second short**, from Pictory to Agent Opus [SEARCH, our arithmetic]. The buyer still writes and checks the script, confirms each fact and approves.
5. **Platform rules** [SEARCH]:
   - YouTube doesn't monetize "mass-produced or repetitive content". Since July 2026 that includes AI personas presented as experts on health, money, law or politics.
   - YouTube, TikTok and Meta all require an AI label on realistic synthetic video or audio. TikTok says its label doesn't reduce distribution.
   - So: turn the label on every time, and never let an AI narrator pose as an expert (§4).
6. **Voice: default to Azure Speech's Nigerian English voices, `en-NG-EzinneNeural` and `en-NG-AbeoNeural`** [PAGE]. They cost about $15 per 1M characters, roughly $0.014 a short [PAGE, our arithmetic].
   - ElevenLabs paid plans ($6–$990 a month) include a commercial licence [SEARCH], and its API returns per-character timestamps [PAGE].
   - Kokoro (Apache-2.0) is the offline fallback [PAGE].
   - Never use edge-tts: it imitates Edge's read-aloud client, and its maintainer says it "is meant for personal use" [PAGE].
7. **Stock footage: Pexels, Pixabay and Coverr allow commercial use with no attribution.** All three forbid reselling clips as they are, and all three restrict logos and brands. Pexels and Pixabay also forbid showing identifiable people as ill or implying they endorse a product; Pexels adds criminal activity [SEARCH]. API limits:
   - Pexels: 200 calls an hour and 20,000 a month [PAGE, mirror];
   - Pixabay: 100 calls a minute, with a 24-hour cache [SEARCH];
   - Coverr: the free API is demo-only, at 50 calls an hour [SEARCH].
8. **Music: TikTok's commercial library and Meta's business sound collection stop at their own platforms, and Meta forbids commercial use of music without a licence** [SEARCH]. Labels sue brands for up to $150,000 per work: Warner sued Crumbl over 159 works in 2025 [SEARCH]. Use Pixabay Music or a paid library licensed for every platform, and keep the licence certificate (§7).

---

## 1. MoneyPrinterTurbo

### 1a. Facts

| Item | Finding | Source | Tag |
|---|---|---|---|
| GitHub stars | **126.2k** on 2026-09-27, with 19.7k forks, 780 watching and 928 commits. The tweet's "125k+" holds | [Repo page](https://github.com/harry0703/MoneyPrinterTurbo) | [PAGE] |
| Licence | **MIT**, "Copyright (c) 2024 Harry" | [LICENSE](https://github.com/harry0703/MoneyPrinterTurbo/blob/main/LICENSE) | [PAGE] |
| First commit | **2024-03-11**, "Initial commit" (d4f7b53) | [Commit history](https://github.com/harry0703/MoneyPrinterTurbo/commits/main/) | [PAGE] |
| First release | **v1.1.0, "Portable version", 2024-04-11**. No older tag exists | [Releases, page 2](https://github.com/harry0703/MoneyPrinterTurbo/releases?page=2); [tags](https://github.com/harry0703/MoneyPrinterTurbo/tags?after=v1.2.8) | [PAGE] |
| Latest release | **v1.3.7, 2026-09-13**. Ten releases came out between 2026-05-28 and 2026-09-13 | [Releases](https://github.com/harry0703/MoneyPrinterTurbo/releases) | [PAGE] |
| What it does | "Provide a video **topic** or **keyword**, and MoneyPrinterTurbo will generate the script, match footage, create subtitles and background music, and produce an HD short video." It outputs 9:16 (1080×1920), 16:9 or 1:1, driven from a web UI, an API, a CLI or an agent Skill. It can also publish to TikTok, Instagram and YouTube Shorts | `README-en.md` | [PAGE] |
| Sample lengths | The README's 16 gallery videos run 14–59 s | `README-en.md` | [PAGE] |
| Stack | Python 3.11+, MoviePy 2.2.1, edge-tts 7.2.7, faster-whisper 1.1.0, LiteLLM 1.86.2, FastAPI, Streamlit | `pyproject.toml` | [PAGE] |
| Funding | The README thanks 11 sponsors, most of them AI model or API platforms. The default LLM provider is Moonshot (Kimi), the first sponsor named | `README-en.md`; `config.example.toml` | [PAGE] |

### 1b. The pipeline, read from the code

All [PAGE], from `app/services/` in the local clone.

| Step | Where | What the code does | What it means for Nova |
|---|---|---|---|
| 1. Script | `llm.py`, `generate_script` | Prompts an LLM with the topic, a paragraph count (default 1) and optional extra instructions. There is no source-document input. The cleaner then deletes `*`, `#` and everything inside `[...]` and `(...)` | The script rests on the model's memory. An inline citation such as "(WHO, 2025)" would be deleted |
| 2. Search terms | `llm.py`, `generate_terms` | Asks for 5 English stock-footage terms of 1–3 words. With `match_materials_to_script` on (off by default), it asks for 8 terms in script order | Footage is picked by keyword, not by what each sentence says |
| 3. Voice | `voice.py` | Defaults to Edge TTS, labelled "Azure TTS V1" in the web UI and "free to use without an API key". 10 other providers: Azure Speech, SiliconFlow, Gemini, Xiaomi MiMo, MiniMax, ElevenLabs, Chatterbox, Kokoro, Fish Audio and ModelBest VoxCPM | Edge and Azure return word boundaries. For voices without timings (ElevenLabs, Kokoro and others), it spreads the text over the audio by character count |
| 4. Captions | `task.py` `generate_subtitle`; `subtitle.py` | "edge" mode, the default, times captions from the TTS boundaries. "whisper" mode transcribes with faster-whisper `large-v3` at int8 with word timestamps, then matches lines back to the script | If edge timing fails, the video renders **without captions**, and the code only logs a warning |
| 5. Footage | `material.py` | For each term it searches Pexels (the default), Pixabay or Coverr, and keeps only clips in the output's orientation. Pexels clips must match the output size exactly; Pixabay clips must be at least as wide. By default it shuffles the clips at random and uses 5-second pieces. Searches are cached for 24 hours. It records the provider, asset ID, source page and creator of every clip. It can also buy AI-generated clips (Seedance, MiniMax, WaveSpeed, OFox, MuAPI) | The per-clip record is the start of a licence ledger. The random order is why footage drifts from the script |
| 6. Music | `video.py`, `bgm.py` | Picks one of 29 bundled MP3s (56 MB) at random, at volume 0.2 with a 3-second fade-out, or generates music (Sonilo, ElevenLabs) | The README says: "The current project includes some default music from YouTube videos. If there are copyright issues, please delete them." |
| 7. Render | `video.py`, `generate_video` | MoviePy and FFmpeg: libx264, AAC at 192k, 30 fps. The default caption font is `STHeitiMedium.ttc`; `resource/fonts` also holds Microsoft YaHei, and the repo carries no licence for either | Use fonts whose licence we hold |
| 8. Post | `task.py` `_run_cross_post`; `upload_post.py` | Optional cross-posting to TikTok, Instagram and YouTube through Upload-Post, off by default (`upload_post_enabled = false`). An LLM writes the title, caption and hashtags. YouTube uploads send `containsSyntheticMedia = true`; nothing sets an AI label for TikTok or Instagram | Nova never posts. Copy the YouTube flag into our delivery packet |

### 1c. What reviewers and users criticise

| Complaint | Evidence | Source | Tag |
|---|---|---|---|
| AI slop at scale | A Kapwing study (December 2025) found that 104 of the first 500 videos YouTube recommended to new accounts (21%) were fully AI-generated, and a further 33% were "brainrot" | [MediaNama, 2025-12](https://www.medianama.com/2025/12/223-ai-slop-videos-youtube-algorithmic-recommendations/); [Irish Examiner](https://www.irishexaminer.com/news/arid-41766416.html) | [SEARCH] |
| Made-up facts | BBC World Service journalists found more than 50 channels in 20+ languages posting AI-made "bad science" labelled as educational, such as pyramids that produce electricity and climate denial. Children aged 10–12 believed it until told | [Digital Watch summary](https://dig.watch/updates/ai-generated-fake-science-videos-being-recommended-to-children-on-youtube-bbc-reports) | [SEARCH] |
| Videos look alike | "Stock footage can illustrate a topic, but it can't show your thing." Users "inherit whatever pacing the stock clips happen to have, which is why a lot of these videos feel similar to each other even when the scripts differ" | 2026 reviews of MPT ([Wavect](https://wavect.io/blog/moneyprinterturbo-review-2026/), [Riffkit](https://riffkit.ai/blog/how-to-use-moneyprinterturbo), [AI Fruit](https://aifruit.app/blog/moneyprinterturbo-alternative)); the summary didn't say which one | [SEARCH] |
| Footage off topic | MPT issue #680 (2025-05-14): the keyword "Pig Bajie" returned "foreign faces" instead of *Journey to the West* characters, and the user asked for a relevance control | [Issue #680](https://github.com/harry0703/MoneyPrinterTurbo/issues/680) | [PAGE] |
| Channels shut down | YouTube terminated 16 channels with a combined 4.7 billion views and 35 million subscribers in its AI-slop enforcement | [OutlierKit](https://outlierkit.com/resources/youtube-ai-slop-crackdown-2026/); [Tech Times, 2026-07-15](https://www.techtimes.com/articles/320629/20260715/youtube-wiped-35m-subscribers-over-ai-slop-now-its-judging-your-taste.htm) | [SEARCH] |

### 1d. What to copy and what to change

**Copy:**
- The stages that stop and hand over an artifact (`stop_at` = script, terms, audio, subtitle, materials or video), so a person can review between them.
- The per-clip source record (provider, asset ID, source page, creator).
- The 24-hour search cache, which Pixabay's API terms require (§5b).
- Word-boundary timings for captions, with Whisper alignment against the script as the fallback.
- `containsSyntheticMedia = true` on YouTube uploads.

**Change:**
- Write the script from the client's source document, and keep the citations.
- Choose footage for each sentence, in script order.
- Fail the job when captions are missing.
- Drop the bundled music and fonts.
- Replace Edge TTS (§6a).
- Never turn on auto-posting.

**For the rulebook:**
- A script is written from the client's source document, never from a topic alone.
- Code checks that every number and date in the script appears in the source; a miss blocks the short until a person resolves it. A person checks names against the client's glossary.
- Each short ships with a claim-to-source list: every sentence of the voiceover, the passage it rests on, and the page or URL.
- Code fails a render whose captions are missing or don't run from the first word of the voiceover to the last.
- Footage is chosen for each sentence, in script order, never shuffled.

---

## 2. Human alternative prices

### 2a. One short, international (USD)

| Seller or source | Price per short | What it covers | Date | Tag |
|---|---|---|---|---|
| Fiverr "faceless" and "cash cow" gigs | Starting at:<br>• $10: [fast_genius](https://www.fiverr.com/fast_genius/create-automated-cash-cow-videos-cash-cow-youtube-cash-cow-channel-cash-cow)<br>• $15: [robertmarzan](https://www.fiverr.com/robertmarzan/create-youtube-automation-channel-and-faceless-cash-cow-videos-video-editing), [tt_videoedits](https://www.fiverr.com/tt_videoedits/make-voiceover-videos-based-on-your-theme-using-stock-videos)<br>• $20: [ameercreative](https://www.fiverr.com/ameercreative/provide-youtube-shorts-or-edit-short-videos-of-any-niche), [mindstalker85](https://www.fiverr.com/mindstalker85/create-a-short-video-with-stock-footage)<br>• $30: [youtube_studio](https://www.fiverr.com/youtube_studio/edit-top-10-youtube-videos-with-copyright-free-stock)<br>• $40: [anasnoors](https://www.fiverr.com/anasnoors/create-faceless-youtube-videos) | Stock footage with a voiceover, often AI. "Starting at" is the cheapest package | Live listings, seen 2026-09-27 | [SEARCH] |
| Fiverr explainer gigs | $35 from [aimal_26](https://www.fiverr.com/aimal_26/produce-an-engaging-explainer-or-commercial-video): script, voiceover and licensed assets, with 1080×1920 on offer. 2D animated explainers start at $10 ([uby_studio](https://www.fiverr.com/uby_studio/create-an-engaging-whiteboard-animation-or-2d-explainer-video)) to $2,150 ([syntaxcenter](https://www.fiverr.com/syntaxcenter/create-an-exceptional-2d-animated-explainer-marketing-video)) | "Starting at" prices | Live listings | [SEARCH] |
| Fiverr's 2D animation cost guide ([link](https://www.fiverr.com/resources/guides/costs/2d-animation)) | **$200–$400** for a 60-second explainer | Animated | Undated | [SEARCH] |
| Freelance assembly, from three Biztoolkit 2026 guides | • Script: **$30–$150** for a 60-second Shorts or TikTok script ([link](https://www.biztoolkit.co/post/freelance-scriptwriter-rates-in-2026-youtube-ads-podcasts))<br>• Voiceover: **$50–$100** per short project from non-union beginners, $150–$300 mid-level ([link](https://www.biztoolkit.co/post/voiceover-artist-rates-in-2026-per-word-per-minute-per-project))<br>• Edit: **$50–$300** per short from freelancers who use AI ([link](https://www.biztoolkit.co/post/freelance-video-editor-rates-in-2025-per-hour-project-real-examples)) | Sum: **$130–$550**, midpoint $340 (our arithmetic) | 2026 | [SEARCH] |
| Upwork, explainer-video freelancers ([link](https://www.upwork.com/hire/explainer-video-freelancers/)) | $17–$32 an hour | Hourly | Page dated Sep 2026 | [SEARCH] |
| Cueball Creatives ([link](https://www.cueballcreatives.com/blog/motion-graphics-design-services-pricing-2026)) | **$1,000–$2,500** for a simple 10–30 s animated social video from an agency | Agency | 2026 | [SEARCH] |
| D-MAK Productions ([link](https://dmakproductions.com/blog/social-media-video-pricing/)) | **$1,000–$3,000** per professional short-form clip; $500–$3,000+ for a one-off social video | Agency | 2026 | [SEARCH] |
| Squideo survey ([link](https://www.squideo.com/how-much-does-an-explainer-video-cost-in-2026)) | **£2,960** on average for a 30-second animated explainer. 45 agencies in the UK, US, Europe and Canada quoted a real brief; the survey took each one's lowest legitimate entry price | Agency | 2026 | [SEARCH] |

**Read.** There are three tiers:
- **$10–$40:** stock montages, often AI-voiced, with no sourcing: the format YouTube is demonetizing (§4a). We don't compete here.
- **$130–$550:** a freelancer, or a small team, who scripts, voices and edits.
- **$1,000–$3,000:** agencies, often animated.

### 2b. Monthly packages and done-for-you services

| Seller or source | Price | What it covers | Date | Tag |
|---|---|---|---|---|
| White Glove Content ([link](https://www.whiteglovecontent.com/faceless-tiktok-service)) | Starter $54 a month (long-form plus shorts); Growth $124; Pro $284. Video counts weren't in the summary | Done-for-you faceless shorts: hook-first scripts, "a channel-unique AI voice", edits | 2026 | [SEARCH] |
| D-MAK Productions ([link](https://dmakproductions.com/blog/social-media-video-pricing/)) | Monthly content packages **$2,000–$15,000** | Agency | 2026 | [SEARCH] |
| 12 shorts from a freelance assembly | **$1,560–$6,600** a month: 12 × $130–$550 (our arithmetic) | | | |

### 2c. Nigeria (naira)

| Source | Rate | Date | Tag |
|---|---|---|---|
| Profolio, motion graphics designer guide ([link](https://www.profolio.ng/motion-graphics-designer/salary-guide)) | A social-media post or logo animation: **₦50,000–₦150,000**. A full corporate explainer: **₦200,000–₦500,000**. Broadcast animation: over ₦800,000 | 2026 | [SEARCH] |
| Profolio, video editor guide ([link](https://www.profolio.ng/video-editor/salary-guide)) | Freelance Reels or TikTok edits: **₦15,000–₦80,000** per video, editing only | 2026 | [SEARCH], via `research/video-editing.md` |
| Webiliti ([link](https://www.webiliti.com.ng/animated-videos/cost-of-animated-explainer-videos/)) | Whiteboard or text-based animation **₦50,000–₦150,000**; custom 2D ₦150,000–₦400,000; 3D or high-end motion graphics ₦400,000–₦1,000,000+ | Undated | [SEARCH] |
| Arraya Studios ([link](https://arrayastudios.com/corporate-video-production-cost/)) | A short social-media promo or 30–60 s corporate clip: **₦150,000–₦350,000** | 2026 | [SEARCH] |

**Read.** No Nigerian source prices a scripted, voiced explainer short as such. The closest is a social animation at ₦50,000–₦150,000 (Profolio, Webiliti). Filmed promos cost more (₦150,000–₦350,000, Arraya), and editing alone costs less (₦15,000–₦80,000).

### 2d. The unit and a suggested price

**Unit (proposed).** One short: 30–60 s, 9:16 at 1080×1920, from one topic and one source document the client owns or may use. It includes:
- a script with a claim-to-source list;
- an AI voiceover, with Nigerian English available;
- burned-in captions and on-screen headlines;
- brand visuals or licensed stock footage;
- a licensed music bed;
- post copy with the AI disclosure;
- one revision round.

The client approves and posts. At 60 s or less, one file fits every platform, the tightest being X's 140 s without Premium (`research/video-editing.md` §3).

**The human cost of that unit, and our band** (our arithmetic):

| Anchor | Human cost per short | 25–50% of it |
|---|---|---|
| Freelance assembly, low | $130 | $33–$65 |
| Freelance assembly, midpoint | $340 | $85–$170 |
| Fiverr guide, 60-s explainer | $200–$400 (midpoint $300) | $75–$150 at the midpoint |
| Agency | $1,000–$3,000 | $250–$1,500 |
| Nigeria, social animation | ₦50,000–₦150,000 (midpoint ₦100,000) | ₦25,000–₦50,000 at the midpoint |
| Nigeria, filmed 30–60 s promo | ₦150,000–₦350,000 | ₦37,500–₦175,000 |

**Suggested price for international clients: $75 per short, or $720 for a pack of 12 a month ($60 each).**
- $75 is 25% of Fiverr's $300 midpoint and 22% of the $340 freelance midpoint. It sits under every human price above except Fiverr's cheapest "starting at" gigs.
- It sits at the bottom of the band because the buyer's software alternative costs $0.15–$5.80 a short (§3). What the buyer pays us for is the sourcing, the checking and the finish.
- $720 for 12 is 46% of the $1,560 low freelance month and 36% of D-MAK's $2,000 package floor.
- $75 converts to ₦99,700 at the CBN rate. That is why the naira price is set separately, as the catalog already does for the Video Desk.

**Suggested price for Nigerian clients: ₦35,000 per short, or ₦360,000 for a pack of 12 a month (₦30,000 each).**
- ₦35,000 is 35% of the ₦100,000 social-animation midpoint. ₦30,000 is 30%.
- In dollars: $26 and $271 at the CBN rate, or $23 and $240 at the house rate.
- For comparison, the Video Desk charges ₦100,000 for a recording of up to 60 minutes (`packages/catalog/src/offers.ts`).

**Cost floor per short:**
- Voice: about $0.014 with Azure standard neural. That assumes 900 characters for 60 s, about 150 words (an assumption). Azure's free tier of 0.5M characters a month covers about 555 shorts. ElevenLabs Creator costs about $0.16 a short (§6b, our arithmetic).
- Footage: $0 on Pexels or Pixabay. Music: $0 on Pixabay Music (§7).
- Review is the main cost. A mid-level Lagos editor costs ₦850–₦1,700 an hour (`research/video-editing.md`), so 30 minutes of fact-checking and review is ₦425–₦850 a short. The 30 minutes is an assumption: measure it on the first 10 shorts before fixing the price in `packages/catalog/src/offers.ts`.

---

## 3. Self-serve tool prices (the do-it-yourself alternative)

All [SEARCH]. Vendor pages were blocked, so each row cites the official-domain search result, plus a third-party 2026 guide where the official summary was thin. The last column is our arithmetic for one 60-second short, at monthly prices.

| Tool | Plan and price | Minutes or credits | Per 60-s short | Source |
|---|---|---|---|---|
| **Pictory** | Starter $29 a month ($25 billed yearly); Professional $59 ($35 yearly); Teams $199 ($119 yearly) | 200, 600 and 1,800 video minutes a month. Starter includes 60 minutes of ElevenLabs voices | $0.15 on Starter | [Pictory help: video-minute pricing](https://kb.pictory.ai/en/articles/9613606-understanding-the-new-video-minute-pricing-structure), official domain; [pricing](https://pictory.ai/pricing/) |
| **InVideo AI** | Plus $20 a month, Max $100, Generative $200, Elite $1,000; about 15% less billed yearly | Metered in credits. A third-party guide gives 750, 3,900, 8,000 and 42,500 credits a month, and 2 credits a minute for stock-only video. The official-domain summary gives Max 5,000 | Not computed: the credit counts conflict | [InVideo help](https://help.invideo.io/en/articles/11528140-invideo-plans-and-credits-everything-you-need-to-know), official domain; [Creatify 2026](https://creatify.ai/blog/invideo-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay) |
| **Synthesia** (avatars) | Starter $29 a month or $264 a year; Creator $89 a month or $708 a year | 10 and 30 video minutes a month | $2.90 on Starter | [synthesia.io/pricing](https://www.synthesia.io/pricing), official domain |
| **HeyGen** (avatars) | Creator $29 a month; Pro $49; Business $149 plus $20 a seat | 600, 1,000 and 1,500 credits a month. Avatar IV uses 20 credits a minute; Avatar III uses 3 | $0.97 with Avatar IV, $0.15 with Avatar III, on Creator | [HeyGen help](https://help.heygen.com/en/articles/15125761-heygen-credit-based-pricing-plans-explained), official domain; [Arcade 2026](https://www.arcade.software/post/heygen-pricing) |
| **Fliki** | Standard $28 a month; Premium $88; 25% off billed yearly | 180 and 600 credits a month. Fliki says 180 credits make 60–90 minutes of video. Commercial rights hold "provided your text content is original" | $0.31–$0.47 on Standard | [fliki.ai/pricing](https://fliki.ai/pricing); [Fliki FAQ](https://fliki.ai/frequently-asked-questions), official domain |
| **Revid.ai** | Growth $39 a month; Elite $89; Ultra $199; about 17% less billed yearly | 2,000, 5,000 and 12,000 credits a month. A 30-second video with "Pro moving images" costs about 40–80 credits | $1.56–$3.12 on Growth | [revid.ai/pricing](https://www.revid.ai/pricing), official domain |
| **Agent Opus**, OpusClip's text-to-video. It makes "complete videos from prompts, scripts, or blog URLs" | Free: 60 credits a month, "equal to 2 videos of 30 seconds". Pro: $29 a month or $348 a year | Pro: 3,600 credits a year, "equal to 120 videos (30 seconds each)" | $5.80 | [opus.pro/agent/pricing](https://www.opus.pro/agent/pricing); [Agent Opus](https://www.opus.pro/agent), official domain |
| **CapCut**, script-to-video | The web tool is marketed as free. CapCut Pro costs $19.99 a month or $179.99 a year | About 200 AI credits a month on Pro (third party, June 2026) | Not metered by the minute | [CapCut tool page](https://www.capcut.com/tools/script-to-video-maker), official domain; [eesel 2026](https://www.eesel.ai/blog/capcut-pricing) |
| **ShortsFaceless**, faceless-shorts software | $19 a month for 30 videos; $29 for 60 | Script, AI voices, captions | $0.48–$0.63 | [AI Tools Police](https://aitoolspolice.com/reviews/shortsfaceless/) |

**Read.** In software, one short costs $0.15–$5.80. The tools make the video, but the buyer still writes or checks the script, confirms each fact, picks shots that fit and signs off. That work is what Nova sells, and the software is our cost of goods.

---

## 4. Platform policies that constrain automated shorts

All [SEARCH] unless marked. Help centres were blocked, so the quotes come from search summaries of the policy pages or from press that quotes them.

### 4a. YouTube: "inauthentic content" (monetization)

- **The July 2025 change.** On 2025-07-15, YouTube renamed its "repetitious content" policy "inauthentic content". Rene Ritchie called it "a minor update to YouTube's long-standing YPP policies to help better identify when content is mass-produced or repetitive" ([Search Engine Journal](https://www.searchenginejournal.com/youtube-targets-mass-produced-content-in-monetization-update/550337/); [Social Media Today](https://www.socialmediatoday.com/news/youtube-clarifies-monetization-update-inauthentic-repeated-content/752892/)).
- **The operative sentence** ([YouTube channel monetization policies](https://support.google.com/youtube/answer/1311392?hl=en)): "Inauthentic content refers to mass-produced or repetitive content, including content that looks like it's made with a template with little to no variation across videos, or content that's easily replicable at scale."
- **The AI example on the same page**, quoted by [Tubefilter, 2026-07-13](https://www.tubefilter.com/2026/07/13/youtube-inauthentic-content-monetization-policy-update/): "AI-generated content made with generic or unoriginal templates giving the impression of mass production without adding the creator's original, authentic insights or perspective."
- **Reused content**, a separate and unchanged policy, also isn't monetized. It covers "Content that exclusively features readings of other materials you did not originally create, like text from websites or news feeds", and image slideshows or scrolling text "with minimal or no narrative, commentary, or educational value" ([YouTube Help 1311392](https://support.google.com/youtube/answer/1311392?hl=en); [Engadget](https://www.engadget.com/entertainment/youtube/never-fear-reaction-videos-are-still-allowed-under-youtubes-new-inauthentic-content-policy-222401009.html)).
- **The July 2026 clarification** rolled out on 2026-07-16 ([TechCrunch, 2026-07-20](https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/); [Tubefilter](https://www.tubefilter.com/2026/07/13/youtube-inauthentic-content-monetization-policy-update/)). It names three kinds of inauthentic content. TechCrunch reports that a channel with "too much of any of these three types of content will not be able to monetize":
  1. generic or template-based videos with little original input;
  2. "unsatisfying or off-putting" content: "content that relies heavily on emotionally manipulative formulas, mimics existing formats or stories to a degree that the videos feel interchangeable, or appears designed to shock or surprise viewers for the sole purpose of getting views";
  3. AI personas: "content that presents itself as a human expert providing advice to viewers on topics such as health, legal issues, finances, or politics". The examples are an AI "doctor" giving diagnoses, AI podcast hosts giving investment tips, and AI personas interpreting laws ([YouTube Help 1311392](https://support.google.com/youtube/answer/1311392?hl=en)).

**Read.** These are monetization rules for the client's channel, but they show what YouTube treats as spam. The explainer format is safe when each short adds something specific from the client's own material and doesn't look like its neighbours.

### 4b. YouTube: altered or synthetic content

- **The rule** ([YouTube Help 14328491](https://support.google.com/youtube/answer/14328491?hl=en), now titled "Disclosing use of GenAI content"; [YouTube Blog, 2024-03-18](https://blog.youtube/news-and-events/disclosing-ai-generated-content/)): creators must disclose "when realistic content – content a viewer could easily mistake for a real person, place, scene, or event – is made with altered or synthetic media, including generative AI."
- **Needs disclosure:**
  - "Using the likeness of a realistic person", which includes "synthetically generating a person's voice to narrate a video";
  - altering footage of real events or places;
  - generating realistic scenes.
- **Doesn't need disclosure:** "production assistance, like using generative AI tools to create or improve a video outline, script, thumbnail, title, or infographic", and clearly unrealistic or animated content. A secondary source adds that "cloning one's own voice to create voice overs or dubs" is exempt ([Jellypod](https://www.jellypod.com/blog/youtube-ai-voice-disclosure-policy)).
- **Penalty:** "Creators who consistently choose not to disclose this information may be subject to content removal, suspension from the YouTube Partner Program, or other penalties."
- **Automatic labels, May 2026.** YouTube now labels a video itself when it detects "significant photorealistic AI" or when C2PA metadata shows the video was fully AI-generated. On Shorts, the label overlays the video ([TechCrunch, 2026-05-27](https://techcrunch.com/2026/05/27/youtube-will-now-automatically-label-ai-videos/)).
- **In the API:** `status.containsSyntheticMedia`, "Indicates if the video contains altered or synthetic media." ([YouTube Data API v3 discovery document](https://github.com/googleapis/google-api-go-client/blob/main/youtube/v3/youtube-api.json), revision 20260923) [PAGE]. MPT sets it on every YouTube upload [PAGE].

**Read.** A generic TTS narrator over real stock footage is a grey zone: it isn't a real person's likeness, but a listener could take it for one. TikTok and Meta name synthetic speech and "realistic-sounding audio" outright (§4c, §4d). Labelling costs an overlay on the Short; not labelling risks penalties.

### 4c. TikTok: AI-generated content labels

- **The requirement** ([TikTok Support](https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content); [newsroom](https://newsroom.tiktok.com/en-us/new-labels-for-disclosing-ai-generated-content)): TikTok "requires creators to label all AI-generated content that contains realistic images, audio, and video." Content counts as significantly edited when its subjects are shown "saying something they didn't say (such as AI-generated speech)".
- **How to label** ([Community Guidelines, Integrity and Authenticity](https://www.tiktok.com/safety/en/policies-and-engagement/integrity-authenticity)): with the AI-generated content label, or with "a clear caption, watermark, or sticker" of your own.
- **Distribution:** "Turning on the AI-generated content setting won't affect the distribution of your video as long as it doesn't violate TikTok's Community Guidelines" ([TikTok Support](https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content)).
- **Automatic labels:** TikTok may apply the "AI-generated" label itself, for example when the upload carries C2PA Content Credentials ([TechCrunch, 2024-05-09](https://techcrunch.com/2024/05/09/tiktok-automatically-label-ai-generated-content-created-other-platforms/)). Unlabelled AI content may be removed, restricted or labelled.
- **The 2025 guidelines** were published on 2025-08-14 and took effect on 2025-09-13. TikTok doesn't allow AI-generated content "that misleads about matters of public importance or that harms individuals" ([TechCrunch, 2025-08-15](https://techcrunch.com/2025/08/15/tiktoks-new-guidelines-add-subtle-changes-for-live-creators-ai-content-and-more/); [Social Media Today](https://www.socialmediatoday.com/news/tiktok-updates-community-guidelines-misinformation-bullying/757740/)).

### 4d. Meta: "AI info" labels and unoriginal content

- **The requirement** (Nick Clegg, [Meta, 2024-02-06](https://about.fb.com/news/2024/02/labeling-ai-generated-images-on-facebook-instagram-and-threads/)): "We'll require people to use this disclosure and label tool when they post organic content with a photorealistic video or realistic-sounding audio that was digitally created or altered, and we may apply penalties if they fail to do so."
- **The label.** On 2024-07-01, "Made with AI" became "AI info" across Meta's apps. Meta applies it when it detects industry-standard AI indicators or when people disclose AI content. It adds a more prominent label when content "creates a particularly high risk of materially deceiving the public on a matter of importance" ([Meta, April 2024 post with July update](https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/); [TechCrunch, 2024-07-01](https://techcrunch.com/2024/07/01/meta-changes-its-label-from-made-with-ai-to-ai-info-to-indicate-use-of-ai-in-photos/)).
- **Unoriginal content.** On 2025-07-14, Facebook announced cuts to distribution and monetization for accounts that repost others' work without meaningful changes. It had acted against about 500,000 accounts for spammy behaviour in the first half of 2025 and removed about 10 million profiles impersonating creators ([TechCrunch, 2025-07-14](https://techcrunch.com/2025/07/14/following-youtube-meta-announces-crackdown-on-unoriginal-facebook-content/); [Search Engine Journal](https://www.searchenginejournal.com/meta-follows-youtube-in-crackdown-on-unoriginal-content/551096/)).
- **The EU code.** In July 2026, Meta said it is signing the EU AI Act Code of Practice on transparency of AI-generated content ([Meta, 2026-07](https://about.fb.com/news/2026/07/meta-is-signing-the-eu-ai-act-code-of-practice-on-transparency-of-ai-generated-content/)).

### 4e. EU AI Act, Article 50 (for clients with EU audiences)

The transparency duties apply from **2026-08-02**:
- deployers must disclose deepfakes;
- AI-generated text published to inform the public on matters of public interest must be disclosed as AI-generated, unless it has had human review or editorial control and a person or company holds editorial responsibility;
- fines reach €15 million or 3% of worldwide turnover.

Sources: [EU Commission FAQ](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act); [Greenberg Traurig, 2026-06](https://www.gtlaw.com/en/insights/2026/6/deepfakes-chatbots-ai-generated-text-european-commission-details-transparency-obligations-under-the-ai-act).

Our named approval of every script is the evidence of editorial control.

**For the rulebook:**
- Every short with a synthetic voice or AI-made realistic visuals ships with the AI label switched on:
  - YouTube's altered-or-synthetic setting (`containsSyntheticMedia: true`);
  - TikTok's AI-generated content setting;
  - Meta's AI label.

  The client posts, so the label goes on the delivery checklist, and code checks that the publish packet sets it. If a client objects to YouTube's on-video label, a person decides.
- An AI narrator or avatar is never presented as a human expert. Health, money, legal and political shorts name the human or institutional source on screen and go to a person, whatever their score.
- Every short puts at least one specific, sourced fact from the client's material on screen (a number, name or date). A short is never a verbatim reading of a document or web page.
- Shorts for one client vary hook, structure and footage. Code measures word overlap between a new script and the client's last 10; above a threshold we set from our own data, a person reviews it.
- We never post. The pipeline has no posting step to switch on.

---

## 5. Stock footage licences and APIs

### 5a. Licences

| | Pexels | Pixabay | Coverr |
|---|---|---|---|
| Commercial use | Yes: "All photos and videos on Pexels are free to use." | Yes, for commercial and non-commercial use | Yes: free "for commercial and non-commercial purposes" |
| Attribution | "Attribution is not required", though appreciated | Not required | Not required: "you do not need to ask permission from or provide credit to the videographer or Coverr.co" |
| Prohibited | • "Identifiable people may not appear in a bad light or in a way that is offensive", including "engaging in criminal activities, suffering from a medical ailment, or in a pornographic context"<br>• "Don't sell unaltered copies"<br>• "Don't imply endorsement of your product by people or brands on the imagery"<br>• No redistribution on other stock or wallpaper platforms<br>• No use as a trademark, business name or service mark | • "You cannot sell or distribute the Content ... on a Standalone basis"<br>• No commercial use of content showing trademarks, logos or brands "in relation to goods and services"<br>• No use "in a misleading or deceptive way"<br>• Nothing that "portrays someone as suffering from, or medicating for, a physical or mental ailment", and no political use<br>• No use that suggests endorsement (FAQ)<br>• Uploads showing identifiable people must carry a model release (a duty on the contributor) | • No service that competes with Coverr<br>• No AI training<br>• Trademarks, logos or brands in a clip "may require separate permission"<br>• No resale of the footage on its own |
| Source | [License](https://www.pexels.com/license/); [help](https://help.pexels.com/hc/en-us/articles/360042332714-What-are-the-rules-for-using-Pexels-photos-or-videos) [SEARCH] | [Content License](https://pixabay.com/service/license-summary/); [FAQ](https://pixabay.com/service/faq/) [SEARCH] | [License](https://coverr.co/license) [SEARCH] |

### 5b. APIs

| | Pexels | Pixabay | Coverr |
|---|---|---|---|
| Key | Free | Free | Free account, in "Demo" status |
| Default limit | **200 requests an hour and 20,000 a month.** "If you meet our API terms, you can get unlimited requests for free." [PAGE, mirror] | **100 requests per 60 seconds**, counted per key [SEARCH] | **Demo: 50 calls an hour. Production: 2,000 an hour**, which needs an active Pro or Ultimate subscription [SEARCH] |
| Conditions | "Whenever you are doing an API request make sure to show a prominent link to Pexels." "Always credit our photographers when possible." No copying Pexels' core functionality. "Abuse of the Pexels API, including but not limited to attempting to work around the rate limit, will lead to termination of your API access." [PAGE, mirror] | "Requests must be cached for 24 hours." The API is "made for real human requests"; "Systematic mass downloads are not allowed." No permanent hotlinking: download files to your own server first [SEARCH] | Show users where the videos come from [SEARCH] |
| Source | [API docs](https://www.pexels.com/api/documentation/), read in the [mcp-pexels mirror](https://github.com/developer-ishan/mcp-pexels/blob/main/docs/official/pexels-api-docs.md) | [API docs](https://pixabay.com/api/docs/) | [API docs](https://api.coverr.co/docs/start/); [developers](https://coverr.co/developers) |

**For the rulebook:**
- Every clip goes into the job's licence ledger: provider, asset ID, source page, creator, licence name and download date. MPT already records the first four.
- No identifiable person on screen in a short about health, crime, debt or another sensitive topic. Use brand graphics or footage where no one can be identified. This is a Pexels and Pixabay licence rule.
- No third-party logo or brand in a stock shot. The reviewer rejects the clip; code can't see logos.
- In production, use Pexels and Pixabay only, until we pay for a Coverr plan.
- Code enforces the limits: no more than 200 Pexels calls an hour or 100 Pixabay calls a minute, a 24-hour search cache, and no bulk downloads.
- Credit Pexels creators in the post text when there's room. Pexels asks for this; its licence doesn't require it.

---

## 6. Text-to-speech

### 6a. edge-tts: not an official API

- **What it is.** "`edge-tts` is a Python module that allows you to use Microsoft Edge's online text-to-speech service from within your Python code" ([README](https://github.com/rany2/edge-tts)) [PAGE]. It is licensed LGPLv3, except `srt_composer.py`, which is MIT [PAGE].
- **How it connects.** It imitates the browser rather than calling a published API [PAGE]:
  - it calls `speech.platform.bing.com/consumer/speech/synthesize/readaloud` with a hard-coded `TrustedClientToken`;
  - it sends Edge's user agent and the `Origin` of Edge's read-aloud extension;
  - it computes a `Sec-MS-GEC` token in a module called `drm.py` ([constants.py](https://github.com/rany2/edge-tts/blob/master/src/edge_tts/constants.py), [drm.py](https://github.com/rany2/edge-tts/blob/master/src/edge_tts/drm.py)).

  The README adds: "Microsoft prevents the use of any SSML that could not be generated by Microsoft Edge itself."
- **The maintainer on commercial use** ([discussion #261](https://github.com/rany2/edge-tts/discussions/261), 2024-10-08) [PAGE]:
  - the library "is meant for personal use";
  - it is "absolutely not reliable and could stop working at any moment and without warning ... you shouldn't have your business rely on something this risky".

  Another participant concluded: "use edge-tts for personal use and the Azure API for commercial use."
- **Microsoft.**
  - An answer on Microsoft Q&A says there is no public documentation granting commercial rights to the Edge Read Aloud voices ([Microsoft Q&A](https://learn.microsoft.com/en-au/answers/questions/5925556/commercial-use-of-edge-read-aloud-voices-via-edge)) [SEARCH].
  - Search summaries of the [Microsoft Services Agreement](https://www.microsoft.com/en-us/servicesagreement/) say it bars circumventing "restrictions on access to, usage, or availability of the Services" [SEARCH].
- **Risk.** There are three:
  - legal: the terms above;
  - operational: the endpoint already needs a reverse-engineered token and could change without notice;
  - reputational: a client's brand on a voice we had no right to use.

  The same Nigerian voices are sold legitimately on Azure (§6b).

### 6b. Hosted voices

"Per short" assumes 900 characters for 60 seconds (assumption). The per-short costs are our arithmetic.

| Service | Price | Per short | Timings for captions | Nigerian English | Licence and policy | Source |
|---|---|---|---|---|---|---|
| **Azure AI Speech, standard neural** | **$15 per 1M characters** [PAGE, LiteLLM]; a 2026 guide says $16 [SEARCH]. Free tier: 0.5M characters a month [SEARCH] | $0.014 | Word-boundary events. MPT's Azure path uses them [PAGE] | **Yes:** `en-NG-EzinneNeural` (female) and `en-NG-AbeoNeural` (male), "Standard" type, with phonemes and custom lexicons supported (no footnote 3). No Yoruba, Hausa or Igbo voices are listed [PAGE] | Paid Azure service with a normal commercial contract | [LiteLLM table](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json); [Azure voice table](https://github.com/MicrosoftDocs/azure-ai-docs/blob/main/articles/ai-services/speech-service/includes/language-support/tts.md); [TextToLab](https://texttolab.com/blog/azure-text-to-speech-pricing) |
| **Azure Neural HD** | **$22 per 1M characters from March 2026**, down from $30 [SEARCH]. LiteLLM still lists $30 | $0.02 | As above | No en-NG HD voice in the table [PAGE] | As above | [Microsoft Community Hub](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/azure-speech-%E2%80%93-neural-hd-text-to-speech-recent-voice-updates/4505380) |
| **OpenAI `gpt-4o-mini-tts`** | $0.60 per 1M text tokens in, $12 per 1M audio tokens out: **about $0.015 a minute** [PAGE, LiteLLM] | $0.015 | None: the speech endpoint returns audio only (MPT's notes on the OpenAI speech contract) [PAGE] | No Nigerian preset among its 13 voices [SEARCH] | "Our usage policies require you to provide a clear disclosure to end users that the TTS voice they are hearing is AI-generated and not a human voice" [SEARCH] | LiteLLM; [OpenAI TTS guide](https://developers.openai.com/api/docs/guides/text-to-speech) |
| **OpenAI `tts-1`, `tts-1-hd`** | **$15 and $30 per 1M characters** [PAGE, LiteLLM] | $0.014; $0.027 | None | No Nigerian preset | On 2026-07-20, OpenAI said its legacy audio models leave the API on **2027-01-20**; summaries include `tts-1`, `tts-1-hd` and `gpt-4o-mini-tts-2025-03-20` [SEARCH] | [OpenAI deprecations](https://developers.openai.com/api/docs/deprecations) |
| **ElevenLabs plans** | Free $0 (10,000 credits); **Starter $6** (30,000); **Creator $22** (121,000; $11 for the first month); **Pro $99** (600,000); **Scale $299** (1.8M, 3 seats); **Business $990** (6M, 10 seats). One character is one credit on Multilingual v2 [SEARCH] | $0.16 on Creator | **Yes:** `POST /v1/text-to-speech/{voice_id}/with-timestamps` returns `alignment` with `characters`, `character_start_times_seconds` and `character_end_times_seconds`, the SDK's "precise character-level timing information" [PAGE] | Not checked | "All paid plans include a commercial license, provided you're not using Beta Services." The Free plan has no commercial licence, and published content must credit "elevenlabs.io" or "11.ai" in the title [SEARCH] | [elevenlabs.io/pricing](https://elevenlabs.io/pricing), official domain; [help: publishing](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform); [SDK reference](https://github.com/elevenlabs/elevenlabs-python/blob/main/reference.md) |
| **ElevenLabs API, pay as you go** | **$0.10 per 1,000 characters** on multilingual models, **$0.05** on Flash and Turbo [SEARCH]. LiteLLM lists $0.18 per 1,000 for `eleven_multilingual_v2` and `eleven_v3` [PAGE] | $0.05–$0.16 | As above | | Billed in dollars, not credits [SEARCH] | [elevenlabs.io/pricing/api](https://elevenlabs.io/pricing/api), official domain; LiteLLM |

MPT's own ElevenLabs integration calls the plain endpoint, not `/with-timestamps`, and spreads the caption text evenly by character count [PAGE]. Use `/with-timestamps` instead.

### 6c. Open-weight and Nigerian options

| Model or service | Licence | Voices and languages | Quality and notes | Source | Tag |
|---|---|---|---|---|---|
| **Kokoro-82M** | **Apache-2.0**, code and weights: "With Apache-licensed weights, Kokoro can be deployed anywhere from production environments to personal projects." | Language codes for American and British English, Spanish, French, Hindi, Italian, Japanese, Brazilian Portuguese and Mandarin. No Nigerian English. Needs `espeak-ng` for out-of-dictionary words | 82 million parameters. MPT's notes say it "runs well on CPU". Through an OpenAI-compatible server it returns no word timings [PAGE]. It took first place in the TTS Spaces Arena at launch (v1.0, 2025-01-27), was trained on under 100 hours of "permissive/non-copyrighted audio", and in 2026 ranks about Elo 1062 on Artificial Analysis, 4th among open-weight models [SEARCH] | [hexgrad/kokoro](https://github.com/hexgrad/kokoro); [Artificial Analysis](https://artificialanalysis.ai/text-to-speech/leaderboard); [TextToLab](https://texttolab.com/blog/kokoro-tts-review) | [PAGE], [SEARCH] |
| **Piper** | The original [rhasspy/piper](https://github.com/rhasspy/piper) is MIT, © 2022 Michael Hansen, and says "Development has moved". The successor, [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl), is **GPL-3.0** and "embeds espeak-ng for phonemization". **Each voice has its own licence** | 44 locales, including `en_GB` and `en_US`. No Nigerian voice | "The `MODEL_CARD` file for each voice contains important licensing information. Piper is intended for personal use and text to speech research only ... Some voices may have restrictive licenses, however, so please review them carefully!" ([VOICES.md](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/VOICES.md)) | GitHub | [PAGE] |
| **YarnGPT** | YarnGPT2: Apache-2.0. YarnGPT-local: CC BY-NC-SA 4.0 | Nigerian-accented English, Yoruba, Igbo and Hausa | Built by Saheed Azeez and trained on about 2,000 hours of "Nigerian movies, podcasts and open source Nigerian audio". The rights to that training data are unclear | [GitHub](https://github.com/saheedniyi02/yarngpt); [Hugging Face](https://huggingface.co/saheedniyi/YarnGPT2) | [SEARCH] |
| **Spitch** (Lagos) | Commercial API | Yoruba, Hausa, Igbo, Nigerian-accented English and Amharic, with speech-to-text and translation | Launched in October 2024. Price not found | [TechCabal, 2025-07-17](https://techcabal.com/2025/07/17/african-ai-startups/); [docs](https://docs.spitch.app/) | [SEARCH] |

### 6d. Recommendation

1. **Default: Azure Speech standard neural, with `en-NG-EzinneNeural` or `en-NG-AbeoNeural`.**
   - Load client names into a custom lexicon, and time captions from word-boundary events.
   - About $0.014 a short. The free tier covers about 555 shorts a month (our arithmetic).
2. **Premium or signature voice: ElevenLabs on a paid plan.** Use `/with-timestamps` for caption timing. About $0.05–$0.16 a short.
3. **Offline fallback with no key: Kokoro-82M.** Use American or British voices, and time captions by aligning faster-whisper output to the script, as MPT's whisper mode does.
4. **To test: Spitch** for Yoruba, Hausa and Igbo narration, once we have a price.
5. **Don't use:**
   - edge-tts, for the reasons in §6a;
   - OpenAI `tts-1` or `tts-1-hd` in new code, since they are on the 2027-01-20 shutdown list;
   - Piper voices whose model card doesn't allow commercial use;
   - YarnGPT, until the rights to its training data are clear.

**For the rulebook:**
- No edge-tts, and no other unofficial endpoint, in client work.
- The job ledger records the voice's provider, plan and voice ID. A voice without a commercial licence never ships: that rules out ElevenLabs Free and restricted Piper voices.
- Captions come from the approved script, timed by the engine's word or character timings or by forced alignment. Code fails the render if they are missing (§1d).
- Client names, places and products go into a pronunciation lexicon, and a person listens to every name before approving the short.
- The post copy says the voice is AI. OpenAI's policy requires this whenever we use its voices; the platform labels (§4) cover the rest.

---

## 7. Background music

### 7a. Libraries and platform rules

| Source | Commercial use | Attribution | Where it may be posted | Catch | Source | Tag |
|---|---|---|---|---|---|---|
| **Pixabay Music** | Yes, including commercial video projects | Not required | The licence names no platform limit | Some contributors register tracks with Content ID, so YouTube can claim a legal use. Dispute the claim with the Pixabay License Certificate | [Pixabay blog: Content ID](https://pixabay.com/blog/posts/how-to-clear-a-youtube-content-id-claim-with-a-pix-190/); [FAQ](https://pixabay.com/service/faq/) | [SEARCH] |
| **YouTube Audio Library** | Yes, in monetized YouTube videos. Its tracks "won't be claimed by a rights holder through the Content ID system" | Creative Commons tracks need the credit in the description | YouTube's promise covers YouTube. Use on Reels, TikTok or in ads isn't covered (third-party reading) | Check each track's licence | [YouTube Help 3376882](https://support.google.com/youtube/answer/3376882?hl=en); [third-party guide](https://nanashino-chan.github.io/site/pages/youtube-audio-library-vs-commercial-music.html) | [SEARCH] |
| **TikTok Commercial Music Library** | Pre-cleared for commercial use on TikTok; about 1 million tracks | None stated | "Videos that include Commercial Sounds may only be posted or shared within TikTok" | Business accounts see only these sounds. "Businesses cannot use the general music library for commercial usage", including organic posts | [TikTok Ads Help](https://ads.tiktok.com/help/article/commercial-music-library?lang=en); [CML user terms](https://www.tiktok.com/legal/page/global/commercial-music-library-user-terms/en) | [SEARCH] |
| **Meta (Facebook, Instagram)** | Meta's music licences cover personal, non-commercial use. Business accounts get a smaller catalogue cleared for commercial use (about 14,000 tracks, third party) | | Meta only | "Use of music for commercial or non-personal purposes in particular is prohibited unless you have obtained appropriate licenses." | [Meta Music Guidelines](https://www.facebook.com/legal/music_guidelines); [Foxi, 2026](https://www.foximusic.com/blog/instagram-reels-music-copyright-legal-guide/) | [SEARCH] |
| **MPT's bundled songs** | Unknown | | | The README: "includes some default music from YouTube videos. If there are copyright issues, please delete them." | `README-en.md` | [PAGE] |

### 7b. What copyrighted music costs brands

| Case | Claim | Outcome | Source | Tag |
|---|---|---|---|---|
| Warner Music v. Crumbl (filed April 2025) | At least 159 works in TikTok and Instagram posts; up to $150,000 per work, about $23.85 million at most | Settlement in principle, terms undisclosed (reported 2026-06-22) | [The FADER, 2025-04-25](https://www.thefader.com/2025/04/25/warner-music-group-is-suing-crumbl-cookies-for-massive-copyright-infringement); [Digital Music News, 2026-06-22](https://www.digitalmusicnews.com/2026/06/22/wmg-crumbl-cookies-lawsuit-settlement/) | [SEARCH] |
| Sony Music v. University of Southern California (filed 2025-03-11) | More than 170 tracks in 283 TikTok and Instagram videos | Settled, terms undisclosed | [Music Ally, 2025-03-13](https://musically.com/2025/03/13/sony-music-sues-university-of-southern-california-over-social-posts/); [ArentFox Schiff](https://www.afslaw.com/perspectives/alerts/usc-faces-the-music-sony-music-sues-usc-unauthorized-use-sound-recordings) | [SEARCH] |
| Warner Music v. DSW (2025) | More than 200 works in TikTok and Instagram posts and paid influencer partnerships | Not found | [Music Business Worldwide](https://www.musicbusinessworldwide.com/warner-music-sues-retail-giant-designer-shoe-warehouse-for-allegedly-infringing-200-works-in-tiktok-posts/) | [SEARCH] |

**For the rulebook:**
- Music comes only from:
  - the client's own licensed library, with the licence on file;
  - Pixabay Music, with the licence certificate saved to the job;
  - a paid library whose licence covers business use on every platform we deliver for.

  Never use TikTok's commercial library or Meta's business catalogue in a master file, because those licences stop at their own platforms. Never use commercial releases.
- The job ledger keeps each track's licence ID or certificate. It is what clears a Content ID claim.
- YouTube Audio Library tracks are used only in YouTube-only shorts, with the credit copied into the description when the track asks for it.
- Remove MPT's bundled songs and fonts from any fork we run.

---

## Unverified notes

- **Access.** No vendor, platform, stock-library or help-centre page loaded. Every price and policy quote not marked [PAGE] comes from a search summary, and summaries sometimes merge several pages.
- **Conflicting vendor prices:**
  - Pictory: official-domain summaries disagree with each other. One gives Starter at $29 a month ($25 yearly) with 200 video minutes; another says Starter includes 7,200 minutes a year (600 a month). Third parties give $25 and $19 for Starter, $49 for Professional, and $79 or $119 for Teams.
  - InVideo: the Max plan has 5,000 credits (official-domain summary) or 3,900 (Creatify). The "2 credits a minute for stock-only video" figure is third-party.
  - Synthesia Starter billed yearly: $264 a year ($22 a month) in the official-domain summary, $18 a month in third-party guides.
  - ElevenLabs: the official-domain summary gives Starter $6 with 30,000 credits, Creator 121,000, Scale $299 and Business $990. One 2026 guide gives Starter at $5. Older plan sets had Creator at 100,000 and Pro at 500,000 credits, with Scale and Business priced differently.
  - ElevenLabs API: $0.10 per 1,000 characters (official-domain summary) against $0.18 (LiteLLM).
  - Azure standard neural: $15 per 1M characters (LiteLLM) against $16 (TextToLab, 2026). Azure HD: $22 (Microsoft blog, from March 2026) against $30 (LiteLLM, apparently stale).
  - Coverr plans: $4.20, $10.80 and $42 a month (discounted) against $24 and $119 list prices. I didn't use either.
  - Revid: one summary names Hobby, Growth and Ultra plans with promotional prices; the official-domain summary names Growth, Elite and Ultra.
- **Human prices:**
  - Biztoolkit and FluxNote are rate-guide blogs, not marketplaces. FluxNote contradicts itself: $15–$150 per Short in one line and $150–$500 in another. I didn't use it.
  - Aggregator figures I didn't use, because no primary data sits behind them: "brand/agency stack $300–$1,500/month at $15–$30 per video" and "outsourced production $500–$2,000/month" (2026 automation guides).
  - Fiverr "starting at" prices are the cheapest package; typical orders cost more.
  - The Squideo figure is in pounds. I didn't convert it, because I had no sourced rate.
  - The Cueball search summary echoed a "$1,995" figure from my own query; I didn't use it.
- **Nigerian prices.** Webiliti is undated, and Profolio's ranges are broad. No Nigerian source prices a scripted, voiced 30–60 s explainer short. A Nairaland post on voice-over pay ("$8 every 60 minutes") wasn't used.
- **YouTube:**
  - The July 2026 quotes come through TechCrunch and Tubefilter summaries. Tubefilter's article is dated 2026-07-13, while TechCrunch says the change rolled out on 2026-07-16.
  - The exemption for "cloning one's own voice" comes from a secondary source (Jellypod).
  - Whether a generic TTS narrator counts as "a person's voice" isn't settled in anything I read; the rule above labels it anyway.
- **TikTok:**
  - Pages on tiktok.com/discover (user videos, not the newsroom) say new Community Guidelines took effect on 2026-09-24. I couldn't confirm that with TikTok's newsroom, so I relied on the 2025 update.
  - The newsroom post on AI labels is undated in what I saw.
- **Pixabay.** The 100-requests-per-minute limit comes from summaries of its API docs and from third-party wrappers, not from the page itself.
- **Pexels.** The API rules were read in a third-party copy of Pexels' documentation. It matches the search summaries of pexels.com, but it may lag the live page.
- **edge-tts.** The Microsoft Services Agreement clauses come from search summaries. A clause against bots and "automated process[es]" appeared in one summary, but I couldn't tie it to a specific Microsoft document. The Microsoft Q&A answer isn't a legal statement by Microsoft.
- **OpenAI TTS.**
  - The 2027-01-20 shutdown of `tts-1` and `tts-1-hd` comes from summaries of OpenAI's deprecations page.
  - A GitHub issue dated 2026-07-16 ([a5c-ai/babysitter #1474](https://github.com/a5c-ai/babysitter/issues/1474)) says OpenAI's docs mark `gpt-4o-mini-tts` "Deprecated" [PAGE], but it gives no date.
  - A community thread says the replacement snapshot `gpt-4o-mini-tts-2025-12-15` truncates final sentences. Check before building on OpenAI voices.
- **Kokoro.** The arena rank, the Elo and the training-hours figures are from third-party summaries.
- **Criticism sources.** The "videos feel similar" quote came from one search summary covering several MPT reviews (Wavect, Riffkit, AI Fruit and others), and I couldn't tell which page said it. The Kapwing figures come from press summaries. The BBC "bad science" investigation's date wasn't in the summary I saw.
- **MPT release history.** The releases page puts v1.2.7 on 2025-04-03 and the tags page on 2026-04-03. The tag order (v1.2.6 on 2025-05-10, v1.2.8 on 2026-05-28) fits 2026.
- **Assumptions to measure:** 900 characters (about 150 words) per 60 seconds of voiceover, and 30 minutes of review per short. Measure both on the first 10 shorts (our data) before fixing prices in `packages/catalog/src/offers.ts`.
