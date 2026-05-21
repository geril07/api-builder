import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Combobox,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxContent,
  ComboboxInput,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/shared/ui/combobox'
import { ArrowUpRight } from 'lucide-react'
import type { ApiDesignSchemaDto } from '@/modules/api-design/schemas'

type SchemaReferenceFieldProps = {
  label: string
  mode: 'inline' | 'reference'
  onModeChange: (mode: 'inline' | 'reference') => void
  inlineValue: string
  onInlineChange: (value: string) => void
  onInlineBlur: () => void
  readOnly: boolean
  schemaId: string | null
  schemas: ApiDesignSchemaDto[]
  onSchemaSelect: (schema: ApiDesignSchemaDto | null) => void
  onSchemaClick?: (schemaId: string) => void
  textareaPlaceholder: string
  comboboxLabel: string
  searchPlaceholder: string
}

export function SchemaReferenceField({
  label,
  mode,
  onModeChange,
  inlineValue,
  onInlineChange,
  onInlineBlur,
  readOnly,
  schemaId,
  schemas,
  onSchemaSelect,
  onSchemaClick,
  textareaPlaceholder,
  comboboxLabel,
  searchPlaceholder,
}: SchemaReferenceFieldProps) {
  const t = useTranslations('Editor')

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-0">
          <Button
            type="button"
            variant={mode === 'inline' ? 'default' : 'outline'}
            size="xs"
            onClick={() => onModeChange('inline')}
            className="rounded-r-none"
          >
            {t('inline')}
          </Button>
          <Button
            type="button"
            variant={mode === 'reference' ? 'default' : 'outline'}
            size="xs"
            onClick={() => onModeChange('reference')}
            className="rounded-l-none border-l-0"
          >
            {t('reference')}
          </Button>
        </div>
      </div>
      {mode === 'reference' && (
        <div className="flex items-center gap-1">
          <Combobox
            items={schemas}
            value={schemas.find((s) => s.id === schemaId) ?? null}
            onValueChange={onSchemaSelect}
            isItemEqualToValue={(a, b) => b != null && a.id === b.id}
            itemToStringLabel={(s) => s.name}
          >
            <ComboboxTrigger aria-label={comboboxLabel} className="flex-1">
              <ComboboxValue placeholder={t('selectSchema')} />
            </ComboboxTrigger>
            <ComboboxContent>
              <ComboboxInput
                placeholder={searchPlaceholder}
                showTrigger={false}
              />
              <ComboboxList>
                {(schema: ApiDesignSchemaDto) => (
                  <ComboboxItem key={schema.id} value={schema}>
                    {schema.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
              <ComboboxEmpty>{t('noSchemasFound')}</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
          {schemaId && onSchemaClick && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onSchemaClick(schemaId!)}
              aria-label={t('openSchemaInEditor')}
            >
              <ArrowUpRight className="size-3" />
            </Button>
          )}
        </div>
      )}
      {mode !== 'reference' && (
        <Textarea
          aria-label={label}
          value={inlineValue}
          onChange={(e) => onInlineChange(e.target.value)}
          onBlur={onInlineBlur}
          readOnly={readOnly}
          rows={5}
          placeholder={textareaPlaceholder}
        />
      )}
    </div>
  )
}
