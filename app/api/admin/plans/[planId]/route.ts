import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const updateSchema = z.object({
  priceKobo: z.number().int().min(0).optional(),
  description: z.string().optional(),
  subjectLimit: z.number().int().min(1).nullable().optional(),
  includesLive: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { planId: string } }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const plan = await db.plan.update({ where: { id: params.planId }, data: parsed.data });
  return NextResponse.json({ plan });
}
