import { StandardFonts, rgb } from 'pdf-lib';
import {
  TemplateContext,
  drawTextWithBold,
  drawTextWithWordGap,
  formatDate,
  measureLineWidthWithWordGap,
  RESUME_TEMPLATES_11_15_WORD_GAP_PT,
  wrapText,
  parseEducationThreePartLine,
  drawEducationTwoRows,
  PDF_BULLET_DOT,
} from '../utils';

const WG = RESUME_TEMPLATES_11_15_WORD_GAP_PT;

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
  const bodyLineHeight = 14.9;
  const sectionHeaderSize = 9.95;
  const bodySize = 10.05;
  const nameSize = 23.6;
  const headlineSize = 10.95;
  const contactSize = 9.4;
  const metaSize = 9.45;

  const sections = splitSections(body);

  // Clean centered header (single-column style)

  let headerY = PAGE_HEIGHT - 48;
  if (name) {
    const up = name.toUpperCase();
    const nameWidth = measureLineWidthWithWordGap(up, fontBold, nameSize, WG);
    drawTextWithWordGap(page, up, (PAGE_WIDTH - nameWidth) / 2, headerY, nameSize, fontBold, INK, WG);
    headerY -= 20.5;
  }
  if (headline) {
    const headlineLines = wrapText(headline, font, headlineSize, CONTENT_WIDTH * 0.86, WG);
    for (const line of headlineLines) {
      const width = measureLineWidthWithWordGap(line, font, headlineSize, WG);
      drawTextWithWordGap(page, line, (PAGE_WIDTH - width) / 2, headerY, headlineSize, font, MUTED, WG);
      headerY -= 5.2;
    }
  }

  const contactLine = [location, phone, email].filter(Boolean).join('   •   ');
  let contentStartY = PAGE_HEIGHT - 146;
  if (contactLine) {
    const contactY = headerY - 12;
    const contactWidth = measureLineWidthWithWordGap(contactLine, font, contactSize, WG);
    drawTextWithWordGap(
      page,
      contactLine,
      (PAGE_WIDTH - contactWidth) / 2,
      contactY,
      contactSize,
      font,
      MUTED,
      WG
    );
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
    const labelWidth = measureLineWidthWithWordGap(label, fontBold, sectionHeaderSize, WG);
    const labelX = LEFT_X + (CONTENT_WIDTH - labelWidth) / 2;
    drawTextWithWordGap(context.page, label, labelX, y, sectionHeaderSize, fontBold, ACCENT, WG);
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
            metaSize,
            degreeColor: INK,
            mutedColor: MUTED,
            degree: edu.degree,
            institution: edu.institution,
            periodRaw: edu.period,
            degreeWrapSubtract: 12,
            wordGapExtra: WG,
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
          drawTextWithBold(context.page, titleText, LEFT_X + 4, y, font, fontBold, bodySize + 0.8, INK, WG);
          y -= bodyLineHeight;
          const meta = `${company} | ${formatDate(period.trim())}`;
          const metaLines = wrapText(meta, font, metaSize, CONTENT_WIDTH - 8, WG);
          for (const metaLine of metaLines) {
            ensurePage();
            drawTextWithWordGap(context.page, metaLine, LEFT_X + 4, y, metaSize, font, MUTED, WG);
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
      const wrapped = wrapText(plain, font, bodySize, CONTENT_WIDTH - 18, WG);
      for (let i = 0; i < wrapped.length; i++) {
        ensurePage();
        if (!noBulletSection && i === 0) {
          context.page.drawText(PDF_BULLET_DOT, { x: LEFT_X + 4, y, size: bodySize, font, color: ACCENT });
        }
        const textX = noBulletSection ? LEFT_X + 4 : LEFT_X + 15;
        drawTextWithWordGap(context.page, wrapped[i], textX, y, bodySize, font, INK, WG);
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
