import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'MyBBForumDesign',
      formats: ['iife'],
      fileName: () => 'forum.js',
    },
    cssCodeSplit: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (asset) => {
          if (asset.names.some((name) => name.endsWith('.css'))) return 'forum.css'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})
