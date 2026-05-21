import { useCallback, useEffect } from 'react'
import { useNodesState, useEdgesState, useReactFlow } from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/toast'
import { EMPTY_ARR } from '@/shared/utils/arrays'
import {
  updateResourceMutationOptions,
  updateSchemaMutationOptions,
  updateAuthSchemeMutationOptions,
  autoLayoutMutationOptions,
} from '../mutations'
import type { ApiDesignCanvasData } from '../queries'
import { computeAutoLayout } from './layout'
import { computeEdges, type ResourceEdgeData } from './edges'

function resourceNodeMatches(
  node: { type?: string; data: unknown },
  resource: ApiDesignCanvasData['resources'][number],
  apiDesignId: string,
) {
  const data = node.data as {
    resource?: ApiDesignCanvasData['resources'][number]
    apiDesignId?: string
  }

  return (
    node.type === 'resource' &&
    data.apiDesignId === apiDesignId &&
    data.resource?.name === resource.name &&
    data.resource?.description === resource.description
  )
}

function schemaNodeMatches(
  node: { type?: string; data: unknown },
  schema: ApiDesignCanvasData['schemas'][number],
  apiDesignId: string,
) {
  const data = node.data as {
    schema?: ApiDesignCanvasData['schemas'][number]
    apiDesignId?: string
  }

  return (
    node.type === 'schema' &&
    data.apiDesignId === apiDesignId &&
    data.schema?.name === schema.name &&
    data.schema?.description === schema.description
  )
}

function authSchemeNodeMatches(
  node: { type?: string; data: unknown },
  authScheme: ApiDesignCanvasData['authSchemes'][number],
  apiDesignId: string,
) {
  const data = node.data as {
    authScheme?: ApiDesignCanvasData['authSchemes'][number]
    apiDesignId?: string
  }

  return (
    node.type === 'authScheme' &&
    data.apiDesignId === apiDesignId &&
    data.authScheme?.name === authScheme.name &&
    data.authScheme?.type === authScheme.type
  )
}

function edgeSignature(edge: Edge<ResourceEdgeData>) {
  const endpoints = (edge.data?.endpoints ?? [])
    .map((ep) => `${ep.method} ${ep.path} ${ep.summary ?? ''}`)
    .sort()
    .join('|')

  return [
    edge.id,
    edge.source,
    edge.target,
    edge.type,
    edge.style?.stroke,
    edge.style?.strokeDasharray,
    edge.data?.pathOffset,
    edge.data?.types.join(','),
    endpoints,
  ].join('\u001f')
}

function edgesMatch(
  current: Edge<ResourceEdgeData>[],
  next: Edge<ResourceEdgeData>[],
) {
  if (current.length !== next.length) return false

  for (let i = 0; i < current.length; i++) {
    if (edgeSignature(current[i]!) !== edgeSignature(next[i]!)) return false
  }

  return true
}

export function useCanvasNodes(
  apiDesignId: string,
  data: ApiDesignCanvasData | undefined,
) {
  const reactFlowInstance = useReactFlow()
  const toast = useToast()

  const updateResource = useMutation(updateResourceMutationOptions())
  const updateSchema = useMutation(updateSchemaMutationOptions())
  const updateAuthScheme = useMutation(updateAuthSchemeMutationOptions())
  const autoLayout = useMutation(autoLayoutMutationOptions())

  const resources = data?.resources ?? EMPTY_ARR
  const schemas = data?.schemas ?? EMPTY_ARR
  const authSchemes = data?.authSchemes ?? EMPTY_ARR
  const endpoints = data?.endpoints ?? EMPTY_ARR

  const initialNodes = [
    ...resources.map((r) => ({
      id: r.id,
      type: 'resource' as const,
      position: { x: r.positionX, y: r.positionY },
      data: { resource: r, apiDesignId },
    })),
    ...schemas.map((s) => ({
      id: s.id,
      type: 'schema' as const,
      position: { x: s.positionX, y: s.positionY },
      data: { schema: s, apiDesignId },
    })),
    ...authSchemes.map((a) => ({
      id: a.id,
      type: 'authScheme' as const,
      position: { x: a.positionX, y: a.positionY },
      data: { authScheme: a, apiDesignId },
    })),
  ]

  const initialEdges = computeEdges({
    resources,
    schemas,
    authSchemes,
    endpoints,
  })

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    const resourceMap = new Map(resources.map((r) => [r.id, r]))
    const schemaMap = new Map(schemas.map((s) => [s.id, s]))
    const authSchemeMap = new Map(authSchemes.map((a) => [a.id, a]))
    const allEntityIds = new Set([
      ...resourceMap.keys(),
      ...schemaMap.keys(),
      ...authSchemeMap.keys(),
    ])

    setNodes((current) => {
      const currentMap = new Map(current.map((n) => [n.id, n]))
      let changed = false

      for (const n of current) {
        if (!allEntityIds.has(n.id)) {
          changed = true
          currentMap.delete(n.id)
        }
      }

      for (const r of resources) {
        const existing = currentMap.get(r.id)
        const newNode = {
          id: r.id,
          type: 'resource' as const,
          position: existing
            ? existing.position
            : { x: r.positionX, y: r.positionY },
          data: { resource: r, apiDesignId },
        }
        if (!existing) {
          changed = true
          currentMap.set(r.id, newNode)
        } else if (!resourceNodeMatches(existing, r, apiDesignId)) {
          changed = true
          currentMap.set(r.id, newNode)
        }
      }

      for (const s of schemas) {
        const existing = currentMap.get(s.id)
        const newNode = {
          id: s.id,
          type: 'schema' as const,
          position: existing
            ? existing.position
            : { x: s.positionX, y: s.positionY },
          data: { schema: s, apiDesignId },
        }
        if (!existing) {
          changed = true
          currentMap.set(s.id, newNode)
        } else if (!schemaNodeMatches(existing, s, apiDesignId)) {
          changed = true
          currentMap.set(s.id, newNode)
        }
      }

      for (const a of authSchemes) {
        const existing = currentMap.get(a.id)
        const newNode = {
          id: a.id,
          type: 'authScheme' as const,
          position: existing
            ? existing.position
            : { x: a.positionX, y: a.positionY },
          data: { authScheme: a, apiDesignId },
        }
        if (!existing) {
          changed = true
          currentMap.set(a.id, newNode)
        } else if (!authSchemeNodeMatches(existing, a, apiDesignId)) {
          changed = true
          currentMap.set(a.id, newNode)
        }
      }

      return changed ? Array.from(currentMap.values()) : current
    })

    setEdges((current) => {
      const newEdges = computeEdges({
        resources,
        schemas,
        authSchemes,
        endpoints,
      })

      return edgesMatch(current, newEdges) ? current : newEdges
    })
  }, [
    resources,
    schemas,
    authSchemes,
    endpoints,
    setNodes,
    setEdges,
    apiDesignId,
  ])

  const onNodeDragStop = useCallback(
    async (
      _event: React.MouseEvent | React.TouchEvent,
      node: { id: string; type?: string; position: { x: number; y: number } },
    ) => {
      if (node.type === 'resource') {
        const originalResource = resources.find((r) => r.id === node.id)
        try {
          await updateResource.mutateAsync({
            resourceId: node.id,
            apiDesignId,
            positionX: Math.round(node.position.x),
            positionY: Math.round(node.position.y),
          })
        } catch {
          if (originalResource) {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id
                  ? {
                      ...n,
                      position: {
                        x: originalResource.positionX,
                        y: originalResource.positionY,
                      },
                    }
                  : n,
              ),
            )
          }
        }
      } else if (node.type === 'schema') {
        const originalSchema = schemas.find((s) => s.id === node.id)
        try {
          await updateSchema.mutateAsync({
            schemaId: node.id,
            apiDesignId,
            positionX: Math.round(node.position.x),
            positionY: Math.round(node.position.y),
          })
        } catch {
          if (originalSchema) {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id
                  ? {
                      ...n,
                      position: {
                        x: originalSchema.positionX,
                        y: originalSchema.positionY,
                      },
                    }
                  : n,
              ),
            )
          }
        }
      } else if (node.type === 'authScheme') {
        const originalAuthScheme = authSchemes.find((a) => a.id === node.id)
        try {
          await updateAuthScheme.mutateAsync({
            authSchemeId: node.id,
            apiDesignId,
            positionX: Math.round(node.position.x),
            positionY: Math.round(node.position.y),
          })
        } catch {
          if (originalAuthScheme) {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id
                  ? {
                      ...n,
                      position: {
                        x: originalAuthScheme.positionX,
                        y: originalAuthScheme.positionY,
                      },
                    }
                  : n,
              ),
            )
          }
        }
      }
    },
    [
      apiDesignId,
      resources,
      schemas,
      authSchemes,
      updateResource,
      updateSchema,
      updateAuthScheme,
      setNodes,
    ],
  )

  const handleAutoLayout = useCallback(async () => {
    if (!data) return
    const result = computeAutoLayout({
      resources: data.resources.map((r) => ({ id: r.id, name: r.name })),
      schemas: data.schemas.map((s) => ({ id: s.id, name: s.name })),
      authSchemes: data.authSchemes.map((a) => ({
        id: a.id,
        name: a.name,
      })),
      endpoints: data.endpoints.map((ep) => ({
        resourceId: ep.resourceId,
        requestBodySchemaId: ep.requestBodySchemaId,
        responseShapeSchemaId: ep.responseShapeSchemaId,
        authSchemeIds: ep.authSchemeIds,
      })),
    })

    const posMap = new Map<string, { x: number; y: number }>()
    for (const r of result.resources) {
      posMap.set(r.id, { x: r.positionX, y: r.positionY })
    }
    for (const s of result.schemas) {
      posMap.set(s.id, { x: s.positionX, y: s.positionY })
    }
    for (const a of result.authSchemes) {
      posMap.set(a.id, { x: a.positionX, y: a.positionY })
    }

    setNodes((nds) =>
      nds.map((n) => {
        const pos = posMap.get(n.id)
        return pos ? { ...n, position: pos } : n
      }),
    )

    reactFlowInstance.fitView({ duration: 200 })

    try {
      await autoLayout.mutateAsync({
        apiDesignId,
        resources: result.resources,
        schemas: result.schemas,
        authSchemes: result.authSchemes,
      })
    } catch (err) {
      toast.add({
        title: 'Failed to update layout.',
        description: err instanceof Error ? err.message : 'Unknown error',
        type: 'error',
      })
    }
  }, [data, apiDesignId, setNodes, reactFlowInstance, autoLayout, toast])

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStop,
    handleAutoLayout,
    isLayoutPending: autoLayout.isPending,
  }
}
