import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { RestrictToElement } from '@dnd-kit/dom/modifiers'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui/select'
import { Label } from '@/shared/ui/label'
import { useToast } from '@/shared/ui/toast'
import { cn } from '@/shared/utils/cn'
import { getErrorMessage } from '@/shared/utils/error'

import { MethodBadge, VALID_METHODS } from '@/modules/api-design/endpoints'
import { GripVertical, Plus, Trash2 } from 'lucide-react'

import type { ApiDesignResourceDto } from '@/modules/api-design/resources'
import type { ApiDesignEndpointDto } from '@/modules/api-design/endpoints'
import {
  updateResourceMutationOptions,
  createEndpointMutationOptions,
  deleteEndpointMutationOptions,
  reorderEndpointsMutationOptions,
} from '../mutations'

export type ResourceViewProps = {
  apiDesignId: string
  resource: ApiDesignResourceDto
  endpoints: ApiDesignEndpointDto[]
  onEndpointClick: (resourceId: string, endpointId: string) => void
}

const moveEndpoint = (
  endpointList: ApiDesignEndpointDto[],
  fromIndex: number,
  toIndex: number,
) => {
  const next = [...endpointList]
  const [removed] = next.splice(fromIndex, 1)

  if (!removed) return next

  next.splice(toIndex, 0, removed)
  return next
}

export function ResourceView({
  apiDesignId,
  resource,
  endpoints,
  onEndpointClick,
}: ResourceViewProps) {
  const t = useTranslations('Editor')
  const updateResource = useMutation(updateResourceMutationOptions())
  const createEndpoint = useMutation(createEndpointMutationOptions())
  const deleteEndpoint = useMutation(deleteEndpointMutationOptions())
  const reorderEndpoints = useMutation(reorderEndpointsMutationOptions())
  const deleteEndpointAsync = deleteEndpoint.mutateAsync
  const reorderEndpoint = reorderEndpoints.mutate
  const isReorderPending = reorderEndpoints.isPending
  const toast = useToast()
  const [name, setName] = useState(resource.name)
  const [description, setDescription] = useState(resource.description ?? '')
  const [addingEndpoint, setAddingEndpoint] = useState(false)
  const [newMethod, setNewMethod] =
    useState<(typeof VALID_METHODS)[number]>('GET')
  const [newPath, setNewPath] = useState('/')
  const [endpointListElement, setEndpointListElement] =
    useState<HTMLDivElement | null>(null)
  const prevId = useRef(resource.id)
  const dragModifiers = useMemo(
    () => [
      RestrictToVerticalAxis,
      RestrictToElement.configure({
        element: endpointListElement,
      }),
    ],
    [endpointListElement],
  )

  useEffect(() => {
    if (prevId.current !== resource.id) {
      prevId.current = resource.id
      setName(resource.name)
      setDescription(resource.description ?? '')
      setAddingEndpoint(false)
      setNewMethod('GET')
      setNewPath('/')
    }
  }, [resource.id, resource.name, resource.description])

  const handleNameBlur = async () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== resource.name) {
      try {
        await updateResource.mutateAsync({
          resourceId: resource.id,
          apiDesignId,
          name: trimmed,
        })
      } catch (err) {
        toast.add({
          title: t('failedUpdateResource'),
          description: getErrorMessage(err),
          type: 'error',
        })
      }
    }
  }

  const handleDescriptionBlur = async () => {
    const trimmed = description.trim()
    if (trimmed !== (resource.description ?? '')) {
      try {
        await updateResource.mutateAsync({
          resourceId: resource.id,
          apiDesignId,
          description: trimmed || null,
        })
      } catch (err) {
        toast.add({
          title: t('failedUpdateResource'),
          description: getErrorMessage(err),
          type: 'error',
        })
      }
    }
  }

  const handleAddEndpoint = async () => {
    if (!newPath.trim()) return
    try {
      await createEndpoint.mutateAsync({
        resourceId: resource.id,
        apiDesignId,
        method: newMethod,
        path: newPath.trim(),
      })
    } catch (err) {
      toast.add({
        title: t('failedCreateEndpoint'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
    setAddingEndpoint(false)
    setNewMethod('GET')
    setNewPath('/')
  }

  const handleDeleteEndpoint = useCallback(
    async (endpointId: string) => {
      try {
        await deleteEndpointAsync({
          endpointId,
          apiDesignId,
        })
      } catch (err) {
        toast.add({
          title: t('failedDeleteEndpoint'),
          description: getErrorMessage(err),
          type: 'error',
        })
      }
    },
    [apiDesignId, deleteEndpointAsync, toast, t],
  )

  const handleEndpointDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled || isReorderPending) return

      const { source } = event.operation

      if (!isSortable(source) || source.initialIndex === source.index) return

      const orderedEndpoints = moveEndpoint(
        endpoints,
        source.initialIndex,
        source.index,
      )

      reorderEndpoint(
        {
          apiDesignId,
          resourceId: resource.id,
          endpointIds: orderedEndpoints.map((ep) => ep.id),
        },
        {
          onError: (err) => {
            toast.add({
              title: t('failedReorderEndpoints'),
              description: getErrorMessage(err),
              type: 'error',
            })
          },
        },
      )
    },
    [
      apiDesignId,
      endpoints,
      isReorderPending,
      reorderEndpoint,
      resource.id,
      toast,
      t,
    ],
  )

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="space-y-4 px-2 py-2">
        <div className="space-y-1.5">
          <Label>{t('name')}</Label>
          <Input
            size="sm"
            aria-label={t('resourceName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameBlur()
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('description')}</Label>
          <Textarea
            aria-label={t('resourceDescription')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            rows={3}
          />
        </div>
      </div>

      <div className="border-t border-border px-2 py-2">
        <h3 className="font-mono text-[0.6rem] font-semibold tracking-wider text-muted-foreground uppercase">
          {t('endpointsSection')}
        </h3>
      </div>

      <div className="px-2 pb-2">
        {endpoints.length === 0 ? (
          <p className="py-2 text-[0.65rem] text-muted-foreground">
            {t('noEndpointsYet')}
          </p>
        ) : (
          <DragDropProvider
            modifiers={dragModifiers}
            onDragEnd={handleEndpointDragEnd}
          >
            <div ref={setEndpointListElement} className="space-y-0.5">
              {endpoints.map((ep, index) => (
                <SortableEndpointRow
                  key={ep.id}
                  endpoint={ep}
                  index={index}
                  resourceId={resource.id}
                  dragDisabled={endpoints.length < 2 || isReorderPending}
                  onEndpointClick={onEndpointClick}
                  onDeleteEndpoint={handleDeleteEndpoint}
                />
              ))}
            </div>
          </DragDropProvider>
        )}
      </div>

      {addingEndpoint ? (
        <div className="space-y-1.5 border-t border-border/50 px-2 py-2">
          <div className="flex gap-1">
            <Select
              value={newMethod}
              onValueChange={(v) =>
                v != null && setNewMethod(v as (typeof VALID_METHODS)[number])
              }
            >
              <SelectTrigger size="sm" aria-label={t('httpMethod')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VALID_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              size="sm"
              autoFocus
              aria-label={t('newEndpointPath')}
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddEndpoint()
                if (e.key === 'Escape') {
                  setAddingEndpoint(false)
                  setNewMethod('GET')
                  setNewPath('/')
                }
              }}
              placeholder={t('pathPlaceholder')}
              className="min-w-0 flex-1"
            />
          </div>
          <div className="flex gap-1">
            <Button type="button" size="xs" onClick={handleAddEndpoint}>
              {t('add')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setAddingEndpoint(false)
                setNewMethod('GET')
                setNewPath('/')
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border/50 px-2 py-2">
          <Button
            variant="ghost-subtle"
            className="w-full justify-start"
            onClick={() => setAddingEndpoint(true)}
          >
            <Plus className="size-3" />
            {t('addEndpoint')}
          </Button>
        </div>
      )}
    </div>
  )
}

type SortableEndpointRowProps = {
  endpoint: ApiDesignEndpointDto
  index: number
  resourceId: string
  dragDisabled: boolean
  onEndpointClick: (resourceId: string, endpointId: string) => void
  onDeleteEndpoint: (endpointId: string) => Promise<void>
}

const SortableEndpointRow = memo(
  function SortableEndpointRow({
    endpoint,
    index,
    resourceId,
    dragDisabled,
    onEndpointClick,
    onDeleteEndpoint,
  }: SortableEndpointRowProps) {
    const t = useTranslations('Editor')
    const { handleRef, ref, isDragging } = useSortable({
      id: endpoint.id,
      index,
      disabled: dragDisabled,
    })

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={() => onEndpointClick(resourceId, endpoint.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onEndpointClick(resourceId, endpoint.id)
          }
        }}
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
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t('deleteEndpoint')}
          className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:text-destructive focus-visible:opacity-100"
          onClick={async (e) => {
            e.stopPropagation()
            await onDeleteEndpoint(endpoint.id)
          }}
        >
          <Trash2 className="size-2.5" />
        </Button>
      </div>
    )
  },
  (prev, next) =>
    prev.endpoint.id === next.endpoint.id &&
    prev.endpoint.method === next.endpoint.method &&
    prev.endpoint.path === next.endpoint.path &&
    prev.index === next.index &&
    prev.resourceId === next.resourceId &&
    prev.dragDisabled === next.dragDisabled,
)
