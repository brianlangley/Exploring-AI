import catalog from '~~/data/models.json'
import type { ModelCatalog } from '~/types/model'

// Components get model data only through here. A later live source only changes this file.
export function useModels() {
  const { models, verifiedOn, source } = catalog as ModelCatalog
  const localModels = models.filter(model => model.location === 'local')
  const cloudModels = models.filter(model => model.location === 'cloud')

  return { models, localModels, cloudModels, verifiedOn, source }
}
