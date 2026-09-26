import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

/**
 * Research posts live at the repo root in content/posts/*.md so the company's
 * writing sits next to its strategy, not inside the website. Pages that read
 * them are statically generated, so the files are only read at build time.
 */
const DIR = path.join(process.cwd(), "..", "..", "content", "posts");

export interface Post {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly tags: readonly string[];
  readonly minutes: number;
  readonly html: string;
}

function frontmatter(src: string): { data: Record<string, string>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(src);
  if (!match) return { data: {}, body: src };
  const data: Record<string, string> = {};
  for (const line of match[1]!.split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { data, body: match[2] ?? "" };
}

function read(file: string): Post {
  const slug = file.replace(/\.md$/, "");
  const { data, body } = frontmatter(fs.readFileSync(path.join(DIR, file), "utf8"));
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? "",
    tags: (data.tags ?? "")
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    minutes: Math.max(1, Math.round(words / 230)),
    html: marked.parse(body, { async: false, gfm: true }),
  };
}

export function getPosts(): Post[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map(read)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}
