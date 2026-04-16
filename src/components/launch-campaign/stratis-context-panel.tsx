"use client";
import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  AGENCY_LABELS,
  AUDIENCE_LABELS,
  CHANNEL_LABELS,
  DIVISION_LABELS,
  FUNNEL_LABELS,
  GEO_LABELS,
  KPI_CONFIGS,
  PRODUCT_LINE_LABELS,
} from '@/types';
import { cn } from '@/lib/utils';

interface SignalRow {
  key: string;
  label: string;
  lit: boolean;
}

export function StratisContextPanel() {
  const draft = useAppStore((s) => s.draftCampaign);

  const filledKpis = Object.values(draft.kpiTargets).filter((v) => v && v.toString().trim()).length;
  const signals: SignalRow[] = [
    { key: 'identity', label: 'Campaign identity', lit: Boolean(draft.name && draft.division && draft.productLine) },
    { key: 'brief', label: 'Brief (written or uploaded)', lit: draft.briefNarrative.trim().length > 20 || draft.briefFile !== null },
    { key: 'outcome', label: 'Primary objective', lit: Boolean(draft.objective) },
    { key: 'attribution', label: 'Attribution model', lit: Boolean(draft.attributionModel) },
    { key: 'kpis', label: `KPI targets (${filledKpis})`, lit: filledKpis >= 2 },
    { key: 'priority', label: 'Priority KPIs starred', lit: draft.priorityKpis.length > 0 },
    { key: 'benchmark', label: 'Benchmark / definition of win', lit: draft.benchmarkContext.trim().length > 0 || draft.definitionOfWin.trim().length > 0 },
    { key: 'audience', label: 'Audience signal', lit: draft.audiences.length > 0 },
    { key: 'geo', label: 'Geographic scope', lit: draft.geos.length > 0 },
    { key: 'envelope', label: 'Timeline & budget', lit: Boolean(draft.startDate && draft.plannedBudget) },
    { key: 'channels', label: 'Channel mix', lit: draft.channels.length > 0 },
  ];

  const litCount = signals.filter((s) => s.lit).length;
  const completeness = Math.round((litCount / signals.length) * 100);

  const readback = buildReadback(draft);

  let hint = 'Keep going — more context = sharper strategy.';
  if (completeness === 0) hint = 'Start with the brief to prime STRATIS.';
  else if (completeness < 40) hint = 'Add audience & channels for a directional plan.';
  else if (completeness < 70) hint = 'Almost there — fill timeline and channel mix.';
  else if (completeness < 100) hint = 'Strong context. A few more signals will unlock precision.';
  else hint = 'STRATIS has everything it needs.';

  return (
    <div className="sticky top-0 space-y-4">
      <div className="rounded-xl bg-card-elevated/50 border border-border/40 p-5 space-y-5">
        <header className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal/15">
            <Sparkles className="h-3.5 w-3.5 text-teal" />
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.2em]">
            STRATIS Context
          </p>
        </header>

        {/* Readback */}
        <div className="rounded-lg bg-background/60 border border-border/30 p-3.5">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-2">
            Ingested Brief
          </p>
          {readback ? (
            <p
              className="text-[12.5px] leading-[1.65] text-foreground/90"
              dangerouslySetInnerHTML={{ __html: readback }}
            />
          ) : (
            <p className="text-[12px] text-muted-foreground/60 italic">
              STRATIS is listening. Fill the brief and this panel will translate what&apos;s been said into working context.
            </p>
          )}
        </div>

        {/* Signals checklist */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
            Signals Ingested
          </p>
          <ul className="space-y-1">
            {signals.map((sig) => (
              <li
                key={sig.key}
                className={cn(
                  "flex items-center gap-2 text-[12px] transition-colors",
                  sig.lit ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
                    sig.lit ? "border-teal/60 bg-teal/20" : "border-border/40"
                  )}
                >
                  {sig.lit && <Check className="h-2.5 w-2.5 text-teal" strokeWidth={3} />}
                </span>
                {sig.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Completeness meter */}
        <div className="space-y-2 pt-2 border-t border-border/30">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
              Context Strength
            </p>
            <span className="text-[13px] font-bold text-teal tabular-nums">{completeness}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function bold(text: string): string {
  return `<strong class="text-teal font-semibold">${escapeHtml(text)}</strong>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildReadback(draft: ReturnType<typeof useAppStore.getState>['draftCampaign']): string {
  const parts: string[] = [];

  if (draft.name) parts.push(`Preparing ${bold(draft.name)}`);

  if (draft.division && draft.productLine) {
    parts.push(
      `for ${bold(PRODUCT_LINE_LABELS[draft.productLine])} (${DIVISION_LABELS[draft.division]})`
    );
  } else if (draft.division) {
    parts.push(`for ${bold(DIVISION_LABELS[draft.division])}`);
  } else if (draft.productLine) {
    parts.push(`for ${bold(PRODUCT_LINE_LABELS[draft.productLine])}`);
  }

  if (draft.agency) parts.push(`with ${bold(AGENCY_LABELS[draft.agency])}`);

  let sentence1 = parts.join(' ');
  if (sentence1) sentence1 += '.';

  const sentence2Parts: string[] = [];
  if (draft.objective) {
    sentence2Parts.push(`Primary goal: ${bold(draft.objective)}`);
    if (draft.secondaryObjectives.length > 0) {
      sentence2Parts.push(`(also ${bold(draft.secondaryObjectives.join(', '))})`);
    }
  }
  if (draft.funnelStage && draft.funnelStage !== 'all') {
    sentence2Parts.push(`across the ${bold(FUNNEL_LABELS[draft.funnelStage].toLowerCase())}`);
  }
  if (draft.attributionModel) {
    sentence2Parts.push(`measured via ${bold(draft.attributionModel)} attribution`);
  }
  if (draft.audiences.length > 0) {
    const names = draft.audiences.slice(0, 3).map((a) => AUDIENCE_LABELS[a]).join(', ');
    const extra = draft.audiences.length > 3 ? ` +${draft.audiences.length - 3} more` : '';
    sentence2Parts.push(`targeting ${bold(names + extra)}`);
  }
  if (draft.geos.length > 0) {
    const names = draft.geos.map((g) => GEO_LABELS[g]).join(', ');
    sentence2Parts.push(`in ${bold(names)}`);
  }
  let sentence2 = sentence2Parts.join(' ');
  if (sentence2) sentence2 += '.';

  const sentence3Parts: string[] = [];
  if (draft.plannedBudget) {
    sentence3Parts.push(`Envelope: ${bold(draft.plannedBudget)}`);
  }
  if (draft.startDate && draft.endDate) {
    sentence3Parts.push(`flighting ${bold(draft.startDate)} → ${bold(draft.endDate)}`);
  } else if (draft.startDate) {
    sentence3Parts.push(`launching ${bold(draft.startDate)}`);
  }
  if (draft.channels.length > 0) {
    const names = draft.channels.map((c) => CHANNEL_LABELS[c]).join(', ');
    sentence3Parts.push(`on ${bold(names)}`);
  }
  let sentence3 = sentence3Parts.join(' ');
  if (sentence3) sentence3 += '.';

  let sentence4 = '';
  if (draft.priorityKpis.length > 0) {
    const kpiLabels = draft.priorityKpis
      .map((k) => KPI_CONFIGS.find((c) => c.key === k)?.label ?? k)
      .join(', ');
    sentence4 = `Priority KPIs: ${bold(kpiLabels)}.`;
  }

  if (draft.briefFile) {
    const prefix = `Brief document ingested: ${bold(draft.briefFile.name)}.`;
    return [prefix, sentence1, sentence2, sentence3, sentence4].filter(Boolean).join(' ');
  }

  return [sentence1, sentence2, sentence3, sentence4].filter(Boolean).join(' ');
}
