import { strToU8, zipSync } from "fflate";

/** The harness as a .zip, rooted at gtm-harness/. Browser-safe: the page zips client-side. */
export function zipHarness(files: Readonly<Record<string, string>>, root = "gtm-harness"): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(files)) entries[`${root}/${path}`] = strToU8(content);
  return zipSync(entries, { level: 6 });
}
