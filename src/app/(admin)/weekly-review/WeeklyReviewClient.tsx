'use client';

import clsx from 'clsx';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
  MessageSquareText,
  PackageCheck,
  ShoppingBag,
  UserCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/format';
import type {
  WeeklyCoreKpiKey,
  WeeklyMetricUnit,
  WeeklyMetricValue,
  WeeklyMetricsResponse,
} from '@/lib/types';

// ── Date helpers ───────────────────────────────────────────────────────

function isoWeekMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function todayMonday(): string {
  return isoWeekMonday(new Date());
}

function shiftWeek(isoDate: string, deltaDays: number): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/** All weeks (Mon–Sun rows) that overlap with the given UTC month. */
function buildMonthWeeks(year: number, month: number): string[][] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const dayOfWeek = firstDay.getUTCDay();
  const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startDate = new Date(Date.UTC(year, month, 1 - daysBack));

  const weeks: string[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(startDate);
      day.setUTCDate(startDate.getUTCDate() + w * 7 + d);
      week.push(day.toISOString().slice(0, 10));
    }
    weeks.push(week);
  }
  // Drop last row if it's entirely outside the target month
  const last = weeks[weeks.length - 1];
  if (last.every((d) => new Date(d + 'T00:00:00Z').getUTCMonth() !== month)) {
    weeks.pop();
  }
  return weeks;
}

// ── Week picker popover ────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function WeekPickerPopover({
  selectedMonday,
  onSelect,
}: {
  selectedMonday: string;
  onSelect: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selDate = new Date(selectedMonday + 'T00:00:00Z');
  const [viewYear, setViewYear] = useState(selDate.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(selDate.getUTCMonth());
  const [hoveredMonday, setHoveredMonday] = useState<string | null>(null);

  const currentMonday = todayMonday();
  const todayYM = new Date().getUTCFullYear() * 12 + new Date().getUTCMonth();
  const viewYM = viewYear * 12 + viewMonth;
  const canGoNextMonth = viewYM < todayYM;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Sync view month when selected week changes externally
  useEffect(() => {
    const d = new Date(selectedMonday + 'T00:00:00Z');
    setViewYear(d.getUTCFullYear());
    setViewMonth(d.getUTCMonth());
  }, [selectedMonday]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (!canGoNextMonth) return;
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const weeks = buildMonthWeeks(viewYear, viewMonth);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
          open
            ? 'border-ink-900 bg-ink-900 text-white'
            : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
        )}
      >
        <CalendarDays size={14} strokeWidth={1.8} />
        주 선택
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-ink-200 bg-white p-4 shadow-xl">
          {/* Month nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink-50 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-bold text-ink-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNextMonth}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink-50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="mb-1 grid grid-cols-7">
            {DAY_LABELS.map((d, i) => (
              <div
                key={i}
                className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-400"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Week rows */}
          <div className="space-y-0.5">
            {weeks.map((week) => {
              const weekMonday = week[0];
              const isSelected = weekMonday === selectedMonday;
              const isFuture = weekMonday > currentMonday;
              const isHovered = weekMonday === hoveredMonday;

              return (
                <div
                  key={weekMonday}
                  onMouseEnter={() => { if (!isFuture) setHoveredMonday(weekMonday); }}
                  onMouseLeave={() => setHoveredMonday(null)}
                  onClick={() => {
                    if (isFuture) return;
                    onSelect(weekMonday);
                    setOpen(false);
                  }}
                  className={clsx(
                    'grid grid-cols-7 rounded-xl transition-colors',
                    isFuture
                      ? 'cursor-not-allowed opacity-30'
                      : 'cursor-pointer',
                    isSelected && 'bg-ink-900',
                    !isSelected && isHovered && 'bg-ink-100',
                  )}
                >
                  {week.map((day) => {
                    const dayNum = new Date(day + 'T00:00:00Z').getUTCDate();
                    const inMonth = new Date(day + 'T00:00:00Z').getUTCMonth() === viewMonth;
                    return (
                      <div
                        key={day}
                        className={clsx(
                          'py-1.5 text-center text-sm leading-none',
                          isSelected
                            ? 'text-white font-semibold'
                            : inMonth
                            ? 'text-ink-800'
                            : 'text-ink-300',
                        )}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-center text-[11px] text-ink-400">
            행 클릭으로 해당 주 이동
          </p>
        </div>
      )}
    </div>
  );
}

// ── KPI config & helpers ───────────────────────────────────────────────

type DeltaDirection = 'positive' | 'negative' | 'neutral';

const KPI_CONFIG: Array<{
  key: WeeklyCoreKpiKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { key: 'verifiedUsers',      label: 'Verified User Count',       description: 'Newly verified users this week',                   icon: UserCheck },
  { key: 'firstListingRate',   label: 'First Listing Rate',         description: 'Share of users making a first listing',            icon: CheckCircle2 },
  { key: 'publishedListings',  label: 'Published Listings',         description: 'Listings published during the week',               icon: PackageCheck },
  { key: 'chatStartRate',      label: 'Listing → Chat Start Rate',  description: 'Listing activity converting into chat starts',     icon: MessageSquareText },
  { key: 'transactionSignals', label: 'Transaction Signal Count',   description: 'Marketplace intent signals recorded this week',    icon: ShoppingBag },
];

function getDirection(delta: number): DeltaDirection {
  if (delta > 0) return 'positive';
  if (delta < 0) return 'negative';
  return 'neutral';
}

function formatMetricValue(value: number, unit: WeeklyMetricUnit) {
  if (unit === 'rate') return `${Math.round(value * 100)}%`;
  return new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(value);
}

function formatDelta(value: number, unit: WeeklyMetricUnit) {
  const sign = value > 0 ? '+' : '';
  if (unit === 'rate') return `${sign}${Math.round(value * 100)} pp`;
  return `${sign}${new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(value)}`;
}

function deltaScore(metric: WeeklyMetricValue) {
  return metric.unit === 'rate' ? metric.delta * 100 : metric.delta;
}

function getMetricSummaries(data: WeeklyMetricsResponse) {
  const entries = KPI_CONFIG.map((config) => ({
    ...config,
    metric: data.coreKpis[config.key],
  }));
  return {
    entries,
    strongest: entries.reduce((best, cur) => deltaScore(cur.metric) > deltaScore(best.metric) ? cur : best),
    weakest:   entries.reduce((worst, cur) => deltaScore(cur.metric) < deltaScore(worst.metric) ? cur : worst),
  };
}

// ── Sub-components ─────────────────────────────────────────────────────

function DeltaBadge({ metric }: { metric: WeeklyMetricValue }) {
  const direction = getDirection(metric.delta);
  const Icon =
    direction === 'positive' ? ArrowUpRight :
    direction === 'negative' ? ArrowDownRight : ArrowRight;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold',
        direction === 'positive' && 'bg-green-50 text-success',
        direction === 'negative' && 'bg-pink-50 text-danger',
        direction === 'neutral'  && 'bg-ink-100 text-ink-700',
      )}
    >
      <Icon size={14} strokeWidth={2} />
      {formatDelta(metric.delta, metric.unit)}
    </span>
  );
}

function MetricCard({ label, description, icon: Icon, metric }: {
  label: string;
  description: string;
  icon: LucideIcon;
  metric: WeeklyMetricValue;
}) {
  return (
    <article className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-ink-900">{label}</h2>
          <p className="text-xs text-ink-500">{description}</p>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-700">
          <Icon size={18} strokeWidth={1.8} />
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">This week</p>
          <p className="mt-1 text-3xl font-extrabold text-ink-900">
            {formatMetricValue(metric.thisWeek, metric.unit)}
          </p>
        </div>
        <DeltaBadge metric={metric} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-sm">
        <div>
          <p className="text-xs font-medium text-ink-500">Last week</p>
          <p className="mt-1 font-semibold text-ink-800">
            {formatMetricValue(metric.lastWeek, metric.unit)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-ink-500">Unit</p>
          <p className="mt-1 font-semibold capitalize text-ink-800">{metric.unit}</p>
        </div>
      </div>
    </article>
  );
}

// ── Main export ────────────────────────────────────────────────────────

export function WeeklyReviewClient({ data }: { data: WeeklyMetricsResponse }) {
  const router = useRouter();
  const { entries, strongest, weakest } = getMetricSummaries(data);

  const thisWeekRange = `${formatDate(data.week.thisWeekStart)} - ${formatDate(data.week.thisWeekEnd)}`;
  const lastWeekRange = `${formatDate(data.week.lastWeekStart)} - ${formatDate(data.week.lastWeekEnd)}`;

  const prevDate = shiftWeek(data.week.thisWeekStart, -7);
  const nextDate = shiftWeek(data.week.thisWeekStart, 7);
  const isCurrentWeek = data.week.thisWeekStart === todayMonday();

  const goTo = (date: string) => router.push(`?date=${date}`);

  return (
    <div className="px-8 pb-8 space-y-6">
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Left: nav controls + range display */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Prev / Next chevrons */}
            <button
              type="button"
              onClick={() => goTo(prevDate)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors"
              aria-label="이전 주"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => goTo(nextDate)}
              disabled={isCurrentWeek}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 text-ink-700 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="다음 주"
            >
              <ChevronRight size={16} />
            </button>

            {/* Date range text */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Current review window
              </p>
              <p className="mt-0.5 text-xl font-extrabold text-ink-900">{thisWeekRange}</p>
            </div>

            {/* Week picker popover */}
            <div className="ml-1">
              <WeekPickerPopover
                selectedMonday={data.week.thisWeekStart}
                onSelect={goTo}
              />
            </div>
          </div>

          {/* Right: comparison info */}
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-ink-50 px-4 py-3">
              <p className="text-xs font-medium text-ink-500">Compared with</p>
              <p className="mt-1 font-semibold text-ink-900">{lastWeekRange}</p>
            </div>
            <div className="rounded-xl bg-ink-50 px-4 py-3">
              <p className="text-xs font-medium text-ink-500">Timezone</p>
              <p className="mt-1 font-semibold text-ink-900">{data.week.timezone}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {entries.map(({ key, label, description, icon, metric }) => (
          <MetricCard key={key} label={label} description={description} icon={icon} metric={metric} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Strongest metric</p>
          <p className="mt-2 text-lg font-extrabold text-ink-900">{strongest.label}</p>
          <p className="mt-1 text-sm text-ink-600">
            Delta {formatDelta(strongest.metric.delta, strongest.metric.unit)} vs last week.
          </p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Weakest metric</p>
          <p className="mt-2 text-lg font-extrabold text-ink-900">{weakest.label}</p>
          <p className="mt-1 text-sm text-ink-600">
            Delta {formatDelta(weakest.metric.delta, weakest.metric.unit)} vs last week.
          </p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Notes</p>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Weekly review focuses on core marketplace signals only. Supporting KPI drill-down
            belongs in a separate view.
          </p>
        </div>
      </section>
    </div>
  );
}
