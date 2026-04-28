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
    const { name, resumeText, customPrompt, pdfTemplate, email, phoneNumber, fullAddress, linkedinUrl, jobDescription, targetTitle, logGenerations } = await req.json();
    
    if (!name || !resumeText) {
      return NextResponse.json(
        { error: 'Name and resumeText are required' },
        { status: 400 }
      );
    }

    // Check if profile with same name exists
    const existingProfile = await prisma.profile.findUnique({
      where: { name },
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
        customPrompt: customPrompt || null,
        pdfTemplate: pdfTemplate ?? 1,
        email: email || null,
        phoneNumber: phoneNumber || null,
        fullAddress: fullAddress || null,
        linkedinUrl: linkedinUrl || null,
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
    const { oldName, name, resumeText, customPrompt, pdfTemplate, email, phoneNumber, fullAddress, linkedinUrl, jobDescription, targetTitle, logGenerations } = await req.json();
    
    if (!oldName || !name || !resumeText) {
      return NextResponse.json(
        { error: 'oldName, name, and resumeText are required' },
        { status: 400 }
      );
    }

    // Check if old profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { name: oldName },
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
        customPrompt: customPrompt || null,
        pdfTemplate: pdfTemplate ?? 1,
        email: email || null,
        phoneNumber: phoneNumber || null,
        fullAddress: fullAddress || null,
        linkedinUrl: linkedinUrl || null,
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

