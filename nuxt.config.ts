import { fileURLToPath } from 'url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }, { charset: 'utf-8' }],
      script: [],
      link: [],
      style: [],
      noscript: [],
    },
  },
  srcDir: 'src-nuxt',
  alias: {
    '#src-nuxt': fileURLToPath(new URL('./src-nuxt', import.meta.url)),
    '#src-common': fileURLToPath(new URL('./src-common', import.meta.url)),
    '#src-core': fileURLToPath(new URL('./src-core', import.meta.url)),
  },
  css: [
    '~/assets/css/tailwind.css',
    '~/assets/css/main.scss',
    '~/assets/css/modules/floating-vue.scss',
    '~/assets/css/modules/notyf.scss',
  ],
  experimental: {
    appManifest: false, // BIG IMPORTANT
  },
  ssr: false, // BIG IMPORTANT
  devtools: { enabled: false },
  telemetry: false,
  modules: ['@pinia/nuxt', '@nuxt/test-utils/module', '@nuxtjs/google-fonts', '@nuxtjs/tailwindcss'],
  components: [
    { path: '~/src-common/components' },

    // It's important that this comes last if you have overrides you wish to apply
    '~/components',
  ],
  // Enables the development server to be discoverable by other devices when running on iOS physical devices
  devServer: {
    host: process.env.TAURI_DEV_HOST || 'localhost',
  },
  vite: {
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    // prevent vite from obscuring rust errors
    clearScreen: false,

    // Enable environment variables
    // Additional environment variables can be found at
    // https://tauri.app/2/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_', 'NUXT_'],

    // tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1460,
      // Tauri requires a consistent port
      strictPort: true,
      // Enables the development server to be discoverable by other devices for mobile development
      host: '0.0.0.0',
      hmr: {
        // Use websocket for mobile hot reloading
        protocol: 'ws',
        // Make sure it's available on the network
        host: '0.0.0.0',
        // Use a specific port for hmr
        port: 5200,
      },
      watch: {
        // tell vite to ignore watching `src-tauri`
        ignored: ['**/src-tauri/**'],
      },
    } as any,
  },
  pinia: {
    storesDirs: ['./src-nuxt/stores/**'],
  },
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  googleFonts: {
    families: {
      Poppins: true,
    },
  },
})
