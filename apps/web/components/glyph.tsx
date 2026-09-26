/**
 * A woven glyph per offer, generated from its slug: a 5×5 mirrored weave
 * in the spirit of adinkra and nsibidi marks. Same slug, same glyph, forever.
 */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Cell = 0 | 1 | 2 | 3; // empty, weft (horizontal), warp (vertical), knot

export function Glyph({
  seed,
  size = 56,
  accent = "var(--decide)",
  muted = false,
  className = "",
}: {
  seed: string;
  size?: number;
  accent?: string;
  muted?: boolean;
  className?: string;
}) {
  const rand = rng(hash(seed));
  const grid: Cell[][] = [];
  for (let y = 0; y < 5; y++) {
    const half: Cell[] = [];
    for (let x = 0; x < 3; x++) {
      const r = rand();
      half.push(r < 0.18 ? 0 : r < 0.55 ? 1 : r < 0.88 ? 2 : 3);
    }
    grid.push([half[0]!, half[1]!, half[2]!, half[1]!, half[0]!]);
  }
  grid[2]![2] = 3;
  const accentRow = 1 + Math.floor(rand() * 3);
  const accentCol = Math.floor(rand() * 2);
  const step = 20;
  const pad = 10;

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <rect x="1" y="1" width="118" height="118" rx="26" fill="none" stroke="currentColor" strokeOpacity={0.14} />
      {grid.map((row, y) =>
        row.map((cell, x) => {
          if (cell === 0) return null;
          const cx = pad + 10 + x * step;
          const cy = pad + 10 + y * step;
          const isAccent = y === accentRow && (x === accentCol || x === 4 - accentCol);
          const fill = isAccent && !muted ? accent : "currentColor";
          const opacity = isAccent ? 1 : muted ? 0.35 : 0.82;
          if (cell === 1) return <rect key={`${x}-${y}`} x={cx - 8} y={cy - 2.6} width={16} height={5.2} rx={2.6} fill={fill} opacity={opacity} />;
          if (cell === 2) return <rect key={`${x}-${y}`} x={cx - 2.6} y={cy - 8} width={5.2} height={16} rx={2.6} fill={fill} opacity={opacity} />;
          return <circle key={`${x}-${y}`} cx={cx} cy={cy} r={3.6} fill={fill} opacity={opacity} />;
        }),
      )}
    </svg>
  );
}
