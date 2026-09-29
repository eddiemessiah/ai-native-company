# Video Desk: editing prices, platform specs and transcription costs

*Compiled 2026-09-27 for Shonin's Video Desk (Edidiong Umana). Sources dated 2016–2026, with the most weight on 2025–2026.*

**Method.** The egress proxy blocked nearly every host this brief needed:
- **Blocked:**
  - help centres: support.google.com (YouTube Help and Google Ads Help), podcasters.apple.com;
  - AI vendors: openai.com, developers.openai.com, groq.com, console.groq.com;
  - marketplaces: fiverr.com, upwork.com;
  - clipping and editing tools: opus.pro, help.opus.pro, descript.com, help.descript.com, riverside.com, docs.vizard.ai, submagic.co, capcut.com;
  - other sites: en.wikipedia.org, podnews.net, costgoat.com, readcommunique.com, apnorc.org.
  
  Direct downloads from github.com and its API were refused for repos not attached to this session.
- **Loaded:** github.com pages (through WebFetch) and raw.githubusercontent.com. I read these first-hand:
  - the faster-whisper README and LICENSE;
  - the openai/whisper README and LICENSE;
  - LiteLLM's price table (`model_prices_and_context_window.json`, main branch, fetched 2026-09-27);
  - FFmpeg's `doc/filters.texi`;
  - five GitHub issues, PRs and READMEs that quote OpenAI's deprecations page or YouTube's player data.

Everything else comes from search-engine summaries. Where I could, I restricted the search to the vendor's own domain (marked "official domain"), so the summary draws on the vendor's page. It is still unverified.

Tags:
- **[PAGE]**: read first-hand.
- **[SEARCH]**: seen only in a search summary. Treat as unverified.
- **"Our arithmetic"**: a number I derived from sourced numbers.

Naira conversions use the CBN rate of **₦1,329.5 per US$1 on 2026-09-25** ([Naija News](https://www.naijanews.com/2026/09/26/dollar-to-naira-exchange-rate-today-september-26th-2026/)) [SEARCH]. The house planning rate in `research/africa-ai.md` is ₦1,500. Conflicts and weak sources are listed in **Unverified notes** at the end.

---

## 0. TL;DR

1. **A human editor charges about $480–$1,680 for the bundle the Video Desk sells, with $710 in the middle** (our arithmetic, §1e). The bundle is one tightened long-form cut, 8 clips, a trailer and chapters. Inputs, all [SEARCH]:
   - long-form video edit: $205 (We Edit Podcasts), $305 (Veedyou's mid-2026 average), up to $1,000 (Podcast Engineers);
   - clips: $31 (Vidchops), $45 (Veedyou at volume), $75 (Podcast Engineers);
   - Fiverr gigs start at $5–$50.

   In Nigeria, recording and editing a one-hour video episode costs **₦250,000–₦400,000** (Communiqué, 2026-07-21) [SEARCH].
2. **Doing it yourself with AI software costs $1.45–$6.00 in credits per 60-minute episode** (our arithmetic):
   - OpusClip: $15–$29 a month for 150–300 source minutes;
   - Vizard: $14.50–$29 a month for 600 source minutes [SEARCH].

   The buyer still picks, fixes and approves every clip, and makes the long-form cut. Transcription adds $0.04–$0.36 an hour [PAGE]. The cost that matters is review time.
3. **Suggested price: $150–$300 per recording of up to 60 minutes; ₦75,000–₦150,000 for Nigerian clients.**
   - Our rule is to price a unit at 25–50% of the human alternative (`research/africa-ai.md`).
   - That gives $121–$242 against the $484 low bundle and $178–$355 against the $710 mid bundle.
   - A comparable Nigerian bundle runs about ₦215,000–₦400,000, so 25–50% is ₦54,000–₦200,000.
   - ₦75,000–₦150,000 is $56–$113 at the CBN rate.
   - $150 is below every studio bundle found and far above the $6 DIY cost.
4. **Cut every clip to 2:20 or less.** That is X's cap for non-Premium accounts (140 s), the tightest of the five platforms:
   - YouTube Shorts: 3 minutes;
   - Instagram: recommends Reels to non-followers only at 3 minutes or less;
   - TikTok: 60-minute uploads;
   - LinkedIn: 15 minutes from desktop, 10 from mobile.

   Export 9:16 at 1080x1920 [SEARCH]. Post text limits: 280 characters on X without Premium, 100 for a YouTube title, 5 hashtags on Instagram (§8).
5. **Loudness:**
   - Apple Podcasts: -16 LKFS ±1 dB, true peak at or below -1 dBFS [SEARCH].
   - Spotify: normalizes playback to -14 LUFS. Its podcast-ad spec is -16 LUFS ±1.5 with true peak at or below -2 dBTP [SEARCH].
   - YouTube: no target published that I found. Its player data carries `loudnessTargetLkfs` = -14, and loud videos are turned down [PAGE, third-party].
   - FFmpeg: `loudnorm` defaults to -24 LUFS, so always set the target [PAGE].
6. **YouTube chapters:** the first timestamp is 00:00, there are at least three timestamps in ascending order, and each chapter runs at least 10 seconds (YouTube Help) [SEARCH]. Check this in code before publishing.
7. **Captions** [SEARCH]:
   - 69% of US adults watch video with the sound off in public, and 80% are more likely to finish a video that has captions (Verizon Media and Publicis Media, 5,616 adults, April 2019).
   - Captions raised view time on Facebook video ads by 12% on average (Facebook, 2016).
   - 40% of US adults aged 18–44 use subtitles always or often (AP-NORC, August 2025).
   - 88% of TikTok users say sound is essential (Kantar, 2021). So burn in captions and still master the audio.
8. **Transcription:**
   - Use OpenAI `gpt-transcribe` at $0.0045 a minute ($0.27 an hour) or Groq `whisper-large-v3-turbo` at $0.04 an hour [PAGE].
   - OpenAI shuts down `whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe` and `gpt-4o-transcribe-diarize` on **2027-02-26** [PAGE].
   - Whisper and faster-whisper are both MIT-licensed [PAGE]. faster-whisper's `small` model transcribed 13 minutes of audio in 1m42s on an 8-thread CPU at int8, about 7.6x real time [PAGE].

---

## 1. Human alternative prices

### 1a. Short-form clips cut from a long video (per clip)

| Seller or source | Price | What it covers | Date | Tag |
|---|---|---|---|---|
| Fiverr gig listings, podcast to shorts | Starting at:<br>• $5: [shortseditor645](https://www.fiverr.com/shortseditor645/edit-your-podcast-into-engaging-short-form-video-clips), [farooqali614](https://www.fiverr.com/farooqali614/edit-your-podcast-into-short-clips)<br>• $10: [manishpro24](https://www.fiverr.com/manishpro24/create-viral-podcast-shorts-with-captions-and-edits-for-tiktok-youtube), [arsal_editz](https://www.fiverr.com/arsal_editz/edit-podcast-to-engaging-short-form-video-clips-for-youtube-and-tiktok-videos)<br>• $20: [sherazkhan08](https://www.fiverr.com/sherazkhan08/edit-your-podcast-into-youtube-shorts-tiktok-and-instagram-reels)<br>• $40: [asim9x_creation](https://www.fiverr.com/asim9x_creation/repurpose-and-edit-your-podcast-videos-into-short-form-clips-within-24-hours), "with captions"<br>• $50: [mzstudios](https://www.fiverr.com/mzstudios/create-tiktok-ig-reels-yt-shorts-from-your-podcast-videos) | "Starting at" is the cheapest package, usually one or a few clips | Live listings, seen 2026-09-27 | [SEARCH] |
| Fiverr's own cost guide ([link](https://www.fiverr.com/resources/guides/video-animation/video-editor-cost)) | $10–$100 per finished minute for social-media videos; agency-level work $100–$350 per minute | Per minute of output, not per clip | Undated | [SEARCH] |
| Podcast Engineers ([link](https://www.podcastengineers.com/blogs/podcast-video-editing-services/)) | **$30–$75 per clip.** Some services include 2–3 clips per episode instead | Vertical 60–90 s cuts for Reels, TikTok and Shorts | 2026 | [SEARCH] |
| Veedyou ([link](https://www.veedyou.com/how-much-does-short-form-video-editing-cost/)) | **$60–$120** average per short-form edit. START plan: $899 a month for up to 20 short-form videos, **≈$45 each** (our arithmetic) | Human-edited Shorts and TikToks | 2026 | [SEARCH] |
| Vidchops, from an [increditors review](https://increditors.com/vidchops-review-2026-pricing-quality-who-its-for/) | $495 a month for 4 credits. One credit is one long-form video (5–60 min) or four short-form videos, so 16 shorts cost **≈$31 each** | Subscription | 2026 | [SEARCH] |
| Barevalue ([link](https://barevalue.com/video-pricing)) | Five AI-made 9:16 clips of 25–45 s come free with every video-editing order. Video minimum charge: $65 | Clips are AI-made, not hand-cut | Undated | [SEARCH] |
| Upwork video-editor cost guide ([link](https://www.upwork.com/hire/video-editors/cost/)) | Median $35 an hour; typical range $10–$60 | Hourly, not per clip | Page undated; Upwork's hire pages are dated Sep 2026 | [SEARCH] |

**Read.** There are two tiers:
- Fiverr gigs at $5–$50;
- studios at $30–$120 per clip, sold in bundles or retainers rather than one at a time.

A clip is a unit people already buy.

### 1b. Podcast or long-form episode editing (per episode)

| Seller or source | Price | Notes | Date | Tag |
|---|---|---|---|---|
| We Edit Podcasts ([pricing](https://weeditpodcasts.com/pricing/)) | Audio and video: $440 a month for 2 episodes (**$220 each**), $820 for 4 (**$205 each**). Audio only: $200 for 2, $380 for 4 | 72-hour turnaround | Undated | [SEARCH] |
| Trevor O'Hare, solo editor ([link](https://www.trevorohare.com/blog/how-much-does-professional-podcast-editing-cost-in-2025)) | $100 per 30 minutes of raw footage, plus a flat $150 to add video, so **$350** for a 60-minute video episode (our arithmetic). He says most independent podcasters pay $100–$300 an episode for audio | | 2026 | [SEARCH] |
| Veedyou ([cost guide](https://www.veedyou.com/podcast-video-editing-cost/), [rates](https://www.veedyou.com/video-editing-cost/)) | $275–$350 per standard YouTube video. Average **$305 per video as of mid-2026.** Budget tier $50–$150 an episode | Podcast video costs 2–4x audio-only | 2026 | [SEARCH] |
| Podcast Engineers ([link](https://www.podcastengineers.com/blogs/podcast-video-editing-services/)) | Full video packages **$300–$1,000+ an episode**; audio $75–$800 | | 2026 | [SEARCH] |
| Awkward Sage Media ([link](https://www.awkwardsage.com/the-awkward-edit-podcast-production-tips/podcast-editing-cost-2026)) | $1,000, $1,250 or $1,500 a month for up to 4 episodes, so **$250–$375 each** (our arithmetic) | The summary mentions 2 subtitled audiograms or clips per episode | 2026 | [SEARCH] |
| Barevalue ([link](https://barevalue.com/podcasting-pricing)) | AI edit from $0.79 a minute (minimum $45). Human upgrade $1.79 a minute, **$107 for 60 minutes** (our arithmetic). Express turnaround +$0.50 a minute | Audio; pay per episode | Undated | [SEARCH] |
| Upwork podcasting-producer cost guide ([link](https://www.upwork.com/hire/podcasting-freelancers/cost/)) | Median $25 an hour; typical range $20–$31 | Hourly | Undated | [SEARCH] |

### 1c. Repurposing packages (one episode in, N clips and captions out)

| Seller or source | Package | Date | Tag |
|---|---|---|---|
| We Edit Podcasts ([link](https://weeditpodcasts.com/pricing/)) | Example package: 4 episodes a month with audio, show notes, transcription, video, audiograms, artwork and uploading. $1,520 a month, **$380 an episode** (our arithmetic) | Undated | [SEARCH] |
| Podcast Monkey ([link](https://podcastmonkey.co/pages/pricing)) | Per episode: "1 SEO clip + 5 standard clips", 3 captioned vertical reels, thumbnails and show notes. Price not shown in search results | Undated | [SEARCH] |
| EditMyPodcast ([link](https://editmypodcast.agency/pricing/video-podcast-editing/)) | 4 episodes a month including "bonus 10x short form videos" and 2 long-form videos. Priced by quote | Undated | [SEARCH] |
| Repurpose House ([link](https://repurposehouse.com/pricing)) | Ticket plans: one ticket is one short video of up to 2 minutes, turned into up to 9 assets. "Super Ticket" add-on: 4 a month for $120 ($30 each, source up to 10 minutes) | Undated | [SEARCH] |
| Rise25 ([link](https://rise25.com/lead-generation/podcast-content-repurposing-services-cost/)) | Repurposing services mostly $1,000–$5,000 a month; basic from about $500; premium over $10,000 | Undated | [SEARCH] |
| FORKOFF ([link](https://forkoff.xyz/blog/clipping/podcast-clipping-agency-pricing)) | Clipping agencies: most B2B buyers pay $3,000–$8,000 a month | 2026 | [SEARCH] |
| Trueframe ([link](https://www.trueframe.xyz/podcast-clipping-service)) | 12-week "Founder Brand Sprint" from $15,000 | Undated | [SEARCH] |

**Read.** Agencies sell repurposing by the month. The published per-episode equivalents run from $250 (Awkward Sage, with 2 clips or audiograms) to $380 (We Edit Podcasts, with audiograms). Podcast Monkey includes 6 clips an episode, but its price wasn't visible.

### 1d. Nigeria (naira)

| Source | Rate | Date | Tag |
|---|---|---|---|
| Communiqué 126, "The economics of podcasting" ([link](https://www.readcommunique.com/p/economics-of-african-podcasting)) | A sound engineer charges **₦80,000–₦150,000** ($58–$109) for a one-hour audio episode. Recording and editing a one-hour video episode costs **₦250,000–₦400,000** ($181–$290). Recording several episodes in one day lowers the cost per episode | 2026-07-21 | [SEARCH] |
| Profolio salary guide ([link](https://www.profolio.ng/video-editor/salary-guide)) | Salaried editors average ₦80,000–₦250,000 a month: entry level ₦60k–₦120k, mid-level ₦150k–₦300k, senior ₦300k–₦600k+. Freelance **Reels or TikTok edits ₦15,000–₦80,000 per video**; brand videos ₦80,000–₦300,000 per project | 2026 | [SEARCH] |
| UGC Deck ([link](https://ugcdeck.co/how-much-does-video-editing-cost-in-nigeria/)) | Short-form (15–60 s) ₦1,000–₦3,000 per video. Long-form (5–15 min) ₦3,000–₦8,000. ₦15,000–₦30,000 a month for 10–15 shorts | Undated | [SEARCH] |
| PBridge, Ibadan ([link](https://www.pbridgeco.com/salary/video-editor-in-ibadan)) | Freelance video editors ₦3,000–₦14,000 an hour | 2026 | [SEARCH] |
| Upwork Nigeria page ([link](https://www.upwork.com/hire/video-editors/ng/)) | "$6–$25 per hour"; one Lagos editor listed at $5 an hour | Jul 2026 | [SEARCH] |

**Read.** The only 2026 source with a per-episode price is Communiqué, and its price includes recording. For per-clip work, Profolio's ₦15,000–₦80,000 is the credible band. UGC Deck's ₦1,000–₦3,000 looks like student-level work.

### 1e. The bundle the Video Desk replaces, and a suggested price

**Unit (proposed).** One recording of up to 60 minutes of source. It becomes:
- 8 captioned vertical clips;
- one highlight trailer of 60–90 s;
- YouTube chapters;
- one tightened long-form cut.

A person approves every clip. A longer recording counts as one unit per started 60 minutes of source.

**The human cost of that bundle** (our arithmetic). The trailer is priced as a ninth short piece. Chapters are usually included in the long-form edit, and I found no separate price for them.

| Case | Long-form cut | 9 short pieces | Total |
|---|---|---|---|
| Low | $205 (We Edit Podcasts, 4-episode plan) | 9 × $31 = $279 (Vidchops) | **$484** |
| Mid | $305 (Veedyou's mid-2026 average) | 9 × $45 = $405 (Veedyou START plan) | **$710** |
| High | $1,000 (top of Podcast Engineers' typical range) | 9 × $75 = $675 (Podcast Engineers) | **$1,675** |
| Nigeria, low | ₦80,000 (Communiqué's sound-engineer rate, used as a stand-in for the long-form edit) | 9 × ₦15,000 = ₦135,000 (Profolio) | **₦215,000** |
| Nigeria, reference | Communiqué: recording plus editing a one-hour video episode | — | **₦250,000–₦400,000** |
| Nigeria, high | ₦150,000 | 9 × ₦80,000 = ₦720,000 (Profolio) | **₦870,000** |

**Suggested price for international clients: $150–$300 per unit.**
- Rule: price at 25–50% of the human unit cost (`research/africa-ai.md`).
- Against the low bundle that is $121–$242, and against the mid bundle $178–$355.
- $150 sits above the budget floor: Fiverr gigs at $5–$50 and Barevalue's $65 minimum. $300 stays under the $484 low studio bundle.

**Suggested price for Nigerian clients: ₦75,000–₦150,000 per unit.**
- 25–50% of ₦215,000–₦400,000 is ₦54,000–₦200,000. The middle of that band is ₦75,000–₦150,000, which is $56–$113 at the CBN rate, or $50–$100 at the house rate.
- The USD band converts to ₦199,000–₦399,000, about the whole Communiqué production price. That is why the naira price is set separately, as the catalog already does with its `ngn` prices.

**Cost floor.**
- Transcription: $0.04–$0.36 an hour (§7).
- SaaS clipping credits, if we used them: $1.45–$6.00 an hour (§2).
- Reviewer time is the main cost. A mid-level Lagos editor earns ₦150,000–₦300,000 a month (Profolio). Over 176 working hours (assumption: 22 days of 8 hours), that is ₦850–₦1,700 per hour of review (our arithmetic).
- Measure actual review minutes on the first 10 jobs before fixing the price (our data).

**Against DIY.** A Nigerian creator on OpusClip Pro pays about ₦38,600 a month ($29, our arithmetic) and still does all of the review. The Video Desk sells that time back, plus the long-form cut and the chapters.

---

## 2. AI tool prices (the do-it-yourself alternative)

All [SEARCH]. Vendor pages were blocked, so each row cites the official-domain search result plus a 2026 third-party review. The last column is our arithmetic for one 60-minute source recording.

| Tool | Plan and price | What it limits | Per 60-min episode |
|---|---|---|---|
| **OpusClip** ([pricing](https://www.opus.pro/pricing), official domain; [Castmagic 2026](https://www.castmagic.io/blog/opus-clip-pricing); [future-stack-reviews](https://future-stack-reviews.com/opusclip-review/)) | Free: $0 | 60 credits a month. One credit is one minute of source. Watermark; 3-day download window | Covers one episode |
| | Starter: $15 a month | 150 credits a month | $6.00 |
| | Pro: $29 a month, or $14.50 a month billed yearly ($174) | 300 credits a month (3,600 a year). Monthly credits expire after 60 days, yearly ones after 12 months | $5.80 monthly; $2.90 yearly |
| | Business: custom | | |
| **Descript** ([pricing](https://www.descript.com/pricing), official domain; [Sonix 2026](https://sonix.ai/resources/descript-pricing/)) | Free: $0 | 60 media minutes a month; watermark | Covers one episode |
| | Hobbyist: $16 a month billed yearly ($24 monthly) | 10 media hours, 400 AI credits, 1080p export | $1.60–$2.40 per media hour |
| | Creator: $24 yearly ($35 monthly) | 30 media hours, 800 AI credits, 4K | $0.80–$1.17 per media hour |
| | Business: $50 yearly ($65 monthly) | 40 media hours, 1,500 AI credits | $1.25–$1.63 per media hour |
| | Note | Every upload or recording uses media minutes, whether or not it is transcribed | |
| **Riverside** ([pricing](https://riverside.com/pricing), [Magic Clips](https://support.riverside.com/hc/en-us/articles/12124048765981-About-Magic-Clips), [download hours](https://support.riverside.com/hc/en-us/articles/22296539458973-About-download-hours), official domain; [Castmagic 2026](https://www.castmagic.io/blog/riverside-pricing)) | Plans reorganized in 2026: Free, Pro, Grow, Webinar, Business | Free: 2 hours of separate-track downloads a month | Flat subscription |
| | Pro: $29 a month ($24 billed yearly) | 15 hours of separate-track downloads a month | Flat |
| | Grow: $39 a month; Webinar: $99; Business: custom | | Flat |
| | Magic Clips | Uses no credits. One set is made automatically per recording, for recordings over 3 minutes with a transcript. Pro, Grow and Webinar can make up to 2 more sets (3 in total); Business up to 4 more. Roughly 2 clips per 5 minutes, each 30–90 s | Included |
| **Vizard** ([pricing](https://vizard.ai/pricing), [help](https://help.vizard.ai/en/articles/8767574-how-does-the-pricing-plan-work), official domain; [Capterra 2026](https://www.capterra.com/p/10009818/Vizard/pricing/)) | Free: $0 | 60 credits a month. One credit is one minute uploaded. 720p; 3-day storage | Covers one episode |
| | Creator: $29 a month, or $14.50 billed yearly ($174) | 600 credits, no watermark, 4K | $2.90 monthly; $1.45 yearly |
| | Business: $39 a month, or $19.50 billed yearly ($234) | Team features, up to 20 social accounts | |
| | Note | Unused credits roll over on paid plans. Monthly credits last 60 days, yearly ones 13 months | |
| **Submagic** ([pricing](https://www.submagic.co/pricing), [length limits](https://care.submagic.co/en/article/what-is-the-size-and-video-length-limit-for-each-video-in-submagic-gl84of/), official domain; [CutSnap 2026](https://cutsnap.ai/blog/submagic-pricing-2026)). Captions finished clips; priced per video | Free: $0 | 3 videos a month, watermark, 1:30 maximum | |
| | Starter: $19 a month ($12 billed yearly) | 15 videos, 2 minutes maximum, 1080p | $1.27 per clip; 8 clips ≈ $10 |
| | Pro: $39 a month ($23 billed yearly) | 40 videos, 5 minutes maximum | $0.98 per clip |
| | Business + API: $69 a month ($41 billed yearly) | 100 videos, 30 minutes maximum, 4K at 60 fps | $0.69 per clip |
| **CapCut** ([SocialRails 2026](https://socialrails.com/blog/capcut-pricing-guide); [CostBench](https://costbench.com/software/video-editing/capcut/); [CapCut help](https://www.capcut.com/help/how-much-does-capcut-pro-cost), official domain, no figures in the summary) | Standard: $9.99 a month | Mostly mobile; removes the watermark | Flat |
| | Pro: $19.99 a month or $179.99 a year | 4K export, the AI toolkit, 1 TB of cloud storage. Not metered by minutes in the sources found | Flat |
| | Note | Repriced around February 2026: the old Pro (about $9.99 a month, $77.99 a year) became Standard. Prices vary by region | |

**Read.** In software, one episode costs under $10. What a buyer pays a human for is the judgement and the hours:
- picking the moments;
- fixing captions;
- making the long-form cut;
- signing off.

The Video Desk is priced against the human, and the software is our cost of goods.

---

## 3. Platform limits and specs for vertical clips

### Length

| Platform | Maximum | What else matters | Source | Tag |
|---|---|---|---|---|
| YouTube Shorts | **3 minutes**, square or vertical, for uploads from 2024-10-15 | For Shorts **ads**, only the first 60 s play in the Shorts feed | [YouTube Help 15424877](https://support.google.com/youtube/answer/15424877?hl=en); [Google Ads Help 16041697](https://support.google.com/google-ads/answer/16041697?hl=en) | [SEARCH] |
| Instagram Reels | **3 minutes** to record and edit in the app. Raised from 90 s on 2025-01-19 | Reels over 3 minutes are **not recommended to non-followers** | [Instagram Help](https://help.instagram.com/2720958398006062); [Creators FAQ](https://creators.instagram.com/faq?locale=en_US); [Mosseri on Threads](https://www.threads.com/@mosseri/post/DE-efFqyStv); [MediaNama, Jan 2025](https://www.medianama.com/2025/01/223-instagram-reels-3-minutes-us-tiktok-ban/) | [SEARCH] |
| TikTok | **10 minutes** recorded in the app; **60 minutes** uploaded | If you pick a sound first, the sound's length sets the video's length | [TikTok Support](https://support.tiktok.com/en/using-tiktok/creating-videos/camera-tools) | [SEARCH] |
| X, non-Premium | **140 s (2:20)**, 512 MB | | [X Help](https://help.x.com/en/using-x/x-videos) | [SEARCH] |
| X Premium | **Up to 4 hours** on web and iOS, 16 GB. **10 minutes** on Android | Videos of 2–4 hours are 720p | [X Help](https://help.x.com/en/using-x/premium-longer-videos) | [SEARCH] |
| LinkedIn | **15 minutes** from desktop; **10 minutes** from the mobile app; minimum 3 s; 5 GB | | [LinkedIn Help a548372](https://www.linkedin.com/help/linkedin/answer/a548372) | [SEARCH] |

### Size and aspect ratio

| Platform | What the platform says | Source | Tag |
|---|---|---|---|
| YouTube Shorts | 9:16 vertical is "best suited"; square also counts as a Short. No pixel size appeared in the Help snippets | [Google Ads Help 16041697](https://support.google.com/google-ads/answer/16041697?hl=en) | [SEARCH] |
| Instagram Reels | Aspect ratio from 1.91:1 to 9:16; at least 30 fps; at least 720 px | [Instagram Help 1038071743007909](https://help.instagram.com/1038071743007909) | [SEARCH] |
| TikTok (ads spec) | 9:16, at least 540x960; **720x1280 or more recommended**; 500 MB or less | [TikTok Ads Help](https://ads.tiktok.com/help/article/video-ads-specifications) | [SEARCH] |
| X (ads spec) | 9:16 at **1080x1920** | [X Ads creative specs](https://business.x.com/en/help/campaign-setup/creative-ad-specifications) | [SEARCH] |
| LinkedIn | Aspect ratio from 1:2.4 to 2.4:1; 256x144 up to 4096x2304; 10–60 fps | [LinkedIn Help a548372](https://www.linkedin.com/help/linkedin/answer/a548372) | [SEARCH] |

**Read.** 1080x1920 at 9:16 clears every minimum above, and it is the size X's ad spec names. None of the organic help pages I saw requires 1080x1920 as such.

**For the rulebook:**
- Every clip is 140 s or less, so one master file posts to all five platforms. X non-Premium is the binding limit.
- Never publish a clip over 3 minutes. That is the Shorts cap, and Instagram stops recommending Reels beyond it.
- Export 1080x1920, 9:16, at 30 fps or more.

---

## 4. Loudness targets

| Platform or tool | Published target | Source | Tag |
|---|---|---|---|
| Apple Podcasts | **-16 LKFS ±1 dB** integrated; **true peak at or below -1 dBFS**; measured per ITU-R BS.1770-5 and set before encoding | [Apple Podcasts for Creators, audio requirements](https://podcasters.apple.com/support/893-audio-requirements) | [SEARCH] |
| Spotify playback | Normalizes to **-14 LUFS** (ITU 1770) by default. The "Loud" setting is -11 LUFS and "Quiet" is -19. Loudness is measured at upload; the file is not changed | [Spotify for Artists support](https://support.spotify.com/us/artists/article/loudness-normalization/) | [SEARCH] |
| Spotify mastering advice | Keep true peak below -1 dBTP, or below -2 dBTP if the master is louder than -14 LUFS | [Spotify for Artists FAQ](https://artists.spotify.com/faq/mastering-and-loudness) | [SEARCH] |
| Spotify podcast ads | **-16 LUFS ±1.5** integrated; **true peak at or below -2.0 dBTP** | [Spotify Ads podcast specs](https://ads.spotify.com/en-US/ad-specs/podcast-ad-specs/) | [SEARCH] |
| YouTube | **No target published in YouTube Help that I found.** The player response carries `loudnessTargetLkfs` (example value -14), `perceptualLoudnessDb` (the absolute level, in LKFS) and `loudnessDb` (the difference between them) | [yt-channel-volume PR #52](https://github.com/semnil/yt-channel-volume/pull/52), 2026-09-27 | [PAGE] (third-party) |
| YouTube | "Stats for nerds" shows "Volume / Normalized", for example 100%/62%, about 4 dB down | [SmartTube issue #5653](https://github.com/yuliskov/SmartTube/issues/5653), 2026-04-03 | [PAGE] (third-party) |
| YouTube | "YouTube by default will only lower the volume if it is too loud." | [youtube-volume-normalizer README](https://github.com/Kelvin-Ng/youtube-volume-normalizer), undated | [PAGE] (third-party) |
| YouTube | "Stable volume" is on by default and keeps adjusting levels to narrow the gap between quiet and loud. It isn't available on every video and is off for YouTube Music and official music videos | [YouTube Help 14106294](https://support.google.com/youtube/answer/14106294?hl=en) | [SEARCH] |
| FFmpeg `loudnorm` | Defaults: **I = -24 LUFS**, LRA = 7, **TP = -2 dBTP**. Supports a two-pass mode that measures first and then applies (`measured_I`, `measured_TP`, …) | [FFmpeg doc/filters.texi](https://github.com/FFmpeg/FFmpeg/blob/master/doc/filters.texi) | [PAGE] |

**For the rulebook:**
- Master the long-form audio for the podcast feed to -16 LKFS ±1 with true peak at or below -1 dBFS (Apple's spec). Measure it in code with a BS.1770 meter, never by ear.
- Always pass `I` and `TP` to `loudnorm`. Its default of -24 LUFS is 8 dB below Apple's target (our arithmetic).
- For YouTube and the vertical clips, master to about -14 LUFS with true peak at or below -1 dBTP. This is an inference, not a platform rule: YouTube turns louder audio down, Spotify's music reference is -14, and TikTok, Instagram and LinkedIn publish no organic target that I found.

---

## 5. YouTube chapter rules

From [YouTube Help, "Video chapters"](https://support.google.com/youtube/answer/9884579?hl=en) [SEARCH]:

1. The first timestamp is **00:00**.
2. There are **at least 3 timestamps**, in ascending order.
3. Each chapter is **at least 10 seconds** long.

Third-party guides add two things ([Gyre, 2026](https://gyre.pro/blog/youtube-video-chapters-how-to-add-them-why-they-increase-views); [addchaptersyt](https://addchaptersyt.video/youtube-chapters/youtube-chapters-not-showing/)) [SEARCH]:
- two timestamps do not activate chapters;
- a chapter shorter than 10 s is dropped without warning.

The chapter list lives in the description, so it counts against the 5,000-character limit (§8).

**For the rulebook:** a chapter list is checked in code before a description is published (the split: code executes).

```ts
// ch: chapters sorted by start time, in seconds; durationS: video length in seconds
const ok =
  ch.length >= 3 &&
  ch[0].start === 0 &&
  ch.every((c, i) => i === 0 || c.start - ch[i - 1].start >= 10) &&
  durationS - ch[ch.length - 1].start >= 10; // last chapter too (our reading of the 10 s rule)
```

---

## 6. Captions: sound-off viewing and completion

| Study | Year and sample | Finding | Source | Tag |
|---|---|---|---|---|
| Verizon Media and Publicis Media | April 2019; online survey of 5,616 US adults aged 18–54 | **69%** watch video with the sound off in public places, 25% in private places. **80%** are more likely to watch a whole video when it has captions. 80% of caption users are not deaf or hard of hearing | [3Play Media summary](https://www.3playmedia.com/blog/verizon-media-and-publicis-media-find-viewers-want-captions/); [Forbes, 2019-07-31](https://www.forbes.com/sites/tjmccue/2019/07/31/verizon-media-says-69-percent-of-consumers-watching-video-with-sound-off/) | [SEARCH] |
| Facebook internal tests | Early 2016 | Captioned video ads raised video view time by **12%** on average | [Meta for Business](https://www.facebook.com/business/news/updated-features-for-video-ads); [3Play Media](https://www.3playmedia.com/blog/captions-increase-viewership-for-facebook-video-ads/) | [SEARCH] |
| AP-NORC poll | 2025-08-21 to 08-25; 1,182 US adults; margin ±3.8 points | About 1 in 3 use subtitles always or often: **40% of 18–44s** against 28% of those 45 and over. Younger users cite noisy places (40% against 25%) and multitasking (30% against 19%) | [AP-NORC](https://apnorc.org/projects/closed-captioning-on-its-a-generational-thing/) | [SEARCH] |
| TikTok with Kantar | 2021 | **88%** of TikTok users say sound is essential to the experience; 73% "stop and look" at ads that use sound | [TikTok for Business](https://ads.tiktok.com/business/en/blog/kantar-report-how-brands-are-making-noise-and-driving-impact-with-sound-on-tiktok) | [SEARCH] |
| Google Ads Help | Undated | Sound (music, voiceover or both) in Shorts ads "has been shown to increase conversions by over 20%" | [Google Ads Help 16041697](https://support.google.com/google-ads/answer/16041697?hl=en) | [SEARCH] |

**Read.** Captions matter most where people watch with the sound off: feeds viewed in public, and adults under 45, 40% of whom use subtitles always or often. On TikTok and Shorts, sound still matters.

**For the rulebook:** burn captions into every vertical clip, and still ship mastered audio.

No 2025–2026 study I found measures how captions change completion of organic short clips. The completion numbers are self-reported (2019) or about ads (2016).

---

## 7. Transcription cost and options

### Hosted APIs

| Option | Price | 60-minute episode (our arithmetic) | Notes | Source | Tag |
|---|---|---|---|---|---|
| OpenAI `gpt-transcribe` | **$0.0045/min** | $0.27 | Released 2026-07-28 [SEARCH]. OpenAI's recommended model for file transcription | [LiteLLM price table](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) ($0.000075/s); [OpenAI pricing](https://developers.openai.com/api/docs/pricing) | [PAGE], [SEARCH] |
| OpenAI `gpt-4o-mini-transcribe` | **$0.003/min** estimated; $1.25 per 1M input tokens, $5 per 1M output | $0.18 | **Shuts down 2027-02-26.** A dated snapshot, `-2025-12-15`, is listed at the same price with no shutdown date | LiteLLM; OpenAI pricing | [PAGE], [SEARCH] |
| OpenAI `gpt-4o-transcribe` | **$0.006/min** estimated; $2.50 per 1M input tokens, $10 per 1M output | $0.36 | **Shuts down 2027-02-26.** At most 1,500 s of audio per request ([OpenAI forum](https://community.openai.com/t/gpt-4o-transcribe-audio-length-limits/1148374)) [SEARCH] | LiteLLM; OpenAI pricing | [PAGE], [SEARCH] |
| OpenAI `whisper-1` | **$0.006/min** | $0.36 | **Shuts down 2027-02-26** | LiteLLM; OpenAI pricing | [PAGE], [SEARCH] |
| OpenAI `gpt-live-transcribe` | $0.017/min | $1.02 | Realtime streaming; not needed for batch work | LiteLLM | [PAGE] |
| Groq `whisper-large-v3` | **$0.111/hour** | $0.11 | | LiteLLM ($3.083e-5/s); [Groq docs](https://console.groq.com/docs/model/whisper-large-v3) | [PAGE], [SEARCH] |
| Groq `whisper-large-v3-turbo` | **$0.04/hour** | $0.04 | 216x real time. Each request is billed for at least 10 s. File limit: 25 MB free, 100 MB paid | LiteLLM ($1.111e-5/s); [Groq docs](https://console.groq.com/docs/model/whisper-large-v3-turbo) | [PAGE], [SEARCH] |

**OpenAI's deprecation, read first-hand on GitHub:**
- [HyperWhisper issue #797](https://github.com/ray-amjad/hyperwhisper-app/issues/797) [PAGE]:
  - OpenAI gave notice on 2026-08-26 that `whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe` and `gpt-4o-transcribe-diarize` leave the API on **2027-02-26**;
  - OpenAI's deprecations page (accessed 2026-09-18) says to "migrate to either `gpt-live-transcribe` or `gpt-transcribe`".
- [Murmur PR #51](https://github.com/BenItBuhner/Murmur/pull/51), 2026-09-23 [PAGE]: gives the same dates, and adds that `gpt-4o-mini-transcribe-2025-03-20` shuts down on 2027-01-20.
- LiteLLM's table sets `deprecation_date` to 2027-02-26 for all three of the older models [PAGE].

**Upload limit.** The Transcriptions API takes files of up to **25 MB**, so a long recording must be compressed or split, preferably at pauses ([OpenAI speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text)) [SEARCH].

### Self-hosted

- **Whisper.**
  - "Whisper's code and model weights are released under the MIT License." The LICENSE file reads "MIT License, Copyright (c) 2022 OpenAI" ([openai/whisper](https://github.com/openai/whisper)) [PAGE].
  - The `turbo` model (809M parameters, about 6 GB of VRAM, about 8x the speed of `large` on an A100) is an optimized `large-v3`. It is **not trained for translation** [PAGE].
- **faster-whisper** ([SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper)) [PAGE]:
  - It is "a reimplementation of OpenAI's Whisper model using CTranslate2, which is a fast inference engine for Transformer models."
  - It claims to be "up to 4 times faster than openai/whisper for the same accuracy while using less memory", with 8-bit quantization on both CPU and GPU.
  - It needs Python 3.9 or later and no system FFmpeg, because it decodes through PyAV.
  - Licence: **MIT**, "Copyright (c) 2023 SYSTRAN" ([LICENSE](https://github.com/SYSTRAN/faster-whisper/blob/master/LICENSE)) [PAGE].
  - Latest release: v1.2.1, dated "31 Oct" with no year on the [releases page](https://github.com/SYSTRAN/faster-whisper/releases) [PAGE]; 2025 according to search [SEARCH].

**faster-whisper's CPU benchmark** [PAGE]. It transcribed **13 minutes of audio** with the `small` model (244M parameters), 8 threads, on an Intel Core i7-12700K. It compared faster-whisper v1.1.0 with openai/whisper v20240930.

| Implementation | Precision | Time | RAM | Real-time factor (our arithmetic) |
|---|---|---|---|---|
| openai/whisper | fp32 | 6m58s | 2,335 MB | 1.9x |
| whisper.cpp | fp32 | 2m05s | 1,049 MB | 6.2x |
| whisper.cpp (OpenVINO) | fp32 | 1m45s | 1,642 MB | 7.4x |
| faster-whisper | fp32 | 2m37s | 2,257 MB | 5.0x |
| faster-whisper, batch 8 | fp32 | 1m06s | 4,230 MB | 11.8x |
| faster-whisper | int8 | **1m42s** | 1,477 MB | **7.6x** |
| faster-whisper, batch 8 | int8 | **51s** | 3,608 MB | **15.3x** |

At those rates, a 60-minute recording takes about 8 minutes, or about 4 minutes batched (our arithmetic).

On GPU (`large-v2`, RTX 3070 Ti 8GB), faster-whisper at fp16 with batch 8 took 17 s for the same 13 minutes, about 46x real time. openai/whisper took 2m23s [PAGE].

**Read.** Transcription costs under $0.40 an episode on any API, so it doesn't move the price.
- Default: `gpt-transcribe` or Groq turbo.
- Fallback that needs no API key: faster-whisper.
- Keep `whisper-1` and the `gpt-4o-*-transcribe` models out of new code: they are gone on 2027-02-26.

---

## 8. Text limits

| Platform | Field | Limit | Source | Date | Tag |
|---|---|---|---|---|---|
| YouTube | Video title | **100 characters** | YouTube Help ([edit video settings](https://support.google.com/youtube/answer/57404?hl=en), [upload videos](https://support.google.com/youtube/answer/57407)) | Undated | [SEARCH] |
| YouTube | Description | **5,000 characters**. Chapters sit here and count toward it | Same | Undated | [SEARCH] |
| X | Post, non-Premium | **280 characters** | X Help ([types of posts](https://help.x.com/en/using-x/types-of-posts), [X Premium](https://help.x.com/en/using-x/x-premium)) | Undated | [SEARCH] |
| X | Post, Premium | **Up to 25,000 characters** ("longer posts"). Anyone can read them; only Premium subscribers can write them | Same | Undated | [SEARCH] |
| Instagram | Caption | **2,200 characters**, including hashtags and spaces. About 125 characters show before "…more". Not confirmed on Instagram's own help pages | [Outfy 2026](https://www.outfy.com/blog/instagram-character-limit/); [Sendible](https://www.sendible.com/insights/instagram-character-limit) | 2026 | [SEARCH] |
| Instagram | Hashtags | **5 per post or reel**, phased in from 2025-12-18: "Instagram will gradually update the number of hashtags that you can include in a caption for a reel or post to five." Instagram's Help page still says 30 | [@creators on Threads](https://www.threads.com/@creators/post/DSalXGPCWM4/new-hashtag-guidance-starting-today-instagram-will-allow-up-to-hashtags-in-a); [Social Media Today](https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/); [Instagram Help](https://help.instagram.com/351460621611097) | 2025-12-18 | [SEARCH] |
| TikTok | Caption | **4,000 characters**, up from 2,200. Creator posts announcing the change are dated 2023-08-01 and 2023-08-03 (decoded from their video IDs, our arithmetic) | [TikTok discover page](https://www.tiktok.com/discover/tiktok-caption-limit); [creator post](https://www.tiktok.com/@jera.bean/video/7262489440285658411?lang=en) | Aug 2023 | [SEARCH] |
| LinkedIn | Post | **3,000 characters** | [LinkedIn Help a528176](https://www.linkedin.com/help/linkedin/answer/a528176) | Undated | [SEARCH] |

**For the rulebook:**
- Keep a clip's post text to 280 characters or less, so one caption works everywhere, including X without Premium.
- Keep titles to 100 characters or less.
- Use no more than 5 hashtags.
- Code counts characters; models don't.

---

## Unverified notes

- **Access.** No vendor, platform or help-centre page loaded. Every price and spec not marked [PAGE] comes from a search summary. Summaries sometimes merge several pages, so a number attributed to a vendor may come from a reseller's copy of its page.
- **Conflicting vendor prices:**
  - Descript: the official-domain summary gives $16, $24 and $50 a month (billed yearly) with 10, 30 and 40 media hours. Another result gives Hobbyist at $12 a month billed yearly with 10 transcription hours, probably a legacy plan. The monthly-billing prices ($24, $35, $65) come only from third-party 2026 reviews.
  - Vidchops: $325, $595 and $995 plans ([SaaSworthy, Sep 2026](https://www.saasworthy.com/product/vidchops/pricing)), against $495 a month for 4 credits and $995 for 8 (increditors, 2026).
  - Riverside Pro: 15 hours of separate-track downloads (official-domain summary) against 5 hours (one third-party summary).
  - Vizard: one official-domain summary says Creator and Business give "240–600 credits"; others say Creator gives 600.
  - We Edit Podcasts: $380 a month for 4 audio episodes in one summary, against a "$399 basic plan" in another.
  - Groq: an [older Groq blog post](https://groq.com/blog/groq-runs-whisper-large-v3-at-a-164x-speed-factor-according-to-new-artificial-analysis-benchmark) gives Whisper Large v3 at $0.03 an hour and a 164x speed factor. LiteLLM's table and 2026 summaries give $0.111 an hour. The turbo speed is 216x in one summary and 228x in another.
  - OpusClip: one summary said one credit equals one clip. The others, and the summary of OpusClip's own help page, say one credit is one minute of source.
  - HyperWhisper issue #797 quotes "$0.0045 per minute" for `gpt-4o-mini-transcribe-2025-12-15`. That looks like the app's own resale price; LiteLLM lists OpenAI's price for that snapshot at $0.003.
- **Aggregator-only ranges, not used in the bundle.** No primary data sits behind these:
  - "$25–$75 per clip for beginners, $75–$200 intermediate, $200–$500 senior" and "$40–$150 per Shorts or TikTok edit" ([UniLink](https://app.unilink.us/blog/best-fiverr-gigs-2026), [Playcut](https://playcut.ai/blog/fiverr-ai-video-gig-playbook/), 2026);
  - "per-clip work commonly $15–$60" and retainers of "$300–$1,500 a month" (clipping-agency guides; I couldn't pin down which page).
- **Nigerian rates.**
  - UGC Deck's ₦1,000–₦3,000 per short video and Profolio's ₦15,000–₦80,000 differ by a factor of 5–80.
  - UGC Deck is undated.
  - Communiqué's ₦250,000–₦400,000 includes recording, and no source separates editing from recording.
  - The "Nigeria, low" bundle uses a sound engineer's rate as a stand-in for a video editor.
  - Upwork's "$6–$25 per hour" on the Nigeria page may be global wording reused on that page.
- **Fiverr "starting at" prices** are the cheapest package, often one short clip. Typical orders cost more.
- **FX.** One search summary put the parallel-market rate at about ₦1,390 on 2026-09-25. I couldn't pin down the source page.
- **Instagram:**
  - Third-party posts say some accounts can upload Reels of 15 or 20 minutes ([Inro, 2025](https://www.inro.social/blog/instagram-reels-can-now-be-20-minutes-long-new-time-limit-explained-2025)). Instagram hasn't confirmed this.
  - The 2,200-character caption limit wasn't confirmed on Instagram's own domain.
  - The Help page's "30 hashtags" conflicts with the 5-hashtag cap announced on 2025-12-18.
- **X Premium.** Two summaries of the same X Help page disagree on which lengths are capped at 720p.
- **YouTube loudness.**
  - The -14 comes from player data and third-party observation, not from YouTube Help.
  - The README that says YouTube only turns loud videos down is undated.
  - "Stable volume", on by default, also changes levels.
- **Captions.** The often-quoted claim that 85% of Facebook video is watched without sound (2016) was not checked and is not used.
- **gpt-transcribe.** The release date (2026-07-28) and the accuracy claim (word error rate 19.27% against 40.37% for `whisper-1`, on Common Voice across 22 languages) come from [gpt-transcribe.org](https://gpt-transcribe.org/model/gpt-transcribe), a third-party site [SEARCH].
- **LiteLLM's price table** is a community-maintained mirror of vendor prices. I couldn't read its commit history (the GitHub API was refused), so I don't know when each price was entered.
- **Reviewer time per episode** was not measured. It is the main cost in the price floor. Measure it on the first 10 jobs (our data) before fixing the price in `packages/catalog/src/offers.ts`.
