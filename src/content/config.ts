import { defineCollection, z } from 'astro:content';

const steps = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
  }),
});

const docs = defineCollection({
  type: 'content',
});

export const collections = {
  steps,
  docs,
};
