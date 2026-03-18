import { getCollection } from 'astro:content';

export async function GET(context) {
  const blogPosts = await getCollection('blog');
  const notes = await getCollection('notes');
  const projects = await getCollection('projects');

  const siteUrl = context.site.toString().replace(/\/$/, '');

  const staticPages = [
    { url: siteUrl, lastmod: new Date(), priority: '1.0' },
    { url: `${siteUrl}/about`, lastmod: new Date(), priority: '0.8' },
    { url: `${siteUrl}/blog`, lastmod: new Date(), priority: '0.8' },
    { url: `${siteUrl}/archive`, lastmod: new Date(), priority: '0.7' },
    { url: `${siteUrl}/projects`, lastmod: new Date(), priority: '0.7' },
    { url: `${siteUrl}/talks`, lastmod: new Date(), priority: '0.7' },
    { url: `${siteUrl}/notes`, lastmod: new Date(), priority: '0.8' },
    { url: `${siteUrl}/uses`, lastmod: new Date(), priority: '0.5' },
    { url: `${siteUrl}/now`, lastmod: new Date(), priority: '0.5' },
  ];

  const blogPages = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastmod: post.data.updatedDate || post.data.pubDate,
    priority: '0.9',
  }));

  const notePages = notes.map((note) => ({
    url: `${siteUrl}/notes/${note.slug}`,
    lastmod: note.data.date,
    priority: '0.6',
  }));

  const projectPages = projects.map((project) => ({
    url: `${siteUrl}/projects`,
    lastmod: new Date(project.data.year, 0, 1),
    priority: '0.6',
  }));

  const allPages = [...staticPages, ...blogPages, ...notePages, ...projectPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod.toISOString().split('T')[0]}</lastmod>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}