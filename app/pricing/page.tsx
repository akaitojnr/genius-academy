import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import CheckoutForm from "./CheckoutForm";
import { getActiveSubscription } from "@/lib/subscription";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    redirect("/login");
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) redirect("/login");

  const plans = await db.plan.findMany({ where: { isActive: true }, orderBy: { priceKobo: "asc" } });
  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });
  const activeSubscription = await getActiveSubscription(student.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Pricing</h1>
      <p className="text-sm text-slate-600">Subscribe to unlock lessons, CBT practice and live classes.</p>

      {activeSubscription && (
        <div className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          You currently have an active <strong>{activeSubscription.plan.name}</strong> plan, valid until{" "}
          {activeSubscription.expiryDate?.toDateString()}.
        </div>
      )}

      <CheckoutForm plans={plans} subjects={subjects} />
    </main>
  );
}
