import { PrismaClient } from '@prisma/client';
import { baseResumes } from '../app/data/baseResumes';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing profiles
  await prisma.profile.deleteMany({});
  console.log('Cleared existing profiles');

  // Seed profiles from baseResumes
  for (const profile of baseResumes) {
    await prisma.profile.create({
      data: {
        name: profile.name,
        resumeText: profile.resumeText,
        customPrompt: profile.customPrompt || null,
        pdfTemplate: profile.pdfTemplate || 1,
      },
    });
    console.log(`Seeded profile: ${profile.name}`);
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

