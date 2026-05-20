import type { EdgeTypes } from '@xyflow/react'
import { ResourceEdge } from './resource-edge'

export { computeEdges } from './compute-edges'
export type { ResourceEdgeData, ConnectionType } from './compute-edges'

export const edgeTypes: EdgeTypes = {
  resourceEdge: ResourceEdge,
}
