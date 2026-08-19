"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    const session = await fetch("/api/auth/session").then((r) => r.json());
    const role = session?.user?.role;
    const destinations: Record<string, string> = {
      STUDENT: "/dashboard/student",
      TEACHER: "/dashboard/teacher",
      ADMIN: "/dashboard/admin",
      PARENT: "/dashboard/parent",
    };
    router.push(destinations[role] ?? "/dashboard/student");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold text-brand-800">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-600">Log in to continue learning.</p>

      {justRegistered && (
        <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          Account created! Please log in.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          required
          type="email"
          placeholder="Email"
          className="w-full rounded-xl border border-slate-200 px-4 py-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          type="password"
          placeholder="Password"
          className="w-full rounded-xl border border-slate-200 px-4 py-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-700 py-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log In"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Don&apos;t have an account? <Link href="/register" className="font-medium text-brand-700">Register</Link>
      </p>
    </main>
  );
}
