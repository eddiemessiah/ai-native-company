import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BetaOnboarding } from "@/components/beta/onboarding";
import { sessionUser } from "@/lib/beta";

export const metadata: Metadata = {
  title: "New workspace",
  robots: { index: false },
};

export default async function BetaNewPage() {
  const user = await sessionUser().catch(() => null);
  if (!user) redirect("/beta");
  const full = user.workspaceIds.length >= 3;

  return (
    <div className="wrap max-w-4xl pb-20 pt-28 md:pt-32">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label">Private beta · new workspace</p>
        {user.workspaceIds.length ? (
          <Link href="/beta/desk" className="font-mono text-[13px] text-dim underline decoration-line-2 underline-offset-4 hover:text-fg">
            Back to the desk
          </Link>
        ) : null}
      </div>
      <h1 className="mt-5 text-[clamp(34px,5vw,64px)] font-semibold leading-[0.95] tracking-[-0.045em]">
        {user.workspaceIds.length ? "Another product?" : `Welcome, ${user.name.split(" ")[0]}.`} <span className="serif text-write">Describe it.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-dim md:text-lg">
        An LLM writes your plan, your ideal-customer scorecard and three first drafts. A reviewer reads each draft, code checks them, and they land on
        your Desk for your yes. Nothing is sent from here.
      </p>
      <div className="mt-10">
        {full ? (
          <div className="card p-6">
            <p className="text-base text-dim">The beta allows three workspaces per person, and you have three.</p>
          </div>
        ) : (
          <BetaOnboarding />
        )}
      </div>
    </div>
  );
}
