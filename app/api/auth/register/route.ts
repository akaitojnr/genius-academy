import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { studentRegisterSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = studentRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.data ?? parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();
    const normalizedParentPhone = data.parentPhone.replace(/\D/g, "");

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // If a parent has already registered their own login with this phone
    // number, link this student to them immediately. If not, we still store
    // parentPhone on the student so that when the parent registers later
    // (Phase 6), they can find and claim this child automatically.
    const parent = await db.parent.findFirst({ where: { phone: normalizedParentPhone } });

    const preferredSubjects = data.preferredSubjectSlugs.length
      ? await db.subject.findMany({ where: { slug: { in: data.preferredSubjectSlugs } } })
      : [];

    const user = await db.user.create({
      data: {
        email,
        phone: data.phone,
        passwordHash,
        role: "STUDENT",
        student: {
          create: {
            fullName: data.fullName,
            classLevel: data.classLevel,
            school: data.school,
            state: data.state,
            parentPhone: normalizedParentPhone,
            preferredSubjects: { connect: preferredSubjects.map((s) => ({ id: s.id })) },
            ...(parent ? { parent: { connect: { id: parent.id } } } : {}),
          },
        },
      },
      include: { student: true },
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user: { id: user.id, email: user.email, role: user.role },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
