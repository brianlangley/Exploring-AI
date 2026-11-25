// The presentation route (PLAN-v3 section 1 + 9): one step = one screen, like slides.
// World = which 3D place the camera is in; moving between worlds fades through black (or dives into the terminal).
export type StageWorld = 'room' | 'road' | 'desk'

export type StepId
  = | 'intro'
    | 'y1950'
    | 'y1966'
    | 'y2012'
    | 'y2022'
    | 'y2026'
    | 'what'
    | 'device'
    | 'models'
    | 'demo'
    | 'costs'
    | 'verdict'
    | 'alternatives'
    | 'further'
    | 'end'

// Panel: what HTML shows next to the 3D. caption = short history card, section = full content panel,
// screen = the mock computer on the 3D monitor, none = only the 3D.
export type StepPanel = 'none' | 'caption' | 'section' | 'screen'

export interface CameraPose {
  position: [number, number, number]
  target: [number, number, number]
}

export interface PresentationStep {
  id: StepId
  // Used in the URL: /#jouw-computer
  slug: string
  world: StageWorld
  panel: StepPanel
  camera: CameraPose
}

// World origins: far apart, so each world can have its own darkness and lights.
export const WORLD_ORIGINS: Record<StageWorld, [number, number, number]> = {
  room: [0, 0, 0],
  road: [80, 0, 0],
  desk: [160, 0, 0],
}

function at(world: StageWorld, position: [number, number, number], target: [number, number, number]): CameraPose {
  const [x, y, z] = WORLD_ORIGINS[world]
  return {
    position: [position[0] + x, position[1] + y, position[2] + z],
    target: [target[0] + x, target[1] + y, target[2] + z],
  }
}

export const PRESENTATION_STEPS: PresentationStep[] = [
  { id: 'intro', slug: 'intro', world: 'room', panel: 'none', camera: at('room', [0.9, 1.7, 2.6], [0, 1.25, 0]) },
  { id: 'y1950', slug: '1950', world: 'road', panel: 'caption', camera: at('road', [2.2, 2.0, 4.4], [0, 1.1, 0]) },
  { id: 'y1966', slug: '1966-1997', world: 'road', panel: 'caption', camera: at('road', [1.5, 3.0, -9.5], [0, 1.3, -17]) },
  { id: 'y2012', slug: '2012', world: 'road', panel: 'caption', camera: at('road', [2.6, 2.4, -25.6], [0, 1.3, -30]) },
  { id: 'y2022', slug: '2022', world: 'road', panel: 'caption', camera: at('road', [1.8, 4.2, -37], [0, 0.6, -58]) },
  { id: 'y2026', slug: '2026', world: 'desk', panel: 'caption', camera: at('desk', [7, 4.5, 6], [0, 1.8, 0]) },
  { id: 'what', slug: 'wat-is-het', world: 'desk', panel: 'section', camera: at('desk', [3.6, 3.0, 3.2], [-0.2, 1.8, 0.4]) },
  { id: 'device', slug: 'jouw-computer', world: 'desk', panel: 'section', camera: at('desk', [2.6, 2.5, 0.4], [-0.1, 1.9, -2.1]) },
  { id: 'models', slug: 'modellen', world: 'desk', panel: 'section', camera: at('desk', [3.0, 2.5, 1.8], [-0.3, 2.1, 0.6]) },
  { id: 'demo', slug: 'demo', world: 'desk', panel: 'screen', camera: at('desk', [3.0, 2.08, 0.6], [-0.3, 2.08, 0.6]) },
  { id: 'costs', slug: 'kosten', world: 'desk', panel: 'section', camera: at('desk', [7, 5, 5], [0, 1.6, 0]) },
  { id: 'verdict', slug: 'oordeel', world: 'desk', panel: 'section', camera: at('desk', [6, 4, -5], [0, 1.6, -0.5]) },
  { id: 'alternatives', slug: 'alternatieven', world: 'desk', panel: 'section', camera: at('desk', [8, 6, 1], [0, 1.4, 0]) },
  { id: 'further', slug: 'verder', world: 'desk', panel: 'section', camera: at('desk', [11, 4.4, 7.5], [4.2, 1.1, 0.2]) },
  { id: 'end', slug: 'einde', world: 'room', panel: 'none', camera: at('room', [0.9, 1.7, 2.6], [0, 1.25, 0]) },
]
