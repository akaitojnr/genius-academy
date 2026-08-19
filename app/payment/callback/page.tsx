import { headers } from "next/headers";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: { reference?: string; provider?: string; subjects?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    redirect("/login");
  }

  const { reference, provider, subjects } = searchParams;
  let success = false;
  let error: string | null = null;

  if (!reference || !provider) {
    error = "Missing payment reference.";
  } else {
    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const url = `${protocol}://${host}/api/payments/verify?reference=${reference}&provider=${provider}&subjects=${subjects ?? ""}`;

    try {
      const res = await fetch(url, { cache: "no-store", headers: { cookie: headers().get("cookie") ?? "" } });
      const data = await res.json();
      if (!res.ok) {
        error = data.error || "Payment verification failed.";
      } else {
        success = true;
      }
    } catch {
      error = "Could not reach the verification service. Please contact support with your reference.";
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      {success ? (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl">✅</div>
          <h1 className="mt-4 text-xl font-bold text-brand-800">Payment successful</h1>
          <p className="mt-2 text-sm text-slate-600">Your subscription is now active. Enjoy learning!</p>
          <Link href="/dashboard/student" className="mt-6 rounded-full bg-brand-700 px-6 py-2.5 font-semibold text-white hover:bg-brand-800">
            Go to Dashboard
          </Link>
        </>
      ) : (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">⚠️</div>
          <h1 className="mt-4 text-xl font-bold text-red-700">Payment could not be confirmed</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Link href="/pricing" className="mt-6 rounded-full bg-brand-700 px-6 py-2.5 font-semibold text-white hover:bg-brand-800">
            Back to Pricing
          </Link>
        </>
      )}
    </main>
  );
}
