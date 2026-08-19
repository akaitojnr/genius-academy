import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AssignmentManager from "./AssignmentManager";

export default async function TeacherAssignmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "TEACHER") {
    redirect("/login");
  }

  const teacher = await db.teacher.findUnique({ where: { userId: (session.user as any).id } });
  if (!teacher) redirect("/login");

  const assignments = await db.assignment.findMany({
    where: { teacherId: teacher.id },
    include: { submissions: { include: { student: true } } },
    orderBy: { dueDate: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Assignments</h1>
      <p className="text-sm text-slate-600">Create assignments and grade what students submit.</p>
      <AssignmentManager initialAssignments={assignments} />
    </main>
  );
}
