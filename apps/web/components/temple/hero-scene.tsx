"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { RefObject } from "react";

/*
 * The hero scene: an original, anime-style temple gate at dusk (night in the
 * dark theme). Everything is SVG with CSS custom properties, so both themes
 * repaint it. Parallax is tied to the hero's scroll and never follows the
 * pointer.
 */

// Deterministic stars (no Math.random, so server and client render the same).
const STARS = (() => {
  let s = 17;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 46 }, () => ({ x: r() * 1600, y: r() * 430, r: 0.6 + r() * 1.5, d: r() * 5 }));
})();

const WISPS = [
  { x: 930, y: 700, d: 0 },
  { x: 1010, y: 560, d: 1.2 },
  { x: 1300, y: 690, d: 2.1 },
  { x: 1190, y: 520, d: 3.4 },
  { x: 880, y: 800, d: 4.2 },
  { x: 1420, y: 780, d: 5 },
  { x: 1080, y: 850, d: 6.1 },
  { x: 1350, y: 600, d: 7.3 },
  { x: 800, y: 640, d: 8 },
];

const LEAVES = [
  { x: 1180, y: -30, d: 0, c: "var(--human)" },
  { x: 1420, y: -10, d: 3.2, c: "var(--write)" },
  { x: 980, y: -40, d: 6.1, c: "var(--human)" },
  { x: 1540, y: -20, d: 8.7, c: "var(--write)" },
  { x: 1300, y: -50, d: 11.4, c: "var(--human)" },
];

// A pine pad is a fan of needles opening upward, as in woodblock prints. Rounded for stable SSR output.
const NEEDLES = Array.from({ length: 15 }, (_, k) => {
  const a = Math.PI * (1.06 + (k / 14) * 0.88);
  return { x: +Math.cos(a).toFixed(3), y: +Math.sin(a).toFixed(3) };
});

const PINE = [
  { x: 1282, y: 150, r: 46 },
  { x: 1344, y: 130, r: 54 },
  { x: 1408, y: 104, r: 60 },
  { x: 1472, y: 80, r: 58 },
  { x: 1540, y: 60, r: 62 },
  { x: 1380, y: 150, r: 40 },
  { x: 1500, y: 108, r: 44 },
];

function Cloud({ x, y, s = 1, cls }: { x: number; y: number; s?: number; cls: string }) {
  return (
    <g className={cls}>
      <use href="#t-cloud" transform={`translate(${x} ${y}) scale(${s})`} />
    </g>
  );
}

function StoneLantern({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <circle cx="0" cy="818" r="60" fill="url(#t-glow)" className="t-flicker" />
      <rect x="-30" y="896" width="60" height="12" fill="var(--t-stone)" />
      <rect x="-10" y="846" width="20" height="52" fill="var(--t-stone)" />
      <rect x="-26" y="838" width="52" height="10" fill="var(--t-stone-lit)" />
      <rect x="-20" y="802" width="40" height="36" fill="var(--t-stone)" />
      <rect x="-11" y="810" width="22" height="20" fill="var(--t-lamp)" className="t-flicker" />
      <path d="M-40 804 Q-20 792 0 780 Q20 792 40 804 L32 806 L-32 806 Z" fill="var(--t-stone-lit)" />
      <circle cx="0" cy="774" r="6" fill="var(--t-stone-lit)" />
    </g>
  );
}

function Pagoda({ x, y }: { x: number; y: number }) {
  const tiers = [0, 1, 2, 3, 4];
  return (
    <g transform={`translate(${x} ${y})`} fill="var(--t-mtn-mid)">
      {tiers.map((i) => {
        const w = 58 - i * 7;
        const ty = -i * 26;
        return (
          <g key={i}>
            <rect x={-w / 2 + 8} y={ty - 16} width={w - 16} height="16" />
            <path d={`M${-w / 2 - 8} ${ty - 14} Q0 ${ty - 26} ${w / 2 + 8} ${ty - 14} L${w / 2} ${ty - 10} L${-w / 2} ${ty - 10} Z`} />
            <rect x="-4" y={ty - 12} width="8" height="6" fill="var(--t-lamp)" opacity="0.8" className="t-flicker" />
          </g>
        );
      })}
      <rect x="-1.5" y="-176" width="3" height="46" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="-5" y={-168 + i * 9} width="10" height="2" />
      ))}
    </g>
  );
}

function Gate() {
  const tiles = Array.from({ length: 54 }, (_, i) => 800 + i * 12);
  const lowTiles = Array.from({ length: 52 }, (_, i) => 830 + i * 11);
  const bal = Array.from({ length: 21 }, (_, i) => 860 + i * 26);
  const bracketsU = Array.from({ length: 16 }, (_, i) => 890 + i * 30);
  const bracketsL = Array.from({ length: 19 }, (_, i) => 856 + i * 30);
  return (
    <g>
      {/* the far view through the gate */}
      <rect x="1021" y="640" width="224" height="244" fill="url(#t-far)" />
      <path d="M1100 842 L1133 826 L1166 842 Z" fill="var(--t-mtn-mid)" />
      <rect x="1112" y="842" width="42" height="18" fill="var(--t-mtn-mid)" />
      <rect x="1127" y="846" width="12" height="10" fill="var(--t-lamp)" className="t-flicker" />

      {/* niō bays: lattice screens with a shadow behind, never a figure */}
      <rect x="896" y="700" width="99" height="182" fill="var(--t-wood-dark)" opacity="0.55" />
      <rect x="1271" y="700" width="99" height="182" fill="var(--t-wood-dark)" opacity="0.55" />
      <rect x="896" y="700" width="99" height="182" fill="url(#t-lattice)" />
      <rect x="1271" y="700" width="99" height="182" fill="url(#t-lattice)" />

      {/* lower storey */}
      {[870, 995, 1245, 1370].map((x) => (
        <g key={x}>
          <rect x={x} y="640" width="26" height="244" fill="var(--t-wood)" />
          <rect x={x + 19} y="640" width="7" height="244" fill="var(--t-wood-dark)" opacity="0.5" />
          <rect x={x - 5} y="876" width="36" height="10" fill="var(--t-stone-lit)" />
        </g>
      ))}
      <rect x="850" y="700" width="566" height="12" fill="var(--t-wood-dark)" />
      <rect x="845" y="640" width="576" height="20" fill="var(--t-wood)" />
      {bracketsL.map((x) => (
        <rect key={x} x={x} y="622" width="16" height="18" fill="var(--t-wood-dark)" />
      ))}
      <path d="M760 594 Q792 616 834 618 L1432 618 Q1474 616 1506 594 L1410 568 L856 568 Z" fill="var(--t-roof)" />
      {lowTiles.map((x) => (
        <line key={x} x1={x} y1="574" x2={x} y2="614" stroke="var(--t-roof-line)" strokeWidth="1.2" />
      ))}

      {/* balcony and upper storey */}
      <rect x="850" y="560" width="566" height="8" fill="var(--t-wood-dark)" />
      {bal.map((x) => (
        <rect key={x} x={x} y="540" width="4" height="22" fill="var(--t-wood-lit)" />
      ))}
      <rect x="850" y="536" width="566" height="6" fill="var(--t-wood-lit)" />
      {[900, 1015, 1233, 1348].map((x) => (
        <rect key={x} x={x} y="470" width="18" height="68" fill="var(--t-wood)" />
      ))}
      {(
        [
          [918, 97],
          [1251, 97],
        ] as const
      ).map(([x, w]) => (
        <g key={x}>
          <rect x={x} y="478" width={w} height="56" fill="var(--t-paper-3)" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={x + 6 + i * 10} y="482" width="3" height="48" fill="var(--t-wood-dark)" />
          ))}
        </g>
      ))}
      <rect x="1033" y="478" width="200" height="56" fill="var(--t-wood-dark)" opacity="0.8" />
      {/* the plaque */}
      <rect x="1082" y="480" width="102" height="48" rx="3" fill="var(--t-wood-dark)" stroke="var(--t-gold)" strokeWidth="2" />
      <text x="1133" y="515" textAnchor="middle" className="t-kanji" fontSize="27" fill="var(--t-gold)">
        山門
      </text>
      <rect x="880" y="460" width="506" height="12" fill="var(--t-wood)" />
      {bracketsU.map((x) => (
        <rect key={x} x={x} y="444" width="16" height="16" fill="var(--t-wood-dark)" />
      ))}
      <path d="M700 436 Q742 472 800 474 L1466 474 Q1524 472 1566 436 L1414 386 L1374 340 L892 340 L852 386 Z" fill="var(--t-roof)" />
      {tiles.map((x) => (
        <line key={x} x1={x} y1="388" x2={x} y2="470" stroke="var(--t-roof-line)" strokeWidth="1.3" />
      ))}
      <rect x="884" y="330" width="498" height="12" rx="3" fill="var(--t-roof)" />
      <path d="M880 342 Q866 318 878 300 Q896 318 904 336 Z" fill="var(--t-roof)" />
      <path d="M1386 342 Q1400 318 1388 300 Q1370 318 1362 336 Z" fill="var(--t-roof)" />

      {/* the big lantern, with the woven mark */}
      <g className="t-sway">
        <circle cx="1133" cy="740" r="150" fill="url(#t-glow)" className="t-flicker" />
        <line x1="1133" y1="660" x2="1133" y2="676" stroke="var(--t-wood-dark)" strokeWidth="3" />
        <rect x="1090" y="672" width="86" height="12" rx="3" fill="#141311" />
        <rect x="1080" y="682" width="106" height="124" rx="42" fill="var(--t-lantern)" />
        {[700, 720, 740, 760, 780].map((y) => (
          <line key={y} x1="1084" y1={y} x2="1182" y2={y} stroke="rgba(0,0,0,.16)" strokeWidth="1.4" />
        ))}
        <rect x="1090" y="804" width="86" height="12" rx="3" fill="#141311" />
        <g transform="translate(1113 724)" stroke="#141311" strokeWidth="2.6" strokeLinecap="round">
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2, 3].map((c) =>
              (r + c) % 2 === 0 ? (
                <line key={`${r}${c}`} x1={c * 12 - 3} y1={r * 12} x2={c * 12 + 3} y2={r * 12} />
              ) : (
                <line key={`${r}${c}`} x1={c * 12} y1={r * 12 - 3} x2={c * 12} y2={r * 12 + 3} />
              ),
            ),
          )}
        </g>
      </g>

      {/* platform and steps */}
      <rect x="800" y="882" width="666" height="24" fill="var(--t-stone)" />
      <rect x="800" y="882" width="666" height="3" fill="var(--t-stone-lit)" />
      <rect x="1040" y="904" width="186" height="14" fill="var(--t-stone-lit)" />
      <rect x="1020" y="916" width="226" height="14" fill="var(--t-stone)" />
    </g>
  );
}

function Layer({ y, children }: { y: MotionValue<number> | 0; children: React.ReactNode }) {
  return <motion.g style={y === 0 ? undefined : { y }}>{children}</motion.g>;
}

export function HeroScene({ target }: { target: RefObject<HTMLElement | null> }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end start"] });
  const far = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const mid = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const near = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const sky = useTransform(scrollYProgress, [0, 1], [0, 190]);
  const pick = (v: MotionValue<number>) => (reduce ? 0 : v);

  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="t-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--t-sky-1)" }} />
          <stop offset="0.42" style={{ stopColor: "var(--t-sky-2)" }} />
          <stop offset="0.74" style={{ stopColor: "var(--t-sky-3)" }} />
          <stop offset="1" style={{ stopColor: "var(--t-sky-4)" }} />
        </linearGradient>
        <radialGradient id="t-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" style={{ stopColor: "var(--t-sun-glow)" }} />
          <stop offset="1" style={{ stopColor: "var(--t-sun-glow)", stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="t-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" style={{ stopColor: "var(--t-lamp-glow)" }} />
          <stop offset="1" style={{ stopColor: "var(--t-lamp-glow)", stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="t-mistg" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" style={{ stopColor: "var(--t-mist)" }} />
          <stop offset="1" style={{ stopColor: "var(--t-mist)", stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="t-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--t-sky-3)" }} />
          <stop offset="1" style={{ stopColor: "var(--t-sky-4)" }} />
        </linearGradient>
        <linearGradient id="t-fadeup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--t-mtn-far)" }} />
          <stop offset="1" style={{ stopColor: "var(--t-mtn-far)", stopOpacity: 0.35 }} />
        </linearGradient>
        <pattern id="t-lattice" width="16.5" height="16.5" patternUnits="userSpaceOnUse">
          <path d="M0 0H16.5V16.5H0Z M8.25 0V16.5 M0 8.25H16.5" fill="none" stroke="var(--t-wood-lit)" strokeWidth="1.3" opacity="0.8" />
        </pattern>
        <symbol id="t-cloud" viewBox="0 0 520 230" width="520" height="230" overflow="visible">
          <g fill="var(--t-cloud-shade)" transform="translate(12 16)">
            <circle cx="80" cy="150" r="62" />
            <circle cx="170" cy="112" r="84" />
            <circle cx="284" cy="86" r="104" />
            <circle cx="392" cy="112" r="80" />
            <circle cx="466" cy="156" r="54" />
            <rect x="60" y="150" width="420" height="64" rx="32" />
          </g>
          <g fill="var(--t-cloud-lit)">
            <circle cx="80" cy="150" r="62" />
            <circle cx="170" cy="112" r="84" />
            <circle cx="284" cy="86" r="104" />
            <circle cx="392" cy="112" r="80" />
            <circle cx="466" cy="156" r="54" />
            <rect x="60" y="150" width="420" height="56" rx="28" />
          </g>
          <path d="M112 96 A84 84 0 0 1 226 44 M200 22 A104 104 0 0 1 350 14" fill="none" stroke="var(--t-cloud-rim)" strokeWidth="5" strokeLinecap="round" />
        </symbol>
        <path id="t-leaf" d="M0 -9 L2.4 -3.2 L8.6 -4.4 L4.6 0.6 L7.6 6.2 L1.6 4.2 L0 9 L-1.6 4.2 L-7.6 6.2 L-4.6 0.6 L-8.6 -4.4 L-2.4 -3.2 Z" />
      </defs>

      {/* sky */}
      <rect width="1600" height="1000" fill="url(#t-sky)" />
      <g className="t-stars">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--t-sun)" className="t-twinkle" style={{ animationDelay: `${s.d}s` }} />
        ))}
      </g>

      <Layer y={pick(sky)}>
        <circle cx="1210" cy="300" r="440" fill="url(#t-sun)" />
        <g className="t-rays" opacity="0.9">
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            const b = a + 0.07;
            return (
              <polygon
                key={i}
                // Rounded, so the server and the browser print the same numbers.
                points={`1210,300 ${(1210 + Math.cos(a) * 1400).toFixed(1)},${(300 + Math.sin(a) * 1400).toFixed(1)} ${(1210 + Math.cos(b) * 1400).toFixed(1)},${(300 + Math.sin(b) * 1400).toFixed(1)}`}
                fill="var(--t-ray)"
              />
            );
          })}
        </g>
        <circle cx="1210" cy="300" r="64" fill="var(--t-sun)" />
        <Cloud x={40} y={110} s={1.05} cls="t-drift-a" />
        <Cloud x={700} y={40} s={0.7} cls="t-drift-b" />
        <Cloud x={1280} y={150} s={0.62} cls="t-drift-c" />
      </Layer>

      {/* far mountains in ink wash */}
      <Layer y={pick(far)}>
        <path
          d="M0 640 C80 600 130 540 210 520 C280 500 320 560 380 548 C460 532 500 470 580 460 C660 452 700 540 780 548 C860 556 900 500 980 492 C1060 486 1110 560 1190 566 C1270 572 1320 500 1400 494 C1480 488 1540 540 1600 548 L1600 1000 L0 1000 Z"
          fill="url(#t-fadeup)"
        />
        <ellipse cx="420" cy="660" rx="620" ry="70" fill="url(#t-mistg)" className="t-mist" />
      </Layer>

      <Layer y={pick(mid)}>
        <path d="M0 740 C110 670 220 700 320 640 C420 580 520 620 600 604 C700 584 760 660 860 676 L1600 700 L1600 1000 L0 1000 Z" fill="var(--t-mtn-mid)" />
        <Pagoda x={640} y={608} />
        {(
          [
            [40, 150],
            [78, 120],
            [120, 170],
            [168, 110],
            [214, 140],
            [470, 96],
            [505, 128],
            [540, 90],
          ] as const
        ).map(([x, h]) => (
          <path key={x} d={`M${x} ${760 - h} L${x + 16} 760 L${x - 16} 760 Z`} fill="var(--t-tree)" opacity="0.9" />
        ))}
        <Cloud x={1180} y={420} s={0.7} cls="t-drift-b" />
        <ellipse cx="1060" cy="820" rx="760" ry="60" fill="url(#t-mistg)" className="t-mist" style={{ animationDelay: "-20s" }} />
      </Layer>

      <Layer y={pick(near)}>
        <path d="M0 850 C160 790 300 826 440 806 C580 786 690 846 800 880 L1600 896 L1600 1000 L0 1000 Z" fill="var(--t-mtn-near)" />
        <Gate />
        <StoneLantern x={740} />
        <StoneLantern x={1530} />
        {/* the path to the gate, and one pilgrim on it */}
        <path d="M972 1000 L1294 1000 L1226 930 L1040 930 Z" fill="var(--t-stone-lit)" />
        {[948, 968, 988].map((y, i) => (
          <line key={y} x1={1030 - i * 10} y1={y} x2={1236 + i * 10} y2={y} stroke="var(--t-stone)" strokeWidth="2" />
        ))}
        <g transform="translate(1133 936)" fill="var(--t-roof)">
          <path d="M-30 -2 L30 -2 L0 -20 Z" />
          <path d="M-13 -2 L13 -2 L18 44 L-18 44 Z" />
          <rect x="21" y="-12" width="3" height="58" rx="1.5" />
        </g>
        {WISPS.map((w, i) => (
          <g key={i} className="t-wisp" style={{ animationDelay: `-${w.d}s` }}>
            <circle cx={w.x} cy={w.y} r="13" fill="url(#t-glow)" />
            <circle cx={w.x} cy={w.y} r="3" fill="var(--t-lamp)" />
          </g>
        ))}
      </Layer>

      {/* foreground: a pine branch in the woodblock style, and a few falling leaves */}
      <g className="t-branch">
        <path
          d="M1600 30 C1520 44 1460 70 1400 110 C1360 136 1320 150 1270 154 L1272 160 C1330 160 1372 144 1414 118 C1470 84 1530 64 1600 56 Z"
          fill="var(--t-tree)"
        />
        {PINE.map((c) => (
          <g key={c.x} transform={`translate(${c.x} ${c.y})`} stroke="var(--t-tree)" strokeLinecap="round">
            {NEEDLES.map((n, k) => (
              <line key={k} x1="0" y1="2" x2={(n.x * c.r).toFixed(1)} y2={(n.y * c.r * 0.5).toFixed(1)} strokeWidth={2.4} />
            ))}
            {NEEDLES.map((n, k) => (
              <line key={`i${k}`} x1={(n.x * c.r * 0.2).toFixed(1)} y1="6" x2={(n.x * c.r * 0.72).toFixed(1)} y2={(n.y * c.r * 0.34 + 4).toFixed(1)} strokeWidth={2} opacity="0.7" />
            ))}
          </g>
        ))}
      </g>
      {LEAVES.map((l, i) => (
        <use key={i} href="#t-leaf" x={l.x} y={l.y} fill={l.c} className="t-leaf" style={{ animationDelay: `${l.d}s` }} />
      ))}
    </svg>
  );
}
