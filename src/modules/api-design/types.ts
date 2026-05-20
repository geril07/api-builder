import type { ApiDesignResourceDto } from '@/modules/api-design/resources'
import type { ApiDesignEndpointDto } from '@/modules/api-design/endpoints'
import type { ApiDesignSchemaDto } from '@/modules/api-design/schemas'
import type { ApiDesignAuthSchemeDto } from '@/modules/api-design/auth-schemes'

export type ApiDesignDto = {
  name: string
  resources: ApiDesignResourceDto[]
  endpoints: ApiDesignEndpointDto[]
  schemas: ApiDesignSchemaDto[]
  authSchemes: ApiDesignAuthSchemeDto[]
  updatedAt: Date
}
