// Email sending helper using Resend REST API (zero extra npm dependencies)

export async function sendResetPasswordEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[EMAIL DISPATCH SKIPPED]: RESEND_API_KEY not configured. Reset link for ${email}: ${resetUrl}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Genius Academy <onboarding@resend.dev>",
        to: [email],
        subject: "Reset Your Genius Academy Password",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px;">
            <h2 style="color: #1e3a8a;">Genius Academy</h2>
            <p>Hello,</p>
            <p>You requested to reset your password for your Genius Academy account.</p>
            <p>Click the button below to set a new password. This link is valid for 1 hour:</p>
            <div style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #1d4ed8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #64748b; font-size: 12px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Resend email error:", err);
    }
  } catch (err) {
    console.error("Email send exception:", err);
  }
}
