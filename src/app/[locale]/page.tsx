import Image from 'next/image'
import type { Metadata } from 'next'
import {
  Sparkles,
  LayoutList,
  Download,
  Code,
  FileJson,
  FileCode,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Link, routing } from '@/shared/i18n/routing'
import { LocaleSwitcher } from '@/shared/i18n/locale-switcher'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
import { getServerSession } from '@/modules/auth/server'
import { buttonVariants } from '@/shared/ui/button'
import logo from '../../../logo.svg'

const featureKeys = [
  {
    icon: Sparkles,
    titleKey: 'featureAiTitle' as const,
    copyKey: 'featureAiCopy' as const,
  },
  {
    icon: LayoutList,
    titleKey: 'featureModeTitle' as const,
    copyKey: 'featureModeCopy' as const,
  },
  {
    icon: Download,
    titleKey: 'featureExportTitle' as const,
    copyKey: 'featureExportCopy' as const,
  },
]

const steps = [
  {
    icon: Code,
    titleKey: 'step1Title' as const,
    copyKey: 'step1Copy' as const,
  },
  {
    icon: FileJson,
    titleKey: 'step2Title' as const,
    copyKey: 'step2Copy' as const,
  },
  {
    icon: FileCode,
    titleKey: 'step3Title' as const,
    copyKey: 'step3Copy' as const,
  },
]

const formats = ['OpenAPI', 'Postman', 'cURL', 'TypeScript']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Landing' })

  const languages: Record<string, string> = {}
  for (const l of routing.locales) {
    languages[l] = l === routing.defaultLocale ? '/' : `/${l}`
  }

  return {
    title: t('heroTitle'),
    description: t('heroSubtitle'),
    keywords: [
      'api builder',
      'api builder ai',
      'rest api',
      'api design tool',
      'visual api editor',
      'ai rest api',
    ],
    openGraph: {
      title: t('heroTitle'),
      description: t('heroSubtitle'),
      url: '/',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('heroTitle'),
      description: t('heroSubtitle'),
    },
    alternates: {
      canonical: '/',
      languages,
    },
  }
}

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
            <div className="flex items-center">
              <ThemeToggle />
              <LocaleSwitcher />
            </div>
            {session ? (
              <>
                <span className="hidden max-w-40 truncate font-mono text-xs text-muted-foreground sm:block">
                  {session.user.name || session.user.email}
                </span>
                <Link
                  href="/dashboard"
                  className={buttonVariants({
                    size: 'sm',
                  })}
                >
                  {t('openDashboard')}
                </Link>
              </>
            ) : (
              <Link
                href="/sign-in"
                className={buttonVariants({
                  variant: 'ghost',
                  size: 'sm',
                })}
              >
                {t('signIn')}
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section className="relative isolate flex min-h-svh items-center px-6 pt-24 pb-10 sm:px-10 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />
        <div className="absolute top-0 right-0 -z-10 h-80 w-80 rounded-full bg-chart-2/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -z-10 h-72 w-72 rounded-full bg-chart-3/20 blur-3xl" />

        <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <div className="max-w-3xl">
            <h1 className="font-mono text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t('heroSubtitle')}
            </p>

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
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-border px-6 py-24 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-mono text-3xl font-semibold tracking-tight">
            {t('howItWorksTitle')}
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.titleKey} className="text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                  <step.icon className="size-6 text-primary" />
                </div>
                <h3 className="mt-6 font-mono text-base font-medium">
                  {t(step.titleKey)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t(step.copyKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-mono text-3xl font-semibold tracking-tight">
            {t('exportTitle')}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t('exportDesc')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {formats.map((format) => (
              <span
                key={format}
                className="rounded-full border border-border bg-card px-5 py-2 font-mono text-xs font-medium text-muted-foreground shadow-sm transition-colors duration-200 hover:border-primary/60 hover:text-foreground"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
