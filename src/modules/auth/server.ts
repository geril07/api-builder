import 'server-only'
import { headers } from 'next/headers'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { magicLink, organization } from 'better-auth/plugins'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'

import { envConfig } from '@/shared/config/env'
import { db } from '@/shared/db/client'
import {
  authSchema,
  membersTable,
  organizationsTable,
} from '@/shared/db/schema'

const resend = envConfig.RESEND_API_KEY
  ? new Resend(envConfig.RESEND_API_KEY)
  : null

function createPersonalWorkspaceName(user: {
  name?: string | null
  email: string
}) {
  const name = user.name?.trim() || user.email.split('@')[0] || 'Personal'

  return `${name}'s workspace`
}

async function ensurePersonalWorkspace(user: {
  id: string
  name?: string | null
  email: string
}) {
  const existingMembership = await db.query.membersTable.findFirst({
    where: eq(membersTable.userId, user.id),
  })

  if (existingMembership) {
    return
  }

  await db.transaction(async (tx) => {
    const [workspace] = await tx
      .insert(organizationsTable)
      .values({
        name: createPersonalWorkspaceName(user),
        slug: `personal-${user.id}`,
        metadata: { type: 'personal' },
      })
      .returning({ id: organizationsTable.id })

    if (!workspace) {
      tx.rollback()
      throw new Error('Failed to create personal workspace.')
    }

    await tx.insert(membersTable).values({
      organizationId: workspace.id,
      userId: user.id,
      role: 'owner',
    })
  })
}

export const auth = betterAuth({
  appName: 'API Builder',
  baseURL: envConfig.BETTER_AUTH_URL,
  secret: envConfig.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
    usePlural: true,
    transaction: true,
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github'],
      updateUserInfoOnLink: true,
    },
  },
  socialProviders: {
    ...(envConfig.GITHUB_CLIENT_ID && envConfig.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: envConfig.GITHUB_CLIENT_ID,
            clientSecret: envConfig.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(envConfig.GOOGLE_CLIENT_ID && envConfig.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: envConfig.GOOGLE_CLIENT_ID,
            clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  advanced: {
    database: {
      generateId: () => false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensurePersonalWorkspace(user)
        },
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (!resend) {
          console.info(`Magic link for ${email}: ${url}`)
          return
        }

        await resend.emails.send({
          from: envConfig.EMAIL_FROM,
          to: email,
          subject: 'Sign in to API Builder',
          text: `Open this link to sign in to API Builder:\n\n${url}`,
          html: `<p>Open this link to sign in to API Builder:</p><p><a href="${url}">${url}</a></p>`,
        })
      },
    }),
    nextCookies(),
  ],
})

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}
