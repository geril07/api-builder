'use server'

import { headers } from 'next/headers'

import { auth } from '@/modules/auth/server'

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  })
}
