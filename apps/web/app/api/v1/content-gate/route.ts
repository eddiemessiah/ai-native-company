import { contentGate, discovery } from "@/lib/paid-handlers";
import { paid } from "@/lib/x402";

export const runtime = "nodejs";
export const POST = paid("content-gate-api", contentGate, discovery.content);
