import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { env } from 'node:process';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Change to whatever is the base URL of your app. This is necessary for the app to work when it's not hosted on the root of the server.
  base: env.NODE_ENV === 'production' ? '/' : '/',
});
