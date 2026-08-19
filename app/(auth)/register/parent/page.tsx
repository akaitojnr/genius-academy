"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ParentRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-800">Create your parent account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Use the same phone number you gave when your child registered — we&apos;ll link them automatically.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Full name</span>
          <input required className="input" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
          <input required type="email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Phone number</span>
          <input required className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
          <input required type="password" minLength={8} className="input" value={form.password} onChange={(e) => update("password", e.target.value)} />
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-700 py-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="font-medium text-brand-700">Log in</Link>
      </p>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          padding: 0.65rem 0.9rem;
          font-size: 0.95rem;
        }
        .input:focus {
          outline: 2px solid #0f766e;
          outline-offset: 1px;
        }
      `}</style>
    </main>
  );
}
