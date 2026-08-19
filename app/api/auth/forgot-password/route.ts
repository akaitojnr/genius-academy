import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendResetPasswordEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with that email address, a password reset email has been sent.",
      });
    }

    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    await db.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "";
    const resetUrl = `${origin}/reset-password?token=${token}`;

    await sendResetPasswordEmail(user.email, resetUrl);

    return NextResponse.json({
      message: "If an account exists with that email address, a password reset email has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An error occurred processing your request" }, { status: 500 });
  }
}
