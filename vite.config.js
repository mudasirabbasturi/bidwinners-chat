import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      manifest: {
        name: 'Bidwinners Chat',
        short_name: 'BidwinnersChat',
        description: 'Bidwinners Chat Application',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/bidwinners_chat_desktop_icon.png',
            sizes: '1254x1254',
            type: 'image/png'
          },
          {
            src: '/bidwinners_chat_desktop_icon.png',
            sizes: '1254x1254',
            type: 'image/png'
          },
          {
            src: '/bidwinners_chat_desktop_icon.png',
            sizes: '1254x1254',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/bidwinners_chat_desktop_icon.png',
            sizes: '1254x1254',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        cleanupOutdatedCaches: true
      }
    })
  ],
  resolve: {
    // alias: {
    //   '@': path.resolve(__dirname, './src'),
    //   '@components': path.resolve(__dirname, './src/components'),
    //   '@pages': path.resolve(__dirname, './src/pages'),
    //   '@api': path.resolve(__dirname, './src/api'),
    // },
  },
})

