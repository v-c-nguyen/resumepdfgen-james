import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { PDF_TEMPLATE_IDS } from '@/app/data/pdfTemplateIds';

// Helper to verify admin session
function isAuthenticated(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('admin_session');
  return !!sessionToken;
}

// GET - Fetch all available templates from the templates folder with usage counts
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the templates directory path
    const templatesDir = join(process.cwd(), 'app', 'api', 'generate-dynamic-resume-pdf', 'templates');
    
    // Read template files when present (local / full Node). On serverless deploy, traced
    // bundles often omit this folder for this route, so readdir returns [] — use manifest.
    let files: string[] = [];
    try {
      files = await readdir(templatesDir);
    } catch {
      files = [];
    }

    // Get usage counts from database
    const profileCounts = await prisma.profile.groupBy({
      by: ['pdfTemplate'],
      _count: {
        pdfTemplate: true,
      },
    });

    // Create a map of template number to count
    const countMap = new Map<number, number>();
    for (const item of profileCounts) {
      countMap.set(item.pdfTemplate, item._count.pdfTemplate);
    }

    const fromDisk = files
      .filter((file) => file.startsWith('template') && file.endsWith('.ts'))
      .map((file) => {
        const match = file.match(/template(\d+)\.ts/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null && !Number.isNaN(n));

    const ids =
      fromDisk.length > 0
        ? [...new Set(fromDisk)].sort((a, b) => a - b)
        : [...PDF_TEMPLATE_IDS];

    const templates = ids.map((value) => ({
      value,
      label: `Template${value}`,
      usageCount: countMap.get(value) || 0,
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to read templates', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

