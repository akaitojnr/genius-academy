"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!token) {
      setError("Missing reset token. Please request a new password reset link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setMessage(data.message);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-red-600">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-xs text-brand-700 underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          New Password
        </label>
        <input
          required
          type="password"
          placeholder="Enter new password"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Confirm New Password
        </label>
        <input
          required
          type="password"
          placeholder="Confirm new password"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">⚠️ {error}</div>}

      {message && <div className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">✓ {message} Redirecting to login...</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}
