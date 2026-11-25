<script setup lang="ts">
// Simulated computer on the 3D monitor (PLAN-v3 section 3). Our own desktop style, clearly labelled as a simulation.
// Designed at 1280 x 704 and scaled to the monitor's size on the page.
const BASE_WIDTH = 1280
const BASE_HEIGHT = 704

const screenRect = useState<{ left: number, top: number, width: number, height: number } | null>('mock-screen-rect', () => null)
const { stage, phase, progress, run, openStage } = useMockComputer()
const { messages } = useLocale()
const copy = computed(() => messages.value.mock)

const frameStyle = computed(() => {
  const rect = screenRect.value
  if (!rect) return undefined
  const scale = Math.min(rect.width / BASE_WIDTH, rect.height / BASE_HEIGHT)
  return {
    left: `${rect.left + (rect.width - BASE_WIDTH * scale) / 2}px`,
    top: `${rect.top + (rect.height - BASE_HEIGHT * scale) / 2}px`,
    width: `${BASE_WIDTH}px`,
    height: `${BASE_HEIGHT}px`,
    transform: `scale(${scale})`,
  }
})

const isAppStage = computed(() => ['discover', 'load', 'chat', 'server'].includes(stage.value))
const percent = computed(() => `${Math.round(progress.value * 100)}%`)
</script>

<template>
  <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition-opacity duration-500" leave-active-class="transition-opacity duration-150">
    <div
      v-if="frameStyle"
      class="pointer-events-auto absolute origin-top-left overflow-hidden rounded-[6px] bg-[#0d1016] font-sans text-[15px] text-zinc-100 select-none"
      :style="frameStyle"
      role="region"
      :aria-label="copy.label"
    >
      <!-- Our own desktop: soft gradient, menu bar, dock. -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#2a2150,transparent_60%),radial-gradient(ellipse_at_80%_90%,#0f3b2b,transparent_55%)]" />
      <div class="absolute inset-x-0 top-0 flex h-7 items-center justify-between bg-black/40 px-4 text-[13px] text-zinc-300 backdrop-blur">
        <span class="font-semibold">{{ copy.os }}</span>
        <span class="rounded-full bg-amber-400/90 px-2 py-0.5 text-[11px] font-semibold text-black">{{ copy.simulation }}</span>
      </div>

      <!-- Stage 1: desktop, open the browser from the dock. -->
      <div v-if="stage === 'desktop'" class="absolute inset-0 grid place-items-center">
        <p class="max-w-md text-center text-lg text-zinc-200">
          {{ copy.desktopHint }}
        </p>
      </div>
      <!-- Stage 2: browser on the download page (our own simplified layout). -->
      <MockWindow v-else-if="stage === 'browser'" :title="copy.browserTitle" class="left-24 top-14 h-[560px] w-[1080px]">
        <div class="flex items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2">
          <span class="flex-1 rounded-md bg-black/40 px-3 py-1 font-mono text-[13px] text-zinc-300">lmstudio.ai/download</span>
        </div>
        <div class="flex flex-col items-center gap-5 px-10 py-14 text-center">
          <img src="/brand/LM Studio Logo Color White.png" alt="LM Studio" class="h-12">
          <h3 class="text-3xl font-semibold">
            {{ copy.downloadTitle }}
          </h3>
          <p class="text-zinc-400">
            {{ copy.downloadText }}
          </p>
          <button
            type="button"
            class="rounded-lg bg-violet-500 px-6 py-3 font-semibold text-white hover:bg-violet-400 disabled:opacity-60"
            :disabled="phase !== 'idle'"
            @click="run"
          >
            {{ copy.downloadButton }}
          </button>
          <div v-if="phase !== 'idle'" class="w-96">
            <MockProgress :value="progress" :label="phase === 'done' ? copy.downloaded : `${copy.downloading} ${percent}`" />
          </div>
          <button v-if="phase === 'done'" type="button" class="text-violet-300 underline" @click="openStage(2)">
            {{ copy.openInstaller }}
          </button>
        </div>
      </MockWindow>

      <!-- Stage 3: installer. -->
      <MockWindow v-else-if="stage === 'installer'" :title="copy.installerTitle" class="left-[340px] top-[150px] h-[360px] w-[600px]">
        <div class="flex h-full flex-col items-center justify-center gap-5 px-10 pb-8 text-center">
          <img src="/brand/LM Studio Icon Color.png" alt="" class="size-16">
          <p class="text-lg">
            {{ phase === 'done' ? copy.installed : copy.installText }}
          </p>
          <MockProgress v-if="phase !== 'idle'" :value="progress" :label="phase === 'done' ? '100%' : percent" class="w-80" />
          <button
            v-if="phase !== 'running'"
            type="button"
            class="rounded-lg bg-violet-500 px-5 py-2.5 font-semibold text-white hover:bg-violet-400"
            @click="phase === 'done' ? openStage(3) : run()"
          >
            {{ phase === 'done' ? copy.launch : copy.install }}
          </button>
        </div>
      </MockWindow>

      <!-- Stages 4 to 7: the app. -->
      <MockLmStudio v-else-if="isAppStage" class="absolute inset-x-4 top-9 bottom-4" />

      <!-- Dock (outside the stage chain above). -->
      <div v-if="!isAppStage" class="absolute inset-x-0 bottom-3 flex justify-center">
        <div class="flex gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
          <button
            type="button"
            class="grid size-14 place-items-center rounded-xl bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-lg"
            :class="stage === 'desktop' ? 'ring-4 ring-violet-400/70 animate-pulse motion-reduce:animate-none' : ''"
            :aria-label="copy.browserTitle"
            @click="stage === 'desktop' && run()"
          >
            <UIcon name="i-lucide-globe" class="size-8" />
          </button>
        </div>
      </div>

    </div>
  </Transition>
</template>
