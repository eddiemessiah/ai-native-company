import type { MetadataRoute } from "next";
import { offers } from "@repo/catalog";
import { getPosts } from "@/lib/posts";
import { absolute } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/directory", "/start", "/study", "/agents", "/research", "/company"].map((p) => ({
    url: absolute(p),
    changeFrequency: "weekly" as const,
    priority: p === "/" ? 1 : 0.7,
  }));
  return [
    ...pages,
    ...offers.map((o) => ({ url: absolute(`/directory/${o.slug}`), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...getPosts().map((p) => ({ url: absolute(`/research/${p.slug}`), lastModified: p.date, priority: 0.5 })),
  ];
}
