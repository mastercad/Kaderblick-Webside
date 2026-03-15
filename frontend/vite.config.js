
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// App-Version aus package.json – wird bei jedem Build automatisch eingebettet.
// Der CI-Job in build.yml erhöht die Patch-Version vor dem Build automatisch.
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Get git commit hash for build info
let commitHash = '';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  commitHash = 'unknown';
}

export default defineConfig({
  define: {
    __BUILD_COMMIT__: JSON.stringify(commitHash),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // 'prompt': Neuer SW geht in den "waiting"-Status. Die App zeigt einen
      // Update-Banner (PWAUpdateBanner) und löst das Update erst auf Nutzeraktion aus.
      registerType: 'prompt',
      // Service Worker auch im Dev-Modus aktivieren (für Push-Tests)
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Kaderblick Fußballverein',
        short_name: 'Kaderblick',
        start_url: '.',
        display: 'standalone',
        background_color: '#4e4e4e',
        theme_color: '#B5AD9D',
        description: 'Die Vereinsapp für Mitglieder, Teams und Fans.',
        icons: [
          {
            src: '/images/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB - Hauptbundle ist >2MB
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
        globIgnores: [
          'uploads/**',
        ]
      }
    }),
  ],
  /* Wahrscheinlich sinnfrei, bleibt aber erstmal drin, der login modal für google sso jetzt erstmal so funktioniert */
  server: {
    middlewareMode: false,
    setupMiddlewares(middlewares) {
      middlewares.use((req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
        next();
      });
      return middlewares;
    }
  },
  build: {
    sourcemap: false
  }
})
