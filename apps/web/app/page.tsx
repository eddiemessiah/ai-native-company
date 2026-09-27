import "@fontsource/shippori-mincho-b1/500.css";
import "./temple.css";

import { brand, chapters, offerBySlug, offers, proofs, tracks, type Offer } from "@repo/catalog";
import { agentProducts } from "@/components/agent-products";
import { Bell } from "@/components/temple/bell";
import { Boards } from "@/components/temple/boards";
import { Bowl } from "@/components/temple/bowl";
import { TempleDefs } from "@/components/temple/defs";
import { Dragon } from "@/components/temple/dragon";
import { GateIntro } from "@/components/temple/gate-intro";
import { Hero } from "@/components/temple/hero";
import { Lantern } from "@/components/temple/lantern";
import { Paths } from "@/components/temple/paths";
import { School } from "@/components/temple/school";
import { Stones } from "@/components/temple/stones";
import { Stops } from "@/components/temple/stops";
import { Witness } from "@/components/temple/witness";
import { paymentNetworks } from "@/lib/chain";

/** The services hung on the boards, cheapest first. */
const BOARDS = [
  "ai-visibility-audit",
  "agent-ready-website",
  "grant-desk",
  "agent-readiness-audit",
  "agent-launch-sprint",
  "agent-reliability-audit",
  "acquisition-automation-map",
  "company-brain",
  "agent-integration-100",
];

/** One rule from each of these rulebooks, word for word from the catalog. */
const RULES: readonly [string, number][] = [
  ["shonin-check", 3],
  ["grant-desk", 2],
  ["agent-launch-sprint", 1],
];

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n < 1 ? 2 : 0 })}`;

export default function Home() {
  const check = offerBySlug("shonin-check");
  const audit = offerBySlug("ai-visibility-audit");
  const harness = offerBySlug("gtm-harness");
  const study = offerBySlug("ai-study-group");
  const callPrice = check?.api ? usd(check.api.priceUsd) : "a cent";
  const auditPrice = audit?.checkout ? usd(audit.checkout.amountUsd) : "fixed-price";
  const services = BOARDS.map((s) => offerBySlug(s)).filter((o): o is Offer => Boolean(o));
  const names = Object.fromEntries(offers.map((o) => [o.slug, o.name]));
  const apis = offers.filter((o) => o.api).map((o) => o.slug);
  const rules = RULES.flatMap(([slug, i]) => {
    const o = offerBySlug(slug);
    const rule = o?.rulebook[i];
    return o && rule ? [{ rule, offer: o.name }] : [];
  });
  const free = offers.filter((o) => o.firstJobFree).map((o) => o.name);

  return (
    <>
      <GateIntro />
      <TempleDefs />
      <Hero callPrice={callPrice} auditPrice={auditPrice} />
      <Paths callPrice={callPrice} auditPrice={auditPrice} />
      <Dragon />
      <Stops products={agentProducts} callPrice={callPrice} networks={paymentNetworks().join(" · ")} />
      <Witness names={names} apis={apis} />
      <Boards services={services} total={offers.length} />
      {harness ? <Lantern harness={harness} /> : null}
      {study ? <School study={study} tracks={tracks} chapters={chapters} /> : null}
      <Bowl rules={rules} />
      <Stones
        proofs={proofs}
        founder={{
          name: brand.founder.name,
          role: brand.founder.role,
          line: `${brand.founder.alias} · ${brand.founder.based}`,
          detail:
            "AI builder and workshop facilitator. Builds multi-agent orchestrations and agentic payment systems on Celo; four years growing builder ecosystems across Africa. Owns every outcome the firm delivers.",
        }}
        agent={{
          name: brand.agent.name,
          role: brand.agent.role,
          line: "System One brain · every decision logged",
          detail: brand.agent.description,
        }}
      />
      <Bell freeAudit={free.length ? free.join(" or ") : null} />
    </>
  );
}
