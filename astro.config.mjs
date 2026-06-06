import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const tailscaleHost = env.TAILSCALE_HOST?.trim();
const allowedHosts = tailscaleHost ? [tailscaleHost] : undefined;

export default defineConfig({
  site: 'https://blog26.netlify.app',
  integrations: [mdx()],
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
