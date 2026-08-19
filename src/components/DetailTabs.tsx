'use client';

import clsx from 'clsx';

export type DetailTab = {
  key: string;
  label: string;
  count?: number | string;
};

/**
 * Section tabs inside a detail record — underline style, deliberately
 * distinct from the segmented `ui/Tabs`, which switches what a page shows.
 *
 * The count chip only renders when a count was supplied; the old component
 * printed "0" for tabs that never had one.
 */
export function DetailTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: DetailTab[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div role="tablist" className="flex items-center gap-6 border-b border-ink-100">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={clsx(
              'relative -mb-px flex items-center gap-2 border-b-2 pb-2.5 pt-1 text-sm',
              'transition-colors duration-150',
              isActive
                ? 'border-ink-900 font-semibold text-ink-900'
                : 'border-transparent font-medium text-ink-500 hover:border-ink-200 hover:text-ink-900',
            )}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span
                className={clsx(
                  'tnum inline-flex items-center justify-center rounded-full px-1.5 py-px text-2xs font-semibold',
                  isActive ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
