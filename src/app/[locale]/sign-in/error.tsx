'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/ui/button'

export default function SignInError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Auth')

  useEffect(() => {
    console.error('Sign-in page error:', error)
  }, [error])

  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          {t('somethingWentWrong')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('failedToLoadSignIn')}
        </p>
        <Button onClick={reset} className="mt-4" variant="outline">
          {t('tryAgain')}
        </Button>
      </div>
    </div>
  )
}
