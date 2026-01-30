// Brand configuration with display names and URL-safe slugs
export const brands = {
  'acronym': 'Acronym',
  'arcteryx': "Arc'teryx",
  'devoa': 'Devoa',
  'enfin-leve': 'Enfin Leve',
  'eyn-vas': 'EŸN VAS',
  'goldwin': 'Goldwin',
  'iron-heart': 'Iron Heart',
  'outlier': 'Outlier',
  'rick-owens': 'Rick Owens',
  'samurai': 'Samurai',
  'the-viridi-anne': 'The Viridi Anne',
  'veilance': 'Veilance',
  'vollebak': 'Vollebak',
} as const;

export type BrandSlug = keyof typeof brands;
export type BrandName = (typeof brands)[BrandSlug];

export function getBrandSlug(name: string): BrandSlug | undefined {
  const entry = Object.entries(brands).find(([_, displayName]) => displayName === name);
  return entry ? (entry[0] as BrandSlug) : undefined;
}

export function getBrandName(slug: string): BrandName | undefined {
  return brands[slug as BrandSlug];
}

export const brandSlugs = Object.keys(brands) as BrandSlug[];
export const brandNames = Object.values(brands) as BrandName[];
