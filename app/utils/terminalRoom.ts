import type * as Three from 'three'

type ThreeModule = typeof Three

// Screen area inside the terminal's texture atlas (pixels in the 1024 px texture, measured on the file).
const SCREEN_RECT = { x: 552, y: 308, width: 273, height: 185 }
const PHOSPHOR = '#33ff66'
// Room box in room units: desk against the back wall, window with blinds on the right, the visitor walks in from the front.
const ROOM = { minX: -2.4, maxX: 3.2, height: 2.7, minZ: -0.9, maxZ: 4.4 }
const CRT_GLOW = 1.6
const LAMP_POWER = 14
const WINDOW_POWER = 40

export interface TerminalRoom {
  group: Three.Group
  // World position of the middle of the screen: the camera dives into it.
  screenCenter: Three.Vector3
  setLines: (lines: string[], cursorOn: boolean) => void
  // 0 = calm, 1 = the screen floods the room (diving in or coming back out).
  setSurge: (amount: number) => void
  // CRT flicker and drifting dust.
  update: (seconds: number) => void
}

// Step 1 and the end: a dim, cluttered apartment at night. Green walls, a mattress on the floor, a desk full of old machines,
// one small barred window high up. The terminal's glow is the main light.
export async function buildTerminalRoom(THREE: ThreeModule): Promise<TerminalRoom> {
  const group = new THREE.Group()
  const box = (width: number, height: number, depth: number, material: Three.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  }

  // Walls, floor and ceiling: one box seen from inside.
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.maxX - ROOM.minX, ROOM.height, ROOM.maxZ - ROOM.minZ),
    new THREE.MeshStandardMaterial({ color: '#2e3a2c', roughness: 0.95, side: THREE.BackSide }),
  )
  shell.position.set((ROOM.minX + ROOM.maxX) / 2, ROOM.height / 2, (ROOM.minZ + ROOM.maxZ) / 2)
  shell.receiveShadow = true
  group.add(shell)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.maxX - ROOM.minX, ROOM.maxZ - ROOM.minZ), new THREE.MeshStandardMaterial({ color: '#1b1e19', roughness: 0.85 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.set(shell.position.x, 0.002, shell.position.z)
  floor.receiveShadow = true
  group.add(floor)

  // Desk.
  const wood = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.85 })
  const metal = new THREE.MeshStandardMaterial({ color: '#3a3f47', roughness: 0.6, metalness: 0.4 })
  box(1.8, 0.06, 1.0, wood, 0, 0.72, 0)
  for (const [x, z] of [[-0.85, -0.45], [0.85, -0.45], [-0.85, 0.45], [0.85, 0.45]] as const) box(0.05, 0.72, 0.05, metal, x, 0.36, z)

  // Small barred window high in the back wall: cold night light falls in a striped beam across the floor.
  const windowX = 1.7
  const windowY = 2.2
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshBasicMaterial({ color: '#8fa3c4', toneMapped: false }))
  glass.position.set(windowX, windowY, ROOM.minZ + 0.01)
  group.add(glass)
  const slatMaterial = new THREE.MeshStandardMaterial({ color: '#1d211c', roughness: 0.7 })
  for (let index = 0; index < 6; index++) box(0.03, 0.56, 0.04, slatMaterial, windowX - 0.3 + index * 0.12, windowY, ROOM.minZ + 0.05)
  box(0.76, 0.04, 0.05, slatMaterial, windowX, windowY, ROOM.minZ + 0.05)
  const moon = new THREE.SpotLight('#8aa6ff', WINDOW_POWER, 12, 0.22, 0.4, 1.2)
  moon.position.set(windowX + 0.2, windowY + 1.1, ROOM.minZ - 2.2)
  moon.target.position.set(1.4, 0, 2.2)
  moon.castShadow = true
  moon.shadow.mapSize.set(1024, 1024)
  moon.shadow.bias = -0.0005
  group.add(moon, moon.target)

  // Office chair, pushed back a little, as if someone just got up.
  const fabric = new THREE.MeshStandardMaterial({ color: '#141516', roughness: 0.9 })
  const chair = new THREE.Group()
  chair.position.set(-0.85, 0, 1.0)
  chair.rotation.y = 0.9
  const chairPart = (geometry: Three.BufferGeometry, material: Three.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    chair.add(mesh)
    return mesh
  }
  chairPart(new THREE.BoxGeometry(0.5, 0.08, 0.48), fabric, 0, 0.48, 0)
  chairPart(new THREE.BoxGeometry(0.48, 0.62, 0.07), fabric, 0, 0.86, 0.24).rotation.x = -0.12
  chairPart(new THREE.CylinderGeometry(0.025, 0.025, 0.4), metal, 0, 0.25, 0)
  for (let leg = 0; leg < 5; leg++) {
    const foot = chairPart(new THREE.BoxGeometry(0.03, 0.03, 0.3), metal, 0, 0.05, 0)
    foot.rotation.y = (leg / 5) * Math.PI * 2
    foot.translateZ(0.15)
  }
  group.add(chair)

  // Bookshelf against the back wall, full of manuals.
  const shelfX = -1.75
  const shelfZ = ROOM.minZ + 0.2
  box(0.95, 1.9, 0.36, wood, shelfX, 0.95, shelfZ).castShadow = false
  const bookColors = ['#3a2a22', '#232a33', '#3b3524', '#2c2224', '#1f2b25', '#45423a']
  // Fixed seed: the same shelf on every visit.
  let seed = 7
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let level = 0; level < 4; level++) {
    let x = shelfX - 0.42
    while (x < shelfX + 0.38) {
      const width = 0.03 + random() * 0.05
      const height = 0.22 + random() * 0.14
      const material = new THREE.MeshStandardMaterial({ color: bookColors[Math.floor(random() * bookColors.length)], roughness: 0.8 })
      box(width, height, 0.26, material, x + width / 2, 0.12 + level * 0.45 + height / 2, shelfZ + 0.04)
      x += width + 0.004
    }
  }

  // Desk lamp on the left: a small warm pool on the desk, the only warm light in the room.
  const shadeMaterial = new THREE.MeshStandardMaterial({ color: '#2d2a26', roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide })
  box(0.16, 0.02, 0.16, metal, -0.72, 0.76, -0.2)
  box(0.02, 0.45, 0.02, metal, -0.72, 0.98, -0.12).rotation.x = 0.35
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 20, 1, true), shadeMaterial)
  shade.position.set(-0.72, 1.2, 0.0)
  shade.rotation.x = -0.6
  group.add(shade)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025), new THREE.MeshBasicMaterial({ color: '#ffd9a0' }))
  bulb.position.set(-0.72, 1.17, 0.03)
  group.add(bulb)
  const lamp = new THREE.SpotLight('#ffc98a', LAMP_POWER, 4, 0.9, 0.7, 1.6)
  lamp.position.copy(bulb.position)
  lamp.target.position.set(-0.45, 0.75, 0.4)
  group.add(lamp, lamp.target)

  // Desk clutter: paper, a mug, a floppy, boxes of parts. A second table on the right holds more machines.
  const paper = new THREE.MeshStandardMaterial({ color: '#8c8778', roughness: 1 })
  box(0.22, 0.03, 0.3, paper, 0.62, 0.765, 0.18).rotation.y = 0.25
  box(0.2, 0.05, 0.28, paper, -0.45, 0.775, 0.3).rotation.y = -0.4
  const cardboard = new THREE.MeshStandardMaterial({ color: '#4a3f30', roughness: 0.95 })
  box(0.3, 0.2, 0.25, cardboard, -1.35, 0.1, 0.25)
  box(0.25, 0.16, 0.22, cardboard, -1.3, 0.28, 0.22).rotation.y = 0.3
  box(1.0, 0.06, 0.8, wood, 1.45, 0.72, -0.4)
  for (const [x, z] of [[1.0, -0.75], [1.9, -0.75], [1.0, -0.05], [1.9, -0.05]] as const) box(0.05, 0.72, 0.05, metal, x, 0.36, z)
  box(0.28, 0.08, 0.2, new THREE.MeshStandardMaterial({ color: '#b9b29d', roughness: 0.7 }), 1.75, 0.79, -0.15).rotation.y = -0.3
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 16), new THREE.MeshStandardMaterial({ color: '#5a2620', roughness: 0.6 }))
  mug.position.set(0.72, 0.8, -0.2)
  mug.castShadow = true
  group.add(mug)

  // Cables: from the machines down to a tangle on the floor, and one hanging from the ceiling.
  const cableMaterial = new THREE.MeshStandardMaterial({ color: '#0c0c0c', roughness: 0.6 })
  const cables: [number, number, number][][] = [
    [[0.1, 0.85, -0.35], [0.3, 0.6, -0.6], [0.4, 0.04, -0.75], [1.4, 0.03, -0.82]],
    [[1.3, 0.8, -0.6], [1.1, 0.3, -0.5], [0.7, 0.03, -0.3], [0.2, 0.03, -0.55], [-0.4, 0.03, -0.7]],
    [[-0.6, 0.78, -0.4], [-0.7, 0.2, -0.6], [-0.2, 0.03, -0.3], [0.5, 0.03, -0.45], [0.9, 0.03, -0.2]],
    [[1.1, ROOM.height, 0.4], [1.15, 1.9, 0.38], [1.05, 1.4, 0.5], [1.2, 1.1, 0.35]],
  ]
  for (const points of cables) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.012, 6), cableMaterial))
  }

  // Mattress on the floor in the front left, unmade.
  const sheet = new THREE.MeshStandardMaterial({ color: '#7b8270', roughness: 1 })
  box(1.4, 0.22, 2.0, new THREE.MeshStandardMaterial({ color: '#5d6356', roughness: 1 }), -1.55, 0.11, 2.9)
  box(1.3, 0.08, 1.3, sheet, -1.5, 0.26, 3.2).rotation.set(0.04, 0.12, -0.03)
  box(0.55, 0.12, 0.35, sheet, -1.8, 0.28, 2.15).rotation.y = 0.15
  box(0.5, 0.12, 0.33, sheet, -1.25, 0.28, 2.1).rotation.y = -0.1

  group.add(new THREE.AmbientLight('#2a3550', 0.18))
  group.add(new THREE.HemisphereLight('#2a3a55', '#0a0806', 0.6))

  // Dust drifting through the window light.
  const DUST = 260
  const dustPositions = new Float32Array(DUST * 3)
  for (let index = 0; index < DUST; index++) {
    dustPositions[index * 3] = -0.6 + random() * 3.6
    dustPositions[index * 3 + 1] = 0.3 + random() * 2.2
    dustPositions[index * 3 + 2] = -0.5 + random() * 2.6
  }
  const dustGeometry = new THREE.BufferGeometry()
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#b9c7ff', size: 0.007, transparent: true, opacity: 0.55, depthWrite: false }))
  group.add(dust)

  // Terminal model: hide the backdrop and shadow planes that came with the file.
  const [{ holder, model }, floppy, oldComputer, monitor] = await Promise.all([
    loadModel(THREE, 'terminal.glb', 1.0, {
      measure: 'height',
      prepare: root => root.traverse((object) => {
        if (object.name.startsWith('Plane')) object.visible = false
      }),
    }),
    loadModel(THREE, 'floppy.glb', 0.09).catch(() => undefined),
    loadModel(THREE, 'old_computer.glb', 0.5, { measure: 'height' }).catch(() => undefined),
    loadModel(THREE, 'monitor.glb', 0.4, { measure: 'height' }).catch(() => undefined),
  ])
  holder.position.y = 0.75
  holder.traverse((object) => {
    object.castShadow = object.receiveShadow = true
  })
  group.add(holder)
  for (const [extra, x, z, turn] of [[oldComputer, 1.25, -0.45, -0.3], [monitor, 1.75, -0.55, -0.6]] as const) {
    if (!extra) continue
    extra.holder.position.set(x, 0.75, z)
    extra.holder.rotation.y = turn
    // Switched-off machines: dim their bright plastic so the terminal stays the brightest thing in the room.
    extra.holder.traverse((object) => {
      object.castShadow = object.receiveShadow = true
      for (const material of meshMaterials(object)) {
        if ('color' in material && material.color instanceof THREE.Color) material.color.multiplyScalar(0.45)
        if (material instanceof THREE.MeshStandardMaterial) material.emissive.set('#000000')
      }
    })
    group.add(extra.holder)
  }
  if (floppy) {
    floppy.holder.position.set(0.55, 0.785, 0.32)
    floppy.holder.rotation.y = 0.6
    group.add(floppy.holder)
  }

  // Paint our text into the screen area of the terminal's own texture, so it sits exactly on the glass.
  let bodyMaterial: Three.MeshStandardMaterial | undefined
  model.traverse((object) => {
    for (const material of meshMaterials(object)) {
      if (material instanceof THREE.MeshStandardMaterial && material.name === 'TerminalMaterial') bodyMaterial = material
    }
  })
  const baseImage = bodyMaterial?.map?.image as CanvasImageSource & { width: number, height: number } | undefined
  const size = baseImage?.width ?? 1024
  const scale = size / 1024
  const colorCanvas = document.createElement('canvas')
  const glowCanvas = document.createElement('canvas')
  colorCanvas.width = colorCanvas.height = glowCanvas.width = glowCanvas.height = size
  const colorContext = colorCanvas.getContext('2d')!
  const glowContext = glowCanvas.getContext('2d')!
  const colorTexture = new THREE.CanvasTexture(colorCanvas)
  const glowTexture = new THREE.CanvasTexture(glowCanvas)
  for (const texture of [colorTexture, glowTexture]) {
    texture.flipY = false
    texture.colorSpace = THREE.SRGBColorSpace
  }
  if (bodyMaterial) {
    bodyMaterial.map = colorTexture
    bodyMaterial.emissiveMap = glowTexture
    bodyMaterial.emissive.set('#ffffff')
    bodyMaterial.emissiveIntensity = 1.4
    bodyMaterial.needsUpdate = true
  }

  const rect = { x: SCREEN_RECT.x * scale, y: SCREEN_RECT.y * scale, width: SCREEN_RECT.width * scale, height: SCREEN_RECT.height * scale }
  function drawScreen(context: CanvasRenderingContext2D, lines: string[], cursorOn: boolean) {
    context.save()
    // The screen is stored upside down in the atlas: flip our drawing inside that rectangle.
    context.translate(0, rect.y * 2 + rect.height)
    context.scale(1, -1)
    context.fillStyle = '#041006'
    context.fillRect(rect.x, rect.y, rect.width, rect.height)
    const fontSize = rect.height / 6.5
    context.font = `${fontSize}px VT323, ui-monospace, monospace`
    context.fillStyle = PHOSPHOR
    context.shadowColor = PHOSPHOR
    context.shadowBlur = fontSize / 3
    lines.forEach((line, index) => {
      const text = index === lines.length - 1 && cursorOn ? `${line}_` : line
      context.fillText(text, rect.x + rect.width * 0.06, rect.y + fontSize * 1.3 + index * fontSize * 1.2, rect.width * 0.9)
    })
    context.restore()
  }

  function setLines(lines: string[], cursorOn: boolean) {
    if (baseImage) colorContext.drawImage(baseImage, 0, 0, size, size)
    drawScreen(colorContext, lines, cursorOn)
    glowContext.fillStyle = '#000000'
    glowContext.fillRect(0, 0, size, size)
    drawScreen(glowContext, lines, cursorOn)
    colorTexture.needsUpdate = true
    glowTexture.needsUpdate = true
  }
  setLines([''], true)

  // The CRT sits high and left of centre on the front (the right holds the drive bay); measured in the browser, relative to the terminal bounds.
  const terminalBounds = new THREE.Box3().setFromObject(holder)
  const screenCenter = new THREE.Vector3(
    // 0.17 units left: the model is scaled to 1 unit wide, so this is 17% of the terminal.
    (terminalBounds.min.x + terminalBounds.max.x) / 2 - 0.17,
    terminalBounds.min.y + (terminalBounds.max.y - terminalBounds.min.y) * 0.72,
    terminalBounds.max.z,
  )

  // The screen lights the room green: the strongest light in here.
  const crtLight = new THREE.PointLight(PHOSPHOR, CRT_GLOW, 4, 1.6)
  crtLight.position.copy(screenCenter).add(new THREE.Vector3(0, 0, 0.35))
  group.add(crtLight)

  let surge = 0
  return {
    group,
    screenCenter,
    setLines,
    setSurge: (amount) => {
      surge = Math.max(0, Math.min(1, amount))
      if (bodyMaterial) bodyMaterial.emissiveIntensity = 1.4 + surge * 6
      lamp.intensity = LAMP_POWER * (1 - surge * 0.9)
      moon.intensity = WINDOW_POWER * (1 - surge * 0.7)
    },
    update: (seconds) => {
      // A CRT hums: a tiny uneven flicker, stronger while it pulls you in.
      const flicker = 1 + Math.sin(seconds * 37) * Math.sin(seconds * 11.3) * (0.06 + surge * 0.4)
      crtLight.intensity = CRT_GLOW * (1 + surge * 8) * flicker
      dust.rotation.y = Math.sin(seconds * 0.05) * 0.05
      dust.position.y = Math.sin(seconds * 0.2) * 0.03
    },
  }
}
