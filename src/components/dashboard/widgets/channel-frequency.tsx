"use client";
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { CHANNEL_LABELS, AUDIENCE_LABELS, type ChannelId } from '@/types';
import { formatCurrency } from '@/lib/format';
import type { DashboardData } from '@/hooks/use-dashboard-data';
import { cn } from '@/lib/utils';

function cellColor(pct: number): string {
  if (pct <= 0) return 'transparent';
  if (pct <= 5) return 'rgba(93, 202, 165, 0.06)';
  if (pct <= 15) return 'rgba(93, 202, 165, 0.14)';
  if (pct <= 25) return 'rgba(93, 202, 165, 0.24)';
  if (pct <= 35) return 'rgba(93, 202, 165, 0.36)';
  return 'rgba(93, 202, 165, 0.48)';
}

function cellTextColor(pct: number): string {
  if (pct <= 0) return 'text-muted-foreground/30';
  if (pct <= 10) return 'text-muted-foreground/60';
  if (pct <= 25) return 'text-muted-foreground';
  return 'text-foreground';
}

function diverseColor(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'concentrated':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Concentrated' };
    case 'balanced':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Balanced' };
    case 'fragmented':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Fragmented' };
    default:
      return { bg: 'bg-muted/20', text: 'text-muted-foreground', label: '—' };
  }
}

const SHORT_CHANNEL: Record<string, string> = {
  'google-search': 'Search',
  'ttd': 'TTD',
  'ctv': 'CTV',
  'ooh': 'OOH',
};

interface Props {
  data: DashboardData;
}

export function ChannelFrequency({ data }: Props) {
  const { audiences, channels, matrix, totals, diversification } = data.investmentDistData;
  const hasData = audiences.length >= 2 && channels.length >= 2;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Audience investment distribution</h3>
          <div className="relative">
            <Info
              className="h-3 w-3 text-muted-foreground/40 cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div className="absolute top-5 left-0 bg-card border border-border/60 rounded-lg p-3 shadow-lg text-[11px] text-muted-foreground leading-relaxed w-[320px] z-50">
                Each cell shows what percentage of the audience&apos;s total media spend is allocated to that channel. All values are derived from platform-reported spend data, proportionally split when campaigns target multiple audiences. Rows sum to 100%.
              </div>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Share of spend by audience × channel. Shows where each audience&apos;s budget concentrates.
        </p>
      </div>

      {!hasData ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No data available — adjust filter selections to broaden this view.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-3 text-[10px] text-muted-foreground font-medium sticky left-0 bg-card z-10">
                    Audience
                  </th>
                  {channels.map((ch: ChannelId) => (
                    <th key={ch} className="text-center px-2 py-2 text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                      {SHORT_CHANNEL[ch] || CHANNEL_LABELS[ch] || ch}
                    </th>
                  ))}
                  <th className="text-center px-2 py-2 text-[10px] text-muted-foreground font-medium border-l border-border/30">
                    Total Spend
                  </th>
                  <th className="text-center px-2 py-2 text-[10px] text-muted-foreground font-medium">
                    Mix
                  </th>
                </tr>
              </thead>
              <tbody>
                {audiences.map(aud => {
                  const dc = diverseColor(diversification[aud]);
                  return (
                    <tr key={aud} className="border-t border-border/10">
                      <td className="py-2 pr-3 text-xs font-medium sticky left-0 bg-card z-10 whitespace-nowrap">
                        {AUDIENCE_LABELS[aud]}
                      </td>
                      {channels.map((ch: ChannelId) => {
                        const val = matrix[aud]?.[ch] ?? 0;
                        return (
                          <td
                            key={ch}
                            className={cn("text-center px-2 py-2 tabular-nums", cellTextColor(val))}
                            style={{ backgroundColor: cellColor(val) }}
                          >
                            {val > 0 ? `${val.toFixed(1)}%` : '—'}
                          </td>
                        );
                      })}
                      <td className="text-center px-2 py-2 font-semibold tabular-nums text-muted-foreground border-l border-border/30">
                        {formatCurrency(totals[aud] || 0)}
                      </td>
                      <td className="text-center px-2 py-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${dc.bg} ${dc.text}`}>
                          {dc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/20">
            <span className="text-[10px] text-muted-foreground">Share of spend:</span>
            {[
              { range: '0–5%', color: 'rgba(93, 202, 165, 0.06)' },
              { range: '5–15%', color: 'rgba(93, 202, 165, 0.14)' },
              { range: '15–25%', color: 'rgba(93, 202, 165, 0.24)' },
              { range: '25–35%', color: 'rgba(93, 202, 165, 0.36)' },
              { range: '35%+', color: 'rgba(93, 202, 165, 0.48)' },
            ].map(l => (
              <div key={l.range} className="flex items-center gap-1.5">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: l.color }} />
                <span className="text-[10px] text-muted-foreground">{l.range}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
