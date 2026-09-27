/*
 * The dragon: an original Eastern dragon drawn on a canvas, chasing a flaming
 * pearl between four stations. The pearl is the visitor's job; the stations are
 * the four steps of how Shonin works. A follow-the-leader spine gives the body
 * its serpentine motion, and a roll value travels down the spine so the belly
 * turns over when the dragon changes direction. Colours come from the temple
 * tokens in temple.css, so both themes repaint it.
 */

export interface Palette {
  body: string;
  scale: string;
  belly: string;
  mane: string;
  line: string;
  eye: string;
  pearl: string;
  glow: string;
  cloud: string;
  cloudLine: string;
  fg: string;
  steps: [string, string, string, string];
  dark: boolean;
}

export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    body: v("--t-dragon-body", "#26356b"),
    scale: v("--t-dragon-scale", "#8a96ff"),
    belly: v("--t-dragon-belly", "#c9a24e"),
    mane: v("--t-dragon-mane", "#ff5a36"),
    line: v("--t-dragon-line", "#05060d"),
    eye: v("--t-dragon-eye", "#ffb000"),
    pearl: v("--t-pearl", "#fff1cf"),
    glow: v("--t-lamp-glow", "rgba(255,176,0,.42)"),
    cloud: v("--t-cloud-ink", "rgba(237,232,220,.14)"),
    cloudLine: v("--t-cloud-ink-line", "rgba(237,232,220,.32)"),
    fg: v("--fg", "#ede8dc"),
    steps: [v("--fg", "#ede8dc"), v("--write", "#ffb000"), v("--decide", "#7480ff"), v("--human", "#ff5a36")],
    dark: v("--t-stars", "1") === "1",
  };
}

/** Where the pearl rests for each step, as fractions of the art area. */
const STATIONS: readonly (readonly [number, number])[] = [
  [0.18, 0.28],
  [0.76, 0.2],
  [0.26, 0.76],
  [0.78, 0.7],
];

const NUMERALS = ["一", "二", "三", "四"];

const CLOUDS = [
  { x: 0.05, y: 0.16, s: 1.1, v: 0.006, front: false },
  { x: 0.55, y: 0.08, s: 0.8, v: 0.009, front: false },
  { x: 0.8, y: 0.46, s: 1.25, v: 0.005, front: false },
  { x: 0.3, y: 0.58, s: 0.9, v: 0.008, front: false },
  { x: 0.62, y: 0.9, s: 1.5, v: 0.011, front: true },
  { x: 0.12, y: 0.95, s: 1.2, v: 0.013, front: true },
] as const;

/** The sharpest bend between two body segments, in radians. */
const MAX_BEND = 0.3;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class DragonEngine {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private wide = true;
  private unit = 12;
  private seg = 6;
  private ax = 0;
  private ay = 0;
  private aw = 0;
  private ah = 0;
  private n: number;
  private xs: Float64Array;
  private ys: Float64Array;
  private roll: Float64Array;
  private tx: Float64Array;
  private ty: Float64Array;
  private wd: Float64Array;
  private vx = 1;
  private vy = 0;
  private px = 0;
  private py = 0;
  private bx = 0;
  private by = 0;
  private t = 0;
  private lungeUntil = 0;
  private arrivedAt = -10;
  private active = 0;
  private headRoll = 1;
  private placed = false;
  palette: Palette;

  constructor(
    private canvas: HTMLCanvasElement,
    segments: number,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.ctx = ctx;
    this.n = segments;
    this.xs = new Float64Array(segments);
    this.ys = new Float64Array(segments);
    this.roll = new Float64Array(segments).fill(1);
    this.tx = new Float64Array(segments);
    this.ty = new Float64Array(segments);
    this.wd = new Float64Array(segments);
    this.palette = readPalette();
  }

  resize(width: number, height: number, wide: boolean) {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = width;
    this.h = height;
    this.wide = wide;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.ax = wide ? width * 0.5 : width * 0.1;
    this.aw = wide ? width * 0.44 : width * 0.8;
    this.ay = wide ? height * 0.16 : height * 0.14;
    this.ah = wide ? height * 0.7 : height * 0.72;
    this.unit = Math.max(7, Math.min(18, Math.min(this.aw, this.ah) * 0.034));
    this.seg = this.unit * 0.54;
    if (!this.placed) this.place();
  }

  setActive(step: number) {
    if (step === this.active) return;
    this.active = step;
    this.lungeUntil = this.t + 1.5;
  }

  private station(i: number): [number, number] {
    const s = STATIONS[i] ?? STATIONS[0]!;
    return [this.ax + s[0] * this.aw, this.ay + s[1] * this.ah];
  }

  /** Lay the body out as a loose coil in the middle of the art area, head first. */
  private place() {
    const [sx, sy] = this.station(this.active);
    this.px = this.bx = sx;
    this.py = this.by = sy;
    const cx = this.ax + this.aw * 0.5;
    const cy = this.ay + this.ah * 0.5;
    for (let i = 0; i < this.n; i++) {
      const a = -i * 0.085;
      const r = Math.min(this.aw, this.ah) * (0.36 - i * 0.0018);
      this.xs[i] = cx + Math.cos(a) * r;
      this.ys[i] = cy + Math.sin(a) * r * 0.62;
    }
    this.placed = true;
  }

  /** Run the simulation without drawing, so the first frame already has a shape. */
  warm(seconds: number) {
    const steps = Math.round(seconds * 60);
    for (let i = 0; i < steps; i++) this.step(1 / 60);
  }

  step(dt: number) {
    const { unit, seg, n, xs, ys, roll } = this;
    this.t += dt;
    const t = this.t;

    // The pearl glides to the active station and bobs there.
    const [sx, sy] = this.station(this.active);
    const k = 1 - Math.exp(-dt * 2.4);
    this.bx += (sx - this.bx) * k;
    this.by += (sy - this.by) * k;
    this.px = this.bx + Math.sin(t * 1.3) * unit * 0.4;
    this.py = this.by + Math.cos(t * 1.1) * unit * 0.5;
    if (Math.hypot(sx - this.bx, sy - this.by) < unit * 0.8 && this.arrivedAt < this.lungeUntil - 1.5) this.arrivedAt = t;

    // The head swoops to the pearl when the step changes, then weaves a figure eight around it.
    const lunging = t < this.lungeUntil;
    // Keep the head inside the art area, so it never leaves the frame or crosses the text.
    const gx = clamp(lunging ? this.px + unit * 1.6 : this.px + Math.sin(t * 0.5) * this.aw * 0.24, this.ax + unit * 2, this.ax + this.aw - unit * 3.5);
    const gy = clamp(lunging ? this.py - unit * 1.4 : this.py + Math.sin(t * 1.0) * this.ah * 0.17, this.ay + unit * 2, this.ay + this.ah - unit * 2);
    const dx = gx - xs[0]!;
    const dy = gy - ys[0]!;
    const dist = Math.hypot(dx, dy) || 1;
    const top = unit * (lunging ? 24 : 15);
    const speed = top * (0.35 + 0.65 * Math.min(1, dist / (unit * 8)));
    const swing = Math.sin(t * 2.8) * 0.42;
    const c = Math.cos(swing);
    const s = Math.sin(swing);
    const ux = dx / dist;
    const uy = dy / dist;
    const kv = Math.min(1, dt * 2.6);
    this.vx += ((ux * c - uy * s) * speed - this.vx) * kv;
    this.vy += ((ux * s + uy * c) * speed - this.vy) * kv;
    xs[0] = xs[0]! + this.vx * dt;
    ys[0] = ys[0]! + this.vy * dt;

    // Follow the leader: every segment keeps its length to the one ahead, and bends at most
    // MAX_BEND from it, so the body never folds tighter than its own width.
    for (let i = 1; i < n; i++) {
      let ex = xs[i]! - xs[i - 1]!;
      let ey = ys[i]! - ys[i - 1]!;
      const d = Math.hypot(ex, ey) || 1;
      ex /= d;
      ey /= d;
      if (i >= 2) {
        let fx = xs[i - 1]! - xs[i - 2]!;
        let fy = ys[i - 1]! - ys[i - 2]!;
        const fd = Math.hypot(fx, fy) || 1;
        fx /= fd;
        fy /= fd;
        const bend = Math.atan2(fx * ey - fy * ex, fx * ex + fy * ey);
        if (Math.abs(bend) > MAX_BEND) {
          const a = Math.sign(bend) * MAX_BEND;
          const c = Math.cos(a);
          const s = Math.sin(a);
          ex = fx * c - fy * s;
          ey = fx * s + fy * c;
        }
      }
      xs[i] = xs[i - 1]! + ex * seg;
      ys[i] = ys[i - 1]! + ey * seg;
    }

    // Roll: the head turns over when it changes direction, and the turn travels down the body.
    const v = Math.hypot(this.vx, this.vy) || 1;
    if (this.vx > v * 0.3) this.headRoll = 1;
    else if (this.vx < -v * 0.3) this.headRoll = -1;
    roll[0] = roll[0]! + (this.headRoll - roll[0]!) * Math.min(1, dt * 4.5);
    const kr = Math.min(1, (v * dt) / seg);
    for (let i = 1; i < n; i++) roll[i] = roll[i]! + (roll[i - 1]! - roll[i]!) * kr;
  }

  private frame() {
    const { n, xs, ys, tx, ty, wd, unit } = this;
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1);
      const b = Math.min(n - 1, i + 1);
      let x = xs[a]! - xs[b]!;
      let y = ys[a]! - ys[b]!;
      const d = Math.hypot(x, y) || 1;
      x /= d;
      y /= d;
      tx[i] = x;
      ty[i] = y;
      const u = i / (n - 1);
      const neck = 0.6 + 0.4 * smooth(0, 0.13, u);
      const tail = 1 - 0.86 * Math.pow(smooth(0.3, 1, u), 1.1);
      wd[i] = unit * neck * tail;
    }
  }

  /** Paint one frame: after step() in a loop, or once after warm() when motion is reduced. */
  draw() {
    const { ctx, dpr, w, h } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    this.frame();
    this.clouds(false);
    this.stations();
    this.pearlGlow();
    this.dragon();
    this.pearl();
    this.clouds(true);
  }

  // ── Scenery ─────────────────────────────────────────────────────────────
  private clouds(front: boolean) {
    const { ctx, w, h, t, unit } = this;
    const p = this.palette;
    for (const c of CLOUDS) {
      if (c.front !== front) continue;
      const span = 1.5;
      const x = ((((c.x + t * c.v) % span) + span) % span) - 0.25;
      const s = (unit / 12) * c.s * (this.wide ? 1 : 0.8);
      ctx.save();
      ctx.globalAlpha = front ? 0.75 : 1;
      ctx.translate(x * w, c.y * h);
      ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(-86, 16);
      ctx.bezierCurveTo(-104, -6, -80, -34, -52, -24);
      ctx.bezierCurveTo(-46, -58, 0, -64, 14, -34);
      ctx.bezierCurveTo(30, -56, 74, -50, 76, -18);
      ctx.bezierCurveTo(100, -18, 110, 14, 84, 18);
      ctx.closePath();
      ctx.fillStyle = p.cloud;
      ctx.fill();
      ctx.strokeStyle = p.cloudLine;
      ctx.lineWidth = 1.6 / s;
      ctx.lineCap = "round";
      spiral(ctx, -52, -8, 13, 1);
      spiral(ctx, 12, -20, 15, -1);
      spiral(ctx, 64, -2, 10, 1);
      ctx.beginPath();
      ctx.moveTo(-70, 9);
      ctx.bezierCurveTo(-30, 16, 30, 16, 76, 10);
      ctx.stroke();
      ctx.restore();
    }
  }

  private stations() {
    const { ctx, unit, t } = this;
    const p = this.palette;
    for (let i = 0; i < 4; i++) {
      const [x, y] = this.station(i);
      const on = i === this.active;
      const colour = p.steps[i as 0 | 1 | 2 | 3];
      ctx.save();
      ctx.globalAlpha = on ? 0.95 : 0.3;
      ctx.strokeStyle = on ? colour : p.fg;
      ctx.lineWidth = Math.max(1, unit * 0.1);
      ctx.beginPath();
      ctx.arc(x, y, unit * 1.9, 0, Math.PI * 2);
      ctx.stroke();
      if (on) {
        ctx.setLineDash([unit * 0.35, unit * 0.55]);
        ctx.lineDashOffset = -t * unit * 1.2;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(x, y, unit * 2.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalAlpha = on ? 1 : 0.45;
      ctx.fillStyle = on ? colour : p.fg;
      ctx.font = `500 ${Math.round(unit * 1.25)}px "Shippori Mincho B1", "Hiragino Mincho ProN", "Yu Mincho", serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(NUMERALS[i] ?? "", x + unit * 3.1, y + unit * 0.1);
      ctx.restore();

      // The last step ends in a person's seal.
      if (i === 3 && on) {
        const age = t - this.arrivedAt;
        if (age >= 0) {
          const e = Math.min(1, age / 0.45);
          const sc = 1 + (1 - e) * 0.5;
          ctx.save();
          ctx.translate(x - unit * 3.4, y + unit * 2.6);
          ctx.rotate(-0.1);
          ctx.scale(sc, sc);
          ctx.globalAlpha = e;
          ctx.fillStyle = p.steps[3];
          roundRect(ctx, -unit * 1.2, -unit * 1.2, unit * 2.4, unit * 2.4, unit * 0.3);
          ctx.fill();
          ctx.fillStyle = p.dark ? "#0b0b0a" : "#f8f5ee";
          ctx.font = `800 ${Math.round(unit * 1.5)}px "Shippori Mincho B1", "Hiragino Mincho ProN", serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("承", 0, unit * 0.08);
          ctx.restore();
        }
      }
    }
  }

  private pearlGlow() {
    const { ctx, unit, px, py } = this;
    const g = ctx.createRadialGradient(px, py, 0, px, py, unit * 9);
    g.addColorStop(0, this.palette.glow);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(px - unit * 9, py - unit * 9, unit * 18, unit * 18);
  }

  private pearl() {
    const { ctx, unit, px, py, t } = this;
    const p = this.palette;
    // Flames around the pearl: the flaming pearl the dragon chases in the old paintings.
    for (let k = 0; k < 6; k++) {
      const a = t * 0.9 + (k * Math.PI * 2) / 6;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const r = unit * 1.05;
      flame(
        ctx,
        px + dx * r * 0.7,
        py + dy * r * 0.7,
        dx,
        dy,
        unit * (1.3 + 0.35 * Math.sin(t * 5 + k)),
        unit * 0.34,
        k % 2 ? p.steps[1] : p.mane,
        p.line,
        unit * 0.25 * Math.sin(t * 4 + k * 1.7),
        0,
      );
    }
    ctx.save();
    ctx.shadowColor = p.pearl;
    ctx.shadowBlur = unit * 2.2;
    const g = ctx.createRadialGradient(px - unit * 0.3, py - unit * 0.35, unit * 0.1, px, py, unit * 1.05);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.55, p.pearl);
    g.addColorStop(1, p.steps[1]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, unit * 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = p.line;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(1, unit * 0.08);
    ctx.beginPath();
    ctx.arc(px, py, unit * 1.05, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── The dragon ──────────────────────────────────────────────────────────
  private dragon() {
    const { ctx, n, xs, ys, tx, ty, wd, roll, unit, t, seg } = this;
    const p = this.palette;
    const lw = Math.max(1.1, unit * 0.13);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Dorsal fins, behind the body.
    for (let i = 3; i < n - 5; i += 3) {
      const r = roll[i]!;
      const sg = r >= 0 ? -1 : 1;
      const nx = -ty[i]! * sg;
      const ny = tx[i]! * sg;
      const w = wd[i]!;
      const lift = 0.45 + 0.55 * Math.abs(Math.sin(r * 1.2));
      const fh = w * 1.15 * lift * (1 + 0.14 * Math.sin(t * 4 + i * 0.6));
      const bx0 = xs[i]! + nx * w * 0.7;
      const by0 = ys[i]! + ny * w * 0.7;
      ctx.beginPath();
      ctx.moveTo(bx0 + tx[i]! * seg * 1.4, by0 + ty[i]! * seg * 1.4);
      ctx.quadraticCurveTo(bx0 + nx * fh * 0.8, by0 + ny * fh * 0.8, bx0 + nx * fh - tx[i]! * seg * 1.8, by0 + ny * fh - ty[i]! * seg * 1.8);
      ctx.quadraticCurveTo(bx0 + nx * fh * 0.25 - tx[i]! * seg * 0.6, by0 + ny * fh * 0.25 - ty[i]! * seg * 0.6, bx0 - tx[i]! * seg * 1.2, by0 - ty[i]! * seg * 1.2);
      ctx.closePath();
      ctx.fillStyle = p.mane;
      ctx.fill();
      ctx.strokeStyle = p.line;
      ctx.lineWidth = lw * 0.8;
      ctx.stroke();
    }

    const front = Math.round(n * 0.15);
    const back = Math.round(n * 0.5);
    this.leg(front + 3, 1.3, true);
    this.leg(back + 3, 3.9, true);

    // The silhouette.
    ctx.beginPath();
    ctx.moveTo(xs[0]! - ty[0]! * wd[0]!, ys[0]! + tx[0]! * wd[0]!);
    for (let i = 1; i < n; i++) ctx.lineTo(xs[i]! - ty[i]! * wd[i]!, ys[i]! + tx[i]! * wd[i]!);
    const last = n - 1;
    ctx.lineTo(xs[last]! - tx[last]! * wd[last]! * 2.5, ys[last]! - ty[last]! * wd[last]! * 2.5);
    for (let i = last; i >= 0; i--) ctx.lineTo(xs[i]! + ty[i]! * wd[i]!, ys[i]! - tx[i]! * wd[i]!);
    ctx.closePath();
    ctx.fillStyle = p.body;
    ctx.fill();

    // Scales in three rows; the belly band covers the ones it overlaps.
    ctx.strokeStyle = p.scale;
    ctx.lineWidth = Math.max(0.8, unit * 0.09);
    ctx.globalAlpha = 0.85;
    for (let i = 4; i < n - 6; i += 2) {
      const w = wd[i]!;
      const ang = Math.atan2(ty[i]!, tx[i]!);
      for (const o of [-0.58, 0, 0.58]) {
        const off = o + (i % 4 === 0 ? 0.12 : -0.12);
        const cx = xs[i]! - ty[i]! * w * off;
        const cy = ys[i]! + tx[i]! * w * off;
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.34, ang + Math.PI / 2, ang + (Math.PI * 3) / 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Shade on the lower edge, light on the upper, so the body reads as round.
    this.band(0.3, 1, true, "rgba(0,0,0,0.24)");
    this.band(0.72, 1, false, p.dark ? "rgba(170,182,255,0.28)" : "rgba(255,255,255,0.3)");

    // The belly: a band of gold plates that turns over with the body.
    const lo = new Float64Array(n);
    const hi = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const phi = roll[i]! * 1.1;
      const off = Math.sin(phi) * 0.9;
      const half = 0.44 * Math.cos(phi * 0.8);
      lo[i] = Math.max(-0.97, Math.min(0.97, off - half));
      hi[i] = Math.max(-0.97, Math.min(0.97, off + half));
    }
    ctx.beginPath();
    for (let i = 0; i < n - 3; i++) {
      const x = xs[i]! - ty[i]! * wd[i]! * lo[i]!;
      const y = ys[i]! + tx[i]! * wd[i]! * lo[i]!;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = n - 4; i >= 0; i--) ctx.lineTo(xs[i]! - ty[i]! * wd[i]! * hi[i]!, ys[i]! + tx[i]! * wd[i]! * hi[i]!);
    ctx.closePath();
    ctx.fillStyle = p.belly;
    ctx.fill();
    ctx.strokeStyle = p.line;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(0.8, unit * 0.08);
    ctx.beginPath();
    for (let i = 2; i < n - 4; i += 2) {
      ctx.moveTo(xs[i]! - ty[i]! * wd[i]! * lo[i]!, ys[i]! + tx[i]! * wd[i]! * lo[i]!);
      ctx.lineTo(xs[i]! - ty[i]! * wd[i]! * hi[i]!, ys[i]! + tx[i]! * wd[i]! * hi[i]!);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Ink outline over everything on the body.
    ctx.beginPath();
    ctx.moveTo(xs[0]! - ty[0]! * wd[0]!, ys[0]! + tx[0]! * wd[0]!);
    for (let i = 1; i < n; i++) ctx.lineTo(xs[i]! - ty[i]! * wd[i]!, ys[i]! + tx[i]! * wd[i]!);
    ctx.lineTo(xs[last]! - tx[last]! * wd[last]! * 2.5, ys[last]! - ty[last]! * wd[last]! * 2.5);
    for (let i = last; i >= 0; i--) ctx.lineTo(xs[i]! + ty[i]! * wd[i]!, ys[i]! - tx[i]! * wd[i]!);
    ctx.closePath();
    ctx.strokeStyle = p.line;
    ctx.lineWidth = lw;
    ctx.stroke();

    // The tail ends in a flame.
    for (const a of [-0.55, 0, 0.55]) {
      const c = Math.cos(a + Math.sin(t * 3) * 0.15);
      const s = Math.sin(a + Math.sin(t * 3) * 0.15);
      const dx = -(tx[last]! * c - ty[last]! * s);
      const dy = -(tx[last]! * s + ty[last]! * c);
      flame(ctx, xs[last]!, ys[last]!, dx, dy, unit * (a === 0 ? 3 : 2.3), unit * 0.42, p.mane, p.line, unit * 0.5 * Math.sin(t * 3.4 + a * 3), lw * 0.8);
    }

    this.leg(front, 0, false);
    this.leg(back, 2.6, false);
    this.head();
  }

  /** A band along the upper or lower screen edge of the body, thinning where the body runs vertical. */
  private band(from: number, to: number, lower: boolean, colour: string) {
    const { ctx, n, xs, ys, tx, ty, wd } = this;
    const edge = (i: number, f: number): [number, number] => {
      // The body's normal is (-ty, tx); pick the side that faces down (or up) on screen.
      const nyv = tx[i]!;
      const side = (nyv >= 0 ? 1 : -1) * (lower ? 1 : -1);
      const k = Math.min(1, Math.abs(nyv) * 1.6);
      const ff = 1 - (1 - f) * k;
      return [xs[i]! - ty[i]! * wd[i]! * ff * side, ys[i]! + tx[i]! * wd[i]! * ff * side];
    };
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const [x, y] = edge(i, to);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = n - 1; i >= 0; i--) {
      const [x, y] = edge(i, from);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = colour;
    ctx.fill();
  }

  private leg(i: number, phase: number, far: boolean) {
    const { ctx, xs, ys, tx, ty, wd, roll, unit, t } = this;
    const p = this.palette;
    const r = roll[i] ?? 1;
    const sg = r >= 0 ? 1 : -1;
    const bnx = -ty[i]! * sg;
    const bny = tx[i]! * sg;
    const w = wd[i]!;
    const sw = Math.sin(t * 3.1 + phase);
    const ax = xs[i]! + bnx * w * 0.5;
    const ay = ys[i]! + bny * w * 0.5;
    let ux = bnx * 0.85 - tx[i]! * (0.5 + 0.4 * sw);
    let uy = bny * 0.85 - ty[i]! * (0.5 + 0.4 * sw);
    let d = Math.hypot(ux, uy) || 1;
    ux /= d;
    uy /= d;
    const kx = ax + ux * w * 1.55;
    const ky = ay + uy * w * 1.55;
    let lx = bnx * 0.6 + tx[i]! * (0.75 - 0.35 * sw);
    let ly = bny * 0.6 + ty[i]! * (0.75 - 0.35 * sw);
    d = Math.hypot(lx, ly) || 1;
    lx /= d;
    ly /= d;
    const fx = kx + lx * w * 1.3;
    const fy = ky + ly * w * 1.3;
    const lw = Math.max(1.1, unit * 0.13);

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(kx, ky);
    ctx.lineTo(fx, fy);
    ctx.strokeStyle = p.line;
    ctx.lineWidth = w * 0.7 + lw * 2;
    ctx.stroke();
    ctx.strokeStyle = far ? mix(p.body, "#000000", 0.3) : p.body;
    ctx.lineWidth = w * 0.7;
    ctx.stroke();

    // A flame at the elbow.
    flame(ctx, kx, ky, -tx[i]!, -ty[i]!, w * 1.3, w * 0.3, far ? mix(p.mane, "#000000", 0.25) : p.mane, p.line, w * 0.3 * Math.sin(t * 4 + phase), lw * 0.8);

    // Three claws.
    for (const a of [-0.6, 0, 0.6]) {
      const c = Math.cos(a);
      const s = Math.sin(a);
      const cx = lx * c - ly * s;
      const cy = lx * s + ly * c;
      const ex = fx + cx * w * 0.8;
      const ey = fy + cy * w * 0.8;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(fx + cx * w * 0.6 + bnx * w * 0.1, fy + cy * w * 0.6 + bny * w * 0.1, ex + bnx * w * 0.35, ey + bny * w * 0.35);
      ctx.strokeStyle = p.line;
      ctx.lineWidth = w * 0.26 + lw;
      ctx.stroke();
      ctx.strokeStyle = far ? mix(p.belly, "#000000", 0.3) : p.belly;
      ctx.lineWidth = w * 0.26;
      ctx.stroke();
    }
  }

  private head() {
    const { ctx, xs, ys, tx, ty, roll, unit: u, t } = this;
    const p = this.palette;
    const lw = Math.max(1.1, u * 0.12);
    let sy = roll[0]!;
    if (Math.abs(sy) < 0.2) sy = sy < 0 ? -0.2 : 0.2;
    const ang = Math.atan2(ty[0]!, tx[0]!);
    const jaw = 0.14 + 0.1 * Math.sin(t * 2.1);

    ctx.save();
    ctx.translate(xs[0]!, ys[0]!);
    ctx.rotate(ang);
    ctx.scale(1, sy);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = p.line;

    // The far antler, behind everything.
    antler(ctx, u, -0.3 * u, 0.1 * u, mix(p.belly, "#000000", 0.3), p.line, lw);

    // The mane: flames streaming back from the skull.
    for (let k = 0; k < 7; k++) {
      const a = Math.PI + (k - 3) * 0.3;
      const len = u * (2.2 + 0.7 * Math.sin(k * 1.9) + 0.25 * Math.sin(t * 3 + k));
      flame(ctx, -0.1 * u, (k - 3) * 0.26 * u, Math.cos(a), Math.sin(a), len, u * 0.4, k % 2 ? p.mane : mix(p.mane, p.steps[1], 0.35), p.line, u * 0.4 * Math.sin(t * 3.3 + k * 0.9), lw * 0.8);
    }

    // Mouth and lower jaw.
    ctx.save();
    ctx.translate(1.1 * u, 0.12 * u);
    ctx.rotate(jaw);
    ctx.translate(-1.1 * u, -0.12 * u);
    ctx.beginPath();
    ctx.moveTo(1.0 * u, 0.1 * u);
    ctx.lineTo(2.7 * u, 0.1 * u);
    ctx.bezierCurveTo(2.8 * u, 0.36 * u, 2.25 * u, 0.6 * u, 1.6 * u, 0.58 * u);
    ctx.bezierCurveTo(1.2 * u, 0.56 * u, 0.9 * u, 0.4 * u, 1.0 * u, 0.1 * u);
    ctx.fillStyle = p.body;
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.fillStyle = "#fbf6ea";
    for (const x of [2.45, 2.05]) {
      ctx.beginPath();
      ctx.moveTo((x - 0.1) * u, 0.12 * u);
      ctx.lineTo(x * u, -0.1 * u);
      ctx.lineTo((x + 0.1) * u, 0.12 * u);
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(1.05 * u, 0.1 * u);
    ctx.lineTo(2.7 * u, 0.06 * u);
    ctx.lineTo(2.55 * u, 0.1 * u + jaw * 2.2 * u);
    ctx.closePath();
    ctx.fillStyle = "#4a0f0c";
    ctx.fill();

    // Skull and snout.
    ctx.beginPath();
    ctx.moveTo(-0.45 * u, -0.85 * u);
    ctx.bezierCurveTo(0.15 * u, -1.4 * u, 0.9 * u, -1.35 * u, 1.35 * u, -0.98 * u);
    ctx.bezierCurveTo(1.75 * u, -0.72 * u, 2.3 * u, -0.74 * u, 2.78 * u, -0.52 * u);
    ctx.bezierCurveTo(3.05 * u, -0.4 * u, 3.08 * u, -0.08 * u, 2.86 * u, 0.04 * u);
    ctx.lineTo(1.3 * u, 0.1 * u);
    ctx.bezierCurveTo(0.8 * u, 0.2 * u, 0.2 * u, 0.78 * u, -0.45 * u, 0.8 * u);
    ctx.closePath();
    ctx.fillStyle = p.body;
    ctx.fill();
    // cheek light
    ctx.beginPath();
    ctx.moveTo(0.1 * u, -1.0 * u);
    ctx.bezierCurveTo(0.7 * u, -1.25 * u, 1.3 * u, -1.0 * u, 1.9 * u, -0.72 * u);
    ctx.lineTo(1.6 * u, -0.6 * u);
    ctx.bezierCurveTo(1.1 * u, -0.85 * u, 0.6 * u, -0.95 * u, 0.1 * u, -0.8 * u);
    ctx.closePath();
    ctx.fillStyle = p.dark ? "rgba(170,182,255,0.3)" : "rgba(255,255,255,0.32)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.45 * u, -0.85 * u);
    ctx.bezierCurveTo(0.15 * u, -1.4 * u, 0.9 * u, -1.35 * u, 1.35 * u, -0.98 * u);
    ctx.bezierCurveTo(1.75 * u, -0.72 * u, 2.3 * u, -0.74 * u, 2.78 * u, -0.52 * u);
    ctx.bezierCurveTo(3.05 * u, -0.4 * u, 3.08 * u, -0.08 * u, 2.86 * u, 0.04 * u);
    ctx.lineTo(1.3 * u, 0.1 * u);
    ctx.bezierCurveTo(0.8 * u, 0.2 * u, 0.2 * u, 0.78 * u, -0.45 * u, 0.8 * u);
    ctx.lineWidth = lw;
    ctx.stroke();

    // Nostril and brow.
    ctx.beginPath();
    ctx.arc(2.6 * u, -0.4 * u, 0.11 * u, Math.PI * 0.2, Math.PI * 1.7);
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
    flame(ctx, 1.25 * u, -1.02 * u, -1, -0.35, u * 1.2, u * 0.16, p.mane, p.line, u * 0.2 * Math.sin(t * 3), lw * 0.7);

    // The eye, lit from inside.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(1.25 * u, -0.66 * u, 0.36 * u, 0.2 * u, -0.18, 0, Math.PI * 2);
    ctx.fillStyle = "#fbf6ea";
    ctx.fill();
    ctx.shadowColor = p.eye;
    ctx.shadowBlur = u * 0.9;
    ctx.beginPath();
    ctx.arc(1.32 * u, -0.66 * u, 0.16 * u, 0, Math.PI * 2);
    ctx.fillStyle = p.eye;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(1.33 * u, -0.66 * u, 0.045 * u, 0.14 * u, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#0b0b0a";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1.25 * u, -0.66 * u, 0.36 * u, 0.2 * u, -0.18, 0, Math.PI * 2);
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();

    // Beard.
    for (let k = 0; k < 3; k++) {
      flame(ctx, (0.3 + k * 0.35) * u, (0.55 + k * 0.05) * u, -0.55, 0.85, u * (1.3 - k * 0.2), u * 0.2, p.mane, p.line, u * 0.2 * Math.sin(t * 3 + k), lw * 0.7);
    }

    // The near antler.
    antler(ctx, u, 0, 0, p.belly, p.line, lw);

    // Whiskers: two long barbels trailing from the snout.
    for (const k of [0, 1]) {
      const wob = Math.sin(t * 2.4 + k * 1.3);
      const wob2 = Math.sin(t * 1.9 + k * 2.1);
      ctx.beginPath();
      ctx.moveTo(2.5 * u, (-0.2 + k * 0.28) * u);
      ctx.bezierCurveTo(3.6 * u, (-1.0 + k * 1.4 + wob * 0.4) * u, 1.2 * u, (-1.8 + k * 3.2 + wob2 * 0.6) * u, -2.6 * u, (-1.4 + k * 3.0 + wob * 0.9) * u);
      ctx.strokeStyle = p.line;
      ctx.lineWidth = u * 0.16 + lw;
      ctx.stroke();
      ctx.strokeStyle = p.belly;
      ctx.lineWidth = u * 0.16;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function antler(ctx: CanvasRenderingContext2D, u: number, ox: number, oy: number, fill: string, line: string, lw: number) {
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(0.25 * u + ox, -1.0 * u + oy);
    ctx.bezierCurveTo(-0.4 * u + ox, -1.6 * u + oy, -1.3 * u + ox, -1.9 * u + oy, -2.7 * u + ox, -2.25 * u + oy);
    ctx.moveTo(-0.95 * u + ox, -1.72 * u + oy);
    ctx.quadraticCurveTo(-1.2 * u + ox, -2.4 * u + oy, -0.95 * u + ox, -2.85 * u + oy);
    ctx.moveTo(-1.85 * u + ox, -2.05 * u + oy);
    ctx.quadraticCurveTo(-2.15 * u + ox, -2.6 * u + oy, -1.95 * u + ox, -3.0 * u + oy);
  };
  path();
  ctx.strokeStyle = line;
  ctx.lineWidth = u * 0.3 + lw * 2;
  ctx.stroke();
  path();
  ctx.strokeStyle = fill;
  ctx.lineWidth = u * 0.3;
  ctx.stroke();
}

/** A flame tongue pointing along (dx, dy), with a curl that wobbles. */
function flame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  len: number,
  width: number,
  fill: string,
  line: string,
  wobble: number,
  lw: number,
) {
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const nx = -uy;
  const ny = ux;
  const tipX = x + ux * len + nx * wobble;
  const tipY = y + uy * len + ny * wobble;
  ctx.beginPath();
  ctx.moveTo(x + nx * width, y + ny * width);
  ctx.quadraticCurveTo(x + ux * len * 0.55 + nx * (width * 1.2 + wobble * 0.5), y + uy * len * 0.55 + ny * (width * 1.2 + wobble * 0.5), tipX, tipY);
  ctx.quadraticCurveTo(x + ux * len * 0.4 - nx * width * 0.4 + nx * wobble * 0.3, y + uy * len * 0.4 - ny * width * 0.4 + ny * wobble * 0.3, x - nx * width, y - ny * width);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.strokeStyle = line;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function spiral(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, dir: 1 | -1) {
  ctx.beginPath();
  const turns = Math.PI * 3.1;
  for (let a = 0; a <= turns; a += 0.18) {
    const rr = r * (1 - a / (turns * 1.08));
    const x = cx + Math.cos(a * dir) * rr;
    const y = cy + Math.sin(a * dir) * rr;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Mix two colours given as #rrggbb (other formats come back unchanged). */
function mix(a: string, b: string, k: number): string {
  const pa = hex(a);
  const pb = hex(b);
  if (!pa || !pb) return a;
  const c = pa.map((v, i) => Math.round(v + ((pb[i] ?? v) - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function hex(c: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(c.trim());
  if (!m?.[1]) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
