import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  order: z.number().int().optional(),
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
  isPublished: z.boolean().optional(),
  // Admin/teacher can add or replace the video URL here — this is the
  // "system where the administrator can add or replace video URLs"
  // requirement; nothing about videos is hard-coded in components.
  video: z
    .object({
      url: z.string().url(),
      thumbnailUrl: z.string().url().optional().or(z.literal("")),
      teacherName: z.string().optional(),
      durationSec: z.number().int().optional(),
    })
    .optional(),
});

export async function PATCH(req: Request, { params }: { params: { lessonId: string } }) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { video, ...lessonData } = parsed.data;

  const lesson = await db.lesson.update({
    where: { id: params.lessonId },
    data: {
      ...lessonData,
      ...(video
        ? {
            video: {
              upsert: {
                create: {
                  url: video.url,
                  thumbnailUrl: video.thumbnailUrl || undefined,
                  teacherName: video.teacherName,
                  durationSec: video.durationSec,
                },
                update: {
                  url: video.url,
                  thumbnailUrl: video.thumbnailUrl || undefined,
                  teacherName: video.teacherName,
                  durationSec: video.durationSec,
                },
              },
            },
          }
        : {}),
    },
    include: { video: true },
  });

  return NextResponse.json({ lesson });
}

export async function DELETE(_req: Request, { params }: { params: { lessonId: string } }) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await db.lesson.delete({ where: { id: params.lessonId } });
  return NextResponse.json({ message: "Lesson deleted" });
}
