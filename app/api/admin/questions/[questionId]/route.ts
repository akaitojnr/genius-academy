import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const optionSchema = z.object({
  label: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const updateSchema = z.object({
  text: z.string().min(3).optional(),
  explanation: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  options: z.array(optionSchema).length(4).optional(),
});

export async function PATCH(req: Request, { params }: { params: { questionId: string } }) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { options, ...rest } = parsed.data;

  if (options && options.filter((o) => o.isCorrect).length !== 1) {
    return NextResponse.json({ error: "Exactly one option must be marked correct" }, { status: 400 });
  }

  if (options) {
    // Replace all options atomically rather than trying to diff by id.
    await db.questionOption.deleteMany({ where: { questionId: params.questionId } });
  }

  const question = await db.question.update({
    where: { id: params.questionId },
    data: {
      ...rest,
      ...(options ? { options: { create: options } } : {}),
    },
    include: { options: true },
  });

  return NextResponse.json({ question });
}

export async function DELETE(_req: Request, { params }: { params: { questionId: string } }) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await db.question.delete({ where: { id: params.questionId } });
  return NextResponse.json({ message: "Question deleted" });
}
