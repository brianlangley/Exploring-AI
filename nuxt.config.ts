// https://nuxt.com/docs/4.x/api/nuxt-config

// Dutch by default; the language switch in the header changes the page after loading.
const description = 'Draai AI op je eigen computer: wat er op jouw computer past, hoe je LM Studio installeert en wat je ermee kunt bouwen. Onofficieel studentenproject, Inholland Exploring AI.'

// Share previews (WhatsApp, LinkedIn, X...) need an absolute image URL. Set NUXT_PUBLIC_SITE_URL when building,
// e.g. https://example.com (no trailing slash). Without it the path stays relative, which works locally only.
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? ''
const shareImage = `${siteUrl}/og.png`

export default defineNuxtConfig({
  compatibilityDate: '2026-11-25',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  // The long page used to live here; it is the home page now. Old links keep working.
  routeRules: {
    '/lm-studio': { redirect: { to: '/', statusCode: 301 } },
  },

  // One fixed theme, no light/dark switching: the palette lives on :root in main.css.
  ui: { colorMode: false },

  app: {
    head: {
      htmlAttrs: { lang: 'nl' },
      title: 'Exploring LM',
      meta: [
        { name: 'description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Exploring LM' },
        { property: 'og:description', content: description },
        // Made from scripts/og/og.html; our own mark, no LM Studio logo (public/brand/README.md).
        { property: 'og:image', content: shareImage },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Exploring LM: Nu draait een laptop AI helemaal zelf. Een chatvenster met vragen over lokale AI.' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'theme-color', content: '#0a0a0b' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
})
