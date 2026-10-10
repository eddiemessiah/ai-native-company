import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/agents", "@repo/brain", "@repo/catalog", "@repo/gtm-cloud", "@repo/gtm-harness"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(llms.txt|agents.md|.well-known/:path*)",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;
