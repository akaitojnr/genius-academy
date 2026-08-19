import { db } from "@/lib/db";

// A subscription is "active" if its status is ACTIVE and expiryDate hasn't
// passed. We check the date live rather than trusting the stored status
// alone, since nothing runs a daily cron to flip ACTIVE -> EXPIRED yet.
export async function getActiveSubscription(studentId: string) {
  const subscription = await db.subscription.findFirst({
    where: { studentId, status: "ACTIVE" },
    include: { plan: true },
    orderBy: { expiryDate: "desc" },
  });

  if (!subscription) return null;
  if (subscription.expiryDate && subscription.expiryDate.getTime() < Date.now()) {
    return null; // expired, even though the stored status still says ACTIVE
  }
  return subscription;
}

// PREMIUM (subjectLimit === null) unlocks every subject. BASIC/STANDARD
// only unlock the specific subjects the student was enrolled in at checkout.
export async function hasAccessToSubject(studentId: string, subjectId: string) {
  const subscription = await getActiveSubscription(studentId);
  if (!subscription) return false;
  if (subscription.plan.subjectLimit === null) return true;

  const enrollment = await db.enrollment.findFirst({
    where: { studentId, course: { subjectId } },
  });
  return !!enrollment;
}

export async function hasLiveClassAccess(studentId: string) {
  const subscription = await getActiveSubscription(studentId);
  return !!subscription?.plan.includesLive;
}
