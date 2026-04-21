import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/auth/verification";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, rateLimitKey, registrationLimiter } from "@/lib/rate-limit";

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Invalid email address").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = await checkRateLimit(registrationLimiter, rateLimitKey("register", ip));
  if (rateCheck instanceof Response) return rateCheck;

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return Response.json({ error: message }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return Response.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await hash(password, 12);

  const requireVerification =
    process.env.REQUIRE_EMAIL_VERIFICATION !== "false";

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      emailVerified: requireVerification ? null : new Date(),
    },
  });

  if (requireVerification) {
    const token = await createVerificationToken(email);
    await sendVerificationEmail(email, token);
  }

  return Response.json(
    {
      message: requireVerification
        ? "Check your email to verify your account."
        : "Account created successfully.",
      requireVerification,
    },
    { status: 201 }
  );
}
