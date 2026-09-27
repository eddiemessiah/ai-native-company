# Playbook: Agent-Ready Website

**Unit:** one website (up to 10 pages) plus a concierge trained on the business. **Price:** ₦300,000 setup + ₦35,000/month care (50% deposit). **Turnaround:** 5 working days.

## Day 1: intake and facts
- Collect the price list, FAQs, policies (delivery, refunds, hours), WhatsApp Business number, payment method and brand assets.
- Build a single **facts file** (JSON or markdown): products, prices, delivery zones, hours, contacts. This is the source of truth for the site, the concierge and `llms.txt`.
- Run the AI Visibility Audit baseline (see its playbook) so you can show before and after.

## Days 2–3: the site
- Fix wrong or stale facts first.
- Add a facts page and `llms.txt`, plus structured data (LocalBusiness, Product/Offer).
- Make pages fast and mobile-first (most customers are on Android and mobile data).
- Add a "Chat on WhatsApp" entry point and a web chat widget.

## Days 3–4: the concierge
- Knowledge: generated **only** from the facts file and the client's own documents.
- **Routing (brain):** every inbound message gets one typed decision:
  - `intent` (Choice): order, booking, price/product question, delivery question, complaint, other;
  - `urgency` (Score);
  - `refund_or_complaint` (Noul).
- **Code:** checks stock and calendar slots, generates payment links, logs every conversation.
- **Hand-off rules:** complaints and refunds, anything not in the facts file, and anything under 0.7 confidence go to a person on WhatsApp within 10 minutes during business hours.
- Check the current WhatsApp platform rules for AI assistants: keep the concierge specific to the business (its catalogue and policies), never general-purpose.

## Day 5: QA and launch
- Test 30 real questions (from the owner and from past chats). 100% of price answers must match the facts file.
- The owner approves the answers in a 20-minute walkthrough.
- Launch, then send the owner a weekly summary on WhatsApp: top questions, orders, hand-offs.

## Monthly care (₦35k)
- Keep the facts file current (prices change: ask every month).
- Review the hand-offs and low-confidence messages; add rulebook entries.
- Re-run the visibility tracking quarterly.

## Rulebook
- Never quote a price that isn't in the facts file.
- Payments are links the customer taps; never ask for card or bank details in chat.
- A booking is confirmed only after code checks the slot.
- Complaints go to a person, always.
