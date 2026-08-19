import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import ExamBuilder from "./ExamBuilder";

export default async function AdminExamsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });
  const exams = await db.exam.findMany({
    include: { subject: true, _count: { select: { examQuestions: true, attempts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Exams</h1>
      <p className="text-sm text-slate-600">
        Build a timed CBT exam by pulling questions from the bank that match your criteria.
      </p>
      <ExamBuilder subjects={subjects} initialExams={exams} />
    </main>
  );
}
