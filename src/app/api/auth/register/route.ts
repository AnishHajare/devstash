import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password, confirmPassword } = body;

  if (!name || !email || !password || !confirmPassword) {
    return Response.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return Response.json(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return Response.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return Response.json(
    { message: "User registered successfully" },
    { status: 201 }
  );
}
