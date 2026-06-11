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

// Template 6 Body Content Renderer - Modern style with left accent bar
function renderBodyContentTemplate3(
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
  const INDIGO = rgb(0.25, 0.3, 0.6); // Indigo accent color
  const LIGHT_INDIGO = rgb(0.96, 0.97, 0.99); // Light indigo background
  
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
      y -= 18;
      const sectionHeader = line.endsWith(':') ? line.slice(0, -1).trim() : line.trim();
      currentSection = sectionHeader.toLowerCase();
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 50);
      
      for (const sectionLine of sectionLines) {
        if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          // Draw left accent bar on new pages
          context.page.drawRectangle({
            x: 0,
            y: 0,
            width: 12,
            height: PAGE_HEIGHT,
            color: INDIGO,
          });
          y = PAGE_HEIGHT - 72;
        }
        
        // Section header with left indigo accent line
        const accentLineHeight = sectionHeaderSize + 4;
        context.page.drawRectangle({
          x: left - 8,
          y: y - 2,
          width: 4,
          height: accentLineHeight,
          color: INDIGO,
        });
        
        // Section header text
        context.page.drawText(sectionLine, { 
          x: left, 
          y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: BLACK 
        });
        
        y -= sectionLineHeight + 6;
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
          
          // Job title (bold, indigo)
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 2, contentWidth - 30);
          for (const titleLine of titleLines) {
            if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: 12,
                height: PAGE_HEIGHT,
                color: INDIGO,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, titleLine, left + 30, y, font, fontBold, bodySize + 2, INDIGO);
            y -= bodyLineHeight + 2;
          }
          
          // Company and period
          const formattedPeriod = formatDate(period.trim());
          // Display: "CompanyName, CompanyLocation  •  Period" (or just "CompanyName  •  Period" if no location)
          const companyInfo = companyLocation ? `${companyName}  •  ${companyLocation}` : companyName;
          const companyPeriodLine = `${companyInfo}  •  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 30);
          for (const line of companyPeriodLines) {
            if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: 12,
                height: PAGE_HEIGHT,
                color: INDIGO,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, line, left + 30, y, font, fontBold, bodySize, MEDIUM_GRAY);
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
                y: 0,
                width: 12,
                height: PAGE_HEIGHT,
                color: INDIGO,
              });
              y = PAGE_HEIGHT - 72;
            };
            y = drawEducationTwoRows({
              page: context.page,
              ensurePageSpace,
              textLeft: left + 30,
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
              degreeWrapSubtract: 30,
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
          const wrapped = wrapText(lineWithoutBullet, font, bodySize, contentWidth - 30);
          
          for (const lineText of wrapped) {
            if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: 12,
                height: PAGE_HEIGHT,
                color: INDIGO,
              });
              y = PAGE_HEIGHT - 72;
            }
            
            drawTextWithBold(context.page, lineText, left + 30, y, font, fontBold, bodySize, BLACK);
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
              bodyInsetLeft: 30,
              contentWidth,
              bodyInnerSubtract: 30,
              bulletWidth,
              categoryWidth,
              spaceWidth,
            });
            
            let currentX = left + 30;
            
            if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: 12,
                height: PAGE_HEIGHT,
                color: INDIGO,
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
                if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
                  context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                  context.page.drawRectangle({
                    x: 0,
                    y: 0,
                    width: 12,
                    height: PAGE_HEIGHT,
                    color: INDIGO,
                  });
                  y = PAGE_HEIGHT - 72;
                }
                context.page.drawText(wrappedSkills[i], {
                  x: left + 30 + bulletWidth,
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
            
            const wrapped = wrapTextWithIndent(textToWrap, font, bodySize, contentWidth - 30);
            
            // Calculate the content start position (after bullet) to align all wrapped lines
            let contentStartX = left + 30 + bulletWidth;
            
            for (let i = 0; i < wrapped.lines.length; i++) {
              if (!baselineFitsAboveBottomMargin(y, marginBottom, bodyLineHeight)) {
                context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                context.page.drawRectangle({
                  x: 0,
                  y: 0,
                  width: 12,
                  height: PAGE_HEIGHT,
                  color: INDIGO,
                });
                y = PAGE_HEIGHT - 72;
              }
              
              const lineText = wrapped.lines[i];
              
              if (i === 0 && (lineText.startsWith('•') || lineText.startsWith('·') || lineText.startsWith('-'))) {
                const bulletMatch = lineText.match(/^([\-\·•])\s*(.*)/);
                if (bulletMatch) {
                  const [, bulletChar, content] = bulletMatch;
                  const bulletX = left + 30;
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
                  drawTextWithBold(context.page, lineText, left + 30, y, font, fontBold, bodySize, BLACK);
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
        y: 0,
        width: 12,
        height: PAGE_HEIGHT,
        color: INDIGO,
      });
      y = PAGE_HEIGHT - 72;
    }
  }
  
  return y;
}

// MODERN ACCENT BAR TEMPLATE - Left vertical accent bar with indigo color scheme
export async function renderTemplate3(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, headline, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const INDIGO = rgb(0.25, 0.3, 0.6); // Indigo accent color
  const LIGHT_INDIGO = rgb(0.96, 0.97, 0.99); // Light indigo background
  
  const MARGIN_TOP = 70;
  const MARGIN_BOTTOM = RESUME_PAGE_BOTTOM_MARGIN;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 26;
  const CONTACT_SIZE = 9.5;
  const SECTION_HEADER_SIZE = 14;
  const BODY_SIZE = 9.5;
  
  // Draw left vertical accent bar
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 10,
    height: PAGE_HEIGHT,
    color: INDIGO,
  });
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Header section with light indigo background
  const headerHeight = 100;
  const headerY = PAGE_HEIGHT - headerHeight;
  page.drawRectangle({
    x: 12, // Start after accent bar
    y: headerY,
    width: PAGE_WIDTH - 12,
    height: headerHeight,
    color: LIGHT_INDIGO,
  });
  
  // Name in header (left-aligned, indigo)
  if (name) {
    const nameLines = wrapText(name, fontBold, NAME_SIZE, CONTENT_WIDTH);
    let nameY = PAGE_HEIGHT - 40;
    for (const line of nameLines) {
      page.drawText(line, { 
        x: left, 
        y: nameY, 
        size: NAME_SIZE, 
        font: fontBold, 
        color: INDIGO 
      });
      nameY -= NAME_SIZE * 0.9;
    }
    
    
    // Headline (under name, left-aligned, medium gray)
    if (headline) {
      const headlineSize = 12;
      const headlineLines = wrapText(headline, font, headlineSize, CONTENT_WIDTH);
      for (const line of headlineLines) {
        page.drawText(line, { 
          x: left, 
          y: nameY, 
          size: headlineSize, 
          font, 
          color: MEDIUM_GRAY 
        });
        nameY -= headlineSize * 1.2;
      }
    }
  }
  
  // Contact info in header (below name)
  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  |  ');
    const contactLines = wrapText(contactLine, font, CONTACT_SIZE, CONTENT_WIDTH);
    let contactY = PAGE_HEIGHT - 80;
    for (const line of contactLines) {
      page.drawText(line, { 
        x: left, 
        y: contactY, 
        size: CONTACT_SIZE, 
        font, 
        color: MEDIUM_GRAY 
      });
      contactY -= CONTACT_SIZE * 1.3;
    }
  }
  
  // Start body content below header
  y = PAGE_HEIGHT - headerHeight - 30;
  
  // Render body content
  y = renderBodyContentTemplate3(
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
