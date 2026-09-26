import { discovery, grantFit } from "@/lib/paid-handlers";
import { paid } from "@/lib/x402";

export const runtime = "nodejs";
export const POST = paid("grant-fit-api", grantFit, discovery.grant);
