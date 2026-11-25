<script setup lang="ts">
import { PRESENTATION_STEPS } from '~/utils/presentationSteps'

// The site: the long page, readable without 3D. The presentation route is /intro.
// Links from when the route lived at `/` (like /#jouw-computer) carry a step slug: send those on to that step.
// Step slugs are Dutch and section ids English, so a section anchor (#costs) never matches.
onMounted(() => {
  const slug = decodeURIComponent(location.hash.slice(1))
  if (PRESENTATION_STEPS.some(step => step.slug === slug)) navigateTo(`/intro#${slug}`, { replace: true })
})
</script>

<template>
  <div>
    <HeroSection />
    <IntroTeaser />
    <WhatIsSection />
    <DeviceCheck />
    <ModelPicker />
    <DownloadSection />
    <CostsSection />
    <VerdictSection />
    <AlternativesSection />
    <FurtherSection />
    <SourcesSection />
  </div>
</template>
