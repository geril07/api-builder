import { memo } from 'react'
import type { ApiDesignResourceDto } from '@/modules/api-design/resources'
import { type Node, type NodeProps } from '@xyflow/react'
import { BaseFlowNode } from './base-flow-node'

type ResourceNodeData = {
  resource: ApiDesignResourceDto
  apiDesignId: string
}

type ResourceNodeType = Node<ResourceNodeData, 'resource'>

export const ResourceNode = memo(function ResourceNode({
  data,
  selected,
}: NodeProps<ResourceNodeType>) {
  return (
    <BaseFlowNode selected={selected}>
      <div className="flex items-start gap-2">
        <span className="text-left font-mono text-xs font-semibold break-all text-foreground">
          {data.resource.name}
        </span>
      </div>
      {data.resource.description ? (
        <p className="mt-1.5 text-[0.65rem] leading-4 text-muted-foreground">
          {data.resource.description}
        </p>
      ) : null}
    </BaseFlowNode>
  )
})
