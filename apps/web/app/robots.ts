import type { MetadataRoute } from "next";
import { absolute } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Agents are welcome: the paid routes answer 402, the rest is public.
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/demo/", "/api/intake", "/api/study/"] }], sitemap: absolute("/sitemap.xml") };
}
