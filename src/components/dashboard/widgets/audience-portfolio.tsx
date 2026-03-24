"use client";
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardData } from '@/hooks/use-dashboard-data';

const HEALTH_STYLES: Record<string, { bg: string; text: string }> = {
  healthy: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  watch: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  'over-saturated': { bg: 'bg-red-500/15', text: 'text-red-400' },
  'under-invested': { bg: 'bg-blue-500/15', text: 'text-blue-400' },
};

const ACTION_STYLES: Record<string, string> = {
  scale: 'text-emerald-400',
  hold: 'text-amber-400',
  reduce: 'text-red-400',
  grow: 'text-blue-400',
};

const RETURN_LABELS: Record<string, { icon: string; color: string }> = {
  rising: { icon: '▲ Rising', color: 'text-emerald-400' },
  flat: { icon: '▬ Flat', color: 'text-amber-400' },
  declining: { icon: '▼ Declining', color: 'text-red-400' },
};

interface Props {
  data: DashboardData;
}

export function AudiencePortfolio({ data }: Props) {
  const audiences = data.audienceData;
  const hasData = audiences.filter(a => a.shareOfSpend > 0).length >= 2;

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">Audience portfolio health</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">Investment allocation, saturation, and marginal return across audience segments</p>
      </div>

      {!hasData ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No data available — adjust filter selections to broaden this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {audiences.map(aud => {
            const healthStyle = HEALTH_STYLES[aud.health] || HEALTH_STYLES.watch;
            const actionColor = ACTION_STYLES[aud.action] || 'text-muted-foreground';
            const returnInfo = RETURN_LABELS[aud.marginalReturn];
            const satColor = aud.saturation > 75 ? 'bg-red-400' : aud.saturation > 50 ? 'bg-amber-400' : 'bg-emerald-400';

            return (
              <div key={aud.id} className="rounded-lg bg-muted/20 border border-border/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{aud.label}</p>
                  <Badge className={`text-[10px] border-0 ${healthStyle.bg} ${healthStyle.text}`}>
                    {aud.health === 'over-saturated' ? 'Over-saturated' : aud.health === 'under-invested' ? 'Under-invested' : aud.health.charAt(0).toUpperCase() + aud.health.slice(1)}
                  </Badge>
                </div>

                {/* Share of spend */}
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Share of spend</span>
                    <span className="tabular-nums">{aud.shareOfSpend.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted/40">
                    <div className="h-full rounded-full bg-emerald-400/60" style={{ width: `${Math.min(100, aud.shareOfSpend * 3)}%` }} />
                  </div>
                </div>

                {/* ROAS + Marginal return */}
                <div className="flex justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground">ROAS </span>
                    <span className="font-medium tabular-nums">{aud.roas.toFixed(1)}x</span>
                  </div>
                  <span className={returnInfo.color}>{returnInfo.icon}</span>
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Saturation</span>
                    <span className="tabular-nums">{aud.saturation.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted/40">
                    <div className={`h-full rounded-full ${satColor}`} style={{ width: `${Math.min(100, aud.saturation)}%`, opacity: 0.6 }} />
                  </div>
                </div>

                {/* Action */}
                <div className={`text-[10px] font-medium uppercase tracking-wider ${actionColor}`}>
                  {aud.action}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
