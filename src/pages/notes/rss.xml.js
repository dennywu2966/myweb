import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '@/lib/config';

export async function GET(context) {
  const notes = (await getCollection('notes'))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: `${siteConfig.title} - Notes`,
    description: '记录正在学习、判断、试验和还没长成正式文章的东西。',
    site: context.site,
    items: notes.map((note) => ({
      title: note.data.title || `Note ${note.data.date.toISOString().split('T')[0]}`,
      pubDate: note.data.date,
      description: note.body,
      link: `/notes/${note.slug}/`,
    })),
    customData: `<language>zh-cn</language>`,
  });
}
