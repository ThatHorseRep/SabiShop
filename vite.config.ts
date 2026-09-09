import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        landing: 'landing.html',
      },
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')
          if (!normalizedId.includes('/node_modules/')) {
            if (normalizedId.includes('/src/domain/')) return 'domain'
            if (normalizedId.includes('/src/pos/')) return 'pos'
            if (normalizedId.includes('/src/inventory/')) return 'inventory'
            if (normalizedId.includes('/src/customers/')) return 'customers'
            if (normalizedId.includes('/src/exceptions/')) return 'exceptions'
            if (normalizedId.includes('/src/management/')) return 'management'
            if (normalizedId.includes('/src/staff/')) return 'staff'
            if (normalizedId.includes('/src/language/')) return 'language'
            if (normalizedId.includes('/src/ui/')) return 'ui'
            if (normalizedId.includes('/src/shell/')) return 'shell'
            return undefined
          }
          if (
            /\/node_modules\/(react|react-dom|scheduler)\//.test(normalizedId)
          ) {
            return 'react'
          }
          if (normalizedId.includes('/node_modules/@phosphor-icons/')) {
            return 'icons'
          }
          return 'vendor'
        },
      },
    },
  },
})
