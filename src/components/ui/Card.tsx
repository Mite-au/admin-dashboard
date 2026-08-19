import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * A titled panel inside the page shell.
 *
 * `bleed` drops the body's horizontal padding so a table can run edge to edge
 * against the panel border, while the header keeps its own padding — the
 * header and the table's first column then align on the same 20px gutter.
 */
export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  bleed,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <section className={clsx('card-inner overflow-hidden', className)}>
      {hasHeader && (
        <header
          className={clsx(
            'flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5',
            bleed ? 'pb-4' : 'pb-0',
          )}
        >
          <div className="min-w-0">
            {title && (
              <h2 className="text-[0.9375rem] font-semibold leading-6 text-ink-900">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-0.5 text-data text-ink-500">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          )}
        </header>
      )}

      <div
        className={clsx(
          bleed ? 'px-0' : 'px-5',
          hasHeader ? (bleed ? 'pb-0' : 'pb-5 pt-4') : bleed ? 'py-0' : 'py-5',
        )}
      >
        {children}
      </div>
    </section>
  );
}
