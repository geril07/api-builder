import { Loader2 } from 'lucide-react'

import { cn } from '@/shared/utils/cn'

function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('animate-spin text-current', className)}
      aria-hidden="true"
    />
  )
}

export { Spinner }
