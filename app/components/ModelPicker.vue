<script setup lang="ts">
import type { ModelCapability, ModelTier } from '~/types/model'

const { localModels, cloudModels, verifiedOn } = useModels()
const { specs } = useDevice()
const { messages } = useLocale()
const copy = computed(() => messages.value.models)

const tierOptions = computed<{ label: string, value: ModelTier | 'all' }[]>(() => [
  { label: copy.value.all, value: 'all' },
  { label: '8 GB', value: '8GB' },
  { label: '16 GB', value: '16GB' },
  { label: '32 GB', value: '32GB' },
  { label: '64 GB+', value: '64GB+' },
])
const capabilityOptions = computed<{ label: string, value: ModelCapability | 'all' }[]>(() => [
  { label: copy.value.any, value: 'all' },
  ...(['vision', 'tools', 'reasoning', 'coding'] as const).map(value => ({ label: copy.value.capabilities[value], value })),
])

const tier = ref<ModelTier | 'all'>('all')
const capability = ref<ModelCapability | 'all'>('all')

const visibleModels = computed(() => localModels
  .filter(model => tier.value === 'all' || model.tier === tier.value)
  .filter(model => capability.value === 'all' || model.capabilities.includes(capability.value))
  .map(model => ({ model, fit: fitModel(model, specs.value) })))

const cloudNames = computed(() => cloudModels.map(model => model.name).join(', '))
</script>

<template>
  <ContentSection id="models" :eyebrow="copy.eyebrow" :title="copy.title" :intro="copy.intro(verifiedOn)">
    <div class="flex flex-col gap-4 @2xl:flex-row @2xl:gap-10">
      <UFormField :label="copy.tier" name="tier">
        <URadioGroup v-model="tier" :items="tierOptions" orientation="horizontal" variant="table" class="mt-2" />
      </UFormField>
      <UFormField :label="copy.canDo" name="capability">
        <URadioGroup v-model="capability" :items="capabilityOptions" orientation="horizontal" variant="table" class="mt-2" />
      </UFormField>
    </div>

    <p v-if="!visibleModels.length" class="mt-8 text-muted">
      {{ copy.noMatch }}
    </p>
    <ul v-else class="mt-8 grid gap-4 @3xl:grid-cols-2 @7xl:grid-cols-3">
      <li v-for="item in visibleModels" :key="item.model.id">
        <ModelCard :model="item.model" :fit="item.fit" />
      </li>
    </ul>

    <UAlert
      class="mt-8"
      color="warning"
      variant="subtle"
      icon="i-lucide-server"
      :title="copy.cloudTitle"
      :description="copy.cloudText(cloudNames)"
    />

    <p class="mt-6 flex items-center gap-2 text-sm text-muted">
      <UIcon name="i-lucide-save" class="size-4 shrink-0 text-primary" />
      {{ copy.floppyFact }}
    </p>
  </ContentSection>
</template>
