import { memo } from 'react'
import type { ApiDesignSchemaDto } from '@/modules/api-design/schemas'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

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
    <div
      className={`w-64 border bg-card p-3 shadow-lg transition-colors ${
        selected ? 'border-ring' : 'border-border'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="pointer-events-none! opacity-0!"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="pointer-events-none! opacity-0!"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="pointer-events-none! opacity-0!"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="pointer-events-none! opacity-0!"
      />
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
    </div>
  )
})
