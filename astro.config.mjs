// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// Support SITE_BASE env var for deploying to subdirectories
const base = process.env.SITE_BASE || '/';

// https://astro.build/config
export default defineConfig({
  base,
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});