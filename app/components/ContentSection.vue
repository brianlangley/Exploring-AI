<script setup lang="ts">
defineProps<{
  id: string
  eyebrow: string
  title: string
  intro?: string
}>()

// The same sections show on the long page and inside the presentation's side panel.
// Layout inside uses container queries (@3xl: and so on), so it fits whichever width it gets.
// On the long page: centred headline and scroll reveal; in the panel: compact, left-aligned, no motion.
const isPanel = inject('content-in-panel', false)
const UContainer = resolveComponent('UContainer')
</script>

<template>
  <section
    :id="isPanel ? undefined : id"
    :aria-labelledby="`${id}-title`"
    class="@container"
    :class="isPanel ? '' : 'scroll-mt-14 bg-default'"
  >
    <component :is="isPanel ? 'div' : UContainer" :class="isPanel ? '' : 'py-28 lg:py-44'">
      <div v-reveal="!isPanel" :class="isPanel ? '' : 'mx-auto flex max-w-4xl flex-col items-center text-center'">
        <p class="text-sm font-medium" :class="isPanel ? 'text-muted' : 'text-primary'">
          {{ eyebrow }}
        </p>
        <h2
          :id="`${id}-title`"
          class="mt-3 font-display font-semibold text-balance text-highlighted"
          :class="isPanel
            ? 'max-w-3xl text-4xl leading-[1.05] tracking-[-0.025em]'
            : 'text-5xl leading-[1.02] tracking-[-0.04em] @3xl:text-7xl'"
        >
          {{ title }}
        </h2>
        <p v-if="intro" class="mt-5 max-w-2xl leading-relaxed text-muted" :class="isPanel ? 'text-base' : 'text-lg @3xl:text-xl'">
          {{ intro }}
        </p>
      </div>
      <div v-reveal="!isPanel" :class="isPanel ? 'mt-6' : 'mt-16 @3xl:mt-20'">
        <slot />
      </div>
    </component>
  </section>
</template>
