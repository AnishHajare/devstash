import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFromR2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ key: string[] }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  // Verify the user owns an item with this file key
  const item = await prisma.item.findFirst({
    where: { fileUrl: key, userId: session.user.id },
    select: { fileName: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let r2Response;
  try {
    r2Response = await getFromR2(key);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (!r2Response.Body) {
    return NextResponse.json({ error: "Empty file" }, { status: 404 });
  }

  const buffer = Buffer.from(await r2Response.Body.transformToByteArray());
  const contentType = r2Response.ContentType ?? "application/octet-stream";
  const filename = item.fileName ?? key.split("/").pop() ?? "download";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
