import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Testing database connection...\n");

  // ─── System Item Types ─────────────────────────────────────
  const itemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${itemTypes.length} system item types:`);
  for (const type of itemTypes) {
    console.log(`  - ${type.name} (${type.icon}, ${type.color})`);
  }

  // ─── Demo User ─────────────────────────────────────────────
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
  });

  if (demoUser) {
    console.log(`\nDemo user:`);
    console.log(`  Name:     ${demoUser.name}`);
    console.log(`  Email:    ${demoUser.email}`);
    console.log(`  Password: ${demoUser.password ? "set" : "not set"}`);
    console.log(`  Pro:      ${demoUser.isPro}`);
  } else {
    console.log("\nDemo user not found — run db:seed first.");
  }

  // ─── Collections ───────────────────────────────────────────
  const collections = await prisma.collection.findMany({
    where: { userId: demoUser?.id },
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });

  console.log(`\nCollections (${collections.length}):`);
  for (const col of collections) {
    console.log(`  - ${col.name} (${col._count.items} items) — ${col.description}`);
  }

  // ─── Items by Type ─────────────────────────────────────────
  const items = await prisma.item.findMany({
    where: { userId: demoUser?.id },
    include: { itemType: true, tags: true },
    orderBy: { title: "asc" },
  });

  console.log(`\nItems (${items.length}):`);
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    const typeName = item.itemType.name;
    if (!grouped[typeName]) grouped[typeName] = [];
    grouped[typeName].push(item);
  }

  for (const [typeName, typeItems] of Object.entries(grouped)) {
    console.log(`\n  ${typeName}s (${typeItems.length}):`);
    for (const item of typeItems) {
      const flags = [
        item.isPinned && "pinned",
        item.isFavorite && "favorite",
      ].filter(Boolean);
      const tagNames = item.tags.map((t) => t.name).join(", ");
      console.log(
        `    - ${item.title}${flags.length ? ` [${flags.join(", ")}]` : ""}${tagNames ? ` — tags: ${tagNames}` : ""}`
      );
    }
  }

  // ─── Tags ──────────────────────────────────────────────────
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  console.log(`\nTags (${tags.length}): ${tags.map((t) => t.name).join(", ")}`);

  console.log("\n✓ Database connection OK!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Database test failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
