import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
    __BROWSER__: true,
    __USE_DEVTOOLS__: false,
  },
  resolve: {
    alias: [
      {
        find: /^@dinia\/(.*?)$/,
        replacement: fileURLToPath(
          new URL('./packages/packages/$1/src', import.meta.url)
        ),
      },
      {
        find: /^dinia$/,
        replacement: fileURLToPath(
          new URL('./packages/dinia/src', import.meta.url)
        ),
      },
    ],
  },
  test: {
    isolate: false,
    include: ['packages/**/*.spec.ts'],
    coverage: {
      reporter: ['html', 'lcov', 'text'],
      include: ['packages/dinia/src/**/*.ts', 'packages/testing/src/**/*.ts'],
      exclude: [
        '**/src/index.ts',
        '**/*.d.ts',
        '**/src/devtools',
        '**/src/hmr.ts',
        '**/src/deprecated.ts',
        '**/src/docue2-plugin.ts',
      ],
    },
    setupFiles: ['packages/dinia/__tests__/vitest-setup.ts'],
    environment: 'happy-dom',
    globals: true, // Specifically to make createTestingDinia happy
  },
})
