import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { parentRegisterSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = parentRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();
    const normalizedPhone = data.phone.replace(/\D/g, "");

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await db.user.create({
      data: {
        email,
        phone: data.phone,
        passwordHash,
        role: "PARENT",
        parent: { create: { fullName: data.fullName, phone: normalizedPhone } },
      },
      include: { parent: true },
    });

    // Auto-link every student registered with this phone number as their
    // parent/guardian contact — this is how the same parent can end up
    // watching multiple children under one login.
    const linked = await db.student.updateMany({
      where: { parentPhone: normalizedPhone, parentId: null },
      data: { parentId: user.parent!.id },
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        childrenLinked: linked.count,
        user: { id: user.id, email: user.email, role: user.role },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Parent registration error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
