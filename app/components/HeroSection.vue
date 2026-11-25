<script setup lang="ts">
import gsap from 'gsap'
import { DEMO_MODEL_ID } from '~/utils/demoModel'

const { messages } = useLocale()
const copy = computed(() => messages.value.hero)
const mock = computed(() => messages.value.mock)

const root = useTemplateRef<HTMLElement>('root')
let mm: gsap.MatchMedia | undefined

// Load: text then window rise in turn. Scroll: the window grows to full size while the text drifts away.
// GSAP only writes inline styles here, never text, so Vue keeps owning the DOM (the locale can still switch).
onMounted(() => {
  mm = gsap.matchMedia(root.value!)
  mm.add(MOTION_OK, () => {
    gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.1 } })
      .from('[data-intro]', { y: 28, opacity: 0, filter: 'blur(8px)', stagger: 0.1 })
      .from('[data-window]', { y: 80, opacity: 0, scale: 0.94, duration: 1.4 }, '-=0.7')
      .from('[data-glow]', { opacity: 0, duration: 2 }, '<')

    gsap.to('[data-copy]', {
      y: -60,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: root.value, start: 'top top', end: '60% top', scrub: true },
    })
    gsap.fromTo('[data-window-inner]', { scale: 0.9 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: { trigger: '[data-window]', start: 'top 90%', end: 'top 20%', scrub: true },
    })
  })
})
onBeforeUnmount(() => mm?.revert())
</script>

<template>
  <section id="top" ref="root" class="relative isolate overflow-hidden">
    <!-- Soft violet light behind the window. -->
    <div
      data-glow
      class="pointer-events-none absolute inset-x-0 top-[38%] -z-10 mx-auto h-[640px] max-w-5xl rounded-full bg-[radial-gradient(closest-side,rgb(117_80_240/0.35),transparent)] blur-2xl"
      aria-hidden="true"
    />

    <UContainer class="pt-24 pb-16 lg:pt-36">
      <div data-copy class="mx-auto flex max-w-4xl flex-col items-center gap-7 text-center">
        <p data-intro class="text-sm font-medium text-primary">
          {{ copy.badge }} · 2026
        </p>
        <h1 data-intro class="font-display text-6xl font-semibold leading-[0.95] tracking-[-0.045em] text-balance text-highlighted sm:text-7xl lg:text-[7.5rem]">
          {{ copy.modernTitle }}
        </h1>
        <p data-intro class="max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          {{ copy.modernText }}
        </p>
        <div data-intro class="flex flex-wrap justify-center gap-3">
          <UButton to="#device" size="xl" :label="copy.checkDevice" trailing-icon="i-lucide-arrow-down" />
          <UButton to="/" size="xl" color="neutral" variant="ghost" :label="copy.watchIntro" icon="i-lucide-play" />
        </div>
      </div>

      <!-- Product shot: a still of the chat, built in HTML so it stays sharp. Decorative; the same story is told below. -->
      <div data-window class="mx-auto mt-20 max-w-5xl lg:mt-28" aria-hidden="true">
        <div data-window-inner class="overflow-hidden rounded-[22px] bg-[#101114] shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_50px_120px_-20px_rgb(0_0_0/0.8)] [will-change:transform]">
          <div class="flex h-11 items-center gap-2 border-b border-white/[0.06] px-4">
            <span class="size-3 rounded-full bg-white/15" />
            <span class="size-3 rounded-full bg-white/15" />
            <span class="size-3 rounded-full bg-white/15" />
            <span class="ml-auto rounded-md bg-white/[0.05] px-3 py-1 font-mono text-xs text-emerald-300">● {{ DEMO_MODEL_ID }}</span>
          </div>
          <div class="flex min-h-[340px] text-left sm:min-h-[420px]">
            <div class="hidden w-16 shrink-0 flex-col items-center gap-3 border-r border-white/[0.06] py-4 sm:flex">
              <img src="/brand/LM Studio Icon Color.svg" alt="" class="size-7">
              <span v-for="icon in ['i-lucide-search', 'i-lucide-hard-drive', 'i-lucide-message-square', 'i-lucide-terminal']" :key="icon" class="grid size-10 place-items-center rounded-lg" :class="icon === 'i-lucide-message-square' ? 'bg-violet-500/20 text-violet-100' : 'text-zinc-500'">
                <UIcon :name="icon" class="size-5" />
              </span>
            </div>
            <div class="flex flex-1 flex-col gap-4 p-5 text-[15px] sm:p-8">
              <p class="ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-violet-500/25 px-4 py-2.5 text-highlighted">
                {{ mock.chatQuestion }}
              </p>
              <p class="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/[0.05] px-4 py-3 leading-relaxed text-default">
                {{ mock.chatAnswer }}<span class="animate-pulse text-primary">▍</span>
              </p>
              <p class="mt-auto font-mono text-xs text-dimmed">
                {{ mock.chatStats }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
