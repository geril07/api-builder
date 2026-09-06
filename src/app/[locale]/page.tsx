import Image from 'next/image'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Link, routing } from '@/shared/i18n/routing'
import { LocaleSwitcher } from '@/shared/i18n/locale-switcher'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
import { buttonVariants } from '@/shared/ui/button'
import { getServerSession } from '@/modules/auth/server'
import logo from '../../../logo.svg'

import { WelcomeMotion } from './welcome-motion'
import { WelcomePreview } from './welcome-preview'
import styles from './welcome.module.css'

const benefits = ['structure', 'perspective', 'assistant'] as const
const steps = ['define', 'connect', 'export'] as const
const questions = [
  'purpose',
  'code',
  'modes',
  'ai',
  'exports',
  'account',
] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Landing' })
  const canonical = locale === routing.defaultLocale ? '/' : `/${locale}`
  const languages = Object.fromEntries(
    routing.locales.map((language) => [
      language,
      language === routing.defaultLocale ? '/' : `/${language}`,
    ]),
  )

  return {
    title: t('metaTitle'),
    description: t('heroSubtitle'),
    openGraph: {
      title: t('metaTitle'),
      description: t('heroSubtitle'),
      url: canonical,
      images: [
        {
          url: '/welcome-social.png',
          width: 1200,
          height: 630,
          alt: t('metaTitle'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle'),
      description: t('heroSubtitle'),
      images: ['/welcome-social.png'],
    },
    alternates: { canonical, languages },
  }
}

async function HomePage() {
  const session = await getServerSession()
  const t = await getTranslations('Landing')
  const destination = session ? '/dashboard' : '/sign-in'
  const cta = session ? t('openDashboard') : t('ctaCreate')
  const ctaClassName = buttonVariants({
    size: 'lg',
    className: styles.primaryButton,
  })

  return (
    <WelcomeMotion>
      <a href="#main-content" className={styles.skipLink}>
        {t('skip')}
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link
            href="/"
            aria-current="page"
            aria-label={t('brand')}
            className={styles.brand}
          >
            <Image src={logo} alt="" className="size-8" priority />
            <span>{t('brand')}</span>
          </Link>
          <nav aria-label={t('navigation')} className={styles.navigation}>
            <a href="#why">{t('navOverview')}</a>
            <a href="#how-it-works">{t('navWorkflow')}</a>
            <a href="#faq">{t('navFaq')}</a>
          </nav>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <LocaleSwitcher />
            <Link
              href={destination}
              data-slot="button"
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: styles.signIn,
              })}
            >
              {session ? t('openDashboard') : t('signIn')}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div data-reveal>
            <p className={styles.eyebrow}>
              <span className={styles.statusDot} />
              {t('eyebrow')}
            </p>
            <h1 id="hero-title" className={styles.heroTitle}>
              {t('heroLine1')}
              <br />
              {t('heroLine2')}
            </h1>
            <p className={styles.heroSubtitle}>{t('heroSubtitle')}</p>
            <Link
              href={destination}
              data-slot="button"
              className={ctaClassName}
            >
              {cta}
              <span aria-hidden="true">↗</span>
            </Link>
            <p className={styles.heroNote}>{t('heroNote')}</p>
          </div>
          <div className={styles.previewContainer} data-reveal>
            <WelcomePreview />
          </div>
          <div className={styles.proofLine} data-reveal>
            <span>{t('proof')}</span>
            <span>OpenAPI 3.0</span>
            <span>JSON Schema</span>
            <span>Postman</span>
          </div>
        </section>

        <section
          id="why"
          className={styles.section}
          aria-labelledby="benefits-title"
        >
          <div className={styles.sectionIntro} data-reveal>
            <div>
              <p className={styles.eyebrow}>{t('benefitsLabel')}</p>
              <h2 id="benefits-title">{t('benefitsTitle')}</h2>
            </div>
            <p>{t('benefitsCopy')}</p>
          </div>
          <div className={styles.benefits}>
            {benefits.map((benefit, index) => (
              <article key={benefit} className={styles.benefit} data-reveal>
                <span className={styles.index}>0{index + 1}</span>
                <h3>{t(`benefits.${benefit}.title`)}</h3>
                <p>{t(`benefits.${benefit}.copy`)}</p>
                <div className={styles.benefitDetail}>
                  {benefit === 'structure' && (
                    <>
                      <span>GET /books</span>
                      <span aria-hidden="true">→</span>
                      <span>Book[]</span>
                    </>
                  )}
                  {benefit === 'perspective' && (
                    <>
                      <span>{t('preview.canvas')}</span>
                      <span aria-hidden="true">⇄</span>
                      <span>{t('preview.flat')}</span>
                    </>
                  )}
                  {benefit === 'assistant' && (
                    <>
                      <span className={styles.statusDot} />
                      <span>{t('assistantDetail')}</span>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.tagline} aria-label={t('taglineLabel')}>
          <p className={styles.eyebrow}>{t('taglineLabel')}</p>
          <h2>
            {(['taglineLine1', 'taglineLine2'] as const).map((line) => (
              <span key={line} className="block">
                {t(line)
                  .split(' ')
                  .map((word, index) => (
                    <span
                      key={`${line}-${index}`}
                      data-word
                      className={styles.word}
                    >
                      {word}{' '}
                    </span>
                  ))}
              </span>
            ))}
          </h2>
          <p className={styles.taglineCopy}>{t('taglineCopy')}</p>
        </section>

        <section
          id="how-it-works"
          className={styles.section}
          aria-labelledby="workflow-title"
        >
          <div className={styles.sectionIntro} data-reveal>
            <div>
              <p className={styles.eyebrow}>{t('workflowLabel')}</p>
              <h2 id="workflow-title">{t('workflowTitle')}</h2>
            </div>
            <p>{t('workflowCopy')}</p>
          </div>
          <div className={styles.workflow}>
            <div className={styles.steps}>
              {steps.map((step, index) => (
                <article key={step} className={styles.step} data-reveal>
                  <span className={styles.stepNumber}>0{index + 1}</span>
                  <div>
                    <h3>{t(`steps.${step}.title`)}</h3>
                    <p>{t(`steps.${step}.copy`)}</p>
                  </div>
                </article>
              ))}
            </div>
            <figure className={styles.exportSample} data-reveal>
              <figcaption>
                <span>books.openapi.yaml</span>
                <span>OpenAPI 3.0</span>
              </figcaption>
              <pre className="font-mono">
                <code>
                  <span className={styles.codeMuted}>openapi:</span>
                  {' 3.0.3\n'}
                  <span className={styles.codeMuted}>info:</span>
                  {'\n  title: Books API\n  version: 1.0.0\n'}
                  <span className={styles.codeMuted}>paths:</span>
                  {'\n  '}
                  <span className={styles.codeAccent}>/books:</span>
                  {
                    "\n    get:\n      summary: List books\n      responses:\n        '200':\n          description: A list of books"
                  }
                </code>
              </pre>
              <p>{t('exportNote')}</p>
            </figure>
          </div>
        </section>

        <section
          id="faq"
          className={`${styles.section} ${styles.faq}`}
          aria-labelledby="faq-title"
        >
          <div data-reveal>
            <p className={styles.eyebrow}>{t('faqLabel')}</p>
            <h2 id="faq-title">{t('faqTitle')}</h2>
            <p className={styles.faqIntro}>{t('faqCopy')}</p>
          </div>
          <div className={styles.questions} data-reveal>
            {questions.map((question) => (
              <details key={question}>
                <summary>
                  {t(`faq.${question}.question`)}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{t(`faq.${question}.answer`)}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          className={styles.finalCta}
          aria-labelledby="start-title"
          data-reveal
        >
          <p className={styles.eyebrow}>{t('finalLabel')}</p>
          <h2 id="start-title">{t('finalTitle')}</h2>
          <p>{t('finalCopy')}</p>
          <Link href={destination} data-slot="button" className={ctaClassName}>
            {cta}
            <span aria-hidden="true">↗</span>
          </Link>
          <p className={styles.heroNote}>{t('heroNote')}</p>
        </section>
      </main>

      <footer className={styles.footer}>
        <Link href="/" aria-current="page" className={styles.brand}>
          <Image src={logo} alt="" className="size-6" />
          {t('brand')}
        </Link>
        <p>{t('footerCopy')}</p>
        <a href="#main-content">
          {t('backToTop')} <span aria-hidden="true">↑</span>
        </a>
      </footer>
    </WelcomeMotion>
  )
}

export default HomePage
