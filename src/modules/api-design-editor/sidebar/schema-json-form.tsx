import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui/select'
import { Plus, Trash2, ChevronRight, ChevronDown, Asterisk } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

type JsonSchema = Record<string, unknown>

type SchemaJsonFormProps = {
  schema: JsonSchema
  onChange: (schema: JsonSchema) => void
  onBlur: () => void
}

const SCHEMA_TYPES = [
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
] as const

function getStringFormats(t: (key: string) => string) {
  return [
    { value: '', label: t('none') },
    { value: 'uuid', label: t('uuid') },
    { value: 'email', label: t('email') },
    { value: 'date', label: t('date') },
    { value: 'date-time', label: t('dateTime') },
    { value: 'uri', label: t('uri') },
    { value: 'uri-template', label: t('uriTemplate') },
    { value: 'ipv4', label: t('ipv4') },
    { value: 'ipv6', label: t('ipv6') },
    { value: 'hostname', label: t('hostname') },
    { value: 'byte', label: t('byte') },
    { value: 'binary', label: t('binary') },
    { value: 'password', label: t('password') },
  ] as const
}

function getType(schema: JsonSchema): string {
  if (typeof schema.type === 'string') return schema.type
  return 'object'
}

function getProperties(
  schema: JsonSchema,
): { name: string; schema: JsonSchema; required: boolean }[] {
  const props = schema.properties
  if (!props || typeof props !== 'object') return []
  const required: string[] = Array.isArray(schema.required)
    ? schema.required.filter((r): r is string => typeof r === 'string')
    : []
  return Object.entries(props).map(([name, value]) => ({
    name,
    schema: (value && typeof value === 'object' ? value : {}) as JsonSchema,
    required: required.includes(name),
  }))
}

function setSchemaValue(
  schema: JsonSchema,
  key: string,
  value: unknown,
): JsonSchema {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    const rest = { ...schema }
    delete rest[key]
    return rest
  }
  return { ...schema, [key]: value }
}

function getNumber(schema: JsonSchema, key: string): string {
  const val = schema[key]
  return typeof val === 'number' ? String(val) : ''
}

function getBool(schema: JsonSchema, key: string): boolean {
  return schema[key] === true
}

function getString(schema: JsonSchema, key: string): string {
  const val = schema[key]
  return typeof val === 'string' ? val : ''
}

function getEnum(schema: JsonSchema): string {
  const val = schema.enum
  if (Array.isArray(val)) return val.map(String).join(', ')
  return ''
}

export function SchemaJsonForm({
  schema,
  onChange,
  onBlur,
}: SchemaJsonFormProps) {
  const t = useTranslations('Editor')
  const type = getType(schema)

  const handleTypeChange = (newType: string | null) => {
    if (!newType) return
    const base: JsonSchema = { ...schema, type: newType }
    if (newType !== 'object') delete base.properties
    if (newType !== 'object') delete base.required
    if (newType !== 'array') delete base.items
    if (newType !== 'array') {
      delete base.minItems
      delete base.maxItems
      delete base.uniqueItems
    }
    if (newType !== 'string') {
      delete base.format
      delete base.minLength
      delete base.maxLength
      delete base.pattern
      delete base.enum
    }
    if (newType !== 'number' && newType !== 'integer') {
      delete base.minimum
      delete base.maximum
      delete base.exclusiveMinimum
      delete base.exclusiveMaximum
      delete base.multipleOf
    }
    onChange(base)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>{t('properties')}</Label>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger size="sm" aria-label={t('type')} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCHEMA_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === 'object' && (
        <ObjectPropertiesEditor
          schema={schema}
          onChange={onChange}
          onBlur={onBlur}
        />
      )}

      {type === 'array' && (
        <ArrayItemsEditor
          schema={schema}
          onChange={onChange}
          onBlur={onBlur}
          t={t}
        />
      )}

      {type === 'string' && (
        <StringConstraintsEditor
          schema={schema}
          onChange={onChange}
          onBlur={onBlur}
          t={t}
        />
      )}

      {(type === 'number' || type === 'integer') && (
        <NumberConstraintsEditor
          schema={schema}
          onChange={onChange}
          onBlur={onBlur}
          t={t}
        />
      )}

      <CommonConstraintsEditor
        schema={schema}
        onChange={onChange}
        onBlur={onBlur}
        t={t}
      />
    </div>
  )
}

function ObjectPropertiesEditor({
  schema,
  onChange,
  onBlur,
}: {
  schema: JsonSchema
  onChange: (schema: JsonSchema) => void
  onBlur: () => void
}) {
  const t = useTranslations('Editor')
  const properties = getProperties(schema)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggleExpanded = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const updateProperties = (
    newProperties: { name: string; schema: JsonSchema; required: boolean }[],
  ) => {
    const propsRecord: Record<string, JsonSchema> = {}
    const required: string[] = []
    for (const p of newProperties) {
      if (p.name) {
        propsRecord[p.name] = p.schema
        if (p.required) required.push(p.name)
      }
    }
    onChange({
      ...schema,
      properties: propsRecord,
      required: required.length > 0 ? required : undefined,
    })
  }

  const handleAdd = () => {
    const newProperties = [
      ...properties,
      { name: '', schema: { type: 'string' } as JsonSchema, required: false },
    ]
    updateProperties(newProperties)
  }

  const handleRemove = (index: number) => {
    const newProperties = properties.filter((_, i) => i !== index)
    updateProperties(newProperties)
  }

  const handlePropertyChange = (
    index: number,
    updates: Partial<{ name: string; schema: JsonSchema; required: boolean }>,
  ) => {
    const prop = properties[index]
    if (!prop) return
    const updatedSchema = updates.schema ?? prop.schema
    const updatedName = updates.name ?? prop.name
    const newProperties = properties.map((p, i) => {
      if (i !== index) return p
      return {
        name: updatedName,
        schema: updatedSchema,
        required: updates.required ?? p.required,
      }
    })
    updateProperties(newProperties)
  }

  return (
    <div className="space-y-1.5">
      <Label>{t('type')}</Label>
      {properties.length === 0 ? (
        <p className="py-1 text-[0.65rem] text-muted-foreground">
          {t('noPropertiesDefined')}
        </p>
      ) : (
        <div className="space-y-1">
          {properties.map((prop, i) => (
            <PropertyRow
              key={i}
              property={prop}
              index={i}
              t={t}
              expanded={expanded.has(i)}
              onToggleExpand={() => toggleExpanded(i)}
              onChange={(updates) => handlePropertyChange(i, updates)}
              onRemove={() => handleRemove(i)}
              onBlur={onBlur}
            />
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={handleAdd}
        className="w-full gap-1"
      >
        <Plus className="size-3" />
        {t('addProperty')}
      </Button>
    </div>
  )
}

function PropertyRow({
  property,
  index: _index,
  expanded,
  onToggleExpand,
  onChange,
  onRemove,
  onBlur,
  t,
}: {
  property: { name: string; schema: JsonSchema; required: boolean }
  index: number
  expanded: boolean
  onToggleExpand: () => void
  onChange: (
    updates: Partial<{ name: string; schema: JsonSchema; required: boolean }>,
  ) => void
  onRemove: () => void
  onBlur: () => void
  t: (key: string) => string
}) {
  const propType = getType(property.schema)
  const isExpandable = propType === 'object' || propType === 'array'

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ name: e.target.value })
  }

  const handleTypeChange = (newType: string | null) => {
    if (!newType) return
    const base: JsonSchema = { ...property.schema, type: newType }
    if (newType !== 'object') delete base.properties
    if (newType !== 'object') delete base.required
    if (newType !== 'array') delete base.items
    onChange({ schema: base })
  }

  const handleRequiredToggle = () => {
    onChange({ required: !property.required })
  }

  return (
    <div className="rounded border border-border/50">
      <div className="flex items-center gap-1 p-1.5">
        <button
          type="button"
          onClick={handleRequiredToggle}
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded',
            property.required
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-muted-foreground/40 hover:text-muted-foreground/60',
          )}
          title={property.required ? t('required') : t('optional')}
        >
          <Asterisk className="size-3" />
        </button>
        {isExpandable ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <Input
          size="sm"
          value={property.name}
          onChange={handleNameChange}
          onBlur={onBlur}
          placeholder="name"
          className="h-6 min-w-0 flex-1 px-1.5 py-0 text-[0.65rem]"
        />
        <Select value={propType} onValueChange={handleTypeChange}>
          <SelectTrigger
            size="sm"
            aria-label="Property type"
            className="h-6 w-14 px-1 text-[0.6rem]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCHEMA_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={onRemove}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
      {expanded && (
        <div className="border-t border-border/50 p-2 pt-2">
          <div className="space-y-2 pl-3">
            {propType === 'object' && (
              <ObjectPropertiesEditor
                schema={property.schema}
                onChange={(s) => onChange({ schema: s })}
                onBlur={onBlur}
              />
            )}
            {propType === 'array' && (
              <ArrayItemsEditor
                schema={property.schema}
                onChange={(s) => onChange({ schema: s })}
                onBlur={onBlur}
                t={t}
              />
            )}
            {propType === 'string' && (
              <StringConstraintsEditor
                schema={property.schema}
                onChange={(s) => onChange({ schema: s })}
                onBlur={onBlur}
                t={t}
              />
            )}
            {(propType === 'number' || propType === 'integer') && (
              <NumberConstraintsEditor
                schema={property.schema}
                onChange={(s) => onChange({ schema: s })}
                onBlur={onBlur}
                t={t}
              />
            )}
            <CommonConstraintsEditor
              schema={property.schema}
              onChange={(s) => onChange({ schema: s })}
              onBlur={onBlur}
              t={t}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ArrayItemsEditor({
  schema,
  onChange,
  onBlur,
  t,
}: {
  schema: JsonSchema
  onChange: (schema: JsonSchema) => void
  onBlur: () => void
  t: (key: string) => string
}) {
  const items = schema.items as JsonSchema | undefined
  const itemType = items ? getType(items) : 'string'

  const handleItemTypeChange = (newType: string | null) => {
    if (!newType) return
    const base: JsonSchema = items
      ? { ...items, type: newType }
      : { type: newType }
    if (newType !== 'object') delete base.properties
    if (newType !== 'object') delete base.required
    if (newType !== 'array') delete base.items
    onChange({ ...schema, items: base })
  }

  const handleItemsChange = (newItems: JsonSchema) => {
    onChange({ ...schema, items: newItems })
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label>{t('itemsType')}</Label>
        <Select value={itemType} onValueChange={handleItemTypeChange}>
          <SelectTrigger
            size="sm"
            aria-label={t('itemsType')}
            className="w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCHEMA_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {items && itemType === 'object' && (
        <div className="pl-2">
          <ObjectPropertiesEditor
            schema={items}
            onChange={handleItemsChange}
            onBlur={onBlur}
          />
        </div>
      )}
      {items && itemType === 'string' && (
        <div className="pl-2">
          <StringConstraintsEditor
            schema={items}
            onChange={handleItemsChange}
            onBlur={onBlur}
            t={t}
          />
        </div>
      )}
      {(itemType === 'number' || itemType === 'integer') && (
        <div className="pl-2">
          <NumberConstraintsEditor
            schema={items ?? {}}
            onChange={(s) => onChange({ ...schema, items: s })}
            onBlur={onBlur}
            t={t}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[0.6rem]">{t('minItems')}</Label>
          <Input
            size="sm"
            type="number"
            value={getNumber(schema, 'minItems')}
            onChange={(e) =>
              onChange(
                setSchemaValue(
                  schema,
                  'minItems',
                  e.target.value ? Number(e.target.value) : undefined,
                ),
              )
            }
            onBlur={onBlur}
            className="h-6 text-[0.65rem]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[0.6rem]">{t('maxItems')}</Label>
          <Input
            size="sm"
            type="number"
            value={getNumber(schema, 'maxItems')}
            onChange={(e) =>
              onChange(
                setSchemaValue(
                  schema,
                  'maxItems',
                  e.target.value ? Number(e.target.value) : undefined,
                ),
              )
            }
            onBlur={onBlur}
            className="h-6 text-[0.65rem]"
          />
        </div>
      </div>
    </div>
  )
}

function StringConstraintsEditor({
  schema,
  onChange,
  onBlur,
  t,
}: {
  schema: JsonSchema
  onChange: (schema: JsonSchema) => void
  onBlur: () => void
  t: (key: string) => string
}) {
  const [showAdvanced, setShowAdvanced] = useState(
    !!schema.minLength ||
      !!schema.maxLength ||
      !!schema.pattern ||
      !!schema.enum,
  )

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label>{t('format')}</Label>
        <Select
          value={getString(schema, 'format')}
          onValueChange={(v) =>
            onChange(setSchemaValue(schema, 'format', v || undefined))
          }
        >
          <SelectTrigger size="sm" aria-label={t('format')} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getStringFormats(t).map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>{t('enumValues')}</Label>
        <Input
          size="sm"
          value={getEnum(schema)}
          onChange={(e) => {
            const vals = e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
            onChange(
              setSchemaValue(
                schema,
                'enum',
                vals.length > 0 ? vals : undefined,
              ),
            )
          }}
          onBlur={onBlur}
          placeholder={t('enumPlaceholder')}
          className="h-6 text-[0.65rem]"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-[0.6rem] text-muted-foreground hover:text-foreground"
      >
        {showAdvanced ? (
          <ChevronDown className="size-2.5" />
        ) : (
          <ChevronRight className="size-2.5" />
        )}
        {t('constraints')}
      </button>

      {showAdvanced && (
        <div className="space-y-2 pl-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[0.6rem]">{t('minLength')}</Label>
              <Input
                size="sm"
                type="number"
                value={getNumber(schema, 'minLength')}
                onChange={(e) =>
                  onChange(
                    setSchemaValue(
                      schema,
                      'minLength',
                      e.target.value ? Number(e.target.value) : undefined,
                    ),
                  )
                }
                onBlur={onBlur}
                className="h-6 text-[0.65rem]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.6rem]">{t('maxLength')}</Label>
              <Input
                size="sm"
                type="number"
                value={getNumber(schema, 'maxLength')}
                onChange={(e) =>
                  onChange(
                    setSchemaValue(
                      schema,
                      'maxLength',
                      e.target.value ? Number(e.target.value) : undefined,
                    ),
                  )
                }
                onBlur={onBlur}
                className="h-6 text-[0.65rem]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[0.6rem]">{t('pattern')}</Label>
            <Input
              size="sm"
              value={getString(schema, 'pattern')}
              onChange={(e) =>
                onChange(
                  setSchemaValue(
                    schema,
                    'pattern',
                    e.target.value || undefined,
                  ),
                )
              }
              onBlur={onBlur}
              placeholder={t('patternPlaceholder')}
              className="h-6 font-mono text-[0.65rem]"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function NumberConstraintsEditor({
  schema,
  onChange,
  onBlur,
  t,
}: {
  schema: JsonSchema
  onChange: (schema: JsonSchema) => void
  onBlur: () => void
  t: (key: string) => string
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[0.6rem]">{t('minimum')}</Label>
          <Input
            size="sm"
            type="number"
            value={getNumber(schema, 'minimum')}
            onChange={(e) =>
              onChange(
                setSchemaValue(
                  schema,
                  'minimum',
                  e.target.value ? Number(e.target.value) : undefined,
                ),
              )
            }
            onBlur={onBlur}
            className="h-6 text-[0.65rem]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[0.6rem]">{t('maximum')}</Label>
          <Input
            size="sm"
            type="number"
            value={getNumber(schema, 'maximum')}
            onChange={(e) =>
              onChange(
                setSchemaValue(
                  schema,
                  'maximum',
                  e.target.value ? Number(e.target.value) : undefined,
                ),
              )
            }
            onBlur={onBlur}
            className="h-6 text-[0.65rem]"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[0.6rem]">{t('multipleOf')}</Label>
        <Input
          size="sm"
          type="number"
          value={getNumber(schema, 'multipleOf')}
          onChange={(e) =>
            onChange(
              setSchemaValue(
                schema,
                'multipleOf',
                e.target.value ? Number(e.target.value) : undefined,
              ),
            )
          }
          onBlur={onBlur}
          className="h-6 text-[0.65rem]"
        />
      </div>
    </div>
  )
}

function CommonConstraintsEditor({
  schema,
  onChange,
  onBlur,
  t,
}: {
  schema: JsonSchema
  onChange: (schema: JsonSchema) => void
  onBlur: () => void
  t: (key: string) => string
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={getBool(schema, 'nullable')}
          onChange={(e) =>
            onChange(
              setSchemaValue(schema, 'nullable', e.target.checked || undefined),
            )
          }
          onBlur={onBlur}
          className="size-3"
        />
        <span className="text-[0.6rem] text-muted-foreground">
          {t('nullable')}
        </span>
      </label>
    </div>
  )
}
