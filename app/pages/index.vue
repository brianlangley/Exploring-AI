<script setup lang="ts">
// The site starts here: the presentation route (PLAN-v3). The long content page is /lm-studio.
definePageMeta({ layout: false })

const { readHash, step } = usePresentation()
usePresentationKeys()
// A link like /#jouw-computer opens that step, on load and when the hash changes later.
onMounted(() => {
  readHash()
  window.addEventListener('hashchange', readHash)
})
onBeforeUnmount(() => window.removeEventListener('hashchange', readHash))
</script>

<template>
  <div class="relative h-dvh overflow-hidden">
    <ClientOnly>
      <PresentationStage />
    </ClientOnly>
    <!-- Retro layer only on the history steps (PLAN-v3 section 11). -->
    <div v-if="step.world === 'road'" class="scanlines pointer-events-none absolute inset-0" aria-hidden="true" />
    <div class="pointer-events-none absolute inset-0 z-10">
      <StepPanel />
      <ClientOnly>
        <FloppyHelper />
      </ClientOnly>
      <PresentationChrome />
    </div>
  </div>
</template>
