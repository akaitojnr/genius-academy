import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const submitSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
}).refine((d) => d.content || d.fileUrl, { message: "Provide either text content or a file URL" });

export async function POST(req: Request, { params }: { params: { assignmentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const submission = await db.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: params.assignmentId, studentId: student.id } },
    create: {
      assignmentId: params.assignmentId,
      studentId: student.id,
      content: parsed.data.content,
      fileUrl: parsed.data.fileUrl,
    },
    update: {
      content: parsed.data.content,
      fileUrl: parsed.data.fileUrl,
      submittedAt: new Date(),
      // Resubmitting clears any previous grade so the teacher re-reviews it.
      score: null,
      feedback: null,
    },
  });

  return NextResponse.json({ submission }, { status: 201 });
}
