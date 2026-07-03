import { PDFDocument, PDFFont, PDFPage, RGB, rgb } from 'pdf-lib';

// Shared interface for template rendering
export interface TemplateContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  headline: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  body: string;
  PAGE_WIDTH: number;
  PAGE_HEIGHT: number;
}

/** Minimum clear space reserved from the physical bottom of the page (points). */
export const RESUME_PAGE_BOTTOM_MARGIN = 50;

/** Whether a text line can be drawn at baselineY without crossing the bottom margin.
 * We intentionally reserve only a fraction of `lineHeight` under the baseline, because
 * `lineHeight` in these templates is mostly leading between baselines, not exact glyph height.
 */
export function baselineFitsAboveBottomMargin(
  baselineY: number,
  marginBottom: number,
  requiredHeight: number
): boolean {
  // For multi-line blocks, `requiredHeight` is the total baseline spacing used by the block.
  // We reserve only a small portion below the last baseline because `lineHeight` mainly
  // represents leading between baselines and not exact glyph height.
  return baselineY - requiredHeight + requiredHeight * 0.75 >= marginBottom;
}

// Validation helpers
function isValidEmail(text: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(text.trim());
}

function isValidPhone(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  // Matches various phone formats:
  // +1 415 966 0362, +1-415-966-0362, (415) 966-0362, 415-966-0362, 415.966.0362, etc.
  const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,}$/;
  const cleaned = t.replace(/[\s\-\(\)\.]/g, '');
  // Should have at least 10 digits
  return phoneRegex.test(t) && /\d{10,}/.test(cleaned);
}

/** Extract a phone substring from a line (e.g. "Phone: 415-966-0362" or segment from "a | 415-966-0362 | b"). */
function extractPhoneFromLine(line: string): string | null {
  const trimmed = line.trim();
  // Label prefix: "Phone:", "phone:", "Tel:", "Mobile:", etc.
  const withLabel = trimmed.replace(/^(phone|tel|mobile|cell|fax)\s*:\s*/i, '').trim();
  if (withLabel !== trimmed && isValidPhone(withLabel)) return withLabel;
  if (isValidPhone(trimmed)) return trimmed;
  // Try to find a phone-like substring (e.g. in "Contact: 415-966-0362" or "Email | 415-966-0362 | City")
  const phoneLike = trimmed.match(/[\+]?[\d\s\-\(\)\.]{10,}/g);
  if (phoneLike) {
    for (const part of phoneLike) {
      if (isValidPhone(part)) return part.trim();
    }
  }
  return null;
}

function isValidLinkedIn(text: string): boolean {
  const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/.+/i;
  return linkedinRegex.test(text.trim());
}

function isValidLocation(text: string): boolean {
  // Location typically has city, state or city, country format
  // Should not be an email, phone, or URL
  if (isValidEmail(text) || isValidPhone(text) || isValidLinkedIn(text)) {
    return false;
  }
  // Should contain letters and possibly commas, spaces, hyphens
  return /^[a-zA-Z\s,\-]+$/.test(text.trim()) && text.trim().length > 2;
}

/** True when segment starts with a house/street number (prefer a shorter "City, ST" segment on the same row). */
function looksLikeLeadingStreetNumber(s: string): boolean {
  return /^\s*\d{1,5}\s+[A-Za-z#]/.test(s.trim());
}

/** A pipe or header segment that could be a postal / region line (not email, phone, or LinkedIn). */
function isLocationSegmentCandidate(s: string): boolean {
  const t = s.trim();
  if (t.length < 3 || !/[A-Za-z]/.test(t)) return false;
  if (isValidEmail(t) || extractPhoneFromLine(t) || isValidLinkedIn(t)) return false;
  if (/^[\-\·•]/.test(t)) return false;
  return /^[a-zA-Z0-9\s,.\-#\/']+$/i.test(t);
}

function pickPreferredLocationSegment(candidates: string[]): string | null {
  const uniq = [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
  if (!uniq.length) return null;
  const notStreet = uniq.filter((c) => !looksLikeLeadingStreetNumber(c));
  const pool = notStreet.length ? notStreet : uniq;
  return pool.slice().sort((a, b) => a.length - b.length || a.localeCompare(b))[0] ?? null;
}

/** Parse one header line that uses `|` separators (e.g. address | phone | email). */
function parseCompositeContactLine(line: string): {
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
} {
  const out: { email?: string; phone?: string; linkedin?: string; location?: string } = {};
  if (!line.includes('|')) return out;
  const segments = line.split('|').map((s) => s.trim()).filter(Boolean);
  const locationCandidates: string[] = [];
  for (const seg of segments) {
    if (isValidEmail(seg)) out.email = out.email ?? seg;
    const ph = extractPhoneFromLine(seg);
    if (ph) out.phone = out.phone ?? ph;
    if (isValidLinkedIn(seg)) out.linkedin = out.linkedin ?? seg;
    if (
      isLocationSegmentCandidate(seg) &&
      !isValidEmail(seg) &&
      !extractPhoneFromLine(seg) &&
      !isValidLinkedIn(seg)
    ) {
      locationCandidates.push(seg);
    }
  }
  const loc = pickPreferredLocationSegment(locationCandidates);
  if (loc) out.location = loc;
  return out;
}

/**
 * Sanitize string for PDF WinAnsi encoding. Standard fonts (Helvetica, etc.) only support
 * WinAnsi (Latin-1–like). Removes Unicode format/control chars (e.g. U+202A LEFT-TO-RIGHT
 * EMBEDDING) and replaces or strips others that would cause "WinAnsi cannot encode" errors.
 */
export function sanitizeForPdfText(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069]/g, '') // bidirectional/format controls
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2022/g, '\u00B7') // bullet • → middle dot · (in WinAnsi)
    .replace(/[^\x00-\xFF]/g, ''); // remove any remaining non–Latin-1
}

// Helper to parse resume text with validation
export function parseResume(resumeText: string): {
  headline: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  body: string;
} {
  const lines = resumeText.split('\n');
  const result = {
    headline: '',
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    body: ''
  };
  
  // Get first two non-empty lines as headline and name
  const nonEmptyLines: Array<{ line: string; index: number }> = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const trimmed = lines[idx].trim();
    if (trimmed) {
      nonEmptyLines.push({ line: trimmed, index: idx });
    }
  }
  
  // First line = headline, Second line = name
  if (nonEmptyLines.length > 0) {
    result.headline = nonEmptyLines[0].line;
  }
  if (nonEmptyLines.length > 1) {
    result.name = nonEmptyLines[1].line;
  }
  
  // Extract and validate email, phone, location, linkedin from remaining lines
  const maxFieldsToCheck = 15; // Check up to 15 lines for personal info
  let bodyStart = 0;
  
  for (let idx = 2; idx < Math.min(nonEmptyLines.length, maxFieldsToCheck + 2); idx++) {
    const { line, index } = nonEmptyLines[idx];
    
    // If we hit a section header, this is where body starts
    if (line.endsWith(':')) {
      bodyStart = index;
      break;
    }
    
    // Composite contact row: extract email, phone, LinkedIn, and prefer concise location over full street
    if (line.includes('|')) {
      const composite = parseCompositeContactLine(line);
      if (!result.email && composite.email) result.email = composite.email;
      if (!result.phone && composite.phone) result.phone = composite.phone;
      if (!result.linkedin && composite.linkedin) result.linkedin = composite.linkedin;
      if (!result.location && composite.location) result.location = composite.location;
      if (composite.email || composite.phone || composite.linkedin || composite.location) {
        continue;
      }
    }

    // Check for clearly identifiable fields (only if not already found)
    if (!result.email && isValidEmail(line)) {
      result.email = line;
      continue;
    }

    if (!result.phone) {
      const extracted = extractPhoneFromLine(line);
      if (extracted) {
        result.phone = extracted;
        continue;
      }
    }

    if (!result.linkedin && isValidLinkedIn(line)) {
      result.linkedin = line;
      continue;
    }

    if (!result.location && isValidLocation(line)) {
      result.location = line;
      continue;
    }

    // "City, ST 12345" etc.: digits (zip) fail isValidLocation but should still count as resume location
    if (!result.location && isLocationSegmentCandidate(line) && line.includes(',')) {
      result.location = line;
      continue;
    }
    
    // If we hit body content markers, stop
    if (line.startsWith('•') || line.startsWith('·') || line.startsWith('-')) {
      bodyStart = index;
      break;
    }
  }
  
  // If we didn't find a section header, find the first line that looks like body content
  if (bodyStart === 0) {
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      if (line && (line.endsWith(':') || line.startsWith('•') || line.startsWith('·') || line.startsWith('-'))) {
        bodyStart = idx;
        break;
      }
    }
    // If still no body start found, start after reasonable number of header lines
    if (bodyStart === 0) {
      bodyStart = Math.min(maxFieldsToCheck + 2, lines.length);
    }
  }
  
  // Skip empty lines at the start of body
  while (bodyStart < lines.length && !lines[bodyStart].trim()) {
    bodyStart++;
  }
  
  result.body = lines.slice(bodyStart).join('\n');

  // Sanitize all fields for PDF WinAnsi encoding (avoids "WinAnsi cannot encode" errors)
  result.headline = sanitizeForPdfText(result.headline);
  result.name = sanitizeForPdfText(result.name);
  result.email = sanitizeForPdfText(result.email);
  result.phone = sanitizeForPdfText(result.phone);
  result.location = sanitizeForPdfText(result.location);
  result.linkedin = sanitizeForPdfText(result.linkedin);
  result.body = sanitizeForPdfText(result.body);

  return result;
}

// Helper to convert date format from MM/YYYY to MMM YYYY
export function formatDate(dateStr: string): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Handle different date formats
  if (dateStr.includes('–') || dateStr.includes('-')) {
    // Split by dash and format each part
    const parts = dateStr.split(/[–-]/).map(part => part.trim());
    return parts.map(part => {
      if (part.match(/^\d{2}\/\d{4}$/)) {
        const [month, year] = part.split('/');
        const monthIndex = parseInt(month) - 1;
        return `${monthNames[monthIndex]} ${year}`;
      }
      return part; // Return as-is if not in MM/YYYY format
    }).join(' – ');
  } else if (dateStr.match(/^\d{2}\/\d{4}$/)) {
    // Single date in MM/YYYY format
    const [month, year] = dateStr.split('/');
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }

  return dateStr; // Return as-is if not in expected format
}

/**
 * Parse a single education row with two separators (| : – — or hyphen), e.g.
 * `BS Computer Science | State University | 2013 – 2017` or `Degree – School: 2013-2017`.
 */
export function parseEducationThreePartLine(rawLine: string): { degree: string; institution: string; period: string } | null {
  const line = rawLine.replace(/^[\-\·•]\s*/, '').trim();
  if (!line) return null;
  const m = line.match(/^(.+?)\s*[|:\u2013\u2014\u2015-]\s*(.+?)\s*[|:\u2013\u2014\u2015-]\s*(.+)$/);
  if (!m) return null;
  return { degree: m[1].trim(), institution: m[2].trim(), period: m[3].trim() };
}

export const ROLE_FOCUS_LABEL = 'Role Focus:';

/** Parse `Role Focus: …` lines (optional leading bullet). Returns focus text or null if not a role-focus line. */
export function parseRoleFocusLine(rawLine: string): string | null {
  const line = rawLine.replace(/^[\-\·•]\s*/, '').trim();
  if (!/^role\s+focus\s*:/i.test(line)) return null;
  const match = line.match(/^role\s+focus\s*:\s*(.*)$/i);
  if (!match) return null;
  const text = match[1].trim();
  return text || null;
}

export type RoleFocusDrawParams = {
  page: PDFPage;
  ensurePageSpace: (requiredHeight?: number, lineHeight?: number) => void;
  textLeft: number;
  y: number;
  contentWidth: number;
  bodyLineHeight: number;
  font: PDFFont;
  fontBold: PDFFont;
  labelSize: number;
  textSize: number;
  labelColor: RGB;
  textColor: RGB;
  focusText: string;
  bodyInsetLeft?: number;
  bodyInnerSubtract?: number;
  wordGapExtra?: number;
  backgroundColor?: RGB;
  backgroundPadding?: number;
  backgroundTextInset?: number;
  borderColor?: RGB;
  borderWidth?: number;
};

/** Render a role-focus paragraph (no bullet) with a bold label and wrapped body text. */
export function drawRoleFocusBlock(p: RoleFocusDrawParams): number {
  const wg = p.wordGapExtra ?? 0;
  const inset = p.bodyInsetLeft ?? 0;
  const textInset = p.backgroundTextInset ?? 0;
  const innerSubtract = p.bodyInnerSubtract ?? 15;
  const padding = p.backgroundPadding ?? 4;
  const borderWidth = p.borderWidth ?? 1.2;
  const label = ROLE_FOCUS_LABEL;
  const labelWidth = p.fontBold.widthOfTextAtSize(label, p.labelSize);
  const spaceWidth = p.font.widthOfTextAtSize(' ', p.textSize);
  const backgroundStartX = p.textLeft + inset;
  const rawWidth = p.contentWidth - innerSubtract;
  const availableWidth = Math.max(48, rawWidth - textInset);
  const firstLineStartX = backgroundStartX + textInset + labelWidth + spaceWidth;
  const firstLineWidth = Math.max(48, availableWidth - labelWidth - spaceWidth);
  const continuationWidth = Math.max(48, availableWidth);

  const wrapped = wrapTextWithLineWidths(p.focusText, p.font, p.textSize, firstLineWidth, continuationWidth, wg);
  let y = p.y;

  const rectWidth = rawWidth + padding;
  const rectBottom = y - p.bodyLineHeight * wrapped.length + padding;
  const rectHeight = p.bodyLineHeight * wrapped.length + padding * 2;

  if (p.backgroundColor) {
    p.ensurePageSpace(rectHeight + p.bodyLineHeight, p.bodyLineHeight);
    p.page.drawRectangle({
      x: backgroundStartX,
      y: rectBottom,
      width: rectWidth,
      height: rectHeight,
      color: p.backgroundColor,
    });
  } else {
    p.ensurePageSpace(p.bodyLineHeight, p.bodyLineHeight);
  }

  if (p.borderColor) {
    p.page.drawRectangle({
      x: backgroundStartX,
      y: rectBottom,
      width: borderWidth,
      height: rectHeight,
      color: p.borderColor,
    });
  }

  const textX = backgroundStartX + textInset;
  p.page.drawText(label, {
    x: textX,
    y,
    size: p.labelSize,
    font: p.fontBold,
    color: p.labelColor,
  });
  if (wrapped[0]) {
    drawTextWithWordGap(p.page, wrapped[0], firstLineStartX, y, p.textSize, p.font, p.textColor, wg);
  }
  y -= p.bodyLineHeight;

  for (let i = 1; i < wrapped.length; i++) {
    p.ensurePageSpace(p.bodyLineHeight);
    drawTextWithWordGap(
      p.page,
      wrapped[i],
      textX,
      y,
      p.textSize,
      p.font,
      p.textColor,
      wg
    );
    y -= p.bodyLineHeight;
  }

  return y;
}

/** Extra distance (pt) between word boundaries when rendering templates 10–15 (wider inter-word spacing). */
export const RESUME_TEMPLATES_11_15_WORD_GAP_PT = 0.42;

/** Width of a line when spaces between tokens receive `extraWordGap` (must match `drawTextWithWordGap`). */
export function measureLineWidthWithWordGap(
  text: string,
  font: PDFFont,
  size: number,
  extraWordGap: number
): number {
  if (extraWordGap <= 0) return font.widthOfTextAtSize(text, size);
  const tokens = text.split(/(\s+)/);
  let w = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if (/^\s+$/.test(t)) {
      w += font.widthOfTextAtSize(t, size);
      if (i > 0 && i < tokens.length - 1) w += extraWordGap;
    } else {
      w += font.widthOfTextAtSize(t, size);
    }
  }
  return w;
}

/** Draw plain text with optional extra space between word runs (PDF has no `wordSpacing` in pdf-lib). */
export function drawTextWithWordGap(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB,
  extraWordGap: number
): void {
  if (extraWordGap <= 0) {
    page.drawText(text, { x, y, size, font, color });
    return;
  }
  const tokens = text.split(/(\s+)/);
  let cx = x;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if (/^\s+$/.test(t)) {
      cx += font.widthOfTextAtSize(t, size);
      if (i > 0 && i < tokens.length - 1) cx += extraWordGap;
    } else {
      page.drawText(t, { x: cx, y, size, font, color });
      cx += font.widthOfTextAtSize(t, size);
    }
  }
}

function drawSegmentWithWordGap(
  page: PDFPage,
  text: string,
  startX: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB,
  extraWordGap: number
): number {
  if (extraWordGap <= 0) {
    page.drawText(text, { x: startX, y, size, font, color });
    return startX + font.widthOfTextAtSize(text, size);
  }
  const tokens = text.split(/(\s+)/);
  let cx = startX;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if (/^\s+$/.test(t)) {
      cx += font.widthOfTextAtSize(t, size);
      if (i > 0 && i < tokens.length - 1) cx += extraWordGap;
    } else {
      page.drawText(t, { x: cx, y, size, font, color });
      cx += font.widthOfTextAtSize(t, size);
    }
  }
  return cx;
}

// Helper to wrap text within a max width
export function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  extraWordGap: number = 0
): string[] {
  const safe = sanitizeForPdfText(text);
  const words = safe.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';
  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
    const testWidth =
      extraWordGap > 0
        ? measureLineWidthWithWordGap(testLine, font, size, extraWordGap)
        : font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Slack so skills lines do not wrap when widthOfTextAtSize is slightly stricter than visible fit
 * (e.g. after a bold category prefix on the same row).
 */
export const PDF_SKILLS_WRAP_TOLERANCE_PT = 2.5;

/**
 * Word wrap with a narrower first line and wider continuation lines (skills share row with label).
 */
export function wrapTextWithLineWidths(
  text: string,
  font: PDFFont,
  size: number,
  firstLineMaxWidth: number,
  continuationMaxWidth: number,
  extraWordGap: number = 0,
  tolerancePt: number = PDF_SKILLS_WRAP_TOLERANCE_PT
): string[] {
  const safe = sanitizeForPdfText(text);
  const words = safe.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';
  let lineIndex = 0;

  const widthLimit = (idx: number) =>
    (idx === 0 ? firstLineMaxWidth : continuationMaxWidth) + tolerancePt;

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const testWidth =
      extraWordGap > 0
        ? measureLineWidthWithWordGap(testLine, font, size, extraWordGap)
        : font.widthOfTextAtSize(testLine, size);
    if (testWidth <= widthLimit(lineIndex) || !currentLine) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      lineIndex++;
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** Wrap skills text after "Category:" using the same geometry as draw positions. */
export function wrapSkillsAfterCategory(
  skillsText: string,
  font: PDFFont,
  bodySize: number,
  layout: {
    left: number;
    bodyInsetLeft: number;
    contentWidth: number;
    bodyInnerSubtract: number;
    bulletWidth: number;
    categoryWidth: number;
    spaceWidth: number;
  },
  extraWordGap: number = 0
): string[] {
  const {
    left,
    bodyInsetLeft,
    contentWidth,
    bodyInnerSubtract,
    bulletWidth,
    categoryWidth,
    spaceWidth,
  } = layout;
  const bodyTextRight = left + bodyInsetLeft + (contentWidth - bodyInnerSubtract);
  const skillsFirstLineStartX =
    left + bodyInsetLeft + bulletWidth + categoryWidth + spaceWidth;
  const firstLineWidth = bodyTextRight - skillsFirstLineStartX;
  const continuationStartX = left + bodyInsetLeft + bulletWidth;
  const continuationWidth = bodyTextRight - continuationStartX;
  return wrapTextWithLineWidths(
    skillsText,
    font,
    bodySize,
    firstLineWidth,
    continuationWidth,
    extraWordGap
  );
}

// Helper to wrap text with proper indentation for lines starting with prefixes (like '- ' or '· ')
export function wrapTextWithIndent(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  extraWordGap: number = 0
): { lines: string[]; prefix: string; indentWidth: number } {
  // Convert '-' to '•' (bullet) for consistency
  const normalizedText = text.replace(/^(-\s+)/, '• ');
  
  // Detect common prefixes
  const prefixMatch = normalizedText.match(/^([\-\·•]\s+)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const content = prefix ? normalizedText.slice(prefix.length) : normalizedText;
  
  // Calculate prefix width for indentation
  const prefixWidth = prefix ? font.widthOfTextAtSize(prefix, size) : 0;
  
  // Wrap the content part
  const wrappedContent = wrapText(content, font, size, maxWidth - prefixWidth, extraWordGap);
  
  // Build lines with prefix on first line only
  const lines: string[] = [];
  wrappedContent.forEach((line, index) => {
    if (index === 0) {
      lines.push(prefix + line);
    } else {
      lines.push(line);
    }
  });
  
  return {
    lines,
    prefix,
    indentWidth: prefixWidth
  };
}

// Helper to draw text with bold segments (markdown **bold**)
export function drawTextWithBold(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  fontBold: PDFFont,
  size: number,
  color: RGB,
  wordGapExtra: number = 0
) {
  const safe = sanitizeForPdfText(text);
  const parts = safe.split(/(\*\*[^*]+\*\*)/g);
  let offsetX = x;
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      offsetX = drawSegmentWithWordGap(page, content, offsetX, y, size, fontBold, color, wordGapExtra);
    } else {
      offsetX = drawSegmentWithWordGap(page, part, offsetX, y, size, font, color, wordGapExtra);
    }
  }
}

/** Education block: first row(s) = degree; next row(s) = institution (wrapped) with graduation period right-aligned on the first meta row. */
export type EducationTwoRowParams = {
  page: PDFPage;
  ensurePageSpace: (requiredHeight?: number, lineHeight?: number) => void;
  textLeft: number;
  y: number;
  contentWidth: number;
  rightEdgeX: number;
  bodyLineHeight: number;
  font: PDFFont;
  fontBold: PDFFont;
  degreeSize: number;
  metaSize: number;
  degreeColor: RGB;
  mutedColor: RGB;
  degree: string;
  institution: string;
  periodRaw: string;
  /** Subtracted from content width when wrapping the degree (default 10). */
  degreeWrapSubtract?: number;
  /** Optional wider inter-word spacing (templates 10–15). */
  wordGapExtra?: number;
};

export function drawEducationTwoRows(p: EducationTwoRowParams): number {
  const wg = p.wordGapExtra ?? 0;
  let y = p.y;
  const dw = p.degreeWrapSubtract ?? 10;
  const degreeLines = wrapText(p.degree, p.fontBold, p.degreeSize, p.contentWidth - dw, wg);
  const periodText = formatDate(p.periodRaw.trim()).trim();
  const periodW = p.font.widthOfTextAtSize(periodText, p.metaSize);
  const periodX = p.rightEdgeX - periodW;
  const gap = 12;
  const firstLineMax = Math.max(60, periodX - p.textLeft - gap);
  const uniLines = wrapText(p.institution, p.font, p.metaSize, firstLineMax, wg);
  const requiredHeight = p.bodyLineHeight * (degreeLines.length + uniLines.length);

  p.ensurePageSpace(requiredHeight);

  for (const degreeLine of degreeLines) {
    drawTextWithBold(p.page, degreeLine, p.textLeft, y, p.font, p.fontBold, p.degreeSize, p.degreeColor, wg);
    y -= p.bodyLineHeight;
  }

  drawTextWithWordGap(p.page, uniLines[0] ?? '', p.textLeft, y, p.metaSize, p.font, p.mutedColor, wg);
  p.page.drawText(periodText, {
    x: periodX,
    y,
    size: p.metaSize,
    font: p.font,
    color: p.mutedColor,
  });
  y -= p.bodyLineHeight;

  for (let i = 1; i < uniLines.length; i++) {
    drawTextWithWordGap(p.page, uniLines[i], p.textLeft, y, p.metaSize, p.font, p.mutedColor, wg);
    y -= p.bodyLineHeight;
  }

  return y;
}

/** WinAnsi-safe bullet for PDF (middle dot ·). Use instead of Unicode • to avoid encoding errors. */
export const PDF_BULLET = '\u00B7';

/** Disc bullet (•) for templates 10–15 skills/experience list markers. */
export const PDF_BULLET_DOT = '\u2022';

/** Slight size multiplier to make bullets visually a bit larger than body text. */
export const PDF_BULLET_SIZE_MULTIPLIER = 1.5;

// Color constants
export const COLORS = {
  BLACK: rgb(0, 0, 0),
  MEDIUM_GRAY: rgb(0.4, 0.4, 0.4),
  LIGHT_GRAY: rgb(0.6, 0.6, 0.6),
  DARK_GRAY: rgb(0.3, 0.3, 0.3),
};

