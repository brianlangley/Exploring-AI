<script setup lang="ts">
const { messages } = useLocale()
const copy = computed(() => messages.value.what)
const comparison = computed(() => [
  { ...copy.value.local, icon: 'i-lucide-laptop' },
  { ...copy.value.cloud, icon: 'i-lucide-cloud' },
])
</script>

<template>
  <ContentSection id="what" :eyebrow="copy.eyebrow" :title="copy.title" :intro="copy.intro">
    <div class="grid gap-6 @3xl:grid-cols-2">
      <UCard v-for="side in comparison" :key="side.icon">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon :name="side.icon" class="size-6 text-primary" />
            <h3 class="font-display text-xl font-semibold text-highlighted">
              {{ side.title }}
            </h3>
          </div>
        </template>
        <ul class="flex flex-col gap-2 text-default">
          <li v-for="point in side.points" :key="point" class="flex gap-2">
            <UIcon name="i-lucide-dot" class="mt-1 size-4 shrink-0 text-muted" />
            {{ point }}
          </li>
        </ul>
      </UCard>
    </div>

    <UAlert
      class="mt-6"
      color="neutral"
      variant="subtle"
      icon="i-lucide-sparkles"
      :title="copy.bionicTitle"
      :description="copy.bionicText"
    />
  </ContentSection>
</template>
