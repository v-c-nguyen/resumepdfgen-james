import { prisma } from '@/lib/prisma';
import { BaseResumeProfile } from './baseResumes';

// Fetch all profiles from database
export async function getBaseResumes(): Promise<BaseResumeProfile[]> {
  const profiles = await prisma.profile.findMany({
    orderBy: { name: 'asc' },
    select: {
      name: true,
      resumeText: true,
      customStage1Prompt: true,
      customStage2Prompt: true,
      customStage3Prompt: true,
      customStage4Prompt: true,
      customResumePrompt: true,
      pdfTemplate: true,
      email: true,
      phoneNumber: true,
      fullAddress: true,
      linkedinUrl: true,
      industry: true,
      jobDescription: true,
      targetTitle: true,
      logGenerations: true,
    },
  });

  return profiles.map(profile => ({
    name: profile.name,
    resumeText: profile.resumeText,
    customStage1Prompt: profile.customStage1Prompt || undefined,
    customStage2Prompt: profile.customStage2Prompt || undefined,
    customStage3Prompt: profile.customStage3Prompt || undefined,
    customStage4Prompt: profile.customStage4Prompt || undefined,
    customResumePrompt: profile.customResumePrompt || undefined,
    pdfTemplate: profile.pdfTemplate,
    email: profile.email || undefined,
    phoneNumber: profile.phoneNumber || undefined,
    fullAddress: profile.fullAddress || undefined,
    linkedinUrl: profile.linkedinUrl || undefined,
    industry: profile.industry || undefined,
    jobDescription: profile.jobDescription || undefined,
    targetTitle: profile.targetTitle || undefined,
    logGenerations: profile.logGenerations ?? false,
  }));
}

// Get a profile by name from database
export async function getBaseResumeByName(name: string | null | undefined): Promise<BaseResumeProfile | null> {
  if (!name) return null;
  
  const profile = await prisma.profile.findUnique({
    where: { name },
    select: {
      name: true,
      resumeText: true,
      customStage1Prompt: true,
      customStage2Prompt: true,
      customStage3Prompt: true,
      customStage4Prompt: true,
      customResumePrompt: true,
      pdfTemplate: true,
      email: true,
      phoneNumber: true,
      fullAddress: true,
      linkedinUrl: true,
      industry: true,
      jobDescription: true,
      targetTitle: true,
      logGenerations: true,
    },
  });

  if (!profile) return null;

  return {
    name: profile.name,
    resumeText: profile.resumeText,
    customStage1Prompt: profile.customStage1Prompt || undefined,
    customStage2Prompt: profile.customStage2Prompt || undefined,
    customStage3Prompt: profile.customStage3Prompt || undefined,
    customStage4Prompt: profile.customStage4Prompt || undefined,
    customResumePrompt: profile.customResumePrompt || undefined,
    pdfTemplate: profile.pdfTemplate,
    email: profile.email || undefined,
    phoneNumber: profile.phoneNumber || undefined,
    fullAddress: profile.fullAddress || undefined,
    linkedinUrl: profile.linkedinUrl || undefined,
    industry: profile.industry || undefined,
    jobDescription: profile.jobDescription || undefined,
    targetTitle: profile.targetTitle || undefined,
    logGenerations: profile.logGenerations ?? false,
  };
}


