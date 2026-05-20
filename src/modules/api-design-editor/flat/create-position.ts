export type PositionedEntity = {
  positionX: number
  positionY: number
}

const BASE_POSITIONS = {
  resource: { x: 120, y: 120 },
  schema: { x: 520, y: 120 },
  authScheme: { x: -280, y: 120 },
} as const

const STEP_Y = 120

export function getFlatCreatePosition(
  type: keyof typeof BASE_POSITIONS,
  existing: PositionedEntity[],
) {
  const base = BASE_POSITIONS[type]

  return {
    positionX: base.x,
    positionY: base.y + existing.length * STEP_Y,
  }
}
