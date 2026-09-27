import type { Metadata } from "next";
import { offers } from "@repo/catalog";
import { AgentProducts, agentProducts } from "@/components/agent-products";
import { Arrow, StatusPill } from "@/components/bits";
import { Reveal } from "@/components/reveal";
import { baseConfigured, USDC_CELO } from "@/lib/chain";

export const metadata: Metadata = {
  title: "For agents",
  description:
    "Shonin Check, Shonin Gate and Shonin Receipt: what an agent asks before it pays, before it acts, and after it pays. Paid per call with x402, no accounts, no API keys.",
};

const CLIENT = `import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

// Holds USDC. No gas token needed: the facilitator submits the transfer.
const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as \`0x\${string}\`);
const client = new x402Client().register("eip155:*", new ExactEvmScheme(account));
client.setSpendControls({ maxAmountPerPayment: "$0.10" }); // hard cap per call
const pay = wrapFetchWithPayment(fetch, client);

// Before paying any x402 API, ask Shonin Check ($0.01).
const url = "https://api.example.com/v1/rates";
const first = await fetch(url);
if (first.status === 402) {
  const check = await pay("https://<site>/api/v1/check", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      paymentRequired: first.headers.get("PAYMENT-REQUIRED"),
      url,
      task: "Get today's USD/EUR rate for the invoice",
      budgetUsd: 0.05,
    }),
  });
  const { verdict, reasons } = await check.json(); // "pay" | "confirm" | "block"
  if (verdict !== "pay") throw new Error(\`Ask a person first: \${reasons.join("; ")}\`);
}
const rates = await pay(url);`;

const FLOW = [
  { k: "Ask", d: "Call the endpoint like any API." },
  { k: "402", d: "The response carries the price: amount, stablecoin, network, payee, and a 5-minute window." },
  { k: "Sign", d: "Your agent signs a gasless EIP-3009 transfer authorization. No transaction yet." },
  { k: "Retry", d: "Send it in the PAYMENT-SIGNATURE header. We run the job." },
  { k: "Settle", d: "Only if the job succeeds does the facilitator settle. Errors are never charged." },
];

export default function AgentsPage() {
  const order = { live: 0, beta: 1, soon: 2 } as const;
  const front = new Set(agentProducts.map((o) => o.slug));
  const apis = offers.filter((o) => o.api && !front.has(o.slug)).sort((a, b) => order[a.status] - order[b.status]);
  return (
    <div className="wrap pb-10 pt-32">
      <p className="label">For agents and the people who build them</p>
      <h1 className="mt-5 max-w-5xl text-[clamp(44px,7.5vw,112px)] font-semibold leading-[0.9] tracking-[-0.055em]">
        The request <span className="serif text-dim">is the</span> transaction.
      </h1>
      <p className="mt-8 max-w-2xl text-lg text-dim">
        Everything here is a plain HTTP endpoint. There are no accounts and no API keys: an agent pays per call in
        stablecoins with x402 v2, and settlement only happens when the call succeeds. Every answer says how it was
        decided, so your agent can gate on it.
      </p>

      <section className="mt-16">
        <h2 className="label">Three things every paying agent needs</h2>
        <div className="mt-6">
          <AgentProducts anchors />
        </div>
      </section>

      <ol className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
        {FLOW.map((s, i) => (
          <Reveal as="li" key={s.k} delay={i * 0.05} className="bg-bg p-6">
            <span className="font-mono text-xs text-faint">0{i + 1}</span>
            <p className="mt-6 text-2xl font-semibold tracking-[-0.03em]">{s.k}</p>
            <p className="mt-2 text-sm leading-relaxed text-dim">{s.d}</p>
          </Reveal>
        ))}
      </ol>

      <section className="mt-24">
        <h2 className="label">More endpoints: decision recipes</h2>
        <div className="mt-6 space-y-5">
          {apis.map((o) => (
            <Reveal key={o.slug}>
              <article id={o.slug} className="card grid gap-6 p-6 lg:grid-cols-12 lg:p-8">
                <div className="lg:col-span-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill status={o.status} />
                    <span className="font-mono text-sm text-dim">${o.api!.priceUsd.toFixed(3)} / call</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{o.name}</h3>
                  <p className="mt-2 text-dim">{o.oneLiner}</p>
                  <p className="mt-5 font-mono text-[13px]">
                    <span className="text-decide">{o.api!.method}</span> {o.api!.path}
                  </p>
                  {o.status === "soon" ? (
                    <p className="mt-4 text-sm text-faint">{o.rulebook[o.rulebook.length - 1]}</p>
                  ) : null}
                </div>
                <pre className="overflow-x-auto rounded-2xl border border-line bg-bg-2 p-5 font-mono text-[12.5px] leading-relaxed text-dim lg:col-span-7">
                  <code>{JSON.stringify(o.api!.inputExample, null, 2)}</code>
                </pre>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-24 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="label">Pay from an agent</h2>
          <p className="mt-5 text-dim">
            With <code className="font-mono text-fg">@x402/fetch</code> and a viem account, paying is a wrapped fetch.
            Cap spend per call on the client, and ask Shonin Check before paying anyone you don&apos;t know.
          </p>
          <dl className="mt-8 space-y-4 font-mono text-[12.5px]">
            <div>
              <dt className="text-faint">NETWORK</dt>
              <dd className="mt-1">Celo mainnet · eip155:42220</dd>
            </div>
            <div>
              <dt className="text-faint">ASSET</dt>
              <dd className="mt-1 break-all">USDC · {USDC_CELO}</dd>
            </div>
            <div>
              <dt className="text-faint">ALSO ACCEPTED</dt>
              <dd className="mt-1">USDT on Celo{baseConfigured() ? " · USDC on Base (eip155:8453)" : ""}</dd>
            </div>
            <div>
              <dt className="text-faint">PROTOCOL</dt>
              <dd className="mt-1">x402 v2 · exact scheme · PAYMENT-REQUIRED / PAYMENT-SIGNATURE / PAYMENT-RESPONSE</dd>
            </div>
          </dl>
        </div>
        <Reveal className="lg:col-span-8">
          <pre className="card overflow-x-auto p-6 font-mono text-[12.5px] leading-[1.7] text-dim">
            <code>{CLIENT}</code>
          </pre>
        </Reveal>
      </section>

      <section className="mt-24">
        <h2 className="label">Discovery</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/llms.txt", t: "llms.txt", d: "Plain-text index for language models" },
            { href: "/.well-known/agent-card.json", t: "agent-card.json", d: "A2A agent card with skills and prices" },
            { href: "/agent.json", t: "agent.json", d: "ERC-8004 registration file" },
            { href: "/api/v1/catalog", t: "catalog.json", d: "Every offer, unit, price and endpoint" },
          ].map((l) => (
            <li key={l.href}>
              <a href={l.href} className="card flex h-full flex-col justify-between p-5 transition-colors hover:border-line-2">
                <span className="font-mono text-[15px] text-fg">{l.t}</span>
                <span className="mt-4 flex items-end justify-between gap-3 text-sm text-dim">
                  {l.d} <Arrow />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
