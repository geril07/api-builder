import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/shared/i18n/routing'
import { LocaleSwitcher } from '@/shared/i18n/locale-switcher'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
import { createOrpcServerClient } from '@/app/api/orpc/server-client'
import { QueryProvider } from './query-provider'
import { SignOutForm } from './sign-out-form'

async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const caller = await createOrpcServerClient()
  const { user, workspaceId } = await caller.auth.current()
  const t = await getTranslations('Dashboard')
  const tLanding = await getTranslations('Landing')

  if (!user) {
    redirect('/sign-in')
  }

  if (!workspaceId) {
    notFound()
  }

  const accountLabel = user.name || user.email || t('userFallback')

  return (
    <div className="flex h-svh flex-col overflow-auto bg-background text-foreground">
      <header className="border-b border-border bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 items-center justify-between gap-4 px-4">
          <Link href="/dashboard" className="font-mono text-sm font-semibold">
            {tLanding('brand')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <ThemeToggle />
              <LocaleSwitcher />
            </div>
            <span className="max-w-36 truncate font-mono text-xs text-muted-foreground sm:max-w-44">
              {accountLabel}
            </span>
            <SignOutForm />
          </div>
        </div>
      </header>

      <QueryProvider>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </QueryProvider>
    </div>
  )
}

export default AuthenticatedLayout
