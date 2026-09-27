import { discovery, triage } from "@/lib/paid-handlers";
import { paid } from "@/lib/x402";

export const runtime = "nodejs";
export const POST = paid("triage-api", triage, discovery.triage);
