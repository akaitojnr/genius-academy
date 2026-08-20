import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const plans = await db.plan.findMany({ orderBy: { priceKobo: "asc" } });
  return NextResponse.json({ plans });
}
