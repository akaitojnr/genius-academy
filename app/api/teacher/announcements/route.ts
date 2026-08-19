import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const announcementSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(3),
  audience: z.enum(["STUDENT", "PARENT"]).optional(),
});

export async function GET() {
  const announcements = await db.announcement.findMany({
    include: { teacher: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ announcements });
}

export async function POST(req: Request) {
  const auth = await requireRole(["TEACHER", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const teacher = await db.teacher.findUnique({ where: { userId: (auth.session!.user as any).id } });

  const body = await req.json();
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const announcement = await db.announcement.create({
    data: { ...parsed.data, teacherId: teacher?.id },
  });

  // Fan out a lightweight notification to every student (or every parent,
  // depending on audience). Kept simple for Phase 4 — richer targeting
  // (per-course, per-class) can be layered on in Phase 7 alongside
  // email/SMS/WhatsApp delivery.
  const targetRole = parsed.data.audience === "PARENT" ? "PARENT" : "STUDENT";
  const users = await db.user.findMany({ where: { role: targetRole }, select: { id: true } });
  if (users.length > 0) {
    await db.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "ANNOUNCEMENT",
        title: parsed.data.title,
        message: parsed.data.body,
      })),
    });
  }

  return NextResponse.json({ announcement }, { status: 201 });
}
