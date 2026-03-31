import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? "DevStash <onboarding@resend.dev>";

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your DevStash email",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #171717; color: #fff; font-weight: 700; font-size: 14px; width: 36px; height: 36px; line-height: 36px; border-radius: 8px;">DS</div>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 16px;">Verify your email</h2>
        <p style="color: #6b7280; text-align: center; margin-bottom: 32px;">Click the button below to verify your email address and activate your DevStash account.</p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${verifyUrl}" style="display: inline-block; background: #171717; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">Verify email</a>
        </div>
        <p style="color: #9ca3af; font-size: 13px; text-align: center;">This link expires in 24 hours. If you didn't create a DevStash account, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
