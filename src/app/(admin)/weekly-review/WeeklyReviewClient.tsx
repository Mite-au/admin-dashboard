'use client';

import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, EmptyState, StatCard } from '@/components/ui';
import { addDays, periodLabel, weekStartKey } from '@/lib/period';
import type { WeeklyMetricsResponse } from '@/lib/types';
import { WeekPicker } from './WeekPicker';
import { kpiDeltaChip, kpiPriorValue, kpiValue, pickMovers, readKpis, type WeeklyKpi } from './kpis';

export function WeeklyReviewClient({ data }: { data: WeeklyMetricsResponse }) {
  const router = useRouter();
  const kpis = readKpis(data);
  const { riser, faller } = pickMovers(kpis);

  const thisWeek = { from: data.week.thisWeekStart, to: data.week.thisWeekEnd };
  const lastWeek = { from: data.week.lastWeekStart, to: data.week.lastWeekEnd };
  // The endpoint anchors weeks in UTC, so the comparison must too: a Sydney
  // Monday morning is still the previous UTC week for an hour or so.
  const currentMonday = weekStartKey(new Date().toISOString().slice(0, 10));
  const isCurrentWeek = data.week.thisWeekStart === currentMonday;

  // A real navigation, unlike the overview's tab state: a different week is a
  // different query, so the server has to fetch it.
  const goTo = (mondayKey: string) => router.push(`?date=${mondayKey}`);

  const movers = [
    riser ? ({ tone: 'up', kpi: riser } as const) : null,
    faller ? ({ tone: 'down', kpi: faller } as const) : null,
  ].filter((entry): entry is { tone: 'up' | 'down'; kpi: WeeklyKpi } => entry !== null);

  return (
    <div className="space-y-6 px-8 pb-10">
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goTo(addDays(data.week.thisWeekStart, -7))}
                aria-label="Previous week"
                className="inline-flex h-8 w-8 items-center justify-center rounded-control border
                           border-ink-200 text-ink-700 transition-colors hover:bg-ink-50
                           hover:text-ink-900"
              >
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo(addDays(data.week.thisWeekStart, 7))}
                disabled={isCurrentWeek}
                aria-label="Next week"
                className="inline-flex h-8 w-8 items-center justify-center rounded-control border
                           border-ink-200 text-ink-700 transition-colors hover:bg-ink-50
                           hover:text-ink-900 disabled:cursor-not-allowed disabled:text-ink-300
                           disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <div className="min-w-0">
              <p className="label-micro">Review week</p>
              <p className="mt-0.5 text-title font-bold text-ink-900">{periodLabel(thisWeek)}</p>
            </div>

            <WeekPicker selectedMonday={data.week.thisWeekStart} onSelect={goTo} />

            {!isCurrentWeek && (
              <button type="button" onClick={() => goTo(currentMonday)} className="btn-icon">
                This week
              </button>
            )}
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-3">
            <div className="rounded-panel bg-ink-50 px-4 py-3">
              <dt className="label-micro">Compared with</dt>
              <dd className="mt-1 text-data font-semibold text-ink-900">
                {periodLabel(lastWeek)}
              </dd>
            </div>
            <div className="rounded-panel bg-ink-50 px-4 py-3">
              <dt className="label-micro">Timezone</dt>
              <dd className="mt-1 text-data font-semibold text-ink-900">{data.week.timezone}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-5 border-t border-ink-100 pt-4 text-data leading-relaxed text-ink-500">
          Weeks run Monday to Sunday in UTC, so an Australian Monday morning still
          counts against the week before. All five figures lean on analytics events
          rather than the tables, so each one starts on the day its event shipped and
          quietly under-counts anything that happened before that.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.key}
            label={kpi.label}
            value={kpiValue(kpi.metric)}
            delta={kpiDeltaChip(kpi)}
            hint={kpi.hint}
            footer={
              <p className="tnum text-xs text-ink-500">
                Last week {kpiPriorValue(kpi.metric)}
              </p>
            }
          />
        ))}
      </div>

      <Card title="Biggest movers" subtitle="Ranked by relative change against last week">
        {movers.length === 0 ? (
          <EmptyState
            icon={Minus}
            title="A flat week"
            description="No core KPI moved measurably against last week — or every one of them started from zero, which leaves nothing to compare."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {movers.map(({ tone, kpi }) => (
              <MoverPanel key={kpi.key} tone={tone} kpi={kpi} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MoverPanel({ tone, kpi }: { tone: 'up' | 'down'; kpi: WeeklyKpi }) {
  const Icon = tone === 'up' ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-panel bg-ink-50 p-4">
      <p className="label-micro flex items-center gap-1.5">
        <Icon
          aria-hidden="true"
          size={13}
          strokeWidth={2.2}
          className={tone === 'up' ? 'text-success-700' : 'text-danger-700'}
        />
        {tone === 'up' ? 'Biggest gain' : 'Biggest drop'}
      </p>
      <p className="mt-2 text-[0.9375rem] font-semibold text-ink-900">{kpi.label}</p>
      <p className="tnum mt-1 text-data text-ink-600">
        {kpiPriorValue(kpi.metric)} → {kpiValue(kpi.metric)}
        <span
          className={clsx(
            'ml-1.5 font-semibold',
            tone === 'up' ? 'text-success-700' : 'text-danger-700',
          )}
        >
          {kpiDeltaChip(kpi).formatted}
        </span>
      </p>
    </div>
  );
}
