import { memo } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { useTranslations } from 'next-intl'
import { GripVertical, Trash2 } from 'lucide-react'

import type { ApiDesignEndpointDto } from '@/modules/api-design/endpoints'
import { MethodBadge } from '@/modules/api-design/endpoints'
import { useEvent } from '@/shared/reactuse'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'

export type SortableEndpoint = Pick<
  ApiDesignEndpointDto,
  'id' | 'method' | 'path'
>

export const moveEndpoint = <T,>(
  list: T[],
  fromIndex: number,
  toIndex: number,
) => {
  const next = [...list]
  const [removed] = next.splice(fromIndex, 1)
  if (!removed) return next
  next.splice(toIndex, 0, removed)
  return next
}

type SortableEndpointRowProps = {
  endpoint: SortableEndpoint
  index: number
  resourceId: string
  dragDisabled: boolean
  onEndpointClick: (resourceId: string, endpointId: string) => void
  onDelete?: (endpointId: string) => Promise<void>
}

export const SortableEndpointRow = memo(function SortableEndpointRow({
  endpoint,
  index,
  resourceId,
  dragDisabled,
  onEndpointClick,
  onDelete,
}: SortableEndpointRowProps) {
  const t = useTranslations('Editor')
  const { handleRef, ref, isDragging } = useSortable({
    id: endpoint.id,
    index,
    disabled: dragDisabled,
  })

  const handleClick = useEvent(() => {
    onEndpointClick(resourceId, endpoint.id)
  })

  const handleKeyDown = useEvent((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onEndpointClick(resourceId, endpoint.id)
    }
  })

  const handleDelete = useEvent(async (e: React.MouseEvent) => {
    e.stopPropagation()
    await onDelete!(endpoint.id)
  })

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-1.5 px-1 py-1 text-left hover:bg-muted/50',
        isDragging && 'relative z-10 bg-muted/70 opacity-80',
      )}
    >
      <Button
        ref={handleRef}
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={t('reorderEndpoint')}
        disabled={dragDisabled}
        className="shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing disabled:cursor-default disabled:opacity-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-2.5" />
      </Button>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <MethodBadge method={endpoint.method} />
        <span className="min-w-0 truncate font-mono text-[0.65rem] text-foreground">
          {endpoint.path}
        </span>
      </span>
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t('deleteEndpoint')}
          className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:text-destructive focus-visible:opacity-100"
          onClick={handleDelete}
        >
          <Trash2 className="size-2.5" />
        </Button>
      ) : null}
    </div>
  )
})
