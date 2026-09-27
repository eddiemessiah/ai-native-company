import { encodeAbiParameters, encodeEventTopics, erc20Abi, parseAbi, type Hex, type Log } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { describe, expect, it } from "vitest";
import {
  buildReceipt,
  canonicalJson,
  decodePaymentResponse,
  fetchReceipt,
  ReceiptInputError,
  ReceiptNotFoundError,
  resolveNetwork,
  signReceipt,
  verifyReceipt,
  type ChainReader,
} from "../src/index";

const CELO_USDC = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const PAYER = "0x4444444444444444444444444444444444444444";
const PAY_TO = "0x1111111111111111111111111111111111111111";
const TX = `0x${"ab".repeat(32)}` as Hex;
const NONCE = `0x${"cd".repeat(32)}` as Hex;
const celo = resolveNetwork("eip155:42220");

const log = (address: string, topics: Hex[], data: Hex, logIndex: number): Log =>
  ({
    address,
    topics,
    data,
    blockHash: `0x${"01".repeat(32)}`,
    blockNumber: 74_479_633n,
    logIndex,
    transactionHash: TX,
    transactionIndex: 0,
    removed: false,
  }) as unknown as Log;

const transfer = (from: string, to: string, value: bigint, token = CELO_USDC, i = 0) =>
  log(
    token,
    encodeEventTopics({ abi: erc20Abi, eventName: "Transfer", args: { from: from as Hex, to: to as Hex } }) as Hex[],
    encodeAbiParameters([{ type: "uint256" }], [value]),
    i,
  );
const authorization = (authorizer: string, i = 1) =>
  log(
    CELO_USDC,
    encodeEventTopics({
      abi: parseAbi(["event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)"]),
      eventName: "AuthorizationUsed",
      args: { authorizer: authorizer as Hex, nonce: NONCE },
    }) as Hex[],
    "0x",
    i,
  );

const build = (logs: Log[], expected?: Parameters<typeof buildReceipt>[0]["expected"], status: "success" | "reverted" = "success") =>
  buildReceipt({ network: celo, transaction: TX, status, blockNumber: 74_479_633n, timestamp: 1_790_000_000n, logs, ...(expected ? { expected } : {}) });

describe("receipts", () => {
  it("turns an x402 settlement into a normalized receipt", () => {
    const r = build([authorization(PAYER), transfer(PAYER, PAY_TO, 10_000n)], { payTo: PAY_TO, amount: "10000", payer: PAYER });
    expect(r).toMatchObject({
      status: "settled",
      network: "eip155:42220",
      networkName: "Celo",
      amount: "10000",
      amountUsd: 0.01,
      token: { symbol: "USDC" },
      authorizationNonce: NONCE,
      matches: { payTo: true, amount: true, payer: true },
      explorerUrl: `https://celoscan.io/tx/${TX}`,
    });
    expect(r.payer?.toLowerCase()).toBe(PAYER);
    expect(r.timestamp).toBe(new Date(1_790_000_000 * 1000).toISOString());
  });

  it("flags mismatches, ignores unknown tokens and reports reverts", () => {
    expect(build([transfer(PAYER, PAY_TO, 10_000n)], { amount: "20000" }).matches.amount).toBe(false);
    expect(build([transfer(PAYER, PAY_TO, 10_000n, "0x3333333333333333333333333333333333333333")]).status).toBe("no-payment-found");
    expect(build([transfer(PAYER, PAY_TO, 10_000n)], undefined, "reverted").status).toBe("reverted");
  });

  it("picks the transfer to the expected payee in a batch", () => {
    const other = "0x5555555555555555555555555555555555555555";
    const r = build([transfer(PAYER, other, 99n, CELO_USDC, 0), transfer(PAYER, PAY_TO, 10_000n, CELO_USDC, 1)], { payTo: PAY_TO });
    expect(r).toMatchObject({ amount: "10000", transfers: 2, matches: { payTo: true } });
  });

  it("fetches from the chain and reports missing transactions", async () => {
    const reader: ChainReader = {
      getTransactionReceipt: async () => ({ status: "success", blockNumber: 1n, logs: [transfer(PAYER, PAY_TO, 10_000n)] }),
      getBlock: async () => ({ timestamp: 1_790_000_000n }),
    };
    expect((await fetchReceipt({ network: "celo", transaction: TX }, { reader })).status).toBe("settled");

    const missing: ChainReader = {
      getTransactionReceipt: async () => {
        const e = new Error("not found");
        e.name = "TransactionReceiptNotFoundError";
        throw e;
      },
      getBlock: async () => ({ timestamp: 0n }),
    };
    await expect(fetchReceipt({ network: "celo", transaction: TX }, { reader: missing })).rejects.toThrow(ReceiptNotFoundError);
    await expect(fetchReceipt({ network: "celo", transaction: "0x12" }, { reader })).rejects.toThrow(ReceiptInputError);
  });

  it("reads the PAYMENT-RESPONSE header", () => {
    const value = Buffer.from(JSON.stringify({ success: true, transaction: TX, network: "eip155:42220", payer: PAYER })).toString("base64");
    expect(decodePaymentResponse(value)).toEqual({ network: "eip155:42220", transaction: TX, payer: PAYER });
    expect(() => decodePaymentResponse("%%%")).toThrow(ReceiptInputError);
  });

  it("signs receipts that anyone can verify", async () => {
    const receipt = build([transfer(PAYER, PAY_TO, 10_000n)]);
    const signed = await signReceipt(receipt, generatePrivateKey());
    expect(await verifyReceipt(signed)).toBe(true);
    expect(await verifyReceipt({ ...signed, receipt: { ...receipt, amount: "1" } })).toBe(false);
    expect(canonicalJson({ b: 1, a: { d: [2, { f: 1, e: 2 }], c: null } })).toBe('{"a":{"c":null,"d":[2,{"e":2,"f":1}]},"b":1}');
  });
});
