// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-07-02",
  modules: [
    "@nuxt/ui",
    "@nuxt/image",
    "nuxt-svgo",
    "@nuxt/fonts",
    "@nuxtjs/i18n",
    "@nuxtjs/supabase",
    "nuxt-mdi",
  ],
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  colorMode: {
    preference: "light",
  },
  i18n: {
    strategy: "prefix_except_default",
    defaultLocale: "nl",
    langDir: "messages",
    detectBrowserLanguage: false,
    customRoutes: "config",
    // pages: {
    //   'donation-goals': {
    //     en: '/donation-goals',
    //     nl: '/donatie-doelen',
    //   },
    // },
    locales: [
      {
        code: "en",
        iso: "en-US",
        name: "English",
        file: "en.json",
      },
      {
        code: "nl",
        iso: "nl-NL",
        name: "Nederlands",
        file: "nl.json",
      },
    ],
  },
  fonts: {
    // You can provide overrides for individual families
    families: [
      { name: "Graphik", provider: "local" },
      { name: "Gilroy", provider: "local" },
    ],
    // The weights, styles, and subsets to generate font face rules for.
    // You can also customize these for a specific family, within `families`.
    defaults: {
      // This is true by default for the highest priority format unless a font is subsetted.
      // By setting this to true it will force the highest priority format of _all_ fonts to be preloaded.
      // preload: true,
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      subsets: [
        "cyrillic-ext",
        "cyrillic",
        "greek-ext",
        "greek",
        "vietnamese",
        "latin-ext",
        "latin",
      ],
    },
    assets: {
      prefix: "/_fonts",
    },
  },
  supabase: {
    redirect: false,
  },
  mdi: {
    componentName: "MdiIcon",
    defaultSize: "1.875rem",
  },
});
