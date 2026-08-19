import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

const termLabels: Record<string, string> = {
  FIRST: "First Term",
  SECOND: "Second Term",
  THIRD: "Third Term",
};

export default async function CoursePage({
  params,
}: {
  params: { subjectSlug: string; classLevel: string };
}) {
  const subject = await db.subject.findUnique({ where: { slug: params.subjectSlug } });
  if (!subject) notFound();

  const course = await db.course.findUnique({
    where: { subjectId_classLevel: { subjectId: subject.id, classLevel: params.classLevel as any } },
    include: {
      teacher: true,
      topics: {
        orderBy: [{ term: "asc" }, { order: "asc" }],
        include: { lessons: { where: { isPublished: true }, orderBy: { order: "asc" } } },
      },
    },
  });

  if (!course) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-bold">{subject.name} — {params.classLevel}</h1>
        <p className="mt-4 text-sm text-slate-500">
          This course hasn&apos;t been created yet. Check back soon.
        </p>
      </main>
    );
  }

  // Pull the logged-in student's completed lesson ids so we can show ticks.
  const session = await getServerSession(authOptions);
  let completedLessonIds = new Set<string>();
  if (session && (session.user as any).role === "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
    if (student) {
      const lessonIds = course.topics.flatMap((t) => t.lessons.map((l) => l.id));
      const progress = await db.progress.findMany({
        where: { studentId: student.id, lessonId: { in: lessonIds }, completed: true },
      });
      completedLessonIds = new Set(progress.map((p) => p.lessonId));
    }
  }

  const termsInOrder = ["FIRST", "SECOND", "THIRD"] as const;
  const topicsByTerm = termsInOrder.map((term) => ({
    term,
    topics: course.topics.filter((t) => t.term === term),
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-700">{params.classLevel}</p>
      <h1 className="text-2xl font-bold">{subject.name}</h1>
      {course.teacher && <p className="text-sm text-slate-600">Taught by {course.teacher.fullName}</p>}

      <div className="mt-8 space-y-8">
        {topicsByTerm.map(({ term, topics }) =>
          topics.length ? (
            <section key={term}>
              <h2 className="mb-3 font-semibold text-slate-800">{termLabels[term]}</h2>
              <div className="space-y-3">
                {topics.map((topic) => (
                  <div key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="font-medium">{topic.title}</h3>
                    {topic.lessons.length === 0 ? (
                      <p className="mt-1 text-xs text-slate-400">No lessons published yet.</p>
                    ) : (
                      <ul className="mt-2 divide-y divide-slate-100">
                        {topic.lessons.map((lesson) => {
                          const done = completedLessonIds.has(lesson.id);
                          return (
                            <li key={lesson.id}>
                              <Link
                                href={`/lessons/${lesson.id}`}
                                className="flex items-center gap-3 py-2 text-sm hover:text-brand-700"
                              >
                                {done ? (
                                  <CheckCircle2 size={18} className="shrink-0 text-brand-600" />
                                ) : (
                                  <Circle size={18} className="shrink-0 text-slate-300" />
                                )}
                                <span className="flex-1">{lesson.title}</span>
                                <PlayCircle size={16} className="text-slate-400" />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null
        )}

        {course.topics.length === 0 && (
          <p className="text-sm text-slate-500">Topics for this course are coming soon.</p>
        )}
      </div>
    </main>
  );
}
