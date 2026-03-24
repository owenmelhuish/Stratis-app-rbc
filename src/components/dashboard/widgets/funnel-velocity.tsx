"use client";
import React from 'react';
import { Card } from '@/components/ui/card';
import type { DashboardData } from '@/hooks/use-dashboard-data';
import { ChevronRight } from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  awareness: '#378ADD',
  consideration: '#7F77DD',
  application: '#1D9E75',
  conversion: '#D85A30',
  activation: '#EF9F27',
};

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

interface Props {
  data: DashboardData;
  compareEnabled: boolean;
}

export function FunnelVelocity({ data, compareEnabled }: Props) {
  const { stages, gates } = data.funnelData;
  const hasData = stages.filter(s => s.volume > 0).length >= 2;

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">Full-funnel velocity pipeline</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">End-to-end conversion flow across all campaigns and channels</p>
      </div>

      {!hasData ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No data available — adjust filter selections to broaden this view.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stage pipeline */}
          <div className="flex items-stretch gap-1">
            {stages.map((stage, i) => {
              const color = STAGE_COLORS[stage.id] || '#888';
              return (
                <React.Fragment key={stage.id}>
                  <div
                    className="flex-1 rounded-lg p-4 min-w-0"
                    style={{ backgroundColor: `${color}1F` }}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color }}>{stage.label}</p>
                    <p className="text-xl font-bold tabular-nums">{formatVolume(stage.volume)}</p>
                    {stage.topChannels.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {stage.topChannels.map(ch => (
                          <p key={ch} className="text-[10px] text-muted-foreground truncate">{ch}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  {i < stages.length - 1 && (
                    <div className="flex items-center shrink-0">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Gate conversion rates */}
          <div className="grid grid-cols-4 gap-3">
            {gates.map(gate => {
              const delta = compareEnabled && gate.previousRate !== null
                ? gate.conversionRate - gate.previousRate
                : null;
              return (
                <div key={`${gate.from}-${gate.to}`} className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground capitalize mb-1">
                    {gate.from} → {gate.to}
                  </p>
                  <p className="text-sm font-bold tabular-nums">
                    {gate.conversionRate.toFixed(1)}%
                  </p>
                  {delta !== null && (
                    <p className={`text-[10px] mt-0.5 ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}pp vs prior
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
