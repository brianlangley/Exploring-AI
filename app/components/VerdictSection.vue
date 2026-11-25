<script setup lang="ts">
const { messages } = useLocale()
const copy = computed(() => messages.value.verdict)

const columns = computed(() => [
  { ...copy.value.strengths, icon: 'i-lucide-thumbs-up', color: 'text-success' },
  { ...copy.value.weaknesses, icon: 'i-lucide-thumbs-down', color: 'text-error' },
  { ...copy.value.good, icon: 'i-lucide-circle-check', color: 'text-success' },
  { ...copy.value.bad, icon: 'i-lucide-circle-x', color: 'text-error' },
])
</script>

<template>
  <ContentSection id="verdict" :eyebrow="copy.eyebrow" :title="copy.title">
    <div class="grid gap-6 @3xl:grid-cols-2">
      <UCard v-for="column in columns" :key="column.icon">
        <template #header>
          <h3 class="flex items-center gap-2 font-display text-xl font-semibold text-highlighted">
            <UIcon :name="column.icon" class="size-5" :class="column.color" />
            {{ column.title }}
          </h3>
        </template>
        <ul class="flex flex-col gap-2 text-default">
          <li v-for="point in column.points" :key="point">
            {{ point }}
          </li>
        </ul>
      </UCard>
    </div>
  </ContentSection>
</template>
