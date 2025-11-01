import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
    allowedHosts: ['workzown', 'localhost', '127.0.0.1'],  // Allow access via hostname
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      // Proxy WebSocket connections for global notification service
      '/ws': {
        target: 'ws://127.0.0.1:8081',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
