import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <p className="text-center text-sm text-slate-500 font-medium">Loading...</p>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
