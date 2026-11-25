// https://nuxt.com/docs/4.x/api/nuxt-config

// Dutch by default; the language switch in the header changes the page after loading.
const description = 'Draai AI op je eigen computer: wat er op jouw computer past, hoe je LM Studio installeert en wat je ermee kunt bouwen. Onofficieel studentenproject, Inholland Exploring AI.'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-25',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  // One fixed theme, no light/dark switching: the palette lives on :root in main.css.
  ui: { colorMode: false },

  app: {
    head: {
      htmlAttrs: { lang: 'nl' },
      title: 'LM Studio, uitgelegd',
      meta: [
        { name: 'description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'LM Studio, uitgelegd' },
        { property: 'og:description', content: description },
      ],
    },
  },
})
