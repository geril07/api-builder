'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/ui/button'
import { useRouter } from '@/shared/i18n/routing'
import { useToast } from '@/shared/ui/toast'
import { getErrorMessage } from '@/shared/utils/error'
import { signOutAction } from './sign-out-actions'

export function SignOutForm() {
  const t = useTranslations('Dashboard')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        await signOutAction()
        router.replace('/sign-in')
      } catch (err) {
        console.error(err)
        toast.add({
          title: t('failedToSignOut'),
          description: getErrorMessage(err),
          type: 'error',
        })
      }
    })
  }

  return (
    <form action={handleSignOut}>
      <Button type="submit" variant="ghost" size="sm" loading={isPending}>
        {t('signOut')}
      </Button>
    </form>
  )
}
