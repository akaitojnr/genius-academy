import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasLiveClassAccess } from "@/lib/subscription";
import JoinClassButton from "@/components/JoinClassButton";

export default async function LiveClassesPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    redirect("/login");
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) redirect("/login");

  const canJoin = await hasLiveClassAccess(student.id);

  const liveClasses = await db.liveClass.findMany({
    where: { classLevel: student.classLevel },
    include: { teacher: true },
    orderBy: { scheduledAt: "desc" },
  });

  const now = Date.now();
  const upcoming = liveClasses.filter((lc) => new Date(lc.scheduledAt).getTime() + 60 * 60 * 1000 >= now);
  const past = liveClasses.filter((lc) => new Date(lc.scheduledAt).getTime() + 60 * 60 * 1000 < now);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Live Classes</h1>
      <p className="text-sm text-slate-600">Scheduled sessions for {student.classLevel}.</p>

      {!canJoin && (
        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          🔒 Live classes are included with the <strong>PREMIUM</strong> plan.{" "}
          <Link href="/pricing" className="font-semibold underline">
            Upgrade your plan
          </Link>{" "}
          to join.
        </div>
      )}

      <section className="mt-6 space-y-3">
        <h2 className="font-semibold text-slate-800">Upcoming</h2>
        {upcoming.length === 0 && <p className="text-sm text-slate-500">No upcoming live classes.</p>}
        {upcoming.map((lc) => {
          const start = new Date(lc.scheduledAt);
          const isLive = now >= start.getTime() && now < start.getTime() + 60 * 60 * 1000;
          return (
            <div key={lc.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {lc.subjectName} — {lc.topic}
                    {isLive && (
                      <span className="ml-2 animate-pulse rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        LIVE NOW
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lc.teacher.fullName} · {start.toLocaleString()}
                  </p>
                  {lc.description && <p className="mt-1 text-sm text-slate-600">{lc.description}</p>}
                </div>
                {canJoin ? (
                  <JoinClassButton liveClassId={lc.id} meetingLink={lc.meetingLink} isLive={isLive} />
                ) : (
                  <span className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
                    🔒 Locked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-semibold text-slate-800">Past Classes</h2>
        {past.length === 0 && <p className="text-sm text-slate-500">No past classes yet.</p>}
        {past.map((lc) => (
          <div key={lc.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-medium">{lc.subjectName} — {lc.topic}</p>
            <p className="text-xs text-slate-500">{lc.teacher.fullName} · {new Date(lc.scheduledAt).toLocaleString()}</p>
            {lc.recordingUrl && canJoin ? (
              <a href={lc.recordingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-full border border-brand-600 px-4 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                Watch Recording
              </a>
            ) : lc.recordingUrl ? (
              <span className="mt-2 inline-block text-xs text-slate-400">🔒 Recording available on PREMIUM</span>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Recording not uploaded yet.</p>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
