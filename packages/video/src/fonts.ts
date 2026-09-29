import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

/** Latin, Latin Extended and Vietnamese subsets: the last carries ẹ and ọ for Yoruba names. */
const FILES = [
  "bricolage-grotesque-latin-standard-normal.woff2",
  "bricolage-grotesque-latin-ext-standard-normal.woff2",
  "bricolage-grotesque-vietnamese-standard-normal.woff2",
];

export function brandFontFiles(): string[] {
  const require = createRequire(import.meta.url);
  const pkg = dirname(require.resolve("@fontsource-variable/bricolage-grotesque/package.json"));
  return FILES.map((f) => join(pkg, "files", f)).filter((f) => existsSync(f));
}

/** Copies the brand font into `<dir>/fonts`, where libass loads it (ass=…:fontsdir=fonts). */
export function installFonts(dir: string): string {
  const target = join(dir, "fonts");
  mkdirSync(target, { recursive: true });
  for (const file of brandFontFiles()) copyFileSync(file, join(target, file.split(/[\\/]/).pop()!));
  return "fonts";
}
