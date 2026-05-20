import Image from 'next/image'
import { Bot, Download, GitBranch, Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/shared/i18n/routing'
import { LocaleSwitcher } from '@/shared/i18n/locale-switcher'
import { getServerSession } from '@/modules/auth/server'
import { Button, buttonVariants } from '@/shared/ui/button'
import logo from '../../../logo.svg'

const featureKeys = [
  {
    icon: Bot,
    titleKey: 'featureAiTitle' as const,
    copyKey: 'featureAiCopy' as const,
  },
  {
    icon: Users,
    titleKey: 'featureCollabTitle' as const,
    copyKey: 'featureCollabCopy' as const,
  },
  {
    icon: Download,
    titleKey: 'featureExportTitle' as const,
    copyKey: 'featureExportCopy' as const,
  },
]

const endpoints = [
  { method: 'GET', path: '/users', tone: 'bg-chart-1/15 text-chart-1' },
  { method: 'POST', path: '/users', tone: 'bg-chart-2/15 text-chart-2' },
  { method: 'PATCH', path: '/users/{id}', tone: 'bg-chart-4/15 text-chart-4' },
]

async function HomePage() {
  const session = await getServerSession()
  const t = await getTranslations('Landing')

  return (
    <main className="min-h-svh overflow-hidden bg-background text-foreground">
      <header className="fixed top-0 right-0 left-0 z-20 border-b border-border bg-card/85 shadow-lg shadow-black/10 backdrop-blur-xl">
        <div className="mx-auto flex h-14 items-center justify-between gap-4 px-3 sm:px-4">
          <a href="#" className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center">
              <Image
                src={logo}
                alt={t('brand')}
                className="h-8 w-auto"
                priority
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-mono text-sm font-semibold tracking-tight">
                {t('brand')}
              </span>
              <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">
                {t('subtitle')}
              </span>
            </span>
          </a>

          <nav className="flex shrink-0 items-center gap-2">
            <LocaleSwitcher />
            {session ? (
              <>
                <span className="hidden max-w-40 truncate font-mono text-xs text-muted-foreground sm:block">
                  {session.user.name || session.user.email}
                </span>
                <Link
                  href="/dashboard"
                  className={buttonVariants({
                    size: 'sm',
                    className: 'font-mono',
                  })}
                >
                  {t('openDashboard')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className={buttonVariants({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'font-mono',
                  })}
                >
                  {t('signIn')}
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative isolate flex min-h-svh items-center px-6 pt-24 pb-10 sm:px-10 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />
        <div className="absolute top-0 right-0 -z-10 h-80 w-80 rounded-full bg-chart-2/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -z-10 h-72 w-72 rounded-full bg-chart-3/20 blur-3xl" />

        <div className="mx-auto grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-2xl">
            <h1 className="font-mono text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t('heroSubtitle')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-in"
                className={buttonVariants({
                  size: 'lg',
                  className: 'font-mono',
                })}
              >
                {t('ctaCreate')}
              </Link>
              <a
                href="#export-preview"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className: 'font-mono',
                })}
              >
                {t('ctaPreview')}
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {featureKeys.map((feature) => (
                <div
                  key={feature.titleKey}
                  className="border border-border bg-card/70 p-4 shadow-sm backdrop-blur transition-colors duration-200 hover:border-primary/60"
                >
                  <feature.icon className="mb-3 size-4 text-primary" />
                  <h2 className="font-mono text-sm font-medium">
                    {t(feature.titleKey)}
                  </h2>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {t(feature.copyKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            id="export-preview"
            className="relative min-h-[520px] scroll-mt-20 border border-border bg-card/80 p-4 shadow-2xl shadow-black/20 backdrop-blur"
          >
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  canvas/api-v1
                </p>
                <h2 className="font-mono text-sm font-medium">
                  {t('demoDesignName')}
                </h2>
              </div>
              <Button size="sm" className="font-mono">
                {t('demoExportBtn')}
              </Button>
            </div>

            <div className="relative h-[430px] overflow-hidden border border-border bg-background/70">
              <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:18px_18px] opacity-70" />
              <div className="absolute top-9 left-8 w-56 border border-border bg-card p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">
                    {t('demoResourceUsers')}
                  </span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">
                    {t('demoResourceBadge')}
                  </span>
                </div>
                <div className="space-y-2">
                  {endpoints.map((endpoint) => (
                    <div
                      key={endpoint.path + endpoint.method}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={`w-12 px-1.5 py-1 text-center font-mono text-[10px] ${endpoint.tone}`}
                      >
                        {endpoint.method}
                      </span>
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {endpoint.path}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute top-24 right-10 w-56 border border-dashed border-chart-3 bg-chart-3/10 p-4 shadow-lg">
                <div className="mb-3 flex items-center gap-2 font-mono text-sm font-semibold text-chart-3">
                  <Bot className="size-4" />
                  {t('demoAiSuggestion')}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t('demoAiText')}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="xs" className="font-mono">
                    {t('demoAccept')}
                  </Button>
                  <Button size="xs" variant="ghost" className="font-mono">
                    {t('demoDismiss')}
                  </Button>
                </div>
              </div>

              <div className="absolute right-24 bottom-12 w-52 border border-border bg-card p-4 shadow-lg">
                <div className="mb-3 flex items-center gap-2 font-mono text-sm font-semibold">
                  <GitBranch className="size-4 text-chart-2" />
                  {t('demoAuthTitle')}
                </div>
                <div className="space-y-2 font-mono text-xs text-muted-foreground">
                  <p>{t('demoAuthBearer')}</p>
                  <p>{t('demoAuthPagination')}</p>
                  <p>{t('demoAuthErrors')}</p>
                </div>
              </div>

              <div className="absolute top-[185px] left-[250px] h-px w-32 bg-chart-2" />
              <div className="absolute top-[185px] left-[372px] size-2 -translate-y-1/2 rounded-full bg-chart-2" />
              <div className="absolute right-11 bottom-8 border border-chart-1 bg-card px-2 py-1 font-mono text-[10px] text-chart-1 shadow-sm">
                {t('demoEditing')}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
