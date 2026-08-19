import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const topicSchema = z.object({
  courseId: z.string(),
  term: z.enum(["FIRST", "SECOND", "THIRD"]),
  title: z.string().min(2),
  order: z.number().int().optional().default(0),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });

  const topics = await db.topic.findMany({
    where: { courseId },
    include: { lessons: { orderBy: { order: "asc" } } },
    orderBy: [{ term: "asc" }, { order: "asc" }],
  });

  return NextResponse.json({ topics });
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = topicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const topic = await db.topic.create({ data: parsed.data });
  return NextResponse.json({ topic }, { status: 201 });
}
