import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Reset spy call history (but keep mock implementations set up via
    // vi.mock factories) before every test, so tests don't leak call
    // counts into their siblings.
    clearMocks: true,
    exclude: ['node_modules/**', '.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/repositories/**',
        'src/lib/services/**',
        'src/lib/*.ts',
        'src/components/**',
      ],
      exclude: ['src/lib/supabase/**'],
    },
  },
})
