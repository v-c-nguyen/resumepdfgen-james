/** Bundled PDF template ids — must match `app/api/generate-dynamic-resume-pdf/templates/template{N}.ts`. */
export const PDF_TEMPLATE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

export type PdfTemplateId = (typeof PDF_TEMPLATE_IDS)[number];
