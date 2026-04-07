import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

const SITE_URL = process.env.SITE_URL || 'https://www.winter-prosper.com';

export default defineConfig({
  site: SITE_URL,
  integrations: [mdx(), tailwind()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
