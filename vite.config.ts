import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: process.env.ANALYZE_BUNDLE === 'true',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'production' ? false : true, // Disable source maps in production for smaller bundles
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          // Framework chunks
          'react-vendor': ['react', 'react-dom'],

          // UI library chunks
          'radix-ui': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-slot',
            '@radix-ui/react-tooltip',
          ],

          // Form and validation
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Utilities
          utils: [
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'lucide-react',
          ],

          // Focus and accessibility
          a11y: ['focus-trap-react'],
        },
        // Optimize file naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Performance optimization settings
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    // Enable chunk size warnings
    chunkSizeWarningLimit: 600,
    // Additional optimizations
    reportCompressedSize: true,
    emptyOutDir: true,
  },
  // Enable tree shaking optimizations
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
})
