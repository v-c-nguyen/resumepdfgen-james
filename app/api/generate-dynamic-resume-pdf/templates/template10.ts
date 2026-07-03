import { StandardFonts, rgb } from 'pdf-lib';
import {
  TemplateContext,
  wrapText,
  wrapTextWithIndent,
  formatDate,
  drawTextWithBold,
  drawTextWithWordGap,
  measureLineWidthWithWordGap,
  PDF_BULLET_DOT,
  RESUME_TEMPLATES_11_15_WORD_GAP_PT,
  wrapSkillsAfterCategory,
  parseEducationThreePartLine,
  drawEducationTwoRows,
  parseRoleFocusLine,
  drawRoleFocusBlock,
  baselineFitsAboveBottomMargin,
  RESUME_PAGE_BOTTOM_MARGIN,
} from '../utils';

const WG = RESUME_TEMPLATES_11_15_WORD_GAP_PT + 0.15;

// Template 10 Body Content Renderer - cohesive gentle executive style
function renderBodyContentTemplate10(
  context: TemplateContext,
  serifFont: TemplateContext['font'],
  serifBoldFont: TemplateContext['fontBold'],
  y: number,
  left: number,
  contentWidth: number,
  bodySize: number,
  bodyLineHeight: number,
  sectionHeaderSize: number,
  sectionLineHeight: number,
  marginBottom: number,
  pageTopOffset: number
): number {
  const { body, PAGE_HEIGHT, PAGE_WIDTH, pdfDoc } = context;
  const TEXT_DARK = rgb(0.12, 0.14, 0.17);
  const MUTED_TEXT = rgb(0.36, 0.39, 0.44);
  const ACCENT = rgb(0.22, 0.26, 0.33);
  const SECTION_TINT = rgb(0.965, 0.97, 0.978);
  const LINE_SOFT = rgb(0.84, 0.86, 0.9);

  const bodyLines = body.split('\n');
  let firstJob = true;
  let currentSection = '';
  const rightEdgeX = left + contentWidth;
  const bulletMarkSize = bodySize + 0.65;

  const drawSplitLeftRightLine = (
    leftText: string,
    rightText: string,
    leftFontSize: number,
    rightFontSize: number,
    leftColor = TEXT_DARK,
    rightColor = MUTED_TEXT
  ) => {
    const safeRight = rightText.trim();
    const rightWidth = serifFont.widthOfTextAtSize(safeRight, rightFontSize);
    const rightX = rightEdgeX - rightWidth;
    const gap = 14;
    const availableLeftWidth = Math.max(120, rightX - left - gap);
    const leftLines = wrapText(leftText.trim(), serifFont, leftFontSize, availableLeftWidth, WG);

    for (let k = 0; k < leftLines.length; k++) {
      ensurePageSpace();
      drawTextWithWordGap(context.page, leftLines[k], left + 2, y, leftFontSize, serifFont, leftColor, WG);
      if (k === 0 && safeRight) {
        context.page.drawText(safeRight, {
          x: rightX,
          y,
          size: rightFontSize,
          font: serifFont,
          color: rightColor,
        });
      }
      y -= bodyLineHeight;
    }
  };

  const ensurePageSpace = (requiredHeight: number = bodyLineHeight) => {
    if (baselineFitsAboveBottomMargin(y, marginBottom, requiredHeight)) return;
    context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - pageTopOffset - 8;
  };

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) {
      y -= 6;
      continue;
    }

    const isSectionHeader =
      line.endsWith(':') ||
      /^(summary|education|experience|technical skills|skills|professional experience)$/i.test(line.trim());

    if (isSectionHeader) {
      y -= 16;
      const sectionHeader = line.endsWith(':') ? line.slice(0, -1).trim() : line.trim();
      currentSection = sectionHeader.toLowerCase();
      const sectionLabel = sectionHeader.toUpperCase();
      const sectionLines = wrapText(sectionLabel, serifBoldFont, sectionHeaderSize, contentWidth - 42, WG);

      ensurePageSpace();
      context.page.drawRectangle({
        x: left,
        y: y - sectionLineHeight + 4,
        width: contentWidth,
        height: sectionLineHeight + 9,
        color: SECTION_TINT,
      });
      context.page.drawRectangle({
        x: left,
        y: y - sectionLineHeight + 4,
        width: 3,
        height: sectionLineHeight + 9,
        color: ACCENT,
      });
      context.page.drawLine({
        start: { x: left, y: y - sectionLineHeight + 4 },
        end: { x: left + contentWidth, y: y - sectionLineHeight + 4 },
        thickness: 0.65,
        color: LINE_SOFT,
      });

      for (const sectionLine of sectionLines) {
        ensurePageSpace();
        drawTextWithWordGap(
          context.page,
          sectionLine,
          left + 9,
          y - 1,
          sectionHeaderSize,
          serifBoldFont,
          ACCENT,
          WG
        );
        y -= sectionLineHeight;
      }
      y -= 8;
      continue;
    }

    const isJobExperience = / at .+:.+/.test(line);
    if (isJobExperience) {
      const match = line.match(/^(.+?) at (.+?):\s*(.+)$/);
      if (match) {
        const [, jobTitle, companyPart, period] = match;

        let companyName = companyPart.trim();
        let companyLocation = '';
        const lastCommaIndex = companyPart.indexOf(',');
        if (lastCommaIndex !== -1) {
          companyName = companyPart.substring(0, lastCommaIndex).trim();
          companyLocation = companyPart.substring(lastCommaIndex + 1).trim();
        }

        if (!firstJob) y -= 14;
        firstJob = false;

        const titleLines = wrapText(jobTitle.trim(), serifBoldFont, bodySize + 1.1, contentWidth - 15, WG);
        for (const titleLine of titleLines) {
          ensurePageSpace();
          drawTextWithBold(
            context.page,
            titleLine,
            left + 2,
            y,
            serifFont,
            serifBoldFont,
            bodySize + 1.1,
            TEXT_DARK,
            WG
          );
          y -= bodyLineHeight + 1;
        }

        const formattedPeriod = formatDate(period.trim());
        const companyInfo = companyLocation ? `${companyName} • ${companyLocation}` : companyName;
        drawSplitLeftRightLine(companyInfo, formattedPeriod, bodySize - 0.2, bodySize - 0.2, MUTED_TEXT, MUTED_TEXT);
        y -= 6;
        continue;
      }
    }

    const isExperienceSection =
      currentSection === 'experience' || currentSection === 'professional experience';
    if (isExperienceSection) {
      const roleFocusText = parseRoleFocusLine(line);
      if (roleFocusText !== null) {
        y -= 2;
        y = drawRoleFocusBlock({
          page: context.page,
          ensurePageSpace,
          textLeft: left,
          y,
          contentWidth,
          bodyLineHeight,
          font: serifFont,
          fontBold: serifBoldFont,
          labelSize: bodySize,
          textSize: bodySize - 0.2,
          labelColor: ACCENT,
          textColor: MUTED_TEXT,
          focusText: roleFocusText,
          bodyInsetLeft: 2,
          bodyInnerSubtract: 15,
          wordGapExtra: WG,
        });
        y -= 5;
        continue;
      }
    }

    if (currentSection === 'education') {
      const edu = parseEducationThreePartLine(line);
      if (edu) {
        y = drawEducationTwoRows({
          page: context.page,
          ensurePageSpace,
          textLeft: left + 2,
          y,
          contentWidth,
          rightEdgeX,
          bodyLineHeight,
          font: serifFont,
          fontBold: serifBoldFont,
          degreeSize: bodySize + 0.8,
          metaSize: bodySize - 0.2,
          degreeColor: TEXT_DARK,
          mutedColor: MUTED_TEXT,
          degree: edu.degree,
          institution: edu.institution,
          periodRaw: edu.period,
          degreeWrapSubtract: 10,
          wordGapExtra: WG,
        });
        y -= 6;
        continue;
      }
    }

    const isSummaryOrEducation = currentSection === 'summary' || currentSection === 'education';
    if (isSummaryOrEducation) {
      const lineWithoutBullet = line.replace(/^[\-\·•]\s*/, '').trim();
      const wrapped = wrapText(lineWithoutBullet, serifFont, bodySize, contentWidth - 15, WG);
      for (const lineText of wrapped) {
        ensurePageSpace();
        drawTextWithBold(context.page, lineText, left + 2, y, serifFont, serifBoldFont, bodySize, TEXT_DARK, WG);
        y -= bodyLineHeight;
      }
      continue;
    }

    const lineWithoutBullet = line.trim().replace(/^[·•]\s*/, '');
    const colonIndex = lineWithoutBullet.indexOf(':');
    const isTechnicalSkillsSection = currentSection === 'technical skills' || currentSection === 'skills';
    const isSkillsCategory =
      ((line.startsWith('·') || line.startsWith('•')) &&
        colonIndex !== -1 &&
        colonIndex < 30 &&
        !lineWithoutBullet.substring(0, colonIndex).includes(' at ')) ||
      (isTechnicalSkillsSection && colonIndex !== -1 && colonIndex < 50);

    if (isSkillsCategory && colonIndex !== -1) {
      const bulletWidth = serifFont.widthOfTextAtSize(PDF_BULLET_DOT + '   ', bulletMarkSize);
      const categoryName = lineWithoutBullet.substring(0, colonIndex + 1).trim();
      const skillsText = lineWithoutBullet.substring(colonIndex + 1).trim();
      const categoryWidth = serifBoldFont.widthOfTextAtSize(categoryName, bodySize);
      const spaceWidth = serifFont.widthOfTextAtSize(' ', bodySize);
      const wrappedSkills = wrapSkillsAfterCategory(
        skillsText,
        serifFont,
        bodySize,
        {
          left,
          bodyInsetLeft: 2,
          contentWidth,
          bodyInnerSubtract: 15,
          bulletWidth,
          categoryWidth,
          spaceWidth,
        },
        WG
      );

      ensurePageSpace();
      let currentX = left + 2;
      context.page.drawText(PDF_BULLET_DOT, {
        x: currentX,
        y,
        size: bulletMarkSize,
        font: serifFont,
        color: TEXT_DARK,
      });
      currentX += bulletWidth;
      context.page.drawText(categoryName, { x: currentX, y, size: bodySize, font: serifBoldFont, color: ACCENT });

      if (wrappedSkills.length > 0 && wrappedSkills[0]) {
        currentX += categoryWidth + spaceWidth;
        drawTextWithWordGap(context.page, wrappedSkills[0], currentX, y, bodySize, serifFont, TEXT_DARK, WG);

        for (let j = 1; j < wrappedSkills.length; j++) {
          y -= bodyLineHeight;
          ensurePageSpace();
          drawTextWithWordGap(
            context.page,
            wrappedSkills[j],
            left + 2 + bulletWidth,
            y,
            bodySize,
            serifFont,
            TEXT_DARK,
            WG
          );
        }
      }
      y -= bodyLineHeight + 4;
      continue;
    }

    const hasBullet = /^[\-\·•]\s/.test(line);
    const bulletWidth = serifFont.widthOfTextAtSize(PDF_BULLET_DOT + '   ', bulletMarkSize);
    const textToWrap = hasBullet ? line : `${PDF_BULLET_DOT}   ${line}`;
    const wrapped = wrapTextWithIndent(textToWrap, serifFont, bodySize, contentWidth - 15, WG);
    let contentStartX = left + 2 + bulletWidth;

    for (let j = 0; j < wrapped.lines.length; j++) {
      ensurePageSpace();
      const lineText = wrapped.lines[j];

      if (j === 0 && (lineText.startsWith('•') || lineText.startsWith('·') || lineText.startsWith('-'))) {
        const bulletMatch = lineText.match(/^([\-\·•])\s*(.*)/);
        if (bulletMatch) {
          const [, , content] = bulletMatch;
          const bulletX = left + 2;
          context.page.drawText(PDF_BULLET_DOT, {
            x: bulletX,
            y,
            size: bulletMarkSize,
            font: serifFont,
            color: ACCENT,
          });
          contentStartX = bulletX + serifFont.widthOfTextAtSize(PDF_BULLET_DOT + '   ', bulletMarkSize);
          drawTextWithBold(context.page, content, contentStartX, y, serifFont, serifBoldFont, bodySize, TEXT_DARK, WG);
        } else {
          drawTextWithBold(context.page, lineText, left + 2, y, serifFont, serifBoldFont, bodySize, TEXT_DARK, WG);
        }
      } else {
        drawTextWithBold(context.page, lineText, contentStartX, y, serifFont, serifBoldFont, bodySize, TEXT_DARK, WG);
      }

      y -= bodyLineHeight;
    }
    y -= 4;
  }

  return y;
}

// EXECUTIVE CLASSIC DESIGN - clean light headbar with structured hierarchy
export async function renderTemplate10(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, headline, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const INK = rgb(0.12, 0.14, 0.17);
  const SOFT_INK = rgb(0.35, 0.38, 0.43);
  const ACCENT = rgb(0.18, 0.23, 0.32);
  const HEADER_BG = rgb(0.975, 0.978, 0.985);
  const DIVIDER = rgb(0.84, 0.86, 0.9);
  const HEADER_HEIGHT = 102;
  const MARGIN_BOTTOM = RESUME_PAGE_BOTTOM_MARGIN;
  const MARGIN_LEFT = 34;
  const MARGIN_RIGHT = 34;
  const CONTENT_LEFT = MARGIN_LEFT;
  const CONTENT_WIDTH = PAGE_WIDTH - CONTENT_LEFT - MARGIN_RIGHT;

  const NAME_SIZE = 27.2;
  const HEADLINE_SIZE = 12.0;
  const CONTACT_SIZE = 9.8;
  const SECTION_HEADER_SIZE = 10.9;
  const BODY_SIZE = 10.4;
  const serifFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const serifBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const headlineWithoutLinks = headline
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\bwww\.\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Light executive headbar with restrained accents
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_HEIGHT,
    width: PAGE_WIDTH,
    height: HEADER_HEIGHT,
    color: HEADER_BG,
  });
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 4,
    width: PAGE_WIDTH,
    height: 4,
    color: ACCENT,
  });
  page.drawLine({
    start: { x: CONTENT_LEFT, y: PAGE_HEIGHT - HEADER_HEIGHT + 10 },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: PAGE_HEIGHT - HEADER_HEIGHT + 10 },
    thickness: 0.85,
    color: DIVIDER,
  });
  page.drawRectangle({
    x: CONTENT_LEFT - 12,
    y: PAGE_HEIGHT - HEADER_HEIGHT + 20,
    width: 3.5,
    height: HEADER_HEIGHT - 32,
    color: ACCENT,
  });

  if (name) {
    const nameLines = wrapText(name.toUpperCase(), serifBoldFont, NAME_SIZE, CONTENT_WIDTH * 0.62, WG);
    let nameY = PAGE_HEIGHT - 43;
    for (const line of nameLines) {
      drawTextWithWordGap(page, line, CONTENT_LEFT, nameY, NAME_SIZE, serifBoldFont, INK, WG);
      nameY -= NAME_SIZE * 1.06;
    }

    if (headlineWithoutLinks) {
      const headlineLines = wrapText(headlineWithoutLinks, serifFont, HEADLINE_SIZE, CONTENT_WIDTH * 0.58, WG);
      for (const line of headlineLines) {
        drawTextWithWordGap(page, line, CONTENT_LEFT, nameY, HEADLINE_SIZE, serifFont, SOFT_INK, WG);
        nameY -= HEADLINE_SIZE * 1.38;
      }
    }
  }

  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('   |   ');
    const contactWidth = measureLineWidthWithWordGap(contactLine, serifFont, CONTACT_SIZE, WG);
    const contactX = PAGE_WIDTH - MARGIN_RIGHT - contactWidth;
    drawTextWithWordGap(page, contactLine, contactX, PAGE_HEIGHT - 48, CONTACT_SIZE, serifFont, SOFT_INK, WG);
  }

  let y = PAGE_HEIGHT - HEADER_HEIGHT - 22;
  y = renderBodyContentTemplate10(
    context,
    serifFont,
    serifBoldFont,
    y,
    CONTENT_LEFT,
    CONTENT_WIDTH,
    BODY_SIZE,
    BODY_SIZE * 1.46,
    SECTION_HEADER_SIZE,
    SECTION_HEADER_SIZE * 1.26,
    MARGIN_BOTTOM,
    80
  );

  return await pdfDoc.save();
}
