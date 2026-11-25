import type * as Three from 'three'

type ThreeModule = typeof Three

// Parts of the gaming PC file that are only brand logos: hidden (PLAN-v3 section 2, texture check of 25 Nov 2026).
const HIDDEN_PARTS = ['NVIDIA LOGO', 'aorus logotranspa', 'Color-PewDiePie-Logo', 'gigabyte-logo', 'gigabyte-logo.001', 'maxresdefault (1)', 'gallerymodel', 'Object_782', 'OnTheFly-bg', 'bg2', 'geforcertx']
// Materials whose texture is brand art but whose shape we keep: glowing ones become our plain glow, the rest plain dark metal.
const FAN_MATERIALS = ['Material.074_0', 'Material.074_17', 'Material.074_20']
const GLOW_MATERIALS = ['Material.074_4', 'Material.074_9', 'Material.074_18', 'Material.074_15']
const DARK_MATERIALS = ['Material.074_1', 'Material.074_3', 'Material.074_7', 'Material.074_8', 'Material.074_22', 'Material.074_23', 'Material.074_25', 'Material.074_10', 'Material.074_12', 'Material.074_24', 'Material.074_27', 'Material.074_28', 'Material.074_31', 'Material.074_40']
const SCREEN_PART = 'MY SCREEN'

export interface DeskWorld {
  group: Three.Group
  // Fans and RGB parts follow the device check: green runs well, amber slower, red too small.
  setGlowColor: (color: string) => void
  // Extra devices for the "build further" step.
  setDevicesVisible: (visible: boolean) => void
  // The monitor's screen: the mock computer is placed over it.
  screen: Three.Object3D | undefined
  // Light cables to the build-further devices breathe.
  pulseCables: (seconds: number) => void
}

// The 2026 world: the cleaned gaming PC setup in a dark room, plus phone, smart home panel and Raspberry Pi for later steps.
export async function buildDeskWorld(THREE: ThreeModule): Promise<DeskWorld> {
  const group = new THREE.Group()
  group.add(new THREE.HemisphereLight('#cbbffd', '#05070a', 0.8))
  const key = new THREE.DirectionalLight('#ffe9cc', 1.6)
  key.position.set(6, 9, 6)
  group.add(key)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: '#0b0e13', roughness: 1 }))
  floor.rotation.x = -Math.PI / 2
  group.add(floor)

  const [pc, phone, smartHome, raspberryPi, rack, logoTexture] = await Promise.all([
    loadModel(THREE, 'gaming-pc.glb', 6),
    loadModel(THREE, 'phone.glb', 0.85),
    loadModel(THREE, 'smart-home.glb', 1.1),
    loadModel(THREE, 'raspberry-pi.glb', 0.6),
    loadModel(THREE, 'rack-server.glb', 1.6, { measure: 'height' }),
    createLogoTexture(THREE).catch(() => undefined),
  ])

  const hidden = new Set(HIDDEN_PARTS.map(name => THREE.PropertyBinding.sanitizeNodeName(name)))
  const glowMaterial = new THREE.MeshStandardMaterial({ color: '#111111', emissive: '#7550f0', emissiveIntensity: 2, roughness: 0.4 })
  // Fans: a glowing ring on a dark face (our own drawing, replaces the logo in the hub).
  const fanMaterial = new THREE.MeshStandardMaterial({ color: '#15171c', emissive: '#7550f0', emissiveIntensity: 2.2, emissiveMap: createRingTexture(THREE), roughness: 0.5 })
  const darkMaterial = new THREE.MeshStandardMaterial({ color: '#1a1d22', metalness: 0.5, roughness: 0.5 })
  const screenMaterial = new THREE.MeshBasicMaterial({ color: '#0b1117', map: logoTexture ?? null, toneMapped: false })
  if (logoTexture) screenMaterial.color.set('#ffffff')

  let screen: Three.Object3D | undefined
  pc.model.traverse((object) => {
    // The "Text" parts are 3D lettering such as the AORUS slogan "TEAM UP. FIGHT ON.": all decoration, all hidden.
    if (hidden.has(object.name) || /^Text/.test(object.name)) object.visible = false
    const mesh = object as Three.Mesh
    if (!mesh.isMesh) return
    if (object.parent?.name === THREE.PropertyBinding.sanitizeNodeName(SCREEN_PART) || object.name === THREE.PropertyBinding.sanitizeNodeName(SCREEN_PART)) {
      setFlatUvs(THREE, mesh.geometry)
      mesh.material = screenMaterial
      screen = mesh
      return
    }
    const name = (mesh.material as Three.Material).name
    if (FAN_MATERIALS.includes(name)) mesh.material = fanMaterial
    else if (GLOW_MATERIALS.includes(name)) mesh.material = glowMaterial
    else if (DARK_MATERIALS.includes(name)) mesh.material = darkMaterial
  })
  group.add(pc.holder)

  // Build further (PLAN-v3 9.2): devices on lit pedestals in front of the desk, each linked to the PC by a cable of light.
  // Phone = LM Link, Raspberry Pi + smart home panel = Home Assistant over the local network, server = llmster.
  const devices = new THREE.Group()
  const pedestalMaterial = new THREE.MeshStandardMaterial({ color: '#2c313c', roughness: 0.45, metalness: 0.3 })
  const PEDESTAL_HEIGHT = 1.1
  function pedestal(x: number, z: number, width = 0.9) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(width, PEDESTAL_HEIGHT, width), pedestalMaterial)
    block.position.set(x, PEDESTAL_HEIGHT / 2, z)
    const spot = new THREE.PointLight('#cbbffd', 6, 4)
    spot.position.set(x + 0.6, PEDESTAL_HEIGHT + 1.4, z + 0.6)
    devices.add(block, spot)
    return new THREE.Vector3(x, PEDESTAL_HEIGHT, z)
  }

  const phoneSpot = pedestal(4.6, 3.2)
  phone.holder.position.copy(phoneSpot)
  phone.holder.rotation.y = -0.8

  const hubSpot = pedestal(5.0, 0.6, 1.3)
  raspberryPi.holder.position.copy(hubSpot).add(new THREE.Vector3(0.3, 0, 0.35))
  smartHome.holder.position.copy(hubSpot).add(new THREE.Vector3(-0.25, 0, -0.25))
  smartHome.holder.rotation.y = 0.9

  rack.holder.position.set(4.6, 0, -2.4)
  rack.holder.rotation.y = -Math.PI / 2
  devices.add(phone.holder, raspberryPi.holder, smartHome.holder, rack.holder)

  // Light cables from the PC tower (its top, measured on the model) to each device.
  const tower = new THREE.Vector3(0.6, 2.5, -2.1)
  const cableMaterial = new THREE.MeshBasicMaterial({ color: '#8d6ff7', transparent: true, opacity: 0.85, toneMapped: false })
  for (const end of [phoneSpot.clone().setY(1.5), hubSpot.clone().setY(1.6), new THREE.Vector3(4.6, 1.7, -2.4)]) {
    const middle = tower.clone().lerp(end, 0.5).setY(Math.max(tower.y, end.y) + 1.2)
    const curve = new THREE.CatmullRomCurve3([tower, middle, end])
    devices.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.025, 8, false), cableMaterial))
  }
  devices.visible = false
  group.add(devices)

  return {
    group,
    screen,
    setGlowColor: (color) => {
      glowMaterial.emissive.set(color)
      fanMaterial.emissive.set(color)
    },
    setDevicesVisible: (visible) => {
      devices.visible = visible
    },
    pulseCables: (seconds) => {
      cableMaterial.opacity = 0.55 + Math.sin(seconds * 3) * 0.3
    },
  }
}

function createRingTexture(THREE: ThreeModule) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  context.fillStyle = '#000000'
  context.fillRect(0, 0, 256, 256)
  context.strokeStyle = '#ffffff'
  context.lineWidth = 18
  context.shadowColor = '#ffffff'
  context.shadowBlur = 24
  context.beginPath()
  context.arc(128, 128, 96, 0, Math.PI * 2)
  context.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
