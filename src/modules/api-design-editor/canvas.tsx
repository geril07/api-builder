import { useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { useTranslations, useFormatter, useNow } from 'next-intl'
import { ResourceNode } from './nodes/resource-node'
import { SchemaNode } from './nodes/schema-node'
import { AuthSchemeNode } from './nodes/auth-scheme-node'
import { SidebarDialog } from './sidebar-dialog'
import { ExportDialog } from './panels/export-dialog'
import { AiDialog } from './panels/ai-dialog'
import { edgeTypes } from './edges'
import {
  apiDesignQueryOptions,
  selectApiDesignCanvasData,
  selectApiDesignSidebarData,
  selectApiDesignUpdatedAt,
} from './queries'
import { useCanvasNodes } from './canvas/use-canvas-nodes'
import { CanvasContextMenu } from './canvas/canvas-context-menu'
import { Grid3x3 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import type { useEditorSelection } from './selection'

const nodeTypes: NodeTypes = {
  resource: ResourceNode,
  schema: SchemaNode,
  authScheme: AuthSchemeNode,
}

type CanvasProps = {
  apiDesignId: string
  selection: ReturnType<typeof useEditorSelection>
  modeControl: React.ReactNode
}

export function Canvas({ apiDesignId, selection, modeControl }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner
        apiDesignId={apiDesignId}
        selection={selection}
        modeControl={modeControl}
        key={apiDesignId}
      />
    </ReactFlowProvider>
  )
}

function CanvasInner({ apiDesignId, selection, modeControl }: CanvasProps) {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  const [contextMenu, setContextMenu] = useState<{
    open: boolean
    x: number
    y: number
  }>({ open: false, x: 0, y: 0 })

  const handlePaneContextMenu = (event: React.MouseEvent | MouseEvent) => {
    event.preventDefault()
    setContextMenu({ open: true, x: event.clientX, y: event.clientY })
  }

  const closeContextMenu = () => {
    setContextMenu({ open: false, x: 0, y: 0 })
  }

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (node.type === 'schema') {
      selection.selectSchema(node.id)
    } else if (node.type === 'authScheme') {
      selection.selectAuthScheme(node.id)
    } else {
      selection.selectResource(node.id)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-muted/40 dark:bg-card/60"
    >
      <CanvasGraph
        apiDesignId={apiDesignId}
        colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
        onNodeClick={handleNodeClick}
        onPaneContextMenu={handlePaneContextMenu}
        contextMenu={contextMenu}
        onCloseContextMenu={closeContextMenu}
        modeControl={modeControl}
      />

      {selection.isOpen && (
        <CanvasSidebar
          apiDesignId={apiDesignId}
          selectedResourceId={selection.selectedResourceId}
          selectedEndpointId={selection.selectedEndpointId}
          selectedSchemaId={selection.selectedSchemaId}
          selectedAuthSchemeId={selection.selectedAuthSchemeId}
          onClose={selection.clearSelection}
          onBackToResource={selection.backToResource}
          onEndpointClick={selection.selectEndpoint}
          onSchemaClick={selection.selectSchema}
        />
      )}
    </div>
  )
}

function CanvasGraph({
  apiDesignId,
  colorMode,
  onNodeClick,
  onPaneContextMenu,
  contextMenu,
  onCloseContextMenu,
  modeControl,
}: {
  apiDesignId: string
  modeControl: React.ReactNode
  colorMode: 'dark' | 'light'
  onNodeClick: React.ComponentProps<typeof ReactFlow>['onNodeClick']
  onPaneContextMenu: React.ComponentProps<typeof ReactFlow>['onPaneContextMenu']
  contextMenu: { open: boolean; x: number; y: number }
  onCloseContextMenu: () => void
}) {
  const { data } = useQuery({
    ...apiDesignQueryOptions(apiDesignId),
    select: selectApiDesignCanvasData,
  })
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStop,
    handleAutoLayout,
    isLayoutPending,
  } = useCanvasNodes(apiDesignId, data)

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode={colorMode}
        suppressHydrationWarning
        fitView
        nodesDraggable
        elementsSelectable
        selectNodesOnDrag={false}
        minZoom={0.2}
        maxZoom={2}
        panOnDrag={[1]}
        onPaneContextMenu={onPaneContextMenu}
      >
        <Background gap={20} size={1} className="bg-background!" />
        <Controls className="[&>button]:border-border [&>button]:bg-card [&>button]:text-foreground [&>button]:hover:bg-muted" />
      </ReactFlow>

      <LastUpdatedLabel apiDesignId={apiDesignId} />

      <CanvasActions
        apiDesignId={apiDesignId}
        isLayoutPending={isLayoutPending}
        onAutoLayout={handleAutoLayout}
        modeControl={modeControl}
      />

      <CanvasContextMenu
        apiDesignId={apiDesignId}
        isOpen={contextMenu.open}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={onCloseContextMenu}
        onAutoLayout={handleAutoLayout}
      />
    </>
  )
}

function LastUpdatedLabel({ apiDesignId }: { apiDesignId: string }) {
  const { data: updatedAt } = useQuery({
    ...apiDesignQueryOptions(apiDesignId),
    select: selectApiDesignUpdatedAt,
  })
  const t = useTranslations('Editor')
  const format = useFormatter()
  const now = useNow()

  if (!updatedAt) return null

  return (
    <div className="absolute top-4 left-4 z-10 font-mono text-[0.65rem] text-muted-foreground">
      {t('lastUpdated', {
        relativeTime: format.relativeTime(updatedAt, { now }),
      })}
    </div>
  )
}

function CanvasActions({
  apiDesignId,
  isLayoutPending,
  onAutoLayout,
  modeControl,
}: {
  apiDesignId: string
  modeControl: React.ReactNode
  isLayoutPending: boolean
  onAutoLayout: () => void
}) {
  const t = useTranslations('Editor')

  return (
    <div className="absolute top-4 right-4 z-10 flex items-stretch gap-1.5">
      {modeControl}
      <ExportDialog apiDesignId={apiDesignId} />
      <AiDialog apiDesignId={apiDesignId} />
      <Button
        variant="outline"
        onClick={onAutoLayout}
        disabled={isLayoutPending}
      >
        <Grid3x3 className="size-3.5" />
        {t('autoLayout')}
      </Button>
    </div>
  )
}

function CanvasSidebar({
  apiDesignId,
  selectedResourceId,
  selectedEndpointId,
  selectedSchemaId,
  selectedAuthSchemeId,
  onClose,
  onBackToResource,
  onEndpointClick,
  onSchemaClick,
}: {
  apiDesignId: string
  selectedResourceId: string | null
  selectedEndpointId: string | null
  selectedSchemaId: string | null
  selectedAuthSchemeId: string | null
  onClose: () => void
  onBackToResource: () => void
  onEndpointClick: (resourceId: string, endpointId: string) => void
  onSchemaClick: (schemaId: string) => void
}) {
  const { data } = useQuery({
    ...apiDesignQueryOptions(apiDesignId),
    select: selectApiDesignSidebarData,
  })

  if (!data) return null

  return (
    <SidebarDialog
      apiDesignId={apiDesignId}
      resources={data.resources}
      endpoints={data.endpoints}
      schemas={data.schemas}
      authSchemes={data.authSchemes}
      selectedResourceId={selectedResourceId}
      selectedEndpointId={selectedEndpointId}
      selectedSchemaId={selectedSchemaId}
      selectedAuthSchemeId={selectedAuthSchemeId}
      onClose={onClose}
      onBackToResource={onBackToResource}
      onEndpointClick={onEndpointClick}
      onSchemaClick={onSchemaClick}
    />
  )
}
