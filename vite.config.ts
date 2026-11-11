import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Poll for file changes — native fs events on Windows can be missed when files
  // are edited rapidly by tooling, which stalls HMR. Polling keeps it reliable.
  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
})
