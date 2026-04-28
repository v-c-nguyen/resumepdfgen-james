import { StandardFonts, rgb } from 'pdf-lib';
import {
  TemplateContext,
  drawTextWithBold,
  formatDate,
  wrapText,
  parseEducationThreePartLine,
  drawEducationTwoRows,
} from '../utils';

type Sections = {
  summary: string[];
  skills: string[];
  experience: string[];
  education: string[];
  other: string[];
};

function splitSections(body: string): Sections {
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);
  const sections: Sections = { summary: [], skills: [], experience: [], education: [], other: [] };
  let current: keyof Sections = 'other';

  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/:$/, '');
    if (normalized === 'summary') {
      current = 'summary';
      continue;
    }
    if (normalized === 'technical skills' || normalized === 'skills') {
      current = 'skills';
      continue;
    }
    if (normalized === 'professional experience' || normalized === 'experience') {
      current = 'experience';
      continue;
    }
    if (normalized === 'education') {
      current = 'education';
      continue;
    }
    sections[current].push(line);
  }

  return sections;
}

export async function renderTemplate15(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, name, headline, email, phone, location, body, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const INK = rgb(0.12, 0.14, 0.18);
  const MUTED = rgb(0.35, 0.39, 0.45);
  const ACCENT = rgb(0.18, 0.25, 0.36);
  const LINE = rgb(0.84, 0.87, 0.91);
  const SECTION_LINE = rgb(0.78, 0.82, 0.88);

  const MARGIN = 44;
  const LEFT_X = MARGIN;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const BOTTOM = 50;
  const bodyLineHeight = 14.4;
  const sectionHeaderSize = 9.6;
  const bodySize = 9.7;

  const sections = splitSections(body);

  // Clean centered header (single-column style)

  let headerY = PAGE_HEIGHT - 48;
  if (name) {
    const up = name.toUpperCase();
    const nameWidth = fontBold.widthOfTextAtSize(up, 23);
    page.drawText(up, { x: (PAGE_WIDTH - nameWidth) / 2, y: headerY, size: 23, font: fontBold, color: INK });
    headerY -= 20;
  }
  if (headline) {
    const headlineLines = wrapText(headline, font, 10.6, CONTENT_WIDTH * 0.86);
    for (const line of headlineLines) {
      const width = font.widthOfTextAtSize(line, 10.6);
      page.drawText(line, { x: (PAGE_WIDTH - width) / 2, y: headerY, size: 10.6, font, color: MUTED });
      headerY -= 5;
    }
  }

  const contactLine = [location, phone, email].filter(Boolean).join('   •   ');
  let contentStartY = PAGE_HEIGHT - 146;
  if (contactLine) {
    const contactY = headerY - 12;
    const contactWidth = font.widthOfTextAtSize(contactLine, 9.1);
    page.drawText(contactLine, { x: (PAGE_WIDTH - contactWidth) / 2, y: contactY, size: 9.1, font, color: MUTED });
    contentStartY = contactY - 30;
  }

  let y = contentStartY;
  const ensurePage = () => {
    if (y >= BOTTOM + 10) return;
    context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - 76;
  };

  const drawSection = (title: string, lines: string[]) => {
    if (lines.length === 0) return;
    ensurePage();
    const label = `${title}`;
    const labelWidth = fontBold.widthOfTextAtSize(label, sectionHeaderSize);
    const labelX = LEFT_X + (CONTENT_WIDTH - labelWidth) / 2;
    context.page.drawText(label, { x: labelX, y: y, size: sectionHeaderSize, font: fontBold, color: ACCENT });
    const lineY = y - 5;
    context.page.drawLine({
      start: { x: LEFT_X, y: lineY },
      end: { x: labelX - 10, y: lineY },
      thickness: 0.9,
      color: SECTION_LINE,
    });
    context.page.drawLine({
      start: { x: labelX + labelWidth + 10, y: lineY },
      end: { x: LEFT_X + CONTENT_WIDTH, y: lineY },
      thickness: 0.9,
      color: SECTION_LINE,
    });
    y -= 18;

    const noBulletSection = title === 'SUMMARY' || title === 'EDUCATION';

    let seenExperienceCompany = false;

    for (const rawLine of lines) {
      ensurePage();
      const line = rawLine.trim();
      if (title === 'EDUCATION') {
        const edu = parseEducationThreePartLine(line);
        if (edu) {
          y = drawEducationTwoRows({
            page: context.page,
            ensurePageSpace: ensurePage,
            textLeft: LEFT_X + 4,
            y,
            contentWidth: CONTENT_WIDTH - 8,
            rightEdgeX: LEFT_X + CONTENT_WIDTH,
            bodyLineHeight,
            font,
            fontBold,
            degreeSize: bodySize + 0.6,
            metaSize: 9.1,
            degreeColor: INK,
            mutedColor: MUTED,
            degree: edu.degree,
            institution: edu.institution,
            periodRaw: edu.period,
            degreeWrapSubtract: 12,
          });
          y -= 5;
          continue;
        }
      }
      const isJobLine = / at .+:.+/.test(line);
      if (isJobLine) {
        const match = line.match(/^(.+?) at (.+?):\s*(.+)$/);
        if (match) {
          if (title === 'EXPERIENCE' && seenExperienceCompany) {
            y -= 8;
            ensurePage();
          }
          const [, titleText, company, period] = match;
          drawTextWithBold(context.page, titleText, LEFT_X + 4, y, font, fontBold, bodySize + 0.8, INK);
          y -= bodyLineHeight;
          const meta = `${company} | ${formatDate(period.trim())}`;
          const metaLines = wrapText(meta, font, 9.1, CONTENT_WIDTH - 8);
          for (const metaLine of metaLines) {
            ensurePage();
            context.page.drawText(metaLine, { x: LEFT_X + 4, y, size: 9.1, font, color: MUTED });
            y -= bodyLineHeight;
          }
          y -= 5;
          if (title === 'EXPERIENCE') {
            seenExperienceCompany = true;
          }
          continue;
        }
      }

      const plain = line.replace(/^[•·-]\s*/, '').trim();
      const wrapped = wrapText(plain, font, bodySize, CONTENT_WIDTH - 18);
      for (let i = 0; i < wrapped.length; i++) {
        ensurePage();
        if (!noBulletSection && i === 0) {
          context.page.drawText('•', { x: LEFT_X + 4, y, size: bodySize, font, color: ACCENT });
        }
        const textX = noBulletSection ? LEFT_X + 4 : LEFT_X + 15;
        context.page.drawText(wrapped[i], { x: textX, y, size: bodySize, font, color: INK });
        y -= bodyLineHeight;
      }
      y -= 1.2;
    }
    y -= 14;
  };

  drawSection('SUMMARY', sections.summary);
  drawSection('SKILLS', sections.skills);
  drawSection('EXPERIENCE', sections.experience);
  drawSection('EDUCATION', sections.education);
  drawSection('ADDITIONAL', sections.other);

  return await pdfDoc.save();
}
