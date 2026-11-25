import type * as Three from 'three'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type ThreeModule = typeof Three

let loaderPromise: Promise<GLTFLoader> | undefined

// One loader for every model. Meshopt decoder for the compressed gaming PC (it ships with three, no extra package).
async function getLoader() {
  loaderPromise ??= (async () => {
    const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js'),
    ])
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    return loader
  })()
  return loaderPromise
}

export interface LoadedModel {
  // Wrapper: standing on y = 0, centred on x and z, scaled to the asked size.
  holder: Three.Group
  model: Three.Object3D
  animations: Three.AnimationClip[]
}

interface LoadOptions {
  measure?: 'largest' | 'height'
  // Runs before measuring, for example to hide a backdrop that came with the file.
  prepare?: (model: Three.Object3D) => void
}

// Loads a GLB from public/models and scales it so its largest side (or its height) is `size` units.
// Hidden parts don't count for the size.
export async function loadModel(THREE: ThreeModule, file: string, size: number, options: LoadOptions = {}): Promise<LoadedModel> {
  const loader = await getLoader()
  const gltf = await loader.loadAsync(`/models/${file}`)
  const model = gltf.scene
  options.prepare?.(model)
  model.updateMatrixWorld(true)

  const bounds = new THREE.Box3()
  model.traverseVisible((object) => {
    if ((object as Three.Mesh).isMesh) bounds.expandByObject(object)
  })
  const measure = options.measure ?? 'largest'
  const dimensions = bounds.getSize(new THREE.Vector3())
  const reference = measure === 'height' ? dimensions.y : Math.max(dimensions.x, dimensions.y, dimensions.z)
  const scale = size / Math.max(reference, 0.0001)
  const center = bounds.getCenter(new THREE.Vector3())
  model.position.set(-center.x, -bounds.min.y, -center.z)

  const holder = new THREE.Group()
  holder.add(model)
  holder.scale.setScalar(scale)
  return { holder, model, animations: gltf.animations }
}

// three.js renames nodes (spaces to "_", dots removed). Compare names the same way.
export function sameNodeName(THREE: ThreeModule, objectName: string, fileName: string) {
  return objectName === THREE.PropertyBinding.sanitizeNodeName(fileName)
}

export function meshMaterials(object: Three.Object3D) {
  const mesh = object as Three.Mesh
  if (!mesh.isMesh) return []
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
}
