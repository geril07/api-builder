import { queryOptions } from '@tanstack/react-query'
import { orpcTQ } from '@/shared/orpc/client'
import { apiDesignQueryKey, type ApiDesignDto } from '@/modules/api-design'

export type ApiDesignCanvasData = {
  resources: ApiDesignDto['resources']
  endpoints: Array<{
    id: string
    resourceId: string
    requestBodySchemaId: string | null
    responseShapeSchemaId: string | null
    authSchemeIds: string[]
    method: string
    path: string
    summary: string | null
  }>
  schemas: ApiDesignDto['schemas']
  authSchemes: ApiDesignDto['authSchemes']
}

export type ApiDesignSidebarData = Pick<
  ApiDesignDto,
  'resources' | 'endpoints' | 'schemas' | 'authSchemes'
>

export const selectApiDesignCanvasData = (
  data: ApiDesignDto,
): ApiDesignCanvasData => ({
  resources: data.resources,
  endpoints: data.endpoints
    .map((ep) => ({
      id: ep.id,
      resourceId: ep.resourceId,
      requestBodySchemaId: ep.requestBodySchemaId,
      responseShapeSchemaId: ep.responseShapeSchemaId,
      authSchemeIds: [...ep.authSchemeIds].sort(),
      method: ep.method,
      path: ep.path,
      summary: ep.summary,
    }))
    .sort((a, b) => a.id.localeCompare(b.id)),
  schemas: data.schemas,
  authSchemes: data.authSchemes,
})

export const selectApiDesignSidebarData = (
  data: ApiDesignDto,
): ApiDesignSidebarData => ({
  resources: data.resources,
  endpoints: data.endpoints,
  schemas: data.schemas,
  authSchemes: data.authSchemes,
})

export const selectApiDesignUpdatedAt = (data: ApiDesignDto) => data.updatedAt

export const apiDesignQueryOptions = (apiDesignId: string) =>
  queryOptions({
    queryKey: apiDesignQueryKey(apiDesignId),
    queryFn: () => orpcTQ.apiDesign.get.call({ apiDesignId }),
  })
