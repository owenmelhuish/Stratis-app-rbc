"use client";
import React from 'react';
import { CheckCircle2, Rocket, ArrowRight, FileText, Star } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  AGENCY_LABELS,
  AUDIENCE_LABELS,
  CHANNEL_LABELS,
  CHANNEL_COLORS,
  DIVISION_LABELS,
  FUNNEL_LABELS,
  GEO_LABELS,
  KPI_CONFIGS,
  PRODUCT_LINE_LABELS,
} from '@/types';

interface Props {
  onStartAnother: () => void;
}

export function SuccessRecap({ onStartAnother }: Props) {
  const draft = useAppStore((s) => s.draftCampaign);

  const kpiEntries = Object.entries(draft.kpiTargets).filter(([, v]) => v && v.toString().trim());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/15 border border-teal/30">
          <CheckCircle2 className="h-5 w-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Strategy generated</h1>
          <p className="text-[12.5px] text-muted-foreground/80">
            STRATIS has the full context. Here&apos;s what it&apos;s working with.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border/40 p-6 space-y-5">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-1">
            Campaign
          </p>
          <h2 className="text-lg font-semibold text-foreground">{draft.name || 'Untitled brief'}</h2>
          <p className="text-[12px] text-muted-foreground/70 mt-1">
            {draft.division && PRODUCT_LINE_LABELS[draft.productLine as keyof typeof PRODUCT_LINE_LABELS]
              ? `${PRODUCT_LINE_LABELS[draft.productLine as keyof typeof PRODUCT_LINE_LABELS]} · ${DIVISION_LABELS[draft.division]}`
              : ''}
            {draft.agency && ` · ${AGENCY_LABELS[draft.agency]}`}
          </p>
        </div>

        {draft.briefFile && (
          <div className="flex items-center gap-3 rounded-lg bg-teal/10 border border-teal/30 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/20 shrink-0">
              <FileText className="h-4 w-4 text-teal" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-foreground truncate">{draft.briefFile.name}</p>
              <p className="text-[11px] text-muted-foreground/70">Brief document attached to context</p>
            </div>
          </div>
        )}

        {draft.briefNarrative && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-1">
              Brief
            </p>
            <p className="text-[13px] text-foreground/80 leading-relaxed">{draft.briefNarrative}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border/30">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">Objective</p>
            <p className="text-[13px] font-medium text-foreground mt-1 capitalize">{draft.objective || '—'}</p>
            {draft.secondaryObjectives.length > 0 && (
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 capitalize">
                +{draft.secondaryObjectives.join(', ')}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">Funnel</p>
            <p className="text-[13px] font-medium text-foreground mt-1">{FUNNEL_LABELS[draft.funnelStage]}</p>
            {draft.attributionModel && (
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 capitalize">{draft.attributionModel} attribution</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">Budget</p>
            <p className="text-[13px] font-medium text-foreground mt-1">{draft.plannedBudget || '—'}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 capitalize">{draft.pacing} pacing</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">Flight</p>
            <p className="text-[13px] font-medium text-foreground mt-1">
              {draft.startDate && draft.endDate ? `${draft.startDate} → ${draft.endDate}` : draft.startDate || '—'}
            </p>
          </div>
        </div>

        {draft.channels.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-2">
              Channels
            </p>
            <div className="flex flex-wrap gap-2">
              {draft.channels.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card-elevated/40 px-3 py-1 text-[12px] text-foreground"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: CHANNEL_COLORS[id] }}
                  />
                  {CHANNEL_LABELS[id]}
                  {draft.channelBudgetSplits[id] !== undefined && (
                    <span className="text-muted-foreground/70 tabular-nums">
                      · {draft.channelBudgetSplits[id]}%
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {(draft.audiences.length > 0 || draft.geos.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {draft.audiences.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-1">
                  Audiences
                </p>
                <p className="text-[12.5px] text-foreground/80">
                  {draft.audiences.map((a) => AUDIENCE_LABELS[a]).join(', ')}
                </p>
              </div>
            )}
            {draft.geos.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-1">
                  Geography
                </p>
                <p className="text-[12.5px] text-foreground/80">
                  {draft.geos.map((g) => GEO_LABELS[g]).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {kpiEntries.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-2">
              KPI Targets <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">· starred = priority</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {kpiEntries.map(([key, val]) => {
                const cfg = KPI_CONFIGS.find((k) => k.key === key);
                const isPriority = draft.priorityKpis.includes(key as typeof draft.priorityKpis[number]);
                return (
                  <div
                    key={key}
                    className={`rounded-lg border px-3 py-2 ${
                      isPriority ? "border-teal/40 bg-teal/5" : "border-border/40 bg-card-elevated/30"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isPriority && <Star className="h-3 w-3 text-teal fill-teal shrink-0" />}
                      <p className="text-[10px] text-muted-foreground/70">{cfg?.label ?? key}</p>
                    </div>
                    <p className="text-[13px] font-semibold text-foreground tabular-nums">{val}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(draft.benchmarkContext.trim() || draft.definitionOfWin.trim()) && (
          <div className="space-y-3 pt-2 border-t border-border/30">
            {draft.definitionOfWin.trim() && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-1">
                  Definition of Win
                </p>
                <p className="text-[12.5px] text-foreground/80 leading-relaxed">{draft.definitionOfWin}</p>
              </div>
            )}
            {draft.benchmarkContext.trim() && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-1">
                  Benchmark Context
                </p>
                <p className="text-[12.5px] text-foreground/80 leading-relaxed">{draft.benchmarkContext}</p>
              </div>
            )}
            <div className="text-[11px] text-muted-foreground/70">
              Confidence in targets: <span className="text-foreground capitalize">{draft.confidenceLevel}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Button
          type="button"
          disabled
          className="bg-teal/20 text-teal border border-teal/30 hover:bg-teal/20 cursor-not-allowed"
        >
          View in Simulation <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onStartAnother}
          className="gap-2"
        >
          <Rocket className="h-4 w-4" />
          Start another brief
        </Button>
        <p className="text-[11px] text-muted-foreground/70 sm:ml-2">
          Channel launch is coming soon — STRATIS will push live creative & budget into each platform.
        </p>
      </div>
    </div>
  );
}
