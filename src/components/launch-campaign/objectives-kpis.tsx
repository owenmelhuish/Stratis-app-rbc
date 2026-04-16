"use client";
import React from 'react';
import { Star } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FUNNEL_CUSTOM_KPIS,
  FUNNEL_LABELS,
  KPI_CONFIGS,
  type AttributionModel,
  type CampaignObjective,
  type ConfidenceLevel,
  type FunnelStage,
  type KPIKey,
  type KPIConfig,
} from '@/types';
import { cn } from '@/lib/utils';
import { SectionCard } from './section-card';
import { SegmentedGroup } from './segmented-group';

const OBJECTIVES: Array<{ value: CampaignObjective; label: string; hint: string }> = [
  { value: 'awareness', label: 'Awareness', hint: 'Reach & mental availability' },
  { value: 'consideration', label: 'Consideration', hint: 'Interest & engagement' },
  { value: 'conversion', label: 'Conversion', hint: 'Acquisitions & revenue' },
  { value: 'retention', label: 'Retention', hint: 'Lifetime value & repeat' },
];

const FUNNEL_STAGES: Array<{ value: FunnelStage; label: string }> = [
  { value: 'upper', label: FUNNEL_LABELS.upper },
  { value: 'mid', label: FUNNEL_LABELS.mid },
  { value: 'lower', label: FUNNEL_LABELS.lower },
  { value: 'retention', label: FUNNEL_LABELS.retention },
];

const ATTRIBUTION_MODELS: Array<{ value: AttributionModel; label: string; hint: string }> = [
  { value: 'last-click', label: 'Last-click', hint: 'Final touch gets credit' },
  { value: 'first-click', label: 'First-click', hint: 'Origin gets credit' },
  { value: 'linear', label: 'Linear', hint: 'Equal across touches' },
  { value: 'data-driven', label: 'Data-driven', hint: 'Algorithmic weighting' },
];

const CONFIDENCE_LEVELS: Array<{ value: ConfidenceLevel; label: string; hint: string }> = [
  { value: 'low', label: 'Low', hint: 'New territory, few precedents' },
  { value: 'medium', label: 'Medium', hint: 'Some historical baseline' },
  { value: 'high', label: 'High', hint: 'Strong benchmark & prior data' },
];

const CATEGORY_ORDER: KPIConfig['category'][] = [
  'spend', 'reach', 'engagement', 'conversion', 'revenue', 'video', 'health',
];

const CATEGORY_LABELS: Record<KPIConfig['category'], string> = {
  spend: 'Spend',
  reach: 'Reach & Brand',
  engagement: 'Engagement',
  conversion: 'Conversion',
  revenue: 'Revenue',
  video: 'Video',
  health: 'Campaign Health',
};

function placeholderForFormat(format: KPIConfig['format']): string {
  switch (format) {
    case 'currency': return '$0.00';
    case 'percent': return '0.0%';
    case 'decimal': return '0.0';
    case 'index': return '100';
    case 'number':
    default: return '0';
  }
}

export function ObjectivesKpis() {
  const draft = useAppStore((s) => s.draftCampaign);
  const setField = useAppStore((s) => s.setDraftCampaignField);

  const funnelForKpis: FunnelStage = draft.funnelStage === 'all' ? 'lower' : draft.funnelStage;
  const availableKpis: KPIKey[] = FUNNEL_CUSTOM_KPIS[funnelForKpis];
  const availableConfigs: KPIConfig[] = availableKpis
    .map((k) => KPI_CONFIGS.find((c) => c.key === k))
    .filter((c): c is KPIConfig => Boolean(c));

  const kpisByCategory = CATEGORY_ORDER
    .map((cat) => ({ cat, items: availableConfigs.filter((c) => c.category === cat) }))
    .filter((g) => g.items.length > 0);

  const filledKpiCount = Object.entries(draft.kpiTargets).filter(([, v]) => v && v.toString().trim()).length;

  const filled = Boolean(
    draft.objective &&
    draft.attributionModel &&
    (filledKpiCount >= 2 || draft.definitionOfWin.trim().length > 0)
  );

  const setKpi = (key: KPIKey, value: string) => {
    setField('kpiTargets', { ...draft.kpiTargets, [key]: value });
  };

  const togglePriorityKpi = (key: KPIKey) => {
    const isPriority = draft.priorityKpis.includes(key);
    if (isPriority) {
      setField('priorityKpis', draft.priorityKpis.filter((k) => k !== key));
    } else if (draft.priorityKpis.length < 3) {
      setField('priorityKpis', [...draft.priorityKpis, key]);
    }
  };

  const toggleSecondaryObjective = (obj: CampaignObjective) => {
    if (obj === draft.objective) return;
    const next = draft.secondaryObjectives.includes(obj)
      ? draft.secondaryObjectives.filter((o) => o !== obj)
      : [...draft.secondaryObjectives, obj];
    setField('secondaryObjectives', next);
  };

  return (
    <SectionCard
      id="objectives"
      number={3}
      title="Objectives & KPIs"
      subtitle="Define the outcomes STRATIS should optimize for — and how you'll measure a win."
      filled={filled}
    >
      {/* Primary + Secondary Objectives */}
      <div className="space-y-2">
        <Label className="text-[12px] text-muted-foreground">Primary Objective</Label>
        <SegmentedGroup<CampaignObjective>
          value={draft.objective as CampaignObjective | ''}
          onChange={(v) => {
            setField('objective', v);
            if (draft.secondaryObjectives.includes(v)) {
              setField('secondaryObjectives', draft.secondaryObjectives.filter((o) => o !== v));
            }
          }}
          options={OBJECTIVES}
          columns={4}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[12px] text-muted-foreground">
          Secondary Objectives <span className="text-muted-foreground/50 font-normal">(optional — supporting goals)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {OBJECTIVES.filter((o) => o.value !== draft.objective).map((opt) => {
            const active = draft.secondaryObjectives.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleSecondaryObjective(opt.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
                  active
                    ? "border-teal/50 bg-teal/15 text-teal"
                    : "border-border/50 bg-card-elevated/30 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-[12px] text-muted-foreground">Funnel Focus</Label>
          <SegmentedGroup<FunnelStage>
            value={draft.funnelStage}
            onChange={(v) => setField('funnelStage', v)}
            options={FUNNEL_STAGES}
            columns={2}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] text-muted-foreground">Attribution Model</Label>
          <SegmentedGroup<AttributionModel>
            value={draft.attributionModel as AttributionModel | ''}
            onChange={(v) => setField('attributionModel', v)}
            options={ATTRIBUTION_MODELS}
            columns={2}
          />
        </div>
      </div>

      {/* KPI Targets */}
      <div className="space-y-3 pt-2 border-t border-border/30">
        <div>
          <div className="flex items-baseline justify-between">
            <Label className="text-[12px] text-muted-foreground">KPI Targets</Label>
            <span className="text-[10px] text-muted-foreground/60">
              {filledKpiCount} set · {draft.priorityKpis.length}/3 priority starred
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            Set thresholds for the {FUNNEL_LABELS[funnelForKpis].toLowerCase()} push. Star up to 3 priority KPIs — STRATIS weights the strategy toward them.
          </p>
        </div>

        <div className="space-y-4">
          {kpisByCategory.map(({ cat, items }) => (
            <div key={cat} className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {items.map((cfg) => {
                  const isPriority = draft.priorityKpis.includes(cfg.key);
                  const isFilled = Boolean(draft.kpiTargets[cfg.key] && draft.kpiTargets[cfg.key]?.toString().trim());
                  return (
                    <div
                      key={cfg.key}
                      className={cn(
                        "group relative rounded-lg border bg-card-elevated/20 p-2.5 transition-colors",
                        isPriority ? "border-teal/40 bg-teal/5" : "border-border/40",
                        isFilled && !isPriority && "border-border/60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <Label
                          htmlFor={`kpi-${cfg.key}`}
                          className="text-[11px] text-muted-foreground/90 leading-tight flex-1"
                        >
                          {cfg.label}
                        </Label>
                        <button
                          type="button"
                          onClick={() => togglePriorityKpi(cfg.key)}
                          disabled={!isPriority && draft.priorityKpis.length >= 3}
                          className={cn(
                            "shrink-0 transition-colors",
                            isPriority
                              ? "text-teal"
                              : "text-muted-foreground/30 hover:text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          )}
                          aria-label={isPriority ? "Unstar priority" : "Mark as priority"}
                          title={isPriority ? "Priority KPI" : "Mark as priority (max 3)"}
                        >
                          <Star className={cn("h-3.5 w-3.5", isPriority && "fill-teal")} />
                        </button>
                      </div>
                      <Input
                        id={`kpi-${cfg.key}`}
                        inputMode="decimal"
                        placeholder={placeholderForFormat(cfg.format)}
                        value={draft.kpiTargets[cfg.key] ?? ''}
                        onChange={(e) => setKpi(cfg.key, e.target.value)}
                        className="h-8 mt-1.5 text-[12px]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmark + Confidence */}
      <div className="space-y-3 pt-2 border-t border-border/30">
        <div className="space-y-2">
          <Label htmlFor="benchmark" className="text-[12px] text-muted-foreground">
            Benchmark & Historical Context
          </Label>
          <Textarea
            id="benchmark"
            placeholder="What's the current baseline we're beating? Last year's ROAS was 2.4x. Industry average CPA is $85. Our prior launch hit 3.1% CTR…"
            value={draft.benchmarkContext}
            onChange={(e) => setField('benchmarkContext', e.target.value)}
            className="min-h-[70px] resize-y"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[12px] text-muted-foreground">Confidence in Targets</Label>
          <SegmentedGroup<ConfidenceLevel>
            value={draft.confidenceLevel}
            onChange={(v) => setField('confidenceLevel', v)}
            options={CONFIDENCE_LEVELS}
            columns={3}
          />
        </div>
      </div>

      {/* Definition of Win */}
      <div className="space-y-2 pt-2 border-t border-border/30">
        <Label htmlFor="definition-of-win" className="text-[12px] text-muted-foreground">
          Definition of Win
        </Label>
        <Textarea
          id="definition-of-win"
          placeholder="The minimum result for this campaign to be called a success. Be specific — revenue threshold, conversion count, brand lift points, cost per acquisition ceiling…"
          value={draft.definitionOfWin}
          onChange={(e) => setField('definitionOfWin', e.target.value)}
          className="min-h-[70px] resize-y"
        />
      </div>
    </SectionCard>
  );
}
