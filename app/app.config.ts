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
      // Bento tiles: big radius, faint fill, 1 px inner top highlight instead of a border.
      slots: { root: 'rounded-3xl', header: 'sm:px-7 sm:pt-7', body: 'sm:p-7' },
      variants: { variant: { outline: { root: 'bg-white/[0.035] ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] divide-y divide-white/[0.06]' } } },
    },
    button: {
      slots: { base: 'rounded-full' },
    },
  },
})
