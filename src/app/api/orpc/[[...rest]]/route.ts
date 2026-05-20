import { RPCHandler } from '@orpc/server/fetch'
import { onError } from '@orpc/shared'
import { orpcRouter } from '@/app/api/orpc/router'
import { createORPCAuthContext } from '@/modules/auth/orpc-context'

const handler = new RPCHandler(orpcRouter, {
  interceptors: [
    onError((error) => {
      console.error('[oRPC]', error)
    }),
  ],
})

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: '/api/orpc',
    context: await createORPCAuthContext(),
  })

  return response ?? new Response('Not found', { status: 404 })
}

export const GET = handleRequest
export const POST = handleRequest
