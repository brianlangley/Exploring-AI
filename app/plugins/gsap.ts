import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MOTION_OK } from '~/utils/motion'


// Each element keeps its own matchMedia, so its tweens and triggers are cleaned up with it.
const contexts = new WeakMap<HTMLElement, gsap.MatchMedia>()

// Runs on the server too, so the directive resolves during SSR; the hooks only fire in the browser.
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) gsap.registerPlugin(ScrollTrigger)

  // v-reveal: children fade up in turn when the element scrolls into view. v-reveal="false" switches it off.
  nuxtApp.vueApp.directive<HTMLElement, boolean | undefined>('reveal', {
    mounted(el, binding) {
      if (binding.value === false) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from(el.children, {
          y: 32,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.08,
          // A leftover transform would make it the containing block for a pinned (fixed) child.
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        })
      })
      contexts.set(el, mm)
    },
    unmounted(el) {
      contexts.get(el)?.revert()
      contexts.delete(el)
    },
    getSSRProps: () => ({}),
  })
})
