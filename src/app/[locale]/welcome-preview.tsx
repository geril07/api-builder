'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/ui/button'
import { MethodBadge } from '@/modules/api-design/endpoints'

import styles from './welcome.module.css'

const endpoints = [
  { method: 'GET', path: '/books', summary: 'listBooks' },
  { method: 'POST', path: '/books', summary: 'addBook' },
  { method: 'GET', path: '/books/{id}', summary: 'getBook' },
] as const

const fields = [
  { name: 'id', type: 'string' },
  { name: 'title', type: 'string' },
  { name: 'author', type: 'string' },
] as const

export function WelcomePreview() {
  const t = useTranslations('Landing.preview')
  const [mode, setMode] = useState<'canvas' | 'flat'>('canvas')

  return (
    <figure className={styles.preview} aria-label={t('label')}>
      <div className={styles.previewToolbar}>
        <div className="flex items-center gap-3">
          <span className={styles.projectMark} aria-hidden="true">
            B
          </span>
          <div>
            <h2 className="text-sm font-semibold">{t('name')}</h2>
            <p className="text-xs text-muted-foreground">{t('example')}</p>
          </div>
        </div>
        <div className={styles.modeSwitch} role="group" aria-label={t('mode')}>
          {(['canvas', 'flat'] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={mode === value ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={mode === value}
              aria-controls="design-preview"
              onClick={() => setMode(value)}
            >
              {t(value)}
            </Button>
          ))}
        </div>
        <span className={styles.previewExport}>
          OpenAPI 3.0 <span aria-hidden="true">↗</span>
        </span>
      </div>

      <div id="design-preview" className={styles.previewBody}>
        {mode === 'canvas' ? (
          <div className={styles.canvas}>
            <svg
              className={styles.connections}
              viewBox="0 0 1000 340"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M 460 156 C 565 156 525 105 630 105"
                stroke="var(--chart-1)"
                strokeWidth="2"
                strokeDasharray="6 5"
              />
              <path
                d="M 460 212 C 565 212 525 270 630 270"
                stroke="var(--chart-4)"
                strokeWidth="2"
                strokeDasharray="2 5"
              />
              <circle cx="460" cy="156" r="4" fill="var(--chart-1)" />
              <circle cx="630" cy="105" r="4" fill="var(--chart-1)" />
              <circle cx="460" cy="212" r="4" fill="var(--chart-4)" />
              <circle cx="630" cy="270" r="4" fill="var(--chart-4)" />
            </svg>
            <article className={`${styles.resource} ${styles.previewCard}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={styles.cardLabel}>{t('resource')}</p>
                  <h3 className="mt-2 text-lg font-semibold">Books</h3>
                </div>
                <span className={styles.resourceSymbol} aria-hidden="true">
                  /
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.summary} className={styles.endpoint}>
                    <MethodBadge method={endpoint.method} />
                    <code>{endpoint.path}</code>
                    <span
                      className="ml-auto text-muted-foreground"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </div>
                ))}
              </div>
            </article>
            <article className={`${styles.schema} ${styles.previewCard}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Book</h3>
                <span className={styles.cardLabel}>{t('schema')}</span>
              </div>
              <dl className="mt-3 grid gap-2 text-xs">
                {fields.map((field) => (
                  <div key={field.name} className="flex justify-between gap-4">
                    <dt>{field.name}</dt>
                    <dd className="text-muted-foreground">{field.type}</dd>
                  </div>
                ))}
              </dl>
            </article>
            <article className={`${styles.auth} ${styles.previewCard}`}>
              <p className={styles.cardLabel}>{t('auth')}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Bearer JWT</h3>
                <span className={styles.authSymbol} aria-hidden="true">
                  *
                </span>
              </div>
            </article>
            <span className={styles.canvasLabel}>{t('response')}</span>
            <span className={styles.canvasHint}>{t('connected')}</span>
          </div>
        ) : (
          <div className={styles.flat}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Books</h3>
              <p className="text-xs text-muted-foreground">{t('flatHint')}</p>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <caption className="sr-only">{t('endpoints')}</caption>
                <thead>
                  <tr>
                    <th>{t('method')}</th>
                    <th>{t('path')}</th>
                    <th>{t('summary')}</th>
                    <th>{t('response')}</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((endpoint) => (
                    <tr key={endpoint.summary}>
                      <td>
                        <MethodBadge method={endpoint.method} />
                      </td>
                      <td>
                        <code>{endpoint.path}</code>
                      </td>
                      <td>{t(endpoint.summary)}</td>
                      <td>
                        Book{endpoint.summary === 'listBooks' ? '[]' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {t('flatNote')}
            </p>
          </div>
        )}
      </div>
      <figcaption className={styles.previewCaption}>
        <span>
          <span className={styles.statusDot} />
          {t('caption')}
        </span>
        <span>
          {t('tryModes')} <span aria-hidden="true">↑</span>
        </span>
      </figcaption>
    </figure>
  )
}
