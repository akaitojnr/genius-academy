import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

const subjectSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens only"),
  description: z.string().optional(),
  iconUrl: z.string().url().optional().or(z.literal("")),
});

// GET is public so the landing page / course catalog can list subjects
// without requiring login.
export async function GET() {
  const subjects = await db.subject.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  });
  return NextResponse.json({ subjects });
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();
  const parsed = subjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.subject.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "A subject with this slug already exists" }, { status: 409 });
  }

  const subject = await db.subject.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || undefined,
      iconUrl: parsed.data.iconUrl || undefined,
    },
  });

  return NextResponse.json({ subject }, { status: 201 });
}
