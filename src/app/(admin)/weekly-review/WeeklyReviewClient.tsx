'use client';

import clsx from 'clsx';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
  MessageSquareText,
  PackageCheck,
  ShoppingBag,
  UserCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/format';
import type {
  WeeklyCoreKpiKey,
  WeeklyMetricUnit,
  WeeklyMetricValue,
  WeeklyMetricsResponse,
} from '@/lib/types';

type DeltaDirection = 'positive' | 'negative' | 'neutral';

const KPI_CONFIG: Array<{
  key: WeeklyCoreKpiKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: 'verifiedUsers',
    label: 'Verified User Count',
    description: 'Newly verified users this week',
    icon: UserCheck,
  },
  {
    key: 'firstListingRate',
    label: 'First Listing Rate',
    description: 'Share of users making a first listing',
    icon: CheckCircle2,
  },
  {
    key: 'publishedListings',
    label: 'Published Listings',
    description: 'Listings published during the week',
    icon: PackageCheck,
  },
  {
    key: 'chatStartRate',
    label: 'Listing → Chat Start Rate',
    description: 'Listing activity converting into chat starts',
    icon: MessageSquareText,
  },
  {
    key: 'transactionSignals',
    label: 'Transaction Signal Count',
    description: 'Marketplace intent signals recorded this week',
    icon: ShoppingBag,
  },
];

function getDirection(delta: number): DeltaDirection {
  if (delta > 0) return 'positive';
  if (delta < 0) return 'negative';
  return 'neutral';
}

function formatMetricValue(value: number, unit: WeeklyMetricUnit) {
  if (unit === 'rate') {
    return `${Math.round(value * 100)}%`;
  }
  return new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(value);
}

function formatDelta(value: number, unit: WeeklyMetricUnit) {
  const sign = value > 0 ? '+' : '';
  if (unit === 'rate') {
    return `${sign}${Math.round(value * 100)} pp`;
  }
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
    strongest: entries.reduce((best, current) =>
      deltaScore(current.metric) > deltaScore(best.metric) ? current : best,
    ),
    weakest: entries.reduce((worst, current) =>
      deltaScore(current.metric) < deltaScore(worst.metric) ? current : worst,
    ),
  };
}

function DeltaBadge({ metric }: { metric: WeeklyMetricValue }) {
  const direction = getDirection(metric.delta);
  const Icon =
    direction === 'positive' ? ArrowUpRight : direction === 'negative' ? ArrowDownRight : ArrowRight;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold',
        direction === 'positive' && 'bg-green-50 text-success',
        direction === 'negative' && 'bg-pink-50 text-danger',
        direction === 'neutral' && 'bg-ink-100 text-ink-700',
      )}
    >
      <Icon size={14} strokeWidth={2} />
      {formatDelta(metric.delta, metric.unit)}
    </span>
  );
}

function MetricCard({
  label,
  description,
  icon: Icon,
  metric,
}: {
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

function shiftWeek(isoDate: string, deltaDays: number): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function WeeklyReviewClient({ data }: { data: WeeklyMetricsResponse }) {
  const router = useRouter();
  const { entries, strongest, weakest } = getMetricSummaries(data);
  const thisWeekRange = `${formatDate(data.week.thisWeekStart)} - ${formatDate(data.week.thisWeekEnd)}`;
  const lastWeekRange = `${formatDate(data.week.lastWeekStart)} - ${formatDate(data.week.lastWeekEnd)}`;

  const prevDate = shiftWeek(data.week.thisWeekStart, -7);
  const nextDate = shiftWeek(data.week.thisWeekStart, 7);
  const isCurrentWeek = data.week.thisWeekStart >= shiftWeek(todayUTC(), -((new Date().getUTCDay() || 7) - 1));

  const goTo = (date: string) => router.push(`?date=${date}`);

  return (
    <div className="px-8 pb-8 space-y-6">
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(prevDate)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors"
              aria-label="이전 주"
            >
              <ChevronLeft size={16} />
            </button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Current review window
              </p>
              <p className="mt-1 text-xl font-extrabold text-ink-900">{thisWeekRange}</p>
            </div>

            <button
              type="button"
              onClick={() => goTo(nextDate)}
              disabled={isCurrentWeek}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-ink-200 text-ink-700 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="다음 주"
            >
              <ChevronRight size={16} />
            </button>
          </div>

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
          <MetricCard
            key={key}
            label={label}
            description={description}
            icon={icon}
            metric={metric}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Strongest metric
          </p>
          <p className="mt-2 text-lg font-extrabold text-ink-900">{strongest.label}</p>
          <p className="mt-1 text-sm text-ink-600">
            Delta {formatDelta(strongest.metric.delta, strongest.metric.unit)} vs last week.
          </p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Weakest metric
          </p>
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
