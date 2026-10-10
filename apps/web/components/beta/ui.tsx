/** Small shared pieces for the beta's client screens. */

export const MEANING = { write: "var(--write)", decide: "var(--decide)", code: "var(--code)", human: "var(--human)" } as const;

/** A stable time label (UTC), so the server render and the browser agree. */
export function when(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

export function Section({ id, label, title, children, aside }: { id?: string; label: string; title?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24" aria-labelledby={id ? `${id}-h` : undefined}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">{label}</p>
          {title ? (
            <h2 id={id ? `${id}-h` : undefined} className="mt-2 text-[22px] font-semibold tracking-[-0.02em]">
              {title}
            </h2>
          ) : null}
        </div>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Field({ label, id, children, hint }: { label: string; id: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-xs text-dim">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 font-mono text-[12px] text-faint">{hint}</p> : null}
    </div>
  );
}

export const btn = "btn h-11 justify-center px-4 disabled:opacity-50";
export const btnApprove = "btn h-11 justify-center px-4 !border-human bg-human font-medium text-[#0b0b0a] hover:!bg-transparent hover:text-fg disabled:opacity-50";
export const btnSolid = "btn btn-solid h-11 justify-center px-5 disabled:opacity-50";
export const fieldBase = "field text-base";
