import { NextResponse } from "next/server";
import { beta, clearSession } from "@/lib/beta";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return beta(async () => {
    await clearSession();
    return NextResponse.json({ ok: true });
  }, req);
}
