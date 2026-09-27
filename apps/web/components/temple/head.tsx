/** A temple section header: a vertical kanji and its reading, then the eyebrow, title and lede. */
export function TempleHead({
  kanji,
  reading,
  eyebrow,
  title,
  lede,
  id,
  className = "",
}: {
  kanji: string;
  reading: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <header className={`grid gap-5 md:grid-cols-[76px_1fr] md:gap-8 ${className}`}>
      <div className="flex items-center gap-3 md:h-0 md:flex-col md:items-center md:gap-4" aria-hidden="true">
        <span lang="ja" className="t-kanji whitespace-nowrap text-[26px] leading-[1.15] text-human md:text-[30px] md:[writing-mode:vertical-rl]">
          {kanji}
        </span>
        <span className="h-px w-8 bg-line-2 md:h-8 md:w-px" />
        <span className="whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint md:[writing-mode:vertical-rl]">{reading}</span>
      </div>
      <div>
        <p className="label">{eyebrow}</p>
        <h2 id={id} className="mt-4 text-[clamp(34px,5vw,66px)] font-semibold leading-[0.98]">
          {title}
        </h2>
        {lede ? <p className="mt-5 max-w-2xl text-lg leading-relaxed text-dim">{lede}</p> : null}
      </div>
    </header>
  );
}
