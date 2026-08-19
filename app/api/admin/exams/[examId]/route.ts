import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  durationMin: z.number().int().min(5).max(180).optional(),
});

export async function PATCH(req: Request, { params }: { params: { examId: string } }) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const exam = await db.exam.update({ where: { id: params.examId }, data: parsed.data });
  return NextResponse.json({ exam });
}

export async function DELETE(_req: Request, { params }: { params: { examId: string } }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await db.exam.delete({ where: { id: params.examId } });
  return NextResponse.json({ message: "Exam deleted" });
}
