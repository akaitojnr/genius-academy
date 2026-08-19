import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import LiveClassManager from "./LiveClassManager";

export default async function TeacherLiveClassesPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "TEACHER") {
    redirect("/login");
  }

  const teacher = await db.teacher.findUnique({ where: { userId: (session.user as any).id } });
  if (!teacher) redirect("/login");

  const liveClasses = await db.liveClass.findMany({
    where: { teacherId: teacher.id },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Live Classes</h1>
      <p className="text-sm text-slate-600">Schedule sessions and paste your Zoom/Google Meet link.</p>
      <LiveClassManager initialLiveClasses={liveClasses} />
    </main>
  );
}
