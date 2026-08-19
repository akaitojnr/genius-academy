import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { classLevels } from "@/lib/validation";

const liveClassSchema = z.object({
  subjectName: z.string().min(2),
  topic: z.string().min(2),
  classLevel: z.enum(classLevels),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
  meetingLink: z.string().url(),
});

export async function GET(req: Request) {
  const auth = await requireRole(["TEACHER", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const teacher = await db.teacher.findUnique({ where: { userId: (auth.session!.user as any).id } });
  // Admins see all; teachers see only their own.
  const liveClasses = await db.liveClass.findMany({
    where: teacher ? { teacherId: teacher.id } : undefined,
    include: { teacher: true },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json({ liveClasses });
}

export async function POST(req: Request) {
  const auth = await requireRole(["TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const teacher = await db.teacher.findUnique({ where: { userId: (auth.session!.user as any).id } });
  if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = liveClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const liveClass = await db.liveClass.create({
    data: { ...parsed.data, teacherId: teacher.id, scheduledAt: new Date(parsed.data.scheduledAt) },
  });

  return NextResponse.json({ liveClass }, { status: 201 });
}
