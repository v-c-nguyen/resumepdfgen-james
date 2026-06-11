import { StandardFonts, rgb } from 'pdf-lib';
import {
  TemplateContext,
  drawTextWithBold,
  drawTextWithWordGap,
  formatDate,
  RESUME_TEMPLATES_11_15_WORD_GAP_PT,
  wrapSkillsAfterCategory,
  wrapText,
  wrapTextWithIndent,
  PDF_BULLET_DOT,
  parseEducationThreePartLine,
  drawEducationTwoRows,
  baselineFitsAboveBottomMargin,
  RESUME_PAGE_BOTTOM_MARGIN,
} from '../utils';

const WG = RESUME_TEMPLATES_11_15_WORD_GAP_PT;

function parseExperienceLine(line: string): { title: string; company: string; period: string } | null {
  const match = line.match(/^(.+?) at (.+?):\s*(.+)$/);
  if (!match) return null;
  return { title: match[1].trim(), company: match[2].trim(), period: formatDate(match[3].trim()) };
}

function drawTopRule(context: TemplateContext, left: number, right: number, y: number) {
  context.page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 1.2,
    color: rgb(0.2, 0.24, 0.31),
  });
}

export async function renderTemplate11(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, PAGE_HEIGHT, PAGE_WIDTH, body, name, headline, email, phone, location } = context;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_MARGIN = 35;
  const BOTTOM_MARGIN = RESUME_PAGE_BOTTOM_MARGIN;
  const HEADER_HEIGHT = 90;
  const contentX = PAGE_MARGIN;
  const contentWidth = PAGE_WIDTH - PAGE_MARGIN * 2;

  const PAPER = rgb(1, 1, 1);
  const INK = rgb(0.12, 0.14, 0.18);
  const MUTED = rgb(0.36, 0.39, 0.45);
  const ACCENT = rgb(0.2, 0.24, 0.31);
  const SECTION_RULE = rgb(0.79, 0.82, 0.87);

  context.page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PAPER });
  const headerTopRuleY = PAGE_HEIGHT - PAGE_MARGIN + 4;
  const headerBottomRuleY = PAGE_HEIGHT - PAGE_MARGIN - HEADER_HEIGHT + 25;
  drawTopRule(context, contentX, contentX + contentWidth, headerTopRuleY);

  // Keep header content inside top/bottom rules with consistent inner padding.
  const headerTopPadding = 11;
  const headerBottomPadding = 10;
  let headerY = headerTopRuleY - headerTopPadding - 20;
  const nameSize = 25.1;
  if (name) {
    const nameLines = wrapText(name.toUpperCase(), fontBold, nameSize, contentWidth * 0.62, WG);
    for (const line of nameLines) {
      drawTextWithWordGap(context.page, line, contentX, headerY, nameSize, fontBold, INK, WG);
      headerY -= 22;
    }
  }

  const cleanedHeadline = headline
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\bwww\.\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (cleanedHeadline) {
    const headlineLines = wrapText(cleanedHeadline, font, 9.75, contentWidth * 0.64, WG);
    for (const line of headlineLines) {
      if (headerY <= headerBottomRuleY + headerBottomPadding + 1) break;
      drawTextWithWordGap(context.page, line, contentX, headerY, 9.75, font, MUTED, WG);
      headerY -= 11.4;
    }
  }

  const contacts = [location, phone, email].filter(Boolean);
  let contactY = headerTopRuleY - headerTopPadding - 8;
  if (contacts.length > 0) {
    const rightColWidth = contentWidth * 0.31;
    for (const part of contacts) {
      const lines = wrapText(part, font, 9.2, rightColWidth, WG);
      for (const line of lines) {
        if (contactY <= headerBottomRuleY + headerBottomPadding + 1) break;
        const lineWidth = font.widthOfTextAtSize(line, 9.2);
        drawTextWithWordGap(context.page, line, contentX + contentWidth - lineWidth, contactY, 9.2, font, MUTED, WG);
        contactY -= 10.8;
      }
      if (contactY <= headerBottomRuleY + headerBottomPadding + 1) break;
      contactY -= 2;
    }
  }

  drawTopRule(context, contentX, contentX + contentWidth, headerBottomRuleY);

  let y = headerBottomRuleY - 10;
  let currentSection = '';
  let hasRenderedExperience = false;
  const lineHeight = 14.4;
  const SKILLS_ROW_EXTRA_GAP = 1.2;

  const bodyLines = body.split('\n');
  const ensurePageSpace = (requiredHeight: number = lineHeight) => {
    if (baselineFitsAboveBottomMargin(y, BOTTOM_MARGIN, requiredHeight)) return;
    context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    context.page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PAPER });
    drawTopRule(context, contentX, contentX + contentWidth, PAGE_HEIGHT - PAGE_MARGIN + 4);
    y = PAGE_HEIGHT - HEADER_HEIGHT + 12;
  };

  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) {
      y -= 6;
      continue;
    }

    const isHeader =
      line.endsWith(':') ||
      /^(summary|education|experience|professional experience|technical skills|skills)$/i.test(line);

    if (isHeader) {
      const label = (line.endsWith(':') ? line.slice(0, -1) : line).trim();
      currentSection = label.toLowerCase();
      y -= currentSection === 'summary' ? 14 : 9;
      ensurePageSpace();

      drawTextWithWordGap(context.page, label.toUpperCase(), contentX, y, 10.35, fontBold, ACCENT, WG);
      y -= 4;
      context.page.drawLine({
        start: { x: contentX, y },
        end: { x: contentX + contentWidth, y },
        thickness: 0.8,
        color: SECTION_RULE,
      });
      y -= 12;
      continue;
    }

    const exp = parseExperienceLine(line);
    if (exp) {
      if (hasRenderedExperience) {
        y -= 7;
      }
      ensurePageSpace();
      const titleLines = wrapText(exp.title, fontBold, 10.65, contentWidth, WG);
      for (const tLine of titleLines) {
        drawTextWithBold(context.page, tLine, contentX, y, font, fontBold, 10.65, INK, WG);
        y -= lineHeight;
        ensurePageSpace();
      }

      const companyMetaSize = 9.55;
      const companyLines = wrapText(exp.company, font, companyMetaSize, contentWidth * 0.66, WG);
      const periodWidth = font.widthOfTextAtSize(exp.period, companyMetaSize);
      const periodX = contentX + contentWidth - periodWidth - 6;

      if (companyLines.length > 0) {
        drawTextWithWordGap(context.page, companyLines[0], contentX, y, companyMetaSize, font, MUTED, WG);
        drawTextWithWordGap(context.page, exp.period, periodX, y, companyMetaSize, font, MUTED, WG);
        y -= lineHeight;
      }
      for (let i = 1; i < companyLines.length; i++) {
        ensurePageSpace();
        drawTextWithWordGap(context.page, companyLines[i], contentX, y, companyMetaSize, font, MUTED, WG);
        y -= lineHeight;
      }
      y -= 4;
      hasRenderedExperience = true;
      continue;
    }

    if (currentSection === 'education') {
      const edu = parseEducationThreePartLine(line);
      if (edu) {
        y = drawEducationTwoRows({
          page: context.page,
          ensurePageSpace,
          textLeft: contentX,
          y,
          contentWidth,
          rightEdgeX: contentX + contentWidth,
          bodyLineHeight: lineHeight,
          font,
          fontBold,
          degreeSize: 10.35,
          metaSize: 9.3,
          degreeColor: INK,
          mutedColor: MUTED,
          degree: edu.degree,
          institution: edu.institution,
          periodRaw: edu.period,
          degreeWrapSubtract: 8,
          wordGapExtra: WG,
        });
        y -= 3;
        continue;
      }
    }

    const cleaned = line.replace(/^[\-\·•]\s*/, '').trim();
    const colonIndex = cleaned.indexOf(':');
    const isSkillsSection = currentSection === 'technical skills' || currentSection === 'skills';
    const isCategory =
      colonIndex !== -1 &&
      (isSkillsSection || line.startsWith('·') || line.startsWith('•') || line.startsWith('-')) &&
      colonIndex < 44;

    if (isCategory) {
      const category = cleaned.substring(0, colonIndex + 1).trim();
      const skills = cleaned.substring(colonIndex + 1).trim();
      const skillBody = 9.65;
      const bulletWidth = font.widthOfTextAtSize(PDF_BULLET_DOT + '  ', skillBody);
      const categoryWidth = fontBold.widthOfTextAtSize(category, skillBody);
      const wrappedSkills = wrapSkillsAfterCategory(
        skills,
        font,
        skillBody,
        {
          left: contentX,
          bodyInsetLeft: 0,
          contentWidth,
          bodyInnerSubtract: 8,
          bulletWidth,
          categoryWidth,
          spaceWidth: font.widthOfTextAtSize(' ', skillBody),
        },
        WG
      );

      ensurePageSpace();
      context.page.drawText(PDF_BULLET_DOT, { x: contentX, y, size: skillBody, font, color: ACCENT });
      context.page.drawText(category, { x: contentX + bulletWidth, y, size: skillBody, font: fontBold, color: INK });
      if (wrappedSkills[0]) {
        drawTextWithWordGap(
          context.page,
          wrappedSkills[0],
          contentX + bulletWidth + categoryWidth + font.widthOfTextAtSize(' ', skillBody),
          y,
          skillBody,
          font,
          INK,
          WG
        );
      }
      y -= SKILLS_ROW_EXTRA_GAP;
      for (let i = 1; i < wrappedSkills.length; i++) {
        y -= lineHeight + SKILLS_ROW_EXTRA_GAP;
        ensurePageSpace();
        drawTextWithWordGap(context.page, wrappedSkills[i], contentX + bulletWidth, y, skillBody, font, INK, WG);
      }
      y -= 15;
      continue;
    }

    const hasBullet = /^[\-\·•]\s/.test(line);
    if (hasBullet) {
      const inSkillsSection = currentSection === 'technical skills' || currentSection === 'skills';
      const wrapped = wrapTextWithIndent(line, font, 9.8, contentWidth - 8, WG);
      for (let i = 0; i < wrapped.lines.length; i++) {
        ensurePageSpace();
        const segment = wrapped.lines[i];
        if (i === 0) {
          const bulletMatch = segment.match(/^([\-\·•])\s*(.*)/);
          if (bulletMatch) {
            context.page.drawText(PDF_BULLET_DOT, { x: contentX, y, size: 9.55, font, color: ACCENT });
            drawTextWithBold(
              context.page,
              bulletMatch[2],
              contentX + 8,
              y,
              font,
              fontBold,
              9.8,
              INK,
              WG
            );
          } else {
            drawTextWithBold(context.page, segment, contentX, y, font, fontBold, 9.8, INK, WG);
          }
        } else {
          drawTextWithBold(context.page, segment, contentX + 8, y, font, fontBold, 9.8, INK, WG);
        }
        y -= lineHeight + (inSkillsSection ? SKILLS_ROW_EXTRA_GAP : 0);
      }
      y -= inSkillsSection ? 2 : 1;
      continue;
    }

    const wrapped = wrapText(line, font, 9.8, contentWidth, WG);
    for (const segment of wrapped) {
      ensurePageSpace();
      drawTextWithBold(context.page, segment, contentX, y, font, fontBold, 9.8, INK, WG);
      y -= lineHeight;
    }
  }

  return await pdfDoc.save();
}
