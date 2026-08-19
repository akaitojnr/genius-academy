import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: { liveClassId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  await db.liveClassAttendance.upsert({
    where: { liveClassId_studentId: { liveClassId: params.liveClassId, studentId: student.id } },
    create: { liveClassId: params.liveClassId, studentId: student.id },
    update: {}, // first join time is what we keep
  });

  return NextResponse.json({ recorded: true });
}
