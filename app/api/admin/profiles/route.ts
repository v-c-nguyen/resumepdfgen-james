import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to verify admin session
function isAuthenticated(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('admin_session');
  return !!sessionToken;
}

// GET - Fetch all profiles
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profiles = await prisma.profile.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
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
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ profiles });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read profiles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new profile
export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      name,
      resumeText,
      customStage1Prompt,
      customStage2Prompt,
      customStage3Prompt,
      customStage4Prompt,
      customResumePrompt,
      pdfTemplate,
      email,
      phoneNumber,
      fullAddress,
      linkedinUrl,
      industry,
      jobDescription,
      targetTitle,
      logGenerations
    } = await req.json();
    
    if (!name || !resumeText) {
      return NextResponse.json(
        { error: 'Name and resumeText are required' },
        { status: 400 }
      );
    }

    // Check if profile with same name exists
    const existingProfile = await prisma.profile.findUnique({
      where: { name },
      select: { id: true },
    });
    
    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile with this name already exists' },
        { status: 400 }
      );
    }

    const newProfile = await prisma.profile.create({
      data: {
        name,
        resumeText,
        customStage1Prompt: customStage1Prompt || null,
        customStage2Prompt: customStage2Prompt || null,
        customStage3Prompt: customStage3Prompt || null,
        customStage4Prompt: customStage4Prompt || null,
        customResumePrompt: customResumePrompt || null,
        pdfTemplate: pdfTemplate ?? 1,
        email: email || null,
        phoneNumber: phoneNumber || null,
        fullAddress: fullAddress || null,
        linkedinUrl: linkedinUrl || null,
        industry: industry || null,
        jobDescription: jobDescription || null,
        targetTitle: targetTitle || null,
        logGenerations: logGenerations === true,
      },
    });

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update existing profile
export async function PUT(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      oldName,
      name,
      resumeText,
      customStage1Prompt,
      customStage2Prompt,
      customStage3Prompt,
      customStage4Prompt,
      customResumePrompt,
      pdfTemplate,
      email,
      phoneNumber,
      fullAddress,
      linkedinUrl,
      industry,
      jobDescription,
      targetTitle,
      logGenerations
    } = await req.json();
    
    if (!oldName || !name || !resumeText) {
      return NextResponse.json(
        { error: 'oldName, name, and resumeText are required' },
        { status: 400 }
      );
    }

    // Check if old profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { name: oldName },
      select: {
        id: true,
        customStage1Prompt: true,
        customStage2Prompt: true,
        customStage3Prompt: true,
        customStage4Prompt: true,
        customResumePrompt: true,
      },
    });
    
    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // If name changed, check for conflicts
    if (oldName !== name) {
      const nameConflict = await prisma.profile.findUnique({
        where: { name },
        select: { id: true },
      });
      
      if (nameConflict) {
        return NextResponse.json(
          { error: 'Profile with this name already exists' },
          { status: 400 }
        );
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { name: oldName },
      data: {
        name,
        resumeText,
        customStage1Prompt: customStage1Prompt === undefined ? existingProfile.customStage1Prompt : (customStage1Prompt || null),
        customStage2Prompt: customStage2Prompt === undefined ? existingProfile.customStage2Prompt : (customStage2Prompt || null),
        customStage3Prompt:
          customStage3Prompt === undefined ? existingProfile.customStage3Prompt : (customStage3Prompt || null),
        customStage4Prompt:
          customStage4Prompt === undefined ? existingProfile.customStage4Prompt : (customStage4Prompt || null),
        customResumePrompt:
          customResumePrompt === undefined ? existingProfile.customResumePrompt : (customResumePrompt || null),
        pdfTemplate: pdfTemplate ?? 1,
        email: email || null,
        phoneNumber: phoneNumber || null,
        fullAddress: fullAddress || null,
        linkedinUrl: linkedinUrl || null,
        industry: industry || null,
        jobDescription: jobDescription ?? null,
        targetTitle: targetTitle ?? null,
        logGenerations: logGenerations === true,
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove profile
export async function DELETE(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json(
        { error: 'Profile name is required' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { name },
      select: { id: true },
    });
    
    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Delete the profile
    await prisma.profile.delete({
      where: { name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

