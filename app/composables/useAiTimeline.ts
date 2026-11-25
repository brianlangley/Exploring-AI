import timeline from '~~/data/timeline.json'

interface MilestoneData {
  year: string
  yearNl: string
  event: string
  eventNl: string
  source: string
}

export interface Milestone {
  year: string
  event: string
  source: string
}

// The terminal intro and the sources list both read the timeline from here, in the chosen language.
export function useAiTimeline() {
  const { locale } = useLocale()
  const milestones = computed<Milestone[]>(() => (timeline.milestones as MilestoneData[]).map(milestone => ({
    year: locale.value === 'nl' ? milestone.yearNl : milestone.year,
    event: locale.value === 'nl' ? milestone.eventNl : milestone.event,
    source: milestone.source,
  })))
  return { milestones }
}
