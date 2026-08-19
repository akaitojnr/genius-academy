import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAiTutor } from "@/lib/ai";

const askSchema = z.object({
  question: z.string().min(3),
  subjectId: z.string().optional(),
  classLevel: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = askSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const result = await askAiTutor(parsed.data.question, {
    subjectId: parsed.data.subjectId,
    classLevel: parsed.data.classLevel,
  });

  return NextResponse.json(result);
}
