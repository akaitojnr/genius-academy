import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

// Mirrors the required lesson structure: objectives, introduction,
// explanation, definitions, worked examples, diagrams, real-life
// applications, common mistakes, summary, practice questions.
// (CBT quiz and assignment are separate models, linked by topic/course.)
const lessonSchema = z.object({
  topicId: z.string(),
  title: z.string().min(2),
  order: z.number().int().optional().default(0),
  objectives: z.string().optional(),
  introduction: z.string().optional(),
  explanation: z.string().optional(),
  definitions: z.string().optional(),
  workedExamples: z.string().optional(),
  diagrams: z.string().optional(),
  realLifeApplications: z.string().optional(),
  commonMistakes: z.string().optional(),
  summary: z.string().optional(),
  practiceQuestions: z.string().optional(),
  isPublished: z.boolean().optional().default(false),
  video: z
    .object({
      url: z.string().url(),
      thumbnailUrl: z.string().url().optional().or(z.literal("")),
      teacherName: z.string().optional(),
      durationSec: z.number().int().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = lessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { video, ...lessonData } = parsed.data;

  const lesson = await db.lesson.create({
    data: {
      ...lessonData,
      ...(video
        ? {
            video: {
              create: {
                url: video.url,
                thumbnailUrl: video.thumbnailUrl || undefined,
                teacherName: video.teacherName,
                durationSec: video.durationSec,
              },
            },
          }
        : {}),
    },
    include: { video: true },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}
