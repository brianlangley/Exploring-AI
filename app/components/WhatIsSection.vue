<script setup lang="ts">
const { messages } = useLocale()
const copy = computed(() => messages.value.what)
const comparison = computed(() => [
  { ...copy.value.local, icon: 'i-lucide-laptop', accent: true },
  { ...copy.value.cloud, icon: 'i-lucide-cloud', accent: false },
])
</script>

<template>
  <!-- Motion comes from ContentSection's scroll reveal: heading, then these cards, fade up in turn. -->
  <ContentSection id="what" :eyebrow="copy.eyebrow" :title="copy.title" :intro="copy.intro">
    <div class="grid gap-6 @3xl:grid-cols-2">
      <UCard
        v-for="side in comparison"
        :key="side.icon"
        class="transition duration-300 hover:-translate-y-1 hover:ring-white/[0.12]"
        :class="side.accent ? 'bg-[radial-gradient(120%_80%_at_0%_0%,rgb(117_80_240/0.14),transparent_60%)]' : ''"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <span class="grid size-11 place-items-center rounded-2xl" :class="side.accent ? 'bg-primary/15' : 'bg-white/[0.06]'">
              <UIcon :name="side.icon" class="size-6" :class="side.accent ? 'text-primary' : 'text-toned'" />
            </span>
            <h3 class="font-display text-2xl font-semibold tracking-tight text-highlighted">
              {{ side.title }}
            </h3>
          </div>
        </template>
        <ul class="flex flex-col gap-3 text-default">
          <li v-for="point in side.points" :key="point" class="flex gap-2">
            <UIcon name="i-lucide-check" class="mt-1 size-4 shrink-0" :class="side.accent ? 'text-primary' : 'text-muted'" />
            {{ point }}
          </li>
        </ul>
      </UCard>
    </div>

    <UAlert
      class="mt-6 rounded-3xl"
      color="neutral"
      variant="subtle"
      icon="i-lucide-sparkles"
      :title="copy.bionicTitle"
      :description="copy.bionicText"
    />
  </ContentSection>
</template>
