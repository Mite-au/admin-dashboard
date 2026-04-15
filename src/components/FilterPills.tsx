'use client';

import clsx from 'clsx';

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx('pill', value === o.value && 'pill-active')}
        >
          {o.label}
          {typeof o.count === 'number' && (
            <span className="ml-1 opacity-80">({o.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
