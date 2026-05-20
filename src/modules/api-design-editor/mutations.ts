import { mutationOptions } from '@tanstack/react-query'
import { orpcTQ } from '@/shared/orpc/client'
import type { ApiDesignResourceDto } from '@/modules/api-design/resources'
import type { ApiDesignEndpointDto } from '@/modules/api-design/endpoints'
import type { VALID_METHODS } from '@/modules/api-design/endpoints'
import type { ApiDesignSchemaDto } from '@/modules/api-design/schemas'
import type { ApiDesignAuthSchemeDto } from '@/modules/api-design/auth-schemes'
import { apiDesignQueryKey, type ApiDesignDto } from '@/modules/api-design'

const now = () => new Date()

type OptimisticEntityKey = 'resources' | 'endpoints' | 'schemas' | 'authSchemes'

type OptimisticResult = {
  prev: ApiDesignDto | undefined
  queryKey: ReturnType<typeof apiDesignQueryKey>
  optimisticId?: string
}

type EndpointMethod = (typeof VALID_METHODS)[number]

type EndpointQueryParamInput = {
  name: string
  description?: string | null
  required?: boolean
  type?: 'string' | 'number' | 'integer' | 'boolean'
  allowMultiple?: boolean
}

type CreateResourceInput = {
  apiDesignId: string
  name: string
  description?: string | null
  positionX: number
  positionY: number
}

type UpdateResourceInput = {
  apiDesignId: string
  resourceId: string
  name?: string
  description?: string | null
  positionX?: number
  positionY?: number
}

type CreateEndpointInput = {
  apiDesignId: string
  resourceId: string
  method: EndpointMethod
  path: string
  summary?: string | null
  requestBody?: string | null
  responseShape?: string | null
  requestBodySchemaId?: string | null
  responseShapeSchemaId?: string | null
  authSchemeIds?: string[]
  queryParams?: EndpointQueryParamInput[]
}

type UpdateEndpointInput = {
  endpointId: string
  apiDesignId: string
  method?: EndpointMethod
  path?: string
  summary?: string | null
  requestBody?: string | null
  responseShape?: string | null
  requestBodySchemaId?: string | null
  responseShapeSchemaId?: string | null
  authSchemeIds?: string[]
  queryParams?: EndpointQueryParamInput[]
}

type ReorderEndpointsInput = {
  apiDesignId: string
  resourceId: string
  endpointIds: string[]
}

type CreateSchemaInput = {
  apiDesignId: string
  name: string
  description?: string | null
  jsonSchema: unknown
  positionX: number
  positionY: number
}

type UpdateSchemaInput = {
  schemaId: string
  apiDesignId: string
  name?: string
  description?: string | null
  jsonSchema?: unknown
  positionX?: number
  positionY?: number
}

type AuthSchemeType = 'bearer' | 'apiKey' | 'oauth2' | 'openIdConnect'

type CreateAuthSchemeInput = {
  apiDesignId: string
  name: string
  type: AuthSchemeType
  config: unknown
  positionX: number
  positionY: number
}

type UpdateAuthSchemeInput = {
  authSchemeId: string
  apiDesignId: string
  name?: string
  type?: AuthSchemeType
  config?: unknown
  positionX?: number
  positionY?: number
}

function optimistic<TInput extends { apiDesignId: string }, TData>(
  paint: (
    old: ApiDesignDto,
    input: TInput,
    helpers: { optimisticId?: string },
  ) => ApiDesignDto,
  entityKey?: OptimisticEntityKey,
) {
  return mutationOptions<TData, Error, TInput, OptimisticResult>({
    onMutate: async (input, { client }) => {
      const queryKey = apiDesignQueryKey(input.apiDesignId)
      await client.cancelQueries({ queryKey })
      const prev = client.getQueryData<ApiDesignDto>(queryKey)
      let optimisticId: string | undefined

      if (prev) {
        optimisticId = entityKey
          ? `optimistic-${crypto.randomUUID()}`
          : undefined
        client.setQueryData<ApiDesignDto>(
          queryKey,
          paint(prev, input, { optimisticId }),
        )
      }

      return { prev, queryKey, optimisticId }
    },
    onSuccess: (data, _input, onMutateResult, { client }) => {
      if (!entityKey || !onMutateResult?.optimisticId) return
      const result = data as { id?: string } | undefined
      if (!result?.id) return

      const current = client.getQueryData<ApiDesignDto>(onMutateResult.queryKey)
      if (!current) return

      const entities = current[entityKey] as { id: string }[]
      const idx = entities.findIndex(
        (e) => e.id === onMutateResult.optimisticId,
      )
      if (idx === -1) return

      const updated = entities.map((e) =>
        e.id === onMutateResult.optimisticId ? { ...e, id: result.id } : e,
      )
      client.setQueryData<ApiDesignDto>(onMutateResult.queryKey, {
        ...current,
        [entityKey]: updated,
      })
    },
    onError: (_err, _input, onMutateResult, { client }) => {
      if (onMutateResult?.prev) {
        client.setQueryData(onMutateResult.queryKey, onMutateResult.prev)
      }
    },
    onSettled: (_data, _err, input, _onMutateResult, { client }) => {
      client.invalidateQueries({
        queryKey: apiDesignQueryKey(input.apiDesignId),
      })
    },
  })
}

export const createResourceMutationOptions = () =>
  orpcTQ.apiDesign.resource.create.mutationOptions(
    optimistic<CreateResourceInput, { id: string }>(
      (old: ApiDesignDto, input: CreateResourceInput, { optimisticId }) => ({
        ...old,
        resources: [
          ...old.resources,
          {
            id: optimisticId!,
            apiDesignId: input.apiDesignId,
            name: input.name,
            description: input.description ?? null,
            positionX: input.positionX,
            positionY: input.positionY,
            createdAt: now(),
            updatedAt: now(),
          } as ApiDesignResourceDto,
        ],
        updatedAt: now(),
      }),
      'resources',
    ),
  )

export const updateResourceMutationOptions = () =>
  orpcTQ.apiDesign.resource.update.mutationOptions(
    optimistic<UpdateResourceInput, void>(
      (old: ApiDesignDto, input: UpdateResourceInput) => ({
        ...old,
        updatedAt: now(),
        resources: old.resources.map((r) =>
          r.id === input.resourceId
            ? {
                ...r,
                updatedAt: now(),
                ...(input.name !== undefined && { name: input.name }),
                ...(input.description !== undefined && {
                  description: input.description,
                }),
                ...(input.positionX !== undefined && {
                  positionX: input.positionX,
                }),
                ...(input.positionY !== undefined && {
                  positionY: input.positionY,
                }),
              }
            : r,
        ),
      }),
    ),
  )

export const deleteResourceMutationOptions = () =>
  orpcTQ.apiDesign.resource.delete.mutationOptions(
    optimistic<{ apiDesignId: string; resourceId: string }, void>(
      (
        old: ApiDesignDto,
        input: { apiDesignId: string; resourceId: string },
      ) => ({
        ...old,
        updatedAt: now(),
        resources: old.resources.filter((r) => r.id !== input.resourceId),
        endpoints: old.endpoints.filter(
          (ep) => ep.resourceId !== input.resourceId,
        ),
      }),
    ),
  )

export const createEndpointMutationOptions = () =>
  orpcTQ.apiDesign.endpoint.create.mutationOptions(
    optimistic<CreateEndpointInput, { id: string }>(
      (old: ApiDesignDto, input: CreateEndpointInput, { optimisticId }) => {
        const resourceEndpoints = old.endpoints.filter(
          (ep) => ep.resourceId === input.resourceId,
        )
        const sortOrder =
          Math.max(-1, ...resourceEndpoints.map((ep) => ep.sortOrder)) + 1

        return {
          ...old,
          endpoints: [
            ...old.endpoints,
            {
              id: optimisticId!,
              resourceId: input.resourceId,
              method: input.method,
              path: input.path,
              summary: input.summary ?? null,
              requestBody: input.requestBody ?? null,
              responseShape: input.responseShape ?? null,
              requestBodySchemaId: input.requestBodySchemaId ?? null,
              responseShapeSchemaId: input.responseShapeSchemaId ?? null,
              authSchemeIds: input.authSchemeIds ?? [],
              queryParams: (input.queryParams ??
                []) as ApiDesignEndpointDto['queryParams'],
              sortOrder,
              createdAt: now(),
              updatedAt: now(),
            } as ApiDesignEndpointDto,
          ],
          updatedAt: now(),
        }
      },
      'endpoints',
    ),
  )

export const updateEndpointMutationOptions = () =>
  orpcTQ.apiDesign.endpoint.update.mutationOptions(
    optimistic<UpdateEndpointInput, void>(
      (old: ApiDesignDto, input: UpdateEndpointInput) => ({
        ...old,
        updatedAt: now(),
        endpoints: old.endpoints.map((ep) =>
          ep.id === input.endpointId
            ? {
                ...ep,
                updatedAt: now(),
                ...(input.method !== undefined && { method: input.method }),
                ...(input.path !== undefined && { path: input.path }),
                ...(input.summary !== undefined && {
                  summary: input.summary,
                }),
                ...(input.requestBody !== undefined && {
                  requestBody: input.requestBody,
                }),
                ...(input.responseShape !== undefined && {
                  responseShape: input.responseShape,
                }),
                ...(input.requestBodySchemaId !== undefined && {
                  requestBodySchemaId: input.requestBodySchemaId,
                }),
                ...(input.responseShapeSchemaId !== undefined && {
                  responseShapeSchemaId: input.responseShapeSchemaId,
                }),
                ...(input.authSchemeIds !== undefined && {
                  authSchemeIds: input.authSchemeIds,
                }),
                ...(input.queryParams !== undefined && {
                  queryParams:
                    input.queryParams as ApiDesignEndpointDto['queryParams'],
                }),
              }
            : ep,
        ),
      }),
    ),
  )

export const deleteEndpointMutationOptions = () =>
  orpcTQ.apiDesign.endpoint.delete.mutationOptions(
    optimistic<{ endpointId: string; apiDesignId: string }, void>(
      (
        old: ApiDesignDto,
        input: { endpointId: string; apiDesignId: string },
      ) => ({
        ...old,
        updatedAt: now(),
        endpoints: old.endpoints.filter((ep) => ep.id !== input.endpointId),
      }),
    ),
  )

export const reorderEndpointsMutationOptions = () =>
  orpcTQ.apiDesign.endpoint.reorder.mutationOptions(
    optimistic<ReorderEndpointsInput, void>(
      (old: ApiDesignDto, input: ReorderEndpointsInput) => {
        const reorderedEndpointsById = new Map(
          input.endpointIds.map((endpointId, sortOrder) => {
            const endpoint = old.endpoints.find((ep) => ep.id === endpointId)
            return [
              endpointId,
              endpoint
                ? { ...endpoint, sortOrder, updatedAt: now() }
                : undefined,
            ] as const
          }),
        )
        let insertedReorderedEndpoints = false

        return {
          ...old,
          updatedAt: now(),
          endpoints: old.endpoints.flatMap((endpoint) => {
            if (endpoint.resourceId !== input.resourceId) return [endpoint]
            if (insertedReorderedEndpoints) return []

            insertedReorderedEndpoints = true
            return input.endpointIds
              .map((endpointId) => reorderedEndpointsById.get(endpointId))
              .filter((ep): ep is ApiDesignEndpointDto => ep !== undefined)
          }),
        }
      },
    ),
  )

export const createSchemaMutationOptions = () =>
  orpcTQ.apiDesign.schema.create.mutationOptions(
    optimistic<CreateSchemaInput, { id: string }>(
      (old: ApiDesignDto, input: CreateSchemaInput, { optimisticId }) => ({
        ...old,
        schemas: [
          ...old.schemas,
          {
            id: optimisticId!,
            apiDesignId: input.apiDesignId,
            name: input.name,
            description: input.description ?? null,
            jsonSchema: input.jsonSchema,
            positionX: input.positionX,
            positionY: input.positionY,
            createdAt: now(),
            updatedAt: now(),
          } as ApiDesignSchemaDto,
        ],
        updatedAt: now(),
      }),
      'schemas',
    ),
  )

export const updateSchemaMutationOptions = () =>
  orpcTQ.apiDesign.schema.update.mutationOptions(
    optimistic<UpdateSchemaInput, void>(
      (old: ApiDesignDto, input: UpdateSchemaInput) => ({
        ...old,
        updatedAt: now(),
        schemas: old.schemas.map((s) =>
          s.id === input.schemaId
            ? {
                ...s,
                updatedAt: now(),
                ...(input.name !== undefined && { name: input.name }),
                ...(input.description !== undefined && {
                  description: input.description,
                }),
                ...(input.jsonSchema !== undefined && {
                  jsonSchema: input.jsonSchema,
                }),
                ...(input.positionX !== undefined && {
                  positionX: input.positionX,
                }),
                ...(input.positionY !== undefined && {
                  positionY: input.positionY,
                }),
              }
            : s,
        ),
      }),
    ),
  )

export const deleteSchemaMutationOptions = () =>
  orpcTQ.apiDesign.schema.delete.mutationOptions(
    optimistic<{ schemaId: string; apiDesignId: string }, void>(
      (
        old: ApiDesignDto,
        input: { schemaId: string; apiDesignId: string },
      ) => ({
        ...old,
        updatedAt: now(),
        schemas: old.schemas.filter((s) => s.id !== input.schemaId),
      }),
    ),
  )

export const createAuthSchemeMutationOptions = () =>
  orpcTQ.apiDesign.authScheme.create.mutationOptions(
    optimistic<CreateAuthSchemeInput, { id: string }>(
      (old: ApiDesignDto, input: CreateAuthSchemeInput, { optimisticId }) => ({
        ...old,
        authSchemes: [
          ...old.authSchemes,
          {
            id: optimisticId!,
            apiDesignId: input.apiDesignId,
            name: input.name,
            type: input.type,
            config: input.config,
            positionX: input.positionX,
            positionY: input.positionY,
            createdAt: now(),
            updatedAt: now(),
          } as ApiDesignAuthSchemeDto,
        ],
        updatedAt: now(),
      }),
      'authSchemes',
    ),
  )

export const updateAuthSchemeMutationOptions = () =>
  orpcTQ.apiDesign.authScheme.update.mutationOptions(
    optimistic<UpdateAuthSchemeInput, void>(
      (old: ApiDesignDto, input: UpdateAuthSchemeInput) => ({
        ...old,
        updatedAt: now(),
        authSchemes: old.authSchemes.map((as) =>
          as.id === input.authSchemeId
            ? {
                ...as,
                updatedAt: now(),
                ...(input.name !== undefined && { name: input.name }),
                ...(input.type !== undefined && { type: input.type }),
                ...(input.config !== undefined && { config: input.config }),
                ...(input.positionX !== undefined && {
                  positionX: input.positionX,
                }),
                ...(input.positionY !== undefined && {
                  positionY: input.positionY,
                }),
              }
            : as,
        ),
      }),
    ),
  )

export const deleteAuthSchemeMutationOptions = () =>
  orpcTQ.apiDesign.authScheme.delete.mutationOptions(
    optimistic<{ authSchemeId: string; apiDesignId: string }, void>(
      (
        old: ApiDesignDto,
        input: { authSchemeId: string; apiDesignId: string },
      ) => ({
        ...old,
        updatedAt: now(),
        authSchemes: old.authSchemes.filter(
          (as) => as.id !== input.authSchemeId,
        ),
      }),
    ),
  )

export const autoLayoutMutationOptions = () =>
  orpcTQ.apiDesign.autoLayout.mutationOptions({
    onSettled: (_data, _err, input, _result, { client }) => {
      client.invalidateQueries({
        queryKey: apiDesignQueryKey(input.apiDesignId),
      })
    },
  })
