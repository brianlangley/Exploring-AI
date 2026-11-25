<script setup lang="ts">
import { en as uiEnglish, nl as uiDutch } from '@nuxt/ui/locale'

const { locale, messages, chooseLocale } = useLocale()

const uiLocale = computed(() => (locale.value === 'nl' ? uiDutch : uiEnglish))
useHead(() => ({ htmlAttrs: { lang: locale.value }, title: messages.value.header.title }))

onMounted(chooseLocale)
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
