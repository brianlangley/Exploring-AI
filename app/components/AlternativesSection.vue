<script setup lang="ts">
const { messages } = useLocale()
const copy = computed(() => messages.value.alternatives)
const columns = ['where', 'app', 'api', 'price', 'openSource'] as const
</script>

<template>
  <ContentSection id="alternatives" :eyebrow="copy.eyebrow" :title="copy.title" :intro="copy.intro">
    <div class="overflow-x-auto rounded-2xl bg-white/[0.025]">
      <table class="w-full min-w-[40rem] text-left text-sm">
        <thead class="bg-elevated text-muted">
          <tr>
            <th scope="col" class="px-3 py-2 font-medium">
              {{ copy.headers.tool }}
            </th>
            <th v-for="column in columns" :key="column" scope="col" class="px-3 py-2 font-medium">
              {{ copy.headers[column] }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="(row, index) in copy.rows" :key="row.tool" :class="index === 0 ? 'bg-primary/10' : ''">
            <th scope="row" class="px-3 py-2 font-semibold text-highlighted">
              {{ row.tool }}
            </th>
            <td v-for="column in columns" :key="column" class="px-3 py-2 text-default">
              {{ row[column] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </ContentSection>
</template>
