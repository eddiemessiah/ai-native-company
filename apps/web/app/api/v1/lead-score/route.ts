import { discovery, leadScore } from "@/lib/paid-handlers";
import { paid } from "@/lib/x402";

export const runtime = "nodejs";
export const POST = paid("lead-score-api", leadScore, discovery.lead);
