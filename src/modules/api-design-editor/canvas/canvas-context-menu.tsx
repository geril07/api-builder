import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useReactFlow } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/ui/toast'
import { getErrorMessage } from '@/shared/utils/error'
import {
  createResourceMutationOptions,
  createSchemaMutationOptions,
  createAuthSchemeMutationOptions,
} from '../mutations'

type CanvasContextMenuProps = {
  apiDesignId: string
  isOpen: boolean
  position: { x: number; y: number }
  onClose: () => void
  onAutoLayout: () => void
}

export function CanvasContextMenu({
  apiDesignId,
  isOpen,
  position,
  onClose,
  onAutoLayout,
}: CanvasContextMenuProps) {
  const reactFlowInstance = useReactFlow()
  const toast = useToast()
  const t = useTranslations('Editor')

  const createResource = useMutation(createResourceMutationOptions())
  const createSchema = useMutation(createSchemaMutationOptions())
  const createAuthScheme = useMutation(createAuthSchemeMutationOptions())

  useEffect(() => {
    if (!isOpen) return

    const handleDismiss = (e: Event) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).key === 'Escape') {
        onClose()
      }
      if (e.type === 'mousedown') {
        onClose()
      }
    }

    window.addEventListener('mousedown', handleDismiss)
    window.addEventListener('keydown', handleDismiss)
    return () => {
      window.removeEventListener('mousedown', handleDismiss)
      window.removeEventListener('keydown', handleDismiss)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const createAtMouse = () =>
    reactFlowInstance.screenToFlowPosition({ x: position.x, y: position.y })

  const handleAddResource = async () => {
    onClose()
    const pos = createAtMouse()
    try {
      await createResource.mutateAsync({
        apiDesignId,
        name: t('newResource'),
        positionX: Math.round(pos.x),
        positionY: Math.round(pos.y),
      })
    } catch (err) {
      toast.add({
        title: t('failedCreateResource'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  const handleAddSchema = async () => {
    onClose()
    const pos = createAtMouse()
    try {
      await createSchema.mutateAsync({
        apiDesignId,
        name: t('newSchema'),
        jsonSchema: {},
        positionX: Math.round(pos.x),
        positionY: Math.round(pos.y),
      })
    } catch (err) {
      toast.add({
        title: t('failedCreateSchema'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  const handleAddAuthScheme = async () => {
    onClose()
    const pos = createAtMouse()
    try {
      await createAuthScheme.mutateAsync({
        apiDesignId,
        name: t('newAuthScheme'),
        type: 'bearer',
        config: {},
        positionX: Math.round(pos.x),
        positionY: Math.round(pos.y),
      })
    } catch (err) {
      toast.add({
        title: t('failedCreateAuthScheme'),
        description: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  return (
    <div
      className="fixed z-50 min-w-44 border border-border bg-popover p-1 font-mono text-xs text-popover-foreground shadow-lg"
      style={{ left: position.x, top: position.y }}
      role="menu"
    >
      <Button
        variant="ghost"
        className="w-full justify-start"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleAddResource}
      >
        {t('addResource')}
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleAddSchema}
      >
        {t('addSchema')}
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleAddAuthScheme}
      >
        {t('addAuthScheme')}
      </Button>
      <div className="my-1 border-t border-border" />
      <Button
        variant="ghost"
        className="w-full justify-start"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => {
          onClose()
          onAutoLayout()
        }}
      >
        {t('autoLayout')}
      </Button>
    </div>
  )
}
