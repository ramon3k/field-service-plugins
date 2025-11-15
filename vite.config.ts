import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_URL || 'http://127.0.0.1:5000'
const wsTarget = process.env.VITE_WS_URL || 'ws://127.0.0.1:8081'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
    allowedHosts: ['workzown', 'localhost', '127.0.0.1'],  // Allow access via hostname
    headers: {
      'Cache-Control': 'no-store',  // Disable caching in development
    },
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      // Proxy WebSocket connections for global notification service
      '/ws': {
        target: wsTarget,
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
