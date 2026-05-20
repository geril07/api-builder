import type { ApiDesignEndpointRow } from '@/shared/db/schema'

export type QueryParamDto = {
  name: string
  description?: string | null
  required?: boolean
  type?: 'string' | 'number' | 'integer' | 'boolean'
  allowMultiple?: boolean
}

export type ApiDesignEndpointDto = Omit<
  ApiDesignEndpointRow,
  'requestBody' | 'responseShape' | 'queryParams'
> & {
  requestBody: string | null
  responseShape: string | null
  authSchemeIds: string[]
  queryParams: QueryParamDto[]
}
