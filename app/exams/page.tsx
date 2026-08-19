import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import StartExamButton from "./StartExamButton";

export default async function ExamsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    redirect("/login");
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) redirect("/login");

  const exams = await db.exam.findMany({
    where: { OR: [{ classLevel: student.classLevel }, { classLevel: null }] },
    include: { subject: true, _count: { select: { examQuestions: true } } },
    orderBy: { createdAt: "desc" },
  });

  const attempts = await db.examAttempt.findMany({
    where: { studentId: student.id, submittedAt: { not: null } },
    select: { examId: true, score: true, totalQuestions: true, id: true },
  });
  const bestByExam = new Map<string, { score: number; total: number; attemptId: string }>();
  for (const a of attempts) {
    const cur = bestByExam.get(a.examId);
    const percent = a.totalQuestions ? (a.score ?? 0) / a.totalQuestions : 0;
    if (!cur || percent > (cur.score / cur.total || 0)) {
      bestByExam.set(a.examId, { score: a.score ?? 0, total: a.totalQuestions ?? 0, attemptId: a.id });
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">CBT Practice</h1>
      <p className="text-sm text-slate-600">Timed multiple-choice practice for {student.classLevel}.</p>

      <div className="mt-6 space-y-3">
        {exams.map((exam) => {
          const best = bestByExam.get(exam.id);
          return (
            <div key={exam.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{exam.title}</p>
                  <p className="text-xs text-slate-500">
                    {exam.subject?.name ?? "Mixed"} · {exam._count.examQuestions} questions · {exam.durationMin} min
                  </p>
                  {best && (
                    <p className="mt-1 text-xs font-medium text-brand-700">
                      Best score: {best.score}/{best.total}
                    </p>
                  )}
                </div>
                <StartExamButton examId={exam.id} />
              </div>
            </div>
          );
        })}

        {exams.length === 0 && (
          <p className="text-sm text-slate-500">No exams available for your class yet. Check back soon.</p>
        )}
      </div>
    </main>
  );
}
