<script setup lang="ts">
import { DEMO_MODEL_ID } from '~/utils/demoModel'
import type { MockStage } from '~/composables/useMockComputer'

// The LM Studio window inside the simulation: our own simplified layout, the official icon unchanged.
const { stage, phase, progress, run, openStage } = useMockComputer()
const { localModels } = useModels()
const { specs } = useDevice()
const { messages } = useLocale()
const copy = computed(() => messages.value.mock)

const model = computed(() => localModels.find(candidate => candidate.id === DEMO_MODEL_ID) ?? localModels[0]!)
const fit = computed(() => fitModel(model.value, specs.value))
const neededGB = computed(() => neededMemoryGB(model.value) ?? 0)
const fitLabel = computed(() => messages.value.models.fit[fit.value])

const tabs: { stage: MockStage, icon: string }[] = [
  { stage: 'discover', icon: 'i-lucide-search' },
  { stage: 'load', icon: 'i-lucide-hard-drive' },
  { stage: 'chat', icon: 'i-lucide-message-square' },
  { stage: 'server', icon: 'i-lucide-terminal' },
]
const stageNumber: Record<MockStage, number> = { desktop: 0, browser: 1, installer: 2, discover: 3, load: 4, chat: 5, server: 6 }

const percent = computed(() => `${Math.round(progress.value * 100)}%`)
const downloadedGB = computed(() => ((model.value.downloadGB ?? 0) * progress.value).toFixed(1))
// Streamed answer: characters appear with the progress, like tokens.
const streamed = computed(() => {
  const answer = copy.value.chatAnswer
  if (phase.value === 'idle') return ''
  return answer.slice(0, Math.round(answer.length * progress.value))
})
const isServerOn = computed(() => stage.value === 'server' && phase.value === 'done')
const curl = computed(() => `curl http://localhost:1234/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${DEMO_MODEL_ID}", "messages": [{"role": "user", "content": "${copy.value.curlQuestion}"}]}'`)
</script>

<template>
  <div class="flex overflow-hidden rounded-xl border border-white/10 bg-[#11141b] shadow-2xl">
    <!-- Sidebar -->
    <nav class="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-white/10 bg-black/30 py-3" :aria-label="copy.appNav">
      <img src="/brand/LM Studio Icon Color.png" alt="LM Studio" class="mb-2 size-8">
      <button
        v-for="tab in tabs"
        :key="tab.stage"
        type="button"
        class="grid size-11 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
        :class="stage === tab.stage ? 'bg-violet-500/25 text-violet-200' : ''"
        :aria-label="copy.tabs[tab.stage as 'discover' | 'load' | 'chat' | 'server']"
        :aria-current="stage === tab.stage ? 'page' : undefined"
        @click="openStage(stageNumber[tab.stage])"
      >
        <UIcon :name="tab.icon" class="size-5" />
      </button>
    </nav>

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Top bar: model loader -->
      <div class="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <span class="text-[13px] text-zinc-500">{{ copy.tabs[stage as 'discover' | 'load' | 'chat' | 'server'] }}</span>
        <span class="ml-auto rounded-md border border-white/10 bg-white/5 px-3 py-1 font-mono text-[13px]" :class="['chat', 'server'].includes(stage) || (stage === 'load' && phase === 'done') ? 'text-emerald-300' : 'text-zinc-500'">
          {{ ['chat', 'server'].includes(stage) || (stage === 'load' && phase === 'done') ? `● ${model.name}` : copy.noModel }}
        </span>
      </div>

      <!-- Discover: search and download -->
      <div v-if="stage === 'discover'" class="flex flex-1 gap-4 overflow-hidden p-5">
        <div class="w-[420px] shrink-0">
          <div class="flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 py-2">
            <UIcon name="i-lucide-search" class="size-4 text-zinc-500" />
            <span class="font-mono text-[14px]">qwen3.5 9b</span>
            <span class="ml-auto text-[12px] text-zinc-500">Ctrl/Cmd + Shift + M</span>
          </div>
          <div class="mt-3 rounded-lg border border-violet-400/50 bg-violet-500/10 p-3">
            <p class="font-semibold">
              {{ model.name }}
            </p>
            <p class="text-[13px] text-zinc-400">
              {{ model.publisher }} · {{ model.params }} · {{ model.license }}
            </p>
          </div>
        </div>
        <div class="flex-1 rounded-lg border border-white/10 p-4">
          <p class="text-[13px] uppercase tracking-wider text-zinc-500">
            {{ copy.quantTitle }}
          </p>
          <ul class="mt-3 flex flex-col gap-2">
            <li class="flex items-center gap-3 rounded-lg border border-violet-400/60 bg-violet-500/15 px-3 py-2">
              <span class="font-mono">Q4_K_M</span>
              <span class="text-[13px] text-zinc-400">{{ model.downloadGB }} GB · {{ copy.recommended }}</span>
              <span class="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[12px]">{{ fitLabel }}</span>
            </li>
            <li class="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-zinc-400">
              <span class="font-mono">Q8_0</span>
              <span class="text-[13px]">{{ copy.quantBigger }}</span>
            </li>
            <li class="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-zinc-400">
              <span class="font-mono">Q3_K_S</span>
              <span class="text-[13px]">{{ copy.quantSmaller }}</span>
            </li>
          </ul>
          <div class="mt-6">
            <button v-if="phase === 'idle'" type="button" class="rounded-lg bg-violet-500 px-5 py-2.5 font-semibold text-white hover:bg-violet-400" @click="run">
              {{ copy.downloadModel }}
            </button>
            <MockProgress v-else :value="progress" :label="phase === 'done' ? copy.modelReady : `${downloadedGB} / ${model.downloadGB} GB · ${percent}`" />
            <button v-if="phase === 'done'" type="button" class="mt-3 text-violet-300 underline" @click="openStage(4)">
              {{ copy.toLoad }}
            </button>
          </div>
        </div>
      </div>

      <!-- Load: memory fills -->
      <div v-else-if="stage === 'load'" class="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
        <p class="text-2xl font-semibold">
          {{ model.name }}
        </p>
        <p class="text-zinc-400">
          {{ copy.loadText(neededGB.toFixed(1), specs.ramGB) }}
        </p>
        <div class="w-[480px]">
          <MockProgress :value="phase === 'idle' ? 0 : progress * Math.min(1, neededGB / specs.ramGB)" :label="`${(neededGB * (phase === 'idle' ? 0 : progress)).toFixed(1)} / ${specs.ramGB} GB RAM`" />
        </div>
        <button v-if="phase === 'idle'" type="button" class="rounded-lg bg-violet-500 px-5 py-2.5 font-semibold text-white hover:bg-violet-400" @click="run">
          {{ copy.loadButton }} <span class="ml-1 text-[12px] opacity-70">Ctrl/Cmd + L</span>
        </button>
        <button v-if="phase === 'done'" type="button" class="text-violet-300 underline" @click="openStage(5)">
          {{ copy.toChat }}
        </button>
      </div>

      <!-- Chat: scripted answer streams -->
      <div v-else-if="stage === 'chat'" class="flex flex-1 flex-col overflow-hidden">
        <div class="flex-1 space-y-4 overflow-hidden p-6">
          <p class="ml-auto max-w-[70%] rounded-2xl rounded-br-sm bg-violet-500/30 px-4 py-2.5">
            {{ copy.chatQuestion }}
          </p>
          <p v-if="phase !== 'idle'" class="max-w-[80%] rounded-2xl rounded-bl-sm bg-white/5 px-4 py-2.5 leading-relaxed">
            {{ streamed }}<span v-if="phase === 'running'" class="animate-pulse">▍</span>
          </p>
          <p v-if="phase === 'done'" class="font-mono text-[12px] text-zinc-500">
            {{ copy.chatStats }}
          </p>
        </div>
        <div class="flex items-center gap-3 border-t border-white/10 p-4">
          <span class="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-zinc-500">{{ copy.chatPlaceholder }}</span>
          <button v-if="phase === 'idle'" type="button" class="rounded-lg bg-violet-500 px-4 py-2 font-semibold text-white hover:bg-violet-400" @click="run">
            {{ copy.send }}
          </button>
          <button v-if="phase === 'done'" type="button" class="text-violet-300 underline" @click="openStage(6)">
            {{ copy.toServer }}
          </button>
        </div>
      </div>

      <!-- Developer: local server -->
      <div v-else-if="stage === 'server'" class="flex flex-1 flex-col gap-4 overflow-hidden p-6">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold"
            :class="isServerOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-500 text-white hover:bg-violet-400'"
            @click="phase === 'idle' && run()"
          >
            <span class="size-2.5 rounded-full" :class="isServerOn ? 'bg-emerald-400' : 'bg-white/60'" />
            {{ isServerOn ? copy.serverRunning : copy.serverStart }}
          </button>
          <span class="font-mono text-[14px] text-zinc-400">http://localhost:1234</span>
        </div>
        <pre class="overflow-hidden rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-zinc-300">{{ curl }}</pre>
        <pre v-if="isServerOn" class="overflow-hidden rounded-lg border border-emerald-400/30 bg-emerald-500/5 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-emerald-200">{ "choices": [{ "message": { "role": "assistant", "content": "{{ copy.curlAnswer }}" } }] }</pre>
      </div>
    </div>
  </div>
</template>
