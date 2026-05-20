'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Copy, Download } from 'lucide-react'

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
import { useToast } from '@/shared/ui/toast'
import { getErrorMessage } from '@/shared/utils/error'
import { cn } from '@/shared/utils/cn'

import { orpcTQ } from '@/shared/orpc/client'

type ExportDialogProps = {
  apiDesignId: string
}

export function ExportDialog({ apiDesignId }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [format, setFormat] = useState<'json' | 'yaml'>('yaml')
  const [content, setContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const exportApiDesign = useMutation(
    orpcTQ.apiDesign.export.export.mutationOptions(),
  )
  const toast = useToast()
  const t = useTranslations('Editor')

  const resetState = () => {
    setContent(null)
    setCopied(false)
  }

  const handleGenerate = async () => {
    setCopied(false)

    try {
      const result = await exportApiDesign.mutateAsync({ apiDesignId, format })
      setContent(result)
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
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
      const ext = format === 'yaml' ? 'yaml' : 'json'
      const mime = format === 'yaml' ? 'application/x-yaml' : 'application/json'
      const blob = new Blob([content], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `openapi.${ext}`
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
            {t('openapiExport')}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            {t('exportDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Label htmlFor="export-format">{t('format')}</Label>
          <div className="flex border border-border">
            <Button
              type="button"
              onClick={() => setFormat('yaml')}
              variant={format === 'yaml' ? 'default' : 'outline'}
              className={cn('px-3 py-1.5')}
            >
              {t('yaml')}
            </Button>
            <Button
              type="button"
              onClick={() => setFormat('json')}
              variant={format === 'json' ? 'default' : 'outline'}
              className={cn('border-l-0 px-3 py-1.5')}
            >
              {t('json')}
            </Button>
          </div>
        </div>

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
