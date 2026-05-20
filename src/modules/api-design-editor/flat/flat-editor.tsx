import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'

import { MethodBadge } from '@/modules/api-design/endpoints'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
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
} from '../mutations'
import {
  EditorPanelHeader,
  resolveEditorPanelState,
  useEditorDelete,
} from '../editor/editor-panel'
import { ExportDialog } from '../panels/export-dialog'
import { AiDialog } from '../panels/ai-dialog'
import {
  buildFlatUsage,
  buildResourcesWithEndpoints,
  type FlatUsageReference,
} from './data'
import { getFlatCreatePosition } from './create-position'

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
  const { data } = useQuery({
    ...apiDesignQueryOptions(apiDesignId),
    select: selectApiDesignSidebarData,
  })

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
}: {
  apiDesignId: string
  data: ApiDesignSidebarData
  selection: ReturnType<typeof useEditorSelection>
}) {
  const t = useTranslations('Editor')
  const [expanded, setExpanded] = useState(() => new Set<string>())
  const createResource = useMutation(createResourceMutationOptions())
  const createEndpoint = useMutation(createEndpointMutationOptions())
  const toast = useToast()
  const resources = buildResourcesWithEndpoints(data)

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
    try {
      const result = await createEndpoint.mutateAsync({
        apiDesignId,
        resourceId,
        method: 'GET',
        path: '/',
      })
      selection.selectEndpoint(resourceId, result.id)
    } catch (err) {
      toast.add({
        title: t('failedCreateEndpoint'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
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
                  onClick={() => {
                    setExpanded((current) => {
                      const next = new Set(current)
                      if (next.has(resource.id)) next.delete(resource.id)
                      else next.add(resource.id)
                      return next
                    })
                  }}
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
                  <div className="space-y-1">
                    {endpoints.map((endpoint) => (
                      <button
                        key={endpoint.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-background"
                        onClick={() =>
                          selection.selectEndpoint(resource.id, endpoint.id)
                        }
                      >
                        <MethodBadge method={endpoint.method} />
                        <span className="truncate font-mono text-xs">
                          {endpoint.path}
                        </span>
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleCreateEndpoint(resource.id)}
                  >
                    <Plus className="size-3.5" /> {t('endpoint')}
                  </Button>
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
      <button type="button" className="text-left" onClick={onClick}>
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

  return (
    <div className="text-muted-foreground">
      {t('usedBy')} {refs.map((ref) => ref.label).join(', ')}
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
