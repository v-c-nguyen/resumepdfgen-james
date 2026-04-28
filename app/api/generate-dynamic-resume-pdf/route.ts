import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { prisma } from '@/lib/prisma';
import { getBaseResumeByName } from '@/app/data/db';
import { parseResume, sanitizeForPdfText, TemplateContext } from './utils';
import { renderTemplate1 } from './templates/template1';
import { renderTemplate2 } from './templates/template2';
import { renderTemplate3 } from './templates/template3';
import { renderTemplate4 } from './templates/template4';
import { renderTemplate5 } from './templates/template5';
import { renderTemplate6 } from './templates/template6';
import { renderTemplate7 } from './templates/template7';
import { renderTemplate8 } from './templates/template8';
import { renderTemplate9 } from './templates/template9';
import { renderTemplate10 } from './templates/template10';
import { renderTemplate11 } from './templates/template11';
import { renderTemplate12 } from './templates/template12';
import { renderTemplate13 } from './templates/template13';
import { renderTemplate14 } from './templates/template14';
import { renderTemplate15 } from './templates/template15';

// Optional contact overrides from profile when resume text doesn't contain them.
// Phone is never overridden: PDF shows a phone only if it appears in the resume text.
type ContactOverrides = { email?: string; location?: string };

// Prisma client type including ResumeGenerationLog (avoids TS error if client was generated before model existed)
type PrismaWithResumeLog = typeof prisma & {
  resumeGenerationLog: {
    create: (args: {
      data: {
        profileName: string | null;
        jobDescription: string | null;
        resumeText: string;
        company: string | null;
        role: string | null;
      };
    }) => Promise<unknown>;
  };
};

// Template router - routes to appropriate template renderer
async function generateResumePdf(
  resumeText: string,
  template: number = 1,
  overrides?: ContactOverrides
): Promise<Uint8Array> {
  const parsed = parseResume(resumeText);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const context: TemplateContext = {
    pdfDoc,
    page,
    font,
    fontBold,
    headline: parsed.headline,
    name: parsed.name,
    email: parsed.email || overrides?.email || '',
    phone: parsed.phone || '',
    location: parsed.location || overrides?.location || '',
    body: parsed.body,
    PAGE_WIDTH: 595,
    PAGE_HEIGHT: 842
  };

  // Route to appropriate template
  switch (template) {
    case 1:
      return await renderTemplate1(context);
    case 2:
      return await renderTemplate2(context);
    case 3:
      return await renderTemplate3(context);
    case 4:
      return await renderTemplate4(context);
    case 5:
      return await renderTemplate5(context);
    case 6:
      return await renderTemplate6(context);
    case 7:
      return await renderTemplate7(context);
    case 8:
      return await renderTemplate8(context);
    case 9:
      return await renderTemplate9(context);
    case 10:
      return await renderTemplate10(context);
    case 11:
      return await renderTemplate11(context);
    case 12:
      return await renderTemplate12(context);
    case 13:
      return await renderTemplate13(context);
    case 14:
      return await renderTemplate14(context);
    case 15:
      return await renderTemplate15(context);
    default:
      return await renderTemplate5(context);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Parse form data
    const formData = await req.formData();
    const jobDescription = formData.get('job_description') as string; // resume text used for PDF
    const jdText = (formData.get('jd_text') as string) || ''; // job description from main page
    const company = (formData.get('company') as string) || '';
    const role = (formData.get('role') as string) || '';
    const baseResumeProfile = formData.get('base_resume_profile') as string | null;

    // Load profile to check if logging is enabled for this profile
    const profile = await getBaseResumeByName(baseResumeProfile);

    // Save job description and resume text to log only when profile has logGenerations enabled
    if (process.env.DATABASE_URL && profile?.logGenerations) {
      try {
        await (prisma as PrismaWithResumeLog).resumeGenerationLog.create({
          data: {
            profileName: baseResumeProfile || null,
            jobDescription: jdText.trim() || null,
            resumeText: jobDescription,
            company: company.trim() || null,
            role: role.trim() || null,
          },
        });
      } catch (logError) {
        console.error('Failed to save generation log:', logError);
      }
    }

    // Validate required fields
    if (!jobDescription) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: job_description' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Use profile already loaded above for template selection
    // const baseResume: string = profile?.resumeText || ``;
    // const customPrompt = profile?.customPrompt;
    const pdfTemplate = profile?.pdfTemplate || 1;

    const tailoredResume = jobDescription;

    if (!tailoredResume) {
      return new NextResponse(
        JSON.stringify({ error: 'Failed to generate tailored resume content' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Generate PDF with template (profile email as fallback; location from resume text when present, else profile fullAddress; phone from text only)
    const contactOverrides: ContactOverrides = {};
    if (profile?.email) contactOverrides.email = sanitizeForPdfText(profile.email);
    const parsedForContact = parseResume(tailoredResume);
    if (profile?.fullAddress && !parsedForContact.location.trim()) {
      contactOverrides.location = sanitizeForPdfText(profile.fullAddress);
    }
    const pdfBytes = await generateResumePdf(tailoredResume, pdfTemplate, contactOverrides);

    // 5. Return PDF as responseconst sanitize = v => v.replace(/[^a-zA-Z0-9_]/g, '_');
    const sanitize = (v: string) => v.replace(/[^a-zA-Z0-9_]/g, '_');

    const fileBase = [
      baseResumeProfile,
      company,
      role
    ]
      .filter(Boolean)            // remove empty / null / undefined
      .map((v: string | null) => v?.replace(/[^a-zA-Z0-9_]/g, '_'))              // sanitize each part
      .join('_');

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileBase}.pdf"`
      }
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
