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
  baselineFitsAboveBottomMargin,
  RESUME_PAGE_BOTTOM_MARGIN,
} from '../utils';

// Template 2 Body Content Renderer - Structured style with top/bottom borders
function renderBodyContentTemplate2(
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
  const BURGUNDY = rgb(0.5, 0.1, 0.2); // Burgundy/wine red accent
  const LIGHT_BURGUNDY = rgb(0.98, 0.95, 0.96); // Light burgundy background
  
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
      y -= 16;
      const sectionHeader = line.endsWith(':') ? line.slice(0, -1).trim() : line.trim();
      currentSection = sectionHeader.toLowerCase();
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 30);
      
      for (const sectionLine of sectionLines) {
        if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          // Draw top and bottom borders on new pages
          context.page.drawRectangle({
            x: 0,
            y: PAGE_HEIGHT - 15,
            width: PAGE_WIDTH,
            height: 15,
            color: BURGUNDY,
          });
          context.page.drawRectangle({
            x: 0,
            y: 0,
            width: PAGE_WIDTH,
            height: 15,
            color: BURGUNDY,
          });
          y = PAGE_HEIGHT - 72;
        }
        
        // Section header with burgundy background box
        const textWidth = fontBold.widthOfTextAtSize(sectionLine, sectionHeaderSize);
        const boxPadding = 5;
        const boxWidth = textWidth + (boxPadding * 2);
        const boxHeight = sectionHeaderSize + (boxPadding * 2);
        
        // Background box
        context.page.drawRectangle({
          x: left,
          y: y - boxPadding,
          width: boxWidth,
          height: boxHeight,
          color: LIGHT_BURGUNDY,
        });
        
        // Border around box (draw lines for border)
        const boxX = left;
        const boxY = y - boxPadding;
        // Top border
        context.page.drawLine({
          start: { x: boxX, y: boxY + boxHeight },
          end: { x: boxX + boxWidth, y: boxY + boxHeight },
          thickness: 1,
          color: BURGUNDY,
        });
        // Bottom border
        context.page.drawLine({
          start: { x: boxX, y: boxY },
          end: { x: boxX + boxWidth, y: boxY },
          thickness: 1,
          color: BURGUNDY,
        });
        // Left border
        context.page.drawLine({
          start: { x: boxX, y: boxY },
          end: { x: boxX, y: boxY + boxHeight },
          thickness: 1,
          color: BURGUNDY,
        });
        // Right border
        context.page.drawLine({
          start: { x: boxX + boxWidth, y: boxY },
          end: { x: boxX + boxWidth, y: boxY + boxHeight },
          thickness: 1,
          color: BURGUNDY,
        });
        
        // Section header text
        context.page.drawText(sectionLine, { 
          x: left + boxPadding, 
          y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: BURGUNDY 
        });
        
        y -= boxHeight + 8;
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
            y -= 14;
          }
          firstJob = false;
          
          // Job title (bold, burgundy)
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 2, contentWidth - 20);
          for (const titleLine of titleLines) {
            if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - 15,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, titleLine, left + 20, y, font, fontBold, bodySize + 2, BURGUNDY);
            y -= bodyLineHeight + 2;
          }
          
          // Company and period
          const formattedPeriod = formatDate(period.trim());
          // Display: "CompanyName, CompanyLocation  |  Period" (or just "CompanyName  |  Period" if no location)
          const companyInfo = companyLocation ? `${companyName}  |  ${companyLocation}` : companyName;
          const companyPeriodLine = `${companyInfo}  |  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 20);
          for (const line of companyPeriodLines) {
            if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - 15,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, line, left + 20, y, font, fontBold, bodySize, MEDIUM_GRAY);
            y -= bodyLineHeight;
          }
          
          y -= 8;
        }
      } else {
        if (currentSection === 'education') {
          const edu = parseEducationThreePartLine(line);
          if (edu) {
            const ensurePageSpace = () => {
              if (baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) return;
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - 15,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
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
              mutedColor: COLORS.MEDIUM_GRAY,
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
            if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - 15,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              y = PAGE_HEIGHT - 72;
            }
            
            drawTextWithBold(context.page, lineText, left + 20, y, font, fontBold, bodySize, BLACK);
            y -= bodyLineHeight;
          }
        } else {
          // Distinguish skill categories from experience bullets
          // Skill categories have pattern: "• Category Name: skills list"
          // Experience bullets are full sentences without this pattern
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
          // Keep the bullet/dot prefix
          const bulletSymbol = PDF_BULLET;
          const bulletSize = bodySize * PDF_BULLET_SIZE_MULTIPLIER;
          const bulletWidth = font.widthOfTextAtSize(bulletSymbol + '   ', bulletSize);
          
          // Extract category name (part before colon) and skills (part after colon)
          const colonIndex = lineWithoutBullet.indexOf(':');
          if (colonIndex !== -1) {
            const categoryName = lineWithoutBullet.substring(0, colonIndex + 1).trim(); // Include the colon
            const skillsText = lineWithoutBullet.substring(colonIndex + 1).trim();
            
            // Calculate available width for skills (after category name and bullet)
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
            
            // Draw bullet dot, category name in bold, and skills on same/next lines
            let currentX = left + 20;
            
            if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - 15,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              y = PAGE_HEIGHT - 72;
            }
            
            // Draw bullet dot (regular font, not bold)
            context.page.drawText(bulletSymbol, { 
              x: currentX, 
              y, 
              size: bulletSize, 
              font, 
              color: BLACK 
            });
            
            // Draw category name in bold (after bullet)
            currentX += bulletWidth;
            context.page.drawText(categoryName, { 
              x: currentX, 
              y, 
              size: bodySize, 
              font: fontBold, 
              color: BLACK 
            });
            
            // Draw skills text on same line or wrapped to next lines
            if (wrappedSkills.length > 0 && wrappedSkills[0]) {
              currentX += categoryWidth + spaceWidth;
              context.page.drawText(wrappedSkills[0], {
                x: currentX,
                y,
                size: bodySize,
                font,
                color: BLACK
              });
              
              // Draw remaining wrapped lines (indented to align with skills, after bullet)
              for (let i = 1; i < wrappedSkills.length; i++) {
                y -= bodyLineHeight;
                if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
                  context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                  context.page.drawRectangle({
                    x: 0,
                    y: PAGE_HEIGHT - 15,
                    width: PAGE_WIDTH,
                    height: 15,
                    color: BURGUNDY,
                  });
                  context.page.drawRectangle({
                    x: 0,
                    y: 0,
                    width: PAGE_WIDTH,
                    height: 15,
                    color: BURGUNDY,
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
            // Fallback: if no colon, keep the dot and display category name
            const categoryName = lineWithoutBullet;
            const categoryLines = wrapText(categoryName, font, bodySize + 1, contentWidth - 30);
            
            // Draw bullet dot first
            const bulletSymbol = '';
            const bulletWidth = font.widthOfTextAtSize(bulletSymbol, bodySize);
            
            for (let lineIdx = 0; lineIdx < categoryLines.length; lineIdx++) {
              if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
                context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                context.page.drawRectangle({
                  x: 0,
                  y: PAGE_HEIGHT - 15,
                  width: PAGE_WIDTH,
                  height: 15,
                  color: BURGUNDY,
                });
                context.page.drawRectangle({
                  x: 0,
                  y: 0,
                  width: PAGE_WIDTH,
                  height: 15,
                  color: BURGUNDY,
                });
                y = PAGE_HEIGHT - 72;
              }
              
              // Draw bullet only on first line
              if (lineIdx === 0) {
                context.page.drawText(bulletSymbol, { 
                  x: left + 20, 
                  y, 
                  size: bodySize, 
                  font, 
                  color: BLACK 
                });
                // Draw category name after bullet
                context.page.drawText(categoryLines[lineIdx], { 
                  x: left + 20 + bulletWidth + 4, 
                  y, 
                  size: bodySize + 1, 
                  font: fontBold, 
                  color: BLACK 
                });
              } else {
                // Subsequent lines without bullet, just indented
                context.page.drawText(categoryLines[lineIdx], { 
                  x: left + 20 + bulletWidth + 4, 
                  y, 
                  size: bodySize + 1, 
                  font: fontBold, 
                  color: BLACK 
                });
              }
              y -= bodyLineHeight + 2;
            }
          }
          } else {
            // Experience section bullets - ensure visible dot and proper formatting
            // Check if line already has a bullet
            const hasBullet = /^[\-\·•]\s/.test(line);
            const bulletSymbol = PDF_BULLET;
            const bulletSize = bodySize * PDF_BULLET_SIZE_MULTIPLIER;
            const bulletWidth = font.widthOfTextAtSize(bulletSymbol + '   ', bulletSize);
            
            let textToWrap = line;
            if (!hasBullet) {
              // Add bullet if not present
              textToWrap = bulletSymbol + '   ' + line;
            }
            
            const wrapped = wrapTextWithIndent(textToWrap, font, bodySize, contentWidth - 20);
            
            // Calculate the content start position (after bullet) to align all wrapped lines
            let contentStartX = left + 20 + bulletWidth;
            
            for (let i = 0; i < wrapped.lines.length; i++) {
              if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
                context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                context.page.drawRectangle({
                  x: 0,
                  y: PAGE_HEIGHT - 15,
                  width: PAGE_WIDTH,
                  height: 15,
                  color: BURGUNDY,
                });
                context.page.drawRectangle({
                  x: 0,
                  y: 0,
                  width: PAGE_WIDTH,
                  height: 15,
                  color: BURGUNDY,
                });
                y = PAGE_HEIGHT - 72;
              }
              
              const lineText = wrapped.lines[i];
              
              // Check if line starts with bullet and draw it separately (not bold)
              if (i === 0 && (lineText.startsWith('•') || lineText.startsWith('·') || lineText.startsWith('-'))) {
                const bulletMatch = lineText.match(/^([\-\·•])\s*(.*)/);
                if (bulletMatch) {
                  const [, bulletChar, content] = bulletMatch;
                  // Draw bullet in regular font (not bold)
                  const bulletX = left + 20;
                  context.page.drawText(bulletChar, {
                    x: bulletX,
                    y,
                    size: bulletSize,
                    font,
                    color: BLACK
                  });
                  // Draw content - support **bold** markers but default to regular font
                  contentStartX = bulletX + font.widthOfTextAtSize(bulletChar + '   ', bodySize);
                  drawTextWithBold(context.page, content, contentStartX, y, font, fontBold, bodySize, BLACK);
                } else {
                  // No bullet match, draw entire line with bold support
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
    
    if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
      context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      context.page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - 15,
        width: PAGE_WIDTH,
        height: 15,
        color: BURGUNDY,
      });
      context.page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: 15,
        color: BURGUNDY,
      });
      y = PAGE_HEIGHT - 72;
    }
  }
  
  return y;
}

// STRUCTURED TEMPLATE - Top and bottom borders with asymmetric layout
export async function renderTemplate2(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, headline, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const BURGUNDY = rgb(0.5, 0.1, 0.2); // Burgundy/wine red accent color
  const LIGHT_BURGUNDY = rgb(0.98, 0.95, 0.96); // Light burgundy background
  
  const MARGIN_TOP = 50;
  const MARGIN_BOTTOM = 60; // Extra space for bottom border
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 28;
  const CONTACT_SIZE = 9;
  const SECTION_HEADER_SIZE = 13;
  const BODY_SIZE = 9.5;

  // Draw bottom border
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: 15,
    color: BURGUNDY,
  });
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Name positioned on the right side (asymmetric layout)
  if (name) {
    const nameLines = wrapText(name, fontBold, NAME_SIZE, CONTENT_WIDTH * 0.6);
    for (const line of nameLines) {
      const textWidth = fontBold.widthOfTextAtSize(line, NAME_SIZE);
      // Right-align the name
      const actualX = right - textWidth;
      page.drawText(line, { 
        x: actualX, 
        y, 
        size: NAME_SIZE, 
        font: fontBold, 
        color: BURGUNDY 
      });
      y -= NAME_SIZE * 0.85;
    }
    y += 6;
    
    // Headline (under name, right-aligned, medium gray)
    if (headline) {
      const headlineSize = 12;
      const headlineLines = wrapText(headline, font, headlineSize, CONTENT_WIDTH * 0.6);
      for (const line of headlineLines) {
        const textWidth = font.widthOfTextAtSize(line, headlineSize);
        const actualX = right - textWidth;
        page.drawText(line, { 
          x: actualX, 
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
  
  // Contact info positioned on the left side (asymmetric)
  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  •  ');
    const contactLines = wrapText(contactLine, font, CONTACT_SIZE, CONTENT_WIDTH * 0.6);
    for (const line of contactLines) {
      page.drawText(line, { 
        x: left, 
        y, 
        size: CONTACT_SIZE, 
        font, 
        color: MEDIUM_GRAY 
      });
      y -= CONTACT_SIZE * 1.3;
    }
    y -= 10;
  }
  
  // Decorative burgundy line separator
  const separatorY = y;
  page.drawLine({
    start: { x: left, y: separatorY },
    end: { x: right, y: separatorY },
    thickness: 1.5,
    color: BURGUNDY,
  });
  y -= 24;
  
  // Render body content
  y = renderBodyContentTemplate2(
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
