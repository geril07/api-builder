import { getTranslations } from 'next-intl/server'

import { createOrpcServerClient } from '@/app/api/orpc/server-client'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/shared/ui/breadcrumb'
import { Card } from '@/shared/ui/card'

import { ApiDesignList } from './api-design-list'
import { CreateApiDesignDialog } from './create-api-design-dialog'

export default async function DashboardPage() {
  const caller = await createOrpcServerClient()
  const designsWithRelations = await caller.apiDesign.list()
  const t = await getTranslations('Dashboard')

  const designs = designsWithRelations.map((d) => ({
    id: d.id,
    name: d.name,
    updatedAt: d.updatedAt,
    resourceCount: d.resources.length,
    endpointCount: d.resources.reduce((sum, r) => sum + r.endpoints.length, 0),
  }))

  return (
    <section className="mx-auto flex w-full flex-1 flex-col px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{t('apiDesigns')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <CreateApiDesignDialog />
      </div>

      {designs.length > 0 ? (
        <ApiDesignList designs={designs} />
      ) : (
        <Card className="mt-6 flex flex-1 items-center justify-center p-10 text-center">
          <div>
            <p className="font-mono text-sm font-semibold">
              {t('noApiDesigns')}
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {t('createFirstDesign')}
            </p>
            <CreateApiDesignDialog />
          </div>
        </Card>
      )}
    </section>
  )
}
