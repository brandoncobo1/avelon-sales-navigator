import { PrismaClient } from "@prisma/client";
import { seedConversationTree } from "../src/lib/seed-runner";

const prisma = new PrismaClient();

async function main() {
  const count = await seedConversationTree();
  console.log(`Seeded ${count} branches.`);

  const demoClinic = await prisma.clinic.upsert({
    where: { id: "demo-dental-clinic" },
    create: {
      id: "demo-dental-clinic",
      name: "Demo Dental Clinic",
      website: "demodentalclinic.co.uk",
      phone: "+44 20 7946 0958",
      location: "London, UK",
      hasCustomAsset: true,
      practiceNotes: "Use this clinic to try the full receptionist tree end to end.",
      isDemo: true,
    },
    update: {},
  });

  console.log(`Seeded demo clinic: ${demoClinic.name}`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
