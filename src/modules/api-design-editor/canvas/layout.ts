import dagre from 'dagre'

type LayoutEntity = { id: string; name: string }

type LayoutEndpoint = {
  resourceId: string
  requestBodySchemaId: string | null
  responseShapeSchemaId: string | null
  authSchemeIds: string[]
}

export type LayoutInput = {
  resources: LayoutEntity[]
  schemas: LayoutEntity[]
  authSchemes: LayoutEntity[]
  endpoints: LayoutEndpoint[]
}

export type LayoutOutput = {
  resources: { id: string; positionX: number; positionY: number }[]
  schemas: { id: string; positionX: number; positionY: number }[]
  authSchemes: { id: string; positionX: number; positionY: number }[]
}

const NODE_WIDTH = 256
const NODE_HEIGHT = 80
const HALF_HEIGHT = NODE_HEIGHT / 2
const HALF_WIDTH = NODE_WIDTH / 2

export function computeAutoLayout(input: LayoutInput): LayoutOutput {
  if (
    input.resources.length === 0 &&
    input.schemas.length === 0 &&
    input.authSchemes.length === 0
  ) {
    return { resources: [], schemas: [], authSchemes: [] }
  }

  const schemaIds = new Set(input.schemas.map((s) => s.id))
  const authSchemeIds = new Set(input.authSchemes.map((a) => a.id))

  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 150,
    marginx: 50,
    marginy: 50,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const r of input.resources) {
    g.setNode(r.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const s of input.schemas) {
    g.setNode(s.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const a of input.authSchemes) {
    g.setNode(a.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  for (const ep of input.endpoints) {
    if (ep.requestBodySchemaId && schemaIds.has(ep.requestBodySchemaId)) {
      g.setEdge(ep.resourceId, ep.requestBodySchemaId, {})
    }
    if (ep.responseShapeSchemaId && schemaIds.has(ep.responseShapeSchemaId)) {
      g.setEdge(ep.resourceId, ep.responseShapeSchemaId, {})
    }
    for (const schemeId of ep.authSchemeIds) {
      if (authSchemeIds.has(schemeId)) {
        g.setEdge(schemeId, ep.resourceId, {})
      }
    }
  }

  dagre.layout(g)

  const dagrePositions = new Map<string, dagre.Node>()
  for (const id of g.nodes()) {
    dagrePositions.set(id, g.node(id))
  }

  const connectedIds = new Set<string>()
  for (const ep of input.endpoints) {
    connectedIds.add(ep.resourceId)
    if (ep.requestBodySchemaId && schemaIds.has(ep.requestBodySchemaId)) {
      connectedIds.add(ep.requestBodySchemaId)
    }
    if (ep.responseShapeSchemaId && schemaIds.has(ep.responseShapeSchemaId)) {
      connectedIds.add(ep.responseShapeSchemaId)
    }
    for (const schemeId of ep.authSchemeIds) {
      if (authSchemeIds.has(schemeId)) {
        connectedIds.add(schemeId)
      }
    }
  }

  function medianOf(positions: number[], fallback: number): number {
    if (positions.length === 0) return fallback
    const sorted = [...positions].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    if (sorted.length % 2 === 1) return sorted[mid]!
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
  }

  function assignPositions<T extends { id: string; name: string }>(
    entities: T[],
    defaultX: number,
    getDagrePos: (id: string) => dagre.Node | undefined,
  ) {
    const fromDagre: { id: string; x: number; y: number }[] = []
    const unconnected: T[] = []

    for (const entity of entities) {
      const pos = getDagrePos(entity.id)
      if (pos && connectedIds.has(entity.id)) {
        fromDagre.push({
          id: entity.id,
          x: Math.round(pos.x - HALF_WIDTH),
          y: Math.round(pos.y - HALF_HEIGHT),
        })
      } else {
        unconnected.push(entity)
      }
    }

    fromDagre.sort((a, b) => a.y - b.y)

    let cursorY = -Infinity
    for (const item of fromDagre) {
      if (item.y <= cursorY + NODE_HEIGHT) {
        item.y = cursorY + NODE_HEIGHT + 40
      }
      cursorY = item.y
    }

    unconnected.sort((a, b) => a.name.localeCompare(b.name))

    const medianX = medianOf(
      fromDagre.map((e) => e.x),
      defaultX,
    )

    const baseY =
      fromDagre.length > 0
        ? Math.max(...fromDagre.map((e) => e.y)) + NODE_HEIGHT + 40
        : 50

    return [
      ...fromDagre.map((e) => ({
        id: e.id,
        positionX: Math.max(0, e.x),
        positionY: Math.max(0, e.y),
      })),
      ...unconnected.map((e, i) => ({
        id: e.id,
        positionX: Math.max(0, medianX),
        positionY: Math.max(0, baseY + i * (NODE_HEIGHT + 40)),
      })),
    ]
  }

  const resources = assignPositions(input.resources, 200, (id) =>
    dagrePositions.get(id),
  )

  const schemas = assignPositions(input.schemas, 500, (id) =>
    dagrePositions.get(id),
  )

  const authSchemes = assignPositions(input.authSchemes, 800, (id) =>
    dagrePositions.get(id),
  )

  return { resources, schemas, authSchemes }
}
