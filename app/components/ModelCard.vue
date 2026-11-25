<script setup lang="ts">
import type { FitResult, Model } from '~/types/model'

const props = defineProps<{
  model: Model
  fit: FitResult
}>()

const toast = useToast()
const { messages } = useLocale()
const copy = computed(() => messages.value.models)

const fitColors = { 'runs-well': 'success', 'runs-slower': 'warning', 'too-big': 'error', 'unknown': 'neutral' } as const
const fitBadge = computed(() => ({ label: copy.value.fit[props.fit], color: fitColors[props.fit] }))

const command = computed(() => `lms get ${props.model.id}`)
const memory = computed(() => neededMemoryGB(props.model))

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(command.value)
    toast.add({ title: copy.value.copied, description: command.value, icon: 'i-lucide-check' })
  }
  catch {
    toast.add({ title: copy.value.copyFailed, description: copy.value.copyFailedText, color: 'error' })
  }
}
</script>

<template>
  <UCard :ui="{ body: 'flex flex-col gap-4 h-full' }" class="h-full">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display text-lg font-semibold text-highlighted">
          {{ model.name }}
        </h3>
        <p class="text-sm text-muted">
          {{ model.publisher }} · {{ model.params }}
        </p>
      </div>
      <UBadge :color="fitBadge.color" variant="subtle" :label="fitBadge.label" class="shrink-0" />
    </div>

    <dl class="grid grid-cols-3 gap-2 text-sm">
      <div>
        <dt class="text-muted">
          {{ copy.download }}
        </dt>
        <dd class="font-mono text-default">
          {{ model.downloadGB ? `${model.downloadGB} GB` : '?' }}
        </dd>
      </div>
      <div>
        <dt class="text-muted">
          {{ copy.needs }}
        </dt>
        <dd class="font-mono text-default">
          {{ memory ? `${memory.toFixed(1)} GB` : '?' }}
        </dd>
      </div>
      <div>
        <dt class="text-muted">
          {{ copy.license }}
        </dt>
        <dd class="font-mono text-default">
          {{ model.license ?? '?' }}
        </dd>
      </div>
    </dl>

    <ul class="flex flex-wrap gap-1.5" :aria-label="copy.capabilitiesLabel">
      <li v-for="capability in model.capabilities" :key="capability">
        <UBadge color="neutral" variant="outline" size="sm" :label="copy.capabilities[capability]" />
      </li>
    </ul>

    <div class="mt-auto flex flex-wrap items-center gap-2">
      <code class="min-w-0 flex-1 truncate rounded-md bg-elevated px-2 py-1.5 font-mono text-xs text-default">{{ command }}</code>
      <UButton size="sm" color="neutral" variant="soft" icon="i-lucide-copy" :aria-label="copy.copy(command)" @click="copyCommand" />
      <UButton size="sm" color="neutral" variant="ghost" trailing-icon="i-lucide-external-link" :to="model.url" target="_blank" :label="copy.modelPage" />
    </div>
  </UCard>
</template>
