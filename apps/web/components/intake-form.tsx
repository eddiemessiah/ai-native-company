"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Arrow } from "./bits";

interface Result {
  route: {
    offer: string;
    offerName: string | null;
    priority: string;
    next: string;
    offerConfidence: number;
    firstJobFree: boolean;
  } | null;
  decidedBy: { provider: string; model: string; latencyMs: number } | null;
}

const BUDGETS = ["Under $500", "$500–$2,000", "$2,000–$10,000", "Over $10,000", "Not sure yet"];
const TIMELINES = ["This week", "This month", "This quarter", "Just exploring"];

export function IntakeForm({
  offers,
  initialOffer,
  initialMessage,
  links,
}: {
  offers: readonly { slug: string; name: string }[];
  initialOffer?: string;
  initialMessage?: string;
  links: { booking: string; paystack: string; stripe: string };
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(form: HTMLFormElement) {
    setPending(true);
    setError(null);
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setResult(body as Result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {result ? (
        <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-8 md:p-10">
          <p className="label flex items-center gap-2">
            <span className="dot live-dot" /> Received
          </p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
            {result.route?.offerName ? (
              <>
                Routed to <span className="serif text-write">{result.route.offerName}</span>.
              </>
            ) : (
              "A person will read this today."
            )}
          </h2>
          {result.decidedBy ? (
            <p className="mt-3 font-mono text-xs text-faint">
              Decided by {result.decidedBy.provider} ({result.decidedBy.model}) in {result.decidedBy.latencyMs}ms ·{" "}
              {result.route ? `priority ${result.route.priority}` : ""}
            </p>
          ) : null}
          <p className="mt-6 max-w-xl text-dim">
            We reply within one working day, usually the same day.{" "}
            {result.route?.firstJobFree ? "This is a first-job-free offer: if you're one of our first five design partners, the first one costs nothing." : ""}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {links.booking ? (
              <a href={links.booking} target="_blank" rel="noreferrer" className="btn btn-solid">
                Book a 20-minute call <Arrow />
              </a>
            ) : null}
            {result.route?.offer && result.route.offer !== "other" ? (
              <Link href={`/directory/${result.route.offer}`} className="btn">
                What happens next
              </Link>
            ) : null}
            {links.stripe ? (
              <a href={links.stripe} target="_blank" rel="noreferrer" className="btn">
                Pay by card
              </a>
            ) : null}
            {links.paystack ? (
              <a href={links.paystack} target="_blank" rel="noreferrer" className="btn">
                Pay locally in Africa
              </a>
            ) : null}
          </div>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="card grid gap-5 p-6 md:grid-cols-2 md:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(e.currentTarget);
          }}
        >
          <Field label="Your name" htmlFor="name">
            <input id="name" name="name" required minLength={2} className="field" autoComplete="name" />
          </Field>
          <Field label="Company (optional)" htmlFor="company">
            <input id="company" name="company" className="field" autoComplete="organization" />
          </Field>
          <Field label="Email" htmlFor="email">
            <input id="email" name="email" type="email" className="field" autoComplete="email" />
          </Field>
          <Field label="WhatsApp or Telegram" htmlFor="phone">
            <input id="phone" name="phone" className="field" autoComplete="tel" placeholder="+234…" />
          </Field>
          <Field label="What do you want done?" htmlFor="offer">
            <select id="offer" name="offer" className="field" defaultValue={initialOffer ?? ""}>
              <option value="">Not sure: let the brain decide</option>
              {offers.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Website (optional)" htmlFor="website">
            <input id="website" name="website" className="field" placeholder="https://" />
          </Field>
          <Field label="Budget" htmlFor="budget">
            <select id="budget" name="budget" className="field" defaultValue="">
              <option value="">Choose one</option>
              {BUDGETS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="Timeline" htmlFor="timeline">
            <select id="timeline" name="timeline" className="field" defaultValue="">
              <option value="">Choose one</option>
              {TIMELINES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Describe the job in your own words" htmlFor="message">
              <textarea
                id="message"
                name="message"
                required
                minLength={10}
                rows={6}
                defaultValue={initialMessage}
                className="field resize-y leading-relaxed"
                placeholder="What should be different once this is done? Volumes, deadlines and tools help."
              />
            </Field>
          </div>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="company_url">Leave this empty</label>
            <input id="company_url" name="company_url" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
            <p className="max-w-md font-mono text-[11.5px] leading-relaxed text-faint">
              The brain routes your request in one typed decision. A person reads every lead. We never share your details.
            </p>
            <button type="submit" disabled={pending} className="btn btn-solid h-12 justify-center px-6 disabled:opacity-50">
              {pending ? "Routing…" : "Send"} <Arrow />
            </button>
          </div>
          {error ? <p className="font-mono text-sm text-human md:col-span-2">{error}</p> : null}
        </motion.form>
      )}
    </AnimatePresence>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block font-mono text-[12px] text-dim">
        {label}
      </label>
      {children}
    </div>
  );
}
