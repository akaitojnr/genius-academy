import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getChildSummary } from "@/lib/parentPortal";

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "PARENT") {
    redirect("/login");
  }

  const parent = await db.parent.findUnique({
    where: { userId: (session.user as any).id },
    include: { children: true },
  });
  if (!parent) redirect("/login");

  const summaries = await Promise.all(parent.children.map((c) => getChildSummary(c.id)));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Welcome, {parent.fullName.split(" ")[0]}</h1>
      <p className="text-sm text-slate-600">
        {parent.children.length === 0
          ? "No children linked to this account yet."
          : `Monitoring ${parent.children.length} child${parent.children.length > 1 ? "ren" : ""}.`}
      </p>

      {parent.children.length === 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          We couldn&apos;t find any student registered with this phone number. Make sure your child used the
          same phone number for you during their registration, or contact the school to link your account.
        </div>
      )}

      <div className="mt-6 space-y-6">
        {summaries.map((summary) => {
          if (!summary) return null;
          const { student, subjectProgress, warnings, subscription, attendance } = summary;
          return (
            <div key={student.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-brand-800">{student.fullName}</h2>
                  <p className="text-xs text-slate-500">{student.classLevel} · {student.school ?? "No school on file"}</p>
                </div>
                <Link href={`/dashboard/parent/${student.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                  View details →
                </Link>
              </div>

              {subscription ? (
                <p className="mt-3 text-xs font-medium text-brand-700">
                  Subscription Active — {subscription.plan.name} · expires {subscription.expiryDate?.toDateString()}
                </p>
              ) : (
                <p className="mt-3 text-xs font-medium text-amber-700">Subscription Expired — no active plan</p>
              )}

              <p className="mt-1 text-xs text-slate-500">
                Live classes attended (30 days): {attendance.attended} of {attendance.scheduled}
              </p>

              {subjectProgress.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {subjectProgress.map((sp) => (
                    <div key={sp.subject} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <p className="font-medium">{sp.subject}</p>
                      <p className="text-slate-500">{sp.percent}% complete</p>
                    </div>
                  ))}
                </div>
              )}

              {warnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {warnings.map((w) => (
                    <p key={w} className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      ⚠️ {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
