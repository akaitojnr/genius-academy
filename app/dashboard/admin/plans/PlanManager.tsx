"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  priceKobo: number;
  subjectLimit: number | null;
  includesLive: boolean;
  isActive: boolean;
};

export default function PlanManager({ initialPlans }: { initialPlans: Plan[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [savingId, setSavingId] = useState<string | null>(null);

  function updateLocal(id: string, patch: Partial<Plan>) {
    setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function save(plan: Plan) {
    setSavingId(plan.id);
    try {
      await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceKobo: plan.priceKobo,
          description: plan.description,
          subjectLimit: plan.subjectLimit,
          includesLive: plan.includesLive,
          isActive: plan.isActive,
        }),
      });
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      {plans.map((plan) => (
        <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-800">{plan.name}</h3>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={plan.isActive} onChange={(e) => updateLocal(plan.id, { isActive: e.target.checked })} />
              Active
            </label>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm">
              Price (₦, per month)
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={plan.priceKobo / 100}
                onChange={(e) => updateLocal(plan.id, { priceKobo: Math.round(Number(e.target.value) * 100) })}
              />
            </label>
            <label className="text-sm">
              Subject limit (blank = unlimited)
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={plan.subjectLimit ?? ""}
                placeholder="Unlimited"
                onChange={(e) =>
                  updateLocal(plan.id, { subjectLimit: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </label>
          </div>

          <label className="mt-3 block text-sm">
            Description
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={plan.description ?? ""}
              onChange={(e) => updateLocal(plan.id, { description: e.target.value })}
            />
          </label>

          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={plan.includesLive} onChange={(e) => updateLocal(plan.id, { includesLive: e.target.checked })} />
            Includes live classes
          </label>

          <button
            onClick={() => save(plan)}
            disabled={savingId === plan.id}
            className="mt-4 rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {savingId === plan.id ? "Saving…" : "Save Changes"}
          </button>
        </div>
      ))}
    </div>
  );
}
