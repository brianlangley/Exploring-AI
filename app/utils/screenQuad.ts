import type * as Three from 'three'

type ThreeModule = typeof Three
export type Point = [number, number]
// The simulated computer is designed at this size, then warped onto the monitor.
export const MOCK_WIDTH = 1280
export const MOCK_HEIGHT = 704

// The four corners of a flat screen mesh, in world space (order not defined): the vertices farthest into each corner
// of the panel, so a monitor tilted back gives a true trapezoid instead of a box around it.
export function findPanelCorners(THREE: ThreeModule, mesh: Three.Mesh): Three.Vector3[] {
  const positions = mesh.geometry.getAttribute('position')
  const normals = mesh.geometry.getAttribute('normal')
  const normal = new THREE.Vector3()
  const vector = new THREE.Vector3()
  for (let index = 0; index < normals.count; index++) normal.add(vector.fromBufferAttribute(normals, index))
  normal.normalize()
  const up = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0)
  const right = up.clone().cross(normal).normalize()
  const screenUp = new THREE.Vector3().crossVectors(normal, right)

  mesh.updateWorldMatrix(true, false)
  return [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => {
    let best = 0
    let bestScore = -Infinity
    for (let index = 0; index < positions.count; index++) {
      vector.fromBufferAttribute(positions, index)
      const score = sx! * vector.dot(right) + sy! * vector.dot(screenUp)
      if (score > bestScore) {
        bestScore = score
        best = index
      }
    }
    return vector.fromBufferAttribute(positions, best).clone().applyMatrix4(mesh.matrixWorld)
  })
}

// Order four page points as top-left, top-right, bottom-right, bottom-left.
export function sortQuad(points: Point[]): Point[] {
  const [first, second, third, fourth] = [...points].sort((a, b) => a[1] - b[1])
  const [topLeft, topRight] = [first!, second!].sort((a, b) => a[0] - b[0])
  const [bottomLeft, bottomRight] = [third!, fourth!].sort((a, b) => a[0] - b[0])
  return [topLeft!, topRight!, bottomRight!, bottomLeft!]
}

// CSS matrix3d that maps a width x height box (origin top-left) onto the quad: the flat mock screen gets the monitor's perspective.
export function quadToMatrix3d(width: number, height: number, quad: Point[]): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad as [Point, Point, Point, Point]
  const dx1 = x1 - x2
  const dx2 = x3 - x2
  const dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2
  const dy2 = y3 - y2
  const dy3 = y0 - y1 + y2 - y3
  const det = dx1 * dy2 - dx2 * dy1 || 1
  const g = (dx3 * dy2 - dx2 * dy3) / det
  const h = (dx1 * dy3 - dx3 * dy1) / det
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + h * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + h * y3
  // Unit square to quad above; scale it so the input is in pixels of the box.
  return `matrix3d(${a / width},${d / width},0,${g / width},${b / height},${e / height},0,${h / height},0,0,1,0,${x0},${y0},0,1)`
}
