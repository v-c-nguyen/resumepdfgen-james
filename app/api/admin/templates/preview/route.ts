import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { parseResume, TemplateContext } from '@/app/api/generate-dynamic-resume-pdf/utils';
import { renderTemplate1 } from '@/app/api/generate-dynamic-resume-pdf/templates/template1';
import { renderTemplate2 } from '@/app/api/generate-dynamic-resume-pdf/templates/template2';
import { renderTemplate3 } from '@/app/api/generate-dynamic-resume-pdf/templates/template3';
import { renderTemplate4 } from '@/app/api/generate-dynamic-resume-pdf/templates/template4';
import { renderTemplate5 } from '@/app/api/generate-dynamic-resume-pdf/templates/template5';
import { renderTemplate6 } from '@/app/api/generate-dynamic-resume-pdf/templates/template6';
import { renderTemplate7 } from '@/app/api/generate-dynamic-resume-pdf/templates/template7';
import { renderTemplate8 } from '@/app/api/generate-dynamic-resume-pdf/templates/template8';
import { renderTemplate9 } from '@/app/api/generate-dynamic-resume-pdf/templates/template9';
import { renderTemplate10 } from '@/app/api/generate-dynamic-resume-pdf/templates/template10';
import { renderTemplate11 } from '@/app/api/generate-dynamic-resume-pdf/templates/template11';
import { renderTemplate12 } from '@/app/api/generate-dynamic-resume-pdf/templates/template12';
import { renderTemplate13 } from '@/app/api/generate-dynamic-resume-pdf/templates/template13';
import { renderTemplate14 } from '@/app/api/generate-dynamic-resume-pdf/templates/template14';
import { renderTemplate15 } from '@/app/api/generate-dynamic-resume-pdf/templates/template15';

// Sample resume data for preview
const SAMPLE_RESUME_TEXT = `Senior Software Engineer
John Doe
john.doe@example.com
+1 (555) 123-4567
San Francisco, CA

Summary:
Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable applications and driving technical innovation.

Technical Skills:
• Languages: JavaScript, TypeScript, Python, Java
• Frontend: React, Next.js, Vue.js, HTML5, CSS3
• Backend: Node.js, Express, FastAPI, Django
• Cloud: AWS, Azure, Docker, Kubernetes
• Databases: PostgreSQL, MongoDB, Redis
• Tools: Git, CI/CD, Agile, TDD

Professional Experience:
Senior Software Engineer at Tech Corp: 01/2020 – Present
• Led development of microservices architecture serving 1M+ users, improving system reliability by 40%
• Architected and implemented real-time data processing pipeline using Node.js and Redis
• Mentored team of 5 engineers, establishing best practices and code review processes
• Optimized database queries reducing API response time by 50% and cutting infrastructure costs by 30%
• Implemented CI/CD pipelines using GitHub Actions, reducing deployment time from 2 hours to 15 minutes
• Collaborated with product and design teams to deliver user-facing features with 95% customer satisfaction
• Designed and developed RESTful APIs handling 10K+ requests per minute with 99.9% uptime
• Built responsive frontend components using React and TypeScript, improving page load times by 35%

Software Engineer at StartupXYZ: 06/2017 – 12/2019
• Developed customer-facing web applications using React and Node.js, increasing user engagement by 60%
• Built automated testing suite achieving 85% code coverage and reducing production bugs by 45%
• Integrated third-party payment APIs and implemented secure authentication systems
• Refactored legacy codebase improving maintainability and reducing technical debt by 50%
• Participated in agile sprints, delivering features on time with high quality standards

Education:
BS in Computer Science – University of California: 2013 – 2017
`;

// Helper to generate preview PDF
async function generatePreviewPdf(template: number): Promise<Uint8Array> {
  const parsed = parseResume(SAMPLE_RESUME_TEXT);
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
    email: parsed.email,
    phone: parsed.phone,
    location: parsed.location,
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
      return await renderTemplate1(context);
  }
}

// Helper to verify admin session
function isAuthenticated(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('admin_session');
  return !!sessionToken;
}

// GET - Generate preview PDF for a template
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const templateParam = searchParams.get('template');
    
    if (!templateParam) {
      return NextResponse.json({ error: 'Template parameter is required' }, { status: 400 });
    }

    const template = parseInt(templateParam, 10);
    
    // Check if template exists (currently templates 1-15 are available)
    if (isNaN(template) || template < 1 || template > 15) {
      return NextResponse.json({ error: 'Invalid template number. Available templates: 1-15' }, { status: 400 });
    }

    const pdfBytes = await generatePreviewPdf(template);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="template${template}_preview.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

