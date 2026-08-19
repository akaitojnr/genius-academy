// Email sending helper supporting Brevo API (no domain required) & Resend API

export async function sendResetPasswordEmail(email: string, resetUrl: string) {
  const brevoKey = process.env.BREVO_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #1e3a8a;">Genius Academy</h2>
      <p>Hello,</p>
      <p>You requested to reset your password for your Genius Academy account.</p>
      <p>Click the button below to set a new password. This link is valid for 1 hour:</p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #1d4ed8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 12px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  // Method 1: Brevo (300 free emails/day to ALL student emails with ZERO domain setup)
  if (brevoKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Genius Academy", email: process.env.SENDER_EMAIL || "akaitojnr@gmail.com" },
          to: [{ email }],
          subject: "Reset Your Genius Academy Password",
          htmlContent,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Brevo email error:", err);
      } else {
        console.log(`✓ Password reset email sent via Brevo to ${email}`);
        return;
      }
    } catch (err) {
      console.error("Brevo email exception:", err);
    }
  }

  // Method 2: Resend API
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Genius Academy <onboarding@resend.dev>",
          to: [email],
          subject: "Reset Your Genius Academy Password",
          html: htmlContent,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Resend email error:", err);
      } else {
        console.log(`✓ Password reset email sent via Resend to ${email}`);
        return;
      }
    } catch (err) {
      console.error("Resend email exception:", err);
    }
  }

  console.log(`[EMAIL DISPATCH SKIPPED]: No email key configured. Reset link for ${email}: ${resetUrl}`);
}
