import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/auth/verification";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Don't reveal whether the user exists
  if (!user || user.emailVerified) {
    return Response.json({
      message: "If that email exists and is unverified, a new link has been sent.",
    });
  }

  const token = await createVerificationToken(email);
  await sendVerificationEmail(email, token);

  return Response.json({
    message: "If that email exists and is unverified, a new link has been sent.",
  });
}
