import Link from "next/link";
import { Arrow } from "@/components/bits";

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[80svh] flex-col justify-center pt-24">
      <p className="label">404 · choice → other · 0.98</p>
      <h1 className="mt-6 text-[clamp(48px,9vw,140px)] font-semibold leading-[0.88] tracking-[-0.06em]">
        Nothing fits <span className="serif text-dim">here.</span>
      </h1>
      <p className="mt-6 max-w-lg text-lg text-dim">That&apos;s why every question needs an &ldquo;other&rdquo; option. Try the directory, or tell us what you were looking for.</p>
      <div className="mt-9 flex gap-3">
        <Link href="/directory" className="btn btn-solid">
          Directory <Arrow />
        </Link>
        <Link href="/start" className="btn">
          Start a job
        </Link>
      </div>
    </div>
  );
}
