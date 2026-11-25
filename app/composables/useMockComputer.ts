// The simulated computer on the 3D monitor (PLAN-v3 section 3): one scripted flow, no real downloads.
export const MOCK_STAGES = ['desktop', 'browser', 'installer', 'discover', 'load', 'chat', 'server'] as const
export type MockStage = typeof MOCK_STAGES[number]
export type MockPhase = 'idle' | 'running' | 'done'

// How long each stage's action takes. 0 = the action simply opens the next stage.
const DURATIONS: Record<MockStage, number> = {
  desktop: 0,
  browser: 2.2,
  installer: 2.6,
  discover: 3.2,
  load: 2.2,
  chat: 4.5,
  server: 0.8,
}

export function useMockComputer() {
  const stageIndex = useState('mock-stage', () => 0)
  const phase = useState<MockPhase>('mock-phase', () => 'idle')
  // 0 to 1 while an action runs: download bar, install bar, tokens streamed...
  const progress = useState('mock-progress', () => 0)

  const stage = computed(() => MOCK_STAGES[stageIndex.value]!)
  const isLastStage = computed(() => stageIndex.value === MOCK_STAGES.length - 1)

  let frame = 0
  function finish() {
    cancelAnimationFrame(frame)
    progress.value = 1
    phase.value = 'done'
  }

  function run() {
    const seconds = DURATIONS[stage.value]
    if (seconds === 0) {
      openStage(stageIndex.value + 1)
      return
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      finish()
      return
    }
    phase.value = 'running'
    progress.value = 0
    const start = performance.now()
    const tick = (now: number) => {
      progress.value = Math.min(1, (now - start) / 1000 / seconds)
      if (progress.value >= 1) finish()
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }

  function openStage(index: number) {
    cancelAnimationFrame(frame)
    stageIndex.value = Math.min(MOCK_STAGES.length - 1, Math.max(0, index))
    phase.value = 'idle'
    progress.value = 0
  }

  // Presenter's "next": run the action, or finish it, or open the next stage. False when the whole flow is done.
  function advance() {
    if (phase.value === 'idle') {
      run()
      return true
    }
    if (phase.value === 'running') {
      finish()
      return true
    }
    if (isLastStage.value) return false
    openStage(stageIndex.value + 1)
    return true
  }

  // Presenter's "previous": one stage back, or false at the start.
  function back() {
    if (stageIndex.value === 0) return false
    openStage(stageIndex.value - 1)
    return true
  }

  return { stage, stageIndex, phase, progress, isLastStage, run, advance, back, openStage }
}
