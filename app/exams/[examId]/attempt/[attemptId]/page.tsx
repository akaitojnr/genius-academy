import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import CbtEngine from "./CbtEngine";

export default async function ExamAttemptPage({
  params,
}: {
  params: { examId: string; attemptId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    redirect("/login");
  }

  const attempt = await db.examAttempt.findUnique({ where: { id: params.attemptId } });
  if (!attempt) redirect("/exams");

  if (attempt.submittedAt) {
    redirect(`/exams/${params.examId}/attempt/${params.attemptId}/results`);
  }

  return <CbtEngine examId={params.examId} attemptId={params.attemptId} />;
}
