"use client";
import React from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useAppStore } from '@/lib/store';
import { KPIGrid } from '@/components/shared/kpi-grid';
import { HeroKPICard } from '@/components/shared/hero-kpi-card';
import { TrendChart } from '@/components/shared/trend-chart';
import { DataTableWrapper, type Column } from '@/components/shared/data-table-wrapper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CHANNEL_LABELS, CHANNEL_COLORS, KPI_CONFIGS, FUNNEL_HERO_KPIS, type KPIKey, type ChannelId, type AggregatedKPIs } from '@/types';
import { formatCurrency, formatKPIValue, formatPercent } from '@/lib/format';
import { WorldMapChart } from '@/components/shared/world-map-chart';
import { Lightbulb, Palette } from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const HERO_COLORS: Record<string, string> = {
  spend: '#e07060', conversions: '#50b89a', roas: '#50b89a',
  impressions: '#50b89a', reach: '#8b7ec8', cpm: '#6b8aad',
  clicks: '#50b89a', ctr: '#6b8aad', engagementRate: '#8b7ec8',
  cpa: '#e07060',
};

interface ChannelRow { channel: ChannelId; channelLabel: string; color: string; kpis: AggregatedKPIs; }

export function CampaignView() {
  const data = useDashboardData();
  const { customKpis, selectedCampaign, compareEnabled, selectedFunnel } = useAppStore();
  const heroKpis = FUNNEL_HERO_KPIS[selectedFunnel];
  const campaign = data.selectedCampaignObj;

  const secondaryKpis = customKpis.filter(k => !heroKpis.includes(k));

  const channelRows: ChannelRow[] = (Object.entries(data.channelData) as [ChannelId, AggregatedKPIs][])
    .filter(([, kpis]) => kpis.spend > 0)
    .map(([ch, kpis]) => ({ channel: ch, channelLabel: CHANNEL_LABELS[ch], color: CHANNEL_COLORS[ch], kpis }));

  const channelColumns: Column<ChannelRow>[] = [
    { key: 'channel', label: 'Channel', sortable: true, getValue: (r) => r.channelLabel,
      render: (r) => (<div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color }} /><span className="font-medium">{r.channelLabel}</span></div>),
    },
    { key: 'spend', label: 'Spend', sortable: true, align: 'right', getValue: (r) => r.kpis.spend, render: (r) => formatCurrency(r.kpis.spend) },
    { key: 'impressions', label: 'Impr.', sortable: true, align: 'right', getValue: (r) => r.kpis.impressions, render: (r) => formatKPIValue(r.kpis.impressions, 'number') },
    { key: 'clicks', label: 'Clicks', sortable: true, align: 'right', getValue: (r) => r.kpis.clicks, render: (r) => formatKPIValue(r.kpis.clicks, 'number') },
    { key: 'ctr', label: 'CTR', sortable: true, align: 'right', getValue: (r) => r.kpis.ctr, render: (r) => formatPercent(r.kpis.ctr) },
    { key: 'cpc', label: 'CPC', sortable: true, align: 'right', getValue: (r) => r.kpis.cpc, render: (r) => formatCurrency(r.kpis.cpc) },
    { key: 'cpm', label: 'CPM', sortable: true, align: 'right', getValue: (r) => r.kpis.cpm, render: (r) => formatCurrency(r.kpis.cpm) },
    { key: 'conversions', label: 'Conv.', sortable: true, align: 'right', getValue: (r) => r.kpis.conversions, render: (r) => formatKPIValue(r.kpis.conversions, 'number') },
    { key: 'cpa', label: 'CPA', sortable: true, align: 'right', getValue: (r) => r.kpis.cpa, render: (r) => formatCurrency(r.kpis.cpa) },
    { key: 'roas', label: 'ROAS', sortable: true, align: 'right', getValue: (r) => r.kpis.roas, render: (r) => formatKPIValue(r.kpis.roas, 'decimal') },
    { key: 'fatigue', label: 'Fatigue', sortable: true, align: 'center', getValue: (r) => r.kpis.creativeFatigueIndex,
      render: (r) => { const v = r.kpis.creativeFatigueIndex; return (<div className="flex items-center justify-center gap-1"><div className={`w-2 h-2 rounded-full ${v > 70 ? 'bg-red-400' : v > 40 ? 'bg-yellow-400' : 'bg-emerald-400'}`} /><span className="text-xs">{v.toFixed(0)}</span></div>); },
    },
  ];

  const fatigueTimeSeries = data.timeSeries.map(d => ({
    date: d.date as string,
    fatigue: (d.creativeFatigueIndex as number) || 35,
  }));

  return (
    <div className="space-y-8">
      {campaign && (
        <div className="flex items-center gap-3">
          <Badge variant={campaign.status === 'live' ? 'default' : 'secondary'}>{campaign.status}</Badge>
          <Badge variant="outline" className="capitalize">{campaign.objective}</Badge>
          <span className="text-xs text-muted-foreground">Channels: {campaign.channels.map(c => CHANNEL_LABELS[c]).join(', ')}</span>
        </div>
      )}

      <WorldMapChart stateData={data.stateData} />

      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {heroKpis.map((key) => {
            const config = KPI_CONFIGS.find(c => c.key === key);
            if (!config) return null;
            const value = data.currentKPIs[key] as number;
            const prev = data.previousKPIs ? data.previousKPIs[key] as number : undefined;
            const delta = prev !== undefined ? value - prev : undefined;
            const deltaPercent = prev !== undefined && prev !== 0 ? ((value - prev) / prev) * 100 : undefined;
            const sparklineData = data.timeSeries.slice(-14).map(d => ({ value: d[key] as number }));

            return (
              <HeroKPICard
                key={key}
                config={config}
                value={value}
                delta={compareEnabled ? delta : undefined}
                deltaPercent={compareEnabled ? deltaPercent : undefined}
                sparklineData={sparklineData}
                accentColor={HERO_COLORS[key] || '#f97316'}
              />
            );
          })}
        </div>

        {secondaryKpis.length > 0 && (
          <KPIGrid kpis={secondaryKpis} current={data.currentKPIs} previous={data.previousKPIs || undefined} />
        )}
      </div>

      <TrendChart data={data.timeSeries} title={`${campaign?.name || selectedCampaign} — Performance Trend`} defaultMetrics={['spend', 'conversions', 'roas']}
        availableMetrics={['spend', 'impressions', 'clicks', 'conversions', 'revenue', 'roas', 'ctr', 'cpc', 'cpm', 'cpa', 'engagementRate']}
      />

      <Card className="p-6 bg-card border-border/40">
        <h3 className="text-sm font-semibold mb-4">Channel Performance</h3>
        <DataTableWrapper<ChannelRow> data={channelRows} columns={channelColumns} />
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-4 w-4 text-orange" />
            <h3 className="text-sm font-semibold">Creative Fatigue Index</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={fatigueTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
              <YAxis tick={{ fontSize: 10, fill: '#666' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(20, 24, 28, 0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px', color: '#e0e0e0', padding: '10px 14px' }} />
              <Area type="monotone" dataKey="fatigue" stroke="#e07060" fill="#e07060" fillOpacity={0.08} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">Top fatigued creatives:</p>
            {['Avion Travel Rewards Hero Video — 78/100', 'Lifestyle Carousel — 65/100', 'Performance Banner — 52/100'].map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                <span>{c.split(' — ')[0]}</span>
                <Badge variant={i === 0 ? 'destructive' : 'secondary'} className="text-[10px]">{c.split(' — ')[1]}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-orange" />
            <h3 className="text-sm font-semibold">Optimization Opportunities</h3>
          </div>
          <div className="space-y-3">
            {data.scopedInsights.slice(0, 5).map(insight => (
              <Link href="/insights" key={insight.id}>
                <div className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] capitalize">{insight.category}</Badge>
                    <span className="text-xs text-orange">{insight.impactEstimate}</span>
                  </div>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{insight.recommendedAction}</p>
                </div>
              </Link>
            ))}
            {data.scopedInsights.length === 0 && <p className="text-xs text-muted-foreground">No optimization opportunities</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
