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
  experimental: {
    appManifest: false, // BIG IMPORTANT
  },
  ssr: false, // BIG IMPORTANT
  devtools: { enabled: false },
  telemetry: false,
  modules: ['@pinia/nuxt', '@nuxt/test-utils/module', '@nuxtjs/google-fonts', '@nuxtjs/tailwindcss'],
  components: [
    { path: '~/common/components' },

    // It's important that this comes last if you have overrides you wish to apply
    '~/components',
  ],
  vite: {
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    // prevent vite from obscuring rust errors
    clearScreen: false,

    // Enable environment variables
    // Additional environment variables can be found at
    // https://tauri.app/2/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_', 'NUXT_'],

    build: {
      // Tauri supports es2021
      target: ['es2021', 'chrome100', 'safari13'],
      // don't minify for debug builds
      minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
      // produce sourcemaps for debug builds
      sourcemap: !!process.env.TAURI_DEBUG,
    },

    server: {
      // Tauri requires a consistent port
      strictPort: true,
      // Enables the development server to be discoverable by other devices for mobile development
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
    },
  },
  pinia: {
    storesDirs: ['./stores/**'],
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
