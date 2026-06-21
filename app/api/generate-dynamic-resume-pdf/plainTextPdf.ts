import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  baselineFitsAboveBottomMargin,
  RESUME_PAGE_BOTTOM_MARGIN,
  sanitizeForPdfText,
  wrapText,
} from './utils';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const MARGIN_TOP = 50;
const FONT_SIZE = 11;
const LINE_HEIGHT = 14;

export async function generatePlainTextPdf(
  text: string,
  title = 'cover_letter'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const contentWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const sanitized = sanitizeForPdfText(text);
  const lines = sanitized.split('\n');

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN_TOP;

  const addPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN_TOP;
  };

  for (const line of lines) {
    if (!line.trim()) {
      if (!baselineFitsAboveBottomMargin(y, RESUME_PAGE_BOTTOM_MARGIN, LINE_HEIGHT)) {
        addPage();
      }
      y -= LINE_HEIGHT;
      continue;
    }

    const wrappedLines = wrapText(line, font, FONT_SIZE, contentWidth);
    for (const wrappedLine of wrappedLines) {
      if (!baselineFitsAboveBottomMargin(y, RESUME_PAGE_BOTTOM_MARGIN, LINE_HEIGHT)) {
        addPage();
      }
      page.drawText(wrappedLine, {
        x: MARGIN_LEFT,
        y,
        size: FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      });
      y -= LINE_HEIGHT;
    }
  }

  return pdfDoc.save();
}
