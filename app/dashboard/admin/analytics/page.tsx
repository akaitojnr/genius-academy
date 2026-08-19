import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPlatformAnalytics } from "@/lib/analytics";
import AnalyticsCharts from "./AnalyticsCharts";

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const data = await getPlatformAnalytics();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-slate-600">Last 30 days of platform activity.</p>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="New Students" value={data.totals.newStudents30d} />
        <Stat label="Lessons Completed" value={data.totals.lessonsCompleted30d} />
        <Stat label="CBT Attempts" value={data.totals.examAttempts30d} />
        <Stat label="Revenue" value={`₦${(data.totals.revenue30d / 100).toLocaleString()}`} />
        <Stat label="Study Hours Logged" value={data.totals.timeSpentHours30d} />
      </section>

      <AnalyticsCharts data={data} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xl font-bold text-brand-800">{value}</p>
      <p className="text-xs text-slate-600">{label}</p>
    </div>
  );
}
