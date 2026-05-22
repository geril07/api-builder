import 'server-only'
import { streamText, stepCountIs } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { streamToEventIterator } from '@orpc/server'
import * as apiDesignService from '@/modules/api-design/service'
import { envConfig } from '@/shared/config/env'
import { createAgentTools } from './tools'

const openrouter = createOpenRouter({
  apiKey: envConfig.OPENROUTER_API_KEY,
})

export async function agent(
  apiDesignId: string,
  workspaceId: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
) {
  const designData = await apiDesignService.getApiDesignData(
    apiDesignId,
    workspaceId,
  )

  if (!designData) {
    throw new Error('API design not found.')
  }

  const contextString = formatDesignContext(designData)

  const tools = createAgentTools(apiDesignId, workspaceId)

  const result = streamText({
    model: openrouter('tencent/hy3-preview', {
      extraBody: {
        provider: {
          only: ['siliconflow'],
          order: ['siliconflow'],
          allow_fallbacks: false,
        },
      },
    }),
    system: `You are an expert REST API designer. You have tools to create, update, and delete resources, endpoints, schemas, and auth schemes in an API design.

IMPORTANT — Prefer reusing schemas: When an endpoint needs a request body or response shape, first check if a suitable schema already exists. If not, create one with createSchema, then reference its ID via requestBodySchemaId / responseShapeSchemaId. Only use inline requestBody/responseShape for truly one-off shapes.

Current API Design context:
${contextString}

Plan your approach and use the tools to fulfill the user's request. Be thorough — create proper RESTful endpoints, schemas, and auth schemes as appropriate.`,
    tools,
    stopWhen: stepCountIs(100),
    messages,
    onError: (error) => {
      console.error('[AI Agent Error]', error)
    },
  })

  return streamToEventIterator(result.toUIMessageStream())
}

function formatDesignContext(designData: {
  resources?: Array<{ id: string; name: string; description?: string | null }>
  endpoints?: Array<{
    id: string
    resourceId: string
    method: string
    path: string
    summary?: string | null
    requestBodySchemaId?: string | null
    responseShapeSchemaId?: string | null
    queryParams?: Array<{
      name: string
      description?: string | null
      required?: boolean
      type?: string
      allowMultiple?: boolean
    }>
  }>
  schemas?: Array<{ id: string; name: string; description?: string | null }>
  authSchemes?: Array<{ id: string; name: string; type: string }>
}): string {
  const schemaMap = new Map(
    (designData.schemas ?? []).map((s) => [s.id, s.name]),
  )

  const parts: string[] = []

  for (const resource of designData.resources ?? []) {
    const resourceEndpoints = (designData.endpoints ?? []).filter(
      (ep) => ep.resourceId === resource.id,
    )
    parts.push(
      `Resource "${resource.name}" (id: ${resource.id})${resource.description ? `: ${resource.description}` : ''}`,
    )
    for (const ep of resourceEndpoints) {
      const refs: string[] = []
      if (ep.requestBodySchemaId)
        refs.push(
          `request body: "${schemaMap.get(ep.requestBodySchemaId) ?? '?'}"`,
        )
      if (ep.responseShapeSchemaId)
        refs.push(
          `response: "${schemaMap.get(ep.responseShapeSchemaId) ?? '?'}"`,
        )
      const refStr = refs.length > 0 ? ` [${refs.join(', ')}]` : ''
      const qpStr =
        ep.queryParams && ep.queryParams.length > 0
          ? ` ?${ep.queryParams.map((qp) => `${qp.name}${qp.required ? '*' : ''}`).join(', ')}`
          : ''
      parts.push(
        `  ${ep.method} ${ep.path} (id: ${ep.id})${ep.summary ? ` — ${ep.summary}` : ''}${refStr}${qpStr}`,
      )
    }
    if (resourceEndpoints.length === 0) {
      parts.push('  (no endpoints)')
    }
  }

  const schemas = designData.schemas ?? []
  if (schemas.length > 0) {
    parts.push('\nSchemas:')
    for (const schema of schemas) {
      parts.push(
        `  "${schema.name}" (id: ${schema.id})${schema.description ? `: ${schema.description}` : ''}`,
      )
    }
  }

  const authSchemes = designData.authSchemes ?? []
  if (authSchemes.length > 0) {
    parts.push('\nAuth Schemes:')
    for (const auth of authSchemes) {
      parts.push(`  "${auth.name}" (id: ${auth.id}, ${auth.type})`)
    }
  }

  return parts.join('\n') || '(empty design)'
}
