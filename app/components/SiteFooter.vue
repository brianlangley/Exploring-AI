<script setup lang="ts">
const { messages } = useLocale()
</script>

<template>
  <footer class="border-t border-default bg-default">
    <UContainer class="flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <p class="shrink-0">
        {{ messages.footer.course }}
      </p>
      <p class="max-w-3xl sm:text-right">
        {{ messages.footer.disclaimer }}
      </p>
    </UContainer>
  </footer>
</template>
