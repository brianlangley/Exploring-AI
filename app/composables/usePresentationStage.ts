import type { Ref } from 'vue'
import type * as Three from 'three'
import type { CameraPose, StepId } from '~/utils/presentationSteps'
import type { HistoryRoad, RoadStation } from '~/utils/historyRoad'
import type { DeskWorld } from '~/utils/deskWorld'
import { WORLD_ORIGINS } from '~/utils/presentationSteps'
import { DEMO_MODEL_ID } from '~/utils/demoModel'

const MOVE_SECONDS = 1.5
const FADE_SECONDS = 0.35
const DIVE_SECONDS = 1.1
const SCAN_SECONDS = 0.9
const ARRIVAL_SECONDS = 1.8
const LOAD_ZOOM_SECONDS = 2.4
const BASE_FOV = 40
const STATION_FADE_SECONDS = 1.2
const TYPE_SECONDS_PER_CHARACTER = 0.06
const GLOW_COLORS = { 'runs-well': '#33ff66', 'runs-slower': '#ffb020', 'too-big': '#ff4d4d', 'unknown': '#7550f0' } as const

const STEP_STATION: Partial<Record<StepId, RoadStation>> = { y1950: 'plugboard', y1966: 'oldComputers', y2012: 'gpu', y2022: 'cloud' }

interface Move {
  start: number
  seconds: number
  update: (progress: number) => void
  done?: () => void
}

function ease(progress: number) {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
}

// One 3D scene for the whole route: dark room, history road, 2026 desk. The step decides where the camera goes.
export function usePresentationStage(canvasRef: Ref<HTMLCanvasElement | null>) {
  const { steps, stepIndex, step, transition, isStageUnavailable } = usePresentation()
  const { specs } = useDevice()
  const { localModels } = useModels()
  const { messages } = useLocale()
  const isReady = ref(false)
  // Where the 3D monitor is on the page (CSS pixels), once the camera has arrived. Null while moving or off screen.
  const screenRect = useState<{ left: number, top: number, width: number, height: number } | null>('mock-screen-rect', () => null)
  let cleanUp: (() => void) | undefined
  let isUnmounted = false

  onMounted(async () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const THREE = await import('three')
    if (isUnmounted) return
    let renderer: Three.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    }
    catch {
      isStageUnavailable.value = true
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor('#030405')
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog('#030405', 12, 45)
    const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.05, 200)

    // The room comes first (it is on screen at once); the other worlds load in the background.
    const room = await buildTerminalRoom(THREE).catch(() => undefined)
    if (isUnmounted) return
    if (room) {
      room.group.position.fromArray(WORLD_ORIGINS.room)
      scene.add(room.group)
    }
    let road: HistoryRoad | undefined
    let desk: DeskWorld | undefined
    const stationsShown = new Set<RoadStation>()
    buildHistoryRoad(THREE).then((built) => {
      if (isUnmounted) return
      road = built
      road.group.position.fromArray(WORLD_ORIGINS.road)
      // Stations stay invisible until their step fades them in.
      for (const station of Object.values(road.stations)) setOpacity(station, 0)
      scene.add(road.group)
      revealStation(true)
    }).catch(() => {})
    buildDeskWorld(THREE).then((built) => {
      if (isUnmounted) return
      desk = built
      desk.group.position.fromArray(WORLD_ORIGINS.desk)
      scene.add(desk.group)
      applyGlow()
      desk.setDevicesVisible(step.value.id === 'further')
    }).catch(() => {})

    // Camera pose helpers. Moves drive the base pose; the orbit (drag + idle sway) is layered on top each frame.
    const cameraTarget = new THREE.Vector3()
    const basePosition = new THREE.Vector3()
    function poseVectors(pose: CameraPose) {
      return { position: new THREE.Vector3(...pose.position), target: new THREE.Vector3(...pose.target) }
    }
    function setFov(fov: number) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    // Room steps: sit right in front of the CRT, eyes a little above it, keyboard at the bottom of the view.
    function poseFor(target: typeof steps[number]): CameraPose {
      if (target.world !== 'room' || !room) return target.camera
      const screen = room.screenCenter.clone().add(room.group.position)
      return { position: [screen.x, screen.y + 0.04, screen.z + 0.95], target: [screen.x, screen.y - 0.1, screen.z] }
    }
    function snapTo(pose: CameraPose) {
      const { position, target } = poseVectors(pose)
      basePosition.copy(position)
      cameraTarget.copy(target)
    }

    let moves: Move[] = []
    function play(seconds: number, update: Move['update'], done?: Move['done']) {
      const move = { start: performance.now(), seconds: prefersReducedMotion ? 0 : seconds, update, done }
      moves.push(move)
      return move
    }
    function moveTo(pose: CameraPose, seconds = MOVE_SECONDS, done?: () => void) {
      const fromPosition = basePosition.clone()
      const fromTarget = cameraTarget.clone()
      const { position, target } = poseVectors(pose)
      play(seconds, (progress) => {
        const eased = ease(progress)
        basePosition.lerpVectors(fromPosition, position, eased)
        cameraTarget.lerpVectors(fromTarget, target, eased)
      }, done)
    }

    // Fade a station in: every material gets an opacity, restored to opaque at the end.
    function setOpacity(object: Three.Object3D, opacity: number) {
      object.visible = opacity > 0
      object.traverse((child) => {
        for (const material of meshMaterials(child)) {
          material.userData.originalTransparent ??= material.transparent
          material.transparent = opacity < 1 || material.userData.originalTransparent
          material.opacity = opacity
        }
      })
    }
    function revealStation(isInstant = false) {
      const station = STEP_STATION[step.value.id]
      if (!road || !station || stationsShown.has(station)) return
      stationsShown.add(station)
      const target = road.stations[station]
      if (isInstant || prefersReducedMotion) setOpacity(target, 1)
      else play(STATION_FADE_SECONDS, progress => setOpacity(target, progress))
    }
    function revealAllStationsUpTo() {
      // Coming straight into a later step (deep link, going back): earlier stations are already there.
      const order: StepId[] = ['y1950', 'y1966', 'y2012', 'y2022']
      const position = order.indexOf(step.value.id)
      for (const id of order.slice(0, position)) {
        const station = STEP_STATION[id]!
        if (road && !stationsShown.has(station)) {
          stationsShown.add(station)
          setOpacity(road.stations[station], 1)
        }
      }
    }

    function applyGlow() {
      const reference = localModels.find(model => model.id === DEMO_MODEL_ID)
      const fit = reference ? fitModel(reference, specs.value) : 'unknown'
      desk?.setGlowColor(GLOW_COLORS[fit])
    }
    const stopWatchingSpecs = watch(specs, applyGlow, { deep: true })

    // Orbit: drag to turn around what the step looks at; let go and it stays, a new step eases it back.
    // Without a drag the view drifts a little, unless the visitor asks for reduced motion.
    const orbit = { yaw: 0, pitch: 0, wantedYaw: 0, wantedPitch: 0 }
    let drag: { x: number, y: number, yaw: number, pitch: number } | undefined
    let isDiving = false
    // The demo step lays the HTML screen over the 3D monitor, so its view must hold still.
    const isViewLocked = () => step.value.panel === 'screen'
    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0 || isViewLocked()) return
      drag = { x: event.clientX, y: event.clientY, yaw: orbit.wantedYaw, pitch: orbit.wantedPitch }
      canvas!.setPointerCapture(event.pointerId)
      canvas!.style.cursor = 'grabbing'
    }
    function onPointerMove(event: PointerEvent) {
      if (!drag) return
      orbit.wantedYaw = drag.yaw - (event.clientX - drag.x) * 0.006
      orbit.wantedPitch = Math.max(-0.5, Math.min(0.6, drag.pitch + (event.clientY - drag.y) * 0.004))
    }
    function onPointerUp() {
      drag = undefined
      canvas!.style.cursor = ''
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    const offset = new THREE.Vector3()
    const spherical = new THREE.Spherical()
    function applyView(seconds: number) {
      const follow = prefersReducedMotion ? 1 : 0.12
      orbit.yaw += (orbit.wantedYaw - orbit.yaw) * follow
      orbit.pitch += (orbit.wantedPitch - orbit.pitch) * follow
      const isMoving = transition.value !== 'none'
      const sway = drag || isMoving || isViewLocked() || prefersReducedMotion ? 0 : 1
      offset.subVectors(basePosition, cameraTarget)
      spherical.setFromVector3(offset)
      spherical.theta += orbit.yaw + sway * Math.sin(seconds * 0.35) * 0.035
      spherical.phi = Math.max(0.15, Math.min(Math.PI - 0.15, spherical.phi - orbit.pitch + sway * Math.sin(seconds * 0.27) * 0.015))
      camera.position.copy(cameraTarget).add(offset.setFromSpherical(spherical))
      camera.lookAt(cameraTarget)
    }

    // A warm spotlight that travels with the camera from step to step and flickers now and then (soft dips, never a strobe).
    // Only the light, no lamp. The room has its own light.
    const spotlight = new THREE.SpotLight('#ffe3c2', 0, 9, Math.PI / 5, 0.45)
    scene.add(spotlight, spotlight.target)
    const spotlightWanted = new THREE.Vector3()
    function updateSpotlight(seconds: number) {
      const isLit = step.value.world !== 'room' && !isDiving
      // Above the target, a little towards the viewer, scaled with the camera distance so far shots get a wide pool.
      offset.subVectors(basePosition, cameraTarget).setY(0)
      const distance = basePosition.distanceTo(cameraTarget)
      offset.setLength(Math.min(distance * 0.25, 1.5))
      spotlightWanted.copy(cameraTarget).add(offset).setY(cameraTarget.y + Math.max(2.4, distance * 0.5))
      spotlight.position.lerp(spotlightWanted, prefersReducedMotion ? 1 : 0.08)
      spotlight.target.position.lerp(cameraTarget, prefersReducedMotion ? 1 : 0.08)
      spotlight.distance = Math.max(9, distance * 2)
      const noise = Math.sin(seconds * 23) * Math.sin(seconds * 7.3) * Math.sin(seconds * 3.1)
      const level = !prefersReducedMotion && noise > 0.55 ? 0.45 + 0.3 * Math.sin(seconds * 60) : 1
      const power = 160 * (distance / 4) ** 2
      spotlight.intensity = isLit ? power * level : 0
    }

    // Step changes: same world = fly, other world = fade through black, intro to 1950 = dive into the screen.
    let stepStart = performance.now()
    function goToStep(newIndex: number, oldIndex: number) {
      const newStep = steps[newIndex]!
      const oldStep = steps[oldIndex]!
      stepStart = performance.now()
      moves = []
      setFov(BASE_FOV)
      isDiving = false
      orbit.wantedYaw = 0
      orbit.wantedPitch = 0
      screenRect.value = null
      desk?.setDevicesVisible(newStep.id === 'further')
      revealAllStationsUpTo()

      if (newStep.world === oldStep.world) {
        moveTo(newStep.camera, MOVE_SECONDS, () => revealStation())
        revealStation()
        return
      }
      const isDive = oldStep.id === 'intro' && newStep.world === 'road' && room
      if (isDive && !prefersReducedMotion) {
        // 1. Lean into the CRT while the lens zooms; scanlines take over the view near the glass.
        const screen = room.screenCenter.clone().add(room.group.position)
        isDiving = true
        play(DIVE_SECONDS, progress => setFov(BASE_FOV - 18 * ease(progress)))
        play(DIVE_SECONDS * 0.55, () => {}, () => {
          transition.value = 'crt'
        })
        moveTo({ position: [screen.x, screen.y, screen.z + 0.06], target: [screen.x, screen.y, screen.z - 1] }, DIVE_SECONDS, () => {
          // 2. Inside the machine: phosphor grid and code rain.
          transition.value = 'scan'
          play(SCAN_SECONDS / 2, () => {}, () => {
            // 3. Sucked through: far back with a very wide lens, rushing in to the first station.
            const arrival = poseVectors(newStep.camera)
            snapTo({ position: [arrival.position.x, arrival.position.y + 2, arrival.position.z + 16], target: newStep.camera.target })
            setFov(105)
            isDiving = false
            play(ARRIVAL_SECONDS, progress => setFov(105 - (105 - BASE_FOV) * ease(progress)))
            moveTo(newStep.camera, ARRIVAL_SECONDS)
            revealStation()
            play(SCAN_SECONDS / 2, () => {}, () => {
              transition.value = 'none'
            })
          })
        })
        return
      }
      transition.value = 'fade'
      play(FADE_SECONDS, () => {}, () => {
        snapTo(poseFor(newStep))
        revealStation(true)
        play(FADE_SECONDS, () => {}, () => {
          transition.value = 'none'
        })
      })
    }
    const stopWatchingStep = watch(stepIndex, goToStep)

    // Terminal text: types out on the intro and end steps.
    function terminalLines() {
      const copy = messages.value.route.terminal
      return step.value.id === 'end' ? copy.end : copy.intro
    }
    function updateTerminal(now: number) {
      if (!room || step.value.world !== 'room') return
      const lines = terminalLines()
      const total = lines.join('').length
      const typed = prefersReducedMotion ? total : Math.floor((now - stepStart) / 1000 / TYPE_SECONDS_PER_CHARACTER)
      let left = Math.min(typed, total)
      const visible = lines.map((line) => {
        const part = line.slice(0, left)
        left = Math.max(0, left - line.length)
        return part
      })
      const shownLines = visible.slice(0, Math.max(1, visible.findLastIndex(line => line.length > 0) + 1))
      room.setLines(shownLines, Math.floor(now / 500) % 2 === 0)
    }

    let width = 0
    let height = 0
    function resizeIfNeeded() {
      if (canvas!.clientWidth === width && canvas!.clientHeight === height) return
      width = canvas!.clientWidth
      height = canvas!.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    // Section panels sit on the right on wide screens: slide the picture left of them, smoothly.
    let viewShift = 0
    function updateViewShift() {
      const wanted = step.value.panel === 'section' && width >= 768 ? 0.24 : 0
      viewShift += (wanted - viewShift) * (prefersReducedMotion ? 1 : 0.08)
      if (Math.abs(viewShift) < 0.001) camera.clearViewOffset()
      else camera.setViewOffset(width, height, viewShift * width, 0, width, height)
    }

    // Project the monitor's corners to the page once the camera stands still on the demo step.
    const corner = new THREE.Vector3()
    const screenBounds = new THREE.Box3()
    function updateScreenRect() {
      if (step.value.panel !== 'screen' || moves.length || transition.value !== 'none' || !desk?.screen) {
        if (screenRect.value) screenRect.value = null
        return
      }
      screenBounds.setFromObject(desk.screen)
      let left = Infinity
      let right = -Infinity
      let top = Infinity
      let bottom = -Infinity
      for (let index = 0; index < 8; index++) {
        corner.set(
          index & 1 ? screenBounds.max.x : screenBounds.min.x,
          index & 2 ? screenBounds.max.y : screenBounds.min.y,
          index & 4 ? screenBounds.max.z : screenBounds.min.z,
        ).project(camera)
        left = Math.min(left, (corner.x + 1) / 2 * width)
        right = Math.max(right, (corner.x + 1) / 2 * width)
        top = Math.min(top, (1 - corner.y) / 2 * height)
        bottom = Math.max(bottom, (1 - corner.y) / 2 * height)
      }
      const rect = { left: Math.round(left), top: Math.round(top), width: Math.round(right - left), height: Math.round(bottom - top) }
      const current = screenRect.value
      if (!current || current.left !== rect.left || current.top !== rect.top || current.width !== rect.width || current.height !== rect.height) screenRect.value = rect
    }

    // On load the camera starts wide and rolls up to the terminal, as if you pull up a chair.
    snapTo(step.value.camera)
    if (step.value.world === 'room') moveTo(poseFor(step.value), LOAD_ZOOM_SECONDS)
    let frame = 0
    let lastTerminalDraw = 0
    function render(now: number) {
      frame = requestAnimationFrame(render)
      resizeIfNeeded()
      updateViewShift()
      for (const move of [...moves]) {
        const progress = move.seconds === 0 ? 1 : Math.min(1, (now - move.start) / 1000 / move.seconds)
        move.update(progress)
        if (progress >= 1) {
          moves = moves.filter(candidate => candidate !== move)
          move.done?.()
        }
      }
      applyView(now / 1000)
      updateSpotlight(now / 1000)
      road?.update(now / 1000)
      desk?.pulseCables(now / 1000)
      updateScreenRect()
      // Canvas redraw costs a texture upload: 15 times a second is plenty for typing.
      if (now - lastTerminalDraw > 66) {
        updateTerminal(now)
        lastTerminalDraw = now
      }
      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(render)
    isReady.value = true
    if (import.meta.dev) Object.assign(window, { __stage: { THREE, camera, cameraTarget, scene, room, snapTo, goTo: (index: number) => { stepIndex.value = index } } })

    cleanUp = () => {
      cancelAnimationFrame(frame)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      stopWatchingSpecs()
      stopWatchingStep()
      renderer.dispose()
    }
  })

  onBeforeUnmount(() => {
    isUnmounted = true
    cleanUp?.()
  })

  return { isReady }
}
