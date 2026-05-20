import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const id = () => uuid('id').defaultRandom().primaryKey()

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())

export const usersTable = pgTable('users', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const organizationsTable = pgTable(
  'organizations',
  {
    id: id(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    logo: text('logo'),
    metadata: jsonb('metadata'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('organizations_slug_unique').on(table.slug)],
)

export const sessionsTable = pgTable(
  'sessions',
  {
    id: id(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    activeOrganizationId: uuid('active_organization_id').references(
      () => organizationsTable.id,
      { onDelete: 'set null' },
    ),
  },
  (table) => [
    uniqueIndex('sessions_token_unique').on(table.token),
    index('sessions_user_id_index').on(table.userId),
    index('sessions_expires_at_index').on(table.expiresAt),
  ],
)

export const accountsTable = pgTable(
  'accounts',
  {
    id: id(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('accounts_user_id_index').on(table.userId),
    uniqueIndex('accounts_provider_account_unique').on(
      table.providerId,
      table.accountId,
    ),
  ],
)

export const verificationsTable = pgTable(
  'verifications',
  {
    id: id(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('verifications_identifier_index').on(table.identifier),
    index('verifications_expires_at_index').on(table.expiresAt),
  ],
)

export const membersTable = pgTable(
  'members',
  {
    id: id(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('members_organization_id_index').on(table.organizationId),
    index('members_user_id_index').on(table.userId),
    uniqueIndex('members_organization_user_unique').on(
      table.organizationId,
      table.userId,
    ),
    check(
      'members_role_check',
      sql`${table.role} IN ('member', 'owner', 'admin')`,
    ),
  ],
)

export const invitationsTable = pgTable(
  'invitations',
  {
    id: id(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role'),
    status: text('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    inviterId: uuid('inviter_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('invitations_organization_id_index').on(table.organizationId),
    index('invitations_email_index').on(table.email),
    index('invitations_expires_at_index').on(table.expiresAt),
    index('invitations_status_index').on(table.status),
    check(
      'invitations_role_check',
      sql`${table.role} IS NULL OR ${table.role} IN ('member', 'owner', 'admin')`,
    ),
    check(
      'invitations_status_check',
      sql`${table.status} IN ('pending', 'accepted', 'rejected', 'expired')`,
    ),
  ],
)

export const apiDesignsTable = pgTable(
  'api_designs',
  {
    id: id(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('api_designs_workspace_updated_at_index').on(
      table.workspaceId,
      table.updatedAt,
    ),
    index('api_designs_created_by_id_index').on(table.createdById),
  ],
)

export const apiDesignResourcesTable = pgTable(
  'api_design_resources',
  {
    id: id(),
    apiDesignId: uuid('api_design_id')
      .notNull()
      .references(() => apiDesignsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    positionX: real('position_x').notNull().default(0),
    positionY: real('position_y').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('api_design_resources_api_design_id_index').on(table.apiDesignId),
  ],
)

export const apiDesignSchemasTable = pgTable(
  'api_design_schemas',
  {
    id: id(),
    apiDesignId: uuid('api_design_id')
      .notNull()
      .references(() => apiDesignsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    jsonSchema: jsonb('json_schema').notNull(),
    positionX: real('position_x').notNull().default(0),
    positionY: real('position_y').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('api_design_schemas_api_design_id_index').on(table.apiDesignId),
  ],
)

export const apiDesignAuthSchemesTable = pgTable(
  'api_design_auth_schemes',
  {
    id: id(),
    apiDesignId: uuid('api_design_id')
      .notNull()
      .references(() => apiDesignsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    config: jsonb('config').notNull(),
    positionX: real('position_x').notNull().default(0),
    positionY: real('position_y').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('api_design_auth_schemes_api_design_id_index').on(table.apiDesignId),
    check(
      'api_design_auth_schemes_type_check',
      sql`${table.type} IN ('bearer', 'apiKey', 'oauth2', 'openIdConnect')`,
    ),
  ],
)

export const apiDesignEndpointsTable = pgTable(
  'api_design_endpoints',
  {
    id: id(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => apiDesignResourcesTable.id, { onDelete: 'cascade' }),
    method: text('method').notNull(),
    path: text('path').notNull(),
    summary: text('summary'),
    requestBody: jsonb('request_body'),
    responseShape: jsonb('response_shape'),
    requestBodySchemaId: uuid('request_body_schema_id').references(
      () => apiDesignSchemasTable.id,
      { onDelete: 'set null' },
    ),
    responseShapeSchemaId: uuid('response_shape_schema_id').references(
      () => apiDesignSchemasTable.id,
      { onDelete: 'set null' },
    ),
    authRequirement: text('auth_requirement'),
    queryParams: jsonb('query_params')
      .default(sql`'[]'::jsonb`)
      .notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('api_design_endpoints_resource_id_index').on(table.resourceId),
    index('api_design_endpoints_resource_sort_order_index').on(
      table.resourceId,
      table.sortOrder,
    ),
    index('api_design_endpoints_request_body_schema_id_index').on(
      table.requestBodySchemaId,
    ),
    index('api_design_endpoints_response_shape_schema_id_index').on(
      table.responseShapeSchemaId,
    ),
    check(
      'api_design_endpoints_method_check',
      sql`${table.method} IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')`,
    ),
  ],
)

export const apiDesignEndpointAuthSchemesTable = pgTable(
  'api_design_endpoint_auth_schemes',
  {
    endpointId: uuid('endpoint_id')
      .notNull()
      .references(() => apiDesignEndpointsTable.id, { onDelete: 'cascade' }),
    authSchemeId: uuid('auth_scheme_id')
      .notNull()
      .references(() => apiDesignAuthSchemesTable.id, {
        onDelete: 'cascade',
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.endpointId, table.authSchemeId],
      name: 'api_design_endpoint_auth_schemes_endpoint_id_auth_scheme_id_pk',
    }),
    index('api_design_endpoint_auth_schemes_auth_scheme_id_index').on(
      table.authSchemeId,
    ),
  ],
)

export const usersRelations = relations(usersTable, ({ many }) => ({
  accounts: many(accountsTable),
  sessions: many(sessionsTable),
  memberships: many(membersTable),
  apiDesigns: many(apiDesignsTable),
  invitations: many(invitationsTable),
}))

export const accountsRelations = relations(accountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
}))

export const organizationsRelations = relations(
  organizationsTable,
  ({ many }) => ({
    members: many(membersTable),
    invitations: many(invitationsTable),
    apiDesigns: many(apiDesignsTable),
    activeSessions: many(sessionsTable),
  }),
)

export const membersRelations = relations(membersTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [membersTable.organizationId],
    references: [organizationsTable.id],
  }),
  user: one(usersTable, {
    fields: [membersTable.userId],
    references: [usersTable.id],
  }),
}))

export const apiDesignsRelations = relations(
  apiDesignsTable,
  ({ one, many }) => ({
    workspace: one(organizationsTable, {
      fields: [apiDesignsTable.workspaceId],
      references: [organizationsTable.id],
    }),
    createdBy: one(usersTable, {
      fields: [apiDesignsTable.createdById],
      references: [usersTable.id],
    }),
    resources: many(apiDesignResourcesTable),
    schemas: many(apiDesignSchemasTable),
    authSchemes: many(apiDesignAuthSchemesTable),
  }),
)

export const apiDesignResourcesRelations = relations(
  apiDesignResourcesTable,
  ({ one, many }) => ({
    apiDesign: one(apiDesignsTable, {
      fields: [apiDesignResourcesTable.apiDesignId],
      references: [apiDesignsTable.id],
    }),
    endpoints: many(apiDesignEndpointsTable),
  }),
)

export const apiDesignSchemasRelations = relations(
  apiDesignSchemasTable,
  ({ one, many }) => ({
    apiDesign: one(apiDesignsTable, {
      fields: [apiDesignSchemasTable.apiDesignId],
      references: [apiDesignsTable.id],
    }),
    requestBodyEndpoints: many(apiDesignEndpointsTable, {
      relationName: 'requestBodySchema',
    }),
    responseShapeEndpoints: many(apiDesignEndpointsTable, {
      relationName: 'responseShapeSchema',
    }),
  }),
)

export const apiDesignAuthSchemesRelations = relations(
  apiDesignAuthSchemesTable,
  ({ one, many }) => ({
    apiDesign: one(apiDesignsTable, {
      fields: [apiDesignAuthSchemesTable.apiDesignId],
      references: [apiDesignsTable.id],
    }),
    endpointLinks: many(apiDesignEndpointAuthSchemesTable),
  }),
)

export const apiDesignEndpointsRelations = relations(
  apiDesignEndpointsTable,
  ({ one, many }) => ({
    resource: one(apiDesignResourcesTable, {
      fields: [apiDesignEndpointsTable.resourceId],
      references: [apiDesignResourcesTable.id],
    }),
    requestBodySchema: one(apiDesignSchemasTable, {
      fields: [apiDesignEndpointsTable.requestBodySchemaId],
      references: [apiDesignSchemasTable.id],
      relationName: 'requestBodySchema',
    }),
    responseShapeSchema: one(apiDesignSchemasTable, {
      fields: [apiDesignEndpointsTable.responseShapeSchemaId],
      references: [apiDesignSchemasTable.id],
      relationName: 'responseShapeSchema',
    }),
    authSchemeLinks: many(apiDesignEndpointAuthSchemesTable),
  }),
)

export const apiDesignEndpointAuthSchemesRelations = relations(
  apiDesignEndpointAuthSchemesTable,
  ({ one }) => ({
    endpoint: one(apiDesignEndpointsTable, {
      fields: [apiDesignEndpointAuthSchemesTable.endpointId],
      references: [apiDesignEndpointsTable.id],
    }),
    authScheme: one(apiDesignAuthSchemesTable, {
      fields: [apiDesignEndpointAuthSchemesTable.authSchemeId],
      references: [apiDesignAuthSchemesTable.id],
    }),
  }),
)

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
  activeOrganization: one(organizationsTable, {
    fields: [sessionsTable.activeOrganizationId],
    references: [organizationsTable.id],
  }),
}))

export const invitationsRelations = relations(invitationsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [invitationsTable.organizationId],
    references: [organizationsTable.id],
  }),
  inviter: one(usersTable, {
    fields: [invitationsTable.inviterId],
    references: [usersTable.id],
  }),
}))

export type ApiDesignResourceRow = typeof apiDesignResourcesTable.$inferSelect
export type ApiDesignEndpointRow = typeof apiDesignEndpointsTable.$inferSelect
export type ApiDesignSchemaRow = typeof apiDesignSchemasTable.$inferSelect
export type ApiDesignAuthSchemeRow =
  typeof apiDesignAuthSchemesTable.$inferSelect

export const authSchema = {
  users: usersTable,
  sessions: sessionsTable,
  accounts: accountsTable,
  verifications: verificationsTable,
  organizations: organizationsTable,
  members: membersTable,
  invitations: invitationsTable,
}
