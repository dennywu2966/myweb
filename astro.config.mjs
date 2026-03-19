import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

const BASE_PATH = process.env.BASE_PATH || '/staging';

export default defineConfig({
  site: BASE_PATH === '/staging' 
    ? 'https://www.winter-prosper.com/staging' 
    : 'https://www.winter-prosper.com',
  base: BASE_PATH,
  integrations: [
    mdx(),
    tailwind()
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});