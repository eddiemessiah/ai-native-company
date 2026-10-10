import { routeModel } from "@repo/gtm-harness";
import { NextResponse } from "next/server";
import { betaCtx } from "@/lib/beta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** What's set up on this deployment. Names only, never a secret. */
export async function GET() {
  const { cfg, storeKind } = betaCtx();
  return NextResponse.json(
    { store: storeKind, gate: cfg.gate, telegram: Boolean(cfg.telegram), x: Boolean(cfg.x), model: Boolean(routeModel(process.env)), missing: cfg.missing },
    { headers: { "cache-control": "no-store" } },
  );
}
