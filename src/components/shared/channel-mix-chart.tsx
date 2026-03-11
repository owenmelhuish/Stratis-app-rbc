"use client";
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { CHANNEL_LABELS, CHANNEL_COLORS, type ChannelId, type AggregatedKPIs } from '@/types';
import { formatCurrency, formatPercent, formatKPIValue } from '@/lib/format';

interface ChannelMixChartProps {
  data: Record<string, AggregatedKPIs>;
  title?: string;
}

export function ChannelMixChart({ data, title = 'Channel Mix' }: ChannelMixChartProps) {
  const entries = (Object.entries(data) as [ChannelId, AggregatedKPIs][]).filter(([, v]) => v.spend > 0);
  const totalSpend = entries.reduce((sum, [, v]) => sum + v.spend, 0);

  const barData = entries.map(([channel, metrics]) => ({
    name: CHANNEL_LABELS[channel],
    spend: metrics.spend,
    pct: totalSpend > 0 ? ((metrics.spend / totalSpend) * 100).toFixed(0) : '0',
    color: CHANNEL_COLORS[channel],
    channel,
    roas: metrics.roas,
    ctr: metrics.ctr,
  }));

  return (
    <div className="rounded-xl border border-border/40 bg-card p-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
        <span className="text-2xl font-bold tracking-tight">{formatCurrency(totalSpend)}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-5">Spend by channel</p>

      {/* Horizontal percentage bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-5 gap-[2px]">
        {barData.map((entry) => (
          <div
            key={entry.channel}
            className="h-full rounded-full first:rounded-l-full last:rounded-r-full"
            style={{
              backgroundColor: entry.color,
              width: `${entry.pct}%`,
              minWidth: '4px',
            }}
          />
        ))}
      </div>

      {/* Percentage labels */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {barData.map((entry) => (
          <div key={entry.channel} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[11px] text-muted-foreground">{entry.pct}%</span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" horizontal vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
            tickFormatter={(v) => formatCurrency(v)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20, 24, 28, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#e0e0e0',
              padding: '10px 14px',
            }}
            formatter={(value) => [formatCurrency(value as number), 'Spend']}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="spend" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {barData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend table */}
      <div className="mt-4 space-y-2">
        {entries.map(([channel, metrics]) => (
          <div key={channel} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHANNEL_COLORS[channel] }} />
              <span className="text-muted-foreground">{CHANNEL_LABELS[channel]}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-foreground font-medium">{formatCurrency(metrics.spend)}</span>
              <span className="text-muted-foreground w-12 text-right">ROAS {formatKPIValue(metrics.roas, 'decimal')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
