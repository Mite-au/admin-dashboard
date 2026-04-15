import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <div className="text-sm text-ink-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        {delta && <div className="mt-1 text-xs text-success">{delta}</div>}
      </div>
      {Icon && (
        <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}
