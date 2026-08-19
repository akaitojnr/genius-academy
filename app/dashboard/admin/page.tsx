import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const [totalStudents, totalTeachers, totalCourses, totalLessons] = await Promise.all([
    db.student.count(),
    db.teacher.count(),
    db.course.count(),
    db.lesson.count(),
  ]);

  const successfulPayments = await db.payment.findMany({ where: { status: "SUCCESS" } });
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amountKobo, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyRevenue = successfulPayments
    .filter((p) => p.verifiedAt && p.verifiedAt >= startOfMonth)
    .reduce((sum, p) => sum + p.amountKobo, 0);

  const activeSubscriptions = await db.subscription.count({
    where: { status: "ACTIVE", expiryDate: { gte: new Date() } },
  });

  const stats: { label: string; value: string | number; note?: string }[] = [
    { label: "Total Students", value: totalStudents },
    { label: "Registered Teachers", value: totalTeachers },
    { label: "Total Courses", value: totalCourses },
    { label: "Total Lessons", value: totalLessons },
    { label: "Total Revenue", value: `₦${(totalRevenue / 100).toLocaleString()}` },
    { label: "Revenue This Month", value: `₦${(monthlyRevenue / 100).toLocaleString()}` },
    { label: "Active Subscriptions", value: activeSubscriptions },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-sm text-slate-600">Platform-wide overview.</p>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-brand-800">{s.value}</p>
            <p className="text-sm text-slate-600">{s.label}</p>
            {s.note && <p className="mt-1 text-xs text-slate-400">{s.note}</p>}
          </div>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ManageCard title="Students & Teachers" desc="Add teacher accounts and assign subjects." href="/dashboard/admin/teachers" />
        <ManageCard title="Subjects, Courses & Lessons" desc="Create subjects, courses, topics, lessons and videos." href="/dashboard/admin/content" />
        <ManageCard title="CBT Question Bank" desc="Manage exam questions and quizzes." href="/dashboard/admin/questions" />
        <ManageCard title="Exams" desc="Build timed CBT exams from the question bank." href="/dashboard/admin/exams" />
        <ManageCard title="Payments & Subscriptions" desc="View transactions and active subscriptions." href="/dashboard/admin/payments" />
        <ManageCard title="Pricing Plans" desc="Configure BASIC/STANDARD/PREMIUM pricing." href="/dashboard/admin/plans" />
        <ManageCard title="Analytics" desc="Signups, completions, CBT trends, revenue, popular subjects." href="/dashboard/admin/analytics" />
      </section>
    </main>
  );
}

function ManageCard({ title, desc, status, href }: { title: string; desc: string; status?: string; href?: string }) {
  const content = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-400">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
      {status && (
        <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
          Coming in {status}
        </span>
      )}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
