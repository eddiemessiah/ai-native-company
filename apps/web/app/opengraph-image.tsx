import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@repo/catalog";

export const alt = `${brand.name}: ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const serif = fs.readFileSync(
    path.join(process.cwd(), "node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff"),
  );
  const rows = Array.from({ length: 9 }, (_, r) => r);
  const cols = Array.from({ length: 30 }, (_, c) => c);
  const color = (r: number, c: number) => {
    const k = (r * 7 + c * 3) % 11;
    return k < 5 ? "#7480ff" : k < 7 ? "#ffb000" : k < 10 ? "#ede8dc" : "#ff5a36";
  };
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b0b0a", color: "#ede8dc", padding: 72 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, opacity: 0.9 }}>
          {rows.map((r) => (
            <div key={r} style={{ display: "flex", gap: 6 }}>
              {cols.map((c) =>
                (r + c) % 2 === 0 ? (
                  <div key={c} style={{ width: 26, height: 7, borderRadius: 4, background: color(r, c), opacity: (c + r) % 5 === 0 ? 0.25 : 0.85 }} />
                ) : (
                  <div key={c} style={{ width: 26, height: 7, display: "flex", justifyContent: "center" }}>
                    <div style={{ width: 3, height: 14, marginTop: -4, borderRadius: 2, background: "#ede8dc", opacity: 0.35 }} />
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "#a8a293" }}>{`${brand.name} · an AI-native firm`}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 12 }}>
            <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -6 }}>The work,</div>
            <div style={{ fontSize: 148, fontFamily: "Instrument Serif", fontStyle: "italic", color: "#ffb000" }}>done.</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Instrument Serif", data: serif, style: "italic", weight: 400 }] },
  );
}
