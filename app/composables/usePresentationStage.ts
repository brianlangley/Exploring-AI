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
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200)

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

    // Camera pose helpers.
    const cameraTarget = new THREE.Vector3()
    function poseVectors(pose: CameraPose) {
      return { position: new THREE.Vector3(...pose.position), target: new THREE.Vector3(...pose.target) }
    }
    function snapTo(pose: CameraPose) {
      const { position, target } = poseVectors(pose)
      camera.position.copy(position)
      cameraTarget.copy(target)
      camera.lookAt(cameraTarget)
    }

    let moves: Move[] = []
    function play(seconds: number, update: Move['update'], done?: Move['done']) {
      const move = { start: performance.now(), seconds: prefersReducedMotion ? 0 : seconds, update, done }
      moves.push(move)
      return move
    }
    function moveTo(pose: CameraPose, seconds = MOVE_SECONDS, done?: () => void) {
      const fromPosition = camera.position.clone()
      const fromTarget = cameraTarget.clone()
      const { position, target } = poseVectors(pose)
      play(seconds, (progress) => {
        const eased = ease(progress)
        camera.position.lerpVectors(fromPosition, position, eased)
        cameraTarget.lerpVectors(fromTarget, target, eased)
        camera.lookAt(cameraTarget)
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

    // Step changes: same world = fly, other world = fade through black, intro to 1950 = dive into the screen.
    let stepStart = performance.now()
    function goToStep(newIndex: number, oldIndex: number) {
      const newStep = steps[newIndex]!
      const oldStep = steps[oldIndex]!
      stepStart = performance.now()
      moves = []
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
        const screen = room.screenCenter.clone().add(room.group.position)
        moveTo({ position: [screen.x, screen.y, screen.z + 0.08], target: [screen.x, screen.y, screen.z - 1] }, DIVE_SECONDS, () => {
          transition.value = 'scan'
          play(SCAN_SECONDS / 2, () => {}, () => {
            // Arrive above the road, behind the first station, then glide in.
            const arrival = poseVectors(newStep.camera)
            snapTo({ position: [arrival.position.x, arrival.position.y + 3, arrival.position.z + 8], target: newStep.camera.target })
            moveTo(newStep.camera, MOVE_SECONDS)
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
        snapTo(newStep.camera)
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

    snapTo(step.value.camera)
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
    if (import.meta.dev) Object.assign(window, { __stage: { THREE, camera, cameraTarget, scene, snapTo, goTo: (index: number) => { stepIndex.value = index } } })

    cleanUp = () => {
      cancelAnimationFrame(frame)
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
