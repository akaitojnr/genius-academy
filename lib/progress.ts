import { db } from "@/lib/db";

// Percent complete = completed lessons / total published lessons across all
// courses the student is enrolled in for that subject. Used by both the
// student dashboard and (later) the parent dashboard.
export async function getSubjectProgress(studentId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    include: {
      course: {
        include: {
          subject: true,
          topics: { include: { lessons: { where: { isPublished: true } } } },
        },
      },
    },
  });

  const results: { subject: string; percent: number; completed: number; total: number }[] = [];

  for (const e of enrollments) {
    const lessonIds = e.course.topics.flatMap((t) => t.lessons.map((l) => l.id));
    const total = lessonIds.length;

    let completed = 0;
    if (total > 0) {
      completed = await db.progress.count({
        where: { studentId, lessonId: { in: lessonIds }, completed: true },
      });
    }

    results.push({
      subject: e.course.subject.name,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
    });
  }

  return results;
}
