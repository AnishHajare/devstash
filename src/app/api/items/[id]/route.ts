import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getItemDetail, deleteItem } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await getItemDetail(id, session.user.id);

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { isFavorite?: boolean; isPinned?: boolean };

  const update: { isFavorite?: boolean; isPinned?: boolean } = {};
  if (typeof body.isFavorite === "boolean") update.isFavorite = body.isFavorite;
  if (typeof body.isPinned === "boolean") update.isPinned = body.isPinned;

  const item = await prisma.item.updateMany({
    where: { id, userId: session.user.id },
    data: update,
  });

  if (item.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteItem(id, session.user.id);

  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
