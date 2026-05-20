import { notFound } from 'next/navigation'
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { ORPCError } from '@orpc/server'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/shared/i18n/routing'
import { apiDesignQueryKey } from '@/modules/api-design'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'
import { ApiDesignEditor } from './canvas-loader'
import { createOrpcServerClient } from '@/app/api/orpc/server-client'

type ApiDesignEditorPageProps = {
  params: Promise<{ apiDesignId: string; locale: string }>
}

export default async function ApiDesignEditorPage({
  params,
}: ApiDesignEditorPageProps) {
  const { apiDesignId } = await params
  const queryClient = new QueryClient()
  const caller = await createOrpcServerClient()
  const t = await getTranslations('Dashboard')

  const apiDesign = await caller.apiDesign
    .get({ apiDesignId })
    .catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === 'NOT_FOUND') {
        notFound()
      }

      throw error
    })

  queryClient.setQueryData(apiDesignQueryKey(apiDesignId), apiDesign)

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-9 shrink-0 items-center border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link href="/dashboard">{t('apiDesigns')}</Link>}
              />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-mono text-[0.65rem]">
                {apiDesign.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex min-h-0 flex-1">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ApiDesignEditor apiDesignId={apiDesignId} />
        </HydrationBoundary>
      </div>
    </section>
  )
}
