<script setup lang="ts">
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { isReady } = usePresentationStage(canvasRef)
const { transition, isStageUnavailable } = usePresentation()
const { messages } = useLocale()
</script>

<template>
  <div class="fixed inset-0 z-0 bg-[#030405]" aria-hidden="true">
    <canvas
      ref="canvasRef"
      class="block size-full transition-opacity duration-700 motion-reduce:transition-none"
      :class="isReady ? 'opacity-100' : 'opacity-0'"
    />
    <p v-if="!isReady && !isStageUnavailable" class="absolute inset-x-0 bottom-28 text-center font-terminal text-xl text-phosphor-500/70">
      {{ messages.route.loading }}
    </p>

    <!-- Between worlds: a short fade through black. -->
    <div
      class="pointer-events-none absolute inset-0 bg-black transition-opacity duration-300 motion-reduce:transition-none"
      :class="transition === 'fade' ? 'opacity-100' : 'opacity-0'"
    />

    <!-- Into the terminal screen: our own grid scan with code rain, no film imagery. -->
    <Transition leave-active-class="transition-opacity duration-500" leave-to-class="opacity-0">
      <div v-if="transition === 'scan'" class="scan pointer-events-none absolute inset-0 overflow-hidden bg-phosphor-950">
        <CodeRain class="absolute inset-0 opacity-40" />
        <div class="scan-grid absolute inset-0" />
        <div class="scan-line absolute inset-x-0 h-1 bg-phosphor-300" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.scan-grid {
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--color-phosphor-500) 45%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--color-phosphor-500) 45%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at center, black 55%, transparent 100%);
  animation: grid-open 0.9s ease-out forwards;
}

.scan-line {
  box-shadow: 0 0 24px var(--color-phosphor-500);
  animation: line-sweep 0.9s linear forwards;
}

/* Grid opens from the centre outwards. */
@keyframes grid-open {
  from { transform: scale(0.15); opacity: 0; }
  to { transform: scale(1.4); opacity: 1; }
}

@keyframes line-sweep {
  from { top: 0; }
  to { top: 100%; }
}
</style>
