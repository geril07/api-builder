import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'

import { VALID_METHODS } from '@/modules/api-design/endpoints'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui/select'
import { useToast } from '@/shared/ui/toast'
import { cn } from '@/shared/utils/cn'
import { getErrorMessage } from '@/shared/utils/error'
import {
  apiDesignQueryOptions,
  selectApiDesignSidebarData,
  type ApiDesignSidebarData,
} from '../queries'
import type { FlatTab } from '../mode'
import type { useEditorSelection } from '../selection'
import {
  createAuthSchemeMutationOptions,
  createEndpointMutationOptions,
  createResourceMutationOptions,
  createSchemaMutationOptions,
  reorderEndpointsMutationOptions,
} from '../mutations'
import {
  EditorPanelHeader,
  resolveEditorPanelState,
  useEditorDelete,
} from '../sidebar/editor-panel'
import { ExportDialog } from '../panels/export-dialog'
import { AiDialog } from '../panels/ai-dialog'
import {
  buildFlatUsage,
  buildResourcesWithEndpoints,
  type FlatUsageReference,
} from './data'
import { getFlatCreatePosition } from './create-position'
import {
  SortableEndpointRow,
  moveEndpoint,
} from '../sidebar/sortable-endpoint-row'

type FlatEditorProps = {
  apiDesignId: string
  activeTab: FlatTab
  onTabChange: (tab: FlatTab) => void
  selection: ReturnType<typeof useEditorSelection>
  modeControl: React.ReactNode
}

export function FlatEditor({
  apiDesignId,
  activeTab,
  onTabChange,
  selection,
  modeControl,
}: FlatEditorProps) {
  const t = useTranslations('Editor')
  const { data, isPending } = useQuery({
    ...apiDesignQueryOptions(apiDesignId),
    select: selectApiDesignSidebarData,
  })

  const [expanded, setExpanded] = useState(() => new Set<string>())

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  if (isPending) return <LoadingSkeleton />

  if (!data) return null

  const panelState = resolveEditorPanelState({
    apiDesignId,
    data,
    selection,
    onEndpointClick: selection.selectEndpoint,
    onSchemaClick: selection.selectSchema,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {modeControl}
          <div className="flex border border-border bg-card p-0.5">
            <TabButton
              active={activeTab === 'resources'}
              onClick={() => onTabChange('resources')}
            >
              {t('resources')}
            </TabButton>
            <TabButton
              active={activeTab === 'schemas'}
              onClick={() => onTabChange('schemas')}
            >
              {t('schemas')}
            </TabButton>
            <TabButton
              active={activeTab === 'auth-schemes'}
              onClick={() => onTabChange('auth-schemes')}
            >
              {t('authSchemes')}
            </TabButton>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ExportDialog apiDesignId={apiDesignId} />
          <AiDialog apiDesignId={apiDesignId} />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_24rem]">
        <div
          className={cn(
            'min-h-0 overflow-y-auto border-r border-border p-4',
            panelState && 'hidden md:block',
          )}
        >
          {activeTab === 'resources' ? (
            <ResourcesTab
              apiDesignId={apiDesignId}
              data={data}
              selection={selection}
              expanded={expanded}
              onToggleExpanded={toggleExpanded}
            />
          ) : activeTab === 'schemas' ? (
            <SchemasTab
              apiDesignId={apiDesignId}
              data={data}
              selection={selection}
            />
          ) : (
            <AuthSchemesTab
              apiDesignId={apiDesignId}
              data={data}
              selection={selection}
            />
          )}
        </div>

        <div className={cn('min-h-0', !panelState && 'hidden md:block')}>
          {panelState ? (
            <FlatDetailPanel
              apiDesignId={apiDesignId}
              state={panelState}
              selection={selection}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
              {t('selectItemToEdit')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function ResourcesTab({
  apiDesignId,
  data,
  selection,
  expanded,
  onToggleExpanded,
}: {
  apiDesignId: string
  data: ApiDesignSidebarData
  selection: ReturnType<typeof useEditorSelection>
  expanded: Set<string>
  onToggleExpanded: (id: string) => void
}) {
  const t = useTranslations('Editor')
  const createResource = useMutation(createResourceMutationOptions())
  const createEndpoint = useMutation(createEndpointMutationOptions())
  const reorderEndpoints = useMutation(reorderEndpointsMutationOptions())
  const toast = useToast()
  const resources = buildResourcesWithEndpoints(data)
  const isReorderPending = reorderEndpoints.isPending

  const [addingEndpointFor, setAddingEndpointFor] = useState<string | null>(
    null,
  )
  const [newMethod, setNewMethod] =
    useState<(typeof VALID_METHODS)[number]>('GET')
  const [newPath, setNewPath] = useState('/')

  const verticalModifiers = useMemo(() => [RestrictToVerticalAxis], [])

  const handleCreateResource = async () => {
    try {
      const position = getFlatCreatePosition('resource', data.resources)
      const result = await createResource.mutateAsync({
        apiDesignId,
        name: t('newResource'),
        ...position,
      })
      selection.selectResource(result.id)
    } catch (err) {
      toast.add({
        title: t('failedCreateResource'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  const handleCreateEndpoint = async (resourceId: string) => {
    if (!newPath.trim()) return
    try {
      await createEndpoint.mutateAsync({
        apiDesignId,
        resourceId,
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
    setAddingEndpointFor(null)
    setNewMethod('GET')
    setNewPath('/')
  }

  const handleEndpointDragEnd = (event: DragEndEvent, resourceId: string) => {
    if (event.canceled || isReorderPending) return

    const { source } = event.operation
    if (!isSortable(source) || source.initialIndex === source.index) return

    const resource = resources.find((r) => r.resource.id === resourceId)
    if (!resource) return

    const orderedEndpoints = moveEndpoint(
      resource.endpoints,
      source.initialIndex,
      source.index,
    )

    reorderEndpoints.mutate(
      {
        apiDesignId,
        resourceId,
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
  }

  if (resources.length === 0) {
    return (
      <EmptyState
        label={t('noResourcesYet')}
        action={t('resource')}
        onCreate={handleCreateResource}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs font-semibold">{t('resources')}</h2>
        <Button size="sm" onClick={handleCreateResource}>
          <Plus className="size-3.5" /> {t('resource')}
        </Button>
      </div>
      <div className="space-y-2">
        {resources.map(({ resource, endpoints }) => {
          const isExpanded = expanded.has(resource.id)
          return (
            <Card key={resource.id} size="sm" className="gap-0 py-0">
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60">
                <button
                  type="button"
                  className="text-muted-foreground"
                  aria-label={
                    isExpanded ? t('collapseResource') : t('expandResource')
                  }
                  onClick={() => onToggleExpanded(resource.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left font-medium"
                  onClick={() => selection.selectResource(resource.id)}
                >
                  {resource.name}
                </button>
                <span className="text-[0.65rem] text-muted-foreground">
                  {t('endpointsCount', { count: endpoints.length })}
                </span>
              </div>
              {isExpanded ? (
                <div className="border-t border-border bg-muted/20 px-3 py-2">
                  {endpoints.length > 0 ? (
                    <DragDropProvider
                      modifiers={verticalModifiers}
                      onDragEnd={(event) =>
                        handleEndpointDragEnd(event, resource.id)
                      }
                    >
                      <div className="space-y-1">
                        {endpoints.map((endpoint, index) => (
                          <SortableEndpointRow
                            key={endpoint.id}
                            endpoint={endpoint}
                            index={index}
                            resourceId={resource.id}
                            dragDisabled={
                              endpoints.length < 2 || isReorderPending
                            }
                            onEndpointClick={selection.selectEndpoint}
                          />
                        ))}
                      </div>
                    </DragDropProvider>
                  ) : (
                    <p className="py-2 text-center text-[0.65rem] text-muted-foreground">
                      {t('noEndpointsYet')}
                    </p>
                  )}

                  {addingEndpointFor === resource.id ? (
                    <div className="mt-2 flex flex-col gap-1.5 border-t border-border/50 pt-2">
                      <div className="flex gap-1">
                        <Select
                          value={newMethod}
                          onValueChange={(v) =>
                            v != null &&
                            setNewMethod(v as (typeof VALID_METHODS)[number])
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
                            if (e.key === 'Enter')
                              handleCreateEndpoint(resource.id)
                            if (e.key === 'Escape') {
                              setAddingEndpointFor(null)
                              setNewMethod('GET')
                              setNewPath('/')
                            }
                          }}
                          placeholder={t('pathPlaceholder')}
                          className="min-w-0 flex-1"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="xs"
                          onClick={() => handleCreateEndpoint(resource.id)}
                        >
                          {t('add')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setAddingEndpointFor(null)
                            setNewMethod('GET')
                            setNewPath('/')
                          }}
                        >
                          {t('cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setAddingEndpointFor(resource.id)
                        setNewMethod('GET')
                        setNewPath('/')
                      }}
                    >
                      <Plus className="size-3.5" /> {t('endpoint')}
                    </Button>
                  )}
                </div>
              ) : null}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function SchemasTab({
  apiDesignId,
  data,
  selection,
}: {
  apiDesignId: string
  data: ApiDesignSidebarData
  selection: ReturnType<typeof useEditorSelection>
}) {
  const t = useTranslations('Editor')
  const createSchema = useMutation(createSchemaMutationOptions())
  const toast = useToast()
  const { schemaUsage } = buildFlatUsage(data)

  const handleCreate = async () => {
    try {
      const result = await createSchema.mutateAsync({
        apiDesignId,
        name: t('newSchema'),
        jsonSchema: {},
        ...getFlatCreatePosition('schema', data.schemas),
      })
      selection.selectSchema(result.id)
    } catch (err) {
      toast.add({
        title: t('failedCreateSchema'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  if (data.schemas.length === 0) {
    return (
      <EmptyState
        label={t('noSchemasYet')}
        action={t('schema')}
        onCreate={handleCreate}
      />
    )
  }

  return (
    <EntityListHeader
      title={t('schemas')}
      action={t('schema')}
      onCreate={handleCreate}
    >
      {data.schemas.map((schema) => (
        <ListCard
          key={schema.id}
          onClick={() => selection.selectSchema(schema.id)}
        >
          <div className="font-medium">{schema.name}</div>
          {schema.description ? (
            <div className="truncate text-muted-foreground">
              {schema.description}
            </div>
          ) : null}
          <UsageRefs refs={schemaUsage.get(schema.id) ?? []} />
        </ListCard>
      ))}
    </EntityListHeader>
  )
}

function AuthSchemesTab({
  apiDesignId,
  data,
  selection,
}: {
  apiDesignId: string
  data: ApiDesignSidebarData
  selection: ReturnType<typeof useEditorSelection>
}) {
  const t = useTranslations('Editor')
  const createAuthScheme = useMutation(createAuthSchemeMutationOptions())
  const toast = useToast()
  const { authSchemeUsage } = buildFlatUsage(data)

  const handleCreate = async () => {
    try {
      const result = await createAuthScheme.mutateAsync({
        apiDesignId,
        name: t('newAuthScheme'),
        type: 'bearer',
        config: {},
        ...getFlatCreatePosition('authScheme', data.authSchemes),
      })
      selection.selectAuthScheme(result.id)
    } catch (err) {
      toast.add({
        title: t('failedCreateAuthScheme'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  if (data.authSchemes.length === 0) {
    return (
      <EmptyState
        label={t('noAuthSchemesYet')}
        action={t('authScheme')}
        onCreate={handleCreate}
      />
    )
  }

  return (
    <EntityListHeader
      title={t('authSchemes')}
      action={t('authScheme')}
      onCreate={handleCreate}
    >
      {data.authSchemes.map((authScheme) => (
        <ListCard
          key={authScheme.id}
          onClick={() => selection.selectAuthScheme(authScheme.id)}
        >
          <div className="font-medium">{authScheme.name}</div>
          <div className="font-mono text-[0.65rem] text-muted-foreground">
            {authScheme.type}
          </div>
          <UsageRefs refs={authSchemeUsage.get(authScheme.id) ?? []} />
        </ListCard>
      ))}
    </EntityListHeader>
  )
}

function EntityListHeader({
  title,
  action,
  onCreate,
  children,
}: {
  title: string
  action: string
  onCreate: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs font-semibold">{title}</h2>
        <Button size="sm" onClick={onCreate}>
          <Plus className="size-3.5" /> {action}
        </Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ListCard({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Card size="sm" className="gap-1 px-3 py-2">
      <button type="button" className="w-full text-left" onClick={onClick}>
        {children}
      </button>
    </Card>
  )
}

function UsageRefs({ refs }: { refs: FlatUsageReference[] }) {
  const t = useTranslations('Editor')
  if (refs.length === 0) {
    return <div className="text-muted-foreground">{t('noEndpointUsage')}</div>
  }

  const MAX_VISIBLE = 3
  const visible = refs.slice(0, MAX_VISIBLE)
  const hiddenCount = refs.length - MAX_VISIBLE

  return (
    <div className="text-muted-foreground">
      {t('usedBy')} {visible.map((ref) => ref.label).join(', ')}
      {hiddenCount > 0 ? `, +${hiddenCount}` : ''}
    </div>
  )
}

function EmptyState({
  label,
  action,
  onCreate,
}: {
  label: string
  action: string
  onCreate: () => void
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 border border-dashed border-border p-6 text-center">
      <div className="text-sm font-medium">{label}</div>
      <Button size="sm" onClick={onCreate}>
        <Plus className="size-3.5" /> {action}
      </Button>
    </div>
  )
}

function FlatDetailPanel({
  apiDesignId,
  state,
  selection,
}: {
  apiDesignId: string
  state: NonNullable<ReturnType<typeof resolveEditorPanelState>>
  selection: ReturnType<typeof useEditorSelection>
}) {
  const t = useTranslations('Editor')
  const { deleteDialog, openDeleteConfirm } = useEditorDelete({
    apiDesignId,
    state,
    onClose: selection.clearSelection,
    onBackToResource: selection.backToResource,
  })

  return (
    <div className="flex h-full min-h-0 flex-col py-2 md:border-l md:border-border">
      <div className="md:hidden">
        <Button variant="ghost" size="sm" onClick={selection.clearSelection}>
          {t('back')}
        </Button>
      </div>
      <EditorPanelHeader
        title={state.title}
        showBackToResource={!!state.selectedEndpoint}
        onBackToResource={selection.backToResource}
        onClose={selection.clearSelection}
        onDeleteClick={openDeleteConfirm}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">{state.content}</div>
      {deleteDialog}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="flex items-center gap-0.5">
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-h-0 overflow-y-auto border-r border-border p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} size="sm" className="gap-0 py-0">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="size-3.5 animate-pulse rounded bg-muted" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden md:flex md:h-full md:items-center md:justify-center">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
