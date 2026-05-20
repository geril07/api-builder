import type { ApiDesignSidebarData } from '../queries'

export type FlatUsageReference = {
  endpointId: string
  resourceId: string
  label: string
  kind: 'request' | 'response' | 'auth'
}

export function buildFlatUsage(data: ApiDesignSidebarData) {
  const resourcesById = new Map(data.resources.map((r) => [r.id, r]))
  const schemaUsage = new Map<string, FlatUsageReference[]>()
  const authSchemeUsage = new Map<string, FlatUsageReference[]>()

  for (const schema of data.schemas) schemaUsage.set(schema.id, [])
  for (const authScheme of data.authSchemes)
    authSchemeUsage.set(authScheme.id, [])

  for (const endpoint of data.endpoints) {
    const resource = resourcesById.get(endpoint.resourceId)
    const label = `${endpoint.method} ${endpoint.path}${resource ? ` in ${resource.name}` : ''}`

    if (endpoint.requestBodySchemaId) {
      schemaUsage.get(endpoint.requestBodySchemaId)?.push({
        endpointId: endpoint.id,
        resourceId: endpoint.resourceId,
        label,
        kind: 'request',
      })
    }

    if (endpoint.responseShapeSchemaId) {
      schemaUsage.get(endpoint.responseShapeSchemaId)?.push({
        endpointId: endpoint.id,
        resourceId: endpoint.resourceId,
        label,
        kind: 'response',
      })
    }

    for (const authSchemeId of endpoint.authSchemeIds) {
      authSchemeUsage.get(authSchemeId)?.push({
        endpointId: endpoint.id,
        resourceId: endpoint.resourceId,
        label,
        kind: 'auth',
      })
    }
  }

  return { schemaUsage, authSchemeUsage }
}

export function buildResourcesWithEndpoints(data: ApiDesignSidebarData) {
  return data.resources.map((resource) => ({
    resource,
    endpoints: data.endpoints
      .filter((endpoint) => endpoint.resourceId === resource.id)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
  }))
}
