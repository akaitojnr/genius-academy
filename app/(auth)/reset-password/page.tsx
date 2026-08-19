import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Set New Password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your new secure password below.</p>
        <Suspense fallback={<p className="mt-4 text-xs text-slate-400">Loading form...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
