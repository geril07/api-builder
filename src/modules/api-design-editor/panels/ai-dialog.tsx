import { useState, useRef, useLayoutEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import {
  RefreshCw,
  Sparkles,
  Square,
  Wrench,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { cn } from '@/shared/utils/cn'

import { orpcClient } from '@/shared/orpc/client'
import { apiDesignQueryOptions } from '../queries'

type AiDialogProps = {
  apiDesignId: string
}

type ToolCallEntry = {
  id: string
  name: string
  input: unknown
  output?: unknown
  error?: string
  status: 'running' | 'done' | 'error'
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  toolCalls: ToolCallEntry[]
}

interface ChunkBase {
  type: string
  [key: string]: unknown
}

function toolRunningLabel(name: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    createResource: t('creatingResource'),
    updateResource: t('updatingResource'),
    deleteResource: t('deletingResource'),
    createEndpoint: t('creatingEndpoint'),
    updateEndpoint: t('updatingEndpoint'),
    deleteEndpoint: t('deletingEndpoint'),
    createSchema: t('creatingSchema'),
    updateSchema: t('updatingSchema'),
    deleteSchema: t('deletingSchema'),
    createAuthScheme: t('creatingAuthScheme'),
    updateAuthScheme: t('updatingAuthScheme'),
    deleteAuthScheme: t('deletingAuthScheme'),
  }
  return map[name] ?? `${name}\u2026`
}

function ToolCallCard({
  tool,
  t,
}: {
  tool: ToolCallEntry
  t: (key: string) => string
}) {
  return (
    <div
      className={cn(
        'border p-3',
        tool.status === 'running'
          ? 'border-ring bg-muted/20'
          : tool.status === 'error'
            ? 'border-destructive/40'
            : 'border-border',
      )}
    >
      <div className="flex items-center gap-2">
        {tool.status === 'running' ? (
          <>
            <Loader2 className="size-3 shrink-0 animate-spin" />
            <span className="text-xs font-semibold text-muted-foreground">
              {toolRunningLabel(tool.name, t)}
            </span>
          </>
        ) : tool.status === 'error' ? (
          <>
            <AlertTriangle className="size-3 shrink-0 text-destructive" />
            <span className="text-xs font-semibold">{tool.name}</span>
            <span className="text-xs text-destructive">{t('failed')}</span>
          </>
        ) : (
          <>
            <Wrench className="size-3 shrink-0 text-emerald-500" />
            <span className="text-xs text-emerald-600">
              {(tool.output as { summary?: string } | undefined)?.summary ??
                t('done')}
            </span>
          </>
        )}
      </div>
      {tool.error ? (
        <p className="mt-1 text-xs text-destructive">{tool.error}</p>
      ) : null}
    </div>
  )
}

export function AiDialog({ apiDesignId }: AiDialogProps) {
  const t = useTranslations('Editor')
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draftContent, setDraftContent] = useState('')
  const [draftToolCalls, setDraftToolCalls] = useState<ToolCallEntry[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  const draftContentRef = useRef('')
  const draftToolCallsRef = useRef<ToolCallEntry[]>([])
  const lastPromptRef = useRef('')

  const resetState = () => {
    abortRef.current?.abort()
    setMessages([])
    setDraftContent('')
    setDraftToolCalls([])
    setPrompt('')
    setStatus('idle')
    setError(null)
    messagesRef.current = []
    draftContentRef.current = ''
    draftToolCallsRef.current = []
    abortRef.current = null
  }

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    if (isNearBottom) el.scrollTop = el.scrollHeight
  }, [messages, draftContent, draftToolCalls])

  const handleCancel = () => {
    abortRef.current?.abort()
    setStatus('idle')
    setDraftContent('')
    setDraftToolCalls([])
    draftContentRef.current = ''
    draftToolCallsRef.current = []
  }

  const runStream = async (abortController: AbortController) => {
    const eventIterator = await orpcClient.apiDesign.ai.agent(
      {
        apiDesignId,
        messages: messagesRef.current.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
      { signal: abortController.signal },
    )

    for await (const chunk of eventIterator) {
      const c = chunk as ChunkBase

      switch (c.type) {
        case 'text-delta': {
          const delta = c.delta as string
          draftContentRef.current += delta
          setDraftContent(draftContentRef.current)
          break
        }
        case 'text-start':
          break
        case 'text-end':
          break
        case 'reasoning-delta':
          break
        case 'tool-input-available': {
          const newTool: ToolCallEntry = {
            id: c.toolCallId as string,
            name: c.toolName as string,
            input: c.input,
            status: 'running',
          }
          draftToolCallsRef.current = [...draftToolCallsRef.current, newTool]
          setDraftToolCalls(draftToolCallsRef.current)
          break
        }
        case 'tool-output-available': {
          draftToolCallsRef.current = draftToolCallsRef.current.map((tc) =>
            tc.id === c.toolCallId
              ? { ...tc, output: c.output, status: 'done' as const }
              : tc,
          )
          setDraftToolCalls(draftToolCallsRef.current)
          queryClient.invalidateQueries({
            queryKey: apiDesignQueryOptions(apiDesignId).queryKey,
          })
          break
        }
        case 'tool-output-error': {
          draftToolCallsRef.current = draftToolCallsRef.current.map((tc) =>
            tc.id === c.toolCallId
              ? {
                  ...tc,
                  error: (c.errorText as string) ?? t('toolError'),
                  status: 'error' as const,
                }
              : tc,
          )
          setDraftToolCalls(draftToolCallsRef.current)
          break
        }
        case 'error':
          setError((c.errorText as string) ?? t('unknownError'))
          break
        default:
          break
      }
    }

    if (draftContentRef.current || draftToolCallsRef.current.length > 0) {
      const finalizedTools = draftToolCallsRef.current.map((tc) =>
        tc.status === 'running'
          ? { ...tc, status: 'error' as const, error: t('interrupted') }
          : tc,
      )
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: draftContentRef.current,
        toolCalls: finalizedTools,
      }
      const nextMessages = [...messagesRef.current, assistantMessage]
      setMessages(nextMessages)
      messagesRef.current = nextMessages
      draftContentRef.current = ''
      draftToolCallsRef.current = []
      setDraftContent('')
      setDraftToolCalls([])
    }

    setStatus('idle')
  }

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    lastPromptRef.current = prompt.trim()

    const abortController = new AbortController()
    abortRef.current = abortController

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt.trim(),
      toolCalls: [],
    }
    const updatedMessages = [...messagesRef.current, userMessage]
    setMessages(updatedMessages)
    messagesRef.current = updatedMessages

    setDraftContent('')
    setDraftToolCalls([])
    draftContentRef.current = ''
    draftToolCallsRef.current = []
    setStatus('streaming')
    setError(null)
    setPrompt('')

    try {
      await runStream(abortController)
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        setStatus('idle')
        return
      }
      setError(e instanceof Error ? e.message : t('aiAgentFailed'))
      setStatus('error')
    }
  }

  const handleRetry = async () => {
    abortRef.current?.abort()
    setError(null)
    setStatus('streaming')

    if (messagesRef.current.at(-1)?.role === 'assistant') {
      const trimmed = messagesRef.current.slice(0, -1)
      setMessages(trimmed)
      messagesRef.current = trimmed
    }

    setDraftContent('')
    setDraftToolCalls([])
    draftContentRef.current = ''
    draftToolCallsRef.current = []

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      await runStream(abortController)
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        setStatus('idle')
        return
      }
      setError(e instanceof Error ? e.message : t('aiAgentFailed'))
      setStatus('error')
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
      <DialogTrigger render={<Button />}>
        <Sparkles className="size-4" />
        {t('aiAgent')}
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,40rem)]">
        <DialogHeader>
          <DialogTitle>{t('aiAgent')}</DialogTitle>
          <DialogDescription>{t('aiDescription')}</DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {status === 'idle' &&
        messages.length === 0 &&
        !draftContent &&
        draftToolCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t('emptyState')}
            </p>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex max-h-[50vh] flex-col overflow-auto pb-1 font-mono text-sm"
          >
            <div className="mt-auto space-y-3">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === 'user' ? (
                    <div className="rounded-lg bg-muted p-3 text-sm wrap-break-word text-foreground">
                      {msg.content}
                    </div>
                  ) : (
                    <>
                      {msg.content ? (
                        <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                          {msg.content}
                        </p>
                      ) : null}
                      {msg.toolCalls.length > 0 ? (
                        <div className="space-y-2">
                          {msg.toolCalls.map((tool) => (
                            <ToolCallCard key={tool.id} tool={tool} t={t} />
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ))}

              {status === 'streaming' ? (
                <div>
                  {draftContent ? (
                    <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {draftContent}
                      <span className="animate-pulse">▊</span>
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      <span className="animate-pulse">▊</span>
                    </p>
                  )}
                  {draftToolCalls.length > 0 ? (
                    <div className="space-y-2">
                      {draftToolCalls.map((tool) => (
                        <ToolCallCard key={tool.id} tool={tool} t={t} />
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    {t('toolsComplete', {
                      n: draftToolCalls.filter((tc) => tc.status !== 'running')
                        .length,
                      total: draftToolCalls.length,
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="ai-prompt" className="block">
            {t('whatToBuild')}
          </Label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder={t('aiPlaceholder')}
            rows={3}
            maxLength={2000}
            className="mt-2 resize-none"
            disabled={status === 'streaming'}
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t('submitHint')}</p>
            <span
              className={cn(
                'text-xs tabular-nums',
                prompt.length > 1900 && 'text-amber-500',
              )}
            >
              {prompt.length}/2000
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'error' ? (
            <>
              <Button type="button" onClick={handleRetry}>
                <RefreshCw className="mr-1 size-3" />
                {t('retry')}
              </Button>
              <Button type="button" variant="outline" onClick={resetState}>
                {t('clear')}
              </Button>
            </>
          ) : status === 'streaming' ? (
            <Button type="button" variant="outline" onClick={handleCancel}>
              <Square className="mr-1 size-3" />
              {t('stop')}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!prompt.trim()}
            >
              <Sparkles className="mr-1 size-3" />
              {t('generate')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
