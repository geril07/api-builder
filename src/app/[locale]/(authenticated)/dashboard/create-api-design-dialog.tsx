'use client'

import { useState, useRef, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/shared/i18n/routing'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { Input } from '@/shared/ui/input'
import { Alert, AlertDescription } from '@/shared/ui/alert'

import { orpcClient } from '@/shared/orpc/client'

export function CreateApiDesignDialog() {
  const router = useRouter()
  const t = useTranslations('Dashboard')
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const resetState = () => {
    setError(null)
    formRef.current?.reset()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = String(formData.get('name') ?? '').trim()

    if (!name) {
      setError(t('nameRequired'))
      return
    }

    startTransition(async () => {
      try {
        const result = await orpcClient.apiDesign.create({ name })
        setIsOpen(false)
        router.push(`/api-designs/${result.id}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : t('failedToCreateDesign'))
      }
    })
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      onOpenChangeComplete={(open) => {
        if (!open) resetState()
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            {t('newApiDesign')}
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('nameYourDesign')}</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit}>
          <Label className="block font-mono font-medium" htmlFor="name">
            {t('name')}
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            maxLength={120}
            className="mt-2"
          />
          {error ? (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter showCloseButton>
            <Button type="submit" className="font-mono" loading={isPending}>
              {t('createDesign')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
