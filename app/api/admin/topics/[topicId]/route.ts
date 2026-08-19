import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  term: z.enum(["FIRST", "SECOND", "THIRD"]).optional(),
  order: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: { topicId: string } }) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const topic = await db.topic.update({ where: { id: params.topicId }, data: parsed.data });
  return NextResponse.json({ topic });
}

export async function DELETE(_req: Request, { params }: { params: { topicId: string } }) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await db.topic.delete({ where: { id: params.topicId } });
  return NextResponse.json({ message: "Topic deleted" });
}
