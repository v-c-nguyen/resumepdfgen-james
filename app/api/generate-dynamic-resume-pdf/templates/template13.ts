import { TemplateContext, RESUME_TEMPLATES_11_15_WORD_GAP_PT } from '../utils';
import { renderVariantTemplate } from './renderVariantTemplate';

export async function renderTemplate13(context: TemplateContext): Promise<Uint8Array> {
  return renderVariantTemplate(context, {
    kind: 'emerald',
    emeraldPlainStyle: true,
    nameSize: 24.85,
    headlineSize: 11.2,
    contactSize: 8.95,
    sectionHeaderSize: 10.55,
    bodySize: 9.8,
    marginBottom: 48,
    marginLeft: 36,
    marginRight: 36,
    headerHeight: 112,
    wordGapExtra: RESUME_TEMPLATES_11_15_WORD_GAP_PT,
  });
}
