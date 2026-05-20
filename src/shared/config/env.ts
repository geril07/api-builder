import 'server-only'
import { z } from 'zod'

const emailFromSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !/[\r\n]/.test(value), 'Must not contain line breaks')
  .refine((value) => {
    if (z.email().safeParse(value).success) {
      return true
    }

    const match = value.match(/<([^<>]+)>$/)

    return match ? z.email().safeParse(match[1]).success : false
  }, 'Must be an email address or display name with an email address')

export const envConfigSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.url(),
  BETTER_AUTH_URL: z.url().default('http://localhost:3000'),
  BETTER_AUTH_SECRET: z.string().min(32),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: emailFromSchema.default('API Builder <onboarding@resend.dev>'),
  OPENROUTER_API_KEY: z.string().min(1),
})

export type EnvConfigSchema = z.infer<typeof envConfigSchema>

export const envConfig = envConfigSchema.parse(process.env)
