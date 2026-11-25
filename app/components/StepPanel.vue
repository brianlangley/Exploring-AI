<script setup lang="ts">
import type { StepId } from '~/utils/presentationSteps'

const { step, goTo, isStageMoving } = usePresentation()
const { messages } = useLocale()

// Sections render in their compact panel form inside this card.
provide('content-in-panel', true)

const SECTIONS: Partial<Record<StepId, string>> = {
  what: 'WhatIsSection',
  device: 'DeviceCheck',
  models: 'ModelPicker',
  costs: 'CostsSection',
  verdict: 'VerdictSection',
  alternatives: 'AlternativesSection',
  further: 'FurtherSection',
}
const sectionComponents = {
  WhatIsSection: resolveComponent('WhatIsSection'),
  DeviceCheck: resolveComponent('DeviceCheck'),
  ModelPicker: resolveComponent('ModelPicker'),
  CostsSection: resolveComponent('CostsSection'),
  VerdictSection: resolveComponent('VerdictSection'),
  AlternativesSection: resolveComponent('AlternativesSection'),
  FurtherSection: resolveComponent('FurtherSection'),
}

const sectionComponent = computed(() => {
  const name = SECTIONS[step.value.id] as keyof typeof sectionComponents | undefined
  return name ? sectionComponents[name] : undefined
})
const caption = computed(() => messages.value.route.history[step.value.id as keyof typeof messages.value.route.history])

// Scroll the panel back to the top on every new step.
const scroller = ref<HTMLElement | null>(null)
watch(() => step.value.id, () => scroller.value?.scrollTo({ top: 0 }))
</script>

<template>
  <!-- History: a small caption card, top left (Floppy sits bottom left). -->
  <Transition mode="out-in" enter-from-class="opacity-0 translate-y-2" leave-to-class="opacity-0" enter-active-class="transition duration-700 ease-out motion-reduce:transition-none" leave-active-class="transition duration-200 motion-reduce:transition-none">
    <div
      v-if="step.panel === 'caption' && caption && !isStageMoving"
      :key="step.id"
      class="pointer-events-auto absolute top-16 left-4 max-w-md glass p-6 sm:left-8"
      aria-live="polite"
    >
      <p class="font-serif text-5xl leading-none text-phosphor-300">
        {{ caption.year }}
      </p>
      <h2 class="mt-1 font-display text-3xl font-semibold tracking-tight text-highlighted">
        {{ caption.title }}
      </h2>
      <p class="mt-2 leading-relaxed text-default">
        {{ caption.text }}
      </p>
    </div>

    <!-- Content steps: the full section in a scrollable card on the right (bottom sheet on phones). -->
    <div
      v-else-if="step.panel === 'section' && sectionComponent"
      :key="step.id"
      ref="scroller"
      class="pointer-events-auto absolute inset-x-2 bottom-24 max-h-[55dvh] overflow-y-auto glass p-6 md:inset-x-auto md:top-20 md:right-4 md:bottom-24 md:max-h-none md:w-[min(44rem,52vw)] md:p-7"
    >
      <component :is="sectionComponent" />
    </div>

    <!-- Demo: the simulated computer sits on the 3D monitor. -->
    <MockComputer v-else-if="step.panel === 'screen'" key="demo" />

    <!-- Intro: one hint; the terminal itself says the rest. -->
    <div v-else-if="step.id === 'intro'" key="intro" class="pointer-events-auto absolute inset-x-0 bottom-28 flex justify-center">
      <UButton size="xl" color="neutral" variant="outline" class="font-terminal text-xl" :label="messages.route.introHint" trailing-icon="i-lucide-arrow-right" @click="goTo(1)" />
    </div>

    <!-- End: links on, back to the start. -->
    <div v-else-if="step.id === 'end'" key="end" class="pointer-events-auto absolute top-16 left-4 max-w-md glass p-6 sm:left-8">
      <h2 class="font-display text-3xl font-semibold tracking-tight text-highlighted">
        {{ messages.route.end.title }}
      </h2>
      <p class="mt-2 text-default">
        {{ messages.route.end.text }}
      </p>
      <div class="mt-4 flex flex-wrap gap-3">
        <UButton to="/" size="lg" :label="messages.route.end.toSite" trailing-icon="i-lucide-arrow-right" />
        <UButton size="lg" color="neutral" variant="outline" :label="messages.route.end.restart" icon="i-lucide-rotate-ccw" @click="goTo(0)" />
      </div>
    </div>
  </Transition>
</template>
