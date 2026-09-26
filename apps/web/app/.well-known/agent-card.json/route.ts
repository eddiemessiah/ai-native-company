import { brand, offers } from "@repo/catalog";
import { absolute } from "@/lib/site";
import { NETWORK } from "@/lib/chain";

export const dynamic = "force-static";

/**
 * A2A agent card (v1.0 shape). We sell plain HTTP routes, not an A2A JSON-RPC
 * endpoint, so no supportedInterfaces are advertised; skills point at the routes.
 */
export function GET() {
  const skills = offers
    .filter((o) => o.api && o.status !== "soon")
    .map((o) => ({
      id: o.slug,
      name: o.name,
      description: `${o.api!.method} ${absolute(o.api!.path)}: ${o.api!.description} $${o.api!.priceUsd} per call via x402 (USDC on Celo).`,
      tags: o.tags.slice(0, 5),
      examples: [JSON.stringify(o.api!.inputExample)],
    }));
  return Response.json(
    {
      name: brand.name,
      description: `${brand.description} Paid per call with x402.`,
      provider: { organization: brand.name, url: absolute("/") },
      version: "0.1.0",
      documentationUrl: absolute("/llms.txt"),
      capabilities: {
        streaming: false,
        pushNotifications: false,
        extensions: [
          {
            uri: "https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.2",
            description: `Payments via x402 (exact scheme, ${NETWORK})`,
            required: true,
          },
        ],
      },
      defaultInputModes: ["application/json"],
      defaultOutputModes: ["application/json"],
      skills,
    },
    { headers: { "Cache-Control": "public, max-age=3600", "Access-Control-Allow-Origin": "*" } },
  );
}
