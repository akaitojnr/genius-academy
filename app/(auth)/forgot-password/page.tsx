"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process request");
      } else {
        setMessage(data.message);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Forgot Password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your registered email address to request a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email Address
            </label>
            <input
              required
              type="email"
              placeholder="e.g. student@gmail.com"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">⚠️ {error}</div>}

          {message && (
            <div className="rounded-lg bg-brand-50 p-3 text-xs text-brand-800">
              <p>✓ {message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Request Password Reset"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-xs text-brand-700 hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
