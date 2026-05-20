'use client'

import { type VariantProps } from 'class-variance-authority'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useTranslations } from 'next-intl'

import { cn } from '@/shared/utils/cn'
import { Button, buttonVariants } from '@/shared/ui/button'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: VariantProps<typeof buttonVariants>['variant']
  loading?: boolean
  onConfirm: () => void
  onCancel?: () => void
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'destructive',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useTranslations('Shared')

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal data-slot="confirm-dialog-portal">
        <DialogPrimitive.Backdrop
          data-slot="confirm-dialog-overlay"
          className={cn(
            'fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
          )}
        />
        <DialogPrimitive.Popup
          data-slot="confirm-dialog-content"
          className={cn(
            'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-none bg-popover p-4 text-xs/relaxed text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-[400px] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            'will-change-transform',
          )}
        >
          <div
            data-slot="confirm-dialog-header"
            className="flex flex-col gap-2"
          >
            <DialogPrimitive.Title
              data-slot="confirm-dialog-title"
              className="font-heading text-sm font-medium"
            >
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description
                data-slot="confirm-dialog-description"
                className="text-xs/relaxed text-muted-foreground"
              >
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <div
            data-slot="confirm-dialog-footer"
            className="flex justify-end gap-2"
          >
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => {
                onCancel?.()
                onOpenChange(false)
              }}
            >
              {cancelLabel ?? t('cancel')}
            </Button>
            <Button
              variant={confirmVariant}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel ?? t('confirm')}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { ConfirmDialog }
