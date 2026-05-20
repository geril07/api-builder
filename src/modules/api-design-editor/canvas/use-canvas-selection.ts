import { useState } from 'react'
import type { Node } from '@xyflow/react'

export function useCanvasSelection() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  )
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(
    null,
  )
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null)
  const [selectedAuthSchemeId, setSelectedAuthSchemeId] = useState<
    string | null
  >(null)

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
    setSelectedEndpointId(null)
    if (node.type === 'schema') {
      setSelectedSchemaId(node.id)
      setSelectedAuthSchemeId(null)
      setSelectedResourceId(null)
    } else if (node.type === 'authScheme') {
      setSelectedAuthSchemeId(node.id)
      setSelectedSchemaId(null)
      setSelectedResourceId(null)
    } else {
      setSelectedSchemaId(null)
      setSelectedAuthSchemeId(null)
      setSelectedResourceId(node.id)
    }
  }

  const handleEndpointClick = (resourceId: string, endpointId: string) => {
    setSelectedNodeId(resourceId)
    setSelectedEndpointId(endpointId)
    setSelectedResourceId(resourceId)
  }

  const handleSchemaClick = (schemaId: string) => {
    setSelectedNodeId(schemaId)
    setSelectedSchemaId(schemaId)
    setSelectedEndpointId(null)
    setSelectedAuthSchemeId(null)
    setSelectedResourceId(null)
  }

  const handleCloseSidebar = () => {
    setSelectedNodeId(null)
    setSelectedResourceId(null)
    setSelectedEndpointId(null)
    setSelectedSchemaId(null)
    setSelectedAuthSchemeId(null)
  }

  const clearEndpoint = () => {
    setSelectedEndpointId(null)
  }

  return {
    selectedNodeId,
    selectedResourceId,
    selectedEndpointId,
    selectedSchemaId,
    selectedAuthSchemeId,
    handleNodeClick,
    handleEndpointClick,
    handleSchemaClick,
    handleCloseSidebar,
    clearEndpoint,
    isSidebarOpen: selectedNodeId !== null,
  }
}
