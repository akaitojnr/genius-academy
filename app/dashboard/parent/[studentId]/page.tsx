import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getChildSummary } from "@/lib/parentPortal";
import ProgressBar from "@/components/ProgressBar";

export default async function ChildDetailPage({ params }: { params: { studentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "PARENT") {
    redirect("/login");
  }

  const parent = await db.parent.findUnique({ where: { userId: (session.user as any).id } });
  if (!parent) redirect("/login");

  // Ownership check: a parent may only view their own linked children.
  const student = await db.student.findUnique({ where: { id: params.studentId } });
  if (!student || student.parentId !== parent.id) notFound();

  const summary = await getChildSummary(params.studentId);
  if (!summary) notFound();

  const { subjectProgress, recentAttempts, submissions, upcomingLiveClasses, attendance, subscription, warnings } = summary;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard/parent" className="text-sm text-brand-700 hover:underline">
        ← Back to all children
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{student.fullName}</h1>
      <p className="text-sm text-slate-600">{student.classLevel} · {student.school ?? "No school on file"}</p>

      {subscription ? (
        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <p className="font-semibold">Subscription Active — {subscription.plan.name}</p>
          <p className="text-xs">
            Started {subscription.startDate?.toDateString()} · Expires {subscription.expiryDate?.toDateString()} · Amount:{" "}
            {subscription.plan.priceKobo ? `₦${(subscription.plan.priceKobo / 100).toLocaleString()}` : "—"}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Subscription Expired — no active plan
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 space-y-1">
          {warnings.map((w) => (
            <p key={w} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              ⚠️ {w}
            </p>
          ))}
        </div>
      )}

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">Subject Performance</h2>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          {subjectProgress.length ? (
            subjectProgress.map((sp) => (
              <div key={sp.subject}>
                <ProgressBar label={sp.subject} percent={sp.percent} />
                <p className="mt-1 text-xs text-slate-400">{sp.completed} of {sp.total} lessons completed</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No enrolled subjects yet.</p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">Recent CBT Scores</h2>
        <div className="space-y-2">
          {recentAttempts.length ? (
            recentAttempts.map((a) => {
              const percent = a.totalQuestions ? Math.round(((a.score ?? 0) / a.totalQuestions) * 100) : 0;
              return (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <span>{a.exam.title}</span>
                  <span className="font-medium">{a.score}/{a.totalQuestions} ({percent}%)</span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">No CBT attempts yet.</p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">Assignment Performance</h2>
        <div className="space-y-2">
          {submissions.length ? (
            submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <span>{s.assignment.title}</span>
                <span className="font-medium">{s.score !== null ? `${s.score}/100` : "Awaiting grade"}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No assignment submissions yet.</p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">Live Class Attendance</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <p>{attendance.attended} of {attendance.scheduled} scheduled classes attended in the last 30 days.</p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">Upcoming Live Classes</h2>
        <div className="space-y-2">
          {upcomingLiveClasses.length ? (
            upcomingLiveClasses.map((lc) => (
              <div key={lc.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <p className="font-medium">{lc.subjectName} — {lc.topic}</p>
                <p className="text-xs text-slate-500">{lc.teacher.fullName} · {new Date(lc.scheduledAt).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No upcoming live classes.</p>
          )}
        </div>
      </section>
    </main>
  );
}
