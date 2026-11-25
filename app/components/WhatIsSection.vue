<script setup lang="ts">
import gsap from 'gsap'

const { messages } = useLocale()
const copy = computed(() => messages.value.what)
const comparison = computed(() => [
  { ...copy.value.local, icon: 'i-lucide-laptop', from: -1 },
  { ...copy.value.cloud, icon: 'i-lucide-cloud', from: 1 },
])

// Scroll story on wide screens: the comparison stays put while local and cloud slide together.
// Not in the presentation panel, not with reduced motion; there the cards simply show.
const isPanel = inject('content-in-panel', false)
const stage = useTemplateRef<HTMLElement>('stage')
let mm: gsap.MatchMedia | undefined

onMounted(() => {
  if (isPanel) return
  mm = gsap.matchMedia(stage.value!)
  mm.add(`(min-width: 1024px) and ${MOTION_OK}`, () => {
    gsap.timeline({
      scrollTrigger: { trigger: stage.value, start: 'center center', end: '+=90%', pin: true, scrub: 0.6 },
    })
      .from('[data-side]', { xPercent: i => (i === 0 ? -18 : 18), opacity: 0.2, scale: 0.94, ease: 'power2.out', stagger: 0.15 })
      .from('[data-note]', { y: 24, opacity: 0, ease: 'power2.out' }, '-=0.2')
  })
})
onBeforeUnmount(() => mm?.revert())
</script>

<template>
  <ContentSection id="what" :eyebrow="copy.eyebrow" :title="copy.title" :intro="copy.intro">
    <!-- Pinning wraps `stage` in a GSAP spacer; this outer div keeps it away from the slot's own anchors,
         so Vue's patches never look for `stage` where it no longer is.
         overflow-x-clip: the cards start pushed outward and must not widen the page. -->
    <div class="overflow-x-clip">
      <div ref="stage">
      <div class="grid gap-6 @3xl:grid-cols-2">
        <UCard v-for="side in comparison" :key="side.icon" data-side>
          <template #header>
            <div class="flex items-center gap-3">
              <span class="grid size-11 place-items-center rounded-2xl bg-primary/15">
                <UIcon :name="side.icon" class="size-6 text-primary" />
              </span>
              <h3 class="font-display text-2xl font-semibold tracking-tight text-highlighted">
                {{ side.title }}
              </h3>
            </div>
          </template>
          <ul class="flex flex-col gap-3 text-default">
            <li v-for="point in side.points" :key="point" class="flex gap-2">
              <UIcon name="i-lucide-check" class="mt-1 size-4 shrink-0 text-muted" />
              {{ point }}
            </li>
          </ul>
        </UCard>
      </div>

      <UAlert
        data-note
        class="mt-6 rounded-3xl"
        color="neutral"
        variant="subtle"
        icon="i-lucide-sparkles"
        :title="copy.bionicTitle"
        :description="copy.bionicText"
      />
      </div>
    </div>
  </ContentSection>
</template>
