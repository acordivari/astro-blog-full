import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://blog26.netlify.app',
  integrations: [mdx()],
  image: {
    // Enable high-quality image optimization
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false, // Allow large images
      },
    },
  },
});
