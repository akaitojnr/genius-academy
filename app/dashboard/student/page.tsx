import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import ProgressBar from "@/components/ProgressBar";
import { getSubjectProgress } from "@/lib/progress";
import { getActiveSubscription } from "@/lib/subscription";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    redirect("/login");
  }

  const student = await db.student.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      enrollments: { include: { course: { include: { subject: true } } } },
      preferredSubjects: true,
    },
  });

  const subjectProgress = student ? await getSubjectProgress(student.id) : [];

  // "Continue Learning": the most recently touched lesson that isn't complete yet.
  const continueLesson = student
    ? await db.progress.findFirst({
        where: { studentId: student.id, completed: false },
        orderBy: { updatedAt: "desc" },
        include: { lesson: { include: { topic: { include: { course: { include: { subject: true } } } } } } },
      })
    : null;

  const recentAttempts = student
    ? await db.examAttempt.findMany({
        where: { studentId: student.id, submittedAt: { not: null } },
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: { exam: true },
      })
    : [];

  const subscription = student ? await getActiveSubscription(student.id) : null;
  const daysUntilExpiry = subscription?.expiryDate
    ? Math.ceil((subscription.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const upcomingLiveClasses = student
    ? await db.liveClass.findMany({
        where: { classLevel: student.classLevel, scheduledAt: { gte: new Date() } },
        include: { teacher: true },
        orderBy: { scheduledAt: "asc" },
        take: 3,
      })
    : [];

  const notifications = session
    ? await db.notification.findMany({
        where: { userId: (session.user as any).id },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">
        Welcome back, {student?.fullName?.split(" ")[0] ?? "Student"} 👋
      </h1>
      <p className="text-sm text-slate-600">
        {student?.classLevel} · Track your lessons, live classes and CBT scores below.
      </p>

      {subscription ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm">
          <div>
            <p className="font-semibold text-brand-800">Subscription Active — {subscription.plan.name}</p>
            <p className="text-xs text-brand-700">
              Valid until {subscription.expiryDate?.toDateString()}
              {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
                <span className="ml-1 font-medium text-amber-700">
                  (expires in {daysUntilExpiry} day{daysUntilExpiry === 1 ? "" : "s"} — renew soon)
                </span>
              )}
            </p>
          </div>
          <Link href="/pricing" className="shrink-0 text-xs font-semibold text-brand-700 hover:underline">
            Manage plan
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-800">Subscription Expired — no active plan</p>
          <Link href="/pricing" className="shrink-0 rounded-full bg-brand-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-800">
            Subscribe
          </Link>
        </div>
      )}

      <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card title="Continue Learning">
          {continueLesson ? (
            <Link
              href={`/lessons/${continueLesson.lesson.id}`}
              className="block rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm hover:border-brand-400"
            >
              <p className="font-medium text-brand-800">{continueLesson.lesson.title}</p>
              <p className="mt-0.5 text-xs text-brand-700">
                {continueLesson.lesson.topic.course.subject.name} · {continueLesson.lesson.topic.title}
              </p>
            </Link>
          ) : (
            <EmptyState text="Start a lesson from your courses to see it here." />
          )}
        </Card>

        <Card title="Enrolled Courses">
          {student?.enrollments.length ? (
            <ul className="space-y-1 text-sm">
              {student.enrollments.map((e) => (
                <li key={e.id}>
                  <Link href={`/courses/${e.course.subject.slug}/${e.course.classLevel}`} className="hover:text-brand-700">
                    {e.course.subject.name} — {e.course.classLevel}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="No courses enrolled yet. Subscribe to a plan to get started." />
          )}
        </Card>

        <Card title="Upcoming Live Classes">
          {upcomingLiveClasses.length ? (
            <ul className="space-y-2 text-sm">
              {upcomingLiveClasses.map((lc) => (
                <li key={lc.id}>
                  <p className="font-medium">{lc.subjectName} — {lc.topic}</p>
                  <p className="text-xs text-slate-500">
                    {lc.teacher.fullName} · {new Date(lc.scheduledAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="No live classes scheduled yet." />
          )}
        </Card>

        <Card title="Recent Test Scores">
          {recentAttempts.length ? (
            <ul className="space-y-2 text-sm">
              {recentAttempts.map((a) => {
                const percent = a.totalQuestions ? Math.round(((a.score ?? 0) / a.totalQuestions) * 100) : 0;
                return (
                  <li key={a.id}>
                    <Link
                      href={`/exams/${a.examId}/attempt/${a.id}/results`}
                      className="flex items-center justify-between hover:text-brand-700"
                    >
                      <span>{a.exam.title}</span>
                      <span className="font-medium">{a.score}/{a.totalQuestions} ({percent}%)</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState text="No CBT attempts yet. Try a practice exam." />
          )}
        </Card>

        <Card title="Notifications">
          {notifications.length ? (
            <ul className="space-y-2 text-sm">
              {notifications.map((n) => (
                <li key={n.id}>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-slate-500">{n.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="No new notifications." />
          )}
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Overall Progress</h2>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          {subjectProgress.length ? (
            subjectProgress.map((s) => (
              <div key={s.subject}>
                <ProgressBar label={s.subject} percent={s.percent} />
                <p className="mt-1 text-xs text-slate-400">{s.completed} of {s.total} lessons completed</p>
              </div>
            ))
          ) : (
            <EmptyState text="Enroll in a course to see your progress here." />
          )}
        </div>
      </section>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-slate-500">{text}</p>;
}
