// Shape of data/models.json. Checked by hand against lmstudio.ai/models, see verifiedOn.
export type ModelTier = '8GB' | '16GB' | '32GB' | '64GB+' | 'cloud'
export type ModelCapability = 'vision' | 'tools' | 'reasoning' | 'coding'

export interface Model {
  id: string
  name: string
  publisher: string
  params: string
  downloadGB: number | null
  minMemoryGB: number | null
  tier: ModelTier
  license: string | null
  capabilities: ModelCapability[]
  context: string | null
  url: string
  location: 'local' | 'cloud'
}

export interface ModelCatalog {
  verifiedOn: string
  source: string
  notes: string
  models: Model[]
}

export type GpuKind = 'none' | 'dedicated' | 'apple'

export interface DeviceSpecs {
  ramGB: number
  gpu: GpuKind
  vramGB: number
}

export type FitResult = 'runs-well' | 'runs-slower' | 'too-big' | 'unknown'
