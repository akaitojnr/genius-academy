import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "User with this email not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    return NextResponse.json({ message: `Password for ${user.email} reset successfully.` });
  } catch (error) {
    console.error("Admin reset password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
