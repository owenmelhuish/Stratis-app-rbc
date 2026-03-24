"use client";
import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { formatKPIValue } from '@/lib/format';
import { KPI_CONFIGS, type KPIKey } from '@/types';

interface TrendChartProps {
  data: Array<Record<string, number | string>>;
  defaultMetrics?: KPIKey[];
  availableMetrics?: KPIKey[];
  title?: string;
  height?: number;
  className?: string;
}

// Semantic colors: spend-like = salmon/red, growth = teal/green, neutral = blue/purple
const METRIC_COLORS: Record<string, string> = {
  spend: '#e07060',
  impressions: '#6b8aad',
  clicks: '#8b7ec8',
  conversions: '#50b89a',
  revenue: '#50b89a',
  roas: '#50b89a',
  ctr: '#6b8aad',
  cpc: '#e07060',
  cpm: '#e07060',
  cpa: '#e07060',
  engagementRate: '#8b7ec8',
};

const FALLBACK_COLORS = ['#50b89a', '#e07060', '#6b8aad', '#8b7ec8', '#d4a55a', '#c76a8c'];

function getMetricColor(metric: string, index: number): string {
  return METRIC_COLORS[metric] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export function TrendChart({ data, defaultMetrics = ['spend', 'conversions', 'roas'], availableMetrics, title = 'Performance Trend', height = 320, className }: TrendChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<KPIKey[]>(defaultMetrics);
  const metrics = availableMetrics || ['spend', 'impressions', 'clicks', 'conversions', 'revenue', 'roas', 'ctr', 'cpm', 'cpa'] as KPIKey[];

  const toggleMetric = (m: KPIKey) => {
    setActiveMetrics(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  return (
    <div className={cn("rounded-xl border border-border/40 bg-card p-6 flex flex-col", className)}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
        <div className="flex flex-wrap gap-1">
          {metrics.map((m, i) => {
            const config = KPI_CONFIGS.find(c => c.key === m);
            if (!config) return null;
            const isActive = activeMetrics.includes(m);
            const color = getMetricColor(m, i);
            return (
              <button
                key={m}
                onClick={() => toggleMetric(m)}
                className={cn(
                  "h-6 text-[10px] px-2.5 rounded-md font-medium transition-all inline-flex items-center gap-1.5",
                  isActive
                    ? "bg-card-elevated text-foreground"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isActive ? color : 'transparent', border: `1.5px solid ${color}` }}
                />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height={className?.includes('h-full') ? '100%' : height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            {activeMetrics.map((m, i) => {
              const color = getMetricColor(m, i);
              return (
                <linearGradient key={m} id={`trend-fill-${m}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            }}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          {activeMetrics.map((m, i) => {
            const config = KPI_CONFIGS.find(c => c.key === m);
            return (
              <YAxis key={m} yAxisId={m} orientation={i === 0 ? 'left' : 'right'}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
                tickFormatter={(v) => config ? formatKPIValue(v, config.format) : String(v)}
                hide={i > 1}
                axisLine={false}
                tickLine={false}
              />
            );
          })}
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20, 24, 28, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#e0e0e0',
              padding: '12px 16px',
              backdropFilter: 'blur(12px)',
            }}
            cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeDasharray: '4 4' }}
            labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            formatter={(value, name) => {
              const config = KPI_CONFIGS.find(c => c.key === name);
              return [config ? formatKPIValue(value as number, config.format) : value, config?.label || String(name)];
            }}
          />
          {activeMetrics.map((m, i) => {
            const color = getMetricColor(m, i);
            return (
              <Area
                key={m}
                yAxisId={m}
                type="monotone"
                dataKey={m}
                stroke={color}
                strokeWidth={2}
                fill={`url(#trend-fill-${m})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: color }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
