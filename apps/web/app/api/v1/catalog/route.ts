import { brand, categories, offers, tracks } from "@repo/catalog";
import { absolute } from "@/lib/site";
import { NETWORK, USDC_CELO } from "@/lib/chain";

export const dynamic = "force-static";

/** The whole directory as JSON, free, for agents and integrations. */
export function GET() {
  return Response.json(
    {
      name: brand.name,
      description: brand.description,
      url: absolute("/"),
      payments: { protocol: "x402", version: 2, network: NETWORK, asset: { symbol: "USDC", address: USDC_CELO } },
      categories,
      offers: offers.map((o) => ({
        ...o,
        url: absolute(`/directory/${o.slug}`),
        ...(o.api ? { api: { ...o.api, url: absolute(o.api.path), live: o.status !== "soon" } } : {}),
      })),
      studyGroup: { url: absolute("/study"), tracks },
    },
    { headers: { "Cache-Control": "public, max-age=3600", "Access-Control-Allow-Origin": "*" } },
  );
}
