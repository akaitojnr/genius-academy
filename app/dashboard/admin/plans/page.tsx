import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import PlanManager from "./PlanManager";

export default async function AdminPlansPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const plans = await db.plan.findMany({ orderBy: { priceKobo: "asc" } });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Pricing Plans</h1>
      <p className="text-sm text-slate-600">Configure prices and limits — changes apply immediately to /pricing.</p>
      <PlanManager initialPlans={plans} />
    </main>
  );
}
