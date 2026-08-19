import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import NotificationList from "./NotificationList";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const data = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <p className="text-sm text-slate-600">New lessons, live classes, assignments, exams and account updates.</p>
      <NotificationList initialNotifications={data} />
    </main>
  );
}
