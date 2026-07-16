import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.png', 'icons/icon-192x192.png', 'icons/icon-512x512.png', 'screenshots/desktop.png', 'screenshots/mobile.png'],
        manifest: {
          name: "LogicMatch - Puzzle Numérico",
          short_name: "LogicMatch",
          description: "Um viciante jogo de lógica e números. Encontre os pares e limpe o tabuleiro!",
          theme_color: "#08081a",
          background_color: "#08081a",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ],
          screenshots: [
            {
              src: "/screenshots/desktop.png",
              sizes: "1376x768",
              type: "image/png",
              form_factor: "wide"
            },
            {
              src: "/screenshots/mobile.png",
              sizes: "768x1376",
              type: "image/png",
              form_factor: "narrow"
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'motion', 'lucide-react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
