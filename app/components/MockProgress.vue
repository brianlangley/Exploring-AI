<script setup lang="ts">
defineProps<{
  // 0 to 1
  value: number
  label: string
}>()
</script>

<template>
  <div>
    <div class="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" :aria-valuenow="Math.round(value * 100)" aria-valuemin="0" aria-valuemax="100" :aria-label="label">
      <div class="h-full rounded-full bg-violet-400" :style="{ width: `${value * 100}%` }" />
    </div>
    <p class="mt-1.5 font-mono text-[12px] text-zinc-400">
      {{ label }}
    </p>
  </div>
</template>
