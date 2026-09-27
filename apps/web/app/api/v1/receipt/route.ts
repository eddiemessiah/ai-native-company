import { discovery, receipt } from "@/lib/paid-handlers";
import { paid } from "@/lib/x402";

export const runtime = "nodejs";
export const POST = paid("nova-receipt", receipt, discovery.receipt);
