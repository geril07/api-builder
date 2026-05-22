'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Copy, Download, ChevronDown } from 'lucide-react'

import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/ui/dropdown-menu'
import { useToast } from '@/shared/ui/toast'
import { getErrorMessage } from '@/shared/utils/error'
import { cn } from '@/shared/utils/cn'

import { orpcTQ } from '@/shared/orpc/client'

type ExportType = 'openapi' | 'postman'

type ExportDialogProps = {
  apiDesignId: string
}

export function ExportDialog({ apiDesignId }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportType, setExportType] = useState<ExportType>('openapi')
  const [openapiFormat, setOpenapiFormat] = useState<'json' | 'yaml'>('yaml')
  const [openapiContent, setOpenapiContent] = useState<string | null>(null)
  const [openapiCopied, setOpenapiCopied] = useState(false)
  const [postmanContent, setPostmanContent] = useState<string | null>(null)
  const [postmanCopied, setPostmanCopied] = useState(false)
  const exportApiDesign = useMutation(
    orpcTQ.apiDesign.export.export.mutationOptions(),
  )
  const toast = useToast()
  const t = useTranslations('Editor')

  const content = exportType === 'openapi' ? openapiContent : postmanContent
  const copied = exportType === 'openapi' ? openapiCopied : postmanCopied

  const resetState = () => {
    setOpenapiContent(null)
    setOpenapiCopied(false)
    setPostmanContent(null)
    setPostmanCopied(false)
  }

  const handleGenerate = async () => {
    if (exportType === 'openapi') {
      setOpenapiCopied(false)
    } else {
      setPostmanCopied(false)
    }

    try {
      const params =
        exportType === 'openapi'
          ? ({ apiDesignId, format: openapiFormat } as const)
          : ({ apiDesignId, format: 'postman' } as const)

      const result = await exportApiDesign.mutateAsync(params)

      if (exportType === 'openapi') {
        setOpenapiContent(result)
      } else {
        setPostmanContent(result)
      }
    } catch (e) {
      toast.add({
        title: t('failed'),
        description: getErrorMessage(e),
        type: 'error',
      })
    }
  }

  const handleCopy = async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      if (exportType === 'openapi') {
        setOpenapiCopied(true)
        setTimeout(() => setOpenapiCopied(false), 2000)
      } else {
        setPostmanCopied(true)
        setTimeout(() => setPostmanCopied(false), 2000)
      }
    } catch {
      toast.add({
        title: t('failed'),
        type: 'error',
      })
    }
  }

  const handleDownload = () => {
    if (!content) return
    try {
      let filename: string
      let mime: string

      if (exportType === 'openapi') {
        const ext = openapiFormat === 'yaml' ? 'yaml' : 'json'
        filename = `openapi.${ext}`
        mime =
          openapiFormat === 'yaml' ? 'application/x-yaml' : 'application/json'
      } else {
        filename = 'postman-collection.json'
        mime = 'application/json'
      }

      const blob = new Blob([content], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.add({
        title: t('failed'),
        type: 'error',
      })
    }
  }

  const typeLabel =
    exportType === 'openapi' ? t('openapi') : t('postmanCollection')

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      onOpenChangeComplete={(open) => {
        if (!open) resetState()
      }}
    >
      <DialogTrigger render={<Button className="gap-2" />}>
        {t('exportDesign')}
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,44rem)]">
        <DialogHeader>
          <DialogTitle className="font-mono text-2xl font-semibold tracking-tight">
            {exportType === 'openapi' ? t('openapiExport') : t('postmanExport')}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            {exportType === 'openapi'
              ? t('exportDescription')
              : t('postmanExportDescription')}
          </DialogDescription>
        </DialogHeader>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" className="justify-between gap-2">
                <span>{typeLabel}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent align="start" sideOffset={4}>
            <DropdownMenuItem onClick={() => setExportType('openapi')}>
              {t('openapi')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExportType('postman')}>
              {t('postmanCollection')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {exportType === 'openapi' ? (
          <div className="flex items-center gap-3">
            <Label htmlFor="export-format">{t('format')}</Label>
            <div className="flex border border-border">
              <Button
                type="button"
                onClick={() => setOpenapiFormat('yaml')}
                variant={openapiFormat === 'yaml' ? 'default' : 'outline'}
                className={cn('px-3 py-1.5')}
              >
                {t('yaml')}
              </Button>
              <Button
                type="button"
                onClick={() => setOpenapiFormat('json')}
                variant={openapiFormat === 'json' ? 'default' : 'outline'}
                className={cn('border-l-0 px-3 py-1.5')}
              >
                {t('json')}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleGenerate}
            loading={exportApiDesign.isPending}
          >
            {t('generate')}
          </Button>
        </div>

        {content ? (
          <div className="min-w-0 space-y-3">
            <pre className="max-h-[60vh] overflow-auto border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed whitespace-pre text-foreground">
              {content}
            </pre>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={handleCopy}
              >
                <Copy className="size-3.5" />
                {copied ? t('copied') : t('copy')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={handleDownload}
              >
                <Download className="size-3.5" />
                {t('download')}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
