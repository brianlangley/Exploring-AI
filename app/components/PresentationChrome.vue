<script setup lang="ts">
const { steps, stepIndex, step, isFirst, isLast, goTo, next, previous } = usePresentation()
const { locale, messages, setLocale } = useLocale()
const { isMuted, toggleMute } = useStageSound()

const stepNames = computed(() => messages.value.route.stepNames)
const counter = computed(() => messages.value.route.stepOf(stepIndex.value + 1, steps.length))
// History steps get a terminal-green accent, the rest the violet primary.
const isHistory = computed(() => step.value.world === 'road' || step.value.world === 'room')

function toggleLocale() {
  setLocale(locale.value === 'nl' ? 'en' : 'nl')
}
</script>

<template>
  <!-- Top bar: title, language, way out to the normal site. -->
  <header class="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
    <NuxtLink to="/" class="rounded-sm font-display text-lg font-semibold tracking-tight text-highlighted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
      {{ messages.header.title }}
    </NuxtLink>
    <div class="flex items-center gap-2">
      <!-- Sound on/off: a toggle, so screen readers hear "Sound, pressed" or "not pressed". -->
      <UButton
        size="sm"
        color="neutral"
        variant="ghost"
        :icon="isMuted ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
        :aria-label="messages.route.sound"
        :aria-pressed="!isMuted"
        :title="messages.route.sound"
        @click="toggleMute"
      />
      <UButton
        size="sm"
        color="neutral"
        variant="ghost"
        icon="i-lucide-languages"
        :label="messages.switchTo"
        :aria-label="messages.switchLabel"
        :lang="locale === 'nl' ? 'en' : 'nl'"
        @click="toggleLocale"
      />
      <UButton size="sm" color="neutral" variant="outline" to="/" :label="messages.route.toSite" trailing-icon="i-lucide-arrow-right" />
    </div>
  </header>

  <!-- Bottom: previous / next and one dot per step. -->
  <nav :aria-label="messages.route.stepsLabel" class="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-4">
    <!-- Dark backing: the label and dots sit over the 3D scene, which can be bright. -->
    <p class="rounded-full bg-black/70 px-3 py-0.5 font-terminal text-lg tracking-wide text-default uppercase backdrop-blur-sm" aria-live="polite">
      {{ counter }} · {{ stepNames[step.id] }}
    </p>
    <div class="flex items-center gap-3 rounded-full bg-black/60 p-1.5 backdrop-blur-sm">
      <UButton :disabled="isFirst" color="neutral" variant="outline" icon="i-lucide-arrow-left" :aria-label="messages.route.previous" @click="previous" />
      <ol class="flex flex-wrap items-center justify-center gap-1.5">
        <li v-for="(item, index) in steps" :key="item.id">
          <button
            type="button"
            class="block size-3 rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="index === stepIndex
              ? (isHistory ? 'border-phosphor-300 bg-phosphor-500' : 'border-primary bg-primary')
              : 'border-white/50 bg-transparent hover:bg-elevated'"
            :aria-label="messages.route.goToStep(stepNames[item.id])"
            :aria-current="index === stepIndex ? 'step' : undefined"
            :title="stepNames[item.id]"
            @click="goTo(index)"
          />
        </li>
      </ol>
      <UButton :disabled="isLast" icon="i-lucide-arrow-right" :aria-label="messages.route.next" @click="next" />
    </div>
  </nav>
</template>
