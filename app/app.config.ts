// Colour choice lives only here. The scale itself is in assets/css/main.css.
// Components use the names (primary, neutral), never their own colour code.
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'glow',
      neutral: 'zinc',
    },
    // Calmer surfaces (PLAN-v3 section 11): soft filled cards instead of outlined boxes, pill buttons.
    card: {
      slots: { root: 'rounded-2xl' },
      variants: { variant: { outline: { root: 'bg-white/[0.025] ring-0 divide-y divide-default' } } },
    },
    button: {
      slots: { base: 'rounded-full' },
    },
  },
})
