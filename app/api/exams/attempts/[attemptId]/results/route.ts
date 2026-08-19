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

export async function GET(_req: Request, { params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const attempt = await db.examAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      exam: { include: { subject: true } },
      answers: {
        include: {
          question: {
            include: { options: true, topic: { include: { lessons: { where: { isPublished: true }, take: 1 } } } },
          },
        },
      },
    },
  });

  if (!attempt || attempt.studentId !== student.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (!attempt.submittedAt) {
    return NextResponse.json({ error: "This attempt has not been submitted yet" }, { status: 400 });
  }

  const total = attempt.totalQuestions ?? attempt.answers.length;
  const score = attempt.score ?? 0;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  const review = attempt.answers.map((a) => {
    const correctOption = a.question.options.find((o) => o.isCorrect);
    return {
      questionId: a.questionId,
      text: a.question.text,
      selectedLabel: a.selectedLabel,
      correctLabel: correctOption?.label,
      isCorrect: a.isCorrect,
      explanation: a.question.explanation,
      topic: a.question.topic?.title ?? null,
      recommendedLessonId: a.question.topic?.lessons[0]?.id ?? null,
      options: a.question.options.map((o) => ({ label: o.label, text: o.text })),
    };
  });

  return NextResponse.json({
    examTitle: attempt.exam.title,
    subject: attempt.exam.subject?.name ?? null,
    score,
    total,
    percent,
    grade: gradeFor(percent),
    timeUsedSec: attempt.timeUsedSec,
    review,
  });
}
