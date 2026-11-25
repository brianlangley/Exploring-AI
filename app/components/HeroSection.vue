<script setup lang="ts">
const { messages } = useLocale()
const copy = computed(() => messages.value.hero)
</script>

<template>
  <section id="top" class="relative isolate overflow-hidden border-b border-default">
    <UContainer class="py-20 lg:py-28">
      <div class="flex max-w-2xl flex-col gap-6">
        <UBadge color="neutral" variant="outline" size="lg" :label="copy.badge" class="self-start" />
        <p class="font-serif text-3xl italic text-muted">
          2026
        </p>
        <h1 class="font-display text-6xl font-semibold leading-[0.92] tracking-[-0.035em] text-balance text-highlighted sm:text-7xl lg:text-8xl">
          {{ copy.modernTitle }}
        </h1>
        <p class="max-w-prose text-lg leading-relaxed text-default">
          {{ copy.modernText }}
        </p>
        <div class="flex flex-wrap gap-3">
          <UButton to="#device" size="xl" :label="copy.checkDevice" trailing-icon="i-lucide-arrow-down" />
          <UButton to="/" size="xl" color="neutral" variant="outline" :label="copy.watchIntro" icon="i-lucide-play" />
        </div>
      </div>
    </UContainer>
  </section>
</template>
