<script setup lang="ts">
import { PRESENTATION_STEPS } from '~/utils/presentationSteps'

// Invitation to the 3D presentation route, right under the hero. The retro screen echoes the route's own terminal look.
const { messages } = useLocale()
const copy = computed(() => messages.value.tour)
const years = computed(() => PRESENTATION_STEPS.filter(step => step.world === 'road').map(step => messages.value.route.stepNames[step.id]))
</script>

<template>
  <section aria-labelledby="tour-title" class="bg-default">
    <UContainer class="pb-8">
      <div v-reveal class="mx-auto max-w-5xl">
        <NuxtLink
          to="/intro"
          class="group grid overflow-hidden rounded-3xl bg-white/[0.035] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] ring-1 ring-white/[0.06] transition duration-300 hover:-translate-y-1 hover:ring-white/[0.14] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:grid-cols-2"
        >
          <div class="flex flex-col justify-center gap-4 p-8 sm:p-10">
            <p class="text-sm font-medium text-primary">
              {{ copy.eyebrow }}
            </p>
            <h2 id="tour-title" class="font-display text-4xl font-semibold tracking-[-0.03em] text-highlighted sm:text-5xl">
              {{ copy.title }}
            </h2>
            <p class="max-w-md leading-relaxed text-muted">
              {{ copy.text(PRESENTATION_STEPS.length) }}
            </p>
            <span class="mt-2 inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 font-medium text-inverted transition group-hover:gap-3">
              <UIcon name="i-lucide-play" class="size-4" />
              {{ copy.start }}
            </span>
            <p class="text-xs text-dimmed">
              {{ copy.keys }}
            </p>
          </div>

          <!-- Decorative: the years the route walks through, on a green CRT. -->
          <div class="relative min-h-64 bg-phosphor-950 p-8 font-terminal text-2xl leading-snug text-phosphor-300 sm:p-10 sm:text-3xl" aria-hidden="true">
            <div class="scanlines pointer-events-none absolute inset-0" />
            <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.6))]" />
            <p v-for="year in years" :key="year" class="opacity-70">
              &gt; {{ year }}
            </p>
            <p class="text-phosphor-500">
              &gt; 2026 · {{ copy.now }}<span class="animate-pulse">_</span>
            </p>
          </div>
        </NuxtLink>
      </div>
    </UContainer>
  </section>
</template>
