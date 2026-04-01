import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const TOKEN_EXPIRY_HOURS = 1;
const IDENTIFIER_PREFIX = "reset:";

export async function createPasswordResetToken(email: string) {
  const identifier = `${IDENTIFIER_PREFIX}${email}`;

  // Delete any existing reset tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return token;
}

export async function verifyPasswordResetToken(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || !record.identifier.startsWith(IDENTIFIER_PREFIX)) {
    return { error: "Invalid password reset link." };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    });
    return { error: "This password reset link has expired." };
  }

  const email = record.identifier.slice(IDENTIFIER_PREFIX.length);
  return { success: true, email };
}

export async function resetPassword(token: string, newPassword: string) {
  const result = await verifyPasswordResetToken(token);

  if ("error" in result) {
    return result;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: result.email },
      data: { password: hashedPassword },
    }),
    prisma.verificationToken.delete({
      where: { token },
    }),
  ]);

  return { success: true };
}
