import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany({ orderBy: { order: "asc" } });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `backups/live-db-branches.${stamp}.json`;
  writeFileSync(path, JSON.stringify(branches, null, 2));
  console.log(`Backed up ${branches.length} live branches to ${path}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
