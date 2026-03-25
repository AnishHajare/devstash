import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hash } from "bcryptjs";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const systemTypes = [
  { name: "Snippet", icon: "Code", color: "#3b82f6" },
  { name: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "Command", icon: "Terminal", color: "#f97316" },
  { name: "Note", icon: "StickyNote", color: "#fde047" },
  { name: "Link", icon: "Link", color: "#10b981" },
  { name: "File", icon: "File", color: "#6b7280" },
  { name: "Image", icon: "Image", color: "#ec4899" },
];

async function main() {
  // ─── System Item Types ─────────────────────────────────────
  console.log("Seeding system item types...");

  const typeMap: Record<string, string> = {};

  for (const type of systemTypes) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, isSystem: true, userId: null },
    });

    if (existing) {
      await prisma.itemType.update({
        where: { id: existing.id },
        data: { icon: type.icon, color: type.color },
      });
      typeMap[type.name.toLowerCase()] = existing.id;
    } else {
      const created = await prisma.itemType.create({
        data: {
          name: type.name,
          icon: type.icon,
          color: type.color,
          isSystem: true,
          userId: null,
        },
      });
      typeMap[type.name.toLowerCase()] = created.id;
    }
  }

  console.log("Seeded 7 system item types.");

  // ─── Demo User ─────────────────────────────────────────────
  console.log("Seeding demo user...");

  const password = await hash("12345678", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@devstash.io" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@devstash.io",
      password,
      isPro: false,
      emailVerified: new Date(),
    },
  });

  console.log(`Seeded demo user: ${user.email}`);

  // ─── Clean up existing demo data ──────────────────────────
  await prisma.item.deleteMany({ where: { userId: user.id } });
  await prisma.collection.deleteMany({ where: { userId: user.id } });
  await prisma.tag.deleteMany({
    where: { items: { none: {} } },
  });

  // ─── Collections ───────────────────────────────────────────
  console.log("Seeding collections...");

  const reactPatterns = await prisma.collection.create({
    data: {
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      userId: user.id,
      defaultTypeId: typeMap.snippet,
    },
  });

  const aiWorkflows = await prisma.collection.create({
    data: {
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      userId: user.id,
      defaultTypeId: typeMap.prompt,
    },
  });

  const devops = await prisma.collection.create({
    data: {
      name: "DevOps",
      description: "Infrastructure and deployment resources",
      userId: user.id,
    },
  });

  const terminalCommands = await prisma.collection.create({
    data: {
      name: "Terminal Commands",
      description: "Useful shell commands for everyday development",
      userId: user.id,
      defaultTypeId: typeMap.command,
    },
  });

  const designResources = await prisma.collection.create({
    data: {
      name: "Design Resources",
      description: "UI/UX resources and references",
      userId: user.id,
      defaultTypeId: typeMap.link,
    },
  });

  console.log("Seeded 5 collections.");

  // ─── Items ─────────────────────────────────────────────────
  console.log("Seeding items...");

  // Helper to create an item and link it to a collection
  async function createItem(
    data: {
      title: string;
      contentType: string;
      content?: string;
      url?: string;
      description?: string;
      language?: string;
      isFavorite?: boolean;
      isPinned?: boolean;
      itemTypeId: string;
    },
    collectionId: string,
    tags?: string[]
  ) {
    const tagConnections = tags
      ? await Promise.all(
          tags.map(async (tagName) => {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName },
            });
            return { id: tag.id };
          })
        )
      : [];

    return prisma.item.create({
      data: {
        ...data,
        userId: user.id,
        tags: { connect: tagConnections },
        collections: {
          create: { collectionId },
        },
      },
    });
  }

  // ── React Patterns (3 snippets) ────────────────────────────

  await createItem(
    {
      title: "useDebounce Hook",
      contentType: "text",
      language: "typescript",
      description: "A custom hook that debounces a value by a given delay",
      isPinned: true,
      itemTypeId: typeMap.snippet,
      content: `import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}`,
    },
    reactPatterns.id,
    ["react", "hooks", "typescript"]
  );

  await createItem(
    {
      title: "useLocalStorage Hook",
      contentType: "text",
      language: "typescript",
      description:
        "Syncs state with localStorage, with SSR-safe initial read",
      itemTypeId: typeMap.snippet,
      content: `import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch (error) {
      console.warn(\`Error reading localStorage key "\${key}":\`, error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(\`Error setting localStorage key "\${key}":\`, error);
    }
  };

  return [storedValue, setValue] as const;
}`,
    },
    reactPatterns.id,
    ["react", "hooks", "localStorage"]
  );

  await createItem(
    {
      title: "Compound Component Pattern",
      contentType: "text",
      language: "typescript",
      description:
        "Context-based compound component pattern for flexible APIs",
      itemTypeId: typeMap.snippet,
      content: `import { createContext, useContext, useState, type ReactNode } from "react";

interface AccordionContextType {
  openIndex: number | null;
  toggle: (index: number) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("useAccordion must be used within <Accordion>");
  return ctx;
}

export function Accordion({ children }: { children: ReactNode }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (index: number) =>
    setOpenIndex((prev) => (prev === index ? null : index));

  return (
    <AccordionContext value={{ openIndex, toggle }}>
      <div className="divide-y">{children}</div>
    </AccordionContext>
  );
}

export function AccordionItem({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  const { openIndex, toggle } = useAccordion();
  const isOpen = openIndex === index;

  return (
    <div>
      <button onClick={() => toggle(index)} className="w-full text-left p-4 font-medium">
        {title}
      </button>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}`,
    },
    reactPatterns.id,
    ["react", "patterns", "compound-components"]
  );

  // ── AI Workflows (3 prompts) ───────────────────────────────

  await createItem(
    {
      title: "Code Review Prompt",
      contentType: "text",
      description: "Thorough code review with actionable feedback",
      isFavorite: true,
      itemTypeId: typeMap.prompt,
      content: `Review the following code and provide feedback on:

1. **Correctness** — Are there any bugs or logical errors?
2. **Performance** — Any unnecessary re-renders, O(n²) loops, or memory leaks?
3. **Readability** — Is the code clear? Are names descriptive?
4. **Security** — Any injection risks, exposed secrets, or unsafe operations?
5. **Best Practices** — Does it follow idiomatic patterns for the language/framework?

For each issue found, provide:
- The specific line or section
- What the problem is
- A suggested fix with code

Code to review:
\`\`\`
{{paste code here}}
\`\`\``,
    },
    aiWorkflows.id,
    ["ai", "code-review", "prompts"]
  );

  await createItem(
    {
      title: "Documentation Generator",
      contentType: "text",
      description: "Generate comprehensive docs from source code",
      itemTypeId: typeMap.prompt,
      content: `Analyze the following code and generate documentation in markdown format:

1. **Overview** — One paragraph explaining what this code does and why it exists.
2. **API Reference** — For each exported function/class/type:
   - Signature with parameter types
   - Description of what it does
   - Parameter descriptions
   - Return value description
   - Usage example
3. **Examples** — 2-3 practical usage examples with code blocks.

Code:
\`\`\`
{{paste code here}}
\`\`\``,
    },
    aiWorkflows.id,
    ["ai", "documentation", "prompts"]
  );

  await createItem(
    {
      title: "Refactoring Assistant",
      contentType: "text",
      description: "Guided refactoring with before/after comparisons",
      itemTypeId: typeMap.prompt,
      content: `Refactor the following code to improve its quality. For each change:

1. Explain **what** you changed and **why**
2. Show the **before** and **after** code
3. Rate the impact: 🟢 minor, 🟡 moderate, 🔴 significant

Focus areas:
- Extract repeated logic into reusable functions
- Simplify complex conditionals
- Improve naming for clarity
- Apply SOLID principles where appropriate
- Remove dead code

Do NOT over-engineer. Keep changes practical and justified.

Code to refactor:
\`\`\`
{{paste code here}}
\`\`\``,
    },
    aiWorkflows.id,
    ["ai", "refactoring", "prompts"]
  );

  // ── DevOps (1 snippet + 1 command + 2 links) ──────────────

  await createItem(
    {
      title: "Multi-stage Dockerfile",
      contentType: "text",
      language: "dockerfile",
      description: "Production-optimized multi-stage Docker build for Node.js",
      itemTypeId: typeMap.snippet,
      content: `FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]`,
    },
    devops.id,
    ["docker", "devops", "node"]
  );

  await createItem(
    {
      title: "Deploy with Zero Downtime",
      contentType: "text",
      description: "Blue-green deployment script using Docker Compose",
      itemTypeId: typeMap.command,
      content: `# Pull latest image and deploy with zero downtime
docker compose pull && \\
docker compose up -d --no-deps --scale app=2 --no-recreate app && \\
sleep 10 && \\
docker compose up -d --no-deps --scale app=1 --no-recreate app`,
    },
    devops.id,
    ["docker", "deployment", "devops"]
  );

  await createItem(
    {
      title: "Docker Compose Reference",
      contentType: "url",
      url: "https://docs.docker.com/reference/compose-file/",
      description: "Official Docker Compose file reference documentation",
      itemTypeId: typeMap.link,
    },
    devops.id,
    ["docker", "documentation"]
  );

  await createItem(
    {
      title: "GitHub Actions Documentation",
      contentType: "url",
      url: "https://docs.github.com/en/actions",
      description: "Official GitHub Actions docs for CI/CD workflows",
      itemTypeId: typeMap.link,
    },
    devops.id,
    ["ci-cd", "github", "documentation"]
  );

  // ── Terminal Commands (4 commands) ─────────────────────────

  await createItem(
    {
      title: "Interactive Rebase Last N Commits",
      contentType: "text",
      description: "Squash, reorder, or edit recent git commits",
      isPinned: true,
      itemTypeId: typeMap.command,
      content: `# Interactive rebase last 5 commits
git rebase -i HEAD~5

# Squash all commits on current branch into one
git reset --soft $(git merge-base HEAD main) && git commit`,
    },
    terminalCommands.id,
    ["git", "rebase"]
  );

  await createItem(
    {
      title: "Docker Cleanup Commands",
      contentType: "text",
      description: "Remove unused containers, images, volumes, and networks",
      itemTypeId: typeMap.command,
      content: `# Remove all stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Nuclear option: remove everything unused
docker system prune -a --volumes -f`,
    },
    terminalCommands.id,
    ["docker", "cleanup"]
  );

  await createItem(
    {
      title: "Find and Kill Process on Port",
      contentType: "text",
      description: "Find what's running on a port and kill it",
      itemTypeId: typeMap.command,
      content: `# Find process on port 3000
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -ti :3000)

# Alternative using fuser (Linux)
fuser -k 3000/tcp`,
    },
    terminalCommands.id,
    ["process", "ports", "debugging"]
  );

  await createItem(
    {
      title: "npm/pnpm Useful Commands",
      contentType: "text",
      description: "Handy package manager shortcuts and utilities",
      itemTypeId: typeMap.command,
      content: `# Check for outdated packages
npm outdated

# Update all packages to latest (respecting semver)
npm update

# List all globally installed packages
npm list -g --depth=0

# Why is this package installed?
npm explain <package>

# Clean install (delete node_modules + lockfile)
rm -rf node_modules package-lock.json && npm install`,
    },
    terminalCommands.id,
    ["npm", "pnpm", "package-manager"]
  );

  // ── Design Resources (4 links) ────────────────────────────

  await createItem(
    {
      title: "Tailwind CSS Documentation",
      contentType: "url",
      url: "https://tailwindcss.com/docs",
      description: "Official Tailwind CSS docs — utility class reference",
      isFavorite: true,
      itemTypeId: typeMap.link,
    },
    designResources.id,
    ["tailwind", "css", "reference"]
  );

  await createItem(
    {
      title: "shadcn/ui Components",
      contentType: "url",
      url: "https://ui.shadcn.com/docs/components",
      description: "Beautifully designed components built with Radix and Tailwind",
      itemTypeId: typeMap.link,
    },
    designResources.id,
    ["shadcn", "components", "ui"]
  );

  await createItem(
    {
      title: "Radix UI Primitives",
      contentType: "url",
      url: "https://www.radix-ui.com/primitives/docs/overview/introduction",
      description: "Unstyled, accessible UI primitives for React",
      itemTypeId: typeMap.link,
    },
    designResources.id,
    ["radix", "accessibility", "ui"]
  );

  await createItem(
    {
      title: "Lucide Icons",
      contentType: "url",
      url: "https://lucide.dev/icons",
      description: "Beautiful & consistent open-source icon library",
      itemTypeId: typeMap.link,
    },
    designResources.id,
    ["icons", "lucide", "design"]
  );

  console.log("Seeded 18 items across 5 collections.");
  console.log("Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
