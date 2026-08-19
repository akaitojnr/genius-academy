import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Simple case-insensitive substring search across the content types the
// spec calls out. Kept as one lightweight query per model rather than a
// dedicated search index — fine at this scale, and easy to swap for
// full-text search later without changing the response shape.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return NextResponse.json({ subjects: [], topics: [], lessons: [], teachers: [] });
  }

  const [subjects, topics, lessons, teachers] = await Promise.all([
    db.subject.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
    db.topic.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      include: { course: { include: { subject: true } } },
      take: 5,
    }),
    db.lesson.findMany({
      where: { title: { contains: q, mode: "insensitive" }, isPublished: true },
      include: { topic: { include: { course: { include: { subject: true } } } } },
      take: 8,
    }),
    db.teacher.findMany({
      where: { fullName: { contains: q, mode: "insensitive" } },
      include: { subjects: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    subjects: subjects.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
    topics: topics.map((t) => ({
      id: t.id,
      title: t.title,
      courseId: t.courseId,
      subjectSlug: t.course.subject.slug,
      classLevel: t.course.classLevel,
    })),
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      subject: l.topic.course.subject.name,
      classLevel: l.topic.course.classLevel,
      topic: l.topic.title,
    })),
    teachers: teachers.map((t) => ({
      id: t.id,
      fullName: t.fullName,
      subjects: t.subjects.map((s) => s.name),
    })),
  });
}
