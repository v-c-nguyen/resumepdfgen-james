import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch all profiles (public endpoint for client-side use)
export async function GET() {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { 
          error: 'Database not configured', 
          details: 'DATABASE_URL environment variable is not set. Please configure your database connection.' 
        },
        { status: 500 }
      );
    }

    const profiles = await prisma.profile.findMany({
      orderBy: { name: 'asc' },
      select: {
        name: true,
        resumeText: true,
        customPrompt: true,
        pdfTemplate: true,
        email: true,
        phoneNumber: true,
        fullAddress: true,
        linkedinUrl: true,
        jobDescription: true,
        targetTitle: true,
      },
    });
    return NextResponse.json({ profiles });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = errorMessage.includes('TLS') || 
                             errorMessage.includes('handshake') || 
                             errorMessage.includes('connection') ||
                             errorMessage.includes('EOF');
    
    return NextResponse.json(
      { 
        error: 'Failed to read profiles', 
        details: errorMessage,
        ...(isConnectionError && {
          hint: 'This appears to be a database connection issue. Please check your DATABASE_URL and ensure it includes proper SSL configuration (e.g., ?sslmode=require or ?sslmode=prefer).'
        })
      },
      { status: 500 }
    );
  }
}


