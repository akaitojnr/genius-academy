import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { seededShuffle } from "@/lib/shuffle";

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
      exam: { include: { examQuestions: { include: { question: { include: { options: true } } } } } },
      answers: true,
    },
  });

  if (!attempt || attempt.studentId !== student.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // Randomize question order (deterministic per attempt) and, within each
  // question, randomize option order too, so different students see
  // different orders. Correct-answer flags are stripped before sending.
  const questions = seededShuffle(attempt.exam.examQuestions, attempt.id).map((eq, index) => {
    const q = eq.question;
    const options = seededShuffle(q.options, attempt.id + q.id).map((o) => ({ label: o.label, text: o.text }));
    return {
      index,
      questionId: q.id,
      text: q.text,
      difficulty: q.difficulty,
      options,
    };
  });

  const answers: Record<string, string> = {};
  for (const a of attempt.answers) {
    if (a.selectedLabel) answers[a.questionId] = a.selectedLabel;
  }

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      durationMin: attempt.exam.durationMin,
      examTitle: attempt.exam.title,
    },
    questions,
    answers,
  });
}
