import { PRESENTATION_STEPS } from '~/utils/presentationSteps'

// Black fade between worlds, or the dive into the terminal screen with the grid scan.
export type StageTransition = 'none' | 'fade' | 'crt' | 'scan'

// Shared state of the presentation route: which step, and which transition the overlay should show.
export function usePresentation() {
  const steps = PRESENTATION_STEPS
  const stepIndex = useState('presentation-step', () => 0)
  const transition = useState<StageTransition>('presentation-transition', () => 'none')
  // No WebGL or loading failed: the panels still carry the content.
  const isStageUnavailable = useState('presentation-stage-unavailable', () => false)

  const step = computed(() => steps[stepIndex.value]!)
  const isFirst = computed(() => stepIndex.value === 0)
  const isLast = computed(() => stepIndex.value === steps.length - 1)

  function goTo(index: number) {
    const clamped = Math.min(steps.length - 1, Math.max(0, index))
    if (clamped === stepIndex.value) return
    stepIndex.value = clamped
    // Deep link without a router navigation (no scroll jump, no history entry per click).
    history.replaceState(history.state, '', `#${steps[clamped]!.slug}`)
  }

  // On the demo step, next/previous walk the mock computer first, then leave the step.
  function next() {
    if (step.value.id === 'demo' && useMockComputer().advance()) return
    goTo(stepIndex.value + 1)
  }

  function previous() {
    if (step.value.id === 'demo' && useMockComputer().back()) return
    goTo(stepIndex.value - 1)
  }

  function readHash() {
    const slug = decodeURIComponent(location.hash.slice(1))
    const index = steps.findIndex(candidate => candidate.slug === slug)
    if (index >= 0) stepIndex.value = index
  }

  return { steps, stepIndex, step, isFirst, isLast, transition, isStageUnavailable, goTo, next, previous, readHash }
}

// Keyboard and presentation clickers (they send PageDown/PageUp or arrows). Not while typing or using a slider.
export function usePresentationKeys() {
  const { next, previous, goTo, steps } = usePresentation()

  // Arrows and Space belong to radios, sliders and fields when one has focus.
  function usesArrowKeys(target: EventTarget | null) {
    return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [role="slider"], [role="radio"], [contenteditable="true"]'))
  }
  // Clickers send PageDown/PageUp: only text fields and sliders keep those.
  function usesPageKeys(target: EventTarget | null) {
    return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [role="slider"], [contenteditable="true"]'))
  }

  function onKey(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const isButton = event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement
    const isPageKey = event.key === 'PageDown' || event.key === 'PageUp'
    if (isPageKey ? usesPageKeys(event.target) : usesArrowKeys(event.target)) return
    switch (event.key) {
      case 'ArrowRight':
      case 'PageDown':
        event.preventDefault()
        next()
        break
      case ' ':
      case 'Enter':
        // On a focused button these keys press the button instead.
        if (isButton) return
        event.preventDefault()
        next()
        break
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault()
        previous()
        break
      case 'Home':
        goTo(0)
        break
      case 'End':
        goTo(steps.length - 1)
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}
