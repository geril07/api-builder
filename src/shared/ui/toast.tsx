'use client'

import * as React from 'react'
import { Toast } from '@base-ui/react/toast'
import type { ToastObject, ToastManagerAddOptions } from '@base-ui/react/toast'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/utils/cn'
import { XIcon } from 'lucide-react'

const toastManager = Toast.createToastManager()

function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager}>
      {children}
      <ToastViewport />
    </Toast.Provider>
  )
}

function ToastViewport({ className, ...props }: React.ComponentProps<'div'>) {
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Portal>
      <Toast.Viewport
        className={cn(
          'fixed top-4 left-1/2 z-[100] flex w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-2 outline-none',
          className,
        )}
        {...props}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

const toastVariants = cva(
  'group/toast relative grid w-full items-start gap-2 rounded-none border px-3 py-2.5 text-left text-xs shadow-md ring-1 ring-foreground/5 data-open:animate-in data-open:fade-in data-open:slide-in-from-top-2 data-closed:animate-out data-closed:fade-out data-closed:slide-out-to-top-2',
  {
    variants: {
      type: {
        default: 'border-border bg-popover text-popover-foreground',
        success:
          'border-l-4 border-l-primary bg-popover text-popover-foreground',
        error:
          'border-l-4 border-l-destructive bg-popover text-popover-foreground',
        warning:
          'border-l-4 border-l-amber-500 bg-popover text-popover-foreground',
        info: 'border-l-4 border-l-sky-500 bg-popover text-popover-foreground',
      },
    },
    defaultVariants: {
      type: 'default',
    },
  },
)

function ToastItem({ toast }: { toast: ToastObject<object> }) {
  const variant =
    (toast.type as VariantProps<typeof toastVariants>['type']) ?? 'default'

  return (
    <Toast.Root toast={toast} className={cn(toastVariants({ type: variant }))}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-2">
        <div className="grid gap-0.5">
          {toast.title && (
            <Toast.Title className="font-medium text-foreground">
              {toast.title}
            </Toast.Title>
          )}
          {toast.description && (
            <Toast.Description className="text-muted-foreground">
              {toast.description}
            </Toast.Description>
          )}
        </div>
        <Toast.Close className="shrink-0 rounded-none p-0.5 text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-ring focus:outline-none">
          <XIcon className="size-3.5" />
        </Toast.Close>
      </div>
      {toast.actionProps && (
        <Toast.Action className="mt-1 text-xs font-medium text-primary hover:text-primary/80">
          {toast.actionProps.children}
        </Toast.Action>
      )}
    </Toast.Root>
  )
}

function useToast() {
  const tm = Toast.useToastManager()

  const add = React.useCallback(
    (toast: Omit<ToastManagerAddOptions<object>, 'id'> & { id?: string }) => {
      return tm.add(toast)
    },
    [tm],
  )

  const promise = React.useCallback(
    <T,>(
      promise: Promise<T>,
      messages: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: unknown) => string)
      },
    ) => {
      return tm.promise(promise, messages as never)
    },
    [tm],
  )

  const close = React.useCallback((id: string) => tm.close(id), [tm])

  return { add, promise, close }
}

export { ToastProvider, useToast }
