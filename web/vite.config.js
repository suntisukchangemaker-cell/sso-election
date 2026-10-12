import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/sso-election/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
