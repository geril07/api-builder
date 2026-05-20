'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/shared/i18n/routing'
import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/ui/toast'
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
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { getErrorMessage } from '@/shared/utils/error'

import { orpcTQ } from '@/shared/orpc/client'

type ApiDesignActionsProps = {
  apiDesign: {
    id: string
    name: string
  }
}

export function ApiDesignActions({ apiDesign }: ApiDesignActionsProps) {
  const router = useRouter()
  const t = useTranslations('Dashboard')
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const toast = useToast()

  const renameMutation = useMutation(orpcTQ.apiDesign.rename.mutationOptions())

  const deleteMutation = useMutation(orpcTQ.apiDesign.delete.mutationOptions())

  const handleRenameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setRenameError(null)

    const formData = new FormData(e.currentTarget)
    const name = String(formData.get('name') ?? '').trim()

    if (!name) {
      setRenameError(t('nameRequired'))
      return
    }

    try {
      await renameMutation.mutateAsync({ apiDesignId: apiDesign.id, name })
      setIsRenameOpen(false)
      router.refresh()
    } catch (e) {
      setRenameError(getErrorMessage(e))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ apiDesignId: apiDesign.id })
      setIsDeleteOpen(false)
      router.refresh()
    } catch (e) {
      toast.add({
        title: t('failedToDeleteDesign'),
        description: getErrorMessage(e),
        type: 'error',
      })
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogTrigger
          render={
            <Button type="button" variant="ghost" size="sm" className="gap-1">
              <Pencil className="size-3.5" />
              {t('rename')}
            </Button>
          }
        />

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('renameDesign')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRenameSubmit}>
            <Label className="block" htmlFor={`name-${apiDesign.id}`}>
              {t('name')}
            </Label>
            <Input
              id={`name-${apiDesign.id}`}
              name="name"
              type="text"
              required
              autoFocus
              defaultValue={apiDesign.name}
              maxLength={120}
              className="mt-2"
            />
            {renameError ? (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{renameError}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter showCloseButton>
              <Button type="submit" loading={renameMutation.isPending}>
                {t('renameConfirm')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button
        type="button"
        variant="ghost-destructive"
        size="sm"
        className="gap-1"
        onClick={() => setIsDeleteOpen(true)}
      >
        <Trash2 className="size-3.5" />
        {t('delete')}
      </Button>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t('deleteQuestion', { name: apiDesign.name })}
        description={t('deleteWarning', { name: apiDesign.name })}
        confirmLabel={t('deleteConfirm')}
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
