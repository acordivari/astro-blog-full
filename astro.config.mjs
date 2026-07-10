import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const tailscaleHost = env.TAILSCALE_HOST?.trim();
const allowedHosts = tailscaleHost ? [tailscaleHost] : undefined;

export default defineConfig({
  site: 'https://thisisandrew.me',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/open-graph/'),
    }),
  ],
  server: {
    host: true,
  },
  vite: {
    server: {
      allowedHosts,
    },
    preview: {
      allowedHosts,
    },
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },
});
