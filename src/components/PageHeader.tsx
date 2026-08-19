import type { ReactNode } from 'react';

/**
 * The title band — second of the shell's three horizontal zones, between the
 * Topbar hairline and the page content. `description` and `actions` are
 * optional slots; passing neither renders exactly the old single-line header.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-8 pb-5 pt-6">
      <div className="min-w-0">
        <h1 className="text-title font-bold text-ink-900">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-data text-ink-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
