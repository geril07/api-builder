import { memo } from 'react'
import type { ApiDesignSchemaDto } from '@/modules/api-design/schemas'
import { type Node, type NodeProps } from '@xyflow/react'
import { BaseFlowNode } from './base-flow-node'

type SchemaNodeData = {
  schema: ApiDesignSchemaDto
  apiDesignId: string
}

type SchemaNodeType = Node<SchemaNodeData, 'schema'>

export const SchemaNode = memo(function SchemaNode({
  data,
  selected,
}: NodeProps<SchemaNodeType>) {
  return (
    <BaseFlowNode selected={selected}>
      <div className="flex items-start gap-2">
        <span className="text-left font-mono text-xs font-semibold break-all text-foreground">
          {data.schema.name}
        </span>
      </div>
      {data.schema.description ? (
        <p className="mt-1.5 text-[0.65rem] leading-4 text-muted-foreground">
          {data.schema.description}
        </p>
      ) : null}
    </BaseFlowNode>
  )
})
