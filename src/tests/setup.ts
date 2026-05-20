import { type EnvConfigSchema } from '@/shared/config/env'
import { vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/shared/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    BETTER_AUTH_URL: 'http://localhost:3000',
    BETTER_AUTH_SECRET: 'a'.repeat(32),
    EMAIL_FROM: 'hello-world',
    OPENROUTER_API_KEY: 'sk-test-key',
  } satisfies EnvConfigSchema,
}))
