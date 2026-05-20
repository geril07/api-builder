'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

export default function DashboardError({ reset }: { reset: () => void }) {
  const t = useTranslations('Dashboard')

  return (
    <section className="mx-auto flex w-full flex-1 items-center px-6 py-10">
      <Card className="mx-auto max-w-xl p-6">
        <p className="font-mono text-xs text-destructive">
          {t('dashboardErrorLabel')}
        </p>
        <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight">
          {t('designsNotLoaded')}
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {t('designsNotLoadedDesc')}
        </p>
        <Button className="mt-6" onClick={reset}>
          {t('tryAgain')}
        </Button>
      </Card>
    </section>
  )
}
