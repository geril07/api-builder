import { Card } from '@/shared/ui/card'
import type { ApiDesignResourceDto } from '@/modules/api-design/resources'
import type { ApiDesignEndpointDto } from '@/modules/api-design/endpoints'
import type { ApiDesignSchemaDto } from '@/modules/api-design/schemas'
import type { ApiDesignAuthSchemeDto } from '@/modules/api-design/auth-schemes'
import {
  EditorPanelHeader,
  type EditorPanelState,
  resolveEditorPanelState,
  useEditorDelete,
} from './editor/editor-panel'

type SidebarDialogProps = {
  apiDesignId: string
  resources: ApiDesignResourceDto[]
  endpoints: ApiDesignEndpointDto[]
  schemas: ApiDesignSchemaDto[]
  authSchemes: ApiDesignAuthSchemeDto[]
  selectedResourceId: string | null
  selectedEndpointId: string | null
  selectedSchemaId: string | null
  selectedAuthSchemeId: string | null
  onClose: () => void
  onBackToResource: () => void
  onEndpointClick: (resourceId: string, endpointId: string) => void
  onSchemaClick: (schemaId: string) => void
}

export function SidebarDialog({
  apiDesignId,
  resources,
  endpoints,
  schemas,
  authSchemes,
  selectedResourceId,
  selectedEndpointId,
  selectedSchemaId,
  selectedAuthSchemeId,
  onClose,
  onBackToResource,
  onEndpointClick,
  onSchemaClick,
}: SidebarDialogProps) {
  const data = { resources, endpoints, schemas, authSchemes }
  const state = resolveEditorPanelState({
    apiDesignId,
    data,
    selection: {
      selectedResourceId,
      selectedEndpointId,
      selectedSchemaId,
      selectedAuthSchemeId,
    },
    onEndpointClick,
    onSchemaClick,
  })

  if (!state) return null

  return (
    <SidebarDialogContent
      apiDesignId={apiDesignId}
      state={state}
      onClose={onClose}
      onBackToResource={onBackToResource}
    />
  )
}

function SidebarDialogContent({
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
  const { deleteDialog, openDeleteConfirm } = useEditorDelete({
    apiDesignId,
    state,
    onClose,
    onBackToResource,
  })

  return (
    <Card className="absolute top-14 right-4 bottom-7 z-20 flex w-80 animate-in flex-col gap-2 py-2 slide-in-from-right">
      <EditorPanelHeader
        title={state.title}
        showBackToResource={!!state.selectedEndpoint}
        onBackToResource={onBackToResource}
        onClose={onClose}
        onDeleteClick={openDeleteConfirm}
      />

      <div className="flex flex-1 flex-col overflow-y-auto">
        {state.content}
      </div>

      {deleteDialog}
    </Card>
  )
}
