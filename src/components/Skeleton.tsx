import clsx from 'clsx';

function joinClassNames(...classes: Array<string | undefined | false>) {
  return clsx(classes);
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={joinClassNames(
        'relative overflow-hidden rounded-md bg-ink-100/90',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.8s_ease-in-out_infinite]',
        'before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)]',
        className,
      )}
    />
  );
}

export function TopbarSkeleton() {
  return (
    <header className="flex items-center justify-between px-8 pt-7 pb-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </header>
  );
}

export function PageHeaderSkeleton({ width = 'w-36' }: { width?: string }) {
  return <Skeleton className={joinClassNames('mx-8 mt-2 mb-6 h-8', width)} />;
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  const widths = ['w-20', 'w-32', 'w-24', 'w-36', 'w-16', 'w-24', 'w-14', 'w-28'];

  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3 border-b border-ink-100">
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
      <div className="px-8 pb-4 flex items-center gap-3 flex-wrap">
        {Array.from({ length: filters }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-36 rounded-full" />
        ))}
        <Skeleton className="ml-auto h-10 w-28 rounded-full" />
      </div>
      <div className="px-8 pb-8">
        <div className="overflow-hidden rounded-xl border border-ink-200">
          <table className="data-table">
            <thead>
              <tr>
                {Array.from({ length: cols }).map((_, i) => (
                  <th key={i}>
                    <Skeleton className="h-3 w-16" />
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
      <div className="px-8 pb-8 space-y-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm space-y-3"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
          <Skeleton className="mb-5 h-4 w-36" />
          <div className="grid h-[320px] grid-cols-12 items-end gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className={joinClassNames(
                  'rounded-2xl',
                  [
                    'h-24',
                    'h-36',
                    'h-28',
                    'h-44',
                    'h-32',
                    'h-52',
                    'h-40',
                    'h-56',
                    'h-48',
                    'h-60',
                    'h-44',
                    'h-72',
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
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="card-inner lg:col-span-5 p-6 space-y-6">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className={joinClassNames('h-4', i % 2 === 0 ? 'w-28' : 'w-40')} />
              </div>
            ))}
          </div>
        </section>
        <section className="card-inner lg:col-span-4 p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className={joinClassNames('h-4', i === 2 ? 'w-48' : 'w-28')} />
              </div>
            ))}
          </div>
          <div className="border-t border-ink-100 pt-5 space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
        </section>
        <section className="card-inner lg:col-span-3 p-6 space-y-3">
          <Skeleton className="mb-1 h-5 w-20" />
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
        <div className="card-inner p-10 space-y-3">
          <Skeleton className="mx-auto h-5 w-40" />
          <Skeleton className="mx-auto h-4 w-72 max-w-full" />
        </div>
      </div>
    </>
  );
}
