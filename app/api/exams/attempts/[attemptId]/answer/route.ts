import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const answerSchema = z.object({
  questionId: z.string(),
  selectedLabel: z.enum(["A", "B", "C", "D"]).nullable(), // null = clear the answer
});

export async function POST(req: Request, { params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const attempt = await db.examAttempt.findUnique({ where: { id: params.attemptId } });
  if (!attempt || attempt.studentId !== student.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (attempt.submittedAt) {
    return NextResponse.json({ error: "This exam has already been submitted" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const existing = await db.examAnswer.findFirst({
    where: { attemptId: attempt.id, questionId: parsed.data.questionId },
  });

  if (existing) {
    await db.examAnswer.update({
      where: { id: existing.id },
      data: { selectedLabel: parsed.data.selectedLabel },
    });
  } else {
    await db.examAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: parsed.data.questionId,
        selectedLabel: parsed.data.selectedLabel,
      },
    });
  }

  return NextResponse.json({ saved: true });
}
