import { brand, offers } from "@repo/catalog";
import { absolute } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const live = offers.filter((o) => o.status !== "soon");
  const apis = live.filter((o) => o.api);
  const services = live.filter((o) => !o.api);
  const body = `# ${brand.name}

> ${brand.description} Agents can call our decision recipes directly: every paid endpoint answers HTTP 402 with x402 v2 payment requirements (PAYMENT-REQUIRED header); pay with USDC or USDT on Celo (eip155:42220) and retry with the PAYMENT-SIGNATURE header. No accounts or API keys.

How we work: LLMs write, a System One model decides (typed Choice/Score/Noul answers with confidence), code executes, and a person approves anything that moves money or can't be undone. Every decision response says which provider answered, the model version, whether its probabilities are calibrated, and its confidence.

## Paid endpoints (x402)

${apis.map((o) => `- [${o.api!.method} ${o.api!.path}](${absolute(o.api!.path)}): ${o.api!.description} $${o.api!.priceUsd} per call.`).join("\n")}

## Services (for people and businesses)

${services.map((o) => `- [${o.name}](${absolute(`/directory/${o.slug}`)}): ${o.oneLiner} ${o.price.label}.`).join("\n")}

## Discovery

- [Catalog JSON](${absolute("/api/v1/catalog")}): every offer, price, unit and endpoint
- [A2A agent card](${absolute("/.well-known/agent-card.json")})
- [ERC-8004 registration file](${absolute("/agent.json")})
- [API docs for developers](${absolute("/agents")})

## Optional

- [Start a job (human intake)](${absolute("/start")})
- [AI Study Group](${absolute("/study")})
- [Research](${absolute("/research")})
- [x402 protocol](https://x402.org)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
