import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { classLevels } from "@/lib/validation";

const courseSchema = z.object({
  subjectId: z.string(),
  classLevel: z.enum(classLevels),
  title: z.string().min(3),
  description: z.string().optional(),
  teacherId: z.string().optional(),
  isPublished: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectSlug = searchParams.get("subject");
  const classLevel = searchParams.get("classLevel");

  const courses = await db.course.findMany({
    where: {
      ...(subjectSlug ? { subject: { slug: subjectSlug } } : {}),
      ...(classLevel ? { classLevel: classLevel as any } : {}),
    },
    include: { subject: true, teacher: true, _count: { select: { topics: true, enrollments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.course.findUnique({
    where: { subjectId_classLevel: { subjectId: parsed.data.subjectId, classLevel: parsed.data.classLevel } },
  });
  if (existing) {
    return NextResponse.json({ error: "A course already exists for this subject and class" }, { status: 409 });
  }

  const course = await db.course.create({ data: parsed.data });
  return NextResponse.json({ course }, { status: 201 });
}
