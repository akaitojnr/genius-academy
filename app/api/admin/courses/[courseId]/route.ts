import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  teacherId: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { courseId: string } }) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const course = await db.course.update({ where: { id: params.courseId }, data: parsed.data });
  return NextResponse.json({ course });
}

export async function DELETE(_req: Request, { params }: { params: { courseId: string } }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await db.course.delete({ where: { id: params.courseId } });
  return NextResponse.json({ message: "Course deleted" });
}
