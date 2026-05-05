import { TemplateContext, RESUME_TEMPLATES_11_15_WORD_GAP_PT } from '../utils';
import { renderVariantTemplate } from './renderVariantTemplate';

export async function renderTemplate14(context: TemplateContext): Promise<Uint8Array> {
  return renderVariantTemplate(context, {
    kind: 'mono',
    nameSize: 24.85,
    headlineSize: 11.2,
    contactSize: 9.05,
    sectionHeaderSize: 10.15,
    bodySize: 9.75,
    marginBottom: 48,
    marginLeft: 34,
    marginRight: 34,
    /** Taller header so wrapped contact (2–3 lines) + headline stay above the rule. */
    headerHeight: 132,
    wordGapExtra: RESUME_TEMPLATES_11_15_WORD_GAP_PT,
  });
}
