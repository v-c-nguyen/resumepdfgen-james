import { prisma } from '@/lib/prisma';
import { BaseResumeProfile } from './baseResumes';

// Fetch all profiles from database
export async function getBaseResumes(): Promise<BaseResumeProfile[]> {
  const profiles = await prisma.profile.findMany({
    orderBy: { name: 'asc' },
  });

  return profiles.map(profile => ({
    name: profile.name,
    resumeText: profile.resumeText,
    customPrompt: profile.customPrompt || undefined,
    pdfTemplate: profile.pdfTemplate,
    email: profile.email || undefined,
    phoneNumber: profile.phoneNumber || undefined,
    fullAddress: profile.fullAddress || undefined,
    linkedinUrl: profile.linkedinUrl || undefined,
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
  });

  if (!profile) return null;

  return {
    name: profile.name,
    resumeText: profile.resumeText,
    customPrompt: profile.customPrompt || undefined,
    pdfTemplate: profile.pdfTemplate,
    email: profile.email || undefined,
    phoneNumber: profile.phoneNumber || undefined,
    fullAddress: profile.fullAddress || undefined,
    linkedinUrl: profile.linkedinUrl || undefined,
    jobDescription: profile.jobDescription || undefined,
    targetTitle: profile.targetTitle || undefined,
    logGenerations: profile.logGenerations ?? false,
  };
}


