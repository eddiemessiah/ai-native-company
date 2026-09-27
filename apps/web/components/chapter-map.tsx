import type { Chapter } from "@repo/catalog";

/**
 * Africa as a dot matrix, with study-group chapters on it. The land mask is
 * the one from the founder's portfolio globe: rows are 3.6° bands from 37°N,
 * columns 3.4° steps from 17°W, each row a list of inclusive column ranges.
 */
const MASK: readonly (readonly (readonly [number, number])[])[] = [
  [[2, 8]], [[2, 14]], [[1, 14]], [[0, 15]], [[0, 15]], [[0, 16]], [[0, 17]], [[1, 19]], [[2, 18]], [[8, 18]],
  [[8, 17]], [[9, 16]], [[9, 16]], [[9, 16]], [[9, 16], [18, 19]], [[9, 15], [18, 19]], [[9, 15], [18, 19]],
  [[9, 14], [18, 18]], [[10, 14]], [[10, 13]],
];

const LAT0 = 37;
const LON0 = -17;
const ROW_DEG = 3.6;
const COL_DEG = 3.4;
const SCALE = 6.2;
const LON_MIN = -20;
const LAT_MAX = 39;

const x = (lon: number) => (lon - LON_MIN) * SCALE;
const y = (lat: number) => (LAT_MAX - lat) * SCALE;

function dots(): { cx: number; cy: number }[] {
  const out: { cx: number; cy: number }[] = [];
  MASK.forEach((ranges, r) => {
    for (const [c0, c1] of ranges) {
      for (let c = c0; c <= c1; c++) {
        for (const dy of [0.25, 0.75]) {
          for (const dx of [0.25, 0.75]) {
            out.push({ cx: x(LON0 + (c + dx) * COL_DEG), cy: y(LAT0 - (r + dy) * ROW_DEG) });
          }
        }
      }
    }
  });
  return out;
}

export function ChapterMap({ chapters }: { chapters: readonly Chapter[] }) {
  const land = dots();
  const africa = chapters.filter((c) => c.lon > -20 && c.lon < 55 && c.lat < 38 && c.lat > -36);
  const abroad = chapters.filter((c) => !africa.includes(c));
  const width = x(55);
  const height = y(-37);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <figure className="relative lg:col-span-8">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Map of AI Study Group chapters across Africa">
          {land.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r={2.1} fill="currentColor" opacity={0.2} />
          ))}
          {africa.map((c) => {
            const active = c.status === "active";
            return (
              <g key={c.city} transform={`translate(${x(c.lon)} ${y(c.lat)})`}>
                {active ? (
                  <circle r={11} fill="none" stroke="var(--live)" strokeOpacity={0.5}>
                    <animate attributeName="r" values="5;14;5" dur="3.2s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="3.2s" repeatCount="indefinite" />
                  </circle>
                ) : null}
                <circle r={active ? 4.2 : 3.2} fill={active ? "var(--live)" : "var(--bg)"} stroke={active ? "none" : "var(--fg)"} strokeWidth={1.2} />
              </g>
            );
          })}
        </svg>
        <figcaption className="mt-3 font-mono text-[11px] text-faint">
          Land mask from the founder&apos;s portfolio globe · filled dots have hosted workshops
        </figcaption>
      </figure>
      <div className="lg:col-span-4">
        <ul className="divide-y divide-line border-y border-line">
          {chapters.map((c) => (
            <li key={c.city} className="flex items-center justify-between gap-4 py-2.5">
              <span className="flex items-center gap-2.5">
                <span className="dot" style={{ background: c.status === "active" ? "var(--live)" : "var(--line-2)" }} />
                <span className="text-[15px]">{c.city}</span>
                <span className="font-mono text-[11px] text-faint">{c.country}</span>
              </span>
              <span className="text-right font-mono text-[11px] text-faint">{c.status === "active" ? "active" : "lead wanted"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-mono text-[11px] leading-relaxed text-faint">
          {abroad.length} diaspora chapters ({abroad.map((c) => c.city).join(", ")}) meet online in Lagos-friendly hours.
        </p>
      </div>
    </div>
  );
}
