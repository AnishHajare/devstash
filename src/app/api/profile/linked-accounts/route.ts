import { auth } from "@/auth";
import { unlinkAccount } from "@/lib/db/accounts";
import { checkRateLimit, rateLimitKey, changePasswordLimiter } from "@/lib/rate-limit";

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = await checkRateLimit(
    changePasswordLimiter,
    rateLimitKey("unlink", session.user.id)
  );
  if (rateCheck instanceof Response) return rateCheck;

  const { provider } = await request.json();

  if (!provider || typeof provider !== "string") {
    return Response.json({ error: "Provider is required." }, { status: 400 });
  }

  try {
    await unlinkAccount(session.user.id, provider);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to unlink account.";
    return Response.json({ error: message }, { status: 400 });
  }

  return Response.json({ message: "Account unlinked successfully." });
}
