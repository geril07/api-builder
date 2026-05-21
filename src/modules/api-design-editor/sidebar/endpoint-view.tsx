import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui/select'
import { Label } from '@/shared/ui/label'
import { useToast } from '@/shared/ui/toast'
import { getErrorMessage } from '@/shared/utils/error'
import { VALID_METHODS } from '@/modules/api-design/endpoints'
import { Plus, X } from 'lucide-react'
import { EMPTY_ARR } from '@/shared/utils/arrays'
import type {
  ApiDesignEndpointDto,
  QueryParamDto,
} from '@/modules/api-design/endpoints'
import type { ApiDesignSchemaDto } from '@/modules/api-design/schemas'
import type { ApiDesignAuthSchemeDto } from '@/modules/api-design/auth-schemes'
import { updateEndpointMutationOptions } from '../mutations'
import { useEntityReset } from './use-entity-reset'
import { useOnBlurCommit, useOnBlurCommitNullable } from './use-on-blur-commit'
import { SchemaReferenceField } from './schema-reference-field'

export type EndpointViewProps = {
  apiDesignId: string
  endpoint: ApiDesignEndpointDto
  schemas: ApiDesignSchemaDto[]
  authSchemes: ApiDesignAuthSchemeDto[]
  onSchemaClick?: (schemaId: string) => void
}

export function EndpointView({
  apiDesignId,
  endpoint,
  schemas,
  authSchemes,
  onSchemaClick,
}: EndpointViewProps) {
  const t = useTranslations('Editor')
  const updateEndpoint = useMutation(updateEndpointMutationOptions())
  const toast = useToast()
  const [method, setMethod] = useState(endpoint.method)
  const [path, setPath] = useState(endpoint.path)
  const [summary, setSummary] = useState(endpoint.summary ?? '')
  const [requestBody, setRequestBody] = useState<string>(
    String(endpoint.requestBody ?? ''),
  )
  const [responseShape, setResponseShape] = useState<string>(
    String(endpoint.responseShape ?? ''),
  )
  const [authSchemeIds, setAuthSchemeIds] = useState<string[]>(
    endpoint.authSchemeIds ?? EMPTY_ARR,
  )
  const [queryParams, setQueryParams] = useState<QueryParamDto[]>(
    endpoint.queryParams ?? EMPTY_ARR,
  )
  const queryParamsDirtyRef = useRef(false)
  const queryParamsRef = useRef(queryParams)
  const endpointQueryParamsRef = useRef(endpoint.queryParams ?? EMPTY_ARR)

  useEffect(() => {
    queryParamsRef.current = queryParams
  }, [queryParams])

  useEffect(() => {
    endpointQueryParamsRef.current = endpoint.queryParams ?? EMPTY_ARR
  }, [endpoint.queryParams])

  const [requestBodySchemaId, setRequestBodySchemaId] = useState<string | null>(
    endpoint.requestBodySchemaId ?? null,
  )
  const [responseShapeSchemaId, setResponseShapeSchemaId] = useState<
    string | null
  >(endpoint.responseShapeSchemaId ?? null)

  const [requestBodyMode, setRequestBodyMode] = useState<
    'inline' | 'reference'
  >(
    endpoint.requestBodySchemaId &&
      schemas.some((s) => s.id === endpoint.requestBodySchemaId)
      ? 'reference'
      : 'inline',
  )
  const [responseShapeMode, setResponseShapeMode] = useState<
    'inline' | 'reference'
  >(
    endpoint.responseShapeSchemaId &&
      schemas.some((s) => s.id === endpoint.responseShapeSchemaId)
      ? 'reference'
      : 'inline',
  )

  useEntityReset(endpoint.id, () => {
    setMethod(endpoint.method)
    setPath(endpoint.path)
    setSummary(endpoint.summary ?? '')
    setRequestBody(String(endpoint.requestBody ?? ''))
    setResponseShape(String(endpoint.responseShape ?? ''))
    setAuthSchemeIds(endpoint.authSchemeIds ?? EMPTY_ARR)
    setQueryParams(endpoint.queryParams ?? EMPTY_ARR)
    queryParamsDirtyRef.current = false
    const hasRequestBodyRef =
      endpoint.requestBodySchemaId &&
      schemas.some((s) => s.id === endpoint.requestBodySchemaId)
    const hasResponseShapeRef =
      endpoint.responseShapeSchemaId &&
      schemas.some((s) => s.id === endpoint.responseShapeSchemaId)

    setRequestBodySchemaId(
      hasRequestBodyRef ? endpoint.requestBodySchemaId : null,
    )
    setResponseShapeSchemaId(
      hasResponseShapeRef ? endpoint.responseShapeSchemaId : null,
    )
    setRequestBodyMode(hasRequestBodyRef ? 'reference' : 'inline')
    setResponseShapeMode(hasResponseShapeRef ? 'reference' : 'inline')
  })

  const callUpdateEndpoint = async (
    updates: Partial<{
      method: (typeof VALID_METHODS)[number]
      path: string
      summary: string | null
      requestBody: string | null
      responseShape: string | null
      requestBodySchemaId: string | null
      responseShapeSchemaId: string | null
      authSchemeIds: string[]
      queryParams: QueryParamDto[]
    }>,
  ) => {
    try {
      await updateEndpoint.mutateAsync({
        endpointId: endpoint.id,
        apiDesignId,
        ...updates,
      })
    } catch (err) {
      toast.add({
        title: t('failedUpdateEndpoint'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  const handlePathBlur = useOnBlurCommit(path, endpoint.path, (v) =>
    callUpdateEndpoint({ path: v }),
  )

  const handleSummaryBlur = useOnBlurCommitNullable(
    summary,
    endpoint.summary,
    (v) => callUpdateEndpoint({ summary: v }),
  )

  const handleRequestBodyBlur = () => {
    const trimmed = requestBody.trim()
    const updates: Record<string, string | null> = {}
    if (trimmed !== (endpoint.requestBody ?? '')) {
      updates.requestBody = trimmed || null
    }
    if (endpoint.requestBodySchemaId != null && requestBodyMode === 'inline') {
      updates.requestBodySchemaId = null
    }
    if (Object.keys(updates).length > 0) {
      callUpdateEndpoint(updates)
    }
  }

  const handleResponseShapeBlur = () => {
    const trimmed = responseShape.trim()
    const updates: Record<string, string | null> = {}
    if (trimmed !== (endpoint.responseShape ?? '')) {
      updates.responseShape = trimmed || null
    }
    if (
      endpoint.responseShapeSchemaId != null &&
      responseShapeMode === 'inline'
    ) {
      updates.responseShapeSchemaId = null
    }
    if (Object.keys(updates).length > 0) {
      callUpdateEndpoint(updates)
    }
  }

  const handleMethodChange = (method: (typeof VALID_METHODS)[number]) => {
    if (method !== endpoint.method) {
      callUpdateEndpoint({ method })
    }
  }

  const isRequestBodyReadOnly =
    requestBodyMode === 'reference' && !!requestBodySchemaId
  const isResponseShapeReadOnly =
    responseShapeMode === 'reference' && !!responseShapeSchemaId

  const handleRequestBodySchemaChange = (schema: ApiDesignSchemaDto | null) => {
    if (!schema) return
    setRequestBodySchemaId(schema.id)
    const json = JSON.stringify(schema.jsonSchema, null, 2)
    setRequestBody(json)
    callUpdateEndpoint({
      requestBodySchemaId: schema.id,
      requestBody: json,
    })
  }

  const handleRequestBodyModeChange = (mode: 'inline' | 'reference') => {
    setRequestBodyMode(mode)
  }

  const handleResponseShapeSchemaChange = (
    schema: ApiDesignSchemaDto | null,
  ) => {
    if (!schema) return
    setResponseShapeSchemaId(schema.id)
    const json = JSON.stringify(schema.jsonSchema, null, 2)
    setResponseShape(json)
    callUpdateEndpoint({
      responseShapeSchemaId: schema.id,
      responseShape: json,
    })
  }

  const handleResponseShapeModeChange = (mode: 'inline' | 'reference') => {
    setResponseShapeMode(mode)
  }

  const handleAuthSchemeToggle = (schemeId: string) => {
    const newIds = authSchemeIds.includes(schemeId)
      ? authSchemeIds.filter((id) => id !== schemeId)
      : [...authSchemeIds, schemeId]
    setAuthSchemeIds(newIds)
    callUpdateEndpoint({ authSchemeIds: newIds })
  }

  const handleQueryParamChange = (
    index: number,
    updates: Partial<QueryParamDto>,
  ) => {
    setQueryParams((prev) => {
      queryParamsDirtyRef.current = true
      return prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    })
  }

  const handleAddQueryParam = () => {
    setQueryParams((prev) => {
      queryParamsDirtyRef.current = true
      return [
        ...prev,
        {
          name: '',
          description: null,
          required: false,
          type: 'string',
          allowMultiple: false,
        },
      ]
    })
  }

  const handleRemoveQueryParam = (index: number) => {
    setQueryParams((prev) => {
      queryParamsDirtyRef.current = true
      return prev.filter((_, i) => i !== index)
    })
  }

  const sanitizeQueryParams = (params: QueryParamDto[]): QueryParamDto[] =>
    params.filter((p) => p.name.trim().length > 0)

  const saveQueryParams = () => {
    if (!queryParamsDirtyRef.current) return
    const sanitized = sanitizeQueryParams(queryParamsRef.current)
    const serverSanitized = sanitizeQueryParams(endpointQueryParamsRef.current)
    if (JSON.stringify(sanitized) === JSON.stringify(serverSanitized)) {
      queryParamsDirtyRef.current = false
      return
    }
    callUpdateEndpoint({ queryParams: sanitized })
  }

  const handleQueryParamNameBlur = () => {
    saveQueryParams()
  }

  const saveQueryParamsRef = useRef(saveQueryParams)

  useEffect(() => {
    saveQueryParamsRef.current = saveQueryParams
  })

  useEffect(() => {
    return () => {
      saveQueryParamsRef.current()
    }
  }, [])

  const VALID_PARAM_TYPES = ['string', 'number', 'integer', 'boolean'] as const

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="px-2 py-2">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="shrink-0 space-y-1.5">
              <Label>{t('method')}</Label>
              <Select
                value={method}
                onValueChange={(v) => {
                  if (v == null) return
                  setMethod(v as (typeof VALID_METHODS)[number])
                  handleMethodChange(v as (typeof VALID_METHODS)[number])
                }}
              >
                <SelectTrigger size="sm" aria-label={t('httpMethod')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALID_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label>{t('path')}</Label>
              <Input
                size="sm"
                aria-label={t('endpointPath')}
                value={path}
                onChange={(e) => setPath(e.target.value)}
                onBlur={handlePathBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePathBlur()
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('summary')}</Label>
            <Textarea
              aria-label={t('endpointSummary')}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onBlur={handleSummaryBlur}
              rows={2}
              placeholder={t('summaryPlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('queryParameters')}</Label>
            {queryParams.length === 0 ? (
              <p className="py-1 text-[0.65rem] text-muted-foreground">
                {t('noQueryParameters')}
              </p>
            ) : (
              <div className="space-y-2">
                {queryParams.map((param, i) => (
                  <div
                    key={i}
                    className="space-y-1.5 rounded border border-border/50 p-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <Input
                        size="sm"
                        value={param.name}
                        onChange={(e) =>
                          handleQueryParamChange(i, { name: e.target.value })
                        }
                        onBlur={handleQueryParamNameBlur}
                        placeholder={t('paramName')}
                        className="min-w-0 flex-1 font-mono text-[0.65rem]"
                      />
                      <Select
                        value={param.type ?? 'string'}
                        onValueChange={(v) =>
                          handleQueryParamChange(i, {
                            type: v as (typeof VALID_PARAM_TYPES)[number],
                          })
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className="w-24 shrink-0 text-[0.65rem]"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VALID_PARAM_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQueryParam(i)}
                        className="shrink-0"
                        aria-label={t('removeParameter')}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 px-0.5">
                      <Label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={!!param.required}
                          onChange={(e) =>
                            handleQueryParamChange(i, {
                              required: e.target.checked,
                            })
                          }
                          className="size-3"
                        />
                        {t('required')}
                      </Label>
                      <Label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={!!param.allowMultiple}
                          onChange={(e) =>
                            handleQueryParamChange(i, {
                              allowMultiple: e.target.checked,
                            })
                          }
                          className="size-3"
                        />
                        {t('allowMultiple')}
                      </Label>
                    </div>
                    <Input
                      size="sm"
                      value={param.description ?? ''}
                      onChange={(e) =>
                        handleQueryParamChange(i, {
                          description: e.target.value || null,
                        })
                      }
                      placeholder={t('descriptionOptional')}
                    />
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleAddQueryParam}
              className="w-full gap-1"
            >
              <Plus className="size-3" />
              {t('addParameter')}
            </Button>
          </div>

          {method !== 'GET' ? (
            <SchemaReferenceField
              label={t('requestBody')}
              mode={requestBodyMode}
              onModeChange={handleRequestBodyModeChange}
              inlineValue={requestBody}
              onInlineChange={setRequestBody}
              onInlineBlur={handleRequestBodyBlur}
              readOnly={isRequestBodyReadOnly}
              schemaId={requestBodySchemaId}
              schemas={schemas}
              onSchemaSelect={handleRequestBodySchemaChange}
              onSchemaClick={onSchemaClick}
              textareaPlaceholder={t('requestBodyJsonPlaceholder')}
              comboboxLabel={t('requestBodySchema')}
              searchPlaceholder={t('searchSchemas')}
            />
          ) : null}

          <SchemaReferenceField
            label={t('responseShape')}
            mode={responseShapeMode}
            onModeChange={handleResponseShapeModeChange}
            inlineValue={responseShape}
            onInlineChange={setResponseShape}
            onInlineBlur={handleResponseShapeBlur}
            readOnly={isResponseShapeReadOnly}
            schemaId={responseShapeSchemaId}
            schemas={schemas}
            onSchemaSelect={handleResponseShapeSchemaChange}
            onSchemaClick={onSchemaClick}
            textareaPlaceholder={t('responseShapeJsonPlaceholder')}
            comboboxLabel={t('responseShapeSchema')}
            searchPlaceholder={t('searchSchemas')}
          />

          <div className="space-y-1.5">
            <Label>{t('authSchemes')}</Label>
            {authSchemes.length === 0 ? (
              <p className="py-1 text-[0.65rem] text-muted-foreground">
                {t('noAuthSchemesDefined')}
              </p>
            ) : (
              <div className="space-y-0.5">
                {authSchemes.map((scheme) => (
                  <Label key={scheme.id} className="px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={authSchemeIds.includes(scheme.id)}
                      onChange={() => handleAuthSchemeToggle(scheme.id)}
                      className="size-3"
                    />
                    <span className="font-mono text-[0.65rem] text-foreground">
                      {scheme.name}
                    </span>
                    <span className="rounded border border-border px-1 font-mono text-[0.55rem] text-muted-foreground">
                      {scheme.type}
                    </span>
                  </Label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
