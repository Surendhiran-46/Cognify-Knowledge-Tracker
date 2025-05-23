// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        tracker: 'src/tracker.js', // <-- your starting point
      },
      output: {
        entryFileNames: 'tracker.js' // <-- keep same name after bundle
      }
    },
    outDir: 'dist',           // final output folder
    emptyOutDir: true         // clear old build files
  }
})
