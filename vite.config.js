import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon-32x32.png',
        'favicon-16x16.png',
        'favicon-48x48.png',
        'favicon.ico',
        'apple-touch-icon-180x180.png',
        'apple-touch-icon-152x152.png',
        'apple-touch-icon-120x120.png',
        'maskable-icon-512x512.png'
      ],
      manifest: {
        id: '/',
        name: 'ChatBW - Bidwinners Chat',
        short_name: 'ChatBW',
        description: 'Professional real-time messaging platform by Bidwinners. Fast, secure, and reliable chat application.',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?source=pwa',
        lang: 'en',
        categories: ['chat', 'messaging', 'communication', 'business', 'productivity'],

        // Complete icon set for all platforms
        icons: [
          // PWA Standard Icons (Required)
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },

          // Maskable Icons (for adaptive displays)
          {
            src: '/maskable-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/maskable-icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },

          // Android Chrome Icons
          {
            src: '/android-chrome-48x48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: '/android-chrome-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/android-chrome-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/android-chrome-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/android-chrome-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: '/android-chrome-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },

          // Apple iOS/macOS Icons
          {
            src: '/apple-touch-icon-57x57.png',
            sizes: '57x57',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon-76x76.png',
            sizes: '76x76',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon-120x120.png',
            sizes: '120x120',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon-180x180.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/macos-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },

          // Windows/Microsoft Icons
          {
            src: '/mstile-70x70.png',
            sizes: '70x70',
            type: 'image/png'
          },
          {
            src: '/mstile-150x150.png',
            sizes: '150x150',
            type: 'image/png'
          },
          {
            src: '/mstile-310x310.png',
            sizes: '310x310',
            type: 'image/png'
          },
          {
            src: '/windows-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],

        // App shortcuts for quick actions
        shortcuts: [
          {
            name: 'New Chat',
            short_name: 'Chat',
            description: 'Start a new conversation',
            url: '/chat?action=new',
            icons: [
              { src: '/pwa-192x192.png', sizes: '192x192' }
            ]
          },
          {
            name: 'Messages',
            short_name: 'Messages',
            description: 'View your messages',
            url: '/messages',
            icons: [
              { src: '/pwa-192x192.png', sizes: '192x192' }
            ]
          }
        ],

        // Screenshots for PWA store (add actual screenshots later)
        screenshots: [
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'ChatBW Mobile Interface'
          }
        ],

        // Related applications
        related_applications: [],
        prefer_related_applications: false
      },

      // Service Worker Configuration
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,gif,woff,woff2,json}'
        ],
        globIgnores: [
          '**/node_modules/**/*',
          '**/icon-generator.html'
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        // Runtime caching strategies
        runtimeCaching: [
          // API calls - Network first with cache fallback
          {
            urlPattern: /^https:\/\/api\.bidwinners\.net\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'chatbw-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 30 // 30 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              backgroundSync: {
                name: 'chatbw-api-queue',
                options: {
                  maxRetentionTime: 24 * 60 // 24 hours
                }
              }
            }
          },

          // Images - Cache first
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'chatbw-image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },

          // Fonts - Cache first
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'chatbw-font-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },

          // CSS & JS - Stale while revalidate
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'chatbw-assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },

          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },

          // Navigation requests - Network first
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'chatbw-pages-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },

      // Dev options
      devOptions: {
        enabled: true, // Enable PWA in development
        type: 'module'
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