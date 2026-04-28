import { PDFPage, rgb } from 'pdf-lib';
import {
  TemplateContext,
  wrapText,
  wrapTextWithIndent,
  formatDate,
  drawTextWithBold,
  COLORS,
  PDF_BULLET,
  wrapSkillsAfterCategory,
  parseEducationThreePartLine,
  drawEducationTwoRows,
} from '../utils';

// Template 8 Body Content Renderer - Classic bordered frame
function renderBodyContentTemplate8(
  context: TemplateContext,
  y: number,
  left: number,
  right: number,
  contentWidth: number,
  bodySize: number,
  bodyLineHeight: number,
  sectionHeaderSize: number,
  sectionLineHeight: number,
  marginBottom: number
): number {
  const { font, fontBold, body, PAGE_HEIGHT, PAGE_WIDTH, pdfDoc } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const DARK_GRAY = rgb(0.25, 0.25, 0.25);
  
  const bodyLines = body.split('\n');
  let firstJob = true;
  let currentSection = '';
  
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) {
      y -= 6;
      continue;
    }
    
    // Check if this is a section header (ends with colon or is a known section name)
    const isSectionHeader = line.endsWith(':') || 
                           /^(summary|education|experience|technical skills|skills|professional experience)$/i.test(line.trim());
    
    if (isSectionHeader) {
      y -= 20;
      const sectionHeader = line.endsWith(':') ? line.slice(0, -1).trim() : line.trim();
      currentSection = sectionHeader.toLowerCase();
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 50);
      
      for (const sectionLine of sectionLines) {
        if (y < marginBottom) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          // Redraw frame on new page
          const frameMargin = 30;
          context.page.drawRectangle({
            x: frameMargin,
            y: frameMargin,
            width: PAGE_WIDTH - frameMargin * 2,
            height: PAGE_HEIGHT - frameMargin * 2,
            borderColor: DARK_GRAY,
            borderWidth: 2,
          });
          y = PAGE_HEIGHT - 72;
        }
        
        // Section header with double underline
        context.page.drawText(sectionLine, { 
          x: left, 
          y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: BLACK 
        });
        
        const textWidth = fontBold.widthOfTextAtSize(sectionLine, sectionHeaderSize);
        // Double underline
        context.page.drawLine({
          start: { x: left, y: y - 4 },
          end: { x: left + textWidth, y: y - 4 },
          thickness: 1,
          color: DARK_GRAY,
        });
        context.page.drawLine({
          start: { x: left, y: y - 6 },
          end: { x: left + textWidth, y: y - 6 },
          thickness: 1,
          color: DARK_GRAY,
        });
        
        y -= sectionLineHeight + 12;
      }
    } else {
      const isJobExperience = / at .+:.+/.test(line);
      
      if (isJobExperience) {
        // Match format: "JobTitle at CompanyName, CompanyLocation : Period"
        const match = line.match(/^(.+?) at (.+?):\s*(.+)$/);
        if (match) {
          const [, jobTitle, companyPart, period] = match;
          
          // Split company part by last comma to separate company name and location
          let companyName = companyPart.trim();
          let companyLocation = '';
          const lastCommaIndex = companyPart.indexOf(',');
          if (lastCommaIndex !== -1) {
            companyName = companyPart.substring(0, lastCommaIndex).trim();
            companyLocation = companyPart.substring(lastCommaIndex + 1).trim();
          }
          
          if (!firstJob) {
            y -= 16;
          }
          firstJob = false;
          
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 2, contentWidth - 20);
          for (const titleLine of titleLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const frameMargin = 30;
              context.page.drawRectangle({
                x: frameMargin,
                y: frameMargin,
                width: PAGE_WIDTH - frameMargin * 2,
                height: PAGE_HEIGHT - frameMargin * 2,
                borderColor: DARK_GRAY,
                borderWidth: 2,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, titleLine, left + 20, y, font, fontBold, bodySize + 2, BLACK);
            y -= bodyLineHeight + 2;
          }
          
          const formattedPeriod = formatDate(period.trim());
          // Display: "CompanyName, CompanyLocation  •  Period" (or just "CompanyName  •  Period" if no location)
          const companyInfo = companyLocation ? `${companyName}  •  ${companyLocation}` : companyName;
          const companyPeriodLine = `${companyInfo}  •  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 20);
          for (const line of companyPeriodLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const frameMargin = 30;
              context.page.drawRectangle({
                x: frameMargin,
                y: frameMargin,
                width: PAGE_WIDTH - frameMargin * 2,
                height: PAGE_HEIGHT - frameMargin * 2,
                borderColor: DARK_GRAY,
                borderWidth: 2,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, line, left + 20, y, font, fontBold, bodySize, MEDIUM_GRAY);
            y -= bodyLineHeight;
          }
          
          y -= 10;
        }
      } else {
        if (currentSection === 'education') {
          const edu = parseEducationThreePartLine(line);
          if (edu) {
            const ensurePageSpace = () => {
              if (y >= marginBottom) return;
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const frameMargin = 30;
              context.page.drawRectangle({
                x: frameMargin,
                y: frameMargin,
                width: PAGE_WIDTH - frameMargin * 2,
                height: PAGE_HEIGHT - frameMargin * 2,
                borderColor: DARK_GRAY,
                borderWidth: 2,
              });
              y = PAGE_HEIGHT - 72;
            };
            y = drawEducationTwoRows({
              page: context.page,
              ensurePageSpace,
              textLeft: left + 20,
              y,
              contentWidth,
              rightEdgeX: right,
              bodyLineHeight,
              font,
              fontBold,
              degreeSize: bodySize + 0.5,
              metaSize: bodySize - 0.2,
              degreeColor: BLACK,
              mutedColor: MEDIUM_GRAY,
              degree: edu.degree,
              institution: edu.institution,
              periodRaw: edu.period,
              degreeWrapSubtract: 20,
            });
            y -= 6;
            continue;
          }
        }
        // Check if we're in Summary or Education section first
        const isSummaryOrEducation = currentSection === 'summary' || currentSection === 'education';
        
        if (isSummaryOrEducation) {
          // For Summary and Education, strip any existing bullets and use regular text wrapping
          const lineWithoutBullet = line.replace(/^[\-\·•]\s*/, '').trim();
          const wrapped = wrapText(lineWithoutBullet, font, bodySize, contentWidth - 20);
          
          for (const lineText of wrapped) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const frameMargin = 30;
              context.page.drawRectangle({
                x: frameMargin,
                y: frameMargin,
                width: PAGE_WIDTH - frameMargin * 2,
                height: PAGE_HEIGHT - frameMargin * 2,
                borderColor: DARK_GRAY,
                borderWidth: 2,
              });
              y = PAGE_HEIGHT - 72;
            }
            
            drawTextWithBold(context.page, lineText, left + 20, y, font, fontBold, bodySize, BLACK);
            y -= bodyLineHeight;
          }
        } else {
          const lineWithoutBullet = line.trim().replace(/^[·•]\s*/, '');
          const colonIndex = lineWithoutBullet.indexOf(':');
          // Check if we're in Technical Skills section
          const isTechnicalSkillsSection = currentSection === 'technical skills' || currentSection === 'skills';
          // A line is a skills category if:
          // 1. It starts with a bullet AND has a colon (original check)
          // 2. OR we're in Technical Skills section AND the line has a colon (new check)
          const isSkillsCategory = ((line.startsWith('·') || line.startsWith('•')) && 
                                   colonIndex !== -1 && 
                                   colonIndex < 30 && 
                                   !lineWithoutBullet.substring(0, colonIndex).includes(' at ')) ||
                                  (isTechnicalSkillsSection && colonIndex !== -1 && colonIndex < 50);
        
          if (isSkillsCategory) {
          const bulletSymbol = PDF_BULLET;
          const bulletWidth = font.widthOfTextAtSize(bulletSymbol + '   ', bodySize);
          
          const colonIndex = lineWithoutBullet.indexOf(':');
          if (colonIndex !== -1) {
            const categoryName = lineWithoutBullet.substring(0, colonIndex + 1).trim();
            const skillsText = lineWithoutBullet.substring(colonIndex + 1).trim();
            
            const categoryWidth = fontBold.widthOfTextAtSize(categoryName, bodySize);
            const spaceWidth = font.widthOfTextAtSize(' ', bodySize);
            const wrappedSkills = wrapSkillsAfterCategory(skillsText, font, bodySize, {
              left,
              bodyInsetLeft: 20,
              contentWidth,
              bodyInnerSubtract: 20,
              bulletWidth,
              categoryWidth,
              spaceWidth,
            });
            
            let currentX = left + 20;
            
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const frameMargin = 30;
              context.page.drawRectangle({
                x: frameMargin,
                y: frameMargin,
                width: PAGE_WIDTH - frameMargin * 2,
                height: PAGE_HEIGHT - frameMargin * 2,
                borderColor: DARK_GRAY,
                borderWidth: 2,
              });
              y = PAGE_HEIGHT - 72;
            }
            
            context.page.drawText(bulletSymbol, { 
              x: currentX, 
              y, 
              size: bodySize, 
              font, 
              color: BLACK 
            });
            
            currentX += bulletWidth;
            context.page.drawText(categoryName, { 
              x: currentX, 
              y, 
              size: bodySize, 
              font: fontBold, 
              color: BLACK 
            });
            
            if (wrappedSkills.length > 0 && wrappedSkills[0]) {
              currentX += categoryWidth + spaceWidth;
              context.page.drawText(wrappedSkills[0], {
                x: currentX,
                y,
                size: bodySize,
                font,
                color: BLACK
              });
              
              for (let i = 1; i < wrappedSkills.length; i++) {
                y -= bodyLineHeight;
                if (y < marginBottom) {
                  context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                  const frameMargin = 30;
                  context.page.drawRectangle({
                    x: frameMargin,
                    y: frameMargin,
                    width: PAGE_WIDTH - frameMargin * 2,
                    height: PAGE_HEIGHT - frameMargin * 2,
                    borderColor: DARK_GRAY,
                    borderWidth: 2,
                  });
                  y = PAGE_HEIGHT - 72;
                }
                context.page.drawText(wrappedSkills[i], {
                  x: left + 20 + bulletWidth,
                  y,
                  size: bodySize,
                  font,
                  color: BLACK
                });
              }
            }
            y -= bodyLineHeight + 2;
          }
          } else {
            // For experience bullets and other content, add bullets if needed
            const hasBullet = /^[\-\·•]\s/.test(line);
            const bulletSymbol = PDF_BULLET;
            const bulletWidth = font.widthOfTextAtSize(bulletSymbol + '   ', bodySize);
            
            let textToWrap = line;
            if (!hasBullet) {
              textToWrap = bulletSymbol + '   ' + line;
            }
            
            const wrapped = wrapTextWithIndent(textToWrap, font, bodySize, contentWidth - 20);
            
            // Calculate the content start position (after bullet) to align all wrapped lines
            let contentStartX = left + 20 + bulletWidth;
            
            for (let i = 0; i < wrapped.lines.length; i++) {
              if (y < marginBottom) {
                context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                const frameMargin = 30;
                context.page.drawRectangle({
                  x: frameMargin,
                  y: frameMargin,
                  width: PAGE_WIDTH - frameMargin * 2,
                  height: PAGE_HEIGHT - frameMargin * 2,
                  borderColor: DARK_GRAY,
                  borderWidth: 2,
                });
                y = PAGE_HEIGHT - 72;
              }
              
              const lineText = wrapped.lines[i];
              
              if (i === 0 && (lineText.startsWith('•') || lineText.startsWith('·') || lineText.startsWith('-'))) {
                const bulletMatch = lineText.match(/^([\-\·•])\s*(.*)/);
                if (bulletMatch) {
                  const [, bulletChar, content] = bulletMatch;
                  const bulletX = left + 20;
                  context.page.drawText(bulletChar, {
                    x: bulletX,
                    y,
                    size: bodySize,
                    font,
                    color: BLACK
                  });
                  contentStartX = bulletX + font.widthOfTextAtSize(bulletChar + '   ', bodySize);
                  drawTextWithBold(context.page, content, contentStartX, y, font, fontBold, bodySize, BLACK);
                } else {
                  drawTextWithBold(context.page, lineText, left + 20, y, font, fontBold, bodySize, BLACK);
                }
              } else {
                // For wrapped lines, align to the content start position (after bullet)
                drawTextWithBold(context.page, lineText, contentStartX, y, font, fontBold, bodySize, BLACK);
              }
              
              y -= bodyLineHeight;
            }
          }
        }
      }
    }
    
    if (y < marginBottom) {
      context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      const frameMargin = 30;
      context.page.drawRectangle({
        x: frameMargin,
        y: frameMargin,
        width: PAGE_WIDTH - frameMargin * 2,
        height: PAGE_HEIGHT - frameMargin * 2,
        borderColor: DARK_GRAY,
        borderWidth: 2,
      });
      y = PAGE_HEIGHT - 72;
    }
  }
  
  return y;
}

// CLASSIC BORDERED FRAME TEMPLATE - Traditional design with border frame around entire page
export async function renderTemplate8(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, headline, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const DARK_GRAY = rgb(0.25, 0.25, 0.25);
  
  const FRAME_MARGIN = 30;
  const MARGIN_TOP = 80;
  const MARGIN_BOTTOM = 50;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 26;
  const CONTACT_SIZE = 9.5;
  const SECTION_HEADER_SIZE = 13;
  const BODY_SIZE = 9.5;
  
  // Draw border frame around entire page
  page.drawRectangle({
    x: FRAME_MARGIN,
    y: FRAME_MARGIN,
    width: PAGE_WIDTH - FRAME_MARGIN * 2,
    height: PAGE_HEIGHT - FRAME_MARGIN * 2,
    borderColor: DARK_GRAY,
    borderWidth: 2,
  });
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Name (centered, classic style)
  if (name) {
    const nameLines = wrapText(name, fontBold, NAME_SIZE, CONTENT_WIDTH);
    for (const line of nameLines) {
      const textWidth = fontBold.widthOfTextAtSize(line, NAME_SIZE);
      const centerX = (PAGE_WIDTH - textWidth) / 2;
      page.drawText(line, { 
        x: centerX, 
        y, 
        size: NAME_SIZE, 
        font: fontBold, 
        color: BLACK 
      });
      y -= NAME_SIZE * 0.9;
    }
    y -= 5// Headline (under name, centered, medium gray)
    if (headline) {
      const headlineSize = 12;
      const headlineLines = wrapText(headline, font, headlineSize, CONTENT_WIDTH);
      for (const line of headlineLines) {
        const textWidth = font.widthOfTextAtSize(line, headlineSize);
        const centerX = (PAGE_WIDTH - textWidth) / 2;
        page.drawText(line, { 
          x: centerX, 
          y, 
          size: headlineSize, 
          font, 
          color: MEDIUM_GRAY 
        });
        y -= headlineSize * 1.2;
      }
      y -= 4;
    } else {
      y -= 4;
    }
  }
  
  // Contact info (centered, classic)
  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  •  ');
    const contactLines = wrapText(contactLine, font, CONTACT_SIZE, CONTENT_WIDTH);
    for (const line of contactLines) {
      const textWidth = font.widthOfTextAtSize(line, CONTACT_SIZE);
      const centerX = (PAGE_WIDTH - textWidth) / 2;
      page.drawText(line, { 
        x: centerX, 
        y, 
        size: CONTACT_SIZE, 
        font, 
        color: MEDIUM_GRAY 
      });
      y -= CONTACT_SIZE * 1.3;
    }
    y -= 13;
  }
  
  // Classic double divider line
  page.drawLine({
    start: { x: left + 40, y: y },
    end: { x: right - 40, y: y },
    thickness: 1,
    color: DARK_GRAY,
  });
  page.drawLine({
    start: { x: left + 40, y: y - 2 },
    end: { x: right - 40, y: y - 2 },
    thickness: 1,
    color: DARK_GRAY,
  });
  y -= 30;
  
  // Render body content
  y = renderBodyContentTemplate8(
    context, 
    y, 
    left, 
    right, 
    CONTENT_WIDTH, 
    BODY_SIZE, 
    BODY_SIZE * 1.5, 
    SECTION_HEADER_SIZE, 
    SECTION_HEADER_SIZE * 1.4, 
    MARGIN_BOTTOM
  );
  
  return await pdfDoc.save();
}
