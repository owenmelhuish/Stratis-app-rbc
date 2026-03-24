"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { generateAllData } from '@/lib/mock-data';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Lightbulb, CheckCircle2, XCircle, Clock, Eye,
  ListChecks, Activity, Zap, MoreHorizontal, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, ReferenceLine, ReferenceArea,
} from 'recharts';
import {
  DIVISION_LABELS, CHANNEL_LABELS,
  type InsightCategory, type InsightStatus, type Insight,
} from '@/types';
import { cn } from '@/lib/utils';
import { generateInsightChartData, interpolateImproved, type MetricsHint } from '@/lib/insight-chart-data';
import { InsightDetailModal } from '@/components/insights/insight-detail-modal';

const CATEGORY_CONFIG: Record<InsightCategory, { label: string; color: string }> = {
  'cross-agency': { label: 'Cross-Agency', color: 'bg-purple-500/20 text-purple-400' },
  'cross-product': { label: 'Cross-Product', color: 'bg-cyan-500/20 text-cyan-400' },
  'cross-channel': { label: 'Cross-Channel', color: 'bg-blue-500/20 text-blue-400' },
  'market-intelligence': { label: 'Market Intelligence', color: 'bg-red-500/20 text-red-400' },
  'portfolio': { label: 'Portfolio Strategy', color: 'bg-amber-500/20 text-amber-400' },
};

const STATUS_OPTIONS: { value: InsightStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'approved', label: 'Approved' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'snoozed', label: 'Snoozed' },
];

interface ScopeGroup {
  key: string;
  label: string;
  description: string;
  filter: (item: Insight) => boolean;
}

const SCOPE_GROUPS: ScopeGroup[] = [
  {
    key: 'cross-agency',
    label: 'CROSS-AGENCY',
    description: 'Insights requiring visibility across agency boundaries',
    filter: (item) => item.category === 'cross-agency',
  },
  {
    key: 'cross-product-channel',
    label: 'CROSS-PRODUCT & CHANNEL',
    description: 'Product interaction and channel mix intelligence',
    filter: (item) => item.category === 'cross-product' || item.category === 'cross-channel',
  },
  {
    key: 'market-intelligence',
    label: 'MARKET INTELLIGENCE',
    description: 'Performance correlated with market events and competitor activity',
    filter: (item) => item.category === 'market-intelligence',
  },
  {
    key: 'portfolio',
    label: 'PORTFOLIO STRATEGY',
    description: 'Full-portfolio optimization across the enterprise',
    filter: (item) => item.category === 'portfolio',
  },
];

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InsightStatus | 'all'>('all');
  const [categoryFilters, setCategoryFilters] = useState<InsightCategory[]>([]);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  const store = useMemo(() => generateAllData(), []);
  const {
    insightStatuses, insightApprovals, insightDismissals, insightSnoozes,
    actionLog, approvedDrawerOpen, setApprovedDrawerOpen,
    approveInsight, dismissInsight, reviewInsight,
  } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const getStatus = useCallback(
    (id: string, defaultStatus: InsightStatus): InsightStatus => {
      return insightStatuses[id] || defaultStatus;
    },
    [insightStatuses]
  );

  const filtered = useMemo(() => {
    return store.insights.filter((item) => {
      const status = getStatus(item.id, item.status);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (statusFilter === 'all' && status === 'snoozed') {
        const snoozeUntil = insightSnoozes[item.id];
        if (snoozeUntil && snoozeUntil > new Date().toISOString().split('T')[0]) return false;
      }
      if (categoryFilters.length > 0 && !categoryFilters.includes(item.category)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !item.summary.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [store.insights, statusFilter, categoryFilters, search, getStatus, insightSnoozes]);

  const toggleCategory = (c: InsightCategory) =>
    setCategoryFilters((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const selectedInsight = useMemo(
    () => (selectedInsightId ? filtered.find((i) => i.id === selectedInsightId) ?? null : null),
    [selectedInsightId, filtered]
  );

  const selectedIndex = useMemo(
    () => (selectedInsightId ? filtered.findIndex((i) => i.id === selectedInsightId) : -1),
    [selectedInsightId, filtered]
  );

  const approvedInsights = store.insights.filter(
    (i) => getStatus(i.id, i.status) === 'approved'
  );
  const approvedCount = approvedInsights.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Insights Feed</h1>
          <p className="text-xs text-muted-foreground mt-1">
            AI-derived insights from performance patterns, news, and anomalies
          </p>
        </div>
        <Sheet open={approvedDrawerOpen} onOpenChange={setApprovedDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Approved Actions
              {approvedCount > 0 && (
                <Badge className="bg-orange/20 text-orange text-[10px]">{approvedCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[440px]">
            <SheetHeader>
              <SheetTitle>Approved Actions & Action Log</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              {approvedCount > 0 && (
                <div className="bg-orange/5 border border-orange/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-orange" />
                    <span className="text-xs font-semibold text-orange">
                      Simulated plan updated
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {approvedCount} approved actions influencing budget allocation model
                  </p>
                  <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 text-[10px]">
                    Projected: +{(approvedCount * 3.2).toFixed(1)}% efficiency
                  </Badge>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold mb-3">Approved Insights</h3>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2 pr-3">
                    {approvedInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
                      >
                        <p className="text-xs font-medium">{insight.title}</p>
                        <p className="text-[10px] text-orange mt-1">{insight.impactEstimate}</p>
                        {insightApprovals[insight.id] && (
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            &quot;{insightApprovals[insight.id]}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                    {approvedInsights.length === 0 && (
                      <p className="text-xs text-muted-foreground">No approved actions yet</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Action Log</h3>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2 pr-3">
                    {actionLog.map((entry) => {
                      const insight = store.insights.find((i) => i.id === entry.insightId);
                      return (
                        <div
                          key={entry.id}
                          className="flex items-start gap-2 p-2 rounded bg-muted/30 text-xs"
                        >
                          <Activity className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <span
                              className={cn(
                                'font-medium capitalize',
                                entry.action === 'approved' && 'text-emerald-400',
                                entry.action === 'dismissed' && 'text-red-400',
                                entry.action === 'snoozed' && 'text-yellow-400',
                                entry.action === 'reviewed' && 'text-blue-400'
                              )}
                            >
                              {entry.action}
                            </span>
                            <span className="text-muted-foreground">
                              {' '}
                              — {insight?.title?.slice(0, 50) || entry.insightId}...
                            </span>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(entry.timestamp).toLocaleString()}
                              {entry.rationale && <span> &bull; &quot;{entry.rationale}&quot;</span>}
                              {entry.dismissReason && (
                                <span> &bull; Reason: {entry.dismissReason}</span>
                              )}
                              {entry.snoozeUntil && (
                                <span> &bull; Until: {entry.snoozeUntil}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {actionLog.length === 0 && (
                      <p className="text-xs text-muted-foreground">No actions taken yet</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Horizontal filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search insights..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 bg-muted/50 text-xs"
          />
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Status pills */}
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
                statusFilter === opt.value
                  ? 'bg-orange/15 text-orange'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Category pills */}
        <div className="flex items-center gap-1">
          {(
            Object.entries(CATEGORY_CONFIG) as [
              InsightCategory,
              (typeof CATEGORY_CONFIG)[InsightCategory],
            ][]
          ).map(([cat, config]) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                categoryFilters.includes(cat)
                  ? config.color + ' border-current'
                  : 'bg-muted text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              {config.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[11px] text-muted-foreground">
          {filtered.length} insights
        </span>
      </div>

      {/* Grouped sections */}
      {SCOPE_GROUPS.map((group) => {
        const groupInsights = filtered.filter(group.filter);
        if (groupInsights.length === 0) return null;

        return (
          <div key={group.key} className="space-y-3">
            {/* Section header */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
                {group.label}
              </h2>
              <p className="text-[11px] text-muted-foreground">{group.description}</p>
            </div>

            {/* 3-column grid */}
            <div className="grid grid-cols-3 gap-4">
              {groupInsights.map((item) => (
                <InsightCard
                  key={item.id}
                  insight={item}
                  status={getStatus(item.id, item.status)}
                  onClick={() => setSelectedInsightId(item.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No insights match your filters</p>
        </div>
      )}

      {/* Detail modal */}
      <InsightDetailModal
        insight={selectedInsight}
        open={selectedInsightId !== null && selectedInsight !== null}
        onClose={() => setSelectedInsightId(null)}
        onPrev={() => {
          if (selectedIndex > 0) setSelectedInsightId(filtered[selectedIndex - 1].id);
        }}
        onNext={() => {
          if (selectedIndex < filtered.length - 1)
            setSelectedInsightId(filtered[selectedIndex + 1].id);
        }}
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex < filtered.length - 1}
        onDiscard={(id) => {
          dismissInsight(id, 'not-relevant');
          setSelectedInsightId(null);
        }}
        onComplete={(id) => {
          approveInsight(id);
          setSelectedInsightId(null);
        }}
      />
    </div>
  );
}

// ===== InsightCard Component =====

function getMetricsHint(title: string, category?: string): MetricsHint {
  if (title.includes('Pacing') || title.includes('Budget')) return 'budget-spend';
  if (title.includes('Hook Retention') || title.includes('View Rate')) return 'viewrate-impressions';
  if (title.includes('Saturation') || title.includes('Frequency Cap')) return 'engagement-frequency';
  if (title.includes('Channel') || title.includes('Dependence') || title.includes('Divergence') || title.includes('Opportunity')) return 'engagement-spend';
  if (category === 'creative') return 'engagement-frequency';
  return 'engagement-frequency';
}

function InsightCard({
  insight,
  status,
  onClick,
}: {
  insight: Insight;
  status: InsightStatus;
  onClick: () => void;
}) {
  const hint = getMetricsHint(insight.title, insight.category);
  const chartData = useMemo(() => generateInsightChartData(insight.id, hint), [insight.id, hint]);

  // Build the same combined data used in the detail modal
  const combinedForChart = useMemo(() => {
    const map = new Map<number, Record<string, number | string | undefined>>();

    for (const p of chartData.historical) {
      map.set(p.day, {
        day: p.day,
        label: p.label,
        primary: p.primary,
        secondary: p.secondary,
      });
    }

    const lastHist = chartData.historical[chartData.historical.length - 1];
    const predictedWithBridge = [lastHist, ...chartData.predicted];
    for (const p of predictedWithBridge) {
      const existing = map.get(p.day) || { day: p.day, label: p.label };
      map.set(p.day, { ...existing, predicted: p.primary, predSecondary: p.secondary });
    }

    // Use full improved (intensity=1) for preview
    const improved = interpolateImproved(chartData.predicted, chartData.improved, 1);
    const improvedWithBridge = [
      { ...lastHist, improved: lastHist.primary },
      ...improved,
    ];
    for (const p of improvedWithBridge) {
      const existing = map.get(p.day) || { day: p.day, label: p.label };
      map.set(p.day, { ...existing, improved: p.improved });
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v);
  }, [chartData]);

  const lastHistorical = chartData.historical[chartData.historical.length - 1];
  const firstHistorical = chartData.historical[0];
  const primaryTrend =
    lastHistorical && firstHistorical ? lastHistorical.primary - firstHistorical.primary : 0;
  const secondaryTrend =
    lastHistorical && firstHistorical
      ? lastHistorical.secondary - firstHistorical.secondary
      : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-border/40 bg-card p-5 cursor-pointer transition-all hover:border-border/70 hover:shadow-md relative group',
        status === 'approved' && 'border-emerald-500/20',
        status === 'dismissed' && 'border-red-500/10 opacity-60'
      )}
    >
      {/* Menu button */}
      <button className="absolute top-3 right-3 p-1 rounded text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground">
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {/* Title */}
      <h3 className="text-sm font-bold pr-6 line-clamp-2">{insight.title}</h3>

      {/* Subtitle from recommended action */}
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 line-clamp-2">
        {insight.recommendedAction}
      </p>

      {/* Chart matching the detail modal */}
      <div className="h-[150px] mt-3 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedForChart} margin={{ top: 5, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id={`miniImpGrad-${insight.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#666' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 8, fill: '#666' }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickCount={4}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 8, fill: '#666' }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickCount={4}
            />
            {/* Pink TODAY band */}
            <ReferenceArea
              x1={combinedForChart.length > 2
                ? (combinedForChart[Math.max(0, combinedForChart.findIndex(d => d.label === 'TODAY') - 2)]?.label as string) || ''
                : ''}
              x2="TODAY"
              fill="rgba(239,68,68,0.05)"
              fillOpacity={1}
            />
            <ReferenceLine
              x="TODAY"
              stroke="#555"
              strokeWidth={0.5}
            />
            {/* Historical primary - solid white line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="primary"
              stroke="#e5e5e5"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            {/* Historical secondary - solid gray line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="secondary"
              stroke="#888"
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
            {/* Predicted - dashed gray */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="predicted"
              stroke="#888"
              strokeWidth={1}
              strokeDasharray="4 3"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            {/* Possible improvement - dashed light blue with fill */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="improved"
              stroke="#93c5fd"
              strokeWidth={1}
              strokeDasharray="4 3"
              fill={`url(#miniImpGrad-${insight.id})`}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom legend */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/80" />
          <span>{chartData.primaryLabel}</span>
          {primaryTrend >= 0 ? (
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-400" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          <span>{chartData.secondaryLabel}</span>
          {secondaryTrend >= 0 ? (
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-400" />
          )}
        </div>
      </div>
    </div>
  );
}
