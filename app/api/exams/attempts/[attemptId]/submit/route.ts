import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function gradeFor(percent: number) {
  if (percent >= 75) return "A";
  if (percent >= 65) return "B";
  if (percent >= 55) return "C";
  if (percent >= 45) return "D";
  if (percent >= 40) return "E";
  return "F";
}

export async function POST(_req: Request, { params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const attempt = await db.examAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      exam: { include: { examQuestions: { include: { question: { include: { options: true } } } } } },
      answers: true,
    },
  });

  if (!attempt || attempt.studentId !== student.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (attempt.submittedAt) {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  // Auto-mark: for every question on the exam, look up the student's
  // saved answer (if any) and compare against the option flagged isCorrect.
  let correctCount = 0;
  const total = attempt.exam.examQuestions.length;

  for (const eq of attempt.exam.examQuestions) {
    const correctOption = eq.question.options.find((o) => o.isCorrect);
    const studentAnswer = attempt.answers.find((a) => a.questionId === eq.questionId);
    const isCorrect = !!studentAnswer?.selectedLabel && studentAnswer.selectedLabel === correctOption?.label;
    if (isCorrect) correctCount++;

    if (studentAnswer) {
      await db.examAnswer.update({ where: { id: studentAnswer.id }, data: { isCorrect } });
    } else {
      // Unanswered question — record it so the review screen can show "not answered".
      await db.examAnswer.create({
        data: { attemptId: attempt.id, questionId: eq.questionId, selectedLabel: null, isCorrect: false },
      });
    }
  }

  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const timeUsedSec = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);

  const updated = await db.examAttempt.update({
    where: { id: attempt.id },
    data: {
      submittedAt: new Date(),
      score: correctCount,
      totalQuestions: total,
      timeUsedSec,
    },
  });

  return NextResponse.json({
    score: correctCount,
    total,
    percent,
    grade: gradeFor(percent),
    timeUsedSec,
  });
}
