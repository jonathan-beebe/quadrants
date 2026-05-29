import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __COMMIT_HASH__: JSON.stringify('test'),
  },
  resolve: {
    alias: {
      'virtual:pwa-register/react': resolve(__dirname, 'src/__mocks__/virtual-pwa-register-react.ts'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'core',
          environment: 'node',
          include: ['src/__tests__/logic/**/*.test.ts'],
          isolate: false,
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/__tests__/logic/**/*.test.ts'],
        },
      },
    ],
  },
})
