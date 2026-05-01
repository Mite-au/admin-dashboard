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
import type { EngagementActivityPoint } from '@/lib/types';

type EngagementSeries = 'chats' | 'messages' | 'threadActivity';

interface Props {
  data: EngagementActivityPoint[];
  series?: EngagementSeries[];
}

export function EngagementChart({
  data,
  series = ['chats', 'messages', 'threadActivity'],
}: Props) {
  const showChats = series.includes('chats');
  const showMessages = series.includes('messages');
  const showThreadActivity = series.includes('threadActivity');

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
        <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }} />
        {showChats && (
          <Line
            type="monotone"
            dataKey="chats"
            name="Chats Started"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        )}
        {showMessages && (
          <Line
            type="monotone"
            dataKey="messages"
            name="Messages Sent"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        )}
        {showThreadActivity && (
          <Line
            type="monotone"
            dataKey="threadActivity"
            name="Thread Activity"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
