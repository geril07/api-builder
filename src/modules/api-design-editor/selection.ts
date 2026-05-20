import { useState } from 'react'

export type EditorSelection = {
  selectedResourceId: string | null
  selectedEndpointId: string | null
  selectedSchemaId: string | null
  selectedAuthSchemeId: string | null
}

const EMPTY_SELECTION: EditorSelection = {
  selectedResourceId: null,
  selectedEndpointId: null,
  selectedSchemaId: null,
  selectedAuthSchemeId: null,
}

export function useEditorSelection() {
  const [selection, setSelection] = useState<EditorSelection>(EMPTY_SELECTION)

  const selectResource = (resourceId: string) => {
    setSelection({
      selectedResourceId: resourceId,
      selectedEndpointId: null,
      selectedSchemaId: null,
      selectedAuthSchemeId: null,
    })
  }

  const selectEndpoint = (resourceId: string, endpointId: string) => {
    setSelection({
      selectedResourceId: resourceId,
      selectedEndpointId: endpointId,
      selectedSchemaId: null,
      selectedAuthSchemeId: null,
    })
  }

  const selectSchema = (schemaId: string) => {
    setSelection({
      selectedResourceId: null,
      selectedEndpointId: null,
      selectedSchemaId: schemaId,
      selectedAuthSchemeId: null,
    })
  }

  const selectAuthScheme = (authSchemeId: string) => {
    setSelection({
      selectedResourceId: null,
      selectedEndpointId: null,
      selectedSchemaId: null,
      selectedAuthSchemeId: authSchemeId,
    })
  }

  const clearSelection = () => setSelection(EMPTY_SELECTION)

  const backToResource = () => {
    setSelection((current) => ({ ...current, selectedEndpointId: null }))
  }

  return {
    ...selection,
    isOpen:
      selection.selectedResourceId !== null ||
      selection.selectedSchemaId !== null ||
      selection.selectedAuthSchemeId !== null,
    selectResource,
    selectEndpoint,
    selectSchema,
    selectAuthScheme,
    clearSelection,
    backToResource,
  }
}
