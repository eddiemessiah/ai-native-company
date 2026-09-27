/** CAIP-2 network id for x402: Celo mainnet eip155:42220, Celo Sepolia eip155:11142220 (Alfajores is retired). */
export const NETWORK = process.env.X402_NETWORK === "celo-sepolia" ? "eip155:11142220" : "eip155:42220";

/** Circle-native USDC on Celo (6 decimals; EIP-712 domain name "USDC", version "2"). */
export const USDC_CELO = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";

/** Base mainnet, settled through Coinbase's CDP facilitator, which also lists us in the x402 Bazaar. */
export const BASE_NETWORK = "eip155:8453";

/** The Base leg switches on only when CDP keys are set. */
export function baseConfigured(): boolean {
  return Boolean(process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET);
}

/** How agents can pay us, for docs and discovery. */
export function paymentNetworks(): string[] {
  return ["Celo (USDC, USDT)", ...(baseConfigured() ? ["Base (USDC)"] : [])];
}
