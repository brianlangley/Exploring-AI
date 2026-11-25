<script setup lang="ts">
import type { OperatingSystem } from '~/composables/useDevice'

type Platform = Exclude<OperatingSystem, 'other'>

const { operatingSystem } = useDevice()
const { messages } = useLocale()
const copy = computed(() => messages.value.download)

// Official direct links; each redirects to the latest installer (checked 25 November 2026).
const PLATFORMS: { id: Platform, icon: string, builds: { architecture: string, url: string }[] }[] = [
  { id: 'mac', icon: 'i-lucide-apple', builds: [{ architecture: 'Apple Silicon', url: 'https://lmstudio.ai/download/latest/darwin/arm64' }] },
  {
    id: 'windows',
    icon: 'i-lucide-monitor',
    builds: [
      { architecture: 'x64', url: 'https://lmstudio.ai/download/latest/win32/x64' },
      { architecture: 'ARM64', url: 'https://lmstudio.ai/download/latest/win32/arm64' },
    ],
  },
  {
    id: 'linux',
    icon: 'i-lucide-terminal',
    builds: [
      { architecture: 'x64', url: 'https://lmstudio.ai/download/latest/linux/x64' },
      { architecture: 'ARM64', url: 'https://lmstudio.ai/download/latest/linux/arm64' },
    ],
  },
]

// The visitor's own system first and highlighted; the others stay available (for example a Mac user on a school PC).
const platforms = computed(() => [...PLATFORMS]
  .sort((first, second) => Number(second.id === operatingSystem.value) - Number(first.id === operatingSystem.value))
  .map(platform => ({ ...platform, ...copy.value[platform.id], isCurrent: platform.id === operatingSystem.value })))
</script>

<template>
  <ContentSection id="download" :eyebrow="copy.eyebrow" :title="copy.title" :intro="copy.intro">
    <ul class="grid gap-4 @5xl:grid-cols-3">
      <li v-for="platform in platforms" :key="platform.id">
        <UCard class="h-full" :class="platform.isCurrent ? 'ring-2 ring-primary' : ''" :ui="{ body: 'flex flex-col gap-4 h-full' }">
          <div class="flex items-center justify-between gap-3">
            <h3 class="flex items-center gap-2 font-display text-xl font-semibold text-highlighted">
              <UIcon :name="platform.icon" class="size-5 text-primary" />
              {{ platform.name }}
            </h3>
            <UBadge v-if="platform.isCurrent" color="primary" variant="subtle" :label="copy.yourSystem" />
          </div>
          <p class="text-sm text-default">
            {{ platform.requirements }}
          </p>
          <div class="mt-auto flex flex-col gap-2">
            <UButton
              v-for="(build, index) in platform.builds"
              :key="build.url"
              :to="build.url"
              target="_blank"
              icon="i-lucide-download"
              :color="platform.isCurrent && index === 0 ? 'primary' : 'neutral'"
              :variant="platform.isCurrent && index === 0 ? 'solid' : 'outline'"
              :label="copy.downloadFor(platform.name, build.architecture)"
            />
          </div>
        </UCard>
      </li>
    </ul>

    <div class="mt-4 flex flex-wrap gap-x-6">
      <UButton to="https://lmstudio.ai/download" target="_blank" color="neutral" variant="link" trailing-icon="i-lucide-external-link" :label="copy.allVersions" class="px-0" />
      <UButton to="https://lmstudio.ai/docs/app/system-requirements" target="_blank" color="neutral" variant="link" trailing-icon="i-lucide-external-link" :label="copy.requirements" class="px-0" />
    </div>

    <UCard class="mt-8">
      <h3 class="font-display text-lg font-semibold text-highlighted">
        {{ copy.headlessTitle }}
      </h3>
      <p class="mt-1 text-sm text-muted">
        {{ copy.headlessText }}
      </p>
      <dl class="mt-4 grid gap-3 text-sm @3xl:grid-cols-2">
        <div>
          <dt class="text-muted">
            {{ copy.macLinux }}
          </dt>
          <dd><code class="block overflow-x-auto rounded-md bg-elevated px-2 py-1.5 font-mono text-xs">curl -fsSL https://lmstudio.ai/install.sh | bash</code></dd>
        </div>
        <div>
          <dt class="text-muted">
            {{ copy.windowsShell }}
          </dt>
          <dd><code class="block overflow-x-auto rounded-md bg-elevated px-2 py-1.5 font-mono text-xs">irm https://lmstudio.ai/install.ps1 | iex</code></dd>
        </div>
      </dl>
    </UCard>
  </ContentSection>
</template>
