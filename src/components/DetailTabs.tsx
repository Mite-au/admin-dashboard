'use client';

import clsx from 'clsx';
import { useRef } from 'react';

export type DetailTab = {
  key: string;
  label: string;
  count?: number | string;
};

/**
 * Section tabs inside a detail record — underline style, deliberately
 * distinct from the segmented `ui/Tabs`, which switches what a page shows.
 *
 * Same keyboard contract as `ui/Tabs`: one tab stop with the arrow keys
 * moving between sections, and `controls` names the panel for
 * `aria-controls`.
 *
 * The count chip only renders when a count was supplied; the old component
 * printed "0" for tabs that never had one.
 */
export function DetailTabs({
  tabs,
  active,
  onChange,
  controls,
}: {
  tabs: DetailTab[];
  active: string;
  onChange: (key: string) => void;
  controls?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;

    e.preventDefault();
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" className="flex items-center gap-6 border-b border-ink-100">
      {tabs.map((t, i) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={controls}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(t.key)}
            onKeyDown={(e) => handleKeyDown(e, i)}
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
