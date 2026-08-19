import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await db.notification.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
}

// Marks every unread notification for the current user as read at once
// (used by a "Mark all as read" action on the notifications page).
export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.notification.updateMany({
    where: { userId: (session.user as any).id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
