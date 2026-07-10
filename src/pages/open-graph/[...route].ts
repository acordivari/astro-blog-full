import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';

// Generates a 1200x630 social share card for every page on the site.
// BaseLayout derives each page's og:image URL from its pathname
// (/journal/foo -> /open-graph/journal/foo.png), so the keys here must
// mirror the site's route structure.

interface CardData {
  title: string;
  description: string;
}

const sections = {
  journal: 'Journal',
  reflections: 'Reflections',
  learning: 'Learning & Projects',
  movement: 'Movement',
  reviews: 'Reviews',
  fabrics: 'Fabrics',
} as const;

const pages: Record<string, CardData> = {
  index: {
    title: 'Andrew Cordivari',
    description: 'Intersections of life, technology, nature, and awareness.',
  },
  about: { title: 'About', description: 'thisisandrew.me' },
  birds: { title: 'Birds of Prey', description: 'Raptor sightings near Boulder, Colorado · thisisandrew.me' },
  music: { title: 'Music', description: 'Recent listens, mixes, and sounds · thisisandrew.me' },
};

// journal and reflections exclude drafts from their detail routes; the other
// sections render every entry. Mirror that so every page has a card.
const draftFiltered = new Set(['journal', 'reflections']);

for (const [name, label] of Object.entries(sections)) {
  pages[name] = { title: label, description: 'thisisandrew.me' };
  const entries = await getCollection(
    name as keyof typeof sections,
    draftFiltered.has(name) ? ({ data }) => !data.draft : undefined
  );
  for (const entry of entries) {
    pages[`${name}/${entry.slug}`] = {
      title: entry.data.title,
      description: `${label} · thisisandrew.me`,
    };
  }
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getSlug: (path) => `${path}.png`,
  getImageOptions: (_path, page: CardData) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[247, 244, 236]],
    border: { color: [51, 124, 71], width: 24, side: 'inline-start' },
    padding: 80,
    font: {
      title: {
        families: ['Fraunces'],
        weight: 'Light',
        size: 64,
        lineHeight: 1.2,
        color: [33, 36, 29],
      },
      description: {
        families: ['Inter'],
        size: 30,
        lineHeight: 1.5,
        color: [94, 102, 82],
      },
    },
    fonts: [
      'https://api.fontsource.org/v1/fonts/fraunces/latin-300-normal.ttf',
      'https://api.fontsource.org/v1/fonts/inter/latin-400-normal.ttf',
    ],
  }),
});
