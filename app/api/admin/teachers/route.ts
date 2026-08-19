import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const teacherSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  bio: z.string().optional(),
  subjectIds: z.array(z.string()).optional().default([]),
});

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  // Auto-sync/upsert Mr. Shedrach Makama
  const targetEmail = "shedrachmakama2@gmail.com";
  const existingTeacher = await db.user.findFirst({
    where: { OR: [{ email: targetEmail }, { email: "akaitojnr+teacher@gmail.com" }] },
    include: { teacher: true },
  });

  if (!existingTeacher) {
    const passwordHash = await bcrypt.hash("Admin@2026", 12);
    const allSubjects = await db.subject.findMany({ select: { id: true } });
    await db.user.create({
      data: {
        email: targetEmail,
        passwordHash,
        role: "TEACHER",
        teacher: {
          create: {
            fullName: "Mr. Shedrach Makama",
            bio: "Physics & Science teacher with years of WAEC/JAMB prep experience.",
            subjects: { connect: allSubjects.map((s) => ({ id: s.id })) },
          },
        },
      },
    });
  } else if (existingTeacher.email !== targetEmail || existingTeacher.teacher?.fullName !== "Mr. Shedrach Makama") {
    await db.user.update({
      where: { id: existingTeacher.id },
      data: { email: targetEmail },
    });
    if (existingTeacher.teacher) {
      await db.teacher.update({
        where: { id: existingTeacher.teacher.id },
        data: { fullName: "Mr. Shedrach Makama" },
      });
    }
  }

  const teachers = await db.teacher.findMany({
    include: { user: true, subjects: true, _count: { select: { courses: true, liveClasses: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ teachers });
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = teacherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      role: "TEACHER",
      teacher: {
        create: {
          fullName: parsed.data.fullName,
          bio: parsed.data.bio,
          subjects: { connect: parsed.data.subjectIds.map((id) => ({ id })) },
        },
      },
    },
    include: { teacher: true },
  });

  return NextResponse.json({ teacher: user.teacher }, { status: 201 });
}
