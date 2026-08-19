import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const progressSchema = z.object({
  videoSeconds: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});

// Called from the lesson page: periodically while a video plays (to save
// resume position) and once when the student clicks "Mark as Completed".
export async function POST(req: Request, { params }: { params: { lessonId: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const lesson = await db.lesson.findUnique({ where: { id: params.lessonId } });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const progress = await db.progress.upsert({
    where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
    create: {
      studentId: student.id,
      lessonId: lesson.id,
      videoSeconds: parsed.data.videoSeconds ?? 0,
      completed: parsed.data.completed ?? false,
      completedAt: parsed.data.completed ? new Date() : undefined,
    },
    update: {
      ...(parsed.data.videoSeconds !== undefined ? { videoSeconds: parsed.data.videoSeconds } : {}),
      ...(parsed.data.completed !== undefined
        ? { completed: parsed.data.completed, completedAt: parsed.data.completed ? new Date() : null }
        : {}),
    },
  });

  return NextResponse.json({ progress });
}

export async function GET(req: Request, { params }: { params: { lessonId: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return NextResponse.json({ progress: null });

  const progress = await db.progress.findUnique({
    where: { studentId_lessonId: { studentId: student.id, lessonId: params.lessonId } },
  });

  return NextResponse.json({ progress });
}
