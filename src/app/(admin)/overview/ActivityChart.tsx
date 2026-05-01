'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

type DataPoint = { date: string } & Record<string, string | number>;
type ChartSeries = {
  dataKey: string;
  name: string;
  stroke: string;
};

const defaultSeries: ChartSeries[] = [
  { dataKey: 'listings', name: 'Listings', stroke: '#3b82f6' },
];

export function ActivityChart({
  data,
  series = defaultSeries,
}: {
  data: DataPoint[];
  series?: ChartSeries[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
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
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }} />}
        {series.map((item) => (
          <Line
            key={item.dataKey}
            type="monotone"
            dataKey={item.dataKey}
            name={item.name}
            stroke={item.stroke}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
