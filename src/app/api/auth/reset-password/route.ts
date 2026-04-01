import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth/password-reset";

export async function POST(request: Request) {
  const { token, password, confirmPassword } = await request.json();

  if (!token || !password || !confirmPassword) {
    return NextResponse.json(
      { message: "All fields are required." },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { message: "Passwords do not match." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { message: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const result = await resetPassword(token, password);

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json({
    message: "Password reset successfully. You can now sign in.",
  });
}
