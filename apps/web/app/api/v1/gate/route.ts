import { discovery, gateAction } from "@/lib/paid-handlers";
import { paid } from "@/lib/x402";

export const runtime = "nodejs";
export const POST = paid("shonin-gate", gateAction, discovery.gate);
