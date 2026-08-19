import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const updateSchema = z.object({
  topic: z.string().min(2).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  meetingLink: z.string().url().optional(),
  recordingUrl: z.string().url().optional(),
});

export async function PATCH(req: Request, { params }: { params: { liveClassId: string } }) {
  const auth = await requireRole(["TEACHER", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const { scheduledAt, ...rest } = parsed.data;
  const liveClass = await db.liveClass.update({
    where: { id: params.liveClassId },
    data: { ...rest, ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}) },
  });

  return NextResponse.json({ liveClass });
}

export async function DELETE(_req: Request, { params }: { params: { liveClassId: string } }) {
  const auth = await requireRole(["TEACHER", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await db.liveClass.delete({ where: { id: params.liveClassId } });
  return NextResponse.json({ message: "Live class deleted" });
}
