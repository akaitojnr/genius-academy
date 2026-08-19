import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import ContentManager from "./ContentManager";

export default async function AdminContentPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });
  const courses = await db.course.findMany({
    include: { subject: true, topics: { include: { lessons: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Manage Content</h1>
      <p className="text-sm text-slate-600">
        Add subjects, courses, topics and lessons. Nothing here is hard-coded — everything is stored in the database.
      </p>
      <ContentManager subjects={subjects} courses={courses} />
    </main>
  );
}
