import { memo } from 'react'
import { useTranslations } from 'next-intl'
import type { ApiDesignAuthSchemeDto } from '@/modules/api-design/auth-schemes'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

type AuthSchemeNodeData = {
  authScheme: ApiDesignAuthSchemeDto
  apiDesignId: string
}

type AuthSchemeNodeType = Node<AuthSchemeNodeData, 'authScheme'>

export const AuthSchemeNode = memo(function AuthSchemeNode({
  data,
  selected,
}: NodeProps<AuthSchemeNodeType>) {
  const t = useTranslations('Editor')

  return (
    <div
      className={`w-64 border bg-card p-3 shadow-lg transition-colors ${
        selected ? 'border-ring' : 'border-border'
      }`}
    >
      <Handle
        type="source"
        position={Position.Right}
        className="pointer-events-none! opacity-0!"
      />
      <Handle
        type="target"
        position={Position.Left}
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
        <div className="flex flex-col gap-1">
          <span className="text-left font-mono text-xs font-semibold break-all text-foreground">
            {data.authScheme.name}
          </span>
          <span className="font-mono text-[0.6rem] text-muted-foreground">
            {t('authTypeLabel', { type: data.authScheme.type })}
          </span>
        </div>
      </div>
    </div>
  )
})
