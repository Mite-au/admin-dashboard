'use client';

import { useCallback, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { PRESETS, getPresetRange, resolvePeriod, todayDayKey } from '@/lib/period';
import type { PeriodPreset } from '@/lib/period';

/**
 * Segmented control over whatever `PRESETS` contains — the list is never
 * hardcoded here. The track wraps rather than scrolls, and uses a panel
 * radius instead of a full pill so a wrapped second row still reads as one
 * control; that is what keeps it intact as the preset list grows.
 */
export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = resolvePeriod(searchParams);
  // Nothing is bucketed past today; a future date only ever produces zeros.
  const today = todayDayKey();

  const [customFrom, setCustomFrom] = useState<string>(
    current.preset === 'custom' ? current.from : '',
  );
  const [customTo, setCustomTo] = useState<string>(
    current.preset === 'custom' ? current.to : '',
  );

  const navigate = useCallback(
    (params: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete('preset');
      next.delete('from');
      next.delete('to');
      for (const [k, v] of Object.entries(params)) {
        next.set(k, v);
      }
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const handlePreset = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      const fallback = getPresetRange('last7d');
      setCustomFrom(current.preset === 'custom' ? current.from : fallback.from);
      setCustomTo(current.preset === 'custom' ? current.to : fallback.to);
      navigate({
        preset: 'custom',
        from: current.preset === 'custom' ? current.from : fallback.from,
        to: current.preset === 'custom' ? current.to : fallback.to,
      });
    } else {
      navigate({ preset });
    }
  };

  const canApply =
    Boolean(customFrom) &&
    Boolean(customTo) &&
    customFrom <= customTo;

  const handleApply = () => {
    if (!canApply) return;
    navigate({ preset: 'custom', from: customFrom, to: customTo });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="group"
        aria-label="Reporting period"
        className="inline-flex flex-wrap items-center gap-1 rounded-panel bg-ink-50 p-1"
      >
        {PRESETS.map((p) => {
          const isActive = current.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p.id)}
              aria-pressed={isActive}
              className={clsx(
                'whitespace-nowrap rounded-[0.625rem] px-3 py-1.5 text-data transition-colors duration-150',
                isActive
                  ? 'bg-white font-semibold text-ink-900 shadow-chip'
                  : 'font-medium text-ink-500 hover:text-ink-900',
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {current.preset === 'custom' && (
        <div className="inline-flex flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="From date"
            value={customFrom}
            max={customTo || today}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="tnum rounded-control border border-ink-200 bg-white px-2.5 py-1.5 text-data
                       text-ink-900 transition-colors hover:border-ink-300
                       focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
          <span aria-hidden="true" className="text-ink-400">
            –
          </span>
          <input
            type="date"
            aria-label="To date"
            value={customTo}
            min={customFrom || undefined}
            max={today}
            onChange={(e) => setCustomTo(e.target.value)}
            className="tnum rounded-control border border-ink-200 bg-white px-2.5 py-1.5 text-data
                       text-ink-900 transition-colors hover:border-ink-300
                       focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className="rounded-control bg-ink-900 px-3.5 py-1.5 text-data font-semibold text-white
                       transition-colors hover:bg-ink-700
                       disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
