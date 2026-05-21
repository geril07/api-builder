import type { ReactNode } from 'react'
import { Handle, Position } from '@xyflow/react'
import { cn } from '@/shared/utils/cn'

export function BaseFlowNode({
  selected,
  children,
}: {
  selected: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'w-64 border bg-card p-3 shadow-lg transition-colors',
        selected ? 'border-ring' : 'border-border',
      )}
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
      {children}
    </div>
  )
}
