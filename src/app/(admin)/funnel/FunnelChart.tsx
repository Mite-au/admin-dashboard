'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { FunnelStage } from '@/lib/types';

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const shaped = stages.map((s) => ({
    label: s.label,
    current: s.count,
    previous: s.prevCount,
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={shaped} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
        <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }} />
        <Bar dataKey="current" name="This period" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="previous" name="Previous period" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
