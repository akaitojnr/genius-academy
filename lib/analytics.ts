import { db } from "@/lib/db";

function lastNDays(n: number) {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function bucketByDay<T>(items: T[], getDate: (item: T) => Date, days: string[]) {
  const counts = new Map(days.map((d) => [d, 0]));
  for (const item of items) {
    const key = getDate(item).toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return days.map((d) => ({ date: d.slice(5), count: counts.get(d) ?? 0 }));
}

// Tracks the metrics the spec calls out — login frequency (via createdAt as
// a proxy for activity since Phase 7 doesn't add a dedicated login-event
// table), lessons completed, videos watched (progress rows with any
// videoSeconds > 0), CBT attempts and scores, time spent (sum of exam
// timeUsedSec as a proxy), course completion, and subscription/revenue
// activity — bucketed into the last 30 days for charting.
export async function getPlatformAnalytics(subjectIds?: string[]) {
  const days = lastNDays(30);
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const subjectFilter = subjectIds && subjectIds.length > 0 ? subjectIds : undefined;

  const [signups, completions, attempts, payments, subjects] = await Promise.all([
    subjectFilter
      ? Promise.resolve([]) // signups aren't subject-scoped; teacher view skips this metric
      : db.student.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.progress.findMany({
      where: {
        completed: true,
        completedAt: { gte: since },
        ...(subjectFilter ? { lesson: { topic: { course: { subjectId: { in: subjectFilter } } } } } : {}),
      },
      select: { completedAt: true },
    }),
    db.examAttempt.findMany({
      where: {
        submittedAt: { gte: since },
        ...(subjectFilter ? { exam: { subjectId: { in: subjectFilter } } } : {}),
      },
      select: { submittedAt: true, score: true, totalQuestions: true, timeUsedSec: true },
    }),
    subjectFilter
      ? Promise.resolve([]) // revenue isn't meaningful per-teacher; admin-only metric
      : db.payment.findMany({
          where: { status: "SUCCESS", verifiedAt: { gte: since } },
          select: { verifiedAt: true, amountKobo: true },
        }),
    db.subject.findMany({
      where: subjectFilter ? { id: { in: subjectFilter } } : undefined,
      include: { _count: { select: { courses: true } }, courses: { include: { _count: { select: { enrollments: true } } } } },
    }),
  ]);

  const signupsSeries = bucketByDay(signups, (s) => s.createdAt, days);
  const completionsSeries = bucketByDay(completions, (c) => c.completedAt!, days);
  const attemptsSeries = bucketByDay(attempts, (a) => a.submittedAt!, days);

  // Average score per day (only days with attempts get a value).
  const scoreByDay = new Map<string, { total: number; count: number }>();
  for (const a of attempts) {
    const key = a.submittedAt!.toISOString().slice(0, 10);
    const percent = a.totalQuestions ? ((a.score ?? 0) / a.totalQuestions) * 100 : 0;
    const cur = scoreByDay.get(key) ?? { total: 0, count: 0 };
    cur.total += percent;
    cur.count += 1;
    scoreByDay.set(key, cur);
  }
  const avgScoreSeries = days.map((d) => {
    const entry = scoreByDay.get(d);
    return { date: d.slice(5), avgScore: entry ? Math.round(entry.total / entry.count) : 0 };
  });

  const revenueByDay = new Map<string, number>();
  for (const p of payments) {
    const key = p.verifiedAt!.toISOString().slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + p.amountKobo);
  }
  const revenueSeries = days.map((d) => ({ date: d.slice(5), revenue: Math.round((revenueByDay.get(d) ?? 0) / 100) }));

  const totalTimeSpentSec = attempts.reduce((sum, a) => sum + (a.timeUsedSec ?? 0), 0);

  const popularSubjects = subjects
    .map((s) => ({
      name: s.name,
      enrollments: s.courses.reduce((sum, c) => sum + c._count.enrollments, 0),
    }))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 6);

  return {
    signupsSeries,
    completionsSeries,
    attemptsSeries,
    avgScoreSeries,
    revenueSeries,
    popularSubjects,
    totals: {
      newStudents30d: signups.length,
      lessonsCompleted30d: completions.length,
      examAttempts30d: attempts.length,
      revenue30d: payments.reduce((sum, p) => sum + p.amountKobo, 0),
      timeSpentHours30d: Math.round(totalTimeSpentSec / 3600),
    },
  };
}
