<script setup lang="ts">
import type * as Three from 'three'

// Our own helper (PLAN-v3 9.4): the floppy disk model with a face, rubber-hose arms and legs,
// moods, and a bit of attitude. One tip per step. Not on step 1 (that one is "real life"):
// he drops in on step 2. You can pick him up and throw him; he bounces off the screen edges.
const HIDDEN_KEY = 'lm-explained-floppy-hidden'
const BORED_AFTER = 15_000
const SLEEP_AFTER = 45_000
const QUIP_TIME = 4_500
const HIJACK_TIME = 2_600
// Pick him up this often within PICKUP_WINDOW and the next landing makes him take the mouse.
const PICKUPS_FOR_HIJACK = 3
const PICKUP_WINDOW = 30_000
// Physics in px and seconds.
const GRAVITY = 2600
const MAX_THROW = 2600
const WALL_BOUNCE = 0.55
const FLOOR_BOUNCE = 0.4
const HARD_LANDING = 1400

type Mood = 'neutral' | 'happy' | 'excited' | 'surprised' | 'annoyed' | 'worried' | 'smug' | 'sleepy'
// smile: -1 frown .. 1 grin, open: mouth open 0..1, brow: + angry / - sad, browY: raise, lid: eye openness.
const FACES: Record<Mood, { smile: number, open: number, brow: number, browY: number, lid: number }> = {
  neutral: { smile: 0.25, open: 0, brow: 0, browY: 0, lid: 1 },
  happy: { smile: 0.8, open: 0.15, brow: -0.1, browY: 0.02, lid: 0.9 },
  excited: { smile: 1, open: 0.6, brow: -0.2, browY: 0.05, lid: 1 },
  surprised: { smile: 0.1, open: 0.55, brow: -0.15, browY: 0.07, lid: 1.15 },
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

const { step, next, isLast, isFirst } = usePresentation()
const { messages } = useLocale()
const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fakeCursorRef = ref<SVGSVGElement | null>(null)
const isBubbleOpen = ref(true)
const isHidden = ref(false)
const isSleeping = ref(false)
const isHeld = ref(false)
const isHijacking = ref(false)
const isOnRight = ref(false)
const quip = ref<string | null>(null)
const isVisible = computed(() => !isHidden.value && !isFirst.value)
const copy = computed(() => messages.value.floppy)
const tip = computed(() => copy.value.tips[step.value.id])
const bubbleText = computed(() => quip.value ?? tip.value)

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]!
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))
let reducedMotion = false

// Shared with the render loop (plain objects: read every frame, no reactivity needed).
const act = {
  baseMood: 'happy' as Mood,
  override: null as { mood: Mood, until: number } | null,
  waveUntil: 0,
  hopVelocity: 0,
  squashUntil: 0,
  lastActivity: performance.now(),
  boredShown: false,
}
// Where Floppy is: px from his home spot (bottom left), y negative is up. Velocity while airborne.
const pos = { x: 0, y: 0, vx: 0, vy: 0, airborne: false, impact: 0, entering: false }
const grab = { pointerId: -1, moved: false, startX: 0, startY: 0, lastX: 0, lastY: 0, lastTime: 0, vx: 0, vy: 0 }
const walk = { target: 0, nextAt: 0, phase: 0 }
const pointer = { x: 0, y: 0 }
const hijack = { until: 0, x: 0, y: 0 }
let pickups: number[] = []

// The box Floppy may move in, in his own px coordinates (the floor is y = 0).
function bounds() {
  const rect = canvasRef.value!.getBoundingClientRect()
  const baseLeft = rect.left - pos.x
  const baseTop = rect.top - pos.y
  return { minX: -baseLeft, maxX: window.innerWidth - baseLeft - rect.width, minY: -baseTop, height: rect.height }
}

// Where he may stroll on the floor: left or right of the step navigation, never on top of it.
function roamRange(): [number, number] {
  const root = rootRef.value!
  const width = canvasRef.value!.clientWidth
  const nav = root.parentElement?.querySelector(':scope > nav')
  const rects = nav ? [...nav.children].map(child => child.getBoundingClientRect()).filter(rect => rect.width > 0) : []
  const navLeft = rects.length ? Math.min(...rects.map(rect => rect.left)) : window.innerWidth * 0.4
  const navRight = rects.length ? Math.max(...rects.map(rect => rect.right)) : window.innerWidth * 0.6
  const left: [number, number] = [0, Math.max(0, navLeft - root.offsetLeft - width - 12)]
  const right: [number, number] = [navRight - root.offsetLeft + 12, window.innerWidth - root.offsetLeft - width]
  if (right[0] > right[1] || pos.x <= left[1]) return left
  if (pos.x >= right[0]) return right
  return pos.x - left[1] < right[0] - pos.x ? left : right
}

function place() {
  const root = rootRef.value
  if (!root) return
  root.style.setProperty('--floppy-x', `${pos.x}px`)
  root.style.setProperty('--floppy-y', `${pos.y}px`)
  // Right half of the screen: the speech bubble goes on his left.
  const onRight = root.offsetLeft + pos.x + root.clientWidth / 2 > window.innerWidth / 2
  if (onRight !== isOnRight.value) isOnRight.value = onRight
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
  isBubbleOpen.value = !pos.entering
  act.baseMood = STEP_MOODS[id] ?? 'happy'
  act.waveUntil = performance.now() + 1600
  hop(0.6)
}, { immediate: true })

// Poke him once: he jumps. Three times in quick succession: he gets snippy.
let pokes: number[] = []
function poke() {
  // The click that ends a drag is not a poke.
  if (grab.moved) {
    grab.moved = false
    return
  }
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

// Pick up, carry, throw.
function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || isHijacking.value) return
  Object.assign(grab, {
    pointerId: event.pointerId,
    moved: false,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    lastTime: event.timeStamp,
    vx: 0,
    vy: 0,
  })
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function onPointerDrag(event: PointerEvent) {
  if (event.pointerId !== grab.pointerId || !canvasRef.value) return
  if (!grab.moved) {
    if (Math.hypot(event.clientX - grab.startX, event.clientY - grab.startY) < 6) return
    grab.moved = true
    isHeld.value = true
    pos.airborne = false
    pos.entering = false
    clearTimeout(quipTimer)
    quip.value = null
    quipOpenedBubble = false
    isBubbleOpen.value = false
    const now = performance.now()
    pickups = [...pickups.filter(time => now - time < PICKUP_WINDOW), now]
  }
  const dx = event.clientX - grab.lastX
  const dy = event.clientY - grab.lastY
  const seconds = (event.timeStamp - grab.lastTime) / 1000
  if (seconds > 0) {
    grab.vx = grab.vx * 0.5 + (dx / seconds) * 0.5
    grab.vy = grab.vy * 0.5 + (dy / seconds) * 0.5
  }
  grab.lastX = event.clientX
  grab.lastY = event.clientY
  grab.lastTime = event.timeStamp
  const box = bounds()
  pos.x = clamp(pos.x + dx, box.minX, box.maxX)
  pos.y = clamp(pos.y + dy, box.minY, 0)
  place()
}
function onPointerUp(event: PointerEvent) {
  if (event.pointerId !== grab.pointerId) return
  grab.pointerId = -1
  if (!isHeld.value) return
  isHeld.value = false
  // Held still before letting go: just drop. Otherwise he keeps the speed of the throw.
  const stale = event.timeStamp - grab.lastTime > 80
  pos.vx = stale ? 0 : clamp(grab.vx, -MAX_THROW, MAX_THROW)
  pos.vy = stale ? 0 : clamp(grab.vy, -MAX_THROW, MAX_THROW)
  pos.impact = 0
  if (reducedMotion) {
    pos.y = 0
    place()
    land()
  }
  else {
    pos.airborne = true
  }
}

function land() {
  const now = performance.now()
  walk.target = pos.x
  walk.nextAt = now + 3000
  if (pos.entering) {
    pos.entering = false
    isBubbleOpen.value = true
    say(copy.value.quips.hello, 'happy')
    return
  }
  hop(0.4)
  if (!reducedMotion && pickups.length >= PICKUPS_FOR_HIJACK) {
    pickups = []
    startHijack()
  }
  else if (pos.impact > HARD_LANDING) say(pick(copy.value.quips.drop), 'annoyed')
  else feel('surprised', 700)
  pos.impact = 0
}

// Payback: he takes the mouse for a moment. The real cursor is hidden and clicks are blocked
// by an overlay while a fake cursor rides in his hand. Escape ends it early.
function startHijack() {
  hijack.until = performance.now() + HIJACK_TIME
  hijack.x = pointer.x
  hijack.y = pointer.y
  isHijacking.value = true
  say(copy.value.quips.hijack, 'excited')
}
function endHijack() {
  if (!isHijacking.value) return
  isHijacking.value = false
  say(copy.value.quips.hijackEnd, 'smug')
}
function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') endHijack()
  noteActivity()
}

function hide() {
  isHidden.value = true
  endHijack()
  sessionStorage.setItem(HIDDEN_KEY, '1')
}

let cleanUp: (() => void) | undefined
onMounted(async () => {
  isHidden.value = sessionStorage.getItem(HIDDEN_KEY) === '1'
  const canvas = canvasRef.value
  if (!canvas) return
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

    const half = 44
    const corner = cy - smile * 14
    const top = corner + smile * 12 * (1 - open)
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
    pointer.x = event.clientX
    pointer.y = event.clientY
    const rect = canvas!.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(dx, dy) || 1
    look.x = dx / length
    look.y = -dy / length
  }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('keydown', onKeyDown)

  // Size the renderer from the canvas once it is on screen (it is hidden on step 1, so 0 x 0 at first),
  // and again when the breakpoint changes its size.
  let renderedWidth = 0
  function fitRenderer() {
    const width = canvas!.clientWidth
    if (!width || width === renderedWidth) return
    renderedWidth = width
    renderer.setSize(width, canvas!.clientHeight, false)
    camera.aspect = width / Math.max(canvas!.clientHeight, 1)
    camera.updateProjectionMatrix()
  }

  // Showing up (step 2, or after step 1 again): he drops in from above the screen.
  watch(isVisible, async (visible) => {
    if (!visible) {
      endHijack()
      return
    }
    pos.entering = true
    isBubbleOpen.value = false
    await nextTick()
    if (reducedMotion) {
      pos.y = 0
      place()
      land()
      return
    }
    const box = bounds()
    pos.y = box.minY - box.height - 40
    pos.vx = 0
    pos.vy = 0
    pos.airborne = true
    place()
  }, { immediate: true })

  const face = { ...FACES.happy }
  let blinkAt = performance.now() + 2500
  let hopY = 0
  let last = performance.now()
  let frame = 0
  const approach = (from: number, to: number, rate: number, dt: number) => from + (to - from) * Math.min(1, rate * dt)

  function render(now: number) {
    frame = requestAnimationFrame(render)
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    if (!isVisible.value) return
    fitRenderer()
    const motion = !reducedMotion

    // Boredom: a remark first, then a nap. Not while he is in the air.
    if (pos.airborne || isHeld.value) act.lastActivity = now
    const idle = now - act.lastActivity
    if (!isBubbleOpen.value && !act.boredShown && idle > BORED_AFTER) {
      act.boredShown = true
      say(pick(copy.value.quips.bored), 'smug')
    }
    if (!isSleeping.value && idle > SLEEP_AFTER && !quip.value) {
      isSleeping.value = true
      isBubbleOpen.value = false
    }

    const held = isHeld.value
    // Thrown or dropped: gravity, and bounces off the screen edges.
    if (pos.airborne) {
      const box = bounds()
      pos.vy += GRAVITY * dt
      pos.vx *= 1 - 0.3 * dt
      pos.x += pos.vx * dt
      pos.y += pos.vy * dt
      if (pos.x < box.minX || pos.x > box.maxX) {
        pos.x = clamp(pos.x, box.minX, box.maxX)
        if (Math.abs(pos.vx) > 500) {
          feel('surprised', 700)
          act.squashUntil = now + 120
        }
        pos.vx *= -WALL_BOUNCE
      }
      if (pos.y < box.minY && pos.vy < 0 && !pos.entering) {
        pos.y = box.minY
        pos.vy *= -WALL_BOUNCE
      }
      if (pos.y >= 0) {
        pos.y = 0
        pos.impact = Math.max(pos.impact, pos.vy)
        act.squashUntil = now + 120
        if (pos.vy > 500) {
          pos.vy *= -FLOOR_BOUNCE
          pos.vx *= 0.7
        }
        else {
          pos.airborne = false
          pos.vx = 0
          pos.vy = 0
          land()
        }
      }
      place()
    }
    const busy = held || pos.airborne
    if (!held) {
      grab.vx *= Math.max(0, 1 - 6 * dt)
    }

    if (act.override && now > act.override.until) act.override = null
    const mood: Mood = held || (pos.airborne && !pos.entering) ? 'surprised' : isSleeping.value ? 'sleepy' : act.override?.mood ?? act.baseMood
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

    // Hijack: run around with the (fake) cursor in his raised hand.
    if (isHijacking.value) {
      if (now > hijack.until) endHijack()
      act.waveUntil = now + 200
      if (!busy && Math.abs(walk.target - pos.x) < 2) {
        const [from, to] = roamRange()
        walk.target = from + Math.random() * (to - from)
      }
      const rect = canvas!.getBoundingClientRect()
      hijack.x = approach(hijack.x, rect.left + rect.width * 0.72 + Math.sin(now / 90) * 10, 9, dt)
      hijack.y = approach(hijack.y, rect.top + rect.height * 0.12 + Math.cos(now / 70) * 8, 9, dt)
      fakeCursorRef.value?.style.setProperty('transform', `translate(${hijack.x}px, ${hijack.y}px)`)
    }

    // Stroll: stay off the step navigation; now and then pick a new spot.
    let walking = false
    if (motion && !busy) {
      const [from, to] = roamRange()
      if (pos.x < from || pos.x > to) walk.target = clamp(pos.x, from, to)
      else if (!isBubbleOpen.value && !isSleeping.value && now > walk.nextAt && Math.abs(walk.target - pos.x) <= 1) {
        walk.target = from + Math.random() * (to - from)
        walk.nextAt = now + 5000 + Math.random() * 7000
      }
      walking = Math.abs(walk.target - pos.x) > 1
    }
    if (walking) {
      const distance = walk.target - pos.x
      const speed = isHijacking.value ? 260 : 90 + Math.abs(distance) * 0.5
      pos.x += Math.sign(distance) * Math.min(speed * dt, Math.abs(distance))
      walk.phase += dt * (isHijacking.value ? 16 : 9)
      place()
    }
    const stride = walking ? Math.sin(walk.phase) : 0

    // Hop with a little gravity; squash on landing and wall hits.
    if (motion) {
      hopY += act.hopVelocity * dt
      act.hopVelocity -= 9 * dt
      if (hopY <= 0) {
        hopY = 0
        act.hopVelocity = 0
      }
    }
    if (busy) hopY = 0
    const bob = walking ? Math.abs(Math.cos(walk.phase)) * 0.04 : motion && !busy ? Math.sin(now / 700) * 0.015 : 0
    rig.position.y = hopY + bob
    const squash = now < act.squashUntil ? 0.84 : hopY > 0 ? 1.06 : 1
    body.scale.set(2 - squash, squash, 1)

    // Turn toward where he walks, otherwise toward the mouse.
    const facing = walking ? Math.sign(walk.target - pos.x) * 0.7 : busy ? 0 : look.x * 0.3
    rig.rotation.y = approach(rig.rotation.y, motion ? facing : 0, 6, dt)
    // Held: swings with the drag. Flying: leans into his speed.
    const lean = held
      ? clamp(-grab.vx / 1500, -0.6, 0.6)
      : pos.airborne ? clamp(-pos.vx / 2000, -0.6, 0.6) : isSleeping.value ? 0.12 : walking ? -Math.sign(walk.target - pos.x) * 0.06 : 0
    body.rotation.z = approach(body.rotation.z, motion ? lean : 0, busy ? 10 : 4, dt)

    // Legs: stride when walking, kick when held or flying.
    const kick = busy && motion ? Math.sin(now / 65) * 0.7 : 0
    legs[0].rotation.x = stride * 0.6 + kick
    legs[1].rotation.x = -stride * 0.6 - kick

    // Arms: pick a pose, then ease toward it. [shoulder z, shoulder x, elbow z] per arm.
    const sway = motion ? Math.sin(now / 900) * 0.06 : 0
    let pose: [number, number, number][] = [[-0.25 - sway, 0, 0.2], [0.25 + sway, 0, -0.2]]
    if (walking) pose = [[-0.2, -stride * 0.6, 0.3], [0.2, stride * 0.6, -0.3]]
    else if (busy || mood === 'excited' || mood === 'surprised') {
      const pump = motion ? Math.sin(now / 120) * 0.15 : 0
      pose = [[-2.4 - pump, 0, 0.3], [2.4 + pump, 0, -0.3]]
    }
    else if (mood === 'annoyed') pose = [[-0.7, 0, 1.9], [0.7, 0, -1.9]] // hands on hips
    else if (mood === 'worried') pose = [[-0.9, 0, 1.4], [0.9, 0, -1.4]] // shrug-ish
    else if (mood === 'sleepy') pose = [[-0.1, 0, 0], [0.1, 0, 0]]
    if (now < act.waveUntil && (!walking || isHijacking.value) && !busy) pose[1] = [2.5, 0, motion ? Math.sin(now / 110) * 0.6 : 0]
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
    window.removeEventListener('keydown', onKeyDown)
    mouthTexture.dispose()
    renderer.dispose()
  }
})
onBeforeUnmount(() => {
  clearTimeout(quipTimer)
  isHijacking.value = false
  cleanUp?.()
})
</script>

<template>
  <div
    v-show="isVisible"
    ref="rootRef"
    class="floppy pointer-events-auto absolute bottom-2 left-0 sm:left-2"
    role="complementary"
    :aria-label="copy.label"
  >
    <button
      type="button"
      class="relative block touch-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :class="isHeld ? 'cursor-grabbing' : 'cursor-grab'"
      :aria-label="isBubbleOpen ? copy.close : copy.open"
      :aria-expanded="isBubbleOpen"
      @click="poke"
      @pointerdown="onPointerDown"
      @pointermove="onPointerDrag"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerenter="!isSleeping && feel('happy', 1200)"
    >
      <canvas ref="canvasRef" class="block size-36 sm:size-40" />
      <span v-if="isSleeping" class="zzz pointer-events-none absolute right-4 top-2 font-mono text-sm font-bold text-highlighted" aria-hidden="true">
        <span>z</span><span>z</span><span>Z</span>
      </span>
    </button>

    <Transition enter-from-class="opacity-0 translate-y-1" leave-to-class="opacity-0" enter-active-class="transition duration-300 motion-reduce:transition-none" leave-active-class="transition duration-150 motion-reduce:transition-none">
      <div
        v-if="isBubbleOpen && bubbleText"
        class="absolute bottom-16 w-max max-w-64 glass p-4 text-sm sm:max-w-72"
        :class="isOnRight ? 'right-full mr-1' : 'left-full ml-1'"
        aria-live="polite"
      >
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
        <span
          class="absolute bottom-4 size-3 rotate-45 border-default bg-default"
          :class="isOnRight ? '-right-1.5 border-r border-t' : '-left-1.5 border-b border-l'"
          aria-hidden="true"
        />
      </div>
    </Transition>

    <Teleport to="body">
      <div v-if="isHijacking" class="fixed inset-0 z-50 cursor-none" aria-hidden="true">
        <svg ref="fakeCursorRef" class="absolute left-0 top-0 size-6 drop-shadow" viewBox="0 0 24 24">
          <path d="M4 2v18l5-5 3 7 3-1-3-7h7z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.floppy {
  transform: translate(var(--floppy-x, 0px), var(--floppy-y, 0px));
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
