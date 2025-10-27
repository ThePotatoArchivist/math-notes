import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa'

const nonHashFiles = [
    'woff',
    'woff2',
    'svg',
    'ttf',
    'eot',
]

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    VitePWA({
        registerType: 'autoUpdate',
    }),
  ],
  base: '/math-notes',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: assetInfo => {
          if (nonHashFiles.some(ext => assetInfo.name.endsWith(`.${ext}`)))
            return 'assets/[name].[ext]'
          return 'assets/[name]-[hash].[ext]'
        }
      }
    }
  }
})
