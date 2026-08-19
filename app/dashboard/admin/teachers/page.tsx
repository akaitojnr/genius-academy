import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import TeacherManager from "./TeacherManager";

export default async function AdminTeachersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });
  const teachers = await db.teacher.findMany({
    include: { user: true, subjects: true, _count: { select: { courses: true, liveClasses: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Teachers</h1>
      <p className="text-sm text-slate-600">Create teacher accounts and assign them to subjects.</p>
      <TeacherManager subjects={subjects} initialTeachers={teachers} />
    </main>
  );
}
