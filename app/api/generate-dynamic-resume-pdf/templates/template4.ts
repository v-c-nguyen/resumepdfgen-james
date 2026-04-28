import { PDFPage, rgb } from 'pdf-lib';
import {
  TemplateContext,
  wrapText,
  wrapTextWithIndent,
  formatDate,
  drawTextWithBold,
  COLORS,
  PDF_BULLET,
  PDF_BULLET_SIZE_MULTIPLIER,
  wrapSkillsAfterCategory,
  parseEducationThreePartLine,
  drawEducationTwoRows,
} from '../utils';

// Template 7 Body Content Renderer - Refined style with corner accents
function renderBodyContentTemplate4(
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
  const FOREST_GREEN = rgb(0.2, 0.4, 0.3); // Forest green accent color
  
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
          // Draw corner accents on new pages
          const cornerSize = 30;
          // Top-left corner
          context.page.drawRectangle({
            x: 0,
            y: PAGE_HEIGHT - cornerSize,
            width: cornerSize,
            height: cornerSize,
            color: FOREST_GREEN,
          });
          // Top-right corner
          context.page.drawRectangle({
            x: PAGE_WIDTH - cornerSize,
            y: PAGE_HEIGHT - cornerSize,
            width: cornerSize,
            height: cornerSize,
            color: FOREST_GREEN,
          });
          y = PAGE_HEIGHT - 72;
        }
        
        // Section header with elegant underline
        context.page.drawText(sectionLine, { 
          x: left, 
          y, 
          size: sectionHeaderSize - 2, 
          font: fontBold, 
          color: BLACK 
        });
        
        // Elegant underline
        const textWidth = fontBold.widthOfTextAtSize(sectionLine, sectionHeaderSize - 2);
        context.page.drawLine({
          start: { x: left, y: y - 8 },
          end: { x: left + textWidth, y: y - 8 },
          thickness: 2,
          color: FOREST_GREEN,
        });
        
        y -= sectionLineHeight + 8;
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
          
          // Job title (bold, forest green)
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 1, contentWidth - 20);
          for (const titleLine of titleLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const cornerSize = 30;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              context.page.drawRectangle({
                x: PAGE_WIDTH - cornerSize,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              y = PAGE_HEIGHT - 72;
            }
            context.page.drawText(titleLine, { 
              x: left + 20, 
              y, 
              size: bodySize + 1, 
              font: fontBold, 
              color: FOREST_GREEN 
            });
            y -= bodyLineHeight + 2;
          }
          
          // Company and period
          const formattedPeriod = formatDate(period.trim());
          // Display: "CompanyName, CompanyLocation  •  Period" (or just "CompanyName  •  Period" if no location)
          const companyInfo = companyLocation ? `${companyName}  •  ${companyLocation}` : companyName;
          const companyPeriodLine = `${companyInfo}  •  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 20);
          for (const line of companyPeriodLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const cornerSize = 30;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              context.page.drawRectangle({
                x: PAGE_WIDTH - cornerSize,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              y = PAGE_HEIGHT - 72;
            }
            context.page.drawText(line, { 
              x: left + 20, 
              y, 
              size: bodySize, 
              font, 
              color: MEDIUM_GRAY 
            });
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
              const cornerSize = 30;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              context.page.drawRectangle({
                x: PAGE_WIDTH - cornerSize,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
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
              const cornerSize = 30;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              context.page.drawRectangle({
                x: PAGE_WIDTH - cornerSize,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
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
          // A line is a skills category if it starts with bullet OR we're in Technical Skills section with a colon
          const isSkillsCategory = (line.startsWith('·') || line.startsWith('•')) || 
                                  (isTechnicalSkillsSection && colonIndex !== -1 && colonIndex < 50);
          
        if (isSkillsCategory && colonIndex !== -1) {
          // Split category name and skills text, render category name in bold
          const bulletSymbol = PDF_BULLET;
          const bulletSize = bodySize * PDF_BULLET_SIZE_MULTIPLIER;
          const bulletWidth = font.widthOfTextAtSize(bulletSymbol + '   ', bulletSize);
            
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
              const cornerSize = 30;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              context.page.drawRectangle({
                x: PAGE_WIDTH - cornerSize,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              y = PAGE_HEIGHT - 72;
            }
            
          context.page.drawText(bulletSymbol, { 
            x: currentX, 
            y, 
            size: bulletSize, 
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
                  const cornerSize = 30;
                  context.page.drawRectangle({
                    x: 0,
                    y: PAGE_HEIGHT - cornerSize,
                    width: cornerSize,
                    height: cornerSize,
                    color: FOREST_GREEN,
                  });
                  context.page.drawRectangle({
                    x: PAGE_WIDTH - cornerSize,
                    y: PAGE_HEIGHT - cornerSize,
                    width: cornerSize,
                    height: cornerSize,
                    color: FOREST_GREEN,
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
          } else {
            // For experience bullets and other content, add bullets if needed
            const hasBullet = /^[\-\·•]\s/.test(line);
            const bulletSymbol = PDF_BULLET;
            const bulletSize = bodySize * PDF_BULLET_SIZE_MULTIPLIER;
            const bulletWidth = font.widthOfTextAtSize(bulletSymbol + '   ', bulletSize);
            
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
                const cornerSize = 30;
                context.page.drawRectangle({
                  x: 0,
                  y: PAGE_HEIGHT - cornerSize,
                  width: cornerSize,
                  height: cornerSize,
                  color: FOREST_GREEN,
                });
                context.page.drawRectangle({
                  x: PAGE_WIDTH - cornerSize,
                  y: PAGE_HEIGHT - cornerSize,
                  width: cornerSize,
                  height: cornerSize,
                  color: FOREST_GREEN,
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
                    size: bulletSize,
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
      const cornerSize = 30;
      context.page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - cornerSize,
        width: cornerSize,
        height: cornerSize,
        color: FOREST_GREEN,
      });
      context.page.drawRectangle({
        x: PAGE_WIDTH - cornerSize,
        y: PAGE_HEIGHT - cornerSize,
        width: cornerSize,
        height: cornerSize,
        color: FOREST_GREEN,
      });
      y = PAGE_HEIGHT - 72;
    }
  }
  
  return y;
}

// REFINED CORNER ACCENT TEMPLATE - Elegant design with corner accents and forest green
export async function renderTemplate4(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, headline, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const FOREST_GREEN = rgb(0.2, 0.4, 0.3); // Forest green accent color
  
  const MARGIN_TOP = 80;
  const MARGIN_BOTTOM = 50;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 30;
  const CONTACT_SIZE = 9.5;
  const SECTION_HEADER_SIZE = 14;
  const BODY_SIZE = 9.5;
  
  // Draw corner accents (top-left and top-right)
  const cornerSize = 30;
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - cornerSize,
    width: cornerSize,
    height: cornerSize,
    color: FOREST_GREEN,
  });
  page.drawRectangle({
    x: PAGE_WIDTH - cornerSize,
    y: PAGE_HEIGHT - cornerSize,
    width: cornerSize,
    height: cornerSize,
    color: FOREST_GREEN,
  });
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Name (centered, forest green, elegant)
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
        color: FOREST_GREEN 
      });
      y -= NAME_SIZE * 0.9;
    }
    // Headline (under name, centered, medium gray)
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
      y -= 5;
    } else {
      y -= 5;
    }
  }
  
  // Contact info (centered, elegant spacing)
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
      y -= CONTACT_SIZE * 1.4;
    }
    y -= 10;
  }
  
  // Elegant divider line
  page.drawLine({
    start: { x: left + 40, y: y },
    end: { x: right - 40, y: y },
    thickness: 1,
    color: FOREST_GREEN,
  });
  y -= 28;
  
  // Render body content
  y = renderBodyContentTemplate4(
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
