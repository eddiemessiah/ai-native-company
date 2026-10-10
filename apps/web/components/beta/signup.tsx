"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "@/lib/beta-client";
import { Arrow } from "../bits";

export function BetaSignup({ invite }: { invite: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      await post("/api/beta/signup", { name, ...(email ? { email } : {}), ...(invite ? { invite: code } : {}) });
      router.push("/beta/new");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPending(false);
    }
  }

  return (
    <form
      className="card space-y-5 p-6 md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <p className="label">Join the beta</p>
        <p className="mt-2 text-base text-dim">Free while it&apos;s in beta. About a minute to your first plan.</p>
      </div>
      <div>
        <label htmlFor="beta-name" className="mb-2 block font-mono text-xs text-dim">
          Your name
        </label>
        <input id="beta-name" className="field h-12 text-base" required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="beta-email" className="mb-2 block font-mono text-xs text-dim">
          Email (optional)
        </label>
        <input id="beta-email" type="email" className="field h-12 text-base" maxLength={200} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {invite ? (
        <div>
          <label htmlFor="beta-invite" className="mb-2 block font-mono text-xs text-dim">
            Invite code
          </label>
          <input id="beta-invite" className="field h-12 text-base" required maxLength={200} autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-solid h-12 w-full justify-center px-6 disabled:opacity-60">
        {pending ? "Opening your desk…" : "Start"} <Arrow />
      </button>
      {error ? (
        <p role="alert" className="text-base text-human">
          {error}
        </p>
      ) : null}
      <p className="font-mono text-[12px] leading-relaxed text-faint">
        No password. This device stays signed in for 30 days; link Telegram on the Desk to sign in on another one.
      </p>
    </form>
  );
}
