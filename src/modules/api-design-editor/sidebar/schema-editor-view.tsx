import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { FieldError } from '@/shared/ui/field'
import { Alert, AlertTitle, AlertDescription } from '@/shared/ui/alert'
import { useToast } from '@/shared/ui/toast'
import { getErrorMessage } from '@/shared/utils/error'
import { MethodBadge } from '@/modules/api-design/endpoints'
import { AlertTriangle } from 'lucide-react'
import { SchemaJsonForm } from './schema-json-form'
import type { ApiDesignSchemaDto } from '@/modules/api-design/schemas'
import type { ApiDesignEndpointDto } from '@/modules/api-design/endpoints'
import { updateSchemaMutationOptions } from '../mutations'
import { useEntityReset } from '../editor/use-entity-reset'
import {
  useOnBlurCommit,
  useOnBlurCommitNullable,
} from '../editor/use-on-blur-commit'

export type SchemaEditorViewProps = {
  apiDesignId: string
  schema: ApiDesignSchemaDto
  endpoints: ApiDesignEndpointDto[]
  onEndpointClick: (resourceId: string, endpointId: string) => void
}

const NON_FORM_FEATURES = [
  'oneOf',
  'anyOf',
  'allOf',
  'not',
  '$ref',
  '$defs',
  'if',
  'then',
  'else',
  'additionalProperties',
  'unevaluatedProperties',
  'propertyNames',
  'contains',
] as const

function detectNonFormFeatures(schema: unknown): string[] {
  const found: string[] = []
  function walk(s: unknown, path: string) {
    if (!s || typeof s !== 'object') return
    const obj = s as Record<string, unknown>
    for (const key of NON_FORM_FEATURES) {
      if (key in obj && !found.includes(key)) found.push(key)
    }
    if (obj.properties && typeof obj.properties === 'object') {
      for (const val of Object.values(
        obj.properties as Record<string, unknown>,
      )) {
        walk(val, path + '.properties')
      }
    }
    if (obj.items && typeof obj.items === 'object') {
      walk(obj.items, path + '.items')
    }
  }
  walk(schema, '')
  return found
}

export function SchemaEditorView({
  apiDesignId,
  schema,
  endpoints,
  onEndpointClick,
}: SchemaEditorViewProps) {
  const t = useTranslations('Editor')
  const updateSchema = useMutation(updateSchemaMutationOptions())
  const toast = useToast()
  const [name, setName] = useState(schema.name)
  const [description, setDescription] = useState(schema.description ?? '')
  const [jsonText, setJsonText] = useState(
    JSON.stringify(schema.jsonSchema, null, 2),
  )
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [mode, setMode] = useState<'raw' | 'form'>('raw')
  const [parsedSchema, setParsedSchema] = useState<Record<string, unknown>>(
    schema.jsonSchema as Record<string, unknown>,
  )
  const [formWarning, setFormWarning] = useState<string | null>(null)
  useEntityReset(schema.id, () => {
    setName(schema.name)
    setDescription(schema.description ?? '')
    const initial = schema.jsonSchema as Record<string, unknown>
    setJsonText(JSON.stringify(initial, null, 2))
    setParsedSchema(initial)
    setJsonError(null)
    setFormWarning(null)
    setMode('raw')
  })

  const callUpdateSchema = async (updates: {
    name?: string
    description?: string | null
    jsonSchema?: unknown
  }) => {
    try {
      await updateSchema.mutateAsync({
        schemaId: schema.id,
        apiDesignId,
        ...updates,
      })
    } catch (err) {
      toast.add({
        title: t('failedUpdateSchema'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  const handleNameBlur = useOnBlurCommit(name, schema.name, (v) => {
    callUpdateSchema({ name: v })
  })

  const handleDescriptionBlur = useOnBlurCommitNullable(
    description,
    schema.description,
    (v) => {
      callUpdateSchema({ description: v })
    },
  )

  const commitSchema = (jsonSchema: unknown) => {
    callUpdateSchema({ jsonSchema })
  }

  const handleRawBlur = () => {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>
      setJsonError(null)
      setParsedSchema(parsed)
      commitSchema(parsed)
    } catch {
      setJsonError(t('invalidJson'))
    }
  }

  const handleFormChange = (updated: Record<string, unknown>) => {
    setParsedSchema(updated)
  }

  const handleFormBlur = () => {
    commitSchema(parsedSchema)
  }

  const handleModeChange = (newMode: 'raw' | 'form') => {
    if (newMode === mode) return
    if (newMode === 'form') {
      try {
        const parsed = JSON.parse(jsonText) as Record<string, unknown>
        setParsedSchema(parsed)
        setJsonError(null)
        const nonForm = detectNonFormFeatures(parsed)
        setFormWarning(
          nonForm.length > 0
            ? `Some schema features (${nonForm.join(', ')}) are not fully editable in form mode. Switch to Raw to edit them.`
            : null,
        )
        setMode('form')
      } catch {
        setJsonError(t('fixJsonErrors'))
      }
    } else {
      setJsonText(JSON.stringify(parsedSchema, null, 2))
      setJsonError(null)
      setFormWarning(null)
      setMode('raw')
    }
  }

  const referencingEndpoints = endpoints.filter(
    (ep) =>
      ep.requestBodySchemaId === schema.id ||
      ep.responseShapeSchemaId === schema.id,
  )

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="overflow-y-auto px-2 py-2">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('name')}</Label>
            <Input
              size="sm"
              aria-label={t('schemaName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameBlur()
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('description')}</Label>
            <Textarea
              aria-label={t('schemaDescription')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t('jsonSchema')}</Label>
              <div className="flex items-center gap-0">
                <Button
                  type="button"
                  variant={mode === 'raw' ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => handleModeChange('raw')}
                  className="rounded-r-none"
                >
                  {t('raw')}
                </Button>
                <Button
                  type="button"
                  variant={mode === 'form' ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => handleModeChange('form')}
                  className="rounded-l-none border-l-0"
                >
                  {t('form')}
                </Button>
              </div>
            </div>

            {mode === 'raw' ? (
              <>
                <Textarea
                  aria-label={t('jsonSchemaContent')}
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value)
                    setJsonError(null)
                  }}
                  onBlur={handleRawBlur}
                  rows={10}
                />
                {jsonError ? <FieldError>{jsonError}</FieldError> : null}
              </>
            ) : (
              <div className="rounded border border-border/50 p-2">
                {formWarning && (
                  <Alert variant="default" className="mb-2 py-1.5 pr-2 pl-2">
                    <AlertTriangle className="size-3 shrink-0" />
                    <AlertTitle>{t('note')}</AlertTitle>
                    <AlertDescription>{formWarning}</AlertDescription>
                  </Alert>
                )}
                <SchemaJsonForm
                  schema={parsedSchema}
                  onChange={handleFormChange}
                  onBlur={handleFormBlur}
                />
              </div>
            )}
          </div>

          {referencingEndpoints.length > 0 ? (
            <div className="space-y-1.5">
              <Label>
                {t('referencedByEndpoints', {
                  count: referencingEndpoints.length,
                })}
              </Label>
              <div className="space-y-0.5">
                {referencingEndpoints.map((ep) => (
                  <Button
                    key={ep.id}
                    variant="ghost"
                    size="xs"
                    className="w-full justify-start"
                    onClick={() => onEndpointClick(ep.resourceId, ep.id)}
                  >
                    <MethodBadge method={ep.method} />
                    <span className="min-w-0 truncate font-mono text-[0.65rem] text-foreground">
                      {ep.path}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
