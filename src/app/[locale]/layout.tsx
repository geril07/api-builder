import { Geist, JetBrains_Mono } from 'next/font/google'

import './../globals.css'
import { ThemeProvider } from '@/app/theme-provider'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ToastProvider } from '@/shared/ui/toast'
import { cn } from '@/shared/utils/cn'

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        'font-sans antialiased',
        fontSans.variable,
        jetbrainsMono.variable,
      )}
    >
      <head>
        <meta
          name="google-site-verification"
          content="rpA30pyx_oegMVC6ea8-O_U9qc-U-B1AixRk6N1Yxew"
        />
      </head>
      <body className="min-h-svh bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export default RootLayout
