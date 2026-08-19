import clsx from 'clsx';

function joinClassNames(...classes: Array<string | undefined | false>) {
  return clsx(classes);
}

/**
 * Loading placeholder. The shimmer is a sweeping highlight on a `::before`
 * pseudo-element; the global `prefers-reduced-motion` rule parks it off-screen
 * so it degrades to a plain tinted block rather than a flashing one.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={joinClassNames(
        'relative overflow-hidden rounded-md bg-ink-100',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_2s_ease-in-out_infinite]',
        'before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)]',
        className,
      )}
    />
  );
}

export function TopbarSkeleton() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink-100 px-8">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-44 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-control" />
      </div>
    </header>
  );
}

export function PageHeaderSkeleton({ width = 'w-36' }: { width?: string }) {
  return <Skeleton className={joinClassNames('mx-8 mb-5 mt-6 h-7', width)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="card-inner space-y-3 p-5">
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-4 w-16 rounded-full" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  const widths = ['w-20', 'w-32', 'w-24', 'w-36', 'w-16', 'w-24', 'w-14', 'w-28'];

  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="border-b border-ink-100 px-4 py-3">
          <Skeleton className={joinClassNames('h-3.5', widths[i % widths.length])} />
        </td>
      ))}
    </tr>
  );
}

export function TablePageSkeleton({
  cols = 6,
  rows = 10,
  filters = 4,
  headerWidth = 'w-32',
}: {
  cols?: number;
  rows?: number;
  filters?: number;
  headerWidth?: string;
}) {
  return (
    <>
      <TopbarSkeleton />
      <PageHeaderSkeleton width={headerWidth} />
      <div className="px-8 pb-6">
        <div className="card-inner p-5">
          <div className="mb-4 flex items-center gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-7 w-28 rounded-control" />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: filters }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-10 w-full rounded-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-28 shrink-0 rounded-full" />
          </div>
        </div>
      </div>
      <div className="px-8 pb-8">
        <div className="overflow-hidden rounded-panel border border-ink-200">
          <table className="data-table">
            <thead>
              <tr>
                {Array.from({ length: cols }).map((_, i) => (
                  <th key={i}>
                    <Skeleton className="h-2.5 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} cols={cols} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function OverviewPageSkeleton() {
  return (
    <>
      <TopbarSkeleton />
      <PageHeaderSkeleton width="w-28" />
      <div className="space-y-6 px-8 pb-8">
        <Skeleton className="h-9 w-80 rounded-panel" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="card-inner p-5">
          <Skeleton className="mb-5 h-4 w-36" />
          <div className="grid h-[320px] grid-cols-12 items-end gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className={joinClassNames(
                  'rounded-lg',
                  [
                    'h-24', 'h-36', 'h-28', 'h-44', 'h-32', 'h-52',
                    'h-40', 'h-56', 'h-48', 'h-60', 'h-44', 'h-72',
                  ][i],
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function DetailPageSkeleton() {
  return (
    <>
      <TopbarSkeleton />
      <PageHeaderSkeleton width="w-40" />
      <div className="grid grid-cols-1 gap-5 px-8 pb-8 lg:grid-cols-12">
        <section className="card-inner space-y-6 p-5 lg:col-span-5">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className={joinClassNames('h-4', i % 2 === 0 ? 'w-28' : 'w-40')} />
              </div>
            ))}
          </div>
        </section>
        <section className="card-inner space-y-6 p-5 lg:col-span-4">
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className={joinClassNames('h-4', i === 2 ? 'w-48' : 'w-28')} />
              </div>
            ))}
          </div>
          <div className="space-y-4 border-t border-ink-100 pt-5">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
        </section>
        <section className="card-inner space-y-2.5 p-5 lg:col-span-3">
          <Skeleton className="mb-1 h-2.5 w-20" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-10 w-full rounded-full" />
        </section>
      </div>
    </>
  );
}

export function StubPageSkeleton() {
  return (
    <>
      <TopbarSkeleton />
      <PageHeaderSkeleton width="w-28" />
      <div className="px-8 pb-8">
        <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-ink-200 bg-ink-50/50 px-6 py-16">
          <Skeleton className="h-11 w-11 rounded-panel" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>
      </div>
    </>
  );
}
