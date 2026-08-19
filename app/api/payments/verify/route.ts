import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPaystack, verifyFlutterwave } from "@/lib/payments";

const PLAN_DURATION_DAYS = 30;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const provider = searchParams.get("provider");
  const subjectIdsParam = searchParams.get("subjects") || "";
  const subjectIds = subjectIdsParam.split(",").filter(Boolean);

  if (!reference || !provider) {
    return NextResponse.json({ error: "Missing reference or provider" }, { status: 400 });
  }

  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment || payment.studentId !== student.id) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Already verified previously (e.g. user refreshed the callback page) —
  // return success idempotently instead of re-charging or double-enrolling.
  if (payment.status === "SUCCESS") {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  try {
    const result =
      provider === "paystack" ? await verifyPaystack(reference) : await verifyFlutterwave(reference);

    if (!result.success || result.amountKobo < payment.amountKobo) {
      await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
    }

    await db.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS", verifiedAt: new Date() },
    });

    // Activate the most recent PENDING subscription created at checkout time.
    const pendingSub = await db.subscription.findFirst({
      where: { studentId: student.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });

    if (pendingSub) {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + PLAN_DURATION_DAYS);

      await db.subscription.update({
        where: { id: pendingSub.id },
        data: { status: "ACTIVE", startDate, expiryDate },
      });

      // Enroll the student in a course per chosen subject (PREMIUM = all subjects).
      const subjectsToEnroll =
        pendingSub.plan.subjectLimit === null
          ? (await db.subject.findMany({ select: { id: true } })).map((s) => s.id)
          : subjectIds;

      for (const subjectId of subjectsToEnroll) {
        const course = await db.course.findUnique({
          where: { subjectId_classLevel: { subjectId, classLevel: student.classLevel } },
        });
        if (course) {
          await db.enrollment.upsert({
            where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
            create: { studentId: student.id, courseId: course.id },
            update: {},
          });
        }
      }

      await db.notification.create({
        data: {
          userId: (session.user as any).id,
          type: "PAYMENT_SUCCESS",
          title: "Payment successful",
          message: `Your ${pendingSub.plan.name} subscription is now active until ${expiryDate.toDateString()}.`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 502 });
  }
}
