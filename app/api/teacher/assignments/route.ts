import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const assignmentSchema = z.object({
  title: z.string().min(3),
  instructions: z.string().min(3),
  dueDate: z.string().datetime(),
  courseId: z.string().optional(),
});

export async function GET() {
  const auth = await requireRole(["TEACHER", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const teacher = await db.teacher.findUnique({ where: { userId: (auth.session!.user as any).id } });

  const assignments = await db.assignment.findMany({
    where: teacher ? { teacherId: teacher.id } : undefined,
    include: { submissions: true, course: { include: { subject: true } } },
    orderBy: { dueDate: "desc" },
  });

  return NextResponse.json({ assignments });
}

export async function POST(req: Request) {
  const auth = await requireRole(["TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const teacher = await db.teacher.findUnique({ where: { userId: (auth.session!.user as any).id } });
  if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const assignment = await db.assignment.create({
    data: { ...parsed.data, teacherId: teacher.id, dueDate: new Date(parsed.data.dueDate) },
  });

  return NextResponse.json({ assignment }, { status: 201 });
}
