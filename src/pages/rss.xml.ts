import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { excerpt } from '../utils/excerpt';

const published = ({ data }: { data: { draft: boolean } }) => !data.draft;

export async function GET(context: APIContext) {
  const sections = ['reflections', 'learning', 'movement', 'reviews', 'fabrics'] as const;

  const items = (
    await Promise.all(
      sections.map(async (section) =>
        (await getCollection(section, published)).map((entry) => ({
          title: entry.data.title,
          description: entry.data.description,
          pubDate: entry.data.publishDate,
          link: `/${section}/${entry.slug}/`,
        }))
      )
    )
  ).flat();

  const journal = await getCollection('journal', published);
  items.push(
    ...journal.map((entry) => ({
      title: entry.data.title,
      description: excerpt(entry.body),
      pubDate: entry.data.date,
      link: `/journal/${entry.slug}/`,
    }))
  );

  items.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'Andrew Cordivari',
    description:
      'Writing at the intersections of life, technology, nature, and awareness — engineering journal, projects, essays, and reviews.',
    site: context.site!,
    items,
  });
}
