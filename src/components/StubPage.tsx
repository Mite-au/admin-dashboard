import type { ComponentType } from 'react';
import { Clock } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';

/**
 * A destination that exists in the nav but has no data behind it yet.
 *
 * The dashed border is the tell: solid panels hold real records, dashed ones
 * are reserved space. That reads as a decision rather than a missing screen.
 */
export async function StubPage({
  breadcrumb,
  href,
  title,
  description,
  icon: Icon = Clock,
}: {
  breadcrumb: string;
  href: string;
  title: string;
  description: string;
  icon?: ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
}) {
  return (
    <>
      <Topbar breadcrumbs={[{ label: breadcrumb, href }]} />
      <PageHeader title={title} />
      <div className="px-8 pb-8">
        <div className="flex flex-col items-center justify-center rounded-panel border border-dashed border-ink-200 bg-ink-50/50 px-6 py-16 text-center">
          <span
            aria-hidden="true"
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-panel border border-ink-200 bg-white text-ink-400"
          >
            <Icon size={20} strokeWidth={1.75} />
          </span>
          <p className="label-micro mb-2 text-ink-400">Not built yet</p>
          <p className="text-[0.9375rem] font-semibold text-ink-900">{title}</p>
          <p className="mt-1.5 max-w-md text-data leading-relaxed text-ink-500">
            {description}
          </p>
        </div>
      </div>
    </>
  );
}
