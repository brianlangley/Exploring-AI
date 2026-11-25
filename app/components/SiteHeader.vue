<script setup lang="ts">
const { sections } = useSiteNavigation()
const { locale, messages, setLocale } = useLocale()

function toggleLocale() {
  setLocale(locale.value === 'nl' ? 'en' : 'nl')
}
</script>

<template>
  <header>
    <UContainer class="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-3">
      <a href="#top" class="rounded-sm font-display text-lg font-semibold tracking-tight text-highlighted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        {{ messages.header.title }}
      </a>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <nav :aria-label="messages.header.navLabel">
          <ul class="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
            <!-- Back to the start of the presentation route. -->
            <li>
              <NuxtLink
                to="/"
                class="inline-flex items-center gap-1 rounded-sm text-primary transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                <UIcon name="i-lucide-play" class="size-3.5" />
                {{ messages.nav.intro }}
              </NuxtLink>
            </li>
            <li v-for="section in sections" :key="section.id">
              <a
                :href="`#${section.id}`"
                class="rounded-sm text-muted transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                {{ section.label }}
              </a>
            </li>
          </ul>
        </nav>
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-languages"
          :label="messages.switchTo"
          :aria-label="messages.switchLabel"
          :lang="locale === 'nl' ? 'en' : 'nl'"
          @click="toggleLocale"
        />
      </div>
    </UContainer>
  </header>
</template>
