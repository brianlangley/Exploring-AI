import type { DeviceSpecs, GpuKind } from '~/types/model'

export type OperatingSystem = 'windows' | 'mac' | 'linux' | 'other'

export const RAM_STEPS = [8, 16, 24, 32, 48, 64, 96, 128]

// What detection found, as data: the panel turns it into text in the chosen language.
export type DeviceNote
  = | { kind: 'ramReported', value: number }
    | { kind: 'ramUnknown' }
    | { kind: 'apple' }
    | { kind: 'dedicated' }
    | { kind: 'threads', value: number }

// Not in the TypeScript DOM types: Chromium only.
interface NavigatorHints {
  deviceMemory?: number
  userAgentData?: {
    getHighEntropyValues: (hints: string[]) => Promise<{ platform?: string, architecture?: string }>
  }
}

// Shared between the device check panel and the 3D desk (RAM and GPU glow).
// Starts at a typical student laptop; detect() only replaces it with what the browser tells us.
export function useDevice() {
  const specs = useState<DeviceSpecs>('device-specs', () => ({ ramGB: 16, gpu: 'none', vramGB: 8 }))
  const operatingSystem = useState<OperatingSystem>('device-os', () => 'other')
  const detectedNotes = useState<DeviceNote[]>('device-notes', () => [])
  const hasDetected = useState('device-detected', () => false)

  async function detect() {
    if (hasDetected.value) return
    hasDetected.value = true
    const notes: DeviceNote[] = []
    const hints = navigator as Navigator & NavigatorHints

    let platform = ''
    let architecture = ''
    try {
      const values = await hints.userAgentData?.getHighEntropyValues(['platform', 'architecture'])
      platform = values?.platform ?? ''
      architecture = values?.architecture ?? ''
    }
    catch {
      // Not allowed or not supported: fall back to the user agent string below.
    }
    operatingSystem.value = detectOperatingSystem(platform || navigator.userAgent)

    if (hints.deviceMemory) {
      // The browser rounds and caps this value, so it is a lower bound at best.
      specs.value.ramGB = closestRamStep(hints.deviceMemory)
      notes.push({ kind: 'ramReported', value: hints.deviceMemory })
    }
    else {
      notes.push({ kind: 'ramUnknown' })
    }

    const gpu = detectGpu(operatingSystem.value, architecture)
    if (gpu) {
      specs.value.gpu = gpu
      notes.push({ kind: gpu === 'apple' ? 'apple' : 'dedicated' })
    }

    notes.push({ kind: 'threads', value: navigator.hardwareConcurrency })
    detectedNotes.value = notes
  }

  return { specs, operatingSystem, detectedNotes, detect }
}

function detectOperatingSystem(value: string): OperatingSystem {
  const text = value.toLowerCase()
  if (text.includes('win')) return 'windows'
  if (text.includes('mac')) return 'mac'
  if (text.includes('linux') || text.includes('x11')) return 'linux'
  return 'other'
}

function closestRamStep(gigabytes: number) {
  return RAM_STEPS.find(step => step >= gigabytes) ?? RAM_STEPS.at(-1)!
}

// Vague by design in most browsers; only a starting guess.
function detectGpu(operatingSystem: OperatingSystem, architecture: string): GpuKind | null {
  if (operatingSystem === 'mac' && architecture === 'arm') return 'apple'
  const renderer = readWebglRenderer().toLowerCase()
  if (operatingSystem === 'mac' && renderer.includes('apple')) return 'apple'
  if (/nvidia|geforce|rtx|radeon rx/.test(renderer)) return 'dedicated'
  return null
}

function readWebglRenderer() {
  try {
    const context = document.createElement('canvas').getContext('webgl')
    const extension = context?.getExtension('WEBGL_debug_renderer_info')
    if (!context || !extension) return ''
    return String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL) ?? '')
  }
  catch {
    return ''
  }
}
