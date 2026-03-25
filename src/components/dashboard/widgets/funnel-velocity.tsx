"use client";
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import type { DashboardData } from '@/hooks/use-dashboard-data';
import { ChevronRight, Info } from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  awareness: '#a0a0a0',
  consideration: '#909090',
  application: '#808080',
  conversion: '#707070',
  activation: '#606060',
};

const STAGE_ACCENT_COLORS: Record<string, string> = {
  awareness: '#378ADD',
  consideration: '#7F77DD',
  application: '#1D9E75',
  conversion: '#D85A30',
  activation: '#EF9F27',
};

const STAGE_TOOLTIPS: Record<string, string> = {
  awareness: 'Total impressions delivered across all awareness-objective campaigns. Represents estimated ad exposure volume, not unique individuals reached.',
  consideration: 'Total clicks generated across all consideration-objective campaigns. Represents active engagement actions from platform reporting.',
  application: 'Total leads reported across all conversion-objective campaigns. Derived from platform-reported lead events and form submissions.',
  conversion: 'Total conversions reported across all conversion and retention campaigns. Based on platform conversion tracking (e.g., account openings, applications completed).',
  activation: 'Estimated active accounts derived from conversion volume using an industry benchmark activation rate of 73%. This is a modeled estimate, not a tracked metric.',
};

const GATE_TOOLTIP = 'Ratio of next stage metric to current stage metric across their respective campaign sets. Note: these stages represent aggregate campaign metrics, not individual user journey tracking.';

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <Info
        className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute top-full left-1 mt-1 bg-card border border-border/60 rounded-lg p-3 shadow-lg text-[11px] text-muted-foreground leading-relaxed w-[320px] z-50">
          {text}
        </div>
      )}
    </div>
  );
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
              const accent = STAGE_ACCENT_COLORS[stage.id] || color;
              const tooltip = STAGE_TOOLTIPS[stage.id];
              return (
                <React.Fragment key={stage.id}>
                  <div
                    className="relative flex-1 rounded-lg p-4 min-w-0 border-l-2"
                    style={{ backgroundColor: `${color}1F`, borderLeftColor: `${accent}80` }}
                  >
                    {tooltip && (
                      <div className="absolute top-2.5 right-2.5">
                        <InfoTooltip text={tooltip} />
                      </div>
                    )}
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
                  <div className="inline-flex items-center gap-1.5">
                    <p className="text-sm font-bold tabular-nums">
                      {gate.conversionRate.toFixed(1)}%
                    </p>
                    <InfoTooltip text={GATE_TOOLTIP} />
                  </div>
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
