<script setup lang="ts">
defineProps<{
  id: string
  eyebrow: string
  title: string
  intro?: string
}>()

// The same sections show on the long page and inside the presentation's side panel.
// Layout inside uses container queries (@3xl: and so on), so it fits whichever width it gets.
const isPanel = inject('content-in-panel', false)
const UContainer = resolveComponent('UContainer')
</script>

<template>
  <section
    :id="isPanel ? undefined : id"
    :aria-labelledby="`${id}-title`"
    class="@container"
    :class="isPanel ? '' : 'scroll-mt-16 border-t border-default bg-default'"
  >
    <component :is="isPanel ? 'div' : UContainer" :class="isPanel ? '' : 'py-24 lg:py-36'">
      <p class="text-sm font-medium text-muted">
        {{ eyebrow }}
      </p>
      <h2
        :id="`${id}-title`"
        class="mt-2 max-w-3xl font-display font-semibold tracking-[-0.025em] leading-[1.05] text-balance text-highlighted"
        :class="isPanel ? 'text-4xl' : 'text-5xl @3xl:text-6xl'"
      >
        {{ title }}
      </h2>
      <p v-if="intro" class="mt-4 max-w-prose leading-relaxed text-muted" :class="isPanel ? 'text-base' : 'text-lg'">
        {{ intro }}
      </p>
      <div :class="isPanel ? 'mt-6' : 'mt-10'">
        <slot />
      </div>
    </component>
  </section>
</template>
