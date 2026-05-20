'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'
import { Canvas } from './canvas'
import { FlatEditor } from './flat/flat-editor'
import {
  type EditorMode,
  type FlatTab,
  parseEditorMode,
  parseFlatTab,
} from './mode'
import { useEditorSelection } from './selection'

type ApiDesignEditorProps = {
  apiDesignId: string
}

export function ApiDesignEditor({ apiDesignId }: ApiDesignEditorProps) {
  const searchParams = useSearchParams()
  const mode = parseEditorMode(searchParams.get('mode'))
  const flatTab = parseFlatTab(searchParams.get('tab'))
  const selection = useEditorSelection()

  const setParam = (updates: { mode?: EditorMode; tab?: FlatTab }) => {
    const url = new URL(window.location.href)
    const next = new URLSearchParams(url.search)
    if (updates.mode) next.set('mode', updates.mode)
    if (updates.tab) next.set('tab', updates.tab)
    url.search = next.toString()
    window.history.replaceState(null, '', url.toString())
  }

  const et = useTranslations('Editor')

  const modeControl = (
    <div className="flex items-center gap-1 border border-border bg-card p-0.5">
      <span className="px-1.5 font-mono text-[0.65rem] text-muted-foreground">
        {et('mode')}
      </span>
      <ModeButton
        active={mode === 'canvas'}
        onClick={() => setParam({ mode: 'canvas' })}
      >
        {et('canvas')}
      </ModeButton>
      <ModeButton
        active={mode === 'flat'}
        onClick={() => setParam({ mode: 'flat' })}
      >
        {et('flat')}
      </ModeButton>
    </div>
  )

  if (mode === 'flat') {
    return (
      <FlatEditor
        apiDesignId={apiDesignId}
        activeTab={flatTab}
        onTabChange={(tab) => setParam({ tab })}
        selection={selection}
        modeControl={modeControl}
      />
    )
  }

  return (
    <Canvas
      apiDesignId={apiDesignId}
      selection={selection}
      modeControl={modeControl}
    />
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      className={cn('h-7', active && 'pointer-events-none')}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
