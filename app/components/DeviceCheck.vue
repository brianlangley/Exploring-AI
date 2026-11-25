<script setup lang="ts">
import type { FitResult, GpuKind, Model } from '~/types/model'
import { RAM_STEPS } from '~/composables/useDevice'

const { specs, detectedNotes, detect } = useDevice()
const { localModels } = useModels()
const { messages } = useLocale()
const copy = computed(() => messages.value.device)

onMounted(detect)

const gpuOptions = computed<{ label: string, value: GpuKind, description: string }[]>(() => [
  { ...copy.value.gpuNone, value: 'none' },
  { ...copy.value.gpuDedicated, value: 'dedicated' },
  { ...copy.value.gpuApple, value: 'apple' },
])

const noteTexts = computed(() => detectedNotes.value.map((note) => {
  const notes = copy.value.notes
  if (note.kind === 'ramReported') return notes.ramReported(note.value)
  if (note.kind === 'threads') return notes.threads(note.value)
  return notes[note.kind]
}))

// The slider walks over the steps, not over gigabytes: 8 to 128 GB in even moves.
const ramIndex = computed({
  get: () => Math.max(0, RAM_STEPS.indexOf(specs.value.ramGB)),
  set: (index: number) => { specs.value.ramGB = RAM_STEPS[index] ?? 16 },
})

const groups = computed(() => {
  const byResult: Record<FitResult, Model[]> = { 'runs-well': [], 'runs-slower': [], 'too-big': [], 'unknown': [] }
  for (const model of localModels) byResult[fitModel(model, specs.value)].push(model)
  return [
    { key: 'runs-well', title: copy.value.runsWell, icon: 'i-lucide-circle-check', color: 'text-success', models: byResult['runs-well'] },
    { key: 'runs-slower', title: copy.value.runsSlower, icon: 'i-lucide-gauge', color: 'text-warning', models: byResult['runs-slower'] },
    { key: 'too-big', title: copy.value.tooBig, icon: 'i-lucide-circle-x', color: 'text-error', models: byResult['too-big'] },
  ]
})
</script>

<template>
  <ContentSection id="device" :eyebrow="copy.eyebrow" :title="copy.title" :intro="copy.intro">
    <div class="grid gap-8 @5xl:grid-cols-12">
      <UCard class="@5xl:col-span-5">
        <div class="flex flex-col gap-8">
          <UFormField :label="copy.ram(specs.ramGB)" name="ram">
            <USlider v-model="ramIndex" :min="0" :max="RAM_STEPS.length - 1" :step="1" class="mt-3" :aria-label="copy.ramAria" />
            <div class="mt-2 flex justify-between font-mono text-xs text-muted" aria-hidden="true">
              <span v-for="step in RAM_STEPS" :key="step">{{ step }}</span>
            </div>
          </UFormField>

          <UFormField :label="copy.graphics" name="gpu">
            <URadioGroup v-model="specs.gpu" :items="gpuOptions" class="mt-2" />
          </UFormField>

          <UFormField v-if="specs.gpu === 'dedicated'" :label="copy.vram(specs.vramGB)" name="vram">
            <USlider v-model="specs.vramGB" :min="4" :max="32" :step="2" class="mt-3" :aria-label="copy.vramAria" />
          </UFormField>

          <div class="flex flex-col gap-1 border-t border-default pt-4 text-sm text-muted">
            <p v-for="note in noteTexts" :key="note">
              {{ note }}
            </p>
            <p class="flex items-center gap-2 text-default">
              <UIcon name="i-lucide-shield-check" class="size-4 text-primary" />
              {{ copy.privacy }}
            </p>
          </div>
        </div>
      </UCard>

      <div class="flex flex-col gap-6 @5xl:col-span-7" aria-live="polite">
        <div v-for="group in groups" :key="group.key">
          <h3 class="flex items-center gap-2 font-display text-lg font-semibold text-highlighted">
            <UIcon :name="group.icon" class="size-5" :class="group.color" />
            {{ group.title }}
            <span class="font-mono text-sm font-normal text-muted">({{ group.models.length }})</span>
          </h3>
          <p v-if="!group.models.length" class="mt-2 text-sm text-muted">
            {{ copy.none }}
          </p>
          <ul v-else class="mt-3 flex flex-wrap gap-2">
            <li v-for="model in group.models" :key="model.id">
              <UBadge color="neutral" variant="soft" size="lg" :label="`${model.name} · ${model.downloadGB} GB`" />
            </li>
          </ul>
        </div>
        <p class="text-sm text-muted">
          {{ copy.estimate }}
        </p>
      </div>
    </div>
  </ContentSection>
</template>
