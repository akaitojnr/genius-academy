"use client";

import { useState } from "react";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  priceKobo: number;
  subjectLimit: number | null;
  includesLive: boolean;
};
type Subject = { id: string; name: string };

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString()}`;
}

function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).FlutterwaveCheckout) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Flutterwave checkout SDK"));
    document.body.appendChild(script);
  });
}

export default function CheckoutForm({ plans, subjects }: { plans: Plan[]; subjects: Subject[] }) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [chosenSubjects, setChosenSubjects] = useState<string[]>([]);
  const [provider] = useState<"FLUTTERWAVE">("FLUTTERWAVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSubject(id: string) {
    if (!selectedPlan?.subjectLimit) return;
    setChosenSubjects((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= selectedPlan.subjectLimit!) return s; // cap reached
      return [...s, id];
    });
  }

  async function pay() {
    if (!selectedPlan) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, provider, subjectIds: chosenSubjects }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start payment");
        setLoading(false);
        return;
      }

      await loadFlutterwaveScript();

      (window as any).FlutterwaveCheckout({
        public_key: data.publicKey,
        tx_ref: data.reference,
        amount: data.amountKobo / 100,
        currency: "NGN",
        payment_options: "card,mobilemoney,ussd,banktransfer",
        customer: {
          email: data.email,
        },
        customizations: {
          title: "Genius Academy",
          description: `${data.planName} Subscription`,
        },
        callback: function (response: any) {
          const subjectsParam = (data.subjectIds || []).join(",");
          window.location.href = `/payment/callback?reference=${data.reference}&provider=flutterwave&subjects=${subjectsParam}`;
        },
        onclose: function () {
          setLoading(false);
        },
      });
    } catch (err: any) {
      setError(err.message || "An error occurred launching payment");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedPlan(p);
              setChosenSubjects([]);
            }}
            className={`rounded-2xl border p-5 text-left shadow-sm ${
              selectedPlan?.id === p.id ? "border-brand-700 bg-brand-50" : "border-slate-200 bg-white"
            }`}
          >
            <h3 className="font-bold text-brand-800">{p.name}</h3>
            <p className="mt-1 text-xl font-extrabold">{formatNaira(p.priceKobo)}<span className="text-sm font-normal text-slate-500">/mo</span></p>
            <p className="text-sm text-slate-600">{p.description}</p>
            {p.includesLive && <p className="mt-1 text-xs font-medium text-brand-700">Includes live classes</p>}
          </button>
        ))}
      </div>

      {selectedPlan && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          {selectedPlan.subjectLimit !== null ? (
            <>
              <h3 className="font-semibold">
                Choose up to {selectedPlan.subjectLimit} subject{selectedPlan.subjectLimit > 1 ? "s" : ""}
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {subjects.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <input type="checkbox" checked={chosenSubjects.includes(s.id)} onChange={() => toggleSubject(s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {chosenSubjects.length}/{selectedPlan.subjectLimit} selected
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-600">All subjects and live classes are included with PREMIUM.</p>
          )}

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <span>Payment Method:</span>
            <span className="font-semibold text-brand-700">Flutterwave</span>
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            onClick={pay}
            disabled={loading || (selectedPlan.subjectLimit !== null && chosenSubjects.length === 0)}
            className="mt-5 w-full rounded-full bg-brand-700 py-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? "Launching Flutterwave..." : `Pay ${formatNaira(selectedPlan.priceKobo)}`}
          </button>
        </div>
      )}
    </div>
  );
}
