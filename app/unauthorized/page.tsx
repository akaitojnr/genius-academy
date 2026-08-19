import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-red-700">Access Denied</h1>
      <p className="mt-2 text-sm text-slate-600">
        You don&apos;t have permission to view this page.
      </p>
      <Link href="/" className="mt-6 rounded-full bg-brand-700 px-5 py-2 text-white">
        Go home
      </Link>
    </main>
  );
}
