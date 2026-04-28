import { TemplateContext } from '../utils';
import { renderVariantTemplate } from './renderVariantTemplate';

export async function renderTemplate13(context: TemplateContext): Promise<Uint8Array> {
  return renderVariantTemplate(context, {
    kind: 'emerald',
    emeraldPlainStyle: true,
    nameSize: 24,
    headlineSize: 10.8,
    contactSize: 8.6,
    sectionHeaderSize: 10.2,
    bodySize: 9.45,
    marginBottom: 48,
    marginLeft: 36,
    marginRight: 36,
    headerHeight: 112,
  });
}
