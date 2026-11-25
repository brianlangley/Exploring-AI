<script setup lang="ts">
import type * as Three from 'three'

// Our own helper (PLAN-v3 9.4): the floppy disk model with googly eyes, one tip per step.
const HIDDEN_KEY = 'lm-explained-floppy-hidden'

const { step, next, isLast } = usePresentation()
const { messages } = useLocale()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isBubbleOpen = ref(true)
const isHidden = ref(false)
const copy = computed(() => messages.value.floppy)
const tip = computed(() => copy.value.tips[step.value.id])

// New step: Floppy speaks up again.
watch(() => step.value.id, () => {
  isBubbleOpen.value = true
})

function hide() {
  isHidden.value = true
  sessionStorage.setItem(HIDDEN_KEY, '1')
}

let cleanUp: (() => void) | undefined
onMounted(async () => {
  isHidden.value = sessionStorage.getItem(HIDDEN_KEY) === '1'
  const canvas = canvasRef.value
  if (!canvas) return
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const THREE = await import('three')
  let renderer: Three.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  }
  catch {
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight('#ffffff', '#30304a', 1.6))
  const light = new THREE.DirectionalLight('#ffffff', 1.4)
  light.position.set(1, 2, 3)
  scene.add(light)
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20)
  camera.position.set(0, 0.5, 2.4)
  camera.lookAt(0, 0.5, 0)

  const body = new THREE.Group()
  scene.add(body)
  const floppy = await loadModel(THREE, 'floppy.glb', 1).catch(() => undefined)
  if (floppy) body.add(floppy.holder)

  // Googly eyes: white balls with black pupils that look at the mouse.
  const white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })
  const black = new THREE.MeshBasicMaterial({ color: '#0b0b0b' })
  const pupils: Three.Mesh[] = []
  for (const x of [-0.17, 0.17]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), white)
    eye.scale.z = 0.5
    eye.position.set(x, 0.66, 0.08)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), black)
    pupil.position.set(x, 0.66, 0.15)
    body.add(eye, pupil)
    pupils.push(pupil)
  }
  const pupilRest = pupils.map(pupil => pupil.position.clone())

  const look = { x: 0, y: 0 }
  function onPointerMove(event: PointerEvent) {
    const rect = canvas!.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(dx, dy) || 1
    look.x = dx / length
    look.y = -dy / length
  }
  window.addEventListener('pointermove', onPointerMove)

  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  camera.aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1)
  camera.updateProjectionMatrix()

  let frame = 0
  function render(now: number) {
    frame = requestAnimationFrame(render)
    pupils.forEach((pupil, index) => {
      pupil.position.x = pupilRest[index]!.x + look.x * 0.06
      pupil.position.y = pupilRest[index]!.y + look.y * 0.06
    })
    if (!prefersReducedMotion) {
      body.rotation.y = Math.sin(now / 1400) * 0.25
      body.position.y = Math.sin(now / 700) * 0.03
    }
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(render)

  cleanUp = () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('pointermove', onPointerMove)
    renderer.dispose()
  }
})
onBeforeUnmount(() => cleanUp?.())
</script>

<template>
  <div v-show="!isHidden" class="pointer-events-auto absolute bottom-4 left-2 flex items-end gap-1 sm:left-4" role="complementary" :aria-label="copy.label">
    <button
      type="button"
      class="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :aria-label="isBubbleOpen ? copy.close : copy.open"
      :aria-expanded="isBubbleOpen"
      @click="isBubbleOpen = !isBubbleOpen"
    >
      <canvas ref="canvasRef" class="block size-24 sm:size-28" />
    </button>

    <Transition enter-from-class="opacity-0 translate-y-1" leave-to-class="opacity-0" enter-active-class="transition duration-300 motion-reduce:transition-none" leave-active-class="transition duration-150 motion-reduce:transition-none">
      <div v-if="isBubbleOpen && tip" class="relative mb-10 max-w-64 glass p-4 text-sm sm:max-w-72" aria-live="polite">
        <p class="font-semibold text-highlighted">
          {{ copy.name }}
        </p>
        <p class="mt-1 text-default">
          {{ tip }}
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <UButton v-if="!isLast" size="xs" :label="copy.next" trailing-icon="i-lucide-arrow-right" @click="next" />
          <UButton size="xs" color="neutral" variant="ghost" :label="copy.hide" @click="hide" />
        </div>
        <!-- Little tail pointing at Floppy. -->
        <span class="absolute -left-1.5 bottom-4 size-3 rotate-45 border-b border-l border-default bg-default" aria-hidden="true" />
      </div>
    </Transition>
  </div>
</template>
