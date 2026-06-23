import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/products' }),
  schema: z.object({
    title: z.string(),
    image: z.string(),
    category: z.string(),
    store: z.string(),
    tags: z.array(z.string()).default([]),
    code: z.string().default(''),
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    boost: z.boolean().default(false),
  }),
});

const stores = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/stores' }),
  schema: z.object({
    name: z.string(),
    images: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    address: z.string().default(''),
    phone: z.string().default(''),
    wechat: z.string().default(''),
    closed: z.boolean().default(false),
    floor: z.string().default(''),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { products, stores, pages };