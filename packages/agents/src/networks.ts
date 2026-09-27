import { findDefaultAsset } from "@x402/evm";
import { EVM_NETWORK_CHAIN_ID_MAP } from "@x402/evm/v1";
import type { Chain } from "viem";
import { arbitrum, arbitrumSepolia, avalanche, base, baseSepolia, celo, celoSepolia, mainnet, optimism, polygon } from "viem/chains";

/**
 * Networks and stablecoins, taken from the x402 SDK's own tables where it has
 * them, so a check here agrees with what an x402 client would actually sign.
 */

export type Family = "evm" | "svm" | "unknown";

export interface NetworkInfo {
  /** CAIP-2 id when it can be resolved, otherwise the value as given. */
  readonly id: string;
  readonly family: Family;
  readonly chainId?: number;
  readonly name: string;
  readonly testnet: boolean;
  readonly explorer?: string;
  /** Public RPC from viem's chain definition. Override it in production. */
  readonly rpc?: string;
}

export interface TokenInfo {
  readonly address: string;
  readonly symbol: string;
  readonly decimals: number;
  /** EIP-712 domain the token signs with (EVM, EIP-3009). */
  readonly domain?: { readonly name: string; readonly version: string };
}

const CHAINS: readonly Chain[] = [celo, celoSepolia, base, baseSepolia, mainnet, polygon, arbitrum, arbitrumSepolia, optimism, avalanche];
const TESTNET_CHAIN_IDS = new Set([11142220, 84532, 421614, 80002, 43113, 11155111, 1328, 2201, 11124]);

export const SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
const SOLANA_USDC: TokenInfo = { address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", decimals: 6 };

const v1ChainIds = EVM_NETWORK_CHAIN_ID_MAP as Readonly<Record<string, number>>;

export function resolveNetwork(network: string): NetworkInfo {
  const caip = /^eip155:(\d+)$/.exec(network);
  const chainId = caip ? Number(caip[1]) : v1ChainIds[network];
  if (chainId !== undefined) {
    const chain = CHAINS.find((c) => c.id === chainId);
    return {
      id: `eip155:${chainId}`,
      family: "evm",
      chainId,
      name: chain?.name ?? `EVM chain ${chainId}`,
      testnet: chain?.testnet === true || TESTNET_CHAIN_IDS.has(chainId),
      ...(chain?.blockExplorers?.default.url ? { explorer: chain.blockExplorers.default.url.replace(/\/$/, "") } : {}),
      ...(chain?.rpcUrls.default.http[0] ? { rpc: chain.rpcUrls.default.http[0] } : {}),
    };
  }
  if (network === "solana" || network === SOLANA_MAINNET) {
    return { id: SOLANA_MAINNET, family: "svm", name: "Solana", testnet: false, explorer: "https://solscan.io" };
  }
  if (network === "solana-devnet" || network.startsWith("solana:")) {
    return { id: network, family: "svm", name: "Solana (other cluster)", testnet: network !== SOLANA_MAINNET };
  }
  return { id: network, family: "unknown", name: network, testnet: false };
}

/** Known stablecoins only: an unknown token can't be priced, so callers treat it as a reason to ask a person. */
export function findToken(asset: string, network: NetworkInfo): TokenInfo | undefined {
  if (network.family === "evm") {
    const hit = findDefaultAsset(asset, network.id as `${string}:${string}`);
    return hit ? { address: hit.asset, symbol: hit.symbol, decimals: hit.decimals, domain: { name: hit.name, version: hit.version } } : undefined;
  }
  if (network.id === SOLANA_MAINNET && asset === SOLANA_USDC.address) return SOLANA_USDC;
  return undefined;
}

export function isAddress(value: string, family: Family): boolean {
  if (family === "evm") return /^0x[0-9a-fA-F]{40}$/.test(value);
  if (family === "svm") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
  return value.length > 0;
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/** Atomic units to a decimal amount, exactly for display and approximately as a number. */
export function toUnits(amount: bigint, decimals: number): number {
  const scale = 10n ** BigInt(decimals);
  return Number(amount / scale) + Number(amount % scale) / Number(scale);
}
