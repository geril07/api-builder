import { Card } from '@/shared/ui/card'

export default function DashboardLoading() {
  return (
    <section className="mx-auto flex w-full flex-1 flex-col px-6 py-8">
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-48 bg-muted" />
          <div className="mt-2 h-4 w-72 bg-muted" />
        </div>
        <div className="h-8 w-36 bg-muted" />
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[48, 36, 44].map((w) => (
          <Card key={w} className="p-4">
            <div className="h-4 bg-muted" style={{ width: w }} />
            <div className="mt-3 flex gap-3">
              <div className="h-3 w-20 bg-muted" />
              <div className="h-3 w-20 bg-muted" />
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <div className="h-3 w-24 bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
