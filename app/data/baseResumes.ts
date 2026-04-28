// Type definition for BaseResumeProfile
// Note: Profiles are now stored in the database and accessed via API or db.ts helpers
export type BaseResumeProfile = {
  name: string; // profile display name used as the select value
  resumeText: string; // full plain-text resume template
  customPrompt?: string; // optional custom prompt for this profile
  pdfTemplate?: number; // PDF template identifier (e.g., 'default', 'modern', 'classic')
  email?: string;
  phoneNumber?: string;
  fullAddress?: string;
  linkedinUrl?: string;
  jobDescription?: string;
  targetTitle?: string;
  logGenerations?: boolean;
};

// Import all profiles from individual files (used only for seeding)
import { profile as edwinRivera } from './profiles/adnan-sakib';
import { profile as markWlodawski } from './profiles/aaron-jones';
import { profile as samuelWlodawski } from './profiles/alex-triana';
import { profile as sergiArcusa } from './profiles/tim-paulose';
import { profile as stephenPoserina } from './profiles/marvin-romero';
import { profile as venuYara } from './profiles/aaron-roberts';
import { profile as jimmyTran } from './profiles/jimmy-tran';
import { profile as jamesGray } from './profiles/james-gray';
import { profile as christopherSmith } from './profiles/christopher-smith';

// Aggregate all profiles from individual files (used only for seeding)
// This is kept temporarily for the seed script migration
export const baseResumes: BaseResumeProfile[] = [
  edwinRivera,
  markWlodawski,
  samuelWlodawski,
  sergiArcusa,
  stephenPoserina,
  venuYara,
  jimmyTran,
  jamesGray,
  christopherSmith,
];

// Helper function to convert profile name to filename (slug) - kept for backward compatibility
export function nameToFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to convert filename to profile name (reverse slug) - kept for backward compatibility
export function filenameToName(filename: string): string {
  // Remove .ts extension if present
  const nameWithoutExt = filename.replace(/\.ts$/, '');
  // Convert kebab-case to Title Case
  return nameWithoutExt
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
