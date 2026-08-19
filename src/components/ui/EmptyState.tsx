import clsx from 'clsx';
import type { ComponentType, ReactNode } from 'react';

/**
 * Shown where records would be. An empty screen is an invitation to act, so
 * `description` should say what would put something here and `action` should
 * offer the nearest way to get there — not apologise for the emptiness.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{
    size?: number | string;
    strokeWidth?: number | string;
    className?: string;
  }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        className,
      )}
    >
      {Icon && (
        <span
          aria-hidden="true"
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-panel bg-ink-50 text-ink-400"
        >
          <Icon size={20} strokeWidth={1.75} />
        </span>
      )}
      <p className="text-[0.9375rem] font-semibold text-ink-900">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-data leading-relaxed text-ink-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex items-center gap-2">{action}</div>}
    </div>
  );
}
