import { verifyToken } from "@/lib/auth/verification";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.redirect(
      new URL("/verify-email?status=error&message=Missing+token", request.url)
    );
  }

  const result = await verifyToken(token);

  if (result.error) {
    return Response.redirect(
      new URL(
        `/verify-email?status=error&message=${encodeURIComponent(result.error)}`,
        request.url
      )
    );
  }

  return Response.redirect(
    new URL("/verify-email?status=success", request.url)
  );
}
