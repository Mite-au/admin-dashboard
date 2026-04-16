'use client';

import clsx from 'clsx';

export type DetailTab = {
  key: string;
  label: string;
  count?: number | string;
};

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
    <div className="flex items-center gap-7 border-b border-ink-100">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={clsx(
              'relative pb-3 flex items-center gap-2 text-sm transition-colors',
              isActive
                ? 'text-ink-900 font-semibold'
                : 'text-ink-500 hover:text-ink-900',
            )}
          >
            <span>{t.label}</span>
            <span
              className={clsx(
                'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                isActive ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-700',
              )}
            >
              {t.count ?? 'nn'}
            </span>
            {isActive && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-ink-900 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
