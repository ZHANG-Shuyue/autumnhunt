import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/autumnhunt/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/recharts/')) {
            if (
              id.includes('/recharts/es6/chart/') ||
              id.includes('/recharts/es6/component/') ||
              id.includes('/recharts/es6/container/')
            ) {
              return 'charts-core'
            }
            if (
              id.includes('/recharts/es6/cartesian/') ||
              id.includes('/recharts/es6/polar/') ||
              id.includes('/recharts/es6/shape/') ||
              id.includes('/recharts/es6/util/')
            ) {
              return 'charts-utils'
            }
            return 'charts'
          }
          if (id.includes('node_modules/@dnd-kit/core/') || id.includes('node_modules/@dnd-kit/sortable/') || id.includes('node_modules/@dnd-kit/utilities/')) {
            return 'dnd'
          }
          if (id.includes('node_modules/@octokit/core/') || id.includes('node_modules/@octokit/rest/') || id.includes('node_modules/@octokit/request/')) {
            return 'github'
          }
          if (id.includes('node_modules/lucide-react/') || id.includes('node_modules/canvas-confetti/')) {
            return 'ui'
          }
          return undefined
        },
      },
    },
  },
})
