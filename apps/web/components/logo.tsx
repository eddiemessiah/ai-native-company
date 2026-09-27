/**
 * The mark: a 4×4 plain weave. Every cell is a thread crossing; one cell is a
 * decision (indigo). Strip cloth is made of narrow woven units sewn together,
 * the way the firm is made of units of work.
 */
export function Mark({ className = "h-7 w-7" }: { className?: string }) {
  const cells: { x: number; y: number; over: boolean; accent: boolean }[] = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      cells.push({ x, y, over: (x + y) % 2 === 0, accent: x === 2 && y === 1 });
    }
  }
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="8" fill="none" stroke="currentColor" strokeOpacity="0.25" />
      {cells.map((c) => {
        const cx = 6 + c.x * 6.66;
        const cy = 6 + c.y * 6.66;
        const color = c.accent ? "var(--decide)" : "currentColor";
        return c.over ? (
          <rect key={`${c.x}${c.y}`} x={cx - 2.6} y={cy - 1.1} width={5.2} height={2.2} rx={1.1} fill={color} />
        ) : (
          <rect key={`${c.x}${c.y}`} x={cx - 1.1} y={cy - 2.6} width={2.2} height={5.2} rx={1.1} fill={color} opacity={c.accent ? 1 : 0.55} />
        );
      })}
    </svg>
  );
}

export function Wordmark({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark />
      <span className="text-[19px] font-semibold tracking-[-0.04em]">{name}</span>
    </span>
  );
}
