import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Label } from '@/shared/ui/label'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { FieldError } from '@/shared/ui/field'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui/select'
import { useToast } from '@/shared/ui/toast'
import { getErrorMessage } from '@/shared/utils/error'
import type { ApiDesignAuthSchemeDto } from '@/modules/api-design/auth-schemes'
import { updateAuthSchemeMutationOptions } from '../mutations'

const AUTH_TYPES = ['bearer', 'apiKey', 'oauth2', 'openIdConnect'] as const

export type AuthSchemeEditorViewProps = {
  apiDesignId: string
  authScheme: ApiDesignAuthSchemeDto
}

export function AuthSchemeEditorView({
  apiDesignId,
  authScheme,
}: AuthSchemeEditorViewProps) {
  const t = useTranslations('Editor')
  const updateAuthScheme = useMutation(updateAuthSchemeMutationOptions())
  const toast = useToast()
  const [name, setName] = useState(authScheme.name)
  const [type, setType] = useState<(typeof AUTH_TYPES)[number]>('bearer')
  const [configText, setConfigText] = useState(
    JSON.stringify(authScheme.config, null, 2),
  )
  const [configError, setConfigError] = useState<string | null>(null)
  const prevId = useRef(authScheme.id)

  useEffect(() => {
    if (prevId.current !== authScheme.id) {
      prevId.current = authScheme.id
      setName(authScheme.name)
      setType(authScheme.type as (typeof AUTH_TYPES)[number])
      setConfigText(JSON.stringify(authScheme.config, null, 2))
      setConfigError(null)
    }
  }, [authScheme.id, authScheme.name, authScheme.type, authScheme.config])

  const callUpdateAuthScheme = async (updates: {
    name?: string
    type?: 'bearer' | 'apiKey' | 'oauth2' | 'openIdConnect'
    config?: unknown
  }) => {
    try {
      await updateAuthScheme.mutateAsync({
        authSchemeId: authScheme.id,
        apiDesignId,
        ...updates,
      })
    } catch (err) {
      toast.add({
        title: t('failedUpdateAuthScheme'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  const handleNameBlur = () => {
    const trimmed = name.trim()
    if (trimmed !== authScheme.name && trimmed) {
      callUpdateAuthScheme({ name: trimmed })
    }
  }

  const handleTypeChange = (newType: (typeof AUTH_TYPES)[number]) => {
    if (newType !== authScheme.type) {
      setType(newType)
      callUpdateAuthScheme({ type: newType })
    }
  }

  const handleConfigBlur = () => {
    try {
      const parsed = JSON.parse(configText)
      setConfigError(null)
      callUpdateAuthScheme({ config: parsed })
    } catch {
      setConfigError(t('invalidJson'))
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="overflow-y-auto px-2 py-2">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('authSchemeName')}</Label>
            <Input
              size="sm"
              aria-label={t('authSchemeName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameBlur()
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('type')}</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                if (v == null) return
                handleTypeChange(v as (typeof AUTH_TYPES)[number])
              }}
            >
              <SelectTrigger size="sm" aria-label={t('authSchemeType')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTH_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('config')}</Label>
            <Textarea
              aria-label={t('authSchemeConfig')}
              value={configText}
              onChange={(e) => {
                setConfigText(e.target.value)
                setConfigError(null)
              }}
              onBlur={handleConfigBlur}
              rows={6}
            />
            {configError ? <FieldError>{configError}</FieldError> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
