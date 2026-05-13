import { auth } from "@/auth";

export type AuthSuccess = {
  success: true;
  userId: string;
  isPro: boolean;
};

export type AuthFailure = { success: false; error: string };

export type RequireAuthResult = AuthSuccess | AuthFailure;

export async function requireAuth(): Promise<RequireAuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }
  return {
    success: true,
    userId: session.user.id,
    isPro: session.user.isPro === true,
  };
}
