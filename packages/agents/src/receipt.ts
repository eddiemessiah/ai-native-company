import { createPublicClient, erc20Abi, http, parseAbi, parseEventLogs, verifyMessage, type Hex, type Log } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { findToken, resolveNetwork, toUnits, type NetworkInfo, type TokenInfo } from "./networks";

/**
 * Nova Receipt: proof for every agent payment. Reads the settlement transaction
 * from the chain (code only, no model), finds the stablecoin transfer and the
 * EIP-3009 authorization behind it, checks it against what the caller expected,
 * and returns one normalized receipt, signed when a key is configured.
 */

export class ReceiptInputError extends Error {}
export class ReceiptNotFoundError extends Error {}

const authorizationAbi = parseAbi(["event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)"]);

export interface Expected {
  readonly payTo?: string;
  /** Atomic units. */
  readonly amount?: string;
  readonly payer?: string;
}

export interface ReceiptQuery {
  /** CAIP-2 id (eip155:42220) or an x402 v1 name (celo, base). */
  readonly network: string;
  readonly transaction: string;
  readonly expected?: Expected;
}

export interface AgentReceipt {
  readonly id: string;
  readonly status: "settled" | "no-payment-found" | "reverted";
  readonly network: string;
  readonly networkName: string;
  readonly transaction: string;
  readonly blockNumber: string;
  readonly timestamp: string;
  readonly payer: string | null;
  readonly payee: string | null;
  readonly token: { readonly symbol: string; readonly address: string; readonly decimals: number } | null;
  readonly amount: string | null;
  readonly amountUsd: number | null;
  /** The EIP-3009 authorization nonce, when the payment was a signed authorization (x402 exact). */
  readonly authorizationNonce: string | null;
  /** Stablecoin transfers found in the transaction. */
  readonly transfers: number;
  /** One entry per expectation the caller sent. */
  readonly matches: Readonly<Partial<Record<keyof Expected, boolean>>>;
  readonly explorerUrl: string | null;
}

/** The PAYMENT-RESPONSE header an x402 server returns: base64 JSON of the settle response. */
export function decodePaymentResponse(header: string): { network: string; transaction: string; payer?: string } {
  let parsed: unknown;
  try {
    const b64 = header.trim().replace(/-/g, "+").replace(/_/g, "/");
    parsed = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "=")), (c) => c.charCodeAt(0))));
  } catch {
    throw new ReceiptInputError("paymentResponse is not base64-encoded JSON");
  }
  const o = parsed as Record<string, unknown>;
  if (typeof o.network !== "string" || typeof o.transaction !== "string") {
    throw new ReceiptInputError("paymentResponse needs network and transaction");
  }
  return { network: o.network, transaction: o.transaction, ...(typeof o.payer === "string" ? { payer: o.payer } : {}) };
}

interface Transfer {
  readonly token: TokenInfo;
  readonly from: string;
  readonly to: string;
  readonly amount: bigint;
}

const same = (a: string | undefined | null, b: string | undefined | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

export function buildReceipt(args: {
  readonly network: NetworkInfo;
  readonly transaction: string;
  readonly status: "success" | "reverted";
  readonly blockNumber: bigint;
  readonly timestamp: bigint;
  readonly logs: readonly Log[];
  readonly expected?: Expected;
}): AgentReceipt {
  const { network, expected } = args;
  const logs = [...args.logs];
  const transfers: Transfer[] = parseEventLogs({ abi: erc20Abi, eventName: "Transfer", logs }).flatMap((l) => {
    const token = findToken(l.address, network);
    return token ? [{ token, from: l.args.from, to: l.args.to, amount: l.args.value }] : [];
  });
  const auth = parseEventLogs({ abi: authorizationAbi, eventName: "AuthorizationUsed", logs })[0];

  const primary =
    transfers.find((t) => same(t.to, expected?.payTo)) ??
    transfers.find((t) => same(t.from, auth?.args.authorizer)) ??
    transfers[0];

  const matches: Partial<Record<keyof Expected, boolean>> = {};
  if (expected?.payTo) matches.payTo = same(primary?.to, expected.payTo);
  if (expected?.payer) matches.payer = same(primary?.from, expected.payer);
  if (expected?.amount) matches.amount = !!primary && /^\d+$/.test(expected.amount) && primary.amount === BigInt(expected.amount);

  const status = args.status === "reverted" ? "reverted" : primary ? "settled" : "no-payment-found";
  return {
    id: `${network.id}:${args.transaction}`,
    status,
    network: network.id,
    networkName: network.name,
    transaction: args.transaction,
    blockNumber: args.blockNumber.toString(),
    timestamp: new Date(Number(args.timestamp) * 1000).toISOString(),
    payer: primary?.from ?? null,
    payee: primary?.to ?? null,
    token: primary ? { symbol: primary.token.symbol, address: primary.token.address, decimals: primary.token.decimals } : null,
    amount: primary ? primary.amount.toString() : null,
    amountUsd: primary ? toUnits(primary.amount, primary.token.decimals) : null,
    authorizationNonce: auth?.args.nonce ?? null,
    transfers: transfers.length,
    matches,
    explorerUrl: network.explorer ? `${network.explorer}/tx/${args.transaction}` : null,
  };
}

/** The two reads a receipt needs. viem's public client satisfies it. */
export interface ChainReader {
  getTransactionReceipt(args: { hash: Hex }): Promise<{ status: "success" | "reverted"; blockNumber: bigint; logs: readonly Log[] }>;
  getBlock(args: { blockNumber: bigint }): Promise<{ timestamp: bigint }>;
}

export async function fetchReceipt(query: ReceiptQuery, opts: { rpcUrl?: string; reader?: ChainReader } = {}): Promise<AgentReceipt> {
  const network = resolveNetwork(query.network);
  if (network.family !== "evm") throw new ReceiptInputError(`receipts cover EVM networks for now, not ${network.name}`);
  if (!/^0x[0-9a-fA-F]{64}$/.test(query.transaction)) throw new ReceiptInputError("transaction must be a 0x-prefixed 32-byte hash");
  const rpc = opts.rpcUrl ?? network.rpc;
  if (!opts.reader && !rpc) throw new ReceiptInputError(`no RPC endpoint for ${network.name}`);
  const reader: ChainReader = opts.reader ?? (createPublicClient({ transport: http(rpc) }) as unknown as ChainReader);

  const hash = query.transaction as Hex;
  let receipt: Awaited<ReturnType<ChainReader["getTransactionReceipt"]>>;
  try {
    receipt = await reader.getTransactionReceipt({ hash });
  } catch (error) {
    if (error instanceof Error && error.name === "TransactionReceiptNotFoundError") {
      throw new ReceiptNotFoundError(`no transaction ${hash} on ${network.name}`);
    }
    throw error;
  }
  const block = await reader.getBlock({ blockNumber: receipt.blockNumber });
  return buildReceipt({
    network,
    transaction: hash,
    status: receipt.status,
    blockNumber: receipt.blockNumber,
    timestamp: block.timestamp,
    logs: receipt.logs,
    ...(query.expected ? { expected: query.expected } : {}),
  });
}

/** JSON with sorted keys, so a signature covers the content, not the key order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export interface SignedReceipt {
  readonly receipt: AgentReceipt;
  readonly signer: string;
  /** EIP-191 personal_sign over canonicalJson(receipt). */
  readonly signature: string;
}

export async function signReceipt(receipt: AgentReceipt, privateKey: Hex): Promise<SignedReceipt> {
  const account = privateKeyToAccount(privateKey);
  const signature = await account.signMessage({ message: canonicalJson(receipt) });
  return { receipt, signer: account.address, signature };
}

export function verifyReceipt(signed: SignedReceipt): Promise<boolean> {
  return verifyMessage({
    address: signed.signer as Hex,
    message: canonicalJson(signed.receipt),
    signature: signed.signature as Hex,
  });
}
