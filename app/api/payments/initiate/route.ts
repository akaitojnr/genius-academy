import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { initializePaystack, initializeFlutterwave } from "@/lib/payments";

const initiateSchema = z.object({
  planId: z.string(),
  provider: z.enum(["PAYSTACK", "FLUTTERWAVE"]),
  subjectIds: z.array(z.string()).optional().default([]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = initiateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const plan = await db.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plan not found or unavailable" }, { status: 404 });
  }

  // BASIC/STANDARD must pick subjects up to the plan's limit. PREMIUM
  // (subjectLimit === null) doesn't need a selection — it unlocks everything.
  if (plan.subjectLimit !== null) {
    if (parsed.data.subjectIds.length === 0 || parsed.data.subjectIds.length > plan.subjectLimit) {
      return NextResponse.json(
        { error: `Choose between 1 and ${plan.subjectLimit} subject(s) for the ${plan.name} plan` },
        { status: 400 }
      );
    }
  }

  const reference = `bp_${Date.now()}_${randomBytes(4).toString("hex")}`;

  const payment = await db.payment.create({
    data: {
      studentId: student.id,
      provider: parsed.data.provider,
      reference,
      amountKobo: plan.priceKobo,
      status: "PENDING",
    },
  });

  // Stash the chosen plan + subjects on a short-lived Notification-free
  // record isn't ideal, so instead we encode them into the reference's
  // companion row via a pending Subscription — created now as PENDING and
  // finalized (ACTIVE, dated) once payment verifies.
  await db.subscription.create({
    data: { studentId: student.id, planId: plan.id, status: "PENDING" },
  });

  const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || "FLWPUBK-c06b821a3aeae56ab017d6eea8bc46d6-X";

  return NextResponse.json({
    reference,
    amountKobo: plan.priceKobo,
    email: session.user!.email!,
    planName: plan.name,
    publicKey,
    subjectIds: parsed.data.subjectIds,
  });
}
