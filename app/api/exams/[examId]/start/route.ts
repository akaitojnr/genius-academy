import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: { examId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const exam = await db.exam.findUnique({ where: { id: params.examId }, include: { examQuestions: true } });
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  if (exam.examQuestions.length === 0) {
    return NextResponse.json({ error: "This exam has no questions yet" }, { status: 400 });
  }

  // Resume an unsubmitted attempt instead of creating a new one, so
  // refreshing the page doesn't reset the student's progress or timer.
  const existing = await db.examAttempt.findFirst({
    where: { examId: exam.id, studentId: student.id, submittedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (existing) {
    return NextResponse.json({ attemptId: existing.id });
  }

  const attempt = await db.examAttempt.create({
    data: { examId: exam.id, studentId: student.id, totalQuestions: exam.examQuestions.length },
  });

  return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
}
