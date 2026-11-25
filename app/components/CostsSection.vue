<script setup lang="ts">
const { messages } = useLocale()
const copy = computed(() => messages.value.costs)

// From lmstudio.ai/pricing, checked 25 November 2026.
const plans = computed(() => [
  { name: 'Free', price: '$0', points: copy.value.plans.free, highlight: true },
  { name: 'Bionic+', price: `$20 ${copy.value.perMonth}`, points: copy.value.plans.plus, highlight: false },
  { name: 'Pro', price: `$100 ${copy.value.perMonth}`, points: copy.value.plans.pro, highlight: false },
  { name: 'Enterprise', price: copy.value.contactSales, points: copy.value.plans.enterprise, highlight: false },
])
</script>

<template>
  <ContentSection id="costs" :eyebrow="copy.eyebrow" :title="copy.title" :intro="copy.intro">
    <ul class="grid gap-4 @3xl:grid-cols-2 @7xl:grid-cols-4">
      <li v-for="plan in plans" :key="plan.name">
        <UCard class="h-full" :class="plan.highlight ? 'ring-2 ring-primary' : ''">
          <h3 class="font-display text-lg font-semibold text-highlighted">
            {{ plan.name }}
          </h3>
          <p class="mt-1 font-serif text-4xl text-highlighted">
            {{ plan.price }}
          </p>
          <ul class="mt-4 flex flex-col gap-2 text-sm text-default">
            <li v-for="point in plan.points" :key="point" class="flex gap-2">
              <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-muted" />
              {{ point }}
            </li>
          </ul>
        </UCard>
      </li>
    </ul>

    <h3 class="mt-10 font-display text-xl font-semibold text-highlighted">
      {{ copy.hiddenTitle }}
    </h3>
    <ul class="mt-3 flex flex-col gap-2 text-default">
      <li v-for="cost in copy.hidden" :key="cost" class="flex gap-2">
        <UIcon name="i-lucide-receipt" class="mt-1 size-4 shrink-0 text-warning" />
        {{ cost }}
      </li>
    </ul>
  </ContentSection>
</template>
