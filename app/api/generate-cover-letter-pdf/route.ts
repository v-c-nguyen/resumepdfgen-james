import { NextRequest, NextResponse } from 'next/server';
import { generatePlainTextPdf } from '@/app/api/generate-dynamic-resume-pdf/plainTextPdf';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const coverLetterText = formData.get('job_description') as string;
    const baseResumeProfile = (formData.get('base_resume_profile') as string) || '';
    const company = (formData.get('company') as string) || '';
    const role = (formData.get('role') as string) || '';

    if (!coverLetterText?.trim()) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: job_description' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pdfBytes = await generatePlainTextPdf(coverLetterText.trim(), 'cover_letter');

    const sanitize = (v: string) => v.replace(/[^a-zA-Z0-9_]/g, '_');
    const fileBase = [baseResumeProfile, company, role, 'cover_letter']
      .filter(Boolean)
      .map((v) => sanitize(v))
      .join('_');

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileBase}.pdf"`,
      },
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
