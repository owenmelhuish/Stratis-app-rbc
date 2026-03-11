"use client";
import React, { useState } from 'react';
import { useDashboardData, type StateDatum } from '@/hooks/use-dashboard-data';
import { useAppStore } from '@/lib/store';
import { HeroKPICard } from '@/components/shared/hero-kpi-card';
import { TrendChart } from '@/components/shared/trend-chart';
import { ChannelMixChart } from '@/components/shared/channel-mix-chart';
import { CampaignOverviewChart } from '@/components/shared/campaign-overview-chart';
import { WorldMapChart } from '@/components/shared/world-map-chart';
import { BentoKPIGrid } from '@/components/shared/bento-kpi-grid';
import { DataTableWrapper, type Column } from '@/components/shared/data-table-wrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Settings2, TrendingUp, TrendingDown, AlertTriangle, Zap, Target, DollarSign, BarChart3, Activity, Eye } from 'lucide-react';
import { KPI_CONFIGS, CHANNEL_LABELS, type KPIKey, type ChannelId, type AggregatedKPIs } from '@/types';
import { formatCurrency, formatKPIValue, formatPercent } from '@/lib/format';

const HERO_KPIS: KPIKey[] = ['spend', 'cpm', 'roas'];
const HERO_COLORS: Record<string, string> = { spend: '#e07060', cpm: '#6b8aad', roas: '#50b89a' };

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
  const { customKpis, setCustomKpis, compareEnabled } = useAppStore();
  const drillToRegion = useAppStore(s => s.drillToRegion);
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
          {HERO_KPIS.map((key) => {
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

      <WorldMapChart stateData={data.stateData} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <TrendChart data={data.timeSeries} title="Global Performance Trend" defaultMetrics={['spend', 'conversions', 'roas']} />
        </div>
        <div className="xl:col-span-2">
          <ChannelMixChart data={data.channelData} title="Channel Mix" />
        </div>
      </div>

      <Card className="p-6 bg-card border-border/40">
        <h3 className="text-sm font-semibold mb-4">Province Performance</h3>
        <DataTableWrapper<StateDatum>
          data={sortedStateData}
          columns={stateColumns}
          searchable searchPlaceholder="Search provinces..." searchKey={(row) => row.stateName}
        />
      </Card>

      <CampaignOverviewChart campaignData={data.campaignData} />

      <BentoKPIGrid data={data} compareEnabled={compareEnabled} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Highlights */}
        <Card className="p-6 bg-card border-border/40">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Performance Highlights</h3>
          </div>
          <div className="space-y-3">
            {(() => {
              const topCampaign = [...data.campaignData]
                .filter(c => c.campaign.status === 'live' && c.kpis.spend > 0)
                .sort((a, b) => b.kpis.roas - a.kpis.roas)[0];
              const topProvince = [...data.stateData]
                .filter(s => s.spend > 0)
                .sort((a, b) => b.roas - a.roas)[0];
              const channelEntries = Object.entries(data.channelData)
                .filter(([, kpis]) => kpis.spend > 0)
                .sort(([, a], [, b]) => b.roas - a.roas);
              const topChannel = channelEntries[0];
              const liveCampaigns = data.campaignData.filter(c => c.campaign.status === 'live');
              const onPaceCount = liveCampaigns.filter(c => c.kpis.budgetPacing >= 85 && c.kpis.budgetPacing <= 115).length;

              return (
                <>
                  {topCampaign && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 shrink-0">
                        <Target className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Campaign by ROAS</p>
                        <p className="text-sm font-medium truncate">{topCampaign.campaign.name}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 tabular-nums shrink-0">{formatKPIValue(topCampaign.kpis.roas, 'decimal')}</span>
                    </div>
                  )}
                  {topChannel && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 shrink-0">
                        <BarChart3 className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Channel by ROAS</p>
                        <p className="text-sm font-medium">{CHANNEL_LABELS[topChannel[0] as ChannelId]}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 tabular-nums shrink-0">{formatKPIValue(topChannel[1].roas, 'decimal')}</span>
                    </div>
                  )}
                  {topProvince && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 shrink-0">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Strongest Province</p>
                        <p className="text-sm font-medium">{topProvince.stateName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-emerald-400 tabular-nums">{formatKPIValue(topProvince.roas, 'decimal')}</span>
                        <p className="text-[10px] text-muted-foreground">{formatCurrency(topProvince.spend)} spend</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 shrink-0">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Budget Pacing</p>
                      <p className="text-sm font-medium">{onPaceCount} of {liveCampaigns.length} campaigns on pace</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 tabular-nums shrink-0">{liveCampaigns.length > 0 ? Math.round((onPaceCount / liveCampaigns.length) * 100) : 0}%</span>
                  </div>
                </>
              );
            })()}
          </div>
        </Card>

        {/* Watch List */}
        <Card className="p-6 bg-card border-border/40">
          <div className="flex items-center gap-2 mb-5">
            <Eye className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold">Watch List</h3>
            {data.anomalies.length > 0 && (
              <Badge className="bg-red-500/15 text-red-400 text-xs border-0">{data.anomalies.length} anomalies</Badge>
            )}
          </div>
          <div className="space-y-3">
            {(() => {
              const worstCampaign = [...data.campaignData]
                .filter(c => c.campaign.status === 'live' && c.kpis.spend > 0)
                .sort((a, b) => a.kpis.roas - b.kpis.roas)[0];
              const highestCPA = [...data.campaignData]
                .filter(c => c.campaign.status === 'live' && c.kpis.conversions > 0)
                .sort((a, b) => b.kpis.cpa - a.kpis.cpa)[0];
              const liveCampaigns = data.campaignData.filter(c => c.campaign.status === 'live');
              const offPace = liveCampaigns.filter(c => c.kpis.budgetPacing < 85 || c.kpis.budgetPacing > 115);
              const weakestChannel = (Object.entries(data.channelData) as [ChannelId, AggregatedKPIs][])
                .filter(([, v]) => v.spend > 0)
                .sort((a, b) => a[1].roas - b[1].roas)[0];
              const highestFatigue = [...data.campaignData]
                .filter(c => c.campaign.status === 'live' && c.kpis.creativeFatigueIndex > 0)
                .sort((a, b) => b.kpis.creativeFatigueIndex - a.kpis.creativeFatigueIndex)[0];

              return (
                <>
                  {worstCampaign && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 shrink-0">
                        <TrendingDown className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lowest ROAS Campaign</p>
                        <p className="text-sm font-medium truncate">{worstCampaign.campaign.name}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-400 tabular-nums shrink-0">{formatKPIValue(worstCampaign.kpis.roas, 'decimal')}</span>
                    </div>
                  )}
                  {highestCPA && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 shrink-0">
                        <DollarSign className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Highest CPA Campaign</p>
                        <p className="text-sm font-medium truncate">{highestCPA.campaign.name}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-400 tabular-nums shrink-0">{formatCurrency(highestCPA.kpis.cpa)}</span>
                    </div>
                  )}
                  {weakestChannel && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 shrink-0">
                        <Activity className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Weakest Channel</p>
                        <p className="text-sm font-medium">{CHANNEL_LABELS[weakestChannel[0]]}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-amber-400 tabular-nums">{formatKPIValue(weakestChannel[1].roas, 'decimal')}</span>
                        <p className="text-[10px] text-muted-foreground">{formatCurrency(weakestChannel[1].cpa)} CPA</p>
                      </div>
                    </div>
                  )}
                  {highestFatigue ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 shrink-0">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Creative Fatigue</p>
                        <p className="text-sm font-medium truncate">{highestFatigue.campaign.name}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-400 tabular-nums shrink-0">{highestFatigue.kpis.creativeFatigueIndex.toFixed(0)}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 shrink-0">
                        <Activity className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Creative Fatigue</p>
                        <p className="text-sm font-medium text-emerald-400">All creatives performing well</p>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </Card>
      </div>
    </div>
  );
}
