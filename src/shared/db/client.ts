import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { envConfig } from '@/shared/config/env'
import * as schema from '@/shared/db/schema'

const globalForDb = globalThis as typeof globalThis & {
  postgresClient?: ReturnType<typeof postgres>
}

const client =
  globalForDb.postgresClient ??
  postgres(envConfig.DATABASE_URL, {
    prepare: false,
  })

if (envConfig.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client
}

export const db = drizzle(client, { schema })
