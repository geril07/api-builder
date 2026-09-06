import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const { useTheme } = vi.hoisted(() => ({ useTheme: vi.fn() }))

vi.mock('next-themes', () => ({ useTheme }))
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

import { ThemeToggle } from './theme-toggle'

function render(theme: string | undefined) {
  useTheme.mockReturnValue({ theme, setTheme: vi.fn() })
  return renderToStaticMarkup(createElement(ThemeToggle))
}

describe('ThemeToggle', () => {
  it.each(['light', 'dark', 'system'])(
    'keeps the server markup when the saved theme is %s',
    (theme) => {
      expect(render(theme)).toBe(render(undefined))
    },
  )

  it('renders both icons so CSS can show the resolved theme without changing markup', () => {
    const markup = render(undefined)
    expect(markup).toContain('lucide-sun')
    expect(markup).toContain('dark:hidden')
    expect(markup).toContain('lucide-moon')
    expect(markup).toContain('hidden dark:block')
  })
})
