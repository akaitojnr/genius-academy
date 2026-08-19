import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const gradeSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { assignmentId: string; submissionId: string } }
) {
  const auth = await requireRole(["TEACHER", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = gradeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const submission = await db.submission.update({
    where: { id: params.submissionId },
    data: { score: parsed.data.score, feedback: parsed.data.feedback },
  });

  return NextResponse.json({ submission });
}
