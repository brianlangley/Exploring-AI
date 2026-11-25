// https://nuxt.com/docs/4.x/api/nuxt-config

// Dutch by default; the language switch in the header changes the page after loading.
const description = 'Draai AI op je eigen computer: wat er op jouw computer past, hoe je LM Studio installeert en wat je ermee kunt bouwen. Onofficieel studentenproject, Inholland Exploring AI.'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-25',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  // Always dark: the desk scene and all contrast checks are made for a dark page.
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

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
