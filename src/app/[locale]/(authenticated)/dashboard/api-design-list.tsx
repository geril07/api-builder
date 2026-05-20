'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslations, useFormatter, useNow } from 'next-intl'

import { Link } from '@/shared/i18n/routing'
import { Input } from '@/shared/ui/input'
import { Card } from '@/shared/ui/card'
import { ApiDesignActions } from './api-design-actions'

type ApiDesignWithCounts = {
  id: string
  name: string
  updatedAt: Date
  resourceCount: number
  endpointCount: number
}

type ApiDesignListProps = {
  designs: ApiDesignWithCounts[]
}

export function ApiDesignList({ designs }: ApiDesignListProps) {
  const t = useTranslations('Dashboard')
  const format = useFormatter()
  const now = useNow()
  const [query, setQuery] = useState('')

  const showSearch = designs.length > 5

  const filtered = query
    ? designs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
    : designs

  return (
    <>
      {showSearch ? (
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchDesigns')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-7"
          />
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((design) => (
            <Card
              key={design.id}
              className="relative flex flex-col p-4 focus-within:ring-1 focus-within:ring-ring/50"
            >
              <Link
                href={`/api-designs/${design.id}`}
                className="absolute inset-0 z-0"
                aria-label={`Open API design ${design.name}`}
              />

              <div className="pointer-events-none relative z-10">
                <h3 className="truncate font-mono text-sm font-semibold">
                  {design.name}
                </h3>

                <div className="mt-2 flex gap-3 font-mono text-[0.65rem] text-muted-foreground">
                  <span>
                    {t('resources_label', { count: design.resourceCount })}
                  </span>
                  <span>
                    {t('endpoints_label', { count: design.endpointCount })}
                  </span>
                </div>
              </div>

              <div className="relative z-20 mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="font-mono text-[0.65rem] text-muted-foreground">
                  {format.relativeTime(design.updatedAt, { now })}
                </span>
                <ApiDesignActions
                  apiDesign={{ id: design.id, name: design.name }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : query ? (
        <Card className="mt-6 border-dashed bg-card/60 p-10 text-center">
          <p className="font-mono text-sm font-semibold">
            {t('noDesignsMatch', { query })}
          </p>
        </Card>
      ) : null}
    </>
  )
}
