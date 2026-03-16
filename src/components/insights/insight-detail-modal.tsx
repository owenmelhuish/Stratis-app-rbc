"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Circle,
  MoreHorizontal,
  Info,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { Insight } from '@/types';
import { cn } from '@/lib/utils';
import {
  generateInsightChartData,
  interpolateImproved,
  interpolateChannels,
  type MetricsHint,
} from '@/lib/insight-chart-data';
import type { InsightChartData, ChannelAllocation } from '@/lib/insight-chart-data';

// --- Derive metrics hint from insight ---
function deriveMetricsHint(insight: Insight): MetricsHint {
  const t = insight.title;
  if (t.includes('Pacing') || t.includes('Budget')) return 'budget-spend';
  if (t.includes('Hook Retention') || t.includes('View Rate')) return 'viewrate-impressions';
  if (t.includes('Saturation') || t.includes('Frequency Cap')) return 'engagement-frequency';
  if (t.includes('Channel') || t.includes('Dependence') || t.includes('Divergence') || t.includes('Opportunity')) return 'engagement-spend';
  if (insight.category === 'creative') return 'engagement-frequency';
  return 'engagement-frequency';
}

// --- Generate asset name from insight ID ---
function generateAssetName(insightId: string): string {
  let hash = 0;
  for (let i = 0; i < insightId.length; i++) {
    hash = ((hash << 5) - hash) + insightId.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);
  const adNum = (hash % 20) + 1;
  const formats = ['V', 'I', 'C'];
  const fmt = formats[hash % 3];
  const langs = ['EN', 'FR', 'ES'];
  const lang = langs[(hash >> 4) % 3];
  const durations = ['09', '15', '30'];
  const dur = durations[(hash >> 8) % 3];
  const aspects = ['1x1', '16x9', '9x16'];
  const aspect = aspects[(hash >> 12) % 3];
  const code = insightId.replace(/[^a-zA-Z0-9]/g, '').slice(-3).toUpperCase();
  return `DEEPWTR25-${code}-Ad${String(adNum).padStart(2, '0')}-${fmt}-${lang}-Trailer-${dur}-${aspect}`;
}

// --- Check if insight is creative/ad type ---
function isCreativeType(insight: Insight): boolean {
  return insight.category === 'creative';
}

// --- Check if insight is channel optimization type ---
function isChannelOptType(insight: Insight): boolean {
  const t = insight.title;
  return (
    t.includes('Saturation') ||
    t.includes('Dependence') ||
    t.includes('Divergence') ||
    t.includes('Opportunity') ||
    t.includes('Channel Mix') ||
    t.includes('Diminishing')
  );
}

interface InsightDetailModalProps {
  insight: Insight | null;
  open: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDiscard: (id: string) => void;
  onComplete: (id: string) => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function InsightDetailModal({
  insight,
  open,
  onClose,
  onPrev,
  onNext,
  onDiscard,
  onComplete,
  hasPrev,
  hasNext,
}: InsightDetailModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [budgetIntensity, setBudgetIntensity] = useState(50);

  const metricsHint = insight ? deriveMetricsHint(insight) : 'engagement-frequency';

  const chartData = useMemo<InsightChartData | null>(
    () => (insight ? generateInsightChartData(insight.id, metricsHint) : null),
    [insight, metricsHint]
  );

  // Reset state when insight changes
  useEffect(() => {
    if (!insight) return;
    setActiveTab(0);
    setBudgetIntensity(50);
  }, [insight]);

  const intensity = budgetIntensity / 100;

  const adjustedImproved = useMemo(() => {
    if (!chartData) return [];
    return interpolateImproved(chartData.predicted, chartData.improved, intensity);
  }, [chartData, intensity]);

  const adjustedChannels = useMemo(() => {
    if (!chartData) return [];
    return interpolateChannels(chartData.channelAllocations, intensity);
  }, [chartData, intensity]);

  // Build the combined chart data
  const combinedForChart = useMemo(() => {
    if (!chartData) return [];

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

    const improvedWithBridge = [
      { ...lastHist, improved: lastHist.primary },
      ...adjustedImproved,
    ];
    for (const p of improvedWithBridge) {
      const existing = map.get(p.day) || { day: p.day, label: p.label };
      map.set(p.day, { ...existing, improved: p.improved });
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v);
  }, [chartData, adjustedImproved]);

  // Compute average for legend
  const avgPrimary = useMemo(() => {
    if (!chartData) return 0;
    const vals = chartData.historical.map(p => p.primary);
    return vals.length > 0
      ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(
          metricsHint === 'budget-spend' ? 0 : metricsHint === 'engagement-spend' ? 4 : 1
        )
      : 0;
  }, [chartData, metricsHint]);

  // Budget move amount for channel insights
  const budgetMoveAmount = useMemo(() => {
    if (!adjustedChannels.length) return { amount: 0, percent: 0 };
    const totalSpend = adjustedChannels.reduce((s, c) => s + c.spend, 0);
    const reduced = adjustedChannels.filter(c => c.direction === 'reduced');
    const moveAmount = reduced.reduce((s, c) => s + Math.abs(c.recommendedSpend - c.spend), 0);
    return {
      amount: moveAmount,
      percent: totalSpend > 0 ? Math.round((moveAmount / totalSpend) * 100) : 0,
    };
  }, [adjustedChannels]);

  if (!insight || !chartData) return null;

  const creative = isCreativeType(insight);
  const channelOpt = isChannelOptType(insight);
  const assetName = creative ? generateAssetName(insight.id) : '';

  // TODAY index label for reference area
  const todayLabel = chartData.todayIndex;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed top-[50%] left-[50%] z-50 w-full max-w-lg max-h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border/40 bg-card shadow-2xl outline-none overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogTitle className="sr-only">{insight.title}</DialogTitle>

          {/* Nav arrows */}
          {hasPrev && (
            <button
              onClick={onPrev}
              className="absolute -left-12 top-1/2 -translate-y-1/2 rounded-full bg-card/80 border border-border/40 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={onNext}
              className="absolute -right-12 top-1/2 -translate-y-1/2 rounded-full bg-card/80 border border-border/40 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div className="overflow-y-auto max-h-[85vh]">
            <div className="p-5 space-y-0">

              {/* ─── Metric Tabs ─── */}
              <div className="flex items-center gap-1 bg-muted/30 rounded-full p-1 mb-4">
                {chartData.metricTabs.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all',
                      activeTab === i
                        ? 'bg-card-elevated text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab}
                  </button>
                ))}
                <button className="ml-auto p-1.5 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* ─── Main Chart ─── */}
              <div className="h-[220px] -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={combinedForChart}
                    margin={{ top: 5, right: 8, bottom: 0, left: 8 }}
                  >
                    <defs>
                      <linearGradient id="improvedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#888' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 9, fill: '#888' }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                      tickCount={5}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 9, fill: '#888' }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickCount={5}
                    />

                    <Tooltip
                      contentStyle={{
                        background: 'rgba(20,24,28,0.95)',
                        border: 'none',
                        borderRadius: 8,
                        backdropFilter: 'blur(12px)',
                        fontSize: 11,
                      }}
                      itemStyle={{ color: '#ccc' }}
                      labelStyle={{ color: '#fff', fontWeight: 600 }}
                    />

                    {/* Pink/red band around TODAY */}
                    <ReferenceArea
                      x1={combinedForChart.find(d => d.label === 'TODAY')?.day !== undefined
                        ? String(combinedForChart.findIndex(d => d.label === 'TODAY') > 0
                          ? combinedForChart[combinedForChart.findIndex(d => d.label === 'TODAY') - 2]?.label || ''
                          : '')
                        : ''}
                      x2="TODAY"
                      fill="rgba(239,68,68,0.06)"
                      fillOpacity={1}
                    />

                    <ReferenceLine
                      x="TODAY"
                      stroke="#999"
                      strokeWidth={0.5}
                      label={{ value: 'TODAY', position: 'top', fontSize: 9, fill: '#999' }}
                    />

                    {/* Historical primary - solid line */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="primary"
                      stroke="#e5e5e5"
                      strokeWidth={2}
                      dot={false}
                      name={chartData.primaryLabel}
                      isAnimationActive={false}
                    />

                    {/* Historical secondary - solid gray line */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="secondary"
                      stroke="#888"
                      strokeWidth={1.5}
                      dot={false}
                      name={chartData.secondaryLabel}
                      isAnimationActive={false}
                    />

                    {/* Predicted - dashed dark line */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="predicted"
                      stroke="#888"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                      name="Predicted"
                      connectNulls={false}
                      isAnimationActive={false}
                    />

                    {/* Possible improvement - dashed light blue with fill */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="improved"
                      stroke="#93c5fd"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      fill="url(#improvedGrad)"
                      dot={false}
                      name="Possible Improvement"
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* ─── Legend ─── */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground mt-2 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-[2px] bg-white/80 rounded" />
                  {chartData.primaryLabel} (AVG {avgPrimary})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-[1.5px] bg-muted-foreground/60 rounded" />
                  {chartData.secondaryLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-[1.5px] border-t-[1.5px] border-dashed border-muted-foreground/60" />
                  PREDICTED
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-3">
                <span className="inline-block w-4 h-[1.5px] border-t-[1.5px] border-dashed border-blue-300/60" />
                POSSIBLE IMPROVEMENT
              </div>

              {/* ─── Separator ─── */}
              <Separator className="mb-4" />

              {/* ─── Title & Summary ─── */}
              <div className="mb-3">
                <h2 className="text-xl font-bold leading-tight">{insight.title}</h2>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                  {insight.recommendedAction}
                </p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {insight.summary}
              </p>

              {/* ─── Separator ─── */}
              <Separator className="mb-4" />

              {/* ─── Action Section ─── */}
              {creative ? (
                <CreativeActionSection
                  insight={insight}
                  assetName={assetName}
                  budgetIntensity={budgetIntensity}
                  onBudgetChange={setBudgetIntensity}
                  onSkip={() => onDiscard(insight.id)}
                  onPause={() => onComplete(insight.id)}
                />
              ) : channelOpt ? (
                <ChannelOptActionSection
                  insight={insight}
                  channels={adjustedChannels}
                  avgEngagementRate={chartData.avgEngagementRate}
                  avgSpend={chartData.avgSpend}
                  budgetIntensity={budgetIntensity}
                  onBudgetChange={setBudgetIntensity}
                  moveAmount={budgetMoveAmount.amount}
                  movePercent={budgetMoveAmount.percent}
                  onDiscard={() => onDiscard(insight.id)}
                  onComplete={() => onComplete(insight.id)}
                />
              ) : (
                <DefaultActionSection
                  insight={insight}
                  budgetIntensity={budgetIntensity}
                  onBudgetChange={setBudgetIntensity}
                  onDiscard={() => onDiscard(insight.id)}
                  onComplete={() => onComplete(insight.id)}
                />
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

// ─── Creative Action Section (Pause Asset) ───

function CreativeActionSection({
  insight,
  assetName,
  budgetIntensity,
  onBudgetChange,
  onSkip,
  onPause,
}: {
  insight: Insight;
  assetName: string;
  budgetIntensity: number;
  onBudgetChange: (v: number) => void;
  onSkip: () => void;
  onPause: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Action header */}
      <div className="flex items-start gap-3">
        <Circle className="h-5 w-5 text-muted-foreground/40 mt-0.5 shrink-0" />
        <div>
          <p className="text-base font-bold">Pause Asset</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {insight.recommendedAction}
          </p>
        </div>
      </div>

      {/* Asset selector */}
      <div className="border border-border/40 rounded-lg px-4 py-3 flex items-center justify-between bg-muted/10">
        <span className="text-xs font-mono text-muted-foreground tracking-tight">
          {assetName}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
      </div>

      {/* Spend reduction slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Spend Reduction</p>
          <span className="text-xs text-muted-foreground font-medium">{budgetIntensity}%</span>
        </div>
        <div className="px-1">
          <Slider
            value={[budgetIntensity]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => onBudgetChange(v)}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-1">
          <span>No change</span>
          <span>Full pause</span>
        </div>
      </div>

      {/* Info disclaimer */}
      <div className="flex items-start gap-2.5 bg-muted/20 rounded-lg p-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Adjust how aggressively to reduce spend on this asset. The chart above reflects the projected improvement.
        </p>
      </div>

      {/* Bottom action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-none h-10 px-6 text-xs font-semibold border-border/60 rounded-full"
          onClick={onSkip}
        >
          Skip
        </Button>
        <Button
          size="sm"
          className="flex-1 h-10 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-full"
          onClick={onPause}
        >
          Pause Spend
        </Button>
      </div>
    </div>
  );
}

// ─── Channel Optimization Action Section ───

function ChannelOptActionSection({
  insight,
  channels,
  avgEngagementRate,
  avgSpend,
  budgetIntensity,
  onBudgetChange,
  moveAmount,
  movePercent,
  onDiscard,
  onComplete,
}: {
  insight: Insight;
  channels: ChannelAllocation[];
  avgEngagementRate: number;
  avgSpend: number;
  budgetIntensity: number;
  onBudgetChange: (v: number) => void;
  moveAmount: number;
  movePercent: number;
  onDiscard: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Action header */}
      <div className="flex items-start gap-3">
        <Circle className="h-5 w-5 text-muted-foreground/40 mt-0.5 shrink-0" />
        <div>
          <p className="text-base font-bold">Optimize Budget Allocation</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            SHIFT SPEND TO HIGH EFFICIENCY (ENGAGEMENT RATE)
          </p>
        </div>
      </div>

      {/* Channel bar chart */}
      <ChannelBarChart
        channels={channels}
        avgEngagementRate={avgEngagementRate}
      />

      {/* Chart legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground">
        <span className="font-semibold text-foreground text-[9px] uppercase tracking-wider">CHANNELS</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#555]" />
          ENGAGEMENT RATE (AVG: {avgEngagementRate.toFixed(2)})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" />
          SPEND (AVG: ${avgSpend.toLocaleString()})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm border border-emerald-500 bg-emerald-500/20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34,197,94,0.3) 2px, rgba(34,197,94,0.3) 4px)' }} />
          INCREASED
        </span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground -mt-2">
        <span className="inline-block w-2.5 h-2.5 rounded-sm border border-red-500 bg-red-500/20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(239,68,68,0.3) 2px, rgba(239,68,68,0.3) 4px)' }} />
        REDUCED
      </div>

      {/* Budget move text */}
      <p className="text-sm font-semibold">
        Move ${moveAmount.toFixed(2)} ({movePercent}%) to top performers
      </p>

      {/* Budget slider */}
      <div className="px-1">
        <Slider
          value={[budgetIntensity]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) => onBudgetChange(v)}
        />
      </div>

      {/* Info disclaimer */}
      <div className="flex items-start gap-2.5 bg-muted/20 rounded-lg p-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Platform-specific structures like budget minimums or campaign-level settings may affect how you apply these shifts.
        </p>
      </div>

      {/* Platform action items */}
      {channels.map((ch) => {
        const delta = ch.recommendedSpend - ch.spend;
        const verb = delta >= 0 ? 'Increase' : 'Reduce';
        const icon = ch.channel === 'TT' ? '\uD83C\uDFB5' : ch.channel === 'IG' ? '\uD83D\uDCF7' : '\uD83D\uDCF1';
        return (
          <div
            key={ch.channel}
            className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3 border border-border/20"
          >
            <span className="text-sm">{icon}</span>
            <p className="text-xs flex-1">
              {verb} {ch.channelLabel} budget by ${Math.abs(delta).toFixed(2)} to ${ch.recommendedSpend.toLocaleString()}.00
            </p>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          </div>
        );
      })}

      {/* Bottom action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10 text-xs font-semibold gap-1.5 border-border/60 rounded-full"
          onClick={onDiscard}
        >
          <X className="h-3.5 w-3.5" />
          Discard Insight
        </Button>
        <Button
          size="sm"
          className="flex-1 h-10 text-xs font-semibold gap-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-full"
          onClick={onComplete}
        >
          <Check className="h-3.5 w-3.5" />
          Launch
        </Button>
      </div>
    </div>
  );
}

// ─── Default Action Section (non-creative, non-channel) ───

function DefaultActionSection({
  insight,
  budgetIntensity,
  onBudgetChange,
  onDiscard,
  onComplete,
}: {
  insight: Insight;
  budgetIntensity: number;
  onBudgetChange: (v: number) => void;
  onDiscard: () => void;
  onComplete: () => void;
}) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Action steps */}
      {insight.actionSteps.map((step) => {
        const done = completedSteps.has(step.id);
        return (
          <button
            key={step.id}
            onClick={() => toggleStep(step.id)}
            className={cn(
              'flex items-start gap-3 w-full text-left rounded-lg px-3 py-2.5 border transition-colors',
              done
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-border/20 bg-muted/10 hover:bg-muted/20'
            )}
          >
            {done ? (
              <Check className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 mt-0.5 shrink-0" />
            )}
            <div>
              <p className={cn('text-sm font-semibold', done && 'text-emerald-300/80')}>
                {step.title}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {step.subtitle}
              </p>
            </div>
          </button>
        );
      })}

      {/* Execution intensity slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Execution Intensity</p>
          <span className="text-xs text-muted-foreground font-medium">{budgetIntensity}%</span>
        </div>
        <div className="px-1">
          <Slider
            value={[budgetIntensity]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => onBudgetChange(v)}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-1">
          <span>Conservative</span>
          <span>Aggressive</span>
        </div>
      </div>

      {/* Info disclaimer */}
      <div className="flex items-start gap-2.5 bg-muted/20 rounded-lg p-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Adjust how aggressively to apply this recommendation. The chart above reflects the projected improvement at the selected intensity.
        </p>
      </div>

      {/* Bottom action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10 text-xs font-semibold gap-1.5 border-border/60 rounded-full"
          onClick={onDiscard}
        >
          <X className="h-3.5 w-3.5" />
          Discard Insight
        </Button>
        <Button
          size="sm"
          className="flex-1 h-10 text-xs font-semibold gap-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-full"
          onClick={onComplete}
        >
          <Check className="h-3.5 w-3.5" />
          Launch
        </Button>
      </div>
    </div>
  );
}

// ─── Channel Bar Chart ───

function ChannelBarChart({
  channels,
  avgEngagementRate,
}: {
  channels: ChannelAllocation[];
  avgEngagementRate: number;
}) {
  const maxEng = Math.max(
    ...channels.flatMap(c => [c.engagementRate, c.recommendedEngagementRate])
  );
  const chartMax = maxEng * 1.4;
  const chartHeight = 160;
  const barAreaHeight = chartHeight - 30; // leave room for labels

  const groupWidth = 100 / channels.length;

  return (
    <div className="relative" style={{ height: chartHeight }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-[30px] w-10 flex flex-col justify-between text-[9px] text-muted-foreground">
        {[chartMax, chartMax * 0.75, chartMax * 0.5, chartMax * 0.25, 0].map((v, i) => (
          <span key={i}>{v.toFixed(v < 0.01 ? 4 : v < 1 ? 3 : 2)}</span>
        ))}
      </div>

      {/* Chart area */}
      <div className="ml-12 relative" style={{ height: barAreaHeight }}>
        {/* AVG line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/40 z-10"
          style={{ top: `${(1 - avgEngagementRate / chartMax) * 100}%` }}
        >
          <span className="absolute right-0 -top-3 text-[9px] text-muted-foreground">
            AVG {avgEngagementRate.toFixed(avgEngagementRate < 0.01 ? 4 : 1)}
          </span>
        </div>

        {/* Channel groups */}
        <div className="flex h-full items-end">
          {channels.map((ch) => {
            const engHeight = (ch.engagementRate / chartMax) * 100;
            const recEngHeight = (ch.recommendedEngagementRate / chartMax) * 100;
            const isIncreased = ch.direction === 'increased';

            // Normalize spend to engagement scale for visual comparison
            const maxSpend = Math.max(...channels.map(c => Math.max(c.spend, c.recommendedSpend)));
            const spendHeight = (ch.spend / maxSpend) * (chartMax * 0.8 / chartMax) * 100;
            const recSpendHeight = (ch.recommendedSpend / maxSpend) * (chartMax * 0.8 / chartMax) * 100;

            return (
              <div
                key={ch.channel}
                className="flex items-end justify-center gap-1"
                style={{ width: `${groupWidth}%` }}
              >
                {/* Engagement rate bar */}
                <div className="relative" style={{ width: 28 }}>
                  {/* Base bar */}
                  <div
                    className="w-full bg-[#555] rounded-t-sm relative"
                    style={{ height: `${Math.min(engHeight, recEngHeight)}%`, minHeight: 2 }}
                  />
                  {/* Delta portion */}
                  {Math.abs(recEngHeight - engHeight) > 0.5 && (
                    <div
                      className={cn(
                        'w-full rounded-t-sm absolute bottom-full',
                        isIncreased ? 'border border-emerald-500/60' : 'border border-red-500/60'
                      )}
                      style={{
                        height: `${Math.abs(recEngHeight - engHeight)}%`,
                        minHeight: 2,
                        backgroundImage: isIncreased
                          ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34,197,94,0.25) 2px, rgba(34,197,94,0.25) 4px)'
                          : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(239,68,68,0.25) 2px, rgba(239,68,68,0.25) 4px)',
                        backgroundColor: isIncreased ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      }}
                    />
                  )}
                </div>

                {/* Spend bar */}
                <div className="relative" style={{ width: 28 }}>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm"
                    style={{ height: `${Math.min(spendHeight, recSpendHeight)}%`, minHeight: 2 }}
                  />
                  {Math.abs(recSpendHeight - spendHeight) > 0.5 && (
                    <div
                      className={cn(
                        'w-full rounded-t-sm absolute bottom-full',
                        ch.recommendedSpend > ch.spend ? 'border border-emerald-500/60' : 'border border-red-500/60'
                      )}
                      style={{
                        height: `${Math.abs(recSpendHeight - spendHeight)}%`,
                        minHeight: 2,
                        backgroundImage: ch.recommendedSpend > ch.spend
                          ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34,197,94,0.25) 2px, rgba(34,197,94,0.25) 4px)'
                          : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(239,68,68,0.25) 2px, rgba(239,68,68,0.25) 4px)',
                        backgroundColor: ch.recommendedSpend > ch.spend ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="ml-12 flex h-[30px] items-center">
        {channels.map((ch) => (
          <div
            key={ch.channel}
            className="text-center text-xs text-muted-foreground font-medium"
            style={{ width: `${groupWidth}%` }}
          >
            {ch.channel}
          </div>
        ))}
      </div>
    </div>
  );
}
