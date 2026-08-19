import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformAnalytics } from "@/lib/analytics";
import AnalyticsCharts from "@/app/dashboard/admin/analytics/AnalyticsCharts";

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "TEACHER") {
    redirect("/login");
  }

  const teacher = await db.teacher.findUnique({
    where: { userId: (session.user as any).id },
    include: { courses: { include: { enrollments: true, subject: true } } },
  });

  if (!teacher) redirect("/login");

  const courseIds = teacher.courses.map((c) => c.id);
  const studentIds = new Set(teacher.courses.flatMap((c) => c.enrollments.map((e) => e.studentId)));
  const totalStudents = studentIds.size;

  // Average score across this teacher's exams (exams tied to their subjects).
  const subjectIds = [...new Set(teacher.courses.map((c) => c.subjectId))];
  const attempts = await db.examAttempt.findMany({
    where: { exam: { subjectId: { in: subjectIds } }, submittedAt: { not: null } },
    select: { score: true, totalQuestions: true },
  });
  const avgScore = attempts.length
    ? Math.round(
        (attempts.reduce((sum, a) => sum + (a.totalQuestions ? (a.score ?? 0) / a.totalQuestions : 0), 0) /
          attempts.length) *
          100
      )
    : null;

  // Completed lessons % across this teacher's lessons.
  const lessonIds = (
    await db.lesson.findMany({ where: { topic: { courseId: { in: courseIds } } }, select: { id: true } })
  ).map((l) => l.id);
  const totalPossible = lessonIds.length * totalStudents;
  const completedCount = totalPossible
    ? await db.progress.count({ where: { lessonId: { in: lessonIds }, completed: true } })
    : 0;
  const completedPercent = totalPossible ? Math.round((completedCount / totalPossible) * 100) : 0;

  const pendingAssignments = await db.assignment.count({
    where: { teacherId: teacher.id, submissions: { none: {} } },
  });

  const analytics = subjectIds.length > 0 ? await getPlatformAnalytics(subjectIds) : null;

  const stats = [
    { label: "Total Students", value: totalStudents },
    { label: "Average Score", value: avgScore !== null ? `${avgScore}%` : "—" },
    { label: "Completed Lessons", value: `${completedPercent}%` },
    { label: "Pending Assignments", value: pendingAssignments },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Welcome, {teacher.fullName.split(" ")[0]}</h1>
      <p className="text-sm text-slate-600">
        Teaching {teacher.courses.map((c) => `${c.subject.name} (${c.classLevel})`).join(", ") || "no courses yet"}.
      </p>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-brand-800">{s.value}</p>
            <p className="text-sm text-slate-600">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ManageLink href="/dashboard/teacher/live-classes" title="Live Classes" desc="Schedule and manage live sessions." />
        <ManageLink href="/dashboard/teacher/assignments" title="Assignments" desc="Create assignments and grade submissions." />
        <ManageLink href="/dashboard/teacher/announcements" title="Announcements" desc="Send updates to your students." />
        <ManageLink href="/dashboard/admin/content" title="Courses & Lessons" desc="Manage lessons for your subjects." />
        <ManageLink href="/dashboard/admin/questions" title="Question Bank" desc="Add CBT questions for your subjects." />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Your Students</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          {totalStudents > 0 ? (
            <p>{totalStudents} students enrolled across your courses.</p>
          ) : (
            <p>No students enrolled yet.</p>
          )}
        </div>
      </section>

      {analytics && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Activity in Your Subjects (Last 30 Days)</h2>
          <AnalyticsCharts
            data={{
              signupsSeries: [],
              completionsSeries: analytics.completionsSeries,
              attemptsSeries: analytics.attemptsSeries,
              avgScoreSeries: analytics.avgScoreSeries,
              revenueSeries: [],
              popularSubjects: analytics.popularSubjects,
            }}
          />
        </section>
      )}
    </main>
  );
}

function ManageLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-400">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </Link>
  );
}
