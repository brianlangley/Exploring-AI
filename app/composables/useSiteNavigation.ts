export interface SiteSection {
  id: string
  label: string
}

const SECTION_IDS = ['what', 'device', 'models', 'download', 'costs', 'verdict', 'alternatives', 'sources'] as const

// One list for the header menu: section anchors on the long page (/lm-studio). The intro link sits in front of these.
export function useSiteNavigation() {
  const { messages } = useLocale()
  const sections = computed<SiteSection[]>(() => SECTION_IDS.map(id => ({ id, label: messages.value.nav[id] })))

  return { sections }
}
