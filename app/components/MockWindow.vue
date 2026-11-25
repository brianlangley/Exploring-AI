<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <!-- A window of the simulated desktop: title bar with three dots, content below. -->
  <div class="absolute flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#161a22]/95 shadow-2xl">
    <div class="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 px-3">
      <span class="size-3 rounded-full bg-[#ff5f57]" />
      <span class="size-3 rounded-full bg-[#febc2e]" />
      <span class="size-3 rounded-full bg-[#28c840]" />
      <span class="ml-3 text-[13px] text-zinc-400">{{ title }}</span>
    </div>
    <div class="min-h-0 flex-1">
      <slot />
    </div>
  </div>
</template>
