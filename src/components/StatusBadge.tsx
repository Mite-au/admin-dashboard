import clsx from 'clsx';

const map: Record<string, string> = {
  // User statuses (real DB enum values + synthetic `banned`)
  active: 'pill-success',
  suspended: 'pill-danger',
  banned: 'pill-neutral',
  pending_profile: 'pill-warning',
  'pending profile': 'pill-warning',
  deleted: 'pill-neutral',

  // Post statuses
  published: 'pill-success',
  sold: 'pill-neutral',
  paused: 'pill-warning',
  archived: 'pill-neutral',
  draft: 'pill-neutral',

  // Transaction / offer statuses
  complete: 'pill-success',
  completed: 'pill-success',
  fail: 'pill-danger',
  failed: 'pill-danger',
  'in progress': 'pill-warning',
  in_progress: 'pill-warning',
  pending: 'pill-neutral',
  cancelled: 'pill-neutral',
  disputed: 'pill-danger',
  refunded: 'pill-warning',

  // Report statuses
  'in review': 'pill-warning',
  in_review: 'pill-warning',
  resolved: 'pill-success',

  // Thread admin statuses
  flagged: 'pill-warning',
  hidden: 'pill-neutral',

  // Auth log statuses
  success: 'pill-neutral',
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace('-', ' ');
  const cls = map[key] ?? map[status.toLowerCase()] ?? 'pill-neutral';
  return (
    <span className={clsx('pill-status capitalize', cls)}>
      {status.replace('_', ' ').replace('-', ' ')}
    </span>
  );
}
