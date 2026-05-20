'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from '@/shared/i18n/routing'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/shared/ui/dropdown-menu'

const LABELS: Record<string, string> = {
  en: 'EN',
  ru: 'RU',
}

type LocaleSwitcherProps = {
  className?: string
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('Shared')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('switchToLocale', { locale: locale.toUpperCase() })}
            className={cn('font-mono text-xs', className)}
          />
        }
      >
        {LABELS[locale]}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-15 min-w-0">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => {
            const href = searchParams.toString()
              ? `${pathname}?${searchParams.toString()}`
              : pathname
            router.replace(href, { locale: value })
          }}
        >
          {Object.entries(LABELS).map(([value, label]) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              closeOnClick
              className="font-mono text-xs"
            >
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
