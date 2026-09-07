'use client';

import clsx from 'clsx';
import { useRef } from 'react';

export type TabItem = { id: string; label: string; count?: number };

/**
 * Top-level view switcher: a segmented control in an inset track.
 *
 * Deliberately distinct from `DetailTabs` (underline), so the two read as
 * different jobs — this swaps what the page is showing, `DetailTabs` moves
 * between sections of one record.
 *
 * Uses a roving tabindex so the whole control is one tab stop and the arrow
 * keys move between segments, per the tablist pattern.
 */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
  controls,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  /** id of the panel these tabs switch, for `aria-controls`. */
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
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      className={clsx(
        'inline-flex flex-wrap items-center gap-1 rounded-panel bg-ink-50 p-1',
        className,
      )}
    >
      {tabs.map((tab, i) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={controls}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-[0.625rem] px-3 py-1.5 text-data',
              'transition-colors duration-150',
              isActive
                ? 'bg-white font-semibold text-ink-900 shadow-chip'
                : 'font-medium text-ink-500 hover:text-ink-900',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'tnum rounded-full px-1.5 py-px text-2xs font-semibold',
                  isActive ? 'bg-ink-100 text-ink-700' : 'bg-ink-200/70 text-ink-600',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
