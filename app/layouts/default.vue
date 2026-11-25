<template>
  <div class="flex min-h-dvh flex-col">
    <div class="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0a0b]/70 backdrop-blur-2xl backdrop-saturate-150">
      <SiteHeader />
    </div>
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
