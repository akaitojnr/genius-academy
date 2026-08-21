import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import VideoPlayer from "@/components/VideoPlayer";
import MarkCompleteButton from "@/components/MarkCompleteButton";
import FormattedContent from "@/components/FormattedContent";
import { hasAccessToSubject } from "@/lib/subscription";

export default async function LessonPage({ params }: { params: { lessonId: string } }) {
  const lesson = await db.lesson.findUnique({
    where: { id: params.lessonId },
    include: {
      video: true,
      topic: { include: { course: { include: { subject: true } } } },
    },
  });

  if (!lesson) notFound();

  const session = await getServerSession(authOptions);
  let progress: { completed: boolean; videoSeconds: number } | null = null;
  let isStudent = false;

  const role = (session?.user as any)?.role;
  const isAdminOrTeacher = role === "ADMIN" || role === "TEACHER";

  // Admins and Teachers always have 100% full access to all lessons & videos
  let hasAccess = isAdminOrTeacher;

  if (session && role === "STUDENT") {
    isStudent = true;
    const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
    if (student) {
      progress = await db.progress.findUnique({
        where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
      });
      hasAccess = await hasAccessToSubject(student.id, lesson.topic.course.subjectId);
    }
  }

  // Objectives and introduction are always visible as a free preview; the
  // rest of the lesson (and the video) is gated behind an active subscription
  // that covers this subject.
  const freeSections = [
    { label: "1. Learning Objectives", content: lesson.objectives },
    { label: "2. Introduction", content: lesson.introduction },
  ];
  const gatedSections: { key: string; label: string; content: string | null }[] = [
    { key: "definitions", label: "3. Definitions & Key Terms", content: lesson.definitions },
    { key: "explanation", label: "4. Detailed Explanation & Tables", content: lesson.explanation },
    { key: "workedExamples", label: "5. Worked Examples & Step-by-Step Solutions", content: lesson.workedExamples },
    { key: "diagrams", label: "6. Diagrams", content: lesson.diagrams },
    { key: "realLifeApplications", label: "7. Real-Life Applications", content: lesson.realLifeApplications },
    { key: "commonMistakes", label: "8. Common Mistakes", content: lesson.commonMistakes },
    { key: "summary", label: "9. Summary", content: lesson.summary },
    { key: "practiceQuestions", label: "10. Practice Questions", content: lesson.practiceQuestions },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
        {lesson.topic.course.subject.name} · {lesson.topic.course.classLevel} · {lesson.topic.title}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{lesson.title}</h1>

      {lesson.video && hasAccess && (
        <div className="mt-6">
          <VideoPlayer
            lessonId={lesson.id}
            url={lesson.video.url}
            thumbnailUrl={lesson.video.thumbnailUrl}
            teacherName={lesson.video.teacherName}
            durationSec={lesson.video.durationSec}
            startAtSeconds={progress?.videoSeconds ?? 0}
          />
        </div>
      )}
      {lesson.video && !hasAccess && (
        <div className="mt-6 flex aspect-video items-center justify-center rounded-2xl border border-slate-200 bg-slate-900 text-center text-sm text-slate-300">
          🔒 Subscribe to watch this video
        </div>
      )}

      <div className="mt-8 space-y-6">
        {freeSections.map((s) =>
          s.content ? (
            <section key={s.label}>
              <h2 className="mb-2 font-semibold text-slate-800">{s.label}</h2>
              <FormattedContent content={s.content} />
            </section>
          ) : null
        )}

        {hasAccess ? (
          <>
            {gatedSections.map((s) => {
              if (!s.content) return null;

              const isOnlyExplanation =
                s.key === "explanation" &&
                !lesson.objectives &&
                !lesson.introduction &&
                !lesson.definitions &&
                !lesson.workedExamples &&
                !lesson.summary &&
                !lesson.practiceQuestions;

              return (
                <section key={s.label}>
                  {!isOnlyExplanation && <h2 className="mb-2 font-semibold text-slate-800">{s.label}</h2>}
                  <FormattedContent content={s.content} />
                </section>
              );
            })}
            <section className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              <p>12. CBT Quiz for this topic — try it under CBT Practice.</p>
              <p className="mt-1">13. Assignment — see your Assignments page for anything your teacher has set.</p>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-center">
            <p className="font-semibold text-brand-800">🔒 The rest of this lesson is part of a paid plan</p>
            <p className="mt-1 text-sm text-brand-700">
              Subscribe to unlock the full explanation, worked examples, CBT quiz and more.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              View Plans
            </Link>
          </section>
        )}
      </div>

      {isStudent && hasAccess && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <MarkCompleteButton lessonId={lesson.id} initiallyCompleted={progress?.completed ?? false} />
        </div>
      )}

      {!session && (
        <p className="mt-8 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Log in as a student to track your progress on this lesson.
        </p>
      )}
    </main>
  );
}
