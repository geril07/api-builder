import type { Edge } from '@xyflow/react'

export type ConnectionType = 'requestBody' | 'responseShape' | 'auth'

export type ResourceEdgeData = {
  types: ConnectionType[]
  endpoints: Array<{ method: string; path: string; summary: string | null }>
  pathOffset: number
}

type EndpointRef = {
  method: string
  path: string
  summary: string | null
}

type ComputeEdgesInput = {
  resources: { id: string }[]
  schemas: { id: string }[]
  authSchemes: { id: string }[]
  endpoints: Array<{
    resourceId: string
    requestBodySchemaId: string | null
    responseShapeSchemaId: string | null
    authSchemeIds: string[]
    method: string
    path: string
    summary: string | null
  }>
}

const EDGE_STYLE: Record<
  ConnectionType,
  { stroke: string; strokeDasharray?: string }
> = {
  requestBody: { stroke: '#3b82f6' },
  responseShape: { stroke: '#22c55e', strokeDasharray: '6 3' },
  auth: { stroke: '#f59e0b', strokeDasharray: '2 3' },
}

export function computeEdges(
  input: ComputeEdgesInput,
): Edge<ResourceEdgeData>[] {
  const schemaIds = new Set(input.schemas.map((s) => s.id))
  const authSchemeIds = new Set(input.authSchemes.map((a) => a.id))

  type EdgeSpec = {
    source: string
    target: string
    type: ConnectionType
    endpoints: EndpointRef[]
  }

  const specMap = new Map<string, EdgeSpec>()

  for (const ep of input.endpoints) {
    const ref: EndpointRef = {
      method: ep.method,
      path: ep.path,
      summary: ep.summary,
    }

    if (ep.requestBodySchemaId && schemaIds.has(ep.requestBodySchemaId)) {
      const k = `${ep.resourceId}->${ep.requestBodySchemaId}:requestBody`
      let s = specMap.get(k)
      if (!s) {
        s = {
          source: ep.resourceId,
          target: ep.requestBodySchemaId,
          type: 'requestBody',
          endpoints: [],
        }
        specMap.set(k, s)
      }
      if (
        !s.endpoints.some((e) => e.method === ep.method && e.path === ep.path)
      ) {
        s.endpoints.push(ref)
      }
    }

    if (ep.responseShapeSchemaId && schemaIds.has(ep.responseShapeSchemaId)) {
      const k = `${ep.resourceId}->${ep.responseShapeSchemaId}:responseShape`
      let s = specMap.get(k)
      if (!s) {
        s = {
          source: ep.resourceId,
          target: ep.responseShapeSchemaId,
          type: 'responseShape',
          endpoints: [],
        }
        specMap.set(k, s)
      }
      if (
        !s.endpoints.some((e) => e.method === ep.method && e.path === ep.path)
      ) {
        s.endpoints.push(ref)
      }
    }

    for (const schemeId of ep.authSchemeIds) {
      if (authSchemeIds.has(schemeId)) {
        const k = `${schemeId}->${ep.resourceId}:auth`
        let s = specMap.get(k)
        if (!s) {
          s = {
            source: schemeId,
            target: ep.resourceId,
            type: 'auth',
            endpoints: [],
          }
          specMap.set(k, s)
        }
        if (
          !s.endpoints.some((e) => e.method === ep.method && e.path === ep.path)
        ) {
          s.endpoints.push(ref)
        }
      }
    }
  }

  const pairMap = new Map<string, EdgeSpec[]>()
  for (const spec of specMap.values()) {
    const k = `${spec.source}->${spec.target}`
    const g = pairMap.get(k) ?? []
    g.push(spec)
    pairMap.set(k, g)
  }

  const edges: Edge<ResourceEdgeData>[] = []

  for (const group of pairMap.values()) {
    const n = group.length

    for (let i = 0; i < n; i++) {
      const spec = group[i]!

      edges.push({
        id: `${spec.source}->${spec.target}:${spec.type}`,
        source: spec.source,
        target: spec.target,
        type: 'resourceEdge',
        style: {
          ...EDGE_STYLE[spec.type],
          strokeWidth: 2,
        },
        data: {
          types: [spec.type],
          endpoints: spec.endpoints,
          pathOffset: n > 1 ? (i - (n - 1) / 2) * 20 : 0,
        },
      })
    }
  }

  return edges
}
