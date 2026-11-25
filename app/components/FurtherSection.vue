<script setup lang="ts">
const { messages } = useLocale()
const copy = computed(() => messages.value.further)
const icons = ['i-lucide-smartphone', 'i-lucide-house', 'i-lucide-server', 'i-lucide-terminal', 'i-lucide-wrench']
</script>

<template>
  <ContentSection id="further" :eyebrow="copy.eyebrow" :title="copy.title" :intro="copy.intro">
    <ul class="grid gap-4 @3xl:grid-cols-2">
      <li v-for="(item, index) in copy.items" :key="item.title" class="flex gap-3 rounded-2xl bg-white/[0.025] p-4">
        <UIcon :name="icons[index] ?? 'i-lucide-dot'" class="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <h3 class="font-display font-semibold text-highlighted">
            {{ item.title }}
          </h3>
          <p class="mt-1 text-sm text-default">
            {{ item.text }}
          </p>
        </div>
      </li>
    </ul>
  </ContentSection>
</template>
