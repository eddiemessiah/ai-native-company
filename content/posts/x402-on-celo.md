---
title: Selling to agents on Celo: x402 v2 in one Next.js route
description: No accounts, no API keys, no invoices. An agent calls your endpoint, gets a 402 with a price, signs a gasless USDC authorization, and retries. Here's the exact 2026 recipe, and the mistakes to avoid.
date: 2026-09-23
tags: [x402, celo, agent payments, nextjs]
---

The request becomes the transaction. That's the whole pitch of x402: your API answers `402 Payment Required` with a price, the agent signs a payment, retries, and gets the answer. Here's how we run it in production shape on Celo.

## The 2026 stack

- **Protocol:** x402 **v2**. The server sends requirements in a `PAYMENT-REQUIRED` header, the client retries with `PAYMENT-SIGNATURE`, and the receipt comes back in `PAYMENT-RESPONSE`.
- **Packages:** `@x402/core`, `@x402/evm`, `@x402/next`, `@x402/extensions` (all 2.27.0), which need Next.js 16.2.6 or later. Agents use `@x402/fetch`. **Skip the unscoped `x402-*` 1.x packages:** they speak v1 and have no Celo support.
- **Network ids:** CAIP-2, so Celo mainnet is `eip155:42220` and Celo Sepolia is `eip155:11142220`. Alfajores is retired.
- **Asset:** Circle-native USDC on Celo, `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`. Its signing domain is `USDC`/`2`, not Base's `USD Coin`. `price: "$0.01"` now picks it automatically. USDT also works (`"$0.01 USDT"`).
- **Facilitator:** Celo's hosted one at `https://api.x402.celo.org` (Sepolia: `https://api.x402.sepolia.celo.org`). Settlement needs an API key from x402.celo.org in an `X-API-Key` header. It pays gas and never holds funds.

## The route

```ts
export const POST = withX402(
  handler,
  {
    "/api/v1/triage": {
      accepts: [
        { scheme: "exact", network: "eip155:42220", payTo, price: "$0.01" },
        { scheme: "exact", network: "eip155:42220", payTo, price: "$0.01 USDT" },
      ],
      description: "Triage one support message and get a route.",
      mimeType: "application/json",
    },
  },
  server, // x402ResourceServer with the Celo facilitator registered for eip155:*
);
```

The detail that matters most: **`withX402` only settles if your handler answers below 400.** A caller never pays for an error, a timeout or a model outage. We lean on that: if no calibrated decision model is available, our paid routes return 503 instead of answering with a fallback heuristic, and nobody is charged.

## The agent side

```ts
const client = new x402Client().register("eip155:42220", new ExactEvmScheme(account));
client.setSpendControls({ maxAmountPerPayment: "$0.10" });
const pay = wrapFetchWithPayment(fetch, client);
const res = await pay(url, { method: "POST", body });
```

The agent needs USDC on Celo and no CELO for gas: it only signs an EIP-3009 authorization, and the facilitator submits the transfer. Spend controls are enforced on the client, and the default cap is $1 per payment.

## Pricing: mind the settlement fee

The hosted facilitator charges about $0.001 per settlement after free credits. A $0.001 call nets roughly nothing, so **price at $0.01 or more**, or self-host a facilitator (x402-rs knows `celo` and `celo-sepolia`) if you need sub-cent pricing.

## Discovery

Agents have to find you before they can pay you. We publish:

- `llms.txt` with every paid route and its price.
- An A2A agent card at `/.well-known/agent-card.json`.
- An ERC-8004 registration file. The Identity registry on Celo is `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`; use the `registration-v1` shape, because 8004scan flags the old `"type":"Agent"` format.
- A free catalog JSON.

One catch: the Celo facilitator doesn't index routes into an x402 Bazaar catalog, so Celo-only endpoints aren't listed anywhere by default. If you want Bazaar discovery, also accept Base through Coinbase's facilitator.

## Three mistakes we found in our own old code

We audited our earlier hackathon repos before writing this. Please don't repeat these:

1. **Charging before doing the work.** A gateway that settles before calling the upstream API bills callers for failures. Settle after success.
2. **A "fallback" that serves content without settling.** That's a free API with extra steps.
3. **Paying yourself to look busy.** A demo "swarm" that loops payments into its own treasury inflates volume, breaks hackathon rules, and poisons your ERC-8004 reputation. Delete it.

The live endpoints are listed on our [For agents](/agents) page.
