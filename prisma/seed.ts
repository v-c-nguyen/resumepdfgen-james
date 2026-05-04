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
        customStage1Prompt: profile.customStage1Prompt || null,
        customStage2Prompt: profile.customStage2Prompt || null,
        customStage3Prompt: profile.customStage3Prompt || null,
        customStage4Prompt: profile.customStage4Prompt || null,
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

