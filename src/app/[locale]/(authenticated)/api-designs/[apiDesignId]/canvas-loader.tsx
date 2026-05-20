'use client'

import dynamic from 'next/dynamic'

export const ApiDesignEditor = dynamic(
  () =>
    import('@/modules/api-design-editor/editor').then(
      (mod) => mod.ApiDesignEditor,
    ),
  { ssr: false },
)
