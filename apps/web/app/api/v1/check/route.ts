import { check, discovery } from "@/lib/paid-handlers";
import { paid } from "@/lib/x402";

export const runtime = "nodejs";
export const POST = paid("shonin-check", check, discovery.check);
