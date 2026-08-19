import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  instructions: z.string().min(3).optional(),
  dueDate: z.string().datetime().optional(),
});

export async function PATCH(req: Request, { params }: { params: { assignmentId: string } }) {
  const auth = await requireRole(["TEACHER", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const { dueDate, ...rest } = parsed.data;
  const assignment = await db.assignment.update({
    where: { id: params.assignmentId },
    data: { ...rest, ...(dueDate ? { dueDate: new Date(dueDate) } : {}) },
  });

  return NextResponse.json({ assignment });
}

export async function DELETE(_req: Request, { params }: { params: { assignmentId: string } }) {
  const auth = await requireRole(["TEACHER", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await db.assignment.delete({ where: { id: params.assignmentId } });
  return NextResponse.json({ message: "Assignment deleted" });
}
