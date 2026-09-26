import { brand } from "@repo/catalog";
import { absolute } from "@/lib/site";

export const dynamic = "force-static";

/**
 * ERC-8004 registration file (registration-v1 shape): the agentURI target for
 * the IdentityRegistry on Celo (0x8004A169FB4a3325136EB29fA0ceB6D2e539a432).
 * Set ERC8004_AGENT_ID once registered so the file points back at the token.
 */
export function GET() {
  const agentId = process.env.ERC8004_AGENT_ID ? Number(process.env.ERC8004_AGENT_ID) : undefined;
  return Response.json(
    {
      type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      name: `${brand.name} · ${brand.agent.name}`,
      description: `${brand.agent.description} Decision recipes paid per call via x402 (USDC on Celo).`,
      image: absolute("/icon.svg"),
      services: [
        { name: "web", endpoint: absolute("/") },
        { name: "A2A", endpoint: absolute("/.well-known/agent-card.json"), version: "1.0" },
      ],
      x402Support: true,
      active: true,
      registrations: agentId
        ? [{ agentId, agentRegistry: "eip155:42220:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" }]
        : [],
      supportedTrust: ["reputation"],
    },
    { headers: { "Cache-Control": "public, max-age=3600", "Access-Control-Allow-Origin": "*" } },
  );
}
