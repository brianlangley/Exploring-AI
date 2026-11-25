<script setup lang="ts">
const { sections } = useSiteNavigation()
const { locale, messages, setLocale } = useLocale()

function toggleLocale() {
  setLocale(locale.value === 'nl' ? 'en' : 'nl')
}
</script>

<template>
  <header>
    <UContainer class="flex h-13 items-center justify-between gap-3 sm:gap-6">
      <a href="#top" class="flex shrink-0 items-center gap-2 rounded-sm font-display text-[15px] font-semibold tracking-tight text-highlighted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        <img src="/favicon.svg" alt="" class="size-5">
        {{ messages.header.title }}
      </a>
      <div class="flex min-w-0 items-center gap-3 sm:gap-5">
        <!-- One line that scrolls sideways on small screens instead of wrapping the bar. -->
        <nav :aria-label="messages.header.navLabel" class="overflow-x-auto [scrollbar-width:none] max-md:shrink-0 md:min-w-0">
          <ul class="flex gap-x-6 whitespace-nowrap py-1 text-xs font-medium">
            <!-- The 3D presentation route lives on its own page. -->
            <li>
              <NuxtLink
                to="/intro"
                class="inline-flex items-center gap-1 rounded-sm text-primary transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                <UIcon name="i-lucide-play" class="size-3.5" />
                {{ messages.nav.intro }}
              </NuxtLink>
            </li>
            <!-- Phones: only the intro link; the sections follow each other on the page anyway. -->
            <li v-for="section in sections" :key="section.id" class="max-md:hidden">
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
          size="xs"
          color="neutral"
          variant="soft"
          class="shrink-0"
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
