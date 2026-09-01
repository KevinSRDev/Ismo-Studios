import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://KevinSRDev.github.io',
  base: '/Ismo-Studios',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
