import { SignJWT, jwtVerify } from "jose";

export type LinkTokenPayload = {
  userId: string;
  email: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  idToken?: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createLinkToken(payload: LinkTokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSecret());
}

export async function verifyLinkToken(token: string): Promise<LinkTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as LinkTokenPayload;
}
