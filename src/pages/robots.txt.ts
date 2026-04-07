import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';
  const isProduction = siteUrl.includes('www.winter-prosper.com');

  const body = isProduction
    ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml`
    : `User-agent: *\nDisallow: /`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
