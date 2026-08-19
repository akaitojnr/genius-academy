import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { classLevels } from "@/lib/validation";

const examSchema = z.object({
  title: z.string().min(3),
  subjectId: z.string().optional(),
  classLevel: z.enum(classLevels).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  durationMin: z.number().int().min(5).max(180).default(30),
  questionCount: z.number().int().min(1).max(100).default(20),
});

export async function GET() {
  const exams = await db.exam.findMany({
    include: { subject: true, _count: { select: { examQuestions: true, attempts: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ exams });
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = examSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { questionCount, ...examData } = parsed.data;

  // Pull a pool of matching questions from the bank and pick up to
  // questionCount of them at random to attach to this exam.
  const pool = await db.question.findMany({
    where: {
      ...(examData.subjectId ? { subjectId: examData.subjectId } : {}),
      ...(examData.classLevel ? { classLevel: examData.classLevel } : {}),
      ...(examData.difficulty ? { difficulty: examData.difficulty } : {}),
    },
    select: { id: true },
  });

  if (pool.length === 0) {
    return NextResponse.json({ error: "No questions in the bank match this criteria" }, { status: 400 });
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, Math.min(questionCount, shuffled.length));

  const exam = await db.exam.create({
    data: {
      title: examData.title,
      subjectId: examData.subjectId,
      classLevel: examData.classLevel,
      durationMin: examData.durationMin,
      examQuestions: { create: chosen.map((q) => ({ questionId: q.id })) },
    },
    include: { examQuestions: true },
  });

  return NextResponse.json({ exam, questionsAttached: chosen.length }, { status: 201 });
}
