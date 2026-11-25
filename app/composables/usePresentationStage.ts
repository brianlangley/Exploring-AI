import type { Ref } from 'vue'
import type * as Three from 'three'
import type { CameraPose, StepId } from '~/utils/presentationSteps'
import type { HistoryRoad, RoadStation } from '~/utils/historyRoad'
import type { DeskWorld } from '~/utils/deskWorld'
import { WORLD_ORIGINS } from '~/utils/presentationSteps'
import { DEMO_MODEL_ID } from '~/utils/demoModel'
import type { Point } from '~/utils/screenQuad'
import { MOCK_HEIGHT, MOCK_WIDTH, findPanelCorners, quadToMatrix3d, sortQuad } from '~/utils/screenQuad'

const MOVE_SECONDS = 1.5
const FADE_SECONDS = 0.35
const DIVE_SECONDS = 1.5
const SCAN_SECONDS = 0.9
const ARRIVAL_SECONDS = 1.8
// On load you look at the sign, turn around and walk up to the monitor; it starts typing once you are close.
const LOAD_SIGN_HOLD_SECONDS = 1.8
const LOAD_TURN_SECONDS = 1.8
const LOAD_WALK_SECONDS = 3.2
const LOAD_TYPE_DELAY_SECONDS = 3.5
// Leaving the machine: yanked backwards out of the 3D world, then the room pulls away from the glass.
const EXIT_PULL_SECONDS = 0.9
const EXIT_ROOM_SECONDS = 3.4
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
  const { steps, stepIndex, step, transition, isStageUnavailable, isStageMoving } = usePresentation()
  const { specs } = useDevice()
  const { localModels } = useModels()
  const { messages } = useLocale()
  const sound = useStageSound()
  const isReady = ref(false)
  // CSS transform that lays a 1280 x 704 box exactly over the 3D monitor's screen, perspective included, once the camera has arrived. Null while moving or off screen.
  const screenTransform = useState<string | null>('mock-screen-transform', () => null)
  let cleanUp: (() => void) | undefined
  let isUnmounted = false

  onMounted(async () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const removeSound = sound.install()
    // A remount (hot reload) mid-transition must not leave the overlay up.
    transition.value = 'none'

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
    const room = await buildTerminalRoom(THREE, () => {
      if (room?.group.visible) sound.crackle()
    }).catch(() => undefined)
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
    // Room steps: the intro sits right in front of the CRT; the end sits back a little, out of the machine, still reading the screen.
    function screenWorld() {
      return room!.screenCenter.clone().add(room!.group.position)
    }
    function poseFor(target: typeof steps[number]): CameraPose {
      if (target.world !== 'room' || !room) return target.camera
      const screen = screenWorld()
      if (target.id === 'end') return { position: [screen.x + 0.35, screen.y + 0.25, screen.z + 1.9], target: [screen.x + 0.1, screen.y - 0.08, screen.z] }
      return { position: [screen.x, screen.y + 0.15, screen.z + 1.4], target: [screen.x, screen.y - 0.08, screen.z] }
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
    function moveTo(pose: CameraPose, seconds = MOVE_SECONDS, done?: () => void, easing = ease) {
      const fromPosition = basePosition.clone()
      const fromTarget = cameraTarget.clone()
      const { position, target } = poseVectors(pose)
      play(seconds, (progress) => {
        const eased = easing(progress)
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
    let shake = 0
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
      // In the room the camera turns around the monitor: a small turn only, or it swings out through the walls.
      if (step.value.world === 'room') orbit.wantedYaw = Math.max(-0.6, Math.min(0.6, orbit.wantedYaw))
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
      // Shake while being pulled in or out of the machine.
      if (shake) camera.position.add(offset.set(Math.random() - 0.5, Math.random() - 0.5, 0).multiplyScalar(shake))
    }

    // A warm spotlight that travels with the camera from step to step.
    // Only the light, no lamp. The room has its own light.
    const spotlight = new THREE.SpotLight('#ffe3c2', 0, 9, Math.PI / 5, 0.45)
    scene.add(spotlight, spotlight.target)
    const spotlightWanted = new THREE.Vector3()
    function updateSpotlight() {
      const isLit = step.value.world !== 'room' && !isDiving
      // Above the target, a little towards the viewer, scaled with the camera distance so far shots get a wide pool.
      offset.subVectors(basePosition, cameraTarget).setY(0)
      const distance = basePosition.distanceTo(cameraTarget)
      offset.setLength(Math.min(distance * 0.25, 1.5))
      spotlightWanted.copy(cameraTarget).add(offset).setY(cameraTarget.y + Math.max(2.4, distance * 0.5))
      spotlight.position.lerp(spotlightWanted, prefersReducedMotion ? 1 : 0.08)
      spotlight.target.position.lerp(cameraTarget, prefersReducedMotion ? 1 : 0.08)
      spotlight.distance = Math.max(9, distance * 2)
      const power = 160 * (distance / 4) ** 2
      spotlight.intensity = isLit ? power : 0
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
      shake = 0
      room?.setSurge(0)
      orbit.wantedYaw = 0
      orbit.wantedPitch = 0
      screenTransform.value = null
      desk?.setDevicesVisible(newStep.id === 'further')
      revealAllStationsUpTo()

      sound.tick()
      if (newStep.world === oldStep.world) {
        sound.swish()
        moveTo(poseFor(newStep), MOVE_SECONDS, () => revealStation())
        revealStation()
        return
      }
      if (room && !prefersReducedMotion && oldStep.world === 'room') {
        diveIntoScreen(newStep)
        return
      }
      if (room && !prefersReducedMotion && newStep.world === 'room') {
        pullOutOfScreen(newStep)
        return
      }
      transition.value = 'fade'
      sound.swish()
      play(FADE_SECONDS, () => {}, () => {
        snapTo(poseFor(newStep))
        revealStation(true)
        play(FADE_SECONDS, () => {}, () => {
          transition.value = 'none'
        })
      })
    }

    const accelerate = (progress: number) => progress ** 3
    const settle = (progress: number) => 1 - (1 - progress) ** 3

    // Sucked into the computer: the camera accelerates at the glass while the lens widens (the room stretches away),
    // the screen floods the room with green and the view shakes. Then the scan, then the rush into the new world.
    function diveIntoScreen(newStep: typeof steps[number]) {
      const screen = screenWorld()
      isDiving = true
      sound.whoosh('in', DIVE_SECONDS + SCAN_SECONDS / 2)
      play(DIVE_SECONDS, (progress) => {
        setFov(BASE_FOV + 45 * accelerate(progress))
        room!.setSurge(progress ** 2)
        shake = 0.006 * accelerate(progress)
      })
      play(DIVE_SECONDS * 0.82, () => {}, () => {
        transition.value = 'crt'
      })
      moveTo({ position: [screen.x, screen.y, screen.z + 0.05], target: [screen.x, screen.y, screen.z - 1] }, DIVE_SECONDS, () => {
        // Inside the machine: phosphor grid and code rain.
        shake = 0
        transition.value = 'scan'
        play(SCAN_SECONDS / 2, () => {}, () => {
          // Through: far back with a very wide lens, rushing in to the first stop.
          room!.setSurge(0)
          const arrival = poseFor(newStep)
          snapTo({ position: [arrival.position[0], arrival.position[1] + 2, arrival.position[2] + 16], target: arrival.target })
          setFov(105)
          isDiving = false
          play(ARRIVAL_SECONDS, progress => setFov(105 - (105 - BASE_FOV) * ease(progress)))
          moveTo(arrival, ARRIVAL_SECONDS)
          revealStation()
          play(SCAN_SECONDS / 2, () => {}, () => {
            transition.value = 'none'
          })
        })
      }, accelerate)
    }

    // The way back out: yanked backwards out of the 3D world into the code, then you are nose to the glass
    // in the room again, and the room pulls away until you sit back, looking at the screen.
    function pullOutOfScreen(newStep: typeof steps[number]) {
      const away = basePosition.clone().sub(cameraTarget).setLength(14).add(basePosition)
      sound.whoosh('out', EXIT_PULL_SECONDS + SCAN_SECONDS * 0.6)
      play(EXIT_PULL_SECONDS, (progress) => {
        setFov(BASE_FOV + 60 * accelerate(progress))
        shake = 0.05 * accelerate(progress)
      })
      play(EXIT_PULL_SECONDS * 0.6, () => {}, () => {
        transition.value = 'scan-out'
      })
      moveTo({ position: away.toArray(), target: cameraTarget.toArray() }, EXIT_PULL_SECONDS, () => {
        shake = 0
        play(SCAN_SECONDS * 0.6, () => {}, () => {
          const screen = screenWorld()
          snapTo({ position: [screen.x, screen.y, screen.z + 0.05], target: [screen.x, screen.y, screen.z - 1] })
          setFov(18)
          room!.setSurge(1)
          transition.value = 'crt'
          // The terminal starts typing once you are nearly back in your seat.
          stepStart = performance.now() + EXIT_ROOM_SECONDS * 600
          play(EXIT_ROOM_SECONDS, (progress) => {
            setFov(18 + (BASE_FOV - 18) * settle(progress))
            room!.setSurge(1 - settle(progress))
          })
          moveTo(poseFor(newStep), EXIT_ROOM_SECONDS, undefined, settle)
          play(0.35, () => {}, () => {
            transition.value = 'none'
          })
        })
      }, accelerate)
    }

    const stopWatchingStep = watch(stepIndex, goToStep)

    // Terminal text: types out on the intro and end steps.
    function terminalLines() {
      const copy = messages.value.route.terminal
      return step.value.id === 'end' ? copy.end : copy.intro
    }
    let lastTyped = 0
    function updateTerminal(now: number) {
      if (!room || step.value.world !== 'room') return
      const lines = terminalLines()
      const total = lines.join('').length
      const typed = prefersReducedMotion ? total : Math.max(0, Math.floor((now - stepStart) / 1000 / TYPE_SECONDS_PER_CHARACTER))
      let left = Math.min(typed, total)
      // A key click for every new letter (spaces and line breaks are silent).
      const typedText = lines.join('').slice(0, left)
      if (left > lastTyped && typedText.at(-1)?.trim()) sound.keyClick()
      lastTyped = left
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

    // Project the monitor's four real screen corners to the page once the camera stands still on the demo step.
    // The mock computer is warped onto that quad, so it sits on the glass even though the monitor is tilted and seen in perspective.
    let panelCorners: ReturnType<typeof findPanelCorners> | undefined
    function updateScreenRect() {
      if (step.value.panel !== 'screen' || moves.length || transition.value !== 'none' || !desk?.screen) {
        if (screenTransform.value) screenTransform.value = null
        return
      }
      panelCorners ??= findPanelCorners(THREE, desk.screen as Three.Mesh)
      const quad = sortQuad(panelCorners.map((point) => {
        const projected = point.clone().project(camera)
        return [(projected.x + 1) / 2 * width, (1 - projected.y) / 2 * height] as Point
      }))
      const transform = quadToMatrix3d(MOCK_WIDTH, MOCK_HEIGHT, quad)
      if (screenTransform.value !== transform) screenTransform.value = transform
    }

    // On load: look at the room's sign, then turn and sit down at the monitor (or walk straight up to it).
    const sign = room?.signCenter?.clone().add(room.group.position)
    if (step.value.world === 'room' && room && sign && !prefersReducedMotion) {
      // First the glowing LM Studio sign on the back wall, then turn around and sit down at the monitor.
      const screen = screenWorld()
      snapTo({ position: [sign.x + 0.3, 1.55, sign.z - 2], target: sign.toArray() })
      play(LOAD_SIGN_HOLD_SECONDS, () => {}, () => {
        moveTo({ position: [screen.x - 0.4, 1.5, screen.z + 1.9], target: [screen.x - 2, 1.3, screen.z + 1.6] }, LOAD_TURN_SECONDS, () => {
          moveTo(poseFor(step.value), LOAD_WALK_SECONDS)
        })
      })
      stepStart = performance.now() + (LOAD_SIGN_HOLD_SECONDS + LOAD_TURN_SECONDS + LOAD_WALK_SECONDS * 0.6) * 1000
    }
    else if (step.value.world === 'room' && room) {
      const entrance = room.entrance.clone().add(room.group.position)
      const screen = screenWorld()
      snapTo({ position: entrance.toArray(), target: [screen.x, screen.y - 0.2, screen.z] })
      moveTo(poseFor(step.value), LOAD_WALK_SECONDS)
      if (!prefersReducedMotion) stepStart = performance.now() + LOAD_TYPE_DELAY_SECONDS * 1000
    }
    else {
      snapTo(step.value.camera)
    }
    // Only the world the camera is in is drawn: no other world through the room's open sides,
    // and no other world's sun or fill light leaking in (lights reach the whole scene).
    const worldBorders = [(WORLD_ORIGINS.room[0] + WORLD_ORIGINS.road[0]) / 2, (WORLD_ORIGINS.road[0] + WORLD_ORIGINS.desk[0]) / 2]
    function showOnlyCameraWorld() {
      const x = camera.position.x
      if (room) room.group.visible = x < worldBorders[0]!
      if (road) road.group.visible = x >= worldBorders[0]! && x < worldBorders[1]!
      if (desk) desk.group.visible = x >= worldBorders[1]!
    }

    let wasInRoom = false
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
      showOnlyCameraWorld()
      const isInRoom = Boolean(room?.group.visible)
      if (isInRoom !== wasInRoom) {
        sound.setHum(isInRoom)
        wasInRoom = isInRoom
      }
      const isMoving = moves.length > 0 || transition.value !== 'none'
      if (isStageMoving.value !== isMoving) isStageMoving.value = isMoving
      updateSpotlight()
      road?.update(now / 1000)
      room?.update(now / 1000)
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
      removeSound()
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
