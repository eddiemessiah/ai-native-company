# Agent-payable HTTP APIs on Celo: x402 recipe and the state of agentic commerce

*As of 2026-09-26. Prepared for Edidiong Umana ("DeFi Messiah", GitHub `eddiemessiah`). Goal: Next.js (App Router) API routes that answer HTTP 402 with x402 payment requirements, settle in stablecoins on Celo (optionally Base), and are discoverable by AI agents. The services are typed decisions (Jev / TypeSafe System One) and Africa-specific data and classification.*

## How to read the evidence tags

| Tag | Meaning |
|---|---|
| **[src]** | Read in source code, spec or docs in a cloned repo. Commits and dates are listed in §11. |
| **[npm]** | Checked against the npm registry or a downloaded tarball on 2026-09-26. |
| **[exec]** | Run locally with Next.js 16.3.6, `@x402/*` 2.27.0 and viem 2.56.9, against a mock facilitator that really checks the EIP-712 / EIP-3009 signature. §4.8 describes the harness. |
| **[2nd]** | From a secondary write-up on GitHub (mainly `Custena/agent-payment-protocols`, April 2026). Not independently confirmed. |
| **[unverified]** | From memory, or not confirmable in this session. |

Two limits applied to this research:

- **WebSearch was unavailable.** The session's search budget was already used up.
- **The egress proxy blocked most live hosts.** That includes `api.x402.celo.org`, `x402.org`, `api.cdp.coinbase.com`, `facilitator.payai.network` and docs sites.

To work around this, everything was read from GitHub sources (including `celo-org/docs`, the source of docs.celo.org) and from npm. Claims tagged [2nd] or [unverified] should be re-checked before anyone relies on them.

---

## 1. TL;DR recipe

1. **Protocol: use x402 v2, not v1.** On HTTP, a server answers `402` and puts a base64 JSON object in the **`PAYMENT-REQUIRED`** response header. The client retries with **`PAYMENT-SIGNATURE`**, and the server returns **`PAYMENT-RESPONSE`** as the receipt. [src]
2. **Packages to install.** All are at **2.27.0**, published 2026-09-22 [npm].
   - Server: `@x402/core @x402/evm @x402/next @x402/extensions`, plus **`next@>=16.2.6`**, which is a hard peer dependency. Tested on 16.3.6.
   - Agent / client: `@x402/fetch @x402/evm viem`.
   - MCP: `@x402/mcp @modelcontextprotocol/sdk`.
   - **Do not use** the legacy v1 packages (`x402`, `x402-next`, `x402-fetch`, `x402-express`, `x402-hono`, `x402-axios` 1.2.x). Their network enum has **no Celo**. [npm dist]
3. **Network ids (CAIP-2)** [src]:
   - Celo mainnet is **`eip155:42220`**.
   - Celo Sepolia is **`eip155:11142220`**. Alfajores (44787) is retired.
   - Base is `eip155:8453`.
4. **Token: Celo native USDC at `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`.** It has 6 decimals, supports EIP-3009, and its EIP-712 domain is `name "USDC"`, `version "2"`. Note that Base USDC uses `"USD Coin"`.
   - In `@x402/evm` ≥ 2.21.0, the plain string `price: "$0.01"` resolves to Celo USDC automatically [exec].
   - `"$0.01 USDT"` and `"$0.01 USAT"` also resolve, from ≥ 2.26.0 [exec].
5. **Facilitator: Celo's hosted facilitator** [src: celo-org/docs].
   - Mainnet API: `https://api.x402.celo.org`. Celo Sepolia API: `https://api.x402.sepolia.celo.org`.
   - Get an API key from the dashboard at `https://x402.celo.org` by connecting a wallet and signing. Send it as `X-API-Key`. Only `/settle` requires it.
   - The facilitator pays gas and never takes custody of funds. The buyer needs no CELO.
   - Price: **$0.001 per settlement** after free starter credits.
   - Optional: add the CDP facilitator (`https://api.cdp.coinbase.com/platform/v2/x402`) for Base and to be indexed in the Coinbase Bazaar.
6. **Wrap each paid API route with `withX402`** from `@x402/next`. It runs verify → handler → settle, and only settles if the handler returns status < 400. A handler that throws is not charged [exec]. Avoid `paymentProxy` for APIs, because it charges even when the response fails [src].
7. **Discovery** (§6):
   - The Bazaar extension (`declareDiscoveryExtension`).
   - A `/llms.txt` file.
   - An A2A agent card at `/.well-known/agent-card.json`.
   - An ERC-8004 identity on Celo's Identity Registry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, using the `registration-v1` file format.
8. **Pricing floor.** With the hosted facilitator's $0.001 fee, charge at least **$0.01 per call** so the fee is about 10%. A $0.001 call nets roughly zero. Sub-cent pricing needs either a self-hosted facilitator (x402-rs supports Celo) or batch settlement.

**Evidence the recipe works [exec].** I ran the §4 code as a production Next 16 build.

- The unpaid POST returned `402` with a `PAYMENT-REQUIRED` header. It decoded to `x402Version: 2` with two `accepts` entries: Celo USDC and Celo USDT, each with the correct EIP-712 domain. It also carried Bazaar info with `method: "POST"`.
- An `@x402/fetch` agent then paid. The mock facilitator validated the EIP-3009 signature against the domain `{name:"USDC", version:"2", chainId:42220, verifyingContract:USDC}`.
- `X-API-Key` reached `/verify` and `/settle`.
- The Bazaar extension was echoed back by the client.
- The response was `200` with a decodable `PAYMENT-RESPONSE`.
- A handler that threw returned `500`. Verify ran, but settle never did.
- A client spend cap below the price refused to pay.

---

## 2. x402: the spec and the packages

### 2.1 Where x402 lives now

- **The canonical repo is now `github.com/x402-foundation/x402`.** `coinbase/x402` says in its README that it is "now a development fork". The move note was committed 2026-04-08 [src].
- **Governance.** The Foundation's technical charter is dated 2026-03-31 (a PDF in `foundation/`). The Technical Steering Committee (`TSC.md`) is **Coinbase** (Erik Reppel), **Cloudflare** (Rohin Lohe) and **Stripe** (Steve Kaliski) [src].
- **Launch and members.** The Linux Foundation announced the x402 Foundation on 2026-04-02. Listed members include Visa, Mastercard, AmEx, Stripe, Adyen, Google, AWS, Microsoft, Cloudflare, Coinbase, Circle and thirdweb [2nd].
- **Activity.** The repo is very active: its last commit was 2026-09-25, and TS packages were versioned 2026-09-23 [src].

### 2.2 v1 vs v2

| | v1 (legacy) | v2 (current, spec v2.0, 2025-12-09) |
|---|---|---|
| 402 signal | JSON body `{x402Version:1, accepts:[…]}` | **`PAYMENT-REQUIRED`** header (base64 `PaymentRequired`). The body is `{}` by default [exec]. |
| Client payment header | `X-PAYMENT` | **`PAYMENT-SIGNATURE`**. v2 servers still read `x-payment` too [src]. |
| Receipt header | `X-PAYMENT-RESPONSE` | **`PAYMENT-RESPONSE`** |
| Network ids | names (`base`, `base-sepolia`, …) | **CAIP-2** (`eip155:42220`) |
| Amount field | `maxAmountRequired` | `amount` (atomic units, string) |
| Resource info | inside each requirement | a separate `resource` object: `url, description, mimeType, serviceName, tags, iconUrl` |
| Extensions | – | `extensions` map (`info` + JSON `schema`), echoed by the client |
| Facilitator sidechannel | – | `EXTENSION-RESPONSES` header from the facilitator to the server, never forwarded to the buyer |

In v2, `PaymentRequirements` has these fields: `scheme, network, amount, asset, payTo, maxTimeoutSeconds, extra`.

- In `extra`, the EVM `exact` scheme needs `name` and `version`, the EIP-712 domain.
- `assetTransferMethod` and `paymentFlow` are reserved keys.
- The SDK's default `maxTimeoutSeconds` was 300 [exec].

The facilitator API has four parts [src]:

- `POST /verify` is read-only.
- `POST /settle` can return the non-terminal error `settlement_pending`, together with a tx hash.
- `GET /supported` returns `{kinds, extensions, signers}`.
- The Bazaar discovery endpoints are `GET /discovery/resources` and `GET /discovery/search`.

### 2.3 Schemes, payment flows, transports and extensions [src]

**Schemes** (`specs/schemes/`):

- **`exact`**: pays a fixed amount.
  - On EVM it uses **EIP-3009 `transferWithAuthorization`** by default and falls back to **Permit2**.
  - Network bindings exist for EVM, SVM, Algorand, Aptos, Canton, Cardano, Casper, Concordium, Hedera, Keeta, Lightning, NEAR, Starknet, Stellar, Sui, TON and XRPL.
- **`upto`**: usage-based payment. It authorizes a maximum and settles the actual amount. On EVM it works only through Permit2.
- **`batch-settlement`**: channels or escrow with off-chain vouchers, redeemed in batches. Supported on EVM and SVM.
- **`auth-capture`**: authorize, then capture, void or refund. EVM only.

**Payment flows** (`extra.paymentFlow`):

- `authorization` is the default: verify → resource → settle.
- `upfront`: settle → resource.
- `escrow`.

**Transports:**

- HTTP.
- MCP: the payment goes in `_meta["x402/payment"]` and the receipt in `_meta["x402/payment-response"]`. A 402 is a tool result with `isError: true` and `structuredContent`.
- A2A: task metadata keys `x402.payment.required`, `x402.payment.payload` and `x402.payment.receipts`.

**Spec extensions:** `bazaar`, `builder_code`, `eip2612_gas_sponsoring`, `erc20_gas_sponsoring`, `extension-auth-hints`, `offer-and-receipt` (signed offers and receipts), `http-message-signatures`, `payment_identifier` (idempotency), and `sign-in-with-x` (SIWX, useful for "first call free" or authenticated pricing).

### 2.4 TypeScript packages that exist now: names and versions

| Package | npm `latest` (2026-09-26) | Role / notes |
|---|---|---|
| `@x402/core` | **2.27.0** | Types, `x402ResourceServer`, `HTTPFacilitatorClient`, `x402Client`, `x402Facilitator`. Exports `./client ./facilitator ./http ./server ./types ./utils`. Depends only on `zod` [npm]. |
| `@x402/evm` | **2.27.0** | EVM mechanisms: `exact`, `upto`, `batch-settlement`, `auth-capture` (client, server, facilitator). Holds the **Celo default assets**. Depends on `viem ^2.48.11` [npm]. |
| `@x402/next` | **2.27.0** | `withX402` (route wrapper), `paymentProxy` (Next 16 `proxy.ts`), and a re-export of `x402ResourceServer`. **Peer deps: `next >=16.2.6`**, plus `@x402/paywall ^2.27.0` (optional) [npm]. |
| `@x402/fetch` | **2.27.0** | `wrapFetchWithPayment`, `wrapFetchWithPaymentFromConfig`, `x402Client`, `x402HTTPClient`, `decodePaymentResponseHeader` [npm, exec] |
| `@x402/axios` | 2.27.0 | Axios interceptor [npm] |
| `@x402/express` / `@x402/hono` | 2.27.0 | `paymentMiddleware(routes, server)` [npm] |
| `@x402/fastify` | 2.26.0 | The repo is at 2.27.0, but it is not yet published [npm] |
| `@x402/extensions` | **2.27.0** | `bazaar`, `sign-in-with-x`, `offer-receipt`, `payment-identifier`, `builder-code` [npm] |
| `@x402/mcp` | **2.27.0** | `createPaymentWrapper` (server), `createx402MCPClient` / `x402MCPClient` (client). Depends on `@modelcontextprotocol/sdk ^1.12.1` [npm] |
| `@x402/paywall` | 2.27.0 | Browser paywall UI (wagmi, WalletConnect, Solana). Heavy: a 14.5 MB tarball. Peer dep react 19. Skip it for API-only use [npm]. |
| `@x402/svm` | 2.27.0 | Solana. Other mechanisms at 2.27.0 in the repo: aptos, avm, cardano, casper, concordium, hedera, keeta, near, stellar, tvm, xrpl [src]. |
| `@coinbase/x402` | 2.1.0 (2025-12-23) | CDP facilitator config: `facilitator` and `createFacilitatorConfig(id, secret)`. Env: `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`. Type-checks with core 2.27 [npm, exec: tsc]. |
| `x402` | 1.2.0 (repo 1.2.1) | **Legacy v1, no Celo** [npm] |
| `x402-next` | 1.2.0 | Legacy v1. Peer dep `next >=15.5.9 \|\| >=16.0.10` [npm] |
| `x402-hono` / `x402-express` / `x402-fetch` | 1.2.0 | Legacy v1 [npm] |
| `x402-axios` | 1.2.1 | Legacy v1 [npm] |
| `mppx` | 0.11.0 (2026-09-25) | The Machine Payments Protocol SDK. It can also serve x402 `exact` (§7) [npm, src] |
| `thirdweb` | 5.121.6 | `thirdweb/x402`: its own facilitator and client, supporting EIP-3009 **and ERC-2612 Permit** (§3.3) [npm] |

Celo support landed in two releases (`packages/mechanisms/evm/CHANGELOG.md`) [src]:

- **`@x402/evm` 2.21.0** (2026-08-04) added Celo mainnet and Celo Sepolia, with USDC as the default (PR #3025).
- **2.26.0** (2026-09-15) added Celo USDT and USA₮ (PR #3457).

### 2.5 How networks are identified

- **In v2, networks are CAIP-2 strings typed as `` `${string}:${string}` ``.** Passing `"celo"` is a compile error [exec: tsc].
- **The v2 SDK still maps v1 names to chain ids.** In `EVM_NETWORK_CHAIN_ID_MAP`, `celo` maps to 42220. There is no v1 name for Celo Sepolia [src].
- **Wildcards are allowed at registration.** `server.register("eip155:*", new ExactEvmScheme())` covers every EVM chain [src].
- **Any EVM chain works at the protocol level.** For a "production" path you need a facilitator that lists the chain in its `/supported` response [src: docs/core-concepts/network-and-token-support.mdx].

---

## 3. Celo support matrix

### 3.1 Networks

| Network | CAIP-2 | RPC | Explorer | x402 default asset |
|---|---|---|---|---|
| Celo mainnet | `eip155:42220` | `https://forno.celo.org` | celoscan.io / celo.blockscout.com | USDC (plus USDT, USA₮ by symbol) [src, exec] |
| Celo Sepolia | `eip155:11142220` | `https://forno.celo-sepolia.celo-testnet.org` | celo-sepolia.blockscout.com | USDC `0x01C5C0122039549AD1493B8220cABEdD739BC44E` [src, exec] |
| Alfajores | 44787 | – | – | **Retired.** The planned sunset was 2025-09-30, alongside Holesky. Celo Sepolia replaces it [src: celo-org/docs]. |

Test USDC for Celo Sepolia comes from `https://faucet.circle.com` (the x402 paywall's faucet map points there too) [src]. Buyers need no testnet CELO, because the facilitator sponsors gas [src].

### 3.2 Tokens on Celo

| Token | Address (mainnet) | Dec | EIP-712 domain | EIP-3009 | Works with x402 `exact` (standard SDK + hosted facilitator)? |
|---|---|---|---|---|---|
| **USDC** (Circle, native) | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | 6 | `USDC` / `2` | ✅ | **Yes. This is the default asset** [src, exec] |
| **USD₮** (Tether) | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` | 6 | `Tether USD` / `1` (`version()` reverts on-chain) | ✅ | **Yes**, via `"$x USDT"` [src, exec] |
| **USA₮** (Anchorage) | `0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771` | 6 | `Tether America USD` / `1` | ✅ | Yes in the SDK (`"$x USAT"`). The x402 facilitator directory also says the Celo facilitator accepts USA₮ [src] |
| **USDm** (Mento, formerly **cUSD**) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | 18 | – | ❌ (EIP-2612 `permit` only) | **No** with the hosted facilitator or standard `exact`. **Yes via thirdweb**, using its Permit path and its own client [src] |
| NGNm, KESm, GHSm, ZARm, XOFm, EURm, BRLm (Mento local stables) | e.g. NGNm `0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71`, KESm `0x456a3D042C0DbD3db53D5489e98dFb038553B0d0` | 18 | – | ❌ (permit only, per Celopedia) | Same as USDm: thirdweb only [src] |
| cNGN (Africa Stablecoin Consortium) | `0xF6829D7393dAe24509eb1E52eE8e572e2E271a4f` | 6 | ? | [unverified] | Unknown. Check `authorizationState()` or `DOMAIN_SEPARATOR` on-chain before offering it. |

Notes on the table:

- **The Mento rebrand is real.** `celo-org/docs` says: "`USDm`, `EURm` and `BRLm` are the on-chain symbols of the Mento stablecoins, formerly `cUSD`, `cEUR` and `cREAL`." [src]
- **Celo Sepolia test tokens.** USDC is at `0x01C5C0122039549AD1493B8220cABEdD739BC44E`. Only USDC is configured for x402 on Sepolia; USDT exists at `0xd077A400968890Eacc75cdc901F0356c943e4fDb`, but the facilitator is documented as USDC-only there [src].
- **Paying gas in stablecoins (CIP-64), for your own transactions.** Examples are ERC-8004 registration or payouts; this is not needed for x402. Pass the **adapter** address, not the token address [src]:
  - USDC adapter: `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B`
  - USD₮ adapter: `0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72`
  - USA₮ adapter: `0x0357EE22278c922e1D36cFe6b899269b161880C4`
  - USDm has no adapter; use the token address itself.

### 3.3 Facilitators

| Facilitator | Endpoint | Celo? | Tokens | Auth / env | Fees | Notes |
|---|---|---|---|---|---|---|
| **Celo hosted facilitator** (recommended) | Mainnet `https://api.x402.celo.org`, Sepolia `https://api.x402.sepolia.celo.org`. Dashboard `https://x402.celo.org` (do **not** point a server at it). | ✅ mainnet + Sepolia [src] | USDC, USDT (EIP-3009). The x402 directory adds USA₮ [src] | `X-API-Key: x402_…`, created by connecting a wallet on the dashboard. **Only `/settle` needs it.** `/verify`, `/supported` and `/health` are open [src] | Free starter credits (Celopedia snapshot: 500 mainnet / 1,000 testnet), then **$0.001 per settlement**, topped up with USDC. Errors: `401` bad key, `402` out of credits, `429` free-tier rate limit [src] | Built on the open-source **x402-rs**; the Celo repo itself is private. It never takes custody, and it pays gas. **`x402.celobuilders.xyz` (`api.x402.celobuilders.xyz`, `api.x402.sepolia.celobuilders.xyz`) is the same backend**, with the same signer `0x0d74…fb48`, so one key works on both. It also backs MPP [src: GigaHierz demo]. It exposes **no Bazaar discovery endpoint** [src: Celo docs endpoint table]. |
| **thirdweb** | `https://api.thirdweb.com/v1/payments/x402` | ✅, per Celo docs [src] | EIP-3009 **and ERC-2612 Permit**, so USDm and Mento locals work [src: thirdweb dist] | `x-secret-key` (`THIRDWEB_SECRET_KEY`) plus a `serverWalletAddress` (your thirdweb server wallet submits the tx) [src] | Your server wallet pays gas. Platform fees [unverified] | The Permit path is signalled through a non-standard `extra.primaryType: "Permit"`, so **only thirdweb's client can pay it**; stock `@x402/fetch` signs EIP-3009. Use it only if you must price in USDm or NGNm. |
| **CDP (Coinbase)** | `https://api.cdp.coinbase.com/platform/v2/x402`. Bazaar list at `…/discovery/resources` (no auth) [src] | **No evidence of Celo.** The x402 FAQ fee table lists Base, Base Sepolia, Solana and Solana Devnet [src]. Treat CDP as your **Base** leg. | USDC and others on the listed networks | `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` (JWT via `@coinbase/x402`) [npm] | [unverified] Free tier, then about $0.001/tx since early 2026 | KYT/OFAC checks on every transaction [src]. **Hosts the most-used Bazaar catalog.** |
| **x402.org** (public default) | `https://x402.org/facilitator` | ❌. It supports only Base Sepolia, Solana Devnet, Stellar, Aptos, Hedera and XRPL testnets [src] | – | none | free | Testnet only. **You cannot use it to test on Celo Sepolia.** |
| **PayAI** | `https://facilitator.payai.network`, with Bazaar at `/discovery/resources` [src] | [unverified] | "all tokens" [src] | "No API keys required" [src] | [unverified] | Multi-network. Check `/supported` for `eip155:42220` before relying on it. |
| **Corbits (Faremeter)** | – | Probably not. `@faremeter/info@0.22.0` network tables contain no Celo chain id [npm] | – | – | – | Multi-network EVM + Solana. |
| Others in the x402 directory | Dexter, Fireblocks, Meridian, Mogami (Base), Solvador, Polygon, HPP, NEAR, T54 XRPL, FTP Canton, Built on Stellar [src]. OpenZeppelin Relayer x402 plugin (`@openzeppelin/relayer-plugin-x402-facilitator@0.5.0`) [npm] | Celo unknown [unverified] | | | | |
| **Self-hosted** | **x402-rs** (Rust) supports `celo` and `celo-sepolia` natively [src]. Or run an in-process `x402Facilitator` (`@x402/core/facilitator` plus `@x402/evm/exact/facilitator`) with a viem wallet on Celo [src] | ✅ | any EIP-3009 token | your own | only gas (under $0.001/tx on Celo, per Celo docs) | The way to reach sub-cent pricing and to remove dependence on Celo's hosted service. Your facilitator wallet needs CELO for gas. |

### 3.4 What works where

| Want | Use |
|---|---|
| Agents paying USDC or USDT on Celo mainnet | `@x402/next` + the hosted Celo facilitator (`eip155:42220`) ✅ [exec against a mock, src for the live facilitator] |
| Testing on Celo Sepolia | `X402_NETWORK=celo-sepolia` + `https://api.x402.sepolia.celo.org` + an API key (free testnet credits) + Circle faucet USDC |
| Being listed in the Coinbase Bazaar | Add an `eip155:8453` accept, settled through CDP (§4.5) |
| Pricing in naira, cedi or shilling stablecoins | Not possible with the standard `exact` flow today. Price in USD(C) and show the local-currency equivalent; or use thirdweb and accept its client lock-in |
| Metered LLM billing (`upto`) on Celo | ❌ today. The EVM `upto` scheme needs the x402 Permit2 proxy, which is listed only on Base, Base Sepolia and Arc [src: contracts/evm/README.md]. Use `exact` with a fixed price per tier, or a `DynamicPrice` computed from the request |
| Sub-cent payments at volume | Batch-settlement contracts **are deployed on Celo mainnet** (`x402BatchSettlement` `0x4020074e9dF2ce1deE5A9C1b5c3f541D02a10003`) [src], but the hosted Celo facilitator documents only `exact`. You would need to self-host, or wait. |

---

## 4. Server code: Next.js App Router

Everything in 4.1–4.4 is **exactly the code that was built and exercised [exec]**.

### 4.1 Install

```bash
npm i next@16.3.6 react@19 react-dom@19 \
  @x402/core@2.27.0 @x402/evm@2.27.0 @x402/next@2.27.0 @x402/extensions@2.27.0 viem
# optional Base/CDP leg:  npm i @coinbase/x402@2.1.0
```

Next ≥ 16.2.6 is required. The repo's `apps/web` scaffold already pins `next 16.3.6`, so it qualifies. The code type-checks with both **TypeScript 7.0.2** (npm `latest`, which `next build` used) and **5.9.3** (what `apps/web` pins) [exec].

`.env.local`:

```bash
X402_NETWORK=celo                  # or celo-sepolia
X402_PAY_TO=0xYourReceivingWallet  # plain address; server holds no key
X402_API_KEY=x402_...              # from https://x402.celo.org (connect wallet -> Create API key)
# X402_FACILITATOR_URL=            # optional override (e.g. self-hosted x402-rs)
PUBLIC_BASE_URL=https://api.yourdomain.com
```

### 4.2 `lib/x402.ts`: one resource server shared by all routes

```ts
// lib/x402.ts — one x402 resource server shared by every paid route.
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import type { Network } from "@x402/core/types";

/** CAIP-2 ids: Celo mainnet = eip155:42220, Celo Sepolia = eip155:11142220. */
export const CELO: Network =
  process.env.X402_NETWORK === "celo-sepolia" ? "eip155:11142220" : "eip155:42220";

/** Your receiving wallet (a plain address; the server never holds a key). */
export const PAY_TO = process.env.X402_PAY_TO as `0x${string}`;

// Celo's hosted facilitator (x402-rs). /settle needs X-API-Key (x402.celo.org dashboard).
// NOT https://x402.celo.org (that host is the dashboard SPA).
const DEFAULT_FACILITATOR =
  CELO === "eip155:11142220" ? "https://api.x402.sepolia.celo.org" : "https://api.x402.celo.org";

const celoFacilitator = new HTTPFacilitatorClient({
  url: process.env.X402_FACILITATOR_URL ?? DEFAULT_FACILITATOR,
  createAuthHeaders: async () => {
    const h = { "X-API-Key": process.env.X402_API_KEY ?? "" };
    return { verify: h, settle: h, supported: h };
  },
});

// Pass an array to add more facilitators (e.g. CDP for Base). Routing is per
// (x402Version, network, scheme) from each facilitator's /supported; earlier wins.
export const server = new x402ResourceServer([celoFacilitator]).register(
  "eip155:*",
  new ExactEvmScheme(),
);
```

### 4.3 A paid POST route (typed decision, $0.01, USDC or USDT)

```ts
// app/api/v1/decide/route.ts — POST, $0.01 USDC on Celo, settles only if handler returns < 400.
import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { server, CELO, PAY_TO } from "@/lib/x402";

export const runtime = "nodejs";

async function handler(req: NextRequest) {
  const { question, options } = (await req.json()) as { question: string; options: string[] };
  // ... call your model here (typed decision) ...
  return NextResponse.json({
    decision: options?.[0] ?? null,
    confidence: 0.82,
    rationale: `stub answer for: ${question}`,
  });
}

export const POST = withX402(
  handler,
  {
    "/api/v1/decide": {
      accepts: [
        { scheme: "exact", network: CELO, payTo: PAY_TO, price: "$0.01" }, // Celo USDC (default asset)
        { scheme: "exact", network: CELO, payTo: PAY_TO, price: "$0.01 USDT" }, // Celo USDT
      ],
      description: "Typed decision: pick one option with confidence and rationale",
      mimeType: "application/json",
      serviceName: "Example Decisions",
      tags: ["decision", "classification", "africa"],
      extensions: {
        ...declareDiscoveryExtension({
          bodyType: "json",
          input: { question: "Approve this loan?", options: ["approve", "decline", "review"] },
          inputSchema: {
            properties: {
              question: { type: "string", description: "The decision to make" },
              options: { type: "array", items: { type: "string" }, description: "Allowed answers" },
            },
            required: ["question", "options"],
          },
          output: {
            example: { decision: "review", confidence: 0.82, rationale: "..." },
          },
        }),
      },
    },
  },
  server,
);
```

The unpaid call returned `HTTP/1.1 402` with `cache-control: no-store` and a `payment-required: eyJ4NDAy…` header. Decoded [exec]:

```json
{ "x402Version": 2, "error": "Payment required",
  "resource": { "url": "http://localhost:3100/api/v1/decide", "description": "Typed decision: …",
                "mimeType": "application/json", "serviceName": "Example Decisions",
                "tags": ["decision","classification","africa"] },
  "accepts": [
    { "scheme": "exact", "network": "eip155:42220", "amount": "10000",
      "asset": "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", "payTo": "0x2096…287C",
      "maxTimeoutSeconds": 300, "extra": { "name": "USDC", "version": "2" } },
    { "scheme": "exact", "network": "eip155:42220", "amount": "10000",
      "asset": "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", "payTo": "0x2096…287C",
      "maxTimeoutSeconds": 300, "extra": { "name": "Tether USD", "version": "1" } } ],
  "extensions": { "bazaar": { "info": { "input": { "type": "http", "method": "POST", "bodyType": "json", "body": {…} },
                                        "output": { "type": "json", "example": {…} } }, "schema": {…} } } }
```

### 4.4 A paid GET route with query parameters ($0.001) and discovery files

```ts
// app/api/v1/ng/classify/route.ts — GET with query params, $0.001 on Celo.
import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { server, CELO, PAY_TO } from "@/lib/x402";

export const runtime = "nodejs";

async function handler(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") ?? "";
  return NextResponse.json({ text, label: "bank_transfer_narration", country: "NG" });
}

export const GET = withX402(
  handler,
  {
    "/api/v1/ng/classify": {
      accepts: { scheme: "exact", network: CELO, payTo: PAY_TO, price: "$0.001" },
      description: "Classify a Nigerian payment narration",
      mimeType: "application/json",
      extensions: {
        ...declareDiscoveryExtension({
          input: { text: "TRF FRM ADEBAYO/OPAY/POS" },
          inputSchema: {
            properties: { text: { type: "string", description: "Narration text" } },
            required: ["text"],
          },
          output: { example: { label: "bank_transfer_narration", country: "NG" } },
        }),
      },
    },
  },
  server,
);
```

The $0.001 price here is only a demonstration that sub-cent amounts resolve (`amount: "1000"`). On the hosted facilitator it nets about zero; see §9.

The agent card (`app/.well-known/agent-card.json/route.ts`) and `app/llms.txt/route.ts` are shown in §6. **Next 16 serves the `app/.well-known/…` folder route correctly**, as a static route [exec].

### 4.5 Optional: Celo plus Base (CDP) in one server [exec: type-checked only, no CDP keys]

```ts
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createFacilitatorConfig } from "@coinbase/x402";

const celo = new HTTPFacilitatorClient({
  url: "https://api.x402.celo.org",
  createAuthHeaders: async () => {
    const h = { "X-API-Key": process.env.X402_API_KEY ?? "" };
    return { verify: h, settle: h, supported: h };
  },
});
// CDP facilitator for Base (needs CDP_API_KEY_ID / CDP_API_KEY_SECRET)
const cdp = new HTTPFacilitatorClient(
  createFacilitatorConfig(process.env.CDP_API_KEY_ID, process.env.CDP_API_KEY_SECRET),
);
export const server = new x402ResourceServer([celo, cdp]).register("eip155:*", new ExactEvmScheme());
// then per route:  accepts: [{…network:"eip155:42220"…}, { scheme:"exact", network:"eip155:8453", payTo, price:"$0.01" }]
```

How this behaves [src: `x402ResourceServer.initialize`]:

- Routing uses each facilitator's `/supported`, and **earlier array entries win**.
- A facilitator that fails `/supported` is logged and skipped.
- Initialization throws only if *none* of the facilitators load.

The client picks the first `accepts` entry that it has a scheme and funds for. Put the network you prefer first.

### 4.6 Useful knobs [src]

- **Dynamic pricing.** `price` can be `(ctx) => Price | Promise<Price>`, and `payTo` can be a function too. `ctx.adapter.getBody()` returns the parsed JSON body; it reads from `req.clone()`, so the handler can still read the body. Use this for per-model-tier or per-payload pricing.
- **Explicit asset.** Use this for any token, or to pin the domain:
  `price: { amount: "10000", asset: "0xcebA…118C", extra: { name: "USDC", version: "2" } }`.
- **Custom 402 body** for humans or old clients: `unpaidResponseBody: (ctx) => ({ contentType, body })`.
- **`maxTimeoutSeconds`** (default 300) is the EIP-3009 validity window. Your handler plus settle must finish inside it.
- **Dynamic Next routes.** Key the config with the Next pattern, for example `"/api/users/[id]"`. **If a keyed pattern doesn't match the request path, the handler runs unpaid.** `withX402` logs one warning when that happens.

### 4.7 Fallback: self-facilitation (no third-party facilitator) [src]

Adapted from `examples/typescript/servers/self-facilitation`:

- Build a viem wallet client on `celo`.
- Pass it through `toFacilitatorEvmSigner({...})` from `@x402/evm`.
- Create `new x402Facilitator()` from `@x402/core/facilitator`.
- Call `registerExactEvmScheme(facilitator, { signer, networks: "eip155:42220" })` from `@x402/evm/exact/facilitator`.
- Pass `{ verify, settle, getSupported }` into `new x402ResourceServer(...)`.

The facilitator wallet pays gas in CELO. Alternatively, run **x402-rs** as a sidecar; it knows `celo` and `celo-sepolia`.

### 4.8 How this was verified

The scratch harness is at `/tmp/claude-0/-home-user-ai-native-company/0e084cd2-a50e-5c6e-9c0b-aa7b88a11bcf/scratchpad/payments/verify/`. It is ephemeral.

- Built with `next build` and served with `next start` on Next 16.3.6.
- `mock-facilitator.ts` implemented `/supported`, `/verify` and `/settle`. Its verify step ran viem `verifyTypedData` over `TransferWithAuthorization`, using the domain `{name, version}` from `extra`, the `chainId` from the CAIP-2 id and `verifyingContract` = asset. `/settle` returned 401 without `X-API-Key`, like the real Celo facilitator.
- The agent was `agent.ts` (§5.1) with a random key.

What was **not** exercised:

- Real on-chain settlement. There were no funds, and the facilitator hosts were blocked. However, the Celo demo repo shows verified mainnet and Sepolia settlements with the same package family (§11).
- The CDP leg.

---

## 5. Client / agent code

### 5.1 An agent paying with `@x402/fetch` and a viem account [exec]

```ts
// agent.ts — an agent that pays x402 endpoints on Celo with a viem account.
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

// Needs USDC (or USDT) on Celo only; no CELO for gas (the facilitator submits the tx).
const account = privateKeyToAccount(
  (process.env.AGENT_PRIVATE_KEY as `0x${string}`) ?? generatePrivateKey(),
);

const client = new x402Client()
  .register("eip155:42220", new ExactEvmScheme(account)) // Celo mainnet
  .register("eip155:11142220", new ExactEvmScheme(account)); // Celo Sepolia
client.setSpendControls({ maxAmountPerPayment: "$0.50" }); // hard cap per call (default is $1)

const fetchWithPayment = wrapFetchWithPayment(fetch, client);
const http = new x402HTTPClient(client);

const base = process.env.API_BASE ?? "http://localhost:3100";

const res = await fetchWithPayment(`${base}/api/v1/decide`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ question: "Approve this loan?", options: ["approve", "decline", "review"] }),
});
console.log("status:", res.status);
console.log("body:", await res.clone().json());
console.log("settlement:", http.getPaymentSettleResponse((name) => res.headers.get(name)));

const res2 = await fetchWithPayment(`${base}/api/v1/ng/classify?text=${encodeURIComponent("TRF FRM ADEBAYO/OPAY")}`);
console.log("status2:", res2.status, await res2.json());
```

What the run showed:

- It printed `status: 200` and `settlement: { success: true, payer: '0x…', transaction: '0x…', network: 'eip155:42220' }`.
- Signing needs only `address` and `signTypedData`; there is no RPC call and no gas.
- **Spend controls are enforced on the client.** By default only "known default assets" are allowed, with a cap of **$1 per payment**. To accept other tokens, use `allowedAssets`.
- A cap below the price fails before any signing, with `All payment requirements were rejected by spendControls.maxAmountPerPayment` [exec].
- One-liner alternative: `wrapFetchWithPaymentFromConfig(fetch, { schemes: [{ network: "eip155:42220", client: new ExactEvmScheme(account) }] })` [src, and used in the Celo demo].

For production agent wallets, use a smart or MPC wallet (for example the CDP Wallet API, which x402 docs recommend) or a low-balance hot key. Any object that has `address` and `signTypedData` works as a `ClientEvmSigner` [src].

### 5.2 Paid MCP tools: server and client [src; exec: an equivalent form was type-checked with tsc]

`PAY_TO` and `account` are placeholders here; they are defined as in §4.2 and §5.1.

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createPaymentWrapper, x402ResourceServer, createx402MCPClient } from "@x402/mcp";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme as ExactEvmServer } from "@x402/evm/exact/server";
import { ExactEvmScheme as ExactEvmClient } from "@x402/evm/exact/client";
import { z } from "zod";

// server: wrap tool handlers; settles after the tool succeeds
const rs = new x402ResourceServer(new HTTPFacilitatorClient({ url: "https://api.x402.celo.org",
  createAuthHeaders: async () => { const h = { "X-API-Key": process.env.X402_API_KEY! }; return { verify: h, settle: h, supported: h }; } }));
rs.register("eip155:42220", new ExactEvmServer());
await rs.initialize();
const accepts = await rs.buildPaymentRequirements({ scheme: "exact", network: "eip155:42220", payTo: PAY_TO, price: "$0.01" });
const paid = createPaymentWrapper(rs, { accepts /*, hooks: { onBeforeExecution, onAfterSettlement } */ });
const mcp = new McpServer({ name: "decisions", version: "0.1.0" });
mcp.tool("decide", "Typed decision. $0.01 per call.", { question: z.string(), options: z.array(z.string()) },
  paid(async (args) => ({ content: [{ type: "text" as const, text: JSON.stringify({ decision: args.options[0] }) }] })));

// client (agent side)
const agent = createx402MCPClient({
  name: "my-agent", version: "1.0.0",
  schemes: [{ network: "eip155:42220", client: new ExactEvmClient(account) }],
  autoPayment: true,
  onPaymentRequested: async ({ paymentRequired }) => Number(paymentRequired.accepts[0].amount) <= 50_000, // <= $0.05
});
// await agent.connect(transport); const r = await agent.callTool("decide", {...}); r.paymentResponse?.transaction
```

### 5.3 Other client options

- **Coinbase Payments MCP.** Install with `npx @coinbase/payments-mcp`; the npm version is 1.0.5 (2025-10-22). It is an MCP server plus a companion wallet app with onramp and x402 payments, and it auto-configures Claude Desktop, Claude Code, Codex and Gemini CLI [src]. **Its network coverage is probably Base-centric; I found no evidence that it pays on Celo** [unverified].
- **Vercel `x402-mcp` 0.1.1** (2025-09) is older and superseded by `@x402/mcp` [npm].
- **thirdweb client.** `thirdweb/x402` offers `wrapFetchWithPayment` and React `useFetchWithPayment`. **It is required to pay thirdweb Permit-based (USDm) requirements** [src].
- **MPP (`mppx`).** `Mppx.create({ methods:[evm.charge({ account, networks:[42220], currencies:[USDC], decimals:6, authorization:{name:"USDC",version:"2"}, maxAmount:"1" })] })` patches global `fetch`. MPP clients must hardcode decimals and the domain [src: GigaHierz COMPARISON.md].
- **Human buyers in MiniPay.** One founder README reports "a known EIP-712 typed-data signing limitation" for MiniPay users [src: relay-verdict]. Agents are unaffected. For humans in MiniPay, keep a direct-transfer path (see ajo-circle's receipt verifier, §8).

---

## 6. Discovery

### 6.1 x402 Bazaar [src]

**How a resource gets listed:**

- Add `extensions: { ...declareDiscoveryExtension({...}) }` to the route (§4.3). The HTTP method is filled in from the live request [exec].
- The client echoes the extension in its `PaymentPayload` [exec].
- **The facilitator that verifies or settles the payment catalogs it.** Its outcome comes back in the `EXTENSION-RESPONSES` header: `{"bazaar":{"status":"success"|"processing"|"rejected"}}`. `@x402/next` logs this [exec].
- There is **no separate registration step**. A listing appears after the first paid call through a Bazaar-capable facilitator.

**Service metadata** lives at the top level of the route config: `serviceName` (≤ 32 ASCII characters), `tags` (≤ 5) and `iconUrl`. These are the actual `RouteConfig` fields [src, exec]. One docs snippet shows a nested `resource: {…}` object, which does not match the TypeScript type.

**Querying the catalog:**

- `GET {facilitator}/discovery/resources?type=http&network=eip155:42220&limit=…`
- `GET {facilitator}/discovery/search?query=…`
- Programmatically: `withBazaar(new HTTPFacilitatorClient({url})).extensions.bazaar.listResources({ type: "http" })` from `@x402/extensions`.
- Catalogs:
  - CDP: `https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources`
  - PayAI: `https://facilitator.payai.network/discovery/resources`

**The Celo-specific catch.** The hosted Celo facilitator documents only `/verify`, `/settle`, `/supported` and `/health`, so **Celo-only routes are not cataloged anywhere by default**. To appear in the largest catalog, also accept Base through CDP (§4.5). Once one paid call has gone through CDP, the resource is listed. The facilitator only sees the payment it processed, so the catalog entry may show just the Base requirement rather than your full `accepts` list; that depends on CDP's implementation [unverified]. Third-party indexes such as x402scan also exist [unverified].

### 6.2 `llms.txt` [src: AnswerDotAI/llms-txt]

The format:

- An H1 name. This is the only required part.
- A `>` blockquote summary.
- Optional prose.
- H2 sections containing `- [name](url): notes` lists.
- A `## Optional` section for skippable links.
- It is also recommended to serve `.md` versions of pages.

Served as tested [exec: `content-type: text/plain; charset=utf-8`]:

```ts
// app/llms.txt/route.ts
export const dynamic = "force-static";
const BASE = process.env.PUBLIC_BASE_URL ?? "https://api.example.com";
const body = `# Example Decisions

> Pay-per-call typed-decision and Africa-specific classification APIs. No API keys: every paid endpoint answers HTTP 402 with x402 v2 payment requirements (PAYMENT-REQUIRED header). Pay with USDC or USDT on Celo (eip155:42220); retry with the PAYMENT-SIGNATURE header.

## Paid endpoints

- [POST /api/v1/decide](${BASE}/api/v1/decide): typed decision, $0.01 per call
- [GET /api/v1/ng/classify](${BASE}/api/v1/ng/classify?text=...): classify a Nigerian payment narration, $0.001 per call

## Discovery

- [A2A agent card](${BASE}/.well-known/agent-card.json)
- [OpenAPI](${BASE}/openapi.json)

## Optional

- [How to pay with x402](https://docs.x402.org)
`;
export function GET() {
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
```

### 6.3 A2A agent card [src: a2aproject/A2A]

- **Path: `/.well-known/agent-card.json`.** A2A v0.3.0 (2025-07-30) renamed it from `agent.json`.
- **Versions.** A2A **v1.0.0** was released 2026-03-12, and **v1.0.1** on 2026-05-26.
- **What changed in v1.0:**
  - `supportedInterfaces[]` with `{url, protocolBinding: "JSONRPC"|"GRPC"|"HTTP+JSON", protocolVersion}`.
  - `capabilities.extensions[]`.
  - `securitySchemes` and `securityRequirements`.
  - JWS `signatures` on the card.
  - Enum values changed to SCREAMING_SNAKE_CASE.
- **Caching.** Serve it with `Cache-Control` and an `ETag`.
- **The x402 A2A extension URI (v0.2)** is `https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.2`. v0.1 used `https://github.com/google-a2a/a2a-x402/v0.1`.

```ts
// app/.well-known/agent-card.json/route.ts  (tested; served as a static route)
import { NextResponse } from "next/server";
export const dynamic = "force-static";
const BASE = process.env.PUBLIC_BASE_URL ?? "https://api.example.com";
export function GET() {
  return NextResponse.json({
    name: "Example Decisions",
    description: "Typed-decision and Africa-specific classification services. Pay per call with x402 (USDC/USDT on Celo).",
    supportedInterfaces: [{ url: `${BASE}/a2a/v1`, protocolBinding: "JSONRPC", protocolVersion: "1.0" }],
    provider: { organization: "Example Co", url: BASE },
    version: "0.1.0",
    documentationUrl: `${BASE}/llms.txt`,
    capabilities: {
      streaming: false, pushNotifications: false,
      extensions: [{ uri: "https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.2",
                     description: "Payments via x402 (exact scheme, eip155:42220)", required: true }],
    },
    defaultInputModes: ["application/json"], defaultOutputModes: ["application/json"],
    skills: [{ id: "decide", name: "Typed decision",
               description: "POST /api/v1/decide — pick one of N options with confidence. $0.01 per call (x402).",
               tags: ["decision", "x402"],
               examples: ['{"question":"Approve this loan?","options":["approve","decline","review"]}'] }],
  }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
```

Only advertise `supportedInterfaces` for an A2A endpoint you actually run. If you sell only HTTP routes, the card is optional; `llms.txt`, the Bazaar and ERC-8004 carry the discovery load.

### 6.4 ERC-8004 "Trustless Agents" [src: erc-8004/erc-8004-contracts, celo-org/docs]

**Status.** The EIP is still a **Draft**, created 2025-08-13. Its authors are from MetaMask, the Ethereum Foundation, Google and Coinbase. The **Validation Registry section is "still under active update"** and is not deployed. The Identity (ERC-721) and Reputation registries are live, at the same vanity addresses on every mainnet and on every testnet:

| Registry | Celo mainnet (42220) | Celo Sepolia (11142220) |
|---|---|---|
| IdentityRegistry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

**ABI.** The functions are `register(string agentURI) returns (uint256)` (plus overloads without arguments and with a metadata array), `setAgentURI`, `setAgentWallet(agentId, wallet, deadline, sig)`, `getMetadata` and `setMetadata`. The event is `Registered(uint256 agentId, string agentURI, address owner)`. The `agentWallet` metadata key is reserved: it is where the agent is paid, and it is cleared when the agent NFT is transferred [src].

**Registration file** (the `agentURI` target). The current format is:

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Example Decisions",
  "description": "Typed decisions + Nigerian payment-text classification. Pay per call via x402 (USDC/USDT on Celo). Prices: $0.01/decision.",
  "image": "https://api.yourdomain.com/icon.png",
  "services": [
    { "name": "web", "endpoint": "https://api.yourdomain.com/" },
    { "name": "A2A", "endpoint": "https://api.yourdomain.com/.well-known/agent-card.json", "version": "1.0" },
    { "name": "MCP", "endpoint": "https://api.yourdomain.com/mcp", "version": "2025-06-18" }
  ],
  "x402Support": true,
  "active": true,
  "registrations": [{ "agentId": 123, "agentRegistry": "eip155:42220:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" }],
  "supportedTrust": ["reputation"]
}
```

- **Watch the format.** Celo's docs page still shows the old shape (`"type":"Agent"` and an `endpoints` array). **8004scan flags that shape as deprecated or invalid**; Celopedia documents the fix [src].
- **Domain verification.** Optionally prove domain ownership with `https://{domain}/.well-known/agent-registration.json`.

**Registering with viem** (sketch, [src] ABI; not executed):

```ts
const { result: agentId, request } = await publicClient.simulateContract({
  account, address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  abi: [{ type: "function", name: "register", stateMutability: "nonpayable",
          inputs: [{ name: "agentURI", type: "string" }], outputs: [{ type: "uint256" }] }],
  functionName: "register", args: ["https://api.yourdomain.com/agent.json"],
});
await walletClient.writeContract({ ...request /*, feeCurrency: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" (pay gas in USDC) */ });
```

### 6.5 Celo's 2026 agent stack and programs [src unless marked]

**Self Agent ID.** An ERC-8004 deployment on Celo with a zero-knowledge proof-of-human: a passport or ID scan in the Self app, and a soulbound NFT with symbol `SAID`.

- **Contracts:**
  - SelfAgentRegistry: `0xaC3DF9ABf80d0F5c020C06B04Cced27763355944` on mainnet, `0x043DaCac8b0771DD5b444bCC88f2f8BBDBEdd379` on Sepolia.
  - SelfReputationRegistry: `0x69Da18CF4Ac27121FD99cEB06e38c3DC78F363f4`.
  - SelfValidationRegistry: `0x71a025e0e338EAbcB45154F8b8CA50b41e7A0577`.
- **SDKs** in TS, Python (`selfxyz-agent-sdk`) and Rust.

**Celo Agent Visa.** A tiered soulbound NFT at `0xCa97f7586CF9De62B8ca516d7Ee25f6AEae5e109`. Apply at `agentvisa.self.xyz`. The claim API is `https://agent-api.self.xyz`.

- **Tourist**: at least 1 transaction.
- **Work Visa**: requires Self Agent ID, plus 1,000+ transactions and $5K+ volume.
- **Citizenship**: 10K+ transactions or $15K+ volume.
- Benefits include DeFi incentives, featured placement, and access to **MiniPay's ~18M activated wallets**.

**Celopedia skill.** Install with `npx skills add celo-org/celopedia-skills`. It carries verified addresses, x402 and 8004 guidance, MiniPay rules and grants. **Two caveats:**

- Its "bare `$0.01` throws on Celo" warning is stale for `@x402/evm` ≥ 2.21.0 [exec].
- The same stale warning appears on docs.celo.org's x402 page.

**Other skills and tools:**

- The **Celo Builders skill** (`npx skills add https://celobuilders.xyz`) handles hackathon registration and issues **ERC-8021 attribution tags** (`@celo/attribution-tags`).
- **`celo-org/agent-skills`** has x402, 8004, MiniPay, fee-abstraction and similar skills. Its x402 skill uses the thirdweb flow.
- There is a Celo MCP server.

**MPP on Celo.** The hosted facilitator also settles MPP (`mppx`) credentials.

**Programs:**

- **Agents at Work Hackathon**: Aug 28 – Sep 14, 2026, $5K in CELO, winners announced Sep 25. Mainnet only; counterparties must be independent; attribution tags are required.
- **Onchain Agents Hackathon**: May 22 – Jun 15, 2026.
- **Build Agents for the Real World**: Mar 2–22, 2026, $8.5K.
- **Agentic Payments & DeFAI Hackathon**: Jul 7–20, 2026, according to the founder's README.
- **Prezenti Season 3 "Frontier" pool** for AI and agent-economy infrastructure. Its status is contradictory at the source, so confirm before applying.
- **Proof of Ship has been sunset.**

**AskBots.** A marketplace on Celo where agents earn **$0.10 USDT per accepted review**, with a $0.01 platform fee and escrow.

---

## 7. Other agentic-commerce rails (status as of 2026-09-26)

**MPP (Machine Payments Protocol, by Tempo and Stripe).**

- The core spec was submitted to the IETF as `draft-httpauth-payment` [src: tempoxyz/mpp]. It is the main competitor and complement to x402.
- **Headers:** `WWW-Authenticate: Payment` (the challenge), `Authorization: Payment` (the credential) and `Payment-Receipt`. Errors use RFC 9457.
- **Rails and features:** Tempo stablecoins, **Stripe card payments**, Lightning and custom methods, plus native `session` intents.
- **x402 compatibility:** `mppx` (0.11.0) can **serve both MPP and x402 `exact` on one endpoint** via `evm.charge({ x402: { facilitator } })`.
- **Celo:** Celo's hosted facilitator settles MPP too [src].
- **Launch:** mainnet on 2026-03-18, with partners including Visa (a card-spec SDK for MPP, April 2026), Lightspark (Lightning), Anthropic, OpenAI and Shopify [2nd].
- **Relevance to us:** worth adding alongside x402 if you want card-paying agents later; `mppx` makes it a single endpoint.

**Google AP2 (Agent Payments Protocol).**

- Versions: v0.1 (2025-09-16) and **v0.2 (2026-04-28)** [src: google-agentic-commerce/AP2].
- It is an authorization and trust layer built from Verifiable Digital Credentials:
  - In v0.2, a **Checkout Mandate** (shared with the merchant) and a **Payment Mandate** (shared with the credential provider and network), each with "open" (constraints) and "closed" (final) stages.
  - v0.1 used Intent, Cart and Payment mandates.
- It is payment-agnostic. x402 is the crypto form of payment through **`a2a-x402`**, whose v0.2 "embedded flow" puts x402 requirements inside AP2 mandates.
- It ships an SDK (Python) and samples in Python, Go and Android, including a "human-not-present x402" scenario.
- 60+ partners; Revolut Pay has supported it in the UK and EEA since 2026-01-19 [2nd].
- **Relevance:** only matters if you sell to consumer shopping agents. For our API-to-agent sales, x402 is the rail.

**UCP (Universal Commerce Protocol, Google with Shopify and others).**

- An open standard for the full shopping lifecycle: catalog, cart, checkout, orders and lodging.
- Discovery is at **`/.well-known/ucp`**. It offers REST, MCP and embedded transports, and uses AP2 mandates for payment [src: Universal-Commerce-Protocol/ucp, active 2026-09-25].
- It powers checkout in Google AI Mode and Gemini [2nd].
- **Relevance:** retail only. Not needed for paid APIs.

**OpenAI and Stripe ACP (Agentic Commerce Protocol).**

- Status is **Beta**, maintained by OpenAI and Stripe. Spec versions are 2025-09-29, 2025-12-12, 2026-01-16, 2026-01-30 and **2026-04-17** (the latest: cart, feed, orders, authentication, MCP) [src].
- It is card-centric: an Agentic Checkout API, **Delegate Payment** (single-use PSP tokens such as Stripe Shared Payment Tokens), 3DS delegated authentication and product feeds.
- It has no stablecoin or x402 method in the spec (grep of the spec) [src].
- ChatGPT Instant Checkout, its flagship deployment, was wound down in early March 2026. OpenAI pivoted to discovery and referral [2nd].
- **Relevance:** low for machine-to-machine API sales.

**Visa Intelligent Commerce and the Trusted Agent Protocol (TAP).**

- **TAP** [src: visa/trusted-agent-protocol, 2025-10] uses RFC 9421 HTTP message signatures. Agents prove their identity and the user's authorization to merchants on each request. It carries no payment data.
- **Visa Intelligent Commerce** is exposed to developers through `visa/ai` [src: 2026-06]: an MCP client with JWE auth, VIC/VDP API clients, VTS card tokenization, Visa Payment Passkey, and Claude Code skills.
- **Visa Intelligent Commerce Connect** launched 2026-04-08. It is one integration that translates between TAP, MPP, ACP and UCP [2nd].
- **Relevance:** card rails for consumer agents; not needed for x402 APIs. Worth watching if you want card-funded agents to buy your API through MPP.

**Mastercard Agent Pay** [2nd].

- It uses agentic tokens plus **Verifiable Intent**, a layered SD-JWT credential set covering issuer identity, user intent and agent fulfillment, with selective disclosure.
- Agent identity uses **Cloudflare Web Bot Auth**, also RFC 9421, the same primitive as Visa TAP.
- Live agent-initiated transactions in 9 APAC markets and in Latin America. The first European live payment was with Santander in March 2026, in a controlled environment.
- **Relevance:** the same as Visa.

**Stripe and Coinbase stablecoin payments for agents.**

- **Stripe** sits on the **x402 TSC** [src: TSC.md], co-authors **MPP**, co-maintains **ACP**, and ships agent tooling in `stripe/ai`: skills, a `stripe pay` CLI for business-to-business transfers, and Stripe Directory [src].
- **Coinbase** originated x402. It runs the CDP facilitator (with KYT/OFAC checks and the Bazaar), Payments MCP, and the CDP Wallet API (recommended in the x402 docs for agent keys) [src].
- **AmEx** shipped the ACE developer kit on 2026-04-14, with agent purchase protection. **L402** (Lightning) is the oldest 402 protocol [2nd].

**Bottom line.** For machine-to-machine API monetization, **x402 v2 is the most widely adopted rail and the one Celo supports first-class.** The card networks are converging on identity layers (RFC 9421) and on MPP as a multiplexer. Keep an MPP-compatible path in mind (`mppx` can dual-serve), but ship x402 now.

---

## 8. Founder's prior art (public repos)

All nine repos were cloned. Line counts are TS, JS and Solidity only.

### `eddiemessiah/omni402`: the most reusable

- **What it does.** It turns any HTTP API into a pay-per-call endpoint using `lanes.json`. A hub and a React dashboard show live payments and analytics with Celoscan links, and history persists across restarts. It includes a buyer SDK and CLI (`createBuyer`, `x402buy`) and a **stdio MCP server with `list_paid_apis` and `paid_fetch`**, so Claude or GPT agents can shop the catalog. It has an ERC-8004 registration CLI, a one-container Docker/Railway deploy, and smoke tests.
- **Timeline.** Created 2026-08-08, last commit 2026-08-16; 18 commits, about 3.4k LOC.
- **Stack.** TS pnpm monorepo, Express, **`mppx` 0.8.7 (pinned)** for settlement through `api.x402.celo.org` with `X-API-Key`, viem, React/Vite, MCP SDK ^1.30.
- **Reusable pieces:**
  - `packages/config` (the Celo network, asset and EIP-712 table, correct including USDT's domain).
  - The MCP "catalog plus paid_fetch" buyer pattern.
  - The event hub and dashboard.
  - Upstream secret injection (header or query) applied only after payment.
  - The Docker deploy.
  - The 8004 registration script.
- **Quality issues to fix before reuse:**
  1. **It settles *before* calling the upstream**, so buyers pay when the upstream fails.
  2. The "challenge-only" fallback emits a hand-rolled **v1-shaped** body with a CAIP-2 network. It then **verifies without settling and proxies the upstream**, which serves content unpaid. Never expose that mode.
  3. `x402-express` (v1, no Celo) is a dependency but is unused.
  4. `agent.json` uses the deprecated 8004 shape, and its MCP "endpoint" is the GitHub URL.
  5. The lanes resell CoinGecko, Blockscout and Etherscan, which is a terms-of-service risk.
  6. mppx 0.8.7's compatibility with stock `@x402/fetch` agents is unverified.
- **Verdict.** It is the best skeleton for a multi-endpoint agent storefront. Swap settlement to `@x402/next` / `@x402/express` v2, or to a newer `mppx` dual-protocol setup with settle-after-success.

### `eddiemessiah/relay-verdict` ("agents-celo")

- **What it does:**
  - **Relay** is an A2A service directory where agents list metered services and others pay per call over x402.
  - **Verdict** is a reputation oracle. It probes agent endpoints, issues signed scorecards, and publishes them to the ERC-8004 Reputation Registry.
  - It has an SSE event stream, a Next.js 15 dashboard (marketplace, arena, admin), and agent onboarding files (`skill.md`, `/.well-known/agent.json`).
- **Timeline.** 2026-07-19 to 07-29; 9 commits, about 5.3k LOC.
- **Stack.** Framework-free Node `http`, viem, `@celo/attribution-tags`, Next 15.
- **Reusable pieces:**
  - The `packages/celo-pay/stables.ts` token table, including the fee-currency adapters.
  - MiniPay hooks.
  - ERC-8004 helpers (`fetchRegistration`, `publishScoreOnchain`, `readVerdictSummary`).
  - The Verdict idea, "buy a trust score before dealing with an agent", which is a natural paid product for us.
  - The `skill.md` pattern for onboarding agents.
- **Quality issues:**
  - It is a hand-rolled **x402 v1** (`X-PAYMENT`, `maxAmountRequired`).
  - `FACILITATOR_URL = "https://x402.celo.org"` points at the **dashboard, not the API**, and there is **no `X-API-Key`**, so live `/settle` would fail with 401.
  - It settles before serving.
  - The **"swarm" volume engine pays its own treasury in a loop.** That is self-dealing volume, conflicts with Celo's independent-counterparty rules, and is a reputational risk for 8004 and 8004scan rankings.
  - Its directory is in-memory, and the Verdict key is ephemeral by default.

### `eddiemessiah/ajo-agent`

- **What it does.** A roughly 130-line CLI that pays the weekly pot of a five-person ajo circle in USA₮ from an agent wallet. It defaults to a dry run, and ERC-8021 attribution tags go in the calldata. It was built live with **Women in Blockchain Africa (WIBA)** for Agents at Work (2026-09-10, 1 commit).
- **Reusable pieces.** The "dry-run by default; spending must be explicit" UX, and the attribution-tag suffix.
- **Caveats.** The agent wallet holds the pot, so it is custodial. `circle.json` uses placeholder wallets. It is demo-grade.

### `eddiemessiah/ajo-circle`: the strongest Africa-product signal

- **What it does.** A Telegram bot (grammY) that runs rotating savings circles. Members pay each other **directly, non-custodially**, in USDT, USA₮ or **cNGN**, through pay pages (Hono) that open in MiniPay or wallet browsers. The server **verifies each payment from the receipt's `Transfer` log and checks the attribution tag**. An ERC-8004 registration script uses the **current `registration-v1`/`services` format**.
- **Timeline.** 2026-09-15, 1 commit, about 1k LOC.
- **Stack.** TS 7, viem 2.56, grammY, Hono, `@celo/attribution-tags` 0.3.
- **Reusable pieces:**
  - `verifyPayment()`, for a non-x402 direct-transfer fallback aimed at MiniPay humans.
  - Its compliance with MiniPay rules (auto-connect, no `personal_sign`, fee pre-flight).
  - The 8004 registration script.
  - **Its roadmap item, an "x402 contribution-record API"**: consented, pay-per-request on-time-payment histories for lenders and agents. That is an ideal Africa-specific paid data product for this company.
- **Caveats.** A JSON-file store, no enforcement of payments, and a single squashed commit.

### `eddiemessiah/agentbazaar`

- **What it does.** A marketplace MVP on the **0G Galileo testnet**: agent INFTs plus ERC-6551 token-bound accounts, and a Next 16 / wagmi UI. Its **`x402Router.sol` is not x402**: it is a native-token `payable` splitter that takes a 3% fee.
- **Timeline and quality.** 2026-03-24, 1 commit. It still carries the Hardhat sample README.
- **Reuse.** Low; conceptual only (agent NFTs with wallets).

### `eddiemessiah/agent-checkout-skill`

- **What it is.** A **mirror of `selfxyz/agent-checkout-recipes`**. All 43 commits are by a Self engineer (`0xturboblitz`), so this is **not founder-authored code**. It is a registry of browser checkout "recipes" (Shopify, WooCommerce+Stripe, …) packaged as an agent skill for skills.sh.
- **Reuse.** A good reference for packaging our services as installable agent skills and for registry, schema and CI hygiene. It complements x402, because it covers agents buying from web2 merchants.

### `eddiemessiah/wiba-agents-at-work`

- **What it is.** A single 78 KB self-contained HTML slide deck, "Agents at Work Live Build", WIBA edition, using AskBots branding, plus five bot images (2026-09-10).
- **Reuse.** Pitch and community material; it shows a live WIBA channel.

### `eddiemessiah/celo-agent-hackathon` ("Padi & Oga")

- **What it does:**
  - **Padi** is a pay-per-question AI study buddy for JAMB and WAEC, at **₦20 ≈ $0.013 per question**. It is built on Next.js 15 with an x402-gated `/api/ask`.
  - **Oga** is an X and Telegram micro-gig agent at ₦20–₦200.
  - Contracts: ScholarBoard, GigReceipts and CircleEscrow.
  - It includes livestream scripts and go-live, registration and Celopedia-review docs.
- **Timeline.** 2026-07-12 to 07-15, 4 commits, about 3.6k LOC.
- **Reusable pieces.** Naira-street pricing and a "first value free" funnel, a MiniPay-first 360×640 UI, and GigReceipts for on-chain work history.
- **Issues.** It has the same `celo-pay` problems as relay-verdict (v1 and the dashboard URL without a key). It also **settles before generating the answer**; the free question is keyed on a **spoofable `x-wallet` header** (SIWX from `@x402/extensions` would fix that); an unset `PAYTO` serves answers for free; and it uses Next 15, while `@x402/next` needs 16.2.6+.

### `eddiemessiah/agentguide`

- An **empty repository**, created 2026-03-27 with the description "agents need this to learn and transact". Nothing to reuse.

**Summary for the build.**

- **Reuse:**
  - omni402's architecture: gateway, dashboard, MCP buyer, Docker.
  - The Celo token and adapter tables from omni402's config and relay-verdict's `stables.ts`.
  - ajo-circle's receipt verifier and its 8004 script, which uses the correct format.
  - relay-verdict's Verdict and 8004 reputation helpers.
  - The Padi/ajo Africa product insights.
- **Replace:** every hand-rolled v1 x402 path with the `@x402/*` v2 code in §4.
- **Drop:** the swarm volume engine.

---

## 9. Pricing norms seen in the wild

| Where | Price |
|---|---|
| x402 official examples | $0.001 (weather), $0.01, $0.10 (MCP "financial_analysis"). MCP README tiers of $0.05 and $0.50 [src] |
| Bazaar docs sample listing (Base) | 200 atomic USDC = **$0.0002** [src] |
| Celo official examples (docs, celo-org and GigaHierz demos) | **$0.01** per request [src] |
| omni402 lanes | $0.001 (token prices), $0.002 (chain data), $0.01 (Etherscan) [src] |
| relay-verdict | $0.001 (echo, wordcount), $0.005 (Verdict trust score) [src] |
| Padi / Oga (Nigeria) | ₦20 ≈ **$0.013** per question; ₦20–₦200 per gig [src] |
| AskBots (Celo) | $0.10 USDT per accepted review, plus a $0.01 platform fee [src] |
| Hosted Celo facilitator cost | **$0.001 per settlement**. Celo gas is under $0.001 per transaction [src] |
| Market-level | About 100M+ lifetime x402 payments by Q1 2026. Average value about $0.20, with a lot of test or synthetic traffic [2nd] |
| Practical minimums | About $0.001 for x402, about $0.0001 for MPP [2nd] |

**Suggested prices for us:**

- **Typed decisions (Jev / System One):** $0.01–$0.05 per call (model cost plus a 10% facilitator fee plus margin), and $0.10–$0.50 for heavy or long-context decisions.
- **Africa data and classification lookups:** $0.005–$0.01 per call on the hosted facilitator.
- **Go sub-cent only after self-hosting a facilitator or adopting batch settlement.**
- Always show a naira equivalent in human-facing docs.

---

## 10. Risks and gotchas

1. **Two package generations.** Anything named `x402-*` (no scope) is v1 and **cannot do Celo**. Several founder repos and some Celo skill docs still show v1-shaped code [src, npm].
2. **`@x402/next` needs `next >= 16.2.6`.** The founder's Next 15 apps must upgrade, or npm will fail with an ERESOLVE peer-dependency error [npm].
3. **Stale "bare `$0.01` throws on Celo" warnings** appear in the Celo docs, Celopedia and the demos. They are fixed in `@x402/evm` 2.21.0, and 2.26.0 is needed for the `USDT`/`USAT` suffixes [exec]. Pin exact versions. An explicit `{amount, asset, extra}` price is still fine.
4. **The EIP-712 domain differs by chain.** Celo USDC is `"USDC"/"2"` while Base USDC is `"USD Coin"/"2"`, and USDT is `"Tether USD"/"1"`. A wrong domain means an invalid signature [src, exec].
5. **USDm (ex-cUSD) and all Mento local stables (NGNm, KESm, …) are permit-only.** They do not work with the hosted facilitator or standard `exact` [src].
6. **The x402.org facilitator does not support Celo**, not even Celo Sepolia. Testing needs `api.x402.sepolia.celo.org` plus an API key, or a self-hosted facilitator [src].
7. **Point at `api.x402.celo.org`, not `x402.celo.org`, and send `X-API-Key`.** Without the key, `/verify` and `/supported` succeed, so everything "looks fine" until the first `/settle` returns 401. Other codes: 402 means out of credits, 429 means the free-tier rate limit [src]. Two founder repos have this bug.
8. **Fee maths.** A $0.001 settlement fee on a $0.001 price leaves nothing. Set a floor of ≥ $0.01, or self-host [src].
9. **Use `withX402`, not `paymentProxy`, for APIs.** The proxy settles even when the API fails. Keyed route patterns must match exactly, otherwise the route runs unpaid (with one warning) [src].
10. **Long handlers.** `maxTimeoutSeconds` (default 300) is the authorization window. If settle fails after the handler ran, the content is withheld but your compute is spent [src].
11. **Build-time facilitator calls.** `next build` evaluates the route modules and tries `/supported`. It logs `Failed to fetch supported kinds…` if the facilitator is unreachable. This is harmless: runtime re-initializes lazily on the first request [exec]. Expect one `/supported` call per route module on each cold start [exec].
12. **CORS for browser payers.** The SDK does not set `Access-Control-Expose-Headers`. Expose `PAYMENT-REQUIRED` and `PAYMENT-RESPONSE`, and allow `PAYMENT-SIGNATURE`, for cross-origin web and MiniPay clients [src: grep]. Server-to-server agents are unaffected.
13. **Client defaults.** The spend cap is $1 per payment, and only default assets are allowed. Agents paying non-default tokens need `allowedAssets` [src, exec].
14. **v2 402 bodies are `{}`, so v1-only agents can't read them.** That is moot on Celo (v1 never supported Celo), but it matters for any Base leg that targets old agents. Use `unpaidResponseBody` if needed [exec, src].
15. **Discovery gap.** The Celo facilitator does not catalog routes. Without a Base/CDP leg or other listings, agents only find you through `llms.txt`, 8004, the A2A card or word of mouth [src].
16. **thirdweb lock-in** for USDm: its Permit requirements can only be paid by thirdweb clients [src].
17. **No `upto` on Celo yet** (no Permit2 proxy deployment). Metered LLM pricing has to be approximated with fixed tiers or a `DynamicPrice` computed before execution [src].
18. **Integrity and reputation.** Self-paid "volume swarms" breach hackathon rules and poison 8004 reputation. ERC-8021 attribution cannot ride facilitator-submitted settlement transactions [src].
19. **Free-tier abuse.** Don't key free calls on client-supplied headers. Use SIWX (`@x402/extensions/sign-in-with-x`) and per-wallet limits [src].
20. **Terms of service.** Reselling third-party APIs (as omni402's lanes do) needs a licence. Sell our own models and data [src].
21. **Compliance.** CDP runs KYT/OFAC checks, but the Celo facilitator's screening is unknown. Stablecoin receipts in Nigeria have regulatory and tax implications: take counsel before scaling [unverified].
22. **Key management.** Keep `X402_API_KEY` server-only; anyone with it can spend your settlement credits. `payTo` should be a receive-only or multisig address. Agent keys should be low-balance and capped [src].
23. **Governance drift.** x402 moved to a foundation in April 2026 and ships a minor release roughly weekly (2.17 to 2.27 between June and September). Pin versions and watch `CHANGELOG.md`, especially for header and extension changes [npm, src].

---

## 11. Sources

"HEAD" is the commit that was cloned; all repos were cloned on 2026-09-26. Everything below was read from GitHub or npm, since WebSearch was unavailable and the live hosts were blocked.

**x402 core**

- `x402-foundation/x402`, HEAD `4fcf836` (2026-09-25). https://github.com/x402-foundation/x402
  - Spec: `specs/x402-specification-v2.md`, `specs/x402-specification-v1.md`, `specs/transports-v2/{http,mcp,a2a}.md`, `specs/transports-v1/http.md`, `specs/extensions/bazaar.md`, `specs/schemes/**`.
  - TS packages: `typescript/packages/mechanisms/evm/src/{defaultAssets,constants}.ts`, `…/evm/CHANGELOG.md` (2.21.0 and 2.26.0 Celo entries), `typescript/packages/http/next/{README.md,src/index.ts,src/utils.ts,src/adapter.ts}`, `typescript/packages/core/src/{server/x402ResourceServer.ts,http/x402HTTPResourceServer.ts,http/httpFacilitatorClient.ts,client/x402Client.ts,utils}`, `typescript/packages/extensions/src/bazaar/*`, `typescript/packages/mcp/README.md`, `typescript/packages/http/fetch/README.md`.
  - Examples: `examples/typescript/{fullstack/next,clients/fetch,clients/mcp,servers/self-facilitation}`.
  - Docs: `docs/dev-tools/facilitators.md` (Celo facilitator entry added in commit `4fb5d07`, 2026-09-15), `docs/core-concepts/network-and-token-support.mdx`, `docs/extensions/bazaar.mdx`, `docs/getting-started/quickstart-for-{sellers,buyers}.mdx`, `docs/faq.md`.
  - Governance and contracts: `contracts/evm/README.md`, `TSC.md`, `foundation/x402 Technical Charter March 31, 2026.pdf`.
- `coinbase/x402`, HEAD `dd927a2` (2026-04-21): README move note. https://github.com/coinbase/x402

**npm registry and tarballs** (2026-09-26)

- `@x402/{core,evm,next,fetch,axios,express,hono,fastify,extensions,mcp,paywall,svm}`, `x402`, `x402-{next,hono,express,fetch,axios}`, `@coinbase/x402@2.1.0`, `mppx@0.11.0`, `thirdweb@5.121.6` (`dist/esm/x402/*`), `@faremeter/info@0.22.0`, `@coinbase/payments-mcp@1.0.5`, `next@16.3.6`, `typescript@7.0.2`.

**Celo**

- `celo-org/docs`, HEAD `ce74dc9` (2026-09-25), the source of docs.celo.org. https://github.com/celo-org/docs
  - `build-on-celo/build-with-ai/{x402,8004,mpp,overview,celopedia,self-agent-id}.mdx`
  - `build-on-celo/build-with-ai/mcp/celo-mcp.mdx` (USDm rename)
  - `tooling/contracts/{stablecoin-contracts,fee-currencies,core-contracts}.mdx`
  - `operate/notices/archive/celo-sepolia-launch.mdx` (Alfajores sunset)
  - `AGENTS.md`
- `celo-org/celopedia-skills`, HEAD `316dbb1` (2026-09-14): `skills/celopedia-skill/references/{ai-agents,grants-funding}.md`. https://github.com/celo-org/celopedia-skills
- `celo-org/agent-skills`, HEAD `c414cbb` (2026-09-13): `skills/x402/SKILL.md`. https://github.com/celo-org/agent-skills
- `celo-org/x402-celo-example-deprecated`, HEAD `099861f` (2026-07-13), archived. https://github.com/celo-org/x402-celo-example-deprecated
- `GigaHierz/x402-celo-demo`, HEAD `c993160` (2026-07-14): README, `COMPARISON.md` (the "same backend" finding and verified mainnet/Sepolia transactions), `FEEDBACK.md`. https://github.com/GigaHierz/x402-celo-demo
- `Gomathi1806/celo_pico`, HEAD `c46acb0` (2026-06-17): thirdweb + USDm on Celo. https://github.com/Gomathi1806/celo_pico
- `x402-rs/x402-rs`, HEAD `e75adda` (2026-07-13): `crates/x402-types/src/networks.rs` (celo, celo-sepolia). https://github.com/x402-rs/x402-rs

**Discovery and identity**

- `erc-8004/erc-8004-contracts`, HEAD `b9e466c` (2026-08-15): README (deployments), `ERC8004SPEC.md`, `abis/IdentityRegistry.json`. https://github.com/erc-8004/erc-8004-contracts
- `a2aproject/A2A` (2026-09-25): `docs/specification.md` §8, `CHANGELOG.md`, `docs/whats-new-v1.md`. https://github.com/a2aproject/A2A
- `google-agentic-commerce/a2a-x402` (2026-05-24): `spec/v0.2/spec.md`. https://github.com/google-agentic-commerce/a2a-x402
- `AnswerDotAI/llms-txt` (2026-09-25): `nbs/index.qmd`. https://github.com/AnswerDotAI/llms-txt

**Other rails**

- `google-agentic-commerce/AP2`, HEAD `e1ea56d` (2026-04-29): `CHANGELOG.md`, `docs/index.md`, `docs/faq.md`. https://github.com/google-agentic-commerce/AP2
- `agentic-commerce-protocol/agentic-commerce-protocol`, HEAD `7fdd78d` (2026-07-17): README, `changelog/2026-04-17.md`, `spec/`. https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
- `Universal-Commerce-Protocol/ucp` (2026-09-25). https://github.com/Universal-Commerce-Protocol/ucp
- `tempoxyz/mpp` (2026-09-26): README, `src/pages/mpp-vs-x402.mdx`, `src/pages/blog/evm-x402-support.mdx`. https://github.com/tempoxyz/mpp
- `visa/trusted-agent-protocol` (2025-10-28). https://github.com/visa/trusted-agent-protocol
- `visa/ai` (2026-06-08). https://github.com/visa/ai
- `stripe/ai` (2026-09-26): `skills/stripe-pay/SKILL.md`. https://github.com/stripe/ai
- `coinbase/payments-mcp` (2025-10-22). https://github.com/coinbase/payments-mcp
- [2nd] `Custena/agent-payment-protocols`, "The State of Agent Payment Protocols (April 2026)", 2026-04-20. It covers the x402 Foundation launch, MPP mainnet, Visa ICC, Mastercard Agent Pay, AmEx ACE, ACP Instant Checkout wind-down and x402 volume figures. https://github.com/Custena/agent-payment-protocols

**Founder repos** (all cloned 2026-09-26)

- `omni402`: last commit 2026-08-16. https://github.com/eddiemessiah/omni402
- `relay-verdict`: 2026-07-29. https://github.com/eddiemessiah/relay-verdict
- `ajo-agent`: 2026-09-10. https://github.com/eddiemessiah/ajo-agent
- `ajo-circle`: 2026-09-15. https://github.com/eddiemessiah/ajo-circle
- `agentbazaar`: 2026-03-24. https://github.com/eddiemessiah/agentbazaar
- `agent-checkout-skill`: 2026-08-21, a mirror of selfxyz. https://github.com/eddiemessiah/agent-checkout-skill
- `wiba-agents-at-work`: 2026-09-10. https://github.com/eddiemessiah/wiba-agents-at-work
- `celo-agent-hackathon`: 2026-07-15. https://github.com/eddiemessiah/celo-agent-hackathon
- `agentguide`: empty. https://github.com/eddiemessiah/agentguide
