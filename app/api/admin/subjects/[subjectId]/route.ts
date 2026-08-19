import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  iconUrl: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(req: Request, { params }: { params: { subjectId: string } }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const subject = await db.subject.update({
    where: { id: params.subjectId },
    data: parsed.data,
  });

  return NextResponse.json({ subject });
}

export async function DELETE(_req: Request, { params }: { params: { subjectId: string } }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await db.subject.delete({ where: { id: params.subjectId } });
  return NextResponse.json({ message: "Subject deleted" });
}
