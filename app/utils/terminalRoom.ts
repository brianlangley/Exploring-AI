import type * as Three from 'three'

type ThreeModule = typeof Three

// The start and end room: "Basement Home Office" (Fatih174, CC BY 4.0), see public/models/CREDITS.md.
const ROOM_FILE = 'basement-office.glb'
// The main monitor's centre sits this high above the floor: the whole room is scaled to match (metres).
const SCREEN_HEIGHT = 1.15
// Posters with third-party logos or characters (Warner Bros / DC, the Superman shield, a Batman silhouette,
// an orchestra's logo): shown as plain card instead.
const PLAIN_POSTERS = ['mad_max_fury_road_web_by_3ftdeep-d8qr5za.001', 'obey_the_god', 'fear_the_dark', 'fear_the_dark.001']
// The file's neon sign; replaced by the official LM Studio logo (white outline version, unchanged) lit as a sign.
const NEON_MATERIAL = 'neon_sign'
const SCREEN_MATERIALS = ['screen', 'screen.001']
const LIGHT_MATERIALS = ['bulp', 'lamba_effaf']
const LOGO_FILE = '/brand/LM Studio Logo Monochrome Outline White.svg'
// Night in the basement: the screens, the sign and one dim lamp do the lighting.
const SCREEN_GLOW = 0.3
const LAMP_POWER = 0.5
const NEON_POWER = 0.8
const FILL_LIGHT = 0.08
// Easter egg on the second monitor: now and then code rain fades in and a small white pixel rabbit (our own pixel art,
// side view) hops across it, then the rain fades out again. Never in the first seconds after the room appears.
const RABBIT_SITTING = [
  '........#.#.',
  '........#.#.',
  '.......#####',
  '.......##.##',
  '..#########.',
  '############',
  '.##########.',
  '..##...##...',
]
// In the air: back legs stretched out behind.
const RABBIT_JUMPING = [...RABBIT_SITTING.slice(0, 7), '##......##..']
const RABBIT_FIRST_SECONDS = 10
const RABBIT_FADE_SECONDS = 0.8
const RABBIT_HOP_SECONDS = 5
const RABBIT_HOP_LENGTH_SECONDS = 0.55
const RABBIT_GAP_SECONDS = [10, 25] as const
const RAIN_GLYPHS = '0123456789+-*/=<>{}[]#%'

export interface TerminalRoom {
  group: Three.Group
  // Middle of the main monitor (room coordinates). The monitor faces +z: the camera dives into it.
  screenCenter: Three.Vector3
  // Where the visitor stands on page load, before walking up to the desk (room coordinates).
  entrance: Three.Vector3
  // Middle of the LM Studio sign on the back wall (room coordinates), when the model has one.
  signCenter: Three.Vector3 | undefined
  setLines: (lines: string[], cursorOn: boolean) => void
  // 0 = calm, 1 = the screen floods the room (diving in or coming back out).
  setSurge: (amount: number) => void
  // Screen flicker.
  update: (seconds: number) => void
}

// `onEggStart` runs when the rain and rabbit begin on the second monitor (for a sound).
export async function buildTerminalRoom(THREE: ThreeModule, onEggStart?: () => void): Promise<TerminalRoom> {
  const group = new THREE.Group()
  const [{ holder, model }, logoTexture] = await Promise.all([
    loadModel(THREE, ROOM_FILE, 1),
    createNeonLogoTexture(THREE).catch(() => undefined),
  ])
  group.add(holder)

  const screens: Three.Mesh[] = []
  const lightSpots: Three.Mesh[] = []
  const neonParts: Three.Mesh[] = []
  let signCenter: Three.Vector3 | undefined
  model.traverse((object) => {
    const mesh = object as Three.Mesh
    if (!mesh.isMesh) return
    for (const material of meshMaterials(mesh)) {
      // The specular-glossiness conversion leaves an index of refraction of 1000: every surface turns into a mirror.
      if (material instanceof THREE.MeshPhysicalMaterial && material.ior > 3) material.ior = 1.5
      if (PLAIN_POSTERS.includes(material.name) && material instanceof THREE.MeshStandardMaterial) {
        material.map = null
        material.color.set('#2a2d33')
        material.needsUpdate = true
      }
      if (material.name === NEON_MATERIAL) neonParts.push(mesh)
      if (SCREEN_MATERIALS.includes(material.name)) screens.push(mesh)
      if (LIGHT_MATERIALS.includes(material.name)) lightSpots.push(mesh)
    }
  })

  // Main monitor: the biggest screen. Turn the room so it faces +z, then scale the room to real size.
  const area = (mesh: Three.Mesh) => new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3()).lengthSq()
  screens.sort((a, b) => area(b) - area(a))
  const [mainScreen, sideScreen] = screens
  if (!mainScreen) throw new Error('Room model has no screen')
  holder.updateMatrixWorld(true)
  const facing = screenNormal(THREE, mainScreen)
  // Screen normals can point out of the back: the monitor faces the middle of the room.
  const towardRoom = new THREE.Box3().setFromObject(holder).getCenter(new THREE.Vector3()).sub(new THREE.Box3().setFromObject(mainScreen).getCenter(new THREE.Vector3()))
  const isBackwards = towardRoom.setY(0).dot(facing) < 0
  if (isBackwards) facing.negate()
  holder.rotation.y = Math.atan2(-facing.x, facing.z) + holder.rotation.y
  holder.updateMatrixWorld(true)
  const floor = new THREE.Box3().setFromObject(holder).min.y
  const screenBounds = new THREE.Box3().setFromObject(mainScreen)
  holder.scale.multiplyScalar(SCREEN_HEIGHT / (screenBounds.getCenter(new THREE.Vector3()).y - floor))
  holder.updateMatrixWorld(true)
  // Floor at y = 0, main screen at x = 0.
  const scaledFloor = new THREE.Box3().setFromObject(holder).min.y
  const screenCenter = new THREE.Box3().setFromObject(mainScreen).getCenter(new THREE.Vector3())
  holder.position.set(-screenCenter.x, -scaledFloor, -screenCenter.z)
  holder.updateMatrixWorld(true)
  screenCenter.set(0, screenCenter.y - scaledFloor, new THREE.Box3().setFromObject(mainScreen).max.z)

  // Our text on the main monitor, a film reference on the other one (their own wallpapers show third-party app icons).
  const terminal = createTerminalTexture(THREE)
  const rabbitScreen = createRabbitScreen(THREE, onEggStart)
  // The screens' normals point out of the back and their axes are turned: draw both sides, then fix the UVs by eye
  // (measured in the browser) so text reads upright from the front. Matte, so the screen light leaves no hotspot.
  const screenMaterial = new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#ffffff', emissiveMap: terminal.texture, emissiveIntensity: 1.2, roughness: 1, side: THREE.DoubleSide })
  const setScreenUvs = (geometry: Three.BufferGeometry, mirror = false) => {
    setFlatUvs(THREE, geometry, !isBackwards !== mirror)
    const uvs = geometry.getAttribute('uv')
    for (let index = 0; index < uvs.count; index++) uvs.setY(index, 1 - uvs.getY(index))
  }
  setScreenUvs(mainScreen.geometry)
  mainScreen.material = screenMaterial
  if (sideScreen) {
    setScreenUvs(sideScreen.geometry, true)
    sideScreen.material = new THREE.MeshBasicMaterial({ map: rabbitScreen.texture, side: THREE.DoubleSide })
  }

  // The neon sign: the official logo on a plane where the old sign hung, lit from within.
  if (neonParts.length) {
    // The sign is several tube meshes (one per word). Measure them in the model's own axes, where the sign hangs
    // square to the wall: its thinnest side is its facing. (The tubes' averaged normals tilt it into the wall.)
    holder.updateMatrixWorld(true)
    const toModel = model.matrixWorld.clone().invert()
    const local = new THREE.Box3()
    for (const part of neonParts) {
      part.geometry.computeBoundingBox()
      local.union(part.geometry.boundingBox!.clone().applyMatrix4(toModel.clone().multiply(part.matrixWorld)))
    }
    const size = local.getSize(new THREE.Vector3())
    const facesX = size.x < size.z
    const center = local.getCenter(new THREE.Vector3()).applyMatrix4(model.matrixWorld)
    const normal = new THREE.Vector3(facesX ? 1 : 0, 0, facesX ? 0 : 1).transformDirection(model.matrixWorld)
    for (const part of neonParts) part.visible = false
    // Signs face into the room, and stand a little off the wall so nothing of the logo sinks into it.
    if (normal.dot(new THREE.Vector3().subVectors(screenCenter, center).setY(0)) < 0) normal.negate()
    center.addScaledVector(normal, 0.02)
    signCenter = center.clone()
    const width = (facesX ? size.z : size.x) * holder.scale.x * 1.05
    if (logoTexture) {
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(width, width * logoTexture.image.height / logoTexture.image.width),
        new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, toneMapped: false, side: THREE.DoubleSide }),
      )
      sign.position.copy(center)
      sign.lookAt(center.clone().add(normal))
      group.add(sign)
    }
    const glow = new THREE.PointLight('#e8eeff', NEON_POWER, 3, 1.5)
    glow.position.copy(center).addScaledVector(normal, 0.3)
    group.add(glow)
  }

  // Lamps in the file are only glowing meshes: give each a real warm light.
  const lamps = lightSpots.map((spot) => {
    const lamp = new THREE.PointLight('#ffd2a0', LAMP_POWER, 4, 1.6)
    lamp.position.copy(group.worldToLocal(new THREE.Box3().setFromObject(spot).getCenter(new THREE.Vector3())))
    group.add(lamp)
    return lamp
  })
  group.add(new THREE.HemisphereLight('#3a4660', '#0c0a08', FILL_LIGHT))

  // The monitor lights the desk and your face green.
  const screenLight = new THREE.PointLight('#a8e6b8', SCREEN_GLOW, 2.5, 1.8)
  screenLight.position.copy(screenCenter).add(new THREE.Vector3(0, 0, 0.35))
  group.add(screenLight)

  // The model is a diorama with open sides: close it in with a dark box, so turning around shows only the room.
  const room = new THREE.Box3().setFromObject(holder)
  const roomSize = room.getSize(new THREE.Vector3())
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(roomSize.x + 0.1, roomSize.y + 0.1, roomSize.z + 0.1),
    new THREE.MeshStandardMaterial({ color: '#0a0c0a', roughness: 1, side: THREE.BackSide }),
  )
  room.getCenter(shell.position)
  group.add(shell)

  // Entrance: back from the desk, as far as the room allows, a little to the side.
  const entrance = new THREE.Vector3(
    Math.max(room.min.x + 0.5, Math.min(room.max.x - 0.5, screenCenter.x - 0.8)),
    1.6,
    Math.min(room.max.z - 0.4, screenCenter.z + 3),
  )

  let surge = 0
  return {
    group,
    screenCenter,
    entrance,
    signCenter,
    setLines: (lines, cursorOn) => terminal.draw(lines, cursorOn),
    setSurge: (amount) => {
      surge = Math.max(0, Math.min(1, amount))
      screenMaterial.emissiveIntensity = 1.2 + surge * 5
      for (const lamp of lamps) lamp.intensity = LAMP_POWER * (1 - surge * 0.9)
    },
    update: (seconds) => {
      rabbitScreen.update(seconds)
      // A screen hums: a tiny uneven flicker, stronger while it pulls you in.
      const flicker = 1 + Math.sin(seconds * 37) * Math.sin(seconds * 11.3) * (0.05 + surge * 0.4)
      screenLight.intensity = SCREEN_GLOW * (1 + surge * 8) * flicker
    },
  }
}

// Average normal of a flat mesh, flattened to the floor plane, in world space.
function screenNormal(THREE: ThreeModule, mesh: Three.Mesh) {
  const normals = mesh.geometry.getAttribute('normal')
  const normal = new THREE.Vector3()
  const vector = new THREE.Vector3()
  for (let index = 0; index < normals.count; index++) normal.add(vector.fromBufferAttribute(normals, index))
  normal.transformDirection(mesh.matrixWorld)
  normal.y = 0
  return normal.lengthSq() > 0 ? normal.normalize() : new THREE.Vector3(0, 0, 1)
}

// The official white outline logo, unchanged, on a transparent canvas.
async function createNeonLogoTexture(THREE: ThreeModule) {
  const image = new Image()
  image.src = encodeURI(LOGO_FILE)
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = 2304
  canvas.height = 512
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// A dark screen where the rain and the rabbit show up: first after a while, then at random.
function createRabbitScreen(THREE: ThreeModule, onStart?: () => void) {
  const width = 320
  const height = 180
  const pixel = 3
  const glyphSize = 12
  const rabbitWidth = RABBIT_SITTING[0]!.length * pixel
  const rabbitHeight = RABBIT_SITTING.length * pixel
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter

  const columns = Math.ceil(width / glyphSize)
  const drops = Array.from({ length: columns }, () => Math.random() * height)
  const speeds = Array.from({ length: columns }, () => 40 + Math.random() * 80)
  let start: number | undefined
  let ground = 0
  let lastDraw = 0
  let isBlank = false

  function draw(opacity: number, time: number) {
    context.globalAlpha = 1
    context.fillStyle = '#020403'
    context.fillRect(0, 0, width, height)
    if (opacity <= 0) return
    context.globalAlpha = opacity
    // Rain: a bright head glyph with a fading trail per column.
    context.font = `${glyphSize}px monospace`
    drops.forEach((head, column) => {
      const y = (head + time * speeds[column]!) % (height + 60)
      for (let trail = 0; trail < 6; trail++) {
        context.fillStyle = trail === 0 ? '#c8ffd6' : `rgb(51 255 102 / ${0.7 - trail * 0.11})`
        context.fillText(RAIN_GLYPHS[Math.floor(Math.random() * RAIN_GLYPHS.length)]!, column * glyphSize, y - trail * glyphSize)
      }
    })
    // Rabbit: hops from the left edge to the right edge, one arc per hop.
    const hopTime = time - RABBIT_FADE_SECONDS
    if (hopTime < 0 || hopTime > RABBIT_HOP_SECONDS) return
    const x = -rabbitWidth + (width + rabbitWidth) * (hopTime / RABBIT_HOP_SECONDS)
    const phase = (hopTime % RABBIT_HOP_LENGTH_SECONDS) / RABBIT_HOP_LENGTH_SECONDS
    const lift = Math.sin(phase * Math.PI) * 14
    const shape = lift > 3 ? RABBIT_JUMPING : RABBIT_SITTING
    const top = Math.round(ground - rabbitHeight - lift)
    context.fillStyle = '#f0f4f0'
    shape.forEach((row, rowIndex) => [...row].forEach((cell, column) => {
      if (cell === '#') context.fillRect(Math.round(x) + column * pixel, top + rowIndex * pixel, pixel, pixel)
    }))
  }
  function schedule(from: number, gap: number) {
    start = from + gap
    ground = Math.round(height * (0.55 + Math.random() * 0.35))
  }
  draw(0, 0)

  return {
    texture,
    update: (seconds: number) => {
      if (start === undefined) schedule(seconds, RABBIT_FIRST_SECONDS)
      const time = seconds - start!
      const shown = RABBIT_FADE_SECONDS * 2 + RABBIT_HOP_SECONDS
      if (time > shown) {
        const [shortest, longest] = RABBIT_GAP_SECONDS
        schedule(seconds, shortest + Math.random() * (longest - shortest))
      }
      if (time < 0 || time > shown) {
        // Off: one blank frame, then nothing to upload.
        if (!isBlank) {
          draw(0, 0)
          texture.needsUpdate = true
          isBlank = true
        }
        return
      }
      // Animated: about 15 frames a second is plenty on a side screen.
      if (seconds - lastDraw < 0.066) return
      lastDraw = seconds
      if (isBlank) onStart?.()
      isBlank = false
      draw(Math.min(1, time / RABBIT_FADE_SECONDS, (shown - time) / RABBIT_FADE_SECONDS), time)
      texture.needsUpdate = true
    },
  }
}
