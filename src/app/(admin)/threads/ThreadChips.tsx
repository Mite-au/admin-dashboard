import clsx from 'clsx';
import { getThreadModelLabel, type ThreadModelLabel } from '@/lib/threadModel';

type ThreadModelInput = Parameters<typeof getThreadModelLabel>[0];

/**
 * The canonical thread model, derived from type + region + interest.
 *
 * Deliberately not colour-coded by family: "Regional General" and "Regional
 * Interest" are taxonomy, not health, so tinting one green would claim a
 * judgement the data doesn't support. They are separated by fill vs outline
 * instead. "Legacy" is the one value that *is* a signal — a thread that
 * predates the region model and still needs migrating — so it takes the
 * warning tint and earns its colour.
 */
const MODEL_STYLES: Record<ThreadModelLabel, string> = {
  'Regional General': 'bg-ink-100 text-ink-700',
  'Regional Interest': 'border border-ink-200 bg-white text-ink-700',
  Legacy: 'bg-warning-50 text-warning-700',
};

const MODEL_TITLES: Record<ThreadModelLabel, string> = {
  'Regional General': 'Region-wide thread: a region code, no interest key.',
  'Regional Interest': 'Interest thread scoped to a region: region code + interest key.',
  Legacy: 'Does not match either current model — usually an old suburb-scoped thread.',
};

export function ThreadModelChip({ thread }: { thread: ThreadModelInput }) {
  const label = getThreadModelLabel(thread);
  return (
    <span
      title={MODEL_TITLES[label]}
      className={clsx(
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-2xs font-semibold',
        MODEL_STYLES[label],
      )}
    >
      {label}
    </span>
  );
}

/**
 * A machine key (`eastern_suburbs`, `basketball`) shown as what it is — an
 * exact string an admin may need to copy into a filter — rather than as prose.
 */
export function CodeChip({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-ink-400">—</span>;
  return (
    <span className="inline-flex max-w-[14rem] truncate rounded-control border border-ink-100 bg-ink-50 px-1.5 py-0.5 font-mono text-2xs text-ink-700">
      {value}
    </span>
  );
}
