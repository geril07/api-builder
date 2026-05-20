import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/shared/i18n/routing'
import logo from '../../../../logo.svg'
import { SignInForm } from './sign-in-form'
import { envConfig } from '@/shared/config/env'

const isGithubOauthEnabled =
  !!envConfig.GITHUB_CLIENT_ID && !!envConfig.GITHUB_CLIENT_SECRET
const isGoogleOauthEnabled =
  !!envConfig.GOOGLE_CLIENT_ID && !!envConfig.GOOGLE_CLIENT_SECRET
const isMagicLinkEnabled = !!envConfig.RESEND_API_KEY && !!envConfig.EMAIL_FROM

async function SignInPage() {
  const t = await getTranslations('Landing')

  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-10 text-foreground">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />
      <div className="absolute top-0 right-0 -z-10 h-80 w-80 rounded-full bg-chart-2/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 -z-10 h-72 w-72 rounded-full bg-chart-3/20 blur-3xl" />

      <div className="grid w-full justify-items-center gap-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src={logo} alt={t('brand')} className="h-9 w-auto" priority />
          <span className="font-mono text-sm font-semibold">{t('brand')}</span>
        </Link>
        <SignInForm
          isGithubOauthEnabled={isGithubOauthEnabled}
          isGoogleOauthEnabled={isGoogleOauthEnabled}
          isMagicLinkEnabled={isMagicLinkEnabled}
        />
      </div>
    </main>
  )
}

export default SignInPage
