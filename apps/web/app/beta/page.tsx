import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetaSignup } from "@/components/beta/signup";
import { betaCtx, sessionUser } from "@/lib/beta";

export const metadata: Metadata = {
  title: "Shonin GTM private beta",
  description: "Your agents run your go-to-market in the tools you already use, and nothing leaves without your yes. Approve from your phone.",
};

const HOW = [
  { color: "var(--write)", k: "Agents draft", d: "Posts, updates and first messages, from your plan or one line you type. Connect Claude Code or any agent by one URL." },
  { color: "var(--decide)", k: "A reviewer reads each one", d: "Ready, revise or blocked, before it reaches you." },
  { color: "var(--code)", k: "Code checks", d: "Unsourced claims, unfilled slots, length and opt-outs. A draft with an error waits with its fix. Every approval gets a signed receipt." },
  { color: "var(--human)", k: "You approve from your phone", d: "Approved posts run on your own X, Telegram channel and Slack. Messages to people open in WhatsApp or email, filled in: your tap sends." },
];

export default async function BetaPage(props: PageProps<"/beta">) {
  const params = await props.searchParams;
  const user = await sessionUser().catch(() => null);
  if (user) redirect(user.workspaceIds.length ? "/beta/desk" : "/beta/new");
  const { cfg } = betaCtx();
  const loginFailed = params.error === "login";

  return (
    <div className="wrap pb-20 pt-28 md:pt-32">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-16">
        <div className="lg:col-span-7">
          <p className="label flex items-center gap-3">
            <span className="dot" style={{ background: "var(--human)" }} />
            Private beta · Shonin GTM
          </p>
          <h1 className="mt-5 text-[clamp(40px,6.4vw,92px)] font-semibold leading-[0.92] tracking-[-0.05em]">
            Your agents run your go-to-market. <span className="serif text-human">Nothing leaves without your yes.</span>
          </h1>
        </div>
        {/* The card comes second, so a phone sees it right under the headline; on a wide screen it sits beside both. */}
        <div className="lg:col-span-5 lg:row-span-2 lg:pt-14">
          {loginFailed ? (
            <p role="alert" className="mb-4 rounded-2xl border border-human/40 px-4 py-3 text-base text-fg">
              That sign-in link has expired or was used. Send /login to the bot for a new one.
            </p>
          ) : null}
          {cfg.missing.length ? (
            <div className="card p-6">
              <p className="label">Not open yet</p>
              <p className="mt-3 text-base text-dim">The beta isn&apos;t configured on this deployment yet. Check back soon.</p>
            </div>
          ) : (
            <BetaSignup invite={cfg.gate === "invite"} />
          )}
        </div>
        <ul className="divide-y divide-line border-y border-line lg:col-span-7">
          {HOW.map((h) => (
            <li key={h.k} className="grid grid-cols-[20px_1fr] gap-3 py-5">
              <span className="dot mt-2 h-2.5 w-2.5" style={{ background: h.color }} />
              <div>
                <p className="text-[17px] font-medium">{h.k}</p>
                <p className="mt-1 text-base leading-relaxed text-dim">{h.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
