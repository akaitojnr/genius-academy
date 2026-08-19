import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AnnouncementForm from "./AnnouncementForm";

export default async function TeacherAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "TEACHER") {
    redirect("/login");
  }

  const announcements = await db.announcement.findMany({
    include: { teacher: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Announcements</h1>
      <p className="text-sm text-slate-600">Send an update to all students or parents.</p>
      <AnnouncementForm />

      <div className="mt-8 space-y-2">
        <h2 className="font-semibold">Recent Announcements</h2>
        {announcements.map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <p className="font-medium">{a.title}</p>
            <p className="mt-1 text-slate-600">{a.body}</p>
            <p className="mt-1 text-xs text-slate-400">
              {a.teacher?.fullName ?? "Admin"} · {new Date(a.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
