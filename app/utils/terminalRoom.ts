import type * as Three from 'three'

type ThreeModule = typeof Three

// Screen area inside the terminal's texture atlas (pixels in the 1024 px texture, measured on the file).
const SCREEN_RECT = { x: 552, y: 308, width: 273, height: 185 }
const PHOSPHOR = '#33ff66'

export interface TerminalRoom {
  group: Three.Group
  // World position of the middle of the screen: the camera dives into it.
  screenCenter: Three.Vector3
  setLines: (lines: string[], cursorOn: boolean) => void
}

// Step 1 and the end: one 80s terminal on a small desk, one lamp, everything else dark.
export async function buildTerminalRoom(THREE: ThreeModule): Promise<TerminalRoom> {
  const group = new THREE.Group()

  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 1.0), new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.85 }))
  desk.position.y = 0.72
  group.add(desk)
  for (const [x, z] of [[-0.85, -0.45], [0.85, -0.45], [-0.85, 0.45], [0.85, 0.45]] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.05), new THREE.MeshStandardMaterial({ color: '#3a3f47' }))
    leg.position.set(x, 0.36, z)
    group.add(leg)
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: '#07090c', roughness: 1 }))
  floor.rotation.x = -Math.PI / 2
  group.add(floor)

  const lamp = new THREE.SpotLight('#ffe3c2', 18, 8, 0.55, 0.6, 1.5)
  lamp.position.set(-0.6, 3.2, 1.2)
  lamp.target = desk
  group.add(lamp)
  group.add(new THREE.AmbientLight('#2a3550', 0.25))

  // Terminal model: hide the backdrop and shadow planes that came with the file.
  const { holder, model } = await loadModel(THREE, 'terminal.glb', 1.0, {
    measure: 'height',
    prepare: root => root.traverse((object) => {
      if (object.name.startsWith('Plane')) object.visible = false
    }),
  })
  holder.position.y = 0.75
  group.add(holder)

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

  // Screen sits high on the front of the terminal; measured in the browser, relative to the terminal bounds.
  const terminalBounds = new THREE.Box3().setFromObject(holder)
  const screenCenter = new THREE.Vector3(
    (terminalBounds.min.x + terminalBounds.max.x) / 2,
    terminalBounds.min.y + (terminalBounds.max.y - terminalBounds.min.y) * 0.72,
    terminalBounds.max.z,
  )

  return { group, screenCenter, setLines }
}
