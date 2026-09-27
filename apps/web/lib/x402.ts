import { createFacilitatorConfig } from "@coinbase/x402";
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { withX402 } from "@x402/next";
import { NextResponse, type NextRequest } from "next/server";
import { brand, offerBySlug } from "@repo/catalog";
import { BASE_NETWORK as BASE, baseConfigured, NETWORK as CHAIN_NETWORK, USDC_CELO } from "./chain";

/**
 * x402 v2 on Celo. Agents get a 402 with payment requirements, sign a gasless
 * USDC (EIP-3009) authorization, and retry with PAYMENT-SIGNATURE. The
 * facilitator verifies and settles; we never hold a key. Settlement happens
 * only if the handler answers below 400, so a failed call is never charged.
 */

export const NETWORK = CHAIN_NETWORK as Network;
export { USDC_CELO };

const DEFAULT_FACILITATOR = NETWORK === "eip155:11142220" ? "https://api.x402.sepolia.celo.org" : "https://api.x402.celo.org";

export const BASE_NETWORK = BASE as Network;
export { baseConfigured };

let server: x402ResourceServer | undefined;

function resourceServer(): x402ResourceServer {
  if (!server) {
    // Celo's hosted facilitator; /settle needs an X-API-Key from x402.celo.org.
    const celo = new HTTPFacilitatorClient({
      url: process.env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR,
      createAuthHeaders: async () => {
        const h = { "X-API-Key": process.env.X402_API_KEY ?? "" };
        return { verify: h, settle: h, supported: h };
      },
    });
    // Earlier facilitators win routing, so Celo stays first.
    const facilitators = baseConfigured()
      ? [celo, new HTTPFacilitatorClient(createFacilitatorConfig(process.env.CDP_API_KEY_ID, process.env.CDP_API_KEY_SECRET))]
      : [celo];
    server = new x402ResourceServer(facilitators).register("eip155:*", new ExactEvmScheme());
  }
  return server;
}

export function paymentsConfigured(): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(process.env.X402_PAY_TO ?? "");
}

type Handler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Wraps a route handler with x402, using the price, path and example from the
 * catalog so the directory, llms.txt, the agent card and the 402 never disagree.
 */
export function paid(
  slug: string,
  handler: Handler,
  schema: { readonly properties: Readonly<Record<string, unknown>>; readonly required: readonly string[] },
): Handler {
  const offer = offerBySlug(slug);
  const api = offer?.api;
  if (!offer || !api) throw new Error(`No API route in the catalog for "${slug}"`);

  let wrapped: Handler | undefined;
  return async (req: NextRequest) => {
    if (!paymentsConfigured()) {
      return NextResponse.json(
        { error: "Payments are not configured on this deployment (set X402_PAY_TO).", docs: "/agents" },
        { status: 503 },
      );
    }
    wrapped ??= withX402(
      handler,
      {
        [api.path]: {
          // An agent pays with the first option it has funds for.
          accepts: [
            { scheme: "exact", network: NETWORK, payTo: process.env.X402_PAY_TO as `0x${string}`, price: `$${api.priceUsd}` },
            { scheme: "exact", network: NETWORK, payTo: process.env.X402_PAY_TO as `0x${string}`, price: `$${api.priceUsd} USDT` },
            ...(baseConfigured()
              ? [{ scheme: "exact", network: BASE_NETWORK, payTo: process.env.X402_PAY_TO as `0x${string}`, price: `$${api.priceUsd}` }]
              : []),
          ],
          description: api.description,
          mimeType: "application/json",
          serviceName: brand.name,
          tags: offer.tags.slice(0, 5),
          extensions: {
            ...declareDiscoveryExtension({
              bodyType: "json",
              input: api.inputExample,
              inputSchema: { properties: { ...schema.properties }, required: [...schema.required] },
            }),
          },
        },
      },
      resourceServer(),
    );
    return wrapped(req);
  };
}
