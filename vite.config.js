import './patch-bigint.cjs';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Only split the massive web3 libraries — Vite handles React automatically
            if (id.includes('@solana') || id.includes('@rainbow-me') || id.includes('wagmi')) {
              return 'web3-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})

