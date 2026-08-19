import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { classLevels } from "@/lib/validation";

const optionSchema = z.object({
  label: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  subjectId: z.string(),
  topicId: z.string().optional(),
  classLevel: z.enum(classLevels),
  term: z.enum(["FIRST", "SECOND", "THIRD"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  text: z.string().min(3),
  explanation: z.string().optional(),
  options: z.array(optionSchema).length(4),
}).refine((data) => data.options.filter((o) => o.isCorrect).length === 1, {
  message: "Exactly one option must be marked correct",
  path: ["options"],
});

export async function GET(req: Request) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId") || undefined;
  const classLevel = searchParams.get("classLevel") || undefined;
  const difficulty = searchParams.get("difficulty") || undefined;

  const questions = await db.question.findMany({
    where: {
      ...(subjectId ? { subjectId } : {}),
      ...(classLevel ? { classLevel: classLevel as any } : {}),
      ...(difficulty ? { difficulty: difficulty as any } : {}),
    },
    include: { options: true, subject: true, topic: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ questions });
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { options, ...questionData } = parsed.data;

  const question = await db.question.create({
    data: {
      ...questionData,
      options: { create: options },
    },
    include: { options: true },
  });

  return NextResponse.json({ question }, { status: 201 });
}
