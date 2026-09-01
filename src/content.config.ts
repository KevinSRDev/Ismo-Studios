import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const fotos = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/fotos' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string().default('Name'),
      alt: z.string().optional(),
      slider: z.enum(['s1', 's2', 's3']),
      orden: z.number().int().positive(),
      imagen: image(),
    }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/videos' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      alt: z.string().optional(),
      video: z.string(),
      thumb: image(),
    }),
});

export const collections = { fotos, videos };
