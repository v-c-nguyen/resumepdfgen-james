import { TemplateContext } from '../utils';
import { renderVariantTemplate } from './renderVariantTemplate';

export async function renderTemplate14(context: TemplateContext): Promise<Uint8Array> {
  return renderVariantTemplate(context, {
    kind: 'mono',
    nameSize: 24,
    headlineSize: 10.8,
    contactSize: 8.7,
    sectionHeaderSize: 9.8,
    bodySize: 9.4,
    marginBottom: 48,
    marginLeft: 34,
    marginRight: 34,
    /** Taller header so wrapped contact (2–3 lines) + headline stay above the rule. */
    headerHeight: 132,
  });
}
