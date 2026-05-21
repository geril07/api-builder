import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Trash2, X } from 'lucide-react'

import type { ApiDesignResourceDto } from '@/modules/api-design/resources'
import type { ApiDesignEndpointDto } from '@/modules/api-design/endpoints'
import type { ApiDesignSchemaDto } from '@/modules/api-design/schemas'
import type { ApiDesignAuthSchemeDto } from '@/modules/api-design/auth-schemes'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { useToast } from '@/shared/ui/toast'
import { getErrorMessage } from '@/shared/utils/error'
import {
  deleteAuthSchemeMutationOptions,
  deleteEndpointMutationOptions,
  deleteResourceMutationOptions,
  deleteSchemaMutationOptions,
} from '../mutations'
import type { EditorSelection } from '../selection'
import { AuthSchemeEditorView } from './auth-scheme-editor-view'
import { EndpointView } from './endpoint-view'
import { ResourceView } from './resource-view'
import { SchemaEditorView } from './schema-editor-view'

export type EditorPanelData = {
  resources: ApiDesignResourceDto[]
  endpoints: ApiDesignEndpointDto[]
  schemas: ApiDesignSchemaDto[]
  authSchemes: ApiDesignAuthSchemeDto[]
}

export type EditorPanelState = {
  title: string
  content: React.ReactNode
  entityType: 'resource' | 'endpoint' | 'schema' | 'auth-scheme'
  selectedResource: ApiDesignResourceDto | null
  selectedEndpoint: ApiDesignEndpointDto | null
  selectedSchema: ApiDesignSchemaDto | null
  selectedAuthScheme: ApiDesignAuthSchemeDto | null
}

export function resolveEditorPanelState({
  apiDesignId,
  data,
  selection,
  onEndpointClick,
  onSchemaClick,
}: {
  apiDesignId: string
  data: EditorPanelData
  selection: EditorSelection
  onEndpointClick: (resourceId: string, endpointId: string) => void
  onSchemaClick: (schemaId: string) => void
}): EditorPanelState | null {
  const selectedResource = selection.selectedResourceId
    ? (data.resources.find((r) => r.id === selection.selectedResourceId) ??
      null)
    : null
  const selectedEndpoint =
    data.endpoints.find((ep) => ep.id === selection.selectedEndpointId) ?? null
  const selectedSchema = selection.selectedSchemaId
    ? (data.schemas.find((s) => s.id === selection.selectedSchemaId) ?? null)
    : null
  const selectedAuthScheme = selection.selectedAuthSchemeId
    ? (data.authSchemes.find((s) => s.id === selection.selectedAuthSchemeId) ??
      null)
    : null

  if (selectedEndpoint) {
    return {
      title: `${selectedEndpoint.method} ${selectedEndpoint.path}`,
      entityType: 'endpoint',
      selectedResource,
      selectedEndpoint,
      selectedSchema,
      selectedAuthScheme,
      content: (
        <EndpointView
          apiDesignId={apiDesignId}
          endpoint={selectedEndpoint}
          schemas={data.schemas}
          authSchemes={data.authSchemes}
          onSchemaClick={onSchemaClick}
        />
      ),
    }
  }

  if (selectedSchema) {
    return {
      title: selectedSchema.name,
      entityType: 'schema',
      selectedResource,
      selectedEndpoint,
      selectedSchema,
      selectedAuthScheme,
      content: (
        <SchemaEditorView
          apiDesignId={apiDesignId}
          schema={selectedSchema}
          endpoints={data.endpoints}
          onEndpointClick={onEndpointClick}
        />
      ),
    }
  }

  if (selectedAuthScheme) {
    return {
      title: selectedAuthScheme.name,
      entityType: 'auth-scheme',
      selectedResource,
      selectedEndpoint,
      selectedSchema,
      selectedAuthScheme,
      content: (
        <AuthSchemeEditorView
          apiDesignId={apiDesignId}
          authScheme={selectedAuthScheme}
        />
      ),
    }
  }

  if (selectedResource) {
    const endpointsByResource = data.endpoints.filter(
      (ep) => ep.resourceId === selectedResource.id,
    )

    return {
      title: selectedResource.name,
      entityType: 'resource',
      selectedResource,
      selectedEndpoint,
      selectedSchema,
      selectedAuthScheme,
      content: (
        <ResourceView
          apiDesignId={apiDesignId}
          resource={selectedResource}
          endpoints={endpointsByResource}
          onEndpointClick={onEndpointClick}
        />
      ),
    }
  }

  return null
}

export function EditorPanelHeader({
  title,
  showBackToResource,
  onBackToResource,
  onClose,
  onDeleteClick,
}: {
  title: string
  showBackToResource: boolean
  onBackToResource: () => void
  onClose: () => void
  onDeleteClick: () => void
}) {
  const t = useTranslations('Editor')

  return (
    <div className="flex items-center justify-between border-b border-border px-2 pb-2">
      <div className="flex min-w-0 items-center gap-1.5">
        {showBackToResource ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t('backToResource')}
            onClick={onBackToResource}
          >
            <ArrowLeft className="size-3" />
          </Button>
        ) : null}
        <h2 className="truncate font-mono text-xs font-semibold text-foreground">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost-destructive"
          size="icon-xs"
          aria-label={t('delete')}
          onClick={onDeleteClick}
        >
          <Trash2 className="size-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t('closePanel')}
          onClick={onClose}
        >
          <X className="size-3" />
        </Button>
      </div>
    </div>
  )
}

export function useEditorDelete({
  apiDesignId,
  state,
  onClose,
  onBackToResource,
}: {
  apiDesignId: string
  state: EditorPanelState
  onClose: () => void
  onBackToResource: () => void
}) {
  const deleteResource = useMutation(deleteResourceMutationOptions())
  const deleteEndpoint = useMutation(deleteEndpointMutationOptions())
  const deleteSchema = useMutation(deleteSchemaMutationOptions())
  const deleteAuthScheme = useMutation(deleteAuthSchemeMutationOptions())
  const toast = useToast()
  const t = useTranslations('Editor')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const entityTypeLabels: Record<string, string> = {
    resource: t('entityType.resource'),
    endpoint: t('entityType.endpoint'),
    schema: t('entityType.schema'),
    'auth-scheme': t('entityType.auth-scheme'),
  }

  const deleteLoading =
    (!!state.selectedResource && deleteResource.isPending) ||
    (!!state.selectedEndpoint && deleteEndpoint.isPending) ||
    (!!state.selectedSchema && deleteSchema.isPending) ||
    (!!state.selectedAuthScheme && deleteAuthScheme.isPending)

  const handleDelete = async () => {
    try {
      if (state.selectedEndpoint) {
        await deleteEndpoint.mutateAsync({
          endpointId: state.selectedEndpoint.id,
          apiDesignId,
        })
        setShowDeleteConfirm(false)
        onBackToResource()
      } else if (state.selectedSchema) {
        await deleteSchema.mutateAsync({
          schemaId: state.selectedSchema.id,
          apiDesignId,
        })
        setShowDeleteConfirm(false)
        onClose()
      } else if (state.selectedAuthScheme) {
        await deleteAuthScheme.mutateAsync({
          authSchemeId: state.selectedAuthScheme.id,
          apiDesignId,
        })
        setShowDeleteConfirm(false)
        onClose()
      } else if (state.selectedResource) {
        await deleteResource.mutateAsync({
          resourceId: state.selectedResource.id,
          apiDesignId,
        })
        setShowDeleteConfirm(false)
        onClose()
      }
    } catch (err) {
      toast.add({
        title: t('failed'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  const deleteDialog = (
    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title={t('deleteEntityQuestion', {
        entityType: entityTypeLabels[state.entityType]!,
      })}
      description={t('actionCannotBeUndone')}
      confirmLabel={t('delete')}
      loading={deleteLoading}
      onConfirm={handleDelete}
    />
  )

  return {
    deleteDialog,
    openDeleteConfirm: () => setShowDeleteConfirm(true),
  }
}
