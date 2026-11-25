import type * as Three from 'three'

type ThreeModule = typeof Three

const PHOSPHOR = '#33ff66'
const SCREEN_DARK = '#050805'

export interface TerminalTexture {
  texture: Three.CanvasTexture
  // Redraws the lines; the last line gets a blinking cursor when `cursorOn`.
  draw: (lines: string[], cursorOn?: boolean) => void
}

// Green phosphor text on a dark screen, drawn on a canvas. Used on the old CRTs and the start terminal.
export function createTerminalTexture(THREE: ThreeModule, width = 1024, height = 768): TerminalTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  function draw(lines: string[], cursorOn = false) {
    context.fillStyle = SCREEN_DARK
    context.fillRect(0, 0, width, height)
    const fontSize = Math.round(height / 9)
    context.font = `${fontSize}px VT323, ui-monospace, monospace`
    context.fillStyle = PHOSPHOR
    context.shadowColor = PHOSPHOR
    context.shadowBlur = fontSize / 4
    lines.forEach((line, index) => {
      const isLast = index === lines.length - 1
      context.fillText(isLast && cursorOn ? `${line}_` : line, width * 0.07, height * 0.2 + index * fontSize * 1.25)
    })
    // Scanlines.
    context.shadowBlur = 0
    context.fillStyle = 'rgb(0 0 0 / 0.22)'
    for (let y = 0; y < height; y += 4) context.fillRect(0, y, width, 2)
    texture.needsUpdate = true
  }

  return { texture, draw }
}

// Official LM Studio logo file (unchanged) centred on a dark screen. Only on the 2026 PC: LM Studio launched in 2023.
export async function createLogoTexture(THREE: ThreeModule, width = 1600, height = 900) {
  const image = new Image()
  image.src = encodeURI('/brand/LM Studio Logo Color White.png')
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  context.fillStyle = '#0b1117'
  context.fillRect(0, 0, width, height)
  const logoWidth = width * 0.6
  const logoHeight = logoWidth * (image.height / image.width)
  context.drawImage(image, (width - logoWidth) / 2, (height - logoHeight) / 2, logoWidth, logoHeight)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// Model files often point their screen UVs into a shared texture atlas. Replace them with 0 to 1 across the screen,
// seen from the front: project each point on the screen's own right and up directions.
export function setFlatUvs(THREE: ThreeModule, geometry: Three.BufferGeometry, flipX = false) {
  const positions = geometry.getAttribute('position')
  const normals = geometry.getAttribute('normal')
  const normal = new THREE.Vector3()
  const vector = new THREE.Vector3()
  for (let index = 0; index < normals.count; index++) normal.add(vector.fromBufferAttribute(normals, index))
  normal.normalize()
  const up = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0)
  const right = up.clone().cross(normal).normalize()
  const screenUp = new THREE.Vector3().crossVectors(normal, right)

  const projected: [number, number][] = []
  for (let index = 0; index < positions.count; index++) {
    vector.fromBufferAttribute(positions, index)
    projected.push([vector.dot(right), vector.dot(screenUp)])
  }
  const xs = projected.map(([x]) => x)
  const ys = projected.map(([, y]) => y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const spanX = Math.max(...xs) - minX || 1
  const spanY = Math.max(...ys) - minY || 1
  const uvs = new Float32Array(positions.count * 2)
  projected.forEach(([x, y], index) => {
    const u = (x - minX) / spanX
    uvs[index * 2] = flipX ? 1 - u : u
    uvs[index * 2 + 1] = (y - minY) / spanY
  })
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
}
