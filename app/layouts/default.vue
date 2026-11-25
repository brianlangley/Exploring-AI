<template>
  <div class="flex min-h-dvh flex-col">
    <div class="sticky top-0 z-30 border-b border-default bg-default/85 backdrop-blur">
      <SiteHeader />
    </div>
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
