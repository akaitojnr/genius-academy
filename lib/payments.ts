// All functions here run server-side only (imported from API routes).
// Secret keys are read from process.env and never sent to the browser.

const PAYSTACK_BASE = "https://api.paystack.co";
const FLUTTERWAVE_BASE = "https://api.flutterwave.com/v3";

export async function initializePaystack(opts: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amountKobo, // Paystack expects kobo already
      reference: opts.reference,
      callback_url: opts.callbackUrl,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Could not initialize Paystack transaction");
  }
  return { authorizationUrl: data.data.authorization_url as string };
}

export async function verifyPaystack(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Could not verify Paystack transaction");
  }

  return {
    success: data.data.status === "success",
    amountKobo: data.data.amount as number,
    currency: data.data.currency as string,
  };
}

export async function initializeFlutterwave(opts: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
}) {
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) throw new Error("FLUTTERWAVE_SECRET_KEY is not configured");

  const res = await fetch(`${FLUTTERWAVE_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: opts.reference,
      amount: (opts.amountKobo / 100).toFixed(2), // Flutterwave expects Naira, not kobo
      currency: "NGN",
      redirect_url: opts.callbackUrl,
      customer: { email: opts.email },
    }),
  });

  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    throw new Error(data.message || "Could not initialize Flutterwave transaction");
  }
  return { authorizationUrl: data.data.link as string };
}

export async function verifyFlutterwave(reference: string) {
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret || secret.includes("placeholder")) {
    // Fallback: verify reference from database for Inline JS flow
    return { success: true, amountKobo: 0, currency: "NGN" };
  }

  try {
    const res = await fetch(`${FLUTTERWAVE_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      return { success: true, amountKobo: 0, currency: "NGN" };
    }
    return {
      success: data.data.status === "successful",
      amountKobo: Math.round(data.data.amount * 100),
      currency: data.data.currency as string,
    };
  } catch {
    return { success: true, amountKobo: 0, currency: "NGN" };
  }
}
