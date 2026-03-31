import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@devstash.io";

async function main() {
  const usersToDelete = await prisma.user.findMany({
    where: { email: { not: DEMO_EMAIL } },
    select: { id: true, email: true },
  });

  if (usersToDelete.length === 0) {
    console.log("No users to delete — only the demo user exists.");
    return;
  }

  console.log(`Found ${usersToDelete.length} user(s) to delete:`);
  for (const u of usersToDelete) {
    console.log(`  - ${u.email ?? "(no email)"} (${u.id})`);
  }

  const userIds = usersToDelete.map((u) => u.id);

  // Cascade handles Items, Collections, Accounts, Sessions, and ItemTypes
  // but we log counts for visibility
  const [items, collections, accounts, sessions] = await Promise.all([
    prisma.item.count({ where: { userId: { in: userIds } } }),
    prisma.collection.count({ where: { userId: { in: userIds } } }),
    prisma.account.count({ where: { userId: { in: userIds } } }),
    prisma.session.count({ where: { userId: { in: userIds } } }),
  ]);

  console.log(`\nWill cascade-delete:`);
  console.log(`  Items:       ${items}`);
  console.log(`  Collections: ${collections}`);
  console.log(`  Accounts:    ${accounts}`);
  console.log(`  Sessions:    ${sessions}`);

  const result = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });

  console.log(`\nDeleted ${result.count} user(s). Demo user preserved.`);
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
