import clsx from 'clsx';

const map: Record<string, string> = {
  active: 'badge-green',
  published: 'badge-green',
  completed: 'badge-green',
  sold: 'badge-blue',
  pending: 'badge-amber',
  suspended: 'badge-amber',
  flagged: 'badge-amber',
  paused: 'badge-gray',
  draft: 'badge-gray',
  archived: 'badge-gray',
  cancelled: 'badge-gray',
  banned: 'badge-red',
  deleted: 'badge-red',
  disputed: 'badge-red',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('badge', map[status] ?? 'badge-gray', 'capitalize')}>
      {status.replace('-', ' ')}
    </span>
  );
}
