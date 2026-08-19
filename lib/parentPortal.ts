import { db } from "@/lib/db";
import { getSubjectProgress } from "@/lib/progress";
import { getActiveSubscription } from "@/lib/subscription";

export async function getChildSummary(studentId: string) {
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return null;

  const subjectProgress = await getSubjectProgress(studentId);

  const recentAttempts = await db.examAttempt.findMany({
    where: { studentId, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: { exam: true },
  });

  const submissions = await db.submission.findMany({
    where: { studentId },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: { assignment: true },
  });

  const upcomingLiveClasses = await db.liveClass.findMany({
    where: { classLevel: student.classLevel, scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 3,
    include: { teacher: true },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const attendedCount = await db.liveClassAttendance.count({
    where: { studentId, joinedAt: { gte: thirtyDaysAgo } },
  });
  const scheduledCount = await db.liveClass.count({
    where: { classLevel: student.classLevel, scheduledAt: { gte: thirtyDaysAgo, lte: new Date() } },
  });

  const subscription = await getActiveSubscription(studentId);

  // Weekly warning: any enrolled subject with zero lessons completed in the
  // last 7 days. Mirrors the spec's example: "Your child has not completed
  // any Physics lesson this week."
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const warnings: string[] = [];
  for (const sp of subjectProgress) {
    const recentCompletion = await db.progress.findFirst({
      where: {
        studentId,
        completed: true,
        completedAt: { gte: sevenDaysAgo },
        lesson: { topic: { course: { subject: { name: sp.subject } } } },
      },
    });
    if (!recentCompletion) {
      warnings.push(`${student.fullName.split(" ")[0]} has not completed any ${sp.subject} lesson this week.`);
    }
  }

  return {
    student,
    subjectProgress,
    recentAttempts,
    submissions,
    upcomingLiveClasses,
    attendance: { attended: attendedCount, scheduled: scheduledCount },
    subscription,
    warnings,
  };
}
