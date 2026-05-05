'use client';

import { useCallback, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PRESETS, getPresetRange, resolvePeriod } from '@/lib/period';
import type { PeriodPreset } from '@/lib/period';

export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = resolvePeriod(searchParams);

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
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePreset(p.id)}
            className={[
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              current.preset === p.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-ink-100 text-ink-600 hover:border-blue-300 hover:text-blue-600',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>

      {current.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            max={customTo || undefined}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="text-xs border border-ink-100 rounded-lg px-2 py-1.5 text-ink-700 bg-white"
          />
          <span className="text-xs text-ink-400">—</span>
          <input
            type="date"
            value={customTo}
            min={customFrom || undefined}
            onChange={(e) => setCustomTo(e.target.value)}
            className="text-xs border border-ink-100 rounded-lg px-2 py-1.5 text-ink-700 bg-white"
          />
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
