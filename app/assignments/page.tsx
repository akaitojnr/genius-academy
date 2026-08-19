import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AssignmentList from "./AssignmentList";

export default async function StudentAssignmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    redirect("/login");
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) redirect("/login");

  const assignments = await db.assignment.findMany({
    include: { submissions: { where: { studentId: student.id } }, teacher: true },
    orderBy: { dueDate: "asc" },
  });

  const data = assignments.map((a) => ({
    id: a.id,
    title: a.title,
    instructions: a.instructions,
    dueDate: a.dueDate.toISOString(),
    teacherName: a.teacher.fullName,
    submission: a.submissions[0]
      ? {
          content: a.submissions[0].content,
          fileUrl: a.submissions[0].fileUrl,
          score: a.submissions[0].score,
          feedback: a.submissions[0].feedback,
          submittedAt: a.submissions[0].submittedAt.toISOString(),
        }
      : null,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Assignments</h1>
      <p className="text-sm text-slate-600">Track due dates, submit your work, and see your scores.</p>
      <AssignmentList assignments={data} />
    </main>
  );
}
