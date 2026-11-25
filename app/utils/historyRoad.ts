import type * as Three from 'three'

type ThreeModule = typeof Three

export type RoadStation = 'plugboard' | 'oldComputers' | 'gpu' | 'cloud'

// Where each station stands along the road (local z, the road runs to -z).
export const STATION_Z: Record<RoadStation, number> = {
  plugboard: 0,
  oldComputers: -16,
  gpu: -30,
  cloud: -44,
}

export interface HistoryRoad {
  group: Three.Group
  stations: Record<RoadStation, Three.Group>
  update: (seconds: number) => void
}

// Period content for the old CRTs (PLAN-v3 9.2): an ELIZA style dialogue and chess moves, no LM Studio logo.
const ELIZA_LINES = ['> I AM SAD', 'WHY ARE YOU SAD?', '> MY COMPUTER', 'TELL ME MORE.']
const CHESS_LINES = ['1. e4    e5', '2. Nf3   Nc6', '3. Bb5   a6', 'DEEP BLUE THINKING']

// Steps 3 to 6: a dark void with a neon grid floor; history models stand along the road.
export async function buildHistoryRoad(THREE: ThreeModule): Promise<HistoryRoad> {
  const group = new THREE.Group()

  const grid = new THREE.GridHelper(120, 120, '#33ff66', '#15482a')
  grid.position.z = -30
  group.add(grid)
  group.add(new THREE.HemisphereLight('#cbbffd', '#020305', 0.7))
  const key = new THREE.DirectionalLight('#ffffff', 2.2)
  key.position.set(4, 8, 6)
  group.add(key)
  group.add(new THREE.AmbientLight('#ffffff', 0.5))

  const stations = {} as Record<RoadStation, Three.Group>
  for (const [name, z] of Object.entries(STATION_Z) as [RoadStation, number][]) {
    const station = new THREE.Group()
    station.position.z = z
    stations[name] = station
    group.add(station)
  }

  const [plugboard, oldComputers, rack, graphicsCard] = await Promise.all([
    loadModel(THREE, 'plugboard.glb', 1.6),
    loadModel(THREE, 'old-computers.glb', 10),
    loadModel(THREE, 'rack-server.glb', 2.2, { measure: 'height' }),
    loadModel(THREE, 'gpu.glb', 2.1).catch(() => undefined),
  ])

  // 1950: the plugboard lies flat in the file; stand it up on a plinth so the plugs face the camera.
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.6), new THREE.MeshStandardMaterial({ color: '#111418', roughness: 0.6 }))
  plinth.position.y = 0.45
  plugboard.holder.rotation.x = Math.PI / 2.6
  plugboard.holder.position.set(0, 0.95, -0.1)
  stations.plugboard.add(plinth, plugboard.holder)
  // A warm spot on the board, like a museum piece.
  const spot = new THREE.PointLight('#ffe3c2', 6, 6)
  spot.position.set(0.8, 2.4, 1.6)
  stations.plugboard.add(spot)

  // 1966–1997: the room of machines, its CRTs showing ELIZA and chess.
  const eliza = createTerminalTexture(THREE)
  const chess = createTerminalTexture(THREE)
  eliza.draw(ELIZA_LINES, true)
  chess.draw(CHESS_LINES, false)
  const elizaMaterial = new THREE.MeshBasicMaterial({ map: eliza.texture, toneMapped: false })
  const chessMaterial = new THREE.MeshBasicMaterial({ map: chess.texture, toneMapped: false })
  let screenIndex = 0
  oldComputers.model.traverse((object) => {
    const mesh = object as Three.Mesh
    if (!mesh.isMesh || !(mesh.material instanceof THREE.MeshStandardMaterial) || mesh.material.name !== 'Screen') return
    setFlatUvs(THREE, mesh.geometry)
    mesh.material = screenIndex % 2 === 0 ? elizaMaterial : chessMaterial
    screenIndex++
  })
  oldComputers.holder.position.z = -1
  stations.oldComputers.add(oldComputers.holder)

  // 2012: GPUs learn to see. The RTX 3080 model with its own fan animation, brand text painted out;
  // if it fails to load, a plain card built in code.
  let spinFans: (seconds: number) => void = () => {}
  if (graphicsCard) {
    removeGraphicsCardBranding(THREE, graphicsCard.model)
    graphicsCard.holder.name = 'graphics-card'
    // Standing on its edge, fan side turned to the camera (tuned in the browser).
    graphicsCard.holder.position.set(0.96, 1.31, -0.48)
    graphicsCard.holder.rotation.set(1.253, 0.15, 1.145)
    stations.gpu.add(graphicsCard.holder)
    const mixer = new THREE.AnimationMixer(graphicsCard.model)
    const clip = graphicsCard.animations.find(animation => animation.name.includes('1500')) ?? graphicsCard.animations[0]
    if (clip) mixer.clipAction(clip).play()
    let last = 0
    spinFans = (seconds) => {
      mixer.update(last ? seconds - last : 0)
      last = seconds
    }
  }
  else {
    const gpu = buildGraphicsCard(THREE)
    gpu.group.position.set(0, 0.8, 0)
    stations.gpu.add(gpu.group)
    spinFans = gpu.spin
  }

  // 2022: the cloud. A data centre: rows and rows of servers along aisles, fading into the dark.
  const RACKS_PER_ROW = 22
  const RACK_SPACING = 1.0
  // Pairs of rows face each other across an aisle; x of each row and which way its fronts face.
  const rows: [number, number][] = []
  for (const aisle of [-7.2, -3.6, 0, 3.6, 7.2]) rows.push([aisle - 1.3, Math.PI / 2], [aisle + 1.3, -Math.PI / 2])
  for (const [x, rotation] of rows) {
    for (let index = 0; index < RACKS_PER_ROW; index++) {
      const copy = rack.holder.clone()
      copy.position.set(x, 0, -index * RACK_SPACING)
      copy.rotation.y = rotation
      stations.cloud.add(copy)
    }
  }
  // Cold blue aisle light.
  const aisleLight = new THREE.PointLight('#5aa9ff', 14, 20)
  aisleLight.position.set(0, 3, -4)
  stations.cloud.add(aisleLight)

  function update(seconds: number) {
    spinFans(seconds)
  }

  return { group, stations, update }
}

function buildGraphicsCard(THREE: ThreeModule) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1.1), new THREE.MeshStandardMaterial({ color: '#2a2f38', metalness: 0.5, roughness: 0.45 }))
  group.add(body)
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color: '#8d6ff7' }))
  group.add(edges)
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.06, 1.2), new THREE.MeshStandardMaterial({ color: '#0f2a22' }))
  board.position.y = 0.28
  group.add(board)

  const fans: Three.Object3D[] = []
  for (const x of [-0.65, 0.65]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 48), new THREE.MeshBasicMaterial({ color: '#33ff66' }))
    ring.rotation.x = Math.PI / 2
    ring.position.set(x, -0.26, 0)
    const blades = new THREE.Group()
    for (let index = 0; index < 7; index++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.01, 0.1), new THREE.MeshStandardMaterial({ color: '#2a2f38' }))
      blade.position.x = 0.2
      const arm = new THREE.Group()
      arm.rotation.y = (index / 7) * Math.PI * 2
      arm.add(blade)
      blades.add(arm)
    }
    blades.position.set(x, -0.26, 0)
    group.add(ring, blades)
    fans.push(blades)
  }
  // Tilt so the fans (on the underside) face the camera.
  group.rotation.x = -1.1

  return {
    group,
    spin: (seconds: number) => {
      for (const fan of fans) fan.rotation.y = seconds * 6
    },
  }
}

// "RTX 3080" and "GEFORCE RTX" are printed in the card's texture atlas. Paint those spots in the colour around them
// (pixels in the 1024 px texture, measured on the file); the glow layer is switched off.
// color = the colour layer around the text, surface = the metal/roughness layer around it (the letters differ in both).
const BRAND_TEXT_SPOTS = [
  { x: 146, y: 138, width: 62, height: 200, color: '#1f1f1f', surface: '#ff2d00' },
  { x: 38, y: 478, width: 114, height: 30, color: '#000000', surface: '#076600' },
  { x: 278, y: 646, width: 42, height: 24, color: '#f5f6f6', surface: '#ff33ff' },
  { x: 552, y: 12, width: 40, height: 356, color: '#f5f6f6', surface: '#ff33ff' },
]

function removeGraphicsCardBranding(THREE: ThreeModule, model: Three.Object3D) {
  const done = new Set<Three.Texture>()
  model.traverse((object) => {
    for (const material of meshMaterials(object)) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue
      if (material.map && !done.has(material.map)) {
        material.map = paintOver(THREE, material.map)
        done.add(material.map)
      }
      // The glow layer only lights up the "GEFORCE RTX" lettering and two small accents: switch it off.
      material.emissiveMap = null
      material.emissive.set('#000000')
      // The shiny strip shows the letters through the metal/roughness layer: paint them out there too.
      for (const key of ['roughnessMap', 'metalnessMap', 'aoMap'] as const) {
        const texture = material[key]
        if (texture && !done.has(texture)) {
          const painted = paintOver(THREE, texture, 'surface')
          done.add(painted)
          for (const other of ['roughnessMap', 'metalnessMap', 'aoMap'] as const) {
            if (material[other] === texture) material[other] = painted
          }
        }
      }
      // The lettering is also embossed in the surface detail: flatten it there.
      if (material.normalMap && !done.has(material.normalMap)) {
        material.normalMap = paintOver(THREE, material.normalMap, '#8080ff')
        done.add(material.normalMap)
      }
      material.needsUpdate = true
    }
  })
}

// fill: one colour for every spot, 'surface' for each spot's metal/roughness colour, or nothing for its own colour.
function paintOver(THREE: ThreeModule, texture: Three.Texture, fill?: string) {
  const image = texture.image as CanvasImageSource & { width: number, height: number }
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')!
  context.drawImage(image, 0, 0)
  const scale = image.width / 1024
  for (const spot of BRAND_TEXT_SPOTS) {
    context.fillStyle = fill === 'surface' ? spot.surface : fill ?? spot.color
    context.fillRect(spot.x * scale, spot.y * scale, spot.width * scale, spot.height * scale)
  }
  const painted = new THREE.CanvasTexture(canvas)
  painted.flipY = texture.flipY
  painted.colorSpace = texture.colorSpace
  painted.wrapS = texture.wrapS
  painted.wrapT = texture.wrapT
  return painted
}
