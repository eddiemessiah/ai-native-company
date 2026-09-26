import Link from "next/link";
import { brand, categories } from "@repo/catalog";
import { Mark } from "./logo";

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-line">
      <div className="wrap grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <Mark className="h-9 w-9" />
            <span className="text-2xl font-semibold tracking-[-0.04em]">{brand.name}</span>
          </div>
          <p className="mt-5 max-w-sm text-dim">{brand.story}</p>
          <p className="mt-6 font-mono text-xs text-faint">
            Built by agents. Owned by people. {brand.locale.home} → everywhere.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
          <div>
            <p className="label">Directory</p>
            <ul className="mt-4 space-y-2.5 text-sm text-dim">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link className="hover:text-fg" href={`/directory?c=${c.id}`}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">Company</p>
            <ul className="mt-4 space-y-2.5 text-sm text-dim">
              <li><Link className="hover:text-fg" href="/company">How we work</Link></li>
              <li><Link className="hover:text-fg" href="/study">AI Study Group</Link></li>
              <li><Link className="hover:text-fg" href="/research">Research</Link></li>
              <li><Link className="hover:text-fg" href="/start">Start a job</Link></li>
            </ul>
          </div>
          <div>
            <p className="label">Machines</p>
            <ul className="mt-4 space-y-2.5 font-mono text-[13px] text-dim">
              <li><Link className="hover:text-fg" href="/agents">API docs</Link></li>
              <li><a className="hover:text-fg" href="/llms.txt">llms.txt</a></li>
              <li><a className="hover:text-fg" href="/.well-known/agent-card.json">agent-card.json</a></li>
              <li><a className="hover:text-fg" href="/api/v1/catalog">catalog.json</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="wrap flex flex-col gap-3 border-t border-line py-6 font-mono text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} {brand.name}. {brand.founder.based}.</span>
        <span className="flex gap-5">
          <a className="hover:text-fg" href={brand.founder.x} target="_blank" rel="noreferrer">X</a>
          <a className="hover:text-fg" href={brand.founder.github} target="_blank" rel="noreferrer">GitHub</a>
          <a className="hover:text-fg" href={brand.founder.telegram} target="_blank" rel="noreferrer">Telegram</a>
        </span>
      </div>
    </footer>
  );
}
