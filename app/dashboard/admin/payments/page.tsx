import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString()}`;
}

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const payments = await db.payment.findMany({
    include: { student: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const subscriptions = await db.subscription.findMany({
    where: { status: "ACTIVE" },
    include: { student: true, plan: true },
    orderBy: { expiryDate: "asc" },
  });

  const totalRevenue = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amountKobo, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyRevenue = payments
    .filter((p) => p.status === "SUCCESS" && p.verifiedAt && p.verifiedAt >= startOfMonth)
    .reduce((sum, p) => sum + p.amountKobo, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Payments & Subscriptions</h1>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={formatNaira(totalRevenue)} />
        <StatCard label="Revenue This Month" value={formatNaira(monthlyRevenue)} />
        <StatCard label="Active Subscriptions" value={subscriptions.length} />
        <StatCard label="Total Transactions" value={payments.length} />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-semibold">Active Subscriptions</h2>
        <div className="space-y-2">
          {subscriptions.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <p className="font-medium">{s.student.fullName} — {s.plan.name}</p>
              <p className="text-xs text-slate-500">
                Started {s.startDate?.toDateString()} · Expires {s.expiryDate?.toDateString()}
              </p>
            </div>
          ))}
          {subscriptions.length === 0 && <p className="text-sm text-slate-500">No active subscriptions.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-semibold">Recent Payments</h2>
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div>
                <p className="font-medium">{p.student.fullName}</p>
                <p className="text-xs text-slate-500">
                  {p.provider} · {p.reference} · {new Date(p.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatNaira(p.amountKobo)}</p>
                <span
                  className={`text-xs font-medium ${
                    p.status === "SUCCESS" ? "text-brand-700" : p.status === "FAILED" ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))}
          {payments.length === 0 && <p className="text-sm text-slate-500">No payments yet.</p>}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-2xl font-bold text-brand-800">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}
