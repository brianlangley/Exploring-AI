<script setup lang="ts">
const { messages } = useLocale()
</script>

<template>
  <footer class="border-t border-default bg-default">
    <UContainer class="flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <div class="flex shrink-0 flex-col gap-1">
        <p>{{ messages.footer.course }}</p>
        <p>
          {{ messages.footer.madeBy }}
          <span class="font-medium text-default">Brian Langley</span>
          ·
          <a
            href="https://github.com/brianlangley"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-default underline-offset-2 hover:underline"
          >GitHub</a>
          ·
          <a
            href="https://www.linkedin.com/in/brianlangley"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-default underline-offset-2 hover:underline"
          >LinkedIn</a>
        </p>
      </div>
      <p class="max-w-3xl sm:text-right">
        {{ messages.footer.disclaimer }}
      </p>
    </UContainer>
  </footer>
</template>
