import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Mimics GitHub Pages: serves 404.html for unknown paths instead of index.html
function ghPages404Plugin() {
  return {
    name: 'gh-pages-404',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0].split('#')[0] ?? '/'
        const filePath = path.join('public', url.replace(/^\/quadrants/, ''))
        // Let Vite handle known assets and the base path
        if (
          url === '/quadrants/' ||
          url === '/quadrants' ||
          url.startsWith('/quadrants/src/') ||
          url.startsWith('/quadrants/@') ||
          url.startsWith('/quadrants/node_modules/') ||
          fs.existsSync(filePath)
        ) {
          return next()
        }
        // Serve 404.html for anything else, like GitHub Pages would
        req.url = '/quadrants/404.html'
        next()
      })
    },
  }
}

const commitHash = execSync('git rev-parse --short HEAD').toString().trim()

export default defineConfig({
  base: '/quadrants/',
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  appType: 'mpa', // Disable SPA fallback to index.html
  plugins: [
    ghPages404Plugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Quadrants',
        short_name: 'Quadrants',
        description: 'Visual frameworks for thinking in quadrants',
        theme_color: '#3b82f6',
        background_color: '#fafafa',
        display: 'standalone',
        scope: '/quadrants/',
        start_url: '/quadrants/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
