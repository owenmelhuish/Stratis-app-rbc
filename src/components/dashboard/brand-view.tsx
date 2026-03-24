"use client";
import React, { useState } from 'react';
import { useDashboardData, type StateDatum } from '@/hooks/use-dashboard-data';
import { useAppStore } from '@/lib/store';
import { HeroKPICard } from '@/components/shared/hero-kpi-card';
import { TrendChart } from '@/components/shared/trend-chart';
import { ChannelMixChart } from '@/components/shared/channel-mix-chart';
import { CampaignOverviewChart } from '@/components/shared/campaign-overview-chart';
import { WorldMapChart } from '@/components/shared/world-map-chart';
import { FunnelVelocity, BudgetSankey, AudiencePortfolio, ChannelFrequency, AgencyBenchmarking, ConversionValue } from './widgets';
import { DataTableWrapper, type Column } from '@/components/shared/data-table-wrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Settings2, TrendingUp, TrendingDown, AlertTriangle, Zap, Target, DollarSign, BarChart3, Activity, Eye, ChevronLeft, ChevronRight, Image, Layers } from 'lucide-react';
import { KPI_CONFIGS, CHANNEL_LABELS, DIVISION_LABELS, FUNNEL_HERO_KPIS, type KPIKey, type ChannelId, type DivisionId, type AggregatedKPIs } from '@/types';
import { formatCurrency, formatKPIValue, formatPercent } from '@/lib/format';
import { ComparisonDelta } from '@/components/shared/comparison-delta';

const HERO_COLORS: Record<string, string> = {
  spend: '#e07060', cpm: '#6b8aad', roas: '#50b89a',
  impressions: '#50b89a', reach: '#8b7ec8',
  clicks: '#50b89a', ctr: '#6b8aad', engagementRate: '#8b7ec8',
  conversions: '#50b89a', cpa: '#e07060',
};

// ─── Creative / Ad Set Data ─────────────────────────────────────────────────

interface AdSet {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  channel: ChannelId;
  format: string;
  asset: string;
  kpis: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cpa: number;
    roas: number;
    cpm: number;
    creativeFatigue: number;
  };
  kpiDeltas: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cpa: number;
    roas: number;
    cpm: number;
    creativeFatigue: number;
  };
}

const AD_SETS: AdSet[] = [
  {
    id: 'as-avion-travel-display', name: 'Avion Travel Rewards — Programmatic Display', campaignId: 'rbc-avion-travel-q1', campaignName: 'Avion Travel Q1',
    channel: 'ttd', format: 'Display', asset: 'avion-travel-banner-300x250',
    kpis: { spend: 184200, impressions: 12400000, clicks: 248000, ctr: 2.0, conversions: 6820, cpa: 27.01, roas: 4.8, cpm: 14.85, creativeFatigue: 22 },
    kpiDeltas: { spend: 8, impressions: 12, clicks: 15, ctr: 6, conversions: 18, cpa: -10, roas: 14, cpm: -3, creativeFatigue: 4 },
  },
  {
    id: 'as-ion-launch-tiktok', name: 'ION Card Launch — TikTok UGC', campaignId: 'rbc-ion-launch', campaignName: 'ION Card Digital Launch',
    channel: 'tiktok', format: 'Short-Form Video', asset: 'ion-ugc-creator-pack',
    kpis: { spend: 96800, impressions: 8900000, clicks: 356000, ctr: 4.0, conversions: 4120, cpa: 23.50, roas: 5.2, cpm: 10.88, creativeFatigue: 14 },
    kpiDeltas: { spend: 5, impressions: 22, clicks: 28, ctr: 8, conversions: 24, cpa: -15, roas: 22, cpm: -6, creativeFatigue: 2 },
  },
  {
    id: 'as-mortgage-search', name: 'Spring Mortgage — Search Ads', campaignId: 'rbc-mortgage-spring', campaignName: 'Spring Mortgage Rates',
    channel: 'google-search', format: 'Search', asset: 'mortgage-rsa-v2',
    kpis: { spend: 142500, impressions: 3200000, clicks: 192000, ctr: 6.0, conversions: 11520, cpa: 12.37, roas: 8.1, cpm: 44.53, creativeFatigue: 8 },
    kpiDeltas: { spend: 3, impressions: 6, clicks: 9, ctr: 4, conversions: 12, cpa: -8, roas: 10, cpm: -2, creativeFatigue: 1 },
  },
  {
    id: 'as-di-tfsa-reel', name: 'TFSA Season — Reels', campaignId: 'rbc-di-tfsa', campaignName: 'TFSA Season Push',
    channel: 'instagram', format: 'Reels', asset: 'tfsa-explainer-reel-v1',
    kpis: { spend: 68400, impressions: 5600000, clicks: 196000, ctr: 3.5, conversions: 2940, cpa: 23.27, roas: 3.9, cpm: 12.21, creativeFatigue: 38 },
    kpiDeltas: { spend: 12, impressions: 8, clicks: 4, ctr: -3, conversions: 2, cpa: 6, roas: -4, cpm: 5, creativeFatigue: 12 },
  },
  {
    id: 'as-gameday-ctv', name: 'Game Day Moments — CTV Spot', campaignId: 'rbc-gameday-moments', campaignName: 'Game Day Moments',
    channel: 'ctv', format: 'CTV :30', asset: 'gameday-ctv-30s',
    kpis: { spend: 210000, impressions: 4800000, clicks: 48000, ctr: 1.0, conversions: 3360, cpa: 62.50, roas: 2.1, cpm: 43.75, creativeFatigue: 18 },
    kpiDeltas: { spend: 6, impressions: 10, clicks: 8, ctr: -1, conversions: 5, cpa: 2, roas: -2, cpm: -3, creativeFatigue: 3 },
  },
  {
    id: 'as-rewards-awareness-spotify', name: 'RBC Rewards — Spotify Audio', campaignId: 'rbc-rewards-awareness', campaignName: 'RBC Rewards Brand Awareness',
    channel: 'spotify', format: 'Audio Ad', asset: 'rewards-audio-30s',
    kpis: { spend: 78600, impressions: 9200000, clicks: 138000, ctr: 1.5, conversions: 1932, cpa: 40.68, roas: 2.4, cpm: 8.54, creativeFatigue: 42 },
    kpiDeltas: { spend: 4, impressions: -2, clicks: -6, ctr: -4, conversions: -8, cpa: 12, roas: -10, cpm: 6, creativeFatigue: 16 },
  },
  {
    id: 'as-newcomer-fb', name: 'Welcome to Canada — Lead Gen', campaignId: 'rbc-newcomer-welcome', campaignName: 'Welcome to Canada',
    channel: 'facebook', format: 'Lead Form', asset: 'newcomer-leadgen-v4',
    kpis: { spend: 54300, impressions: 3100000, clicks: 124000, ctr: 4.0, conversions: 3720, cpa: 14.60, roas: 6.8, cpm: 17.52, creativeFatigue: 10 },
    kpiDeltas: { spend: 2, impressions: 4, clicks: 7, ctr: 3, conversions: 9, cpa: -6, roas: 8, cpm: -1, creativeFatigue: -2 },
  },
  {
    id: 'as-avion-retention-retarget', name: 'Avion Retention — Retargeting', campaignId: 'rbc-avion-retention', campaignName: 'Avion Cardholder Retention',
    channel: 'facebook', format: 'Dynamic Retargeting', asset: 'avion-dpa-catalogue',
    kpis: { spend: 62100, impressions: 2800000, clicks: 112000, ctr: 4.0, conversions: 5600, cpa: 11.09, roas: 9.2, cpm: 22.18, creativeFatigue: 6 },
    kpiDeltas: { spend: 1, impressions: 3, clicks: 5, ctr: 2, conversions: 7, cpa: -5, roas: 6, cpm: -2, creativeFatigue: -1 },
  },
  {
    id: 'as-smb-linkedin', name: 'Small Business Growth — LinkedIn Sponsored', campaignId: 'rbc-smb-growth', campaignName: 'Small Business Growth',
    channel: 'linkedin', format: 'Sponsored Content', asset: 'smb-growth-sponsored-v2',
    kpis: { spend: 88200, impressions: 7400000, clicks: 296000, ctr: 4.0, conversions: 3848, cpa: 22.92, roas: 4.4, cpm: 11.92, creativeFatigue: 26 },
    kpiDeltas: { spend: 10, impressions: 18, clicks: 20, ctr: 5, conversions: 16, cpa: -6, roas: 8, cpm: -4, creativeFatigue: 8 },
  },
  {
    id: 'as-brand-q1-ooh', name: 'RBC Master Brand — OOH', campaignId: 'rbc-brand-q1', campaignName: 'RBC Master Brand — Q1',
    channel: 'ooh', format: 'Billboard', asset: 'brand-q1-ooh-national',
    kpis: { spend: 48900, impressions: 1600000, clicks: 112000, ctr: 7.0, conversions: 6720, cpa: 7.28, roas: 12.4, cpm: 30.56, creativeFatigue: 4 },
    kpiDeltas: { spend: 2, impressions: 5, clicks: 8, ctr: 3, conversions: 10, cpa: -7, roas: 9, cpm: -3, creativeFatigue: 0 },
  },
];

const AD_SET_KPI_KEYS = ['spend', 'impressions', 'clicks', 'ctr', 'conversions', 'cpa', 'roas', 'cpm'] as const;
const AD_SET_KPI_LABELS: Record<string, string> = {
  spend: 'Spend', impressions: 'Impressions', clicks: 'Clicks', ctr: 'CTR',
  conversions: 'Conversions', cpa: 'CPA', roas: 'ROAS', cpm: 'CPM',
};

function formatAdSetKPI(key: string, val: number): string {
  if (key === 'spend' || key === 'cpa' || key === 'cpm') return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (key === 'impressions' || key === 'clicks' || key === 'conversions') return val.toLocaleString();
  if (key === 'ctr') return `${val.toFixed(1)}%`;
  if (key === 'roas') return `${val.toFixed(1)}x`;
  return String(val);
}

function CreativeExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const adSet = AD_SETS[activeIndex];

  const prev = () => setActiveIndex((i) => (i - 1 + AD_SETS.length) % AD_SETS.length);
  const next = () => setActiveIndex((i) => (i + 1) % AD_SETS.length);

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="flex items-center gap-2 mb-5">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Creative Performance</h3>
        <Badge className="bg-muted/40 text-muted-foreground text-xs border-0">{AD_SETS.length} ad sets</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left: Ad set list */}
        <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
          {AD_SETS.map((as, i) => (
            <button
              key={as.id}
              onClick={() => setActiveIndex(i)}
              className={`flex items-start gap-3 text-left rounded-lg px-3 py-2.5 transition-colors ${
                i === activeIndex ? 'bg-muted/50 border border-border/40' : 'hover:bg-muted/30 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/40 shrink-0 mt-0.5">
                <Image className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium truncate ${i === activeIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {as.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{as.campaignName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{CHANNEL_LABELS[as.channel]}</span>
                  <span className="text-[10px] text-muted-foreground/50">|</span>
                  <span className="text-[10px] text-muted-foreground">{as.format}</span>
                </div>
              </div>
              <span className="text-[11px] font-bold tabular-nums shrink-0 text-emerald-400">{as.kpis.roas.toFixed(1)}x</span>
            </button>
          ))}
        </div>

        {/* Right: KPI detail for active ad set */}
        <div className="flex flex-col min-w-0">
          {/* Header with nav */}
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold truncate">{adSet.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] h-5">{CHANNEL_LABELS[adSet.channel]}</Badge>
                <Badge variant="outline" className="text-[10px] h-5">{adSet.format}</Badge>
                <span className="text-[10px] text-muted-foreground">{adSet.campaignName}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-3">
              <button onClick={prev} className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[10px] text-muted-foreground tabular-nums">{activeIndex + 1}/{AD_SETS.length}</span>
              <button onClick={next} className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {AD_SET_KPI_KEYS.map((key) => {
              const value = adSet.kpis[key];
              const delta = adSet.kpiDeltas[key];
              const isGood = key === 'cpa' || key === 'cpm' ? delta < 0 : delta > 0;

              return (
                <div key={key} className="rounded-lg bg-muted/30 p-3 flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {AD_SET_KPI_LABELS[key]}
                  </span>
                  <span className="text-base font-bold tabular-nums">{formatAdSetKPI(key, value)}</span>
                  <span className={`text-[10px] font-semibold tabular-nums ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                    {delta > 0 ? '+' : ''}{delta}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Asset reference */}
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Image className="h-3 w-3" />
            <span>Asset: {adSet.asset}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

const stateColumns: Column<StateDatum>[] = [
  { key: 'state', label: 'Province', sortable: true, getValue: (r) => r.stateName,
    render: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{r.stateName}</span>
        <Badge variant="outline" className="text-[10px]">{r.campaignCount} {r.campaignCount === 1 ? 'campaign' : 'campaigns'}</Badge>
      </div>
    ),
  },
  { key: 'spend', label: 'Spend', sortable: true, align: 'right', getValue: (r) => r.spend,
    render: (r) => formatCurrency(r.spend),
  },
  { key: 'impressions', label: 'Impr.', sortable: true, align: 'right', getValue: (r) => r.impressions,
    render: (r) => formatKPIValue(r.impressions, 'number'),
  },
  { key: 'conversions', label: 'Conv.', sortable: true, align: 'right', getValue: (r) => r.conversions,
    render: (r) => formatKPIValue(r.conversions, 'number'),
  },
  { key: 'revenue', label: 'Revenue', sortable: true, align: 'right', getValue: (r) => r.revenue,
    render: (r) => formatCurrency(r.revenue),
  },
  { key: 'roas', label: 'ROAS', sortable: true, align: 'right', getValue: (r) => r.roas,
    render: (r) => formatKPIValue(r.roas, 'decimal'),
  },
  { key: 'cpm', label: 'CPM', sortable: true, align: 'right', getValue: (r) => r.cpm,
    render: (r) => formatCurrency(r.cpm),
  },
];

export function BrandView() {
  const data = useDashboardData();
  const { customKpis, setCustomKpis, compareEnabled, selectedFunnel } = useAppStore();
  const heroKpis = FUNNEL_HERO_KPIS[selectedFunnel];
  const drillToDivision = useAppStore(s => s.drillToDivision);
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);

  const toggleKpi = (key: KPIKey) => {
    const next = customKpis.includes(key) ? customKpis.filter(k => k !== key) : [...customKpis, key];
    setCustomKpis(next);
  };

  const sortedStateData = [...data.stateData].sort((a, b) => b.spend - a.spend);

  return (
    <div className="space-y-8">
      {/* Hero KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Metrics</h2>
          <Dialog open={kpiDialogOpen} onOpenChange={setKpiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs"><Settings2 className="h-3 w-3 mr-1" /> Customize KPIs</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Customize Dashboard KPIs</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-2 mt-4 max-h-80 overflow-auto">
                {KPI_CONFIGS.map(config => (
                  <div key={config.key} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                    <Checkbox id={config.key} checked={customKpis.includes(config.key)} onCheckedChange={() => toggleKpi(config.key)} />
                    <Label htmlFor={config.key} className="text-sm cursor-pointer">{config.label}</Label>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

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

      </div>

      {/* 2. Full-Funnel Velocity Pipeline */}
      <FunnelVelocity data={data} compareEnabled={compareEnabled} />

      {/* 3. Budget Allocation Flow / Sankey */}
      <BudgetSankey data={data} />

      {/* 4. Division Cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Divisions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.divisionData.map(d => (
            <Card
              key={d.division}
              className="p-5 bg-card border-border/40 hover:border-teal/40 cursor-pointer transition-colors group"
              onClick={() => drillToDivision(d.division)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold group-hover:text-teal transition-colors">{d.divisionLabel}</h3>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-teal transition-colors" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Spend</span>
                  <span className="font-medium tabular-nums">{formatCurrency(d.kpis.spend)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ROAS</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium tabular-nums">{formatKPIValue(d.kpis.roas, 'decimal')}</span>
                    {compareEnabled && d.previousKpis && d.previousKpis.roas > 0 && (
                      <ComparisonDelta deltaPercent={((d.kpis.roas - d.previousKpis.roas) / d.previousKpis.roas) * 100} higherIsBetter={true} />
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">CPA</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium tabular-nums">{formatCurrency(d.kpis.cpa)}</span>
                    {compareEnabled && d.previousKpis && d.previousKpis.cpa > 0 && (
                      <ComparisonDelta deltaPercent={((d.kpis.cpa - d.previousKpis.cpa) / d.previousKpis.cpa) * 100} higherIsBetter={false} />
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-border/20">
                  <span className="text-muted-foreground">{d.campaignCount} campaigns</span>
                  <span className="text-muted-foreground">{d.productCount} products</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. Audience Portfolio Health */}
      <AudiencePortfolio data={data} />

      {/* 5. Channel Frequency Intelligence */}
      <ChannelFrequency data={data} />

      {/* 6. Agency Performance Benchmarking */}
      <AgencyBenchmarking data={data} compareEnabled={compareEnabled} />

      {/* 7. Conversion Value Intelligence */}
      <ConversionValue data={data} compareEnabled={compareEnabled} />

      {/* 8. Trend Chart + Channel Mix */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <TrendChart data={data.timeSeries} title="Global Performance Trend" defaultMetrics={['spend', 'conversions', 'roas']} />
        </div>
        <div className="xl:col-span-2">
          <ChannelMixChart data={data.channelData} title="Channel Mix" />
        </div>
      </div>

      {/* 8. Canada Heat Map */}
      <WorldMapChart stateData={data.stateData} />

      {/* 9. Campaign Overview Chart */}
      <CampaignOverviewChart campaignData={data.campaignData} />

      {/* 10. Province Performance Table */}
      <Card className="p-6 bg-card border-border/40">
        <h3 className="text-sm font-semibold mb-4">Province Performance</h3>
        <DataTableWrapper<StateDatum>
          data={sortedStateData}
          columns={stateColumns}
          searchable searchPlaceholder="Search provinces..." searchKey={(row) => row.stateName}
        />
      </Card>

      <CreativeExplorer />
    </div>
  );
}
