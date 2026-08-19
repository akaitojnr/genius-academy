import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import QuestionBankManager from "./QuestionBankManager";

export default async function AdminQuestionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });
  const topics = await db.topic.findMany({
    include: { course: { include: { subject: true } } },
    orderBy: { title: "asc" },
    take: 300,
  });
  const questions = await db.question.findMany({
    include: { options: true, subject: true, topic: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Question Bank</h1>
      <p className="text-sm text-slate-600">
        Add, edit and delete CBT questions. Each question needs exactly one correct option out of four.
      </p>
      <QuestionBankManager subjects={subjects} topics={topics} initialQuestions={questions} />
    </main>
  );
}
