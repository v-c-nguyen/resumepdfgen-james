import { StandardFonts, rgb } from 'pdf-lib';
import {
  TemplateContext,
  wrapText,
  wrapTextWithIndent,
  formatDate,
  drawTextWithBold,
  PDF_BULLET,
  wrapSkillsAfterCategory,
  parseEducationThreePartLine,
  drawEducationTwoRows,
} from '../utils';

type VariantKind = 'slate' | 'midnight' | 'emerald' | 'mono' | 'sunset';

export interface VariantConfig {
  kind: VariantKind;
  nameSize: number;
  headlineSize: number;
  contactSize: number;
  sectionHeaderSize: number;
  bodySize: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  headerHeight: number;
  /** When `kind` is `emerald` (template 13): black palette, no left accent bar on section headers. */
  emeraldPlainStyle?: boolean;
}

function drawHeader(context: TemplateContext, config: VariantConfig, serifFont: TemplateContext['font'], serifBoldFont: TemplateContext['fontBold']) {
  const { page, PAGE_WIDTH, PAGE_HEIGHT, name, headline, email, phone, location } = context;
  const contentWidth = PAGE_WIDTH - config.marginLeft - config.marginRight;
  const headerBottomY = PAGE_HEIGHT - config.headerHeight;
  
  const contactParts = [location, phone, email].filter(Boolean);
  const headlineWithoutLinks = headline
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\bwww\.\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (config.kind === 'slate') {
    const bg = rgb(0.91, 0.92, 0.945);
    const accent = rgb(0.22, 0.28, 0.38);
    const ink = rgb(0.1, 0.12, 0.15);
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - config.headerHeight, width: PAGE_WIDTH, height: config.headerHeight, color: bg });
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 4, width: PAGE_WIDTH, height: 4, color: accent });
    page.drawRectangle({ x: config.marginLeft - 10, y: PAGE_HEIGHT - config.headerHeight + 16, width: 3, height: config.headerHeight - 28, color: accent });
    if (name) page.drawText(name.toUpperCase(), { x: config.marginLeft, y: PAGE_HEIGHT - 44, size: config.nameSize, font: serifBoldFont, color: ink });
    if (headlineWithoutLinks) page.drawText(headlineWithoutLinks, { x: config.marginLeft, y: PAGE_HEIGHT - 62, size: config.headlineSize, font: serifFont, color: rgb(0.32, 0.36, 0.43) });
    if (contactParts.length) {
      const text = contactParts.join('  |  ');
      const w = serifFont.widthOfTextAtSize(text, config.contactSize);
      page.drawText(text, { x: PAGE_WIDTH - config.marginRight - w, y: PAGE_HEIGHT - 48, size: config.contactSize, font: serifFont, color: rgb(0.32, 0.36, 0.43) });
    }
    return;
  }

  if (config.kind === 'midnight') {
    const dark = rgb(0.1, 0.12, 0.175);
    const glow = rgb(0.67, 0.76, 1);
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - config.headerHeight, width: PAGE_WIDTH, height: config.headerHeight, color: dark });
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - config.headerHeight, width: PAGE_WIDTH, height: 3, color: glow });
    if (name) page.drawText(name, { x: config.marginLeft, y: PAGE_HEIGHT - 46, size: config.nameSize, font: serifBoldFont, color: rgb(1, 1, 1) });
    if (headlineWithoutLinks) page.drawText(headlineWithoutLinks, { x: config.marginLeft, y: PAGE_HEIGHT - 66, size: config.headlineSize, font: serifFont, color: rgb(0.85, 0.88, 0.95) });
    if (contactParts.length) {
      let y = PAGE_HEIGHT - 40;
      for (const part of contactParts) {
        const w = serifFont.widthOfTextAtSize(part, config.contactSize);
        page.drawText(part, { x: PAGE_WIDTH - config.marginRight - w, y, size: config.contactSize, font: serifFont, color: rgb(0.86, 0.9, 1) });
        y -= config.contactSize * 1.5;
      }
    }
    return;
  }

  if (config.kind === 'emerald') {
    const plain = Boolean(config.emeraldPlainStyle);
    const accent = plain ? rgb(0, 0, 0) : rgb(0.11, 0.46, 0.34);
    const soft = plain ? rgb(0.93, 0.93, 0.93) : rgb(0.88, 0.94, 0.91);
    const nameColor = plain ? rgb(0, 0, 0) : rgb(0.08, 0.2, 0.16);
    const subColor = plain ? rgb(0.32, 0.32, 0.32) : rgb(0.2, 0.39, 0.31);
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - config.headerHeight, width: PAGE_WIDTH, height: config.headerHeight, color: soft });
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, color: accent });
    const centerX = PAGE_WIDTH / 2;
    if (name) {
      const nW = serifBoldFont.widthOfTextAtSize(name.toUpperCase(), config.nameSize);
      page.drawText(name.toUpperCase(), { x: centerX - nW / 2, y: PAGE_HEIGHT - 44, size: config.nameSize, font: serifBoldFont, color: nameColor });
    }
    if (headlineWithoutLinks) {
      const hW = serifFont.widthOfTextAtSize(headlineWithoutLinks, config.headlineSize);
      page.drawText(headlineWithoutLinks, { x: centerX - hW / 2, y: PAGE_HEIGHT - 63, size: config.headlineSize, font: serifFont, color: subColor });
    }
    if (contactParts.length) {
      const text = contactParts.join(plain ? '  |  ' : '   •   ');
      const w = serifFont.widthOfTextAtSize(text, config.contactSize);
      page.drawText(text, { x: centerX - w / 2, y: PAGE_HEIGHT - 79, size: config.contactSize, font: serifFont, color: subColor });
    }
    return;
  }

  if (config.kind === 'mono') {
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - config.headerHeight, width: PAGE_WIDTH, height: config.headerHeight, color: rgb(0.96, 0.96, 0.96) });
    page.drawLine({ start: { x: config.marginLeft, y: PAGE_HEIGHT - config.headerHeight + 15 }, end: { x: PAGE_WIDTH - config.marginRight, y: PAGE_HEIGHT - config.headerHeight + 15 }, thickness: 1.2, color: rgb(0.15, 0.15, 0.15) });
    const nameY = PAGE_HEIGHT - 45;
    const defaultHeadlineY = PAGE_HEIGHT - 63;
    const subColor = rgb(0.2, 0.2, 0.2);
    const gapNameToContact = 14;
    let headlineY = defaultHeadlineY;

    if (name) {
      page.drawText(name.toUpperCase(), { x: config.marginLeft, y: nameY, size: config.nameSize, font: serifBoldFont, color: rgb(0, 0, 0) });
    }

    if (contactParts.length) {
      const text = contactParts.join(' | ');
      const contactW = serifFont.widthOfTextAtSize(text, config.contactSize);
      const nameW = name ? serifBoldFont.widthOfTextAtSize(name.toUpperCase(), config.nameSize) : 0;
      const contactFitsBesideName =
        !name || config.marginLeft + nameW + gapNameToContact + contactW <= PAGE_WIDTH - config.marginRight;

      if (contactFitsBesideName) {
        page.drawText(text, { x: PAGE_WIDTH - config.marginRight - contactW, y: nameY, size: config.contactSize, font: serifFont, color: subColor });
      } else {
        const contactLineHeight = config.contactSize * 1.32;
        const lines = wrapText(text, serifFont, config.contactSize, contentWidth);
        let y = nameY - Math.max(22, config.nameSize * 0.72);
        for (const line of lines) {
          page.drawText(line, { x: config.marginLeft, y, size: config.contactSize, font: serifFont, color: subColor });
          y -= contactLineHeight;
        }
        headlineY = y - 9;
      }
    }

    if (headlineWithoutLinks) {
      page.drawText(headlineWithoutLinks, { x: config.marginLeft, y: headlineY, size: config.headlineSize, font: serifFont, color: subColor });
    }
    return;
  }

  const top = rgb(0.93, 0.935, 0.945);
  const accent = rgb(0.25, 0.32, 0.42);
  const primaryText = rgb(0.12, 0.15, 0.2);
  const secondaryText = rgb(0.3, 0.35, 0.44);
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - config.headerHeight, width: PAGE_WIDTH, height: config.headerHeight, color: top });
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 4, width: PAGE_WIDTH, height: 4, color: accent });
  page.drawLine({
    start: { x: config.marginLeft, y: PAGE_HEIGHT - config.headerHeight + 14 },
    end: { x: PAGE_WIDTH - config.marginRight, y: PAGE_HEIGHT - config.headerHeight + 14 },
    thickness: 0.8,
    color: rgb(0.82, 0.85, 0.9),
  });
  if (name) page.drawText(name, { x: config.marginLeft, y: PAGE_HEIGHT - 46, size: config.nameSize, font: serifBoldFont, color: primaryText });
  if (headlineWithoutLinks) page.drawText(headlineWithoutLinks, { x: config.marginLeft, y: PAGE_HEIGHT - 66, size: config.headlineSize, font: serifFont, color: secondaryText });
  if (contactParts.length) {
    let y = PAGE_HEIGHT - 45;
    for (const part of contactParts) {
      const w = serifFont.widthOfTextAtSize(part, config.contactSize);
      page.drawText(part, { x: PAGE_WIDTH - config.marginRight - w, y, size: config.contactSize, font: serifFont, color: secondaryText });
      y -= config.contactSize * 1.5;
    }
  }
  void contentWidth;
}

function renderBody(context: TemplateContext, config: VariantConfig, serifFont: TemplateContext['font'], serifBoldFont: TemplateContext['fontBold'], y: number) {
  const { body, PAGE_HEIGHT, PAGE_WIDTH, pdfDoc } = context;
  const left = config.marginLeft;
  const contentWidth = PAGE_WIDTH - config.marginLeft - config.marginRight;
  const bodyLineHeight = config.bodySize * 1.45;
  const sectionLineHeight = config.sectionHeaderSize * 1.26;
  /** Slightly larger than body text so list markers read more clearly. */
  const bulletMarkSize = config.bodySize + 0.65;
  const rightEdgeX = left + contentWidth;
  const bodyLines = body.split('\n');
  let firstJob = true;
  let currentSection = '';
  const textDark = config.kind === 'midnight' ? rgb(0.16, 0.18, 0.24) : rgb(0.13, 0.15, 0.18);
  const emeraldPlain = config.kind === 'emerald' && Boolean(config.emeraldPlainStyle);
  const mutedText = config.kind === 'emerald' ? (emeraldPlain ? rgb(0.34, 0.34, 0.34) : rgb(0.25, 0.4, 0.33)) : rgb(0.35, 0.38, 0.43);
  const accent =
    config.kind === 'mono'
      ? rgb(0.15, 0.15, 0.15)
      : config.kind === 'sunset'
        ? rgb(0.25, 0.32, 0.42)
        : config.kind === 'emerald'
          ? emeraldPlain
            ? rgb(0, 0, 0)
            : rgb(0.11, 0.46, 0.34)
          : rgb(0.22, 0.27, 0.36);

  const ensurePageSpace = () => {
    if (y >= config.marginBottom) return;
    context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - 74;
  };

  const drawSplit = (leftText: string, rightText: string) => {
    const rightWidth = serifFont.widthOfTextAtSize(rightText, config.bodySize - 0.2);
    const rightX = rightEdgeX - rightWidth;
    const leftLines = wrapText(leftText, serifFont, config.bodySize - 0.2, Math.max(100, rightX - left - 12));
    for (let i = 0; i < leftLines.length; i++) {
      ensurePageSpace();
      context.page.drawText(leftLines[i], { x: left + 2, y, size: config.bodySize - 0.2, font: serifFont, color: mutedText });
      if (i === 0 && rightText) context.page.drawText(rightText, { x: rightX, y, size: config.bodySize - 0.2, font: serifFont, color: mutedText });
      y -= bodyLineHeight;
    }
  };

  for (const rawLine of bodyLines) {
    const line = rawLine.trim();
    if (!line) {
      y -= 6;
      continue;
    }
    const isSectionHeader = line.endsWith(':') || /^(summary|education|experience|technical skills|skills|professional experience)$/i.test(line);
    if (isSectionHeader) {
      y -= 14;
      const sectionHeader = line.endsWith(':') ? line.slice(0, -1).trim() : line.trim();
      currentSection = sectionHeader.toLowerCase();
      ensurePageSpace();
      context.page.drawRectangle({
        x: left,
        y: y - sectionLineHeight + 4,
        width: contentWidth,
        height: sectionLineHeight + 8,
        color: rgb(0.9, 0.905, 0.915),
      });
      if (!emeraldPlain) {
        context.page.drawRectangle({ x: left, y: y - sectionLineHeight + 4, width: 3, height: sectionLineHeight + 8, color: accent });
      }
      const sectionLabelX = emeraldPlain ? left + 6 : left + 9;
      context.page.drawText(sectionHeader.toUpperCase(), {
        x: sectionLabelX,
        y: y - 1,
        size: config.sectionHeaderSize,
        font: serifBoldFont,
        color: accent,
      });
      y -= sectionLineHeight + 8;
      continue;
    }

    const isJobExperience = / at .+:.+/.test(line);
    if (isJobExperience) {
      const match = line.match(/^(.+?) at (.+?):\s*(.+)$/);
      if (match) {
        const [, jobTitle, companyPart, period] = match;
        if (!firstJob) y -= 12;
        firstJob = false;
        const titleLines = wrapText(jobTitle.trim(), serifBoldFont, config.bodySize + 0.9, contentWidth - 12);
        for (const titleLine of titleLines) {
          ensurePageSpace();
          drawTextWithBold(context.page, titleLine, left + 2, y, serifFont, serifBoldFont, config.bodySize + 0.9, textDark);
          y -= bodyLineHeight;
        }
        const formattedPeriod = formatDate(period.trim());
        const companyBits = companyPart.split(',');
        const companyName = companyBits[0]?.trim() || '';
        const companyLocation = companyBits.slice(1).join(',').trim();
        const companyInfo = companyLocation ? `${companyName} • ${companyLocation}` : companyName;
        drawSplit(companyInfo, formattedPeriod);
        y -= 4;
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
          degreeSize: config.bodySize + 0.8,
          metaSize: config.bodySize - 0.2,
          degreeColor: textDark,
          mutedColor: mutedText,
          degree: edu.degree,
          institution: edu.institution,
          periodRaw: edu.period,
          degreeWrapSubtract: 10,
        });
        y -= 6;
        continue;
      }
    }

    const lineWithoutBullet = line.replace(/^[\-\·•]\s*/, '').trim();
    const colonIndex = lineWithoutBullet.indexOf(':');
    const isSkillsSection = currentSection === 'technical skills' || currentSection === 'skills';
    const isSkillsCategory = colonIndex !== -1 && (isSkillsSection || line.startsWith('·') || line.startsWith('•'));
    if (isSkillsCategory) {
      const bulletWidth = serifFont.widthOfTextAtSize(PDF_BULLET + '   ', bulletMarkSize);
      const categoryName = lineWithoutBullet.substring(0, colonIndex + 1).trim();
      const skillsText = lineWithoutBullet.substring(colonIndex + 1).trim();
      const categoryWidth = serifBoldFont.widthOfTextAtSize(categoryName, config.bodySize);
      const wrappedSkills = wrapSkillsAfterCategory(skillsText, serifFont, config.bodySize, {
        left,
        bodyInsetLeft: 2,
        contentWidth,
        bodyInnerSubtract: 15,
        bulletWidth,
        categoryWidth,
        spaceWidth: serifFont.widthOfTextAtSize(' ', config.bodySize),
      });
      ensurePageSpace();
      context.page.drawText(PDF_BULLET, { x: left + 2, y, size: bulletMarkSize, font: serifFont, color: textDark });
      context.page.drawText(categoryName, { x: left + 2 + bulletWidth, y, size: config.bodySize, font: serifBoldFont, color: accent });
      if (wrappedSkills[0]) {
        context.page.drawText(wrappedSkills[0], {
          x: left + 2 + bulletWidth + categoryWidth + serifFont.widthOfTextAtSize(' ', config.bodySize),
          y,
          size: config.bodySize,
          font: serifFont,
          color: textDark,
        });
      }
      for (let i = 1; i < wrappedSkills.length; i++) {
        y -= bodyLineHeight;
        ensurePageSpace();
        context.page.drawText(wrappedSkills[i], { x: left + 2 + bulletWidth, y, size: config.bodySize, font: serifFont, color: textDark });
      }
      y -= bodyLineHeight + 2;
      continue;
    }

    const hasBullet = /^[\-\·•]\s/.test(line);
    const noAutoDotInSection =
      currentSection === 'summary' || currentSection === 'education';
    const textToWrap = hasBullet ? line : noAutoDotInSection ? line : `${PDF_BULLET}   ${line}`;
    const bulletIndent =
      noAutoDotInSection && !hasBullet ? 0 : serifFont.widthOfTextAtSize(PDF_BULLET + '   ', bulletMarkSize);
    const wrapped = wrapTextWithIndent(textToWrap, serifFont, config.bodySize, contentWidth - 15);
    let contentStartX = left + 2 + bulletIndent;
    for (let i = 0; i < wrapped.lines.length; i++) {
      ensurePageSpace();
      const lineText = wrapped.lines[i];
      if (i === 0 && (lineText.startsWith('•') || lineText.startsWith('·') || lineText.startsWith('-'))) {
        const bulletMatch = lineText.match(/^([\-\·•])\s*(.*)/);
        if (bulletMatch) {
          const [, bulletChar, content] = bulletMatch;
          context.page.drawText(bulletChar, { x: left + 2, y, size: bulletMarkSize, font: serifFont, color: accent });
          contentStartX = left + 2 + serifFont.widthOfTextAtSize(bulletChar + '   ', bulletMarkSize);
          drawTextWithBold(context.page, content, contentStartX, y, serifFont, serifBoldFont, config.bodySize, textDark);
        } else {
          drawTextWithBold(context.page, lineText, left + 2, y, serifFont, serifBoldFont, config.bodySize, textDark);
        }
      } else {
        drawTextWithBold(context.page, lineText, contentStartX, y, serifFont, serifBoldFont, config.bodySize, textDark);
      }
      y -= bodyLineHeight;
    }
  }
}

export async function renderVariantTemplate(context: TemplateContext, config: VariantConfig): Promise<Uint8Array> {
  const serifFont = await context.pdfDoc.embedFont(StandardFonts.TimesRoman);
  const serifBoldFont = await context.pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  drawHeader(context, config, serifFont, serifBoldFont);
  const startY = context.PAGE_HEIGHT - config.headerHeight - 22;
  renderBody(context, config, serifFont, serifBoldFont, startY);
  return await context.pdfDoc.save();
}
