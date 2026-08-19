import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(_req: Request, { params }: { params: { notificationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notification = await db.notification.findUnique({ where: { id: params.notificationId } });
  if (!notification || notification.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.notification.update({ where: { id: params.notificationId }, data: { isRead: true } });
  return NextResponse.json({ success: true });
}
