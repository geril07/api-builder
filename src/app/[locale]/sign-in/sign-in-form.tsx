'use client'

import { useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { authClient } from '@/modules/auth'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card } from '@/shared/ui/card'
import { Alert, AlertDescription } from '@/shared/ui/alert'

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.18v2.96h5.25c-.23 1.5-1.59 4.39-5.25 4.39-3.16 0-5.74-2.62-5.74-5.85s2.58-5.85 5.74-5.85c1.8 0 3 .77 3.69 1.43l2.51-2.42C16.76 4.26 14.67 3.4 12.17 3.4 7.35 3.4 3.44 7.31 3.44 12.13s3.91 8.73 8.73 8.73c5.04 0 8.38-3.54 8.38-8.53 0-.57-.06-1-.2-1.23Z"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56v-2.14c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18A10.96 10.96 0 0 1 12 6.08c.98 0 1.96.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.24 2.75.12 3.04.74.8 1.18 1.83 1.18 3.08 0 4.42-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
      />
    </svg>
  )
}

export function SignInForm({
  isGithubOauthEnabled,
  isGoogleOauthEnabled,
  isMagicLinkEnabled,
}: {
  isGithubOauthEnabled: boolean
  isGoogleOauthEnabled: boolean
  isMagicLinkEnabled: boolean
}) {
  const t = useTranslations('Auth')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function signInWithProvider(provider: 'github' | 'google') {
    setIsPending(true)

    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: '/dashboard',
    })

    if (error) {
      setError(error.message ?? 'Unable to start OAuth sign-in.')
      setIsPending(false)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSent(false)
    setIsPending(true)

    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: '/dashboard',
    })

    if (error) {
      setError(error.message ?? 'Unable to send magic link.')
    } else {
      setSent(true)
    }

    setIsPending(false)
  }

  return (
    <Card
      aria-busy={isPending}
      className="w-full max-w-md bg-card/85 p-5 backdrop-blur"
    >
      <div>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">
          {t('signInTitle')}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t('signInSubtitle')}
        </p>
      </div>

      {(isGithubOauthEnabled || isGoogleOauthEnabled) && (
        <div className="mt-6 grid gap-2">
          {isGithubOauthEnabled && (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 font-mono"
              loading={isPending}
              aria-label={t('signInWithGithub')}
              onClick={() => signInWithProvider('github')}
            >
              <GitHubIcon />
              {t('continueWithGithub')}
            </Button>
          )}
          {isGoogleOauthEnabled && (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 font-mono"
              loading={isPending}
              aria-label={t('signInWithGoogle')}
              onClick={() => signInWithProvider('google')}
            >
              <GoogleIcon />
              {t('continueWithGoogle')}
            </Button>
          )}
        </div>
      )}

      {(isGithubOauthEnabled || isGoogleOauthEnabled) && isMagicLinkEnabled && (
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          {t('or')}
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {isMagicLinkEnabled && (
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Label htmlFor="email" className="grid gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {t('email')}
            </span>
            <Input
              id="email"
              type="email"
              value={email}
              required
              placeholder={t('emailPlaceholder')}
              className="h-10 bg-background px-3 font-mono text-sm"
              onChange={(event) => setEmail(event.target.value)}
            />
          </Label>
          <Button
            type="submit"
            className="w-full gap-2 font-mono"
            loading={isPending}
            aria-label={t('sendMagicLinkAria')}
          >
            <Mail className="size-4" />
            {t('sendMagicLink')}
          </Button>
        </form>
      )}

      {sent && (
        <Alert className="mt-4">
          <AlertDescription>{t('magicLinkSent')}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Card>
  )
}
