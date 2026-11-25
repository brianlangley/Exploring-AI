<script setup lang="ts">
import type * as Three from 'three'

// Our own helper (PLAN-v3 9.4): the floppy disk model with a face, rubber-hose arms and legs,
// moods, and a bit of attitude. One tip per step; strolls around the free bottom-left corner.
const HIDDEN_KEY = 'lm-explained-floppy-hidden'
const BORED_AFTER = 15_000
const SLEEP_AFTER = 45_000
const QUIP_TIME = 4_500

type Mood = 'neutral' | 'happy' | 'excited' | 'surprised' | 'annoyed' | 'worried' | 'smug' | 'sleepy'
// smile: -1 frown .. 1 grin, open: mouth open 0..1, brow: + angry / - sad, browY: raise, lid: eye openness.
const FACES: Record<Mood, { smile: number, open: number, brow: number, browY: number, lid: number }> = {
  neutral: { smile: 0.25, open: 0, brow: 0, browY: 0, lid: 1 },
  happy: { smile: 0.8, open: 0.15, brow: -0.1, browY: 0.02, lid: 0.9 },
  excited: { smile: 1, open: 0.6, brow: -0.2, browY: 0.05, lid: 1 },
  surprised: { smile: 0, open: 0.8, brow: -0.15, browY: 0.07, lid: 1.15 },
  annoyed: { smile: -0.6, open: 0, brow: 0.45, browY: -0.02, lid: 0.6 },
  worried: { smile: -0.4, open: 0.1, brow: -0.4, browY: 0.03, lid: 0.9 },
  smug: { smile: 0.55, open: 0, brow: 0.2, browY: 0, lid: 0.55 },
  sleepy: { smile: 0, open: 0.2, brow: -0.1, browY: -0.02, lid: 0.08 },
}
// How Floppy feels about each step. Anything missing: happy.
const STEP_MOODS: Record<string, Mood> = {
  y1950: 'smug',
  y1966: 'smug',
  y2012: 'excited',
  y2022: 'worried',
  y2026: 'excited',
  device: 'neutral',
  costs: 'happy',
  verdict: 'worried',
  end: 'excited',
}

const { step, next, isLast } = usePresentation()
const { messages } = useLocale()
const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isBubbleOpen = ref(true)
const isHidden = ref(false)
const isSleeping = ref(false)
const quip = ref<string | null>(null)
const copy = computed(() => messages.value.floppy)
const tip = computed(() => copy.value.tips[step.value.id])
const bubbleText = computed(() => quip.value ?? tip.value)

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]!

// Shared with the render loop (plain object: read every frame, no reactivity needed).
const act = {
  baseMood: 'happy' as Mood,
  override: null as { mood: Mood, until: number } | null,
  waveUntil: 0,
  hopVelocity: 0,
  lastActivity: performance.now(),
  boredShown: false,
}

function feel(mood: Mood, ms: number) {
  act.override = { mood, until: performance.now() + ms }
}
function hop(strength = 1) {
  act.hopVelocity = 2.2 * strength
}

let quipTimer: ReturnType<typeof setTimeout> | undefined
let quipOpenedBubble = false
function say(text: string, mood: Mood) {
  clearTimeout(quipTimer)
  quipOpenedBubble = quipOpenedBubble || !isBubbleOpen.value
  quip.value = text
  isBubbleOpen.value = true
  feel(mood, QUIP_TIME)
  quipTimer = setTimeout(() => {
    quip.value = null
    if (quipOpenedBubble) isBubbleOpen.value = false
    quipOpenedBubble = false
  }, QUIP_TIME)
}

// New step: Floppy speaks up again, with a little wave and the mood for this step.
watch(() => step.value.id, (id) => {
  clearTimeout(quipTimer)
  quip.value = null
  quipOpenedBubble = false
  isBubbleOpen.value = true
  act.baseMood = STEP_MOODS[id] ?? 'happy'
  act.waveUntil = performance.now() + 1600
  hop(0.6)
}, { immediate: true })

// Poke him once: he jumps. Three times in quick succession: he gets snippy.
let pokes: number[] = []
function poke() {
  const now = performance.now()
  pokes = [...pokes.filter(time => now - time < 1500), now]
  hop()
  if (pokes.length >= 3) {
    pokes = []
    say(pick(copy.value.quips.poke), 'annoyed')
    return
  }
  feel('surprised', 600)
  if (quip.value) return
  isBubbleOpen.value = !isBubbleOpen.value
}

function noteActivity() {
  act.lastActivity = performance.now()
  act.boredShown = false
  if (isSleeping.value) {
    isSleeping.value = false
    hop()
    say(copy.value.quips.wake, 'surprised')
  }
}

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
  camera.position.set(0, 0.76, 2.9)
  camera.lookAt(0, 0.72, 0)

  // rig: whole character (hops, turns). body: the disk and face (leans, squashes).
  const LEG = 0.3
  const rig = new THREE.Group()
  const body = new THREE.Group()
  body.position.y = LEG
  rig.add(body)
  scene.add(rig)
  const floppy = await loadModel(THREE, 'floppy.glb', 1).catch(() => undefined)
  let front = 0.03
  if (floppy) {
    body.add(floppy.holder)
    front = new THREE.Box3().setFromObject(floppy.holder).max.z
  }

  const white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })
  const black = new THREE.MeshBasicMaterial({ color: '#0b0b0b' })
  // Light brows: the top of the disk (the shutter) is dark.
  const browMaterial = new THREE.MeshBasicMaterial({ color: '#e9e9ee' })
  const hose = new THREE.MeshStandardMaterial({ color: '#141418', roughness: 0.6 })
  const shoeMaterial = new THREE.MeshStandardMaterial({ color: '#c8402f', roughness: 0.5 })

  // Googly eyes in a group each, so blinking is just a y-scale. Brows above them.
  const eyes: Three.Group[] = []
  const pupils: Three.Mesh[] = []
  const brows: Three.Mesh[] = []
  for (const x of [-0.17, 0.17]) {
    const eye = new THREE.Group()
    eye.position.set(x, 0.66, front + 0.05)
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), white)
    ball.scale.z = 0.5
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), black)
    pupil.position.z = 0.07
    eye.add(ball, pupil)
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.035, 0.02), browMaterial)
    brow.position.set(x, 0.85, front + 0.09)
    body.add(eye, brow)
    eyes.push(eye)
    pupils.push(pupil)
    brows.push(brow)
  }

  // Mouth (plus blush cheeks when he smiles): drawn on a small canvas, redrawn only when the mood changes it.
  const mouthCanvas = document.createElement('canvas')
  mouthCanvas.width = 384
  mouthCanvas.height = 128
  const mouthContext = mouthCanvas.getContext('2d')!
  const mouthTexture = new THREE.CanvasTexture(mouthCanvas)
  mouthTexture.colorSpace = THREE.SRGBColorSpace
  const mouthPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.24), new THREE.MeshBasicMaterial({ map: mouthTexture, transparent: true }))
  mouthPlane.position.set(0, 0.4, front + 0.01)
  body.add(mouthPlane)
  let drawn = { smile: NaN, open: NaN }
  function drawMouth(smile: number, open: number) {
    if (Math.abs(smile - drawn.smile) < 0.01 && Math.abs(open - drawn.open) < 0.01) return
    drawn = { smile, open }
    const c = mouthContext
    const cx = 192
    const cy = 56
    c.clearRect(0, 0, 384, 128)

    const blush = Math.min(Math.max(smile, 0), 1) * 0.55
    if (blush > 0.02) {
      for (const x of [cx - 112, cx + 112]) {
        const glow = c.createRadialGradient(x, cy - 4, 2, x, cy - 4, 28)
        glow.addColorStop(0, `rgba(255, 120, 145, ${blush})`)
        glow.addColorStop(1, 'rgba(255, 120, 145, 0)')
        c.fillStyle = glow
        c.beginPath()
        c.ellipse(x, cy - 4, 30, 18, 0, 0, Math.PI * 2)
        c.fill()
      }
    }

    // Wide open with no smile or frown: a small round "o".
    const round = Math.max(0, open - 0.3) * (1 - Math.min(1, Math.abs(smile) * 1.6))
    const half = 44 - round * 46
    const corner = cy - smile * 14
    const top = corner + smile * 12 * (1 - open) - round * 20
    const bottom = top + smile * 10 + open * 58
    const mouth = new Path2D()
    mouth.moveTo(cx - half, corner)
    mouth.bezierCurveTo(cx - half * 0.4, top, cx + half * 0.4, top, cx + half, corner)
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.lineWidth = 6.5
    c.strokeStyle = '#1b1b22'
    if (open > 0.05) {
      mouth.bezierCurveTo(cx + half * 0.95, bottom, cx - half * 0.95, bottom, cx - half, corner)
      mouth.closePath()
      c.fillStyle = '#5b2633'
      c.fill(mouth)
      if (open > 0.25) {
        c.save()
        c.clip(mouth)
        c.fillStyle = '#f08c9d'
        c.beginPath()
        c.ellipse(cx, bottom - 6, half * 0.6, 6 + open * 12, 0, 0, Math.PI * 2)
        c.fill()
        c.restore()
      }
    }
    else if (smile > 0.4) {
      // Dimples at the corners of a closed smile.
      for (const side of [-1, 1]) {
        c.beginPath()
        c.moveTo(cx + side * (half - 2), corner - 7)
        c.quadraticCurveTo(cx + side * (half + 7), corner, cx + side * (half - 1), corner + 7)
        c.stroke()
      }
    }
    c.stroke(mouth)
    mouthTexture.needsUpdate = true
  }

  // Rubber-hose limbs: a pivot group per joint, the bone hangs down from it.
  function bone(length: number, radius: number) {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 10)
    geometry.translate(0, -length / 2, 0)
    return new THREE.Mesh(geometry, hose)
  }
  function makeArm(side: number) {
    const shoulder = new THREE.Group()
    shoulder.position.set(side * 0.47, 0.42, front - 0.01)
    shoulder.add(bone(0.24, 0.026))
    const elbow = new THREE.Group()
    elbow.position.y = -0.24
    elbow.add(bone(0.22, 0.026))
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), white)
    hand.position.y = -0.24
    hand.scale.set(1, 1.1, 0.8)
    elbow.add(hand)
    shoulder.add(elbow)
    body.add(shoulder)
    return { shoulder, elbow }
  }
  function makeLeg(side: number) {
    const hip = new THREE.Group()
    hip.position.set(side * 0.2, LEG, 0)
    hip.add(bone(LEG - 0.04, 0.03))
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), shoeMaterial)
    shoe.scale.set(1.5, 0.75, 1.6)
    shoe.position.set(side * 0.02, -LEG + 0.04, 0.05)
    hip.add(shoe)
    rig.add(hip)
    return hip
  }
  const arms = [makeArm(-1), makeArm(1)] as const
  const legs = [makeLeg(-1), makeLeg(1)] as const

  // Mouse: where the pupils look and which way he leans.
  const look = { x: 0, y: 0 }
  function onPointerMove(event: PointerEvent) {
    noteActivity()
    const rect = canvas!.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(dx, dy) || 1
    look.x = dx / length
    look.y = -dy / length
  }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('keydown', noteActivity)

  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  camera.aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1)
  camera.updateProjectionMatrix()

  // Walking: only in the empty strip left of the step navigation, and only while the bubble is closed.
  const walk = { x: 0, target: 0, nextAt: performance.now() + 6000, phase: 0 }
  function roamLimit() {
    const root = rootRef.value
    if (!root) return 0
    const nav = root.parentElement?.querySelector(':scope > nav')
    const navLeft = nav
      ? Math.min(...[...nav.children].map(child => child.getBoundingClientRect().left))
      : window.innerWidth * 0.4
    return Math.max(0, navLeft - root.offsetLeft - canvas!.clientWidth - 12)
  }

  const face = { ...FACES.happy }
  let blinkAt = performance.now() + 2500
  let hopY = 0
  let last = performance.now()
  let frame = 0
  const approach = (from: number, to: number, rate: number, dt: number) => from + (to - from) * Math.min(1, rate * dt)

  function render(now: number) {
    frame = requestAnimationFrame(render)
    const dt = Math.min((now - last) / 1000, 0.1)
    last = now
    const motion = !prefersReducedMotion

    // Boredom: a remark first, then a nap.
    const idle = now - act.lastActivity
    if (!isBubbleOpen.value && !act.boredShown && idle > BORED_AFTER) {
      act.boredShown = true
      say(pick(copy.value.quips.bored), 'smug')
    }
    if (!isSleeping.value && idle > SLEEP_AFTER && !quip.value) {
      isSleeping.value = true
      isBubbleOpen.value = false
    }

    if (act.override && now > act.override.until) act.override = null
    const mood: Mood = isSleeping.value ? 'sleepy' : act.override?.mood ?? act.baseMood
    const target = FACES[mood]
    for (const key of ['smile', 'open', 'brow', 'browY', 'lid'] as const) face[key] = approach(face[key], target[key], 10, dt)

    drawMouth(face.smile, face.open)

    if (now > blinkAt) blinkAt = now + 2000 + Math.random() * 3500
    const blinking = !isSleeping.value && blinkAt - now < 120
    eyes.forEach((eye, index) => {
      eye.scale.y = blinking ? 0.08 : face.lid
      const side = index === 0 ? -1 : 1
      pupils[index]!.position.x = isSleeping.value ? 0 : look.x * 0.06
      pupils[index]!.position.y = isSleeping.value ? -0.04 : look.y * 0.06
      brows[index]!.rotation.z = -side * face.brow
      brows[index]!.position.y = 0.85 + face.browY + (face.lid - 1) * 0.08
    })

    // Wander.
    const walking = motion && Math.abs(walk.target - walk.x) > 1
    if (motion && !walking && !isBubbleOpen.value && !isSleeping.value && now > walk.nextAt) {
      walk.target = Math.random() * roamLimit()
      walk.nextAt = now + 5000 + Math.random() * 7000
    }
    if (isBubbleOpen.value && walk.x > roamLimit()) walk.target = 0
    if (walking) {
      const direction = Math.sign(walk.target - walk.x)
      walk.x += direction * Math.min(90 * dt, Math.abs(walk.target - walk.x))
      walk.phase += dt * 9
      rootRef.value?.style.setProperty('--floppy-x', `${walk.x}px`)
    }
    const stride = walking ? Math.sin(walk.phase) : 0

    // Hop with a little gravity; squash on landing.
    if (motion) {
      hopY += act.hopVelocity * dt
      act.hopVelocity -= 9 * dt
      if (hopY <= 0) {
        hopY = 0
        act.hopVelocity = 0
      }
    }
    const bob = walking ? Math.abs(Math.cos(walk.phase)) * 0.04 : motion ? Math.sin(now / 700) * 0.015 : 0
    rig.position.y = hopY + bob
    const squash = hopY > 0 ? 1.06 : 1
    body.scale.set(2 - squash, squash, 1)

    // Turn toward where he walks, otherwise toward the mouse.
    const facing = walking ? Math.sign(walk.target - walk.x) * 0.7 : look.x * 0.3
    rig.rotation.y = approach(rig.rotation.y, motion ? facing : 0, 6, dt)
    body.rotation.z = approach(body.rotation.z, isSleeping.value ? 0.12 : walking ? -Math.sign(walk.target - walk.x) * 0.06 : 0, 4, dt)

    // Legs.
    legs[0].rotation.x = stride * 0.6
    legs[1].rotation.x = -stride * 0.6

    // Arms: pick a pose, then ease toward it. [shoulder z, shoulder x, elbow z] per arm.
    const sway = motion ? Math.sin(now / 900) * 0.06 : 0
    let pose: [number, number, number][] = [[-0.25 - sway, 0, 0.2], [0.25 + sway, 0, -0.2]]
    if (walking) pose = [[-0.2, -stride * 0.6, 0.3], [0.2, stride * 0.6, -0.3]]
    else if (mood === 'annoyed') pose = [[-0.7, 0, 1.9], [0.7, 0, -1.9]] // hands on hips
    else if (mood === 'excited' || mood === 'surprised') {
      const pump = motion ? Math.sin(now / 120) * 0.15 : 0
      pose = [[-2.4 - pump, 0, 0.3], [2.4 + pump, 0, -0.3]]
    }
    else if (mood === 'worried') pose = [[-0.9, 0, 1.4], [0.9, 0, -1.4]] // shrug-ish
    else if (mood === 'sleepy') pose = [[-0.1, 0, 0], [0.1, 0, 0]]
    if (now < act.waveUntil && !walking) pose[1] = [2.5, 0, motion ? Math.sin(now / 110) * 0.6 : 0]
    arms.forEach((arm, index) => {
      const [shoulderZ, shoulderX, elbowZ] = pose[index]!
      arm.shoulder.rotation.z = approach(arm.shoulder.rotation.z, shoulderZ, 12, dt)
      arm.shoulder.rotation.x = approach(arm.shoulder.rotation.x, shoulderX, 12, dt)
      arm.elbow.rotation.z = approach(arm.elbow.rotation.z, elbowZ, 12, dt)
    })

    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(render)

  cleanUp = () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('keydown', noteActivity)
    mouthTexture.dispose()
    renderer.dispose()
  }
})
onBeforeUnmount(() => {
  clearTimeout(quipTimer)
  cleanUp?.()
})
</script>

<template>
  <div
    v-show="!isHidden"
    ref="rootRef"
    class="floppy pointer-events-auto absolute bottom-2 left-0 flex items-end gap-1 sm:left-2"
    role="complementary"
    :aria-label="copy.label"
  >
    <button
      type="button"
      class="relative shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :aria-label="isBubbleOpen ? copy.close : copy.open"
      :aria-expanded="isBubbleOpen"
      @click="poke"
      @pointerenter="!isSleeping && feel('happy', 1200)"
    >
      <canvas ref="canvasRef" class="block size-36 sm:size-40" />
      <span v-if="isSleeping" class="zzz pointer-events-none absolute right-4 top-2 font-mono text-sm font-bold text-highlighted" aria-hidden="true">
        <span>z</span><span>z</span><span>Z</span>
      </span>
    </button>

    <Transition enter-from-class="opacity-0 translate-y-1" leave-to-class="opacity-0" enter-active-class="transition duration-300 motion-reduce:transition-none" leave-active-class="transition duration-150 motion-reduce:transition-none">
      <div v-if="isBubbleOpen && bubbleText" class="relative mb-16 max-w-64 glass p-4 text-sm sm:max-w-72" aria-live="polite">
        <p class="font-semibold text-highlighted">
          {{ copy.name }}
        </p>
        <p class="mt-1 text-default">
          {{ bubbleText }}
        </p>
        <div v-if="!quip" class="mt-3 flex flex-wrap gap-2">
          <UButton v-if="!isLast" size="xs" :label="copy.next" trailing-icon="i-lucide-arrow-right" @click="next" />
          <UButton size="xs" color="neutral" variant="ghost" :label="copy.hide" @click="hide" />
        </div>
        <!-- Little tail pointing at Floppy. -->
        <span class="absolute -left-1.5 bottom-4 size-3 rotate-45 border-b border-l border-default bg-default" aria-hidden="true" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.floppy {
  transform: translateX(var(--floppy-x, 0px));
}

.zzz span {
  display: inline-block;
  animation: zzz 2.4s ease-in-out infinite;
}
.zzz span:nth-child(2) { animation-delay: 0.4s; }
.zzz span:nth-child(3) { animation-delay: 0.8s; }

@keyframes zzz {
  0% { opacity: 0; transform: translate(0, 0); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translate(6px, -18px); }
}

@media (prefers-reduced-motion: reduce) {
  .zzz span { animation: none; }
}
</style>
