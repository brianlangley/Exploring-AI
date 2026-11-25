<script setup lang="ts">
import credits from '~~/data/credits.json'

const { messages } = useLocale()
const { milestones } = useAiTimeline()
const copy = computed(() => messages.value.sources)

const lmStudioUrls = {
  home: 'https://lmstudio.ai',
  pricing: 'https://lmstudio.ai/pricing',
  changelog: 'https://lmstudio.ai/changelog/lmstudio',
  download: 'https://lmstudio.ai/download',
  requirements: 'https://lmstudio.ai/docs/app/system-requirements',
  developer: 'https://lmstudio.ai/docs/developer',
  catalog: 'https://lmstudio.ai/models',
  link: 'https://lmstudio.ai/link',
  brand: 'https://lmstudio.ai/brand',
  freeForWork: 'https://lmstudio.ai/blog/free-for-work',
  huggingFace: 'https://huggingface.co/docs/hub/lmstudio',
  deviceMemory: 'https://developer.mozilla.org/docs/Web/API/Navigator/deviceMemory',
} as const

const groups = computed(() => [
  {
    title: copy.value.lmStudio,
    links: (Object.keys(lmStudioUrls) as (keyof typeof lmStudioUrls)[]).map(key => ({ label: copy.value.links[key], url: lmStudioUrls[key] })),
  },
  {
    title: copy.value.timeline,
    links: milestones.value.map(milestone => ({ label: `${milestone.year}: ${milestone.event}`, url: milestone.source })),
  },
])
</script>

<template>
  <ContentSection id="sources" :eyebrow="copy.eyebrow" :title="copy.title" :intro="copy.intro">
    <div class="grid gap-10 @5xl:grid-cols-2">
      <div v-for="group in groups" :key="group.title">
        <h3 class="font-display text-lg font-semibold text-highlighted">
          {{ group.title }}
        </h3>
        <ul class="mt-3 flex flex-col gap-2">
          <li v-for="link in group.links" :key="link.label">
            <ULink :to="link.url" target="_blank" class="inline-flex items-start gap-1.5 text-default hover:text-primary">
              {{ link.label }}
              <UIcon name="i-lucide-external-link" class="mt-1 size-3.5 shrink-0 text-muted" />
            </ULink>
          </li>
        </ul>
      </div>
    </div>

    <h3 class="mt-10 font-display text-lg font-semibold text-highlighted">
      {{ copy.credits }}
    </h3>
    <p class="mt-2 text-sm text-muted">
      {{ copy.creditsIntro }}
    </p>
    <ul class="mt-3 grid gap-x-8 gap-y-2 @3xl:grid-cols-2">
      <li v-for="credit in credits.models" :key="credit.url" class="text-default">
        <ULink :to="credit.url" target="_blank" class="hover:text-primary">
          "{{ credit.name }}"
        </ULink>
        · {{ credit.author }} ·
        <ULink :to="credit.licenceUrl" target="_blank" class="text-muted hover:text-primary">
          {{ credit.licence }}
        </ULink>
      </li>
    </ul>
  </ContentSection>
</template>
