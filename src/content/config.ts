import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    heroImage: z.string().optional(),
    pinned: z.boolean().optional().default(false),
  }),
});

const notes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    link: z.string().url().optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    year: z.number(),
    tags: z.array(z.string()).optional(),
    url: z.string().url().optional(),
    status: z.enum(['active', 'paused', 'archived']).default('active'),
  }),
});

const talks = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    event: z.string(),
    location: z.string().optional(),
    url: z.string().url().optional(),
    slides: z.string().url().optional(),
  }),
});

const digest = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    type: z.string(),
    created: z.coerce.string(),
    updated: z.coerce.string(),
    sources: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog, notes, projects, talks, digest };
