export interface ARProductMapping {
  slug: string;
  modelName: string;
  type: 'hat' | 'glasses';
}

export const AR_PRODUCT_MAPPINGS: ARProductMapping[] = [
  // Hat products
  { slug: 'hat-1', modelName: 'hat_1', type: 'hat' },
  { slug: 'hat-2', modelName: 'hat_2', type: 'hat' },
  { slug: 'hat-3', modelName: 'hat_3', type: 'hat' },
  { slug: 'hat-4', modelName: 'hat_4', type: 'hat' },
  { slug: 'hat-5', modelName: 'hat_5', type: 'hat' },
  { slug: 'hat-6', modelName: 'hat_6', type: 'hat' },
  { slug: 'hat-7', modelName: 'hat_7', type: 'hat' },
  { slug: 'hat-8', modelName: 'hat_8', type: 'hat' },
  // Glasses products
  { slug: 'glasses-1', modelName: 'glasses_1', type: 'glasses' },
  { slug: 'glasses-2', modelName: 'glasses_2', type: 'glasses' },
  { slug: 'glasses-3', modelName: 'glasses_3', type: 'glasses' },
  { slug: 'glasses-4', modelName: 'glasses_4', type: 'glasses' },
  { slug: 'glasses-5', modelName: 'glasses_5', type: 'glasses' },
  { slug: 'glasses-6', modelName: 'glasses_6', type: 'glasses' },
  { slug: 'glasses-7', modelName: 'glasses_7', type: 'glasses' },
  { slug: 'glasses-8', modelName: 'glasses_8', type: 'glasses' },
];

const slugToModelMap = new Map<string, ARProductMapping>();
const modelToSlugMap = new Map<string, ARProductMapping>();

AR_PRODUCT_MAPPINGS.forEach(mapping => {
  slugToModelMap.set(mapping.slug, mapping);
  modelToSlugMap.set(mapping.modelName, mapping);
});

export function getModelNameBySlug(slug: string): string | null {
  const mapping = slugToModelMap.get(slug);
  return mapping ? mapping.modelName : null;
}

export function getSlugByModelName(modelName: string): string | null {
  const mapping = modelToSlugMap.get(modelName);
  return mapping ? mapping.slug : null;
}

export function getMappingBySlug(slug: string): ARProductMapping | null {
  return slugToModelMap.get(slug) || null;
}

export function getMappingByModelName(modelName: string): ARProductMapping | null {
  return modelToSlugMap.get(modelName) || null;
}

export function isARSupportedSlug(slug: string): boolean {
  return /^(hat|glasses)-[1-8]$/.test(slug);
}

export function getARTryOnUrl(slug: string): string | null {
  if (isARSupportedSlug(slug)) {
    return `/products/ar/try-on/${slug}`;
  }
  return null;
}

export function getProductUrl(slug: string): string {
  return `/products/${slug}`;
}
