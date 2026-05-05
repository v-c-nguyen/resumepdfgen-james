import { StandardFonts, rgb, PDFPage, PDFFont, RGB } from 'pdf-lib';
import {
  TemplateContext,
  drawTextWithBold,
  drawTextWithWordGap,
  formatDate,
  measureLineWidthWithWordGap,
  PDF_BULLET_DOT,
  RESUME_TEMPLATES_11_15_WORD_GAP_PT,
  wrapSkillsAfterCategory,
  wrapText,
  wrapTextWithIndent,
  parseEducationThreePartLine,
  drawEducationTwoRows,
} from '../utils';

const WG = RESUME_TEMPLATES_11_15_WORD_GAP_PT;

function parseExperienceLine(line: string): { title: string; company: string; period: string } | null {
  const match = line.match(/^(.+?) at (.+?):\s*(.+)$/);
  if (!match) return null;
  return {
    title: match[1].trim(),
    company: match[2].trim(),
    period: formatDate(match[3].trim()),
  };
}

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** Draw words with extra horizontal space distributed between word gaps so the line spans targetWidth (PDF-lib has no text-align: justify). */
function drawJustifiedWords(
  page: PDFPage,
  words: string[],
  font: PDFFont,
  size: number,
  x: number,
  y: number,
  targetWidth: number,
  color: RGB,
  baseWordGap: number = 0,
  maxExtraPerGap: number = 1.1
) {
  if (words.length === 0) return;
  if (words.length === 1) {
    page.drawText(words[0], { x, y, size, font, color });
    return;
  }
  const spaceW = font.widthOfTextAtSize(' ', size);
  const natural =
    words.reduce((acc, w) => acc + font.widthOfTextAtSize(w, size), 0) +
    (words.length - 1) * (spaceW + baseWordGap);
  const gaps = words.length - 1;
  const rawExtraPerGap = natural < targetWidth ? (targetWidth - natural) / gaps : 0;
  const extraPerGap = Math.min(rawExtraPerGap, maxExtraPerGap);
  let cx = x;
  for (let i = 0; i < words.length; i++) {
    page.drawText(words[i], { x: cx, y, size, font, color });
    cx += font.widthOfTextAtSize(words[i], size);
    if (i < words.length - 1) {
      cx += spaceW + extraPerGap + baseWordGap;
    }
  }
}

/** Template 12: serif, warm paper, left spine, run-in section rules — visually separate from template 11 (sans, top rule, uppercase bands). */
export async function renderTemplate12(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, PAGE_HEIGHT, PAGE_WIDTH, body, name, headline, email, phone, location } = context;

  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const PAGE_MARGIN = 46;
  const contentX = PAGE_MARGIN;
  const contentWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  const BOTTOM_MARGIN = 48;

  const PAPER = rgb(0.99, 0.978, 0.958);
  const INK = rgb(0.14, 0.12, 0.11);
  const MUTED = rgb(0.42, 0.38, 0.34);
  const SPINE_COLOR = rgb(0.14, 0.12, 0.11);
  const RULE = rgb(0.72, 0.66, 0.58);

  const paintPage = () => {
    context.page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PAPER });
  };

  paintPage();

  let y = PAGE_HEIGHT - PAGE_MARGIN - 8;

  const nameSize = 22.7;
  if (name) {
    const displayName = name.trim();
    const nameLines = wrapText(displayName, fontBold, nameSize, contentWidth, WG);
    for (const nLine of nameLines) {
      drawTextWithWordGap(context.page, nLine, contentX, y, nameSize, fontBold, INK, WG);
      y -= 24.6;
    }
  }

  const cleanedHeadline = headline
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\bwww\.\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (cleanedHeadline) {
    const headlineLines = wrapText(cleanedHeadline, font, 10.55, contentWidth, WG);
    for (const line of headlineLines) {
      drawTextWithWordGap(context.page, line, contentX, y, 10.55, font, MUTED, WG);
      y -= 12.65;
    }
  }

  const contacts = [location, phone, email].filter(Boolean);
  if (contacts.length > 0) {
    y -= 2;
    const contactLine = contacts.join('  ·  ');
    const contactLines = wrapText(contactLine, font, 9.35, contentWidth, WG);
    for (const line of contactLines) {
      drawTextWithWordGap(context.page, line, contentX, y, 9.35, font, MUTED, WG);
      y -= 11.45;
    }
  }

  y -= 8;
  context.page.drawLine({
    start: { x: contentX, y },
    end: { x: contentX + contentWidth, y },
    thickness: 0.9,
    color: RULE,
  });
  y -= 20;

  let currentSection = '';
  const lineHeight = 13.65;
  const bodySize = 10.15;
  /** Extra vertical gap before a new bullet/category row after another bullet/category in skills. */
  const SKILLS_BULLET_PARAGRAPH_GAP = 5;
  /** Experience bullets should be tighter than skills. */
  const EXPERIENCE_BULLET_PARAGRAPH_GAP = 2;
  /** Add breathing room above each new role title/company block in experience. */
  const EXPERIENCE_ROLE_TOP_GAP = 6;
  let pendingBulletParagraphGap = false;

  const sectionIsExperience = () =>
    currentSection === 'experience' || currentSection === 'professional experience';
  const sectionIsSkills = () => currentSection === 'technical skills' || currentSection === 'skills';

  const ensurePageSpace = () => {
    if (y >= BOTTOM_MARGIN) return;
    context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    paintPage();
    y = PAGE_HEIGHT - PAGE_MARGIN - 12;
  };

  const drawSectionHeader = (label: string) => {
    const text = label.trim();
    const upper = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    const prefix = `${upper}  `;
    const sectionHeaderSize = 11.36;
    const prefixW = fontBold.widthOfTextAtSize(prefix, sectionHeaderSize);
    ensurePageSpace();
    context.page.drawText(prefix, { x: contentX, y, size: sectionHeaderSize, font: fontBold, color: INK });
    const ruleY = y - 3.2;
    context.page.drawLine({
      start: { x: contentX + prefixW, y: ruleY },
      end: { x: contentX + contentWidth, y: ruleY },
      thickness: 0.65,
      color: RULE,
    });
    y -= 20;
  };

  const bodyLines = body.split('\n');
  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) {
      y -= 5;
      continue;
    }

    const isHeader =
      line.endsWith(':') ||
      /^(summary|education|experience|professional experience|technical skills|skills)$/i.test(line);

    if (isHeader) {
      const section = (line.endsWith(':') ? line.slice(0, -1) : line).trim();
      currentSection = section.toLowerCase();
      pendingBulletParagraphGap = false;
      y -= 11;
      drawSectionHeader(section);
      continue;
    }

    const exp = parseExperienceLine(line);
    if (exp) {
      pendingBulletParagraphGap = false;
      y -= EXPERIENCE_ROLE_TOP_GAP;
      ensurePageSpace();

      const titleLines = wrapText(exp.title, fontBold, 10.75, contentWidth, WG);
      for (const tLine of titleLines) {
        drawTextWithBold(context.page, tLine, contentX, y, font, fontBold, 10.75, INK, WG);
        y -= lineHeight;
        ensurePageSpace();
      }

      const minGap = 10;
      const periodW = font.widthOfTextAtSize(exp.period, bodySize);
      const companyLines = wrapText(exp.company.trim(), font, bodySize, contentWidth, WG);

      ensurePageSpace();
      if (companyLines.length === 0) {
        context.page.drawText(exp.period, {
          x: contentX + contentWidth - periodW,
          y,
          size: bodySize,
          font,
          color: MUTED,
        });
        y -= lineHeight;
      } else {
        for (let i = 0; i < companyLines.length; i++) {
          ensurePageSpace();
          const isLast = i === companyLines.length - 1;
          const lineText = companyLines[i];
          if (isLast) {
            const lineW = measureLineWidthWithWordGap(lineText, font, bodySize, WG);
            if (lineW + minGap + periodW <= contentWidth) {
              const words = splitWords(lineText);
              const justifyTarget = contentWidth - periodW - minGap;
              const shouldJustify = words.length >= 6;
              if (shouldJustify) {
                drawJustifiedWords(context.page, words, font, bodySize, contentX, y, justifyTarget, MUTED, WG);
              } else {
                drawTextWithWordGap(context.page, lineText, contentX, y, bodySize, font, MUTED, WG);
              }
              context.page.drawText(exp.period, {
                x: contentX + contentWidth - periodW,
                y,
                size: bodySize,
                font,
                color: MUTED,
              });
            } else {
              drawTextWithWordGap(context.page, lineText, contentX, y, bodySize, font, MUTED, WG);
              y -= lineHeight;
              ensurePageSpace();
              context.page.drawText(exp.period, {
                x: contentX + contentWidth - periodW,
                y,
                size: bodySize,
                font,
                color: MUTED,
              });
            }
          } else {
            drawTextWithWordGap(context.page, lineText, contentX, y, bodySize, font, MUTED, WG);
          }
          y -= lineHeight;
        }
      }
      y -= 4;
      continue;
    }

    if (currentSection === 'education') {
      const edu = parseEducationThreePartLine(line);
      if (edu) {
        pendingBulletParagraphGap = false;
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
          degreeSize: 10.45,
          metaSize: bodySize - 0.2,
          degreeColor: INK,
          mutedColor: MUTED,
          degree: edu.degree,
          institution: edu.institution,
          periodRaw: edu.period,
          degreeWrapSubtract: 10,
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
      if (sectionIsSkills() && pendingBulletParagraphGap) {
        y -= SKILLS_BULLET_PARAGRAPH_GAP;
      }
      const category = cleaned.substring(0, colonIndex + 1).trim();
      const skills = cleaned.substring(colonIndex + 1).trim();
      const bulletWidth = font.widthOfTextAtSize(PDF_BULLET_DOT + '  ', bodySize);
      const categoryWidth = fontBold.widthOfTextAtSize(category, bodySize);
      const wrappedSkills = wrapSkillsAfterCategory(
        skills,
        font,
        bodySize,
        {
          left: contentX,
          bodyInsetLeft: 0,
          contentWidth,
          bodyInnerSubtract: 10,
          bulletWidth,
          categoryWidth,
          spaceWidth: font.widthOfTextAtSize(' ', bodySize),
        },
        WG
      );

      ensurePageSpace();
      context.page.drawText(PDF_BULLET_DOT, { x: contentX, y, size: bodySize, font, color: SPINE_COLOR });
      context.page.drawText(category, { x: contentX + bulletWidth, y, size: bodySize, font: fontBold, color: INK });
      if (wrappedSkills[0]) {
        drawTextWithWordGap(
          context.page,
          wrappedSkills[0],
          contentX + bulletWidth + categoryWidth + font.widthOfTextAtSize(' ', bodySize),
          y,
          bodySize,
          font,
          INK,
          WG
        );
      }
      for (let i = 1; i < wrappedSkills.length; i++) {
        y -= lineHeight;
        ensurePageSpace();
        drawTextWithWordGap(context.page, wrappedSkills[i], contentX + bulletWidth, y, bodySize, font, INK, WG);
      }
      y -= 13;
      if (sectionIsSkills()) pendingBulletParagraphGap = true;
      continue;
    }

    const hasBullet = /^[\-\·•]\s/.test(line);
    if (hasBullet) {
      if ((sectionIsExperience() || sectionIsSkills()) && pendingBulletParagraphGap) {
        y -= sectionIsExperience() ? EXPERIENCE_BULLET_PARAGRAPH_GAP : SKILLS_BULLET_PARAGRAPH_GAP;
      }
      const wrapped = wrapTextWithIndent(line, font, bodySize, contentWidth - 12, WG);
      const dashX = contentX;
      const textX = contentX + font.widthOfTextAtSize(PDF_BULLET_DOT + '  ', bodySize);
      for (let i = 0; i < wrapped.lines.length; i++) {
        ensurePageSpace();
        const segment = wrapped.lines[i];
        if (i === 0) {
          const bulletMatch = segment.match(/^([\-\·•])\s*(.*)/);
          context.page.drawText(PDF_BULLET_DOT, { x: dashX, y, size: bodySize, font, color: SPINE_COLOR });
          if (bulletMatch) {
            drawTextWithBold(context.page, bulletMatch[2], textX, y, font, fontBold, bodySize, INK, WG);
          } else {
            drawTextWithBold(context.page, segment, textX, y, font, fontBold, bodySize, INK, WG);
          }
        } else {
          drawTextWithBold(context.page, segment, textX, y, font, fontBold, bodySize, INK, WG);
        }
        y -= lineHeight;
      }
      y -= 2;
      if (sectionIsExperience() || sectionIsSkills()) pendingBulletParagraphGap = true;
      continue;
    }

    if (sectionIsExperience() || sectionIsSkills()) pendingBulletParagraphGap = false;
    const wrapped = wrapText(line, font, bodySize, contentWidth, WG);
    for (const segment of wrapped) {
      ensurePageSpace();
      drawTextWithBold(context.page, segment, contentX, y, font, fontBold, bodySize, INK, WG);
      y -= lineHeight;
    }
  }

  return await pdfDoc.save();
}
