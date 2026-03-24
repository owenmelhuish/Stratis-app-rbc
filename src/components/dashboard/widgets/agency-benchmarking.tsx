"use client";
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardData } from '@/hooks/use-dashboard-data';
import { formatCurrency } from '@/lib/format';

function getBadge(score: number, objectiveMix: Record<string, number>): { label: string; bg: string; text: string } {
  if ((objectiveMix['awareness'] || 0) > 60) return { label: 'Brand-focused', bg: 'bg-blue-500/15', text: 'text-blue-400' };
  if (score >= 85) return { label: 'Top performer', bg: 'bg-emerald-500/15', text: 'text-emerald-400' };
  if (score >= 70) return { label: 'Stable', bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
  if (score >= 55) return { label: 'Watch', bg: 'bg-amber-500/15', text: 'text-amber-400' };
  return { label: 'Underperforming', bg: 'bg-red-500/15', text: 'text-red-400' };
}

function scoreBarColor(score: number): string {
  if (score >= 70) return 'bg-emerald-400';
  if (score >= 55) return 'bg-amber-400';
  return 'bg-red-400';
}

interface Props {
  data: DashboardData;
  compareEnabled: boolean;
}

export function AgencyBenchmarking({ data, compareEnabled }: Props) {
  const agencies = data.agencyData;
  const hasData = agencies.filter(a => a.managedSpend > 0).length >= 2;

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">Agency performance benchmarking</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">Cross-agency efficiency comparison normalized by objective mix</p>
      </div>

      {!hasData ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No data available — adjust filter selections to broaden this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {agencies.filter(a => a.managedSpend > 0).map(ag => {
            const badge = getBadge(ag.efficiencyScore, ag.objectiveMix);
            const scoreDelta = compareEnabled && ag.previousScore !== null
              ? ag.efficiencyScore - ag.previousScore
              : null;

            return (
              <div key={ag.id} className="rounded-lg bg-muted/20 border border-border/30 p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{ag.label}</p>
                  <Badge className={`text-[10px] border-0 ${badge.bg} ${badge.text}`}>{badge.label}</Badge>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Managed Spend</p>
                    <p className="text-xs font-medium tabular-nums">{formatCurrency(ag.managedSpend)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Campaigns</p>
                    <p className="text-xs font-medium tabular-nums">{ag.campaignCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Blended ROAS</p>
                    <p className="text-xs font-medium tabular-nums">{ag.blendedRoas.toFixed(1)}x</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Avg CPA</p>
                    <p className="text-xs font-medium tabular-nums">{formatCurrency(ag.avgCpa)}</p>
                  </div>
                </div>

                {/* Budget pacing */}
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Budget Pacing</span>
                  <span className={`font-medium tabular-nums ${ag.budgetPacing > 110 ? 'text-red-400' : ag.budgetPacing < 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {ag.budgetPacing.toFixed(0)}%
                  </span>
                </div>

                {/* Objective mix */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Objective Mix</p>
                  <div className="flex gap-1">
                    {Object.entries(ag.objectiveMix).map(([obj, pct]) => (
                      <span key={obj} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground capitalize">
                        {obj} {pct}%
                      </span>
                    ))}
                  </div>
                </div>

                {/* Efficiency score bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">Efficiency Score</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold tabular-nums">{ag.efficiencyScore}</span>
                      {scoreDelta !== null && (
                        <span className={`text-[9px] ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {scoreDelta >= 0 ? '▲' : '▼'}{Math.abs(scoreDelta)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted/40">
                    <div
                      className={`h-full rounded-full ${scoreBarColor(ag.efficiencyScore)}`}
                      style={{ width: `${ag.efficiencyScore}%`, opacity: 0.7 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
