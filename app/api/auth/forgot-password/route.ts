import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Return positive message so user details aren't leaked
      return NextResponse.json({
        message: "If an account exists with that email, a password reset link has been generated.",
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

    return NextResponse.json({
      message: "If an account exists with that email, a password reset link has been generated.",
      resetUrl, // Helpful for direct testing & admin fallback
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An error occurred processing your request" }, { status: 500 });
  }
}
