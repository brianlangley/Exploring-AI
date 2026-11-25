import type { DeviceSpecs, FitResult, Model } from '~/types/model'

// Estimate only, rules from PLAN.md section 5.
const CONTEXT_OVERHEAD_GB = 1.5
const APPLE_USABLE_SHARE = 0.7
const RAM_USABLE_SHARE = 0.6

// Memory a model needs once loaded: the file plus room for context. The model page minimum wins when it is higher.
export function neededMemoryGB(model: Model): number | null {
  if (model.downloadGB === null) return model.minMemoryGB
  return Math.max(model.downloadGB + CONTEXT_OVERHEAD_GB, model.minMemoryGB ?? 0)
}

export function fitModel(model: Model, device: DeviceSpecs): FitResult {
  const needed = neededMemoryGB(model)
  if (needed === null) return 'unknown'

  if (device.gpu === 'apple') {
    // One shared memory pool: fits fully on the GPU or not at all.
    return needed <= device.ramGB * APPLE_USABLE_SHARE ? 'runs-well' : 'too-big'
  }

  const usableRam = device.ramGB * RAM_USABLE_SHARE
  if (device.gpu === 'dedicated') {
    if (needed <= device.vramGB) return 'runs-well'
    // Part on the GPU, the rest in system memory: works, but slower.
    return needed <= device.vramGB + usableRam ? 'runs-slower' : 'too-big'
  }

  return needed <= usableRam ? 'runs-slower' : 'too-big'
}
