import { memo } from 'react'
import { useTranslations } from 'next-intl'
import type { ApiDesignAuthSchemeDto } from '@/modules/api-design/auth-schemes'
import { type Node, type NodeProps } from '@xyflow/react'
import { BaseFlowNode } from './base-flow-node'

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
    <BaseFlowNode selected={selected}>
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
    </BaseFlowNode>
  )
})
