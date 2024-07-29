import { defineVitestConfig } from '@nuxt/test-utils/config'
import { configDefaults } from 'vitest/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    exclude: [...configDefaults.exclude, 'tests/e2e/**/*'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './tests/unit/test-reports',
      reporter: ['html'],
    },
    environmentOptions: {
      nuxt: {
        mock: {
          intersectionObserver: true,
          indexedDb: true,
        },
        domEnvironment: 'jsdom',
      },
    },
  },
})
