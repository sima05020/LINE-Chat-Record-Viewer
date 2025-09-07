import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/LINE-Chat-Record-Viewer/',
  plugins: [react()],
})
