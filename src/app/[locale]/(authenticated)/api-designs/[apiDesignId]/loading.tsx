import { Spinner } from '@/shared/ui/spinner'

export default function ApiDesignLoading() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="text-center">
        <Spinner className="mx-auto h-8 w-8" />
        <p className="mt-3 text-sm">Loading API design...</p>
      </div>
    </div>
  )
}
