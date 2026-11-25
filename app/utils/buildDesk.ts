import type * as Three from 'three'
import type { DeviceSpecs } from '~/types/model'

type ThreeModule = typeof Three

const RAM_SLOTS = 4
const GLOW = '#8d6ff7'

export interface Desk {
  group: Three.Group
  // 0 is off, 1 is fully on.
  setScreenPower: (power: number) => void
  setDevice: (specs: DeviceSpecs) => void
  dispose: () => void
}

// Low poly desk, monitor, keyboard and a PC case with a glass side, all built in code: no model file to load.
export function buildDesk(THREE: ThreeModule): Desk {
  const group = new THREE.Group()
  const geometries: Three.BufferGeometry[] = []
  const materials: Three.Material[] = []

  function box(width: number, height: number, depth: number, material: Three.Material) {
    const geometry = new THREE.BoxGeometry(width, height, depth)
    geometries.push(geometry)
    return new THREE.Mesh(geometry, material)
  }
  function standard(color: string, options: Three.MeshStandardMaterialParameters = {}) {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1, ...options })
    materials.push(material)
    return material
  }

  const wood = standard('#2a2622', { roughness: 0.85 })
  const plastic = standard('#16191e', { roughness: 0.5 })
  const metal = standard('#3a3f47', { metalness: 0.6, roughness: 0.4 })

  // Desk top and legs.
  const top = box(4.4, 0.08, 1.8, wood)
  top.position.y = 0
  group.add(top)
  for (const [x, z] of [[-2.1, -0.8], [2.1, -0.8], [-2.1, 0.8], [2.1, 0.8]] as const) {
    const leg = box(0.08, 1.5, 0.08, metal)
    leg.position.set(x, -0.79, z)
    group.add(leg)
  }

  // Monitor with a screen that powers on.
  const screenMaterial = standard('#05070a', { emissive: GLOW, emissiveIntensity: 0, roughness: 0.3 })
  const monitor = new THREE.Group()
  const frame = box(2.0, 1.2, 0.06, plastic)
  const screen = box(1.9, 1.1, 0.01, screenMaterial)
  screen.position.z = 0.032
  const neck = box(0.1, 0.4, 0.06, metal)
  neck.position.set(0, -0.78, -0.04)
  const foot = box(0.6, 0.03, 0.35, metal)
  foot.position.set(0, -0.96, 0)
  monitor.add(frame, screen, neck, foot)
  monitor.position.set(-0.4, 1.0, -0.35)
  group.add(monitor)

  // Fake chat lines on the screen: plain bars, no copy of the real app.
  const lineMaterial = new THREE.MeshBasicMaterial({ color: '#e4defe', transparent: true, opacity: 0 })
  materials.push(lineMaterial)
  const lineWidths = [1.1, 0.7, 1.3, 0.9, 0.5]
  lineWidths.forEach((width, index) => {
    const line = box(width, 0.04, 0.005, lineMaterial)
    line.position.set(-0.75 + width / 2, 0.35 - index * 0.16, 0.04)
    monitor.add(line)
  })

  // Keyboard.
  const keyboard = box(1.2, 0.04, 0.36, plastic)
  keyboard.position.set(-0.4, 0.06, 0.45)
  group.add(keyboard)

  // PC case on the desk, glass side panel facing the camera.
  const pcCase = new THREE.Group()
  // Hollow: five panels plus glass, so the parts inside stay visible.
  const panels = [
    { size: [0.02, 1.4, 1.3], position: [0.35, 0, 0] },
    { size: [0.7, 0.02, 1.3], position: [0, 0.69, 0] },
    { size: [0.7, 0.02, 1.3], position: [0, -0.69, 0] },
    { size: [0.7, 1.4, 0.02], position: [0, 0, 0.64] },
    { size: [0.7, 1.4, 0.02], position: [0, 0, -0.64] },
  ] as const
  for (const panel of panels) {
    const mesh = box(...panel.size, plastic)
    mesh.position.set(...panel.position)
    pcCase.add(mesh)
  }
  const glass = new THREE.MeshPhysicalMaterial({ color: '#8a96a8', transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0 })
  materials.push(glass)
  const glassPanel = box(0.01, 1.36, 1.26, glass)
  glassPanel.position.x = -0.35
  pcCase.add(glassPanel)
  const board = box(0.02, 1.2, 1.1, standard('#0f2a22', { roughness: 0.9 }))
  board.position.x = 0.3
  pcCase.add(board)

  const ramMaterials: Three.MeshStandardMaterial[] = []
  for (let slot = 0; slot < RAM_SLOTS; slot++) {
    const material = standard('#1c1f26', { emissive: GLOW, emissiveIntensity: 0 })
    ramMaterials.push(material)
    const stick = box(0.08, 0.42, 0.03, material)
    stick.position.set(0.24, 0.3, -0.05 + slot * 0.07)
    pcCase.add(stick)
  }

  const gpuMaterial = standard('#1c1f26', { emissive: '#33b7a0', emissiveIntensity: 0 })
  const gpu = box(0.24, 0.12, 0.85, gpuMaterial)
  gpu.position.set(0.15, -0.15, 0)
  pcCase.add(gpu)
  // Soft light inside the case, like RGB fans.
  const caseLight = new THREE.PointLight(GLOW, 1.2, 1.6)
  caseLight.position.set(0, 0.2, 0)
  pcCase.add(caseLight)

  pcCase.position.set(1.55, 0.74, -0.2)
  // Glass side turned towards the front left, where the close-up camera stands.
  pcCase.rotation.y = 0.5
  group.add(pcCase)

  function setScreenPower(power: number) {
    screenMaterial.emissiveIntensity = 0.35 * power
    lineMaterial.opacity = power
  }

  // RAM sticks light up per 16 GB (up to 4), the GPU by its memory. Apple Silicon: memory is the GPU, both glow.
  function setDevice(specs: DeviceSpecs) {
    const litSticks = Math.min(RAM_SLOTS, Math.max(1, Math.round(specs.ramGB / 16)))
    ramMaterials.forEach((material, index) => {
      material.emissiveIntensity = index < litSticks ? 1.6 : 0
    })
    if (specs.gpu === 'dedicated') gpuMaterial.emissiveIntensity = 0.4 + specs.vramGB / 16
    else if (specs.gpu === 'apple') gpuMaterial.emissiveIntensity = 1.2
    else gpuMaterial.emissiveIntensity = 0
  }

  function dispose() {
    for (const geometry of geometries) geometry.dispose()
    for (const material of materials) material.dispose()
  }

  return { group, setScreenPower, setDevice, dispose }
}
