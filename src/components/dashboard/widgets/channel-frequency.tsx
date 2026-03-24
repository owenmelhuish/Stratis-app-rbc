"use client";
import React from 'react';
import { Card } from '@/components/ui/card';
import { CHANNEL_LABELS, AUDIENCE_LABELS, type ChannelId, type AudienceId } from '@/types';
import type { DashboardData } from '@/hooks/use-dashboard-data';

function cellColor(freq: number): string {
  if (freq <= 0) return 'transparent';
  if (freq <= 2) return 'rgba(93, 202, 165, 0.08)';
  if (freq <= 3) return 'rgba(93, 202, 165, 0.18)';
  if (freq <= 4) return 'rgba(239, 159, 39, 0.15)';
  return 'rgba(239, 159, 39, 0.28)';
}

function totalColor(total: number): { bg: string; text: string; label: string } {
  if (total < 6) return { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Under-reached' };
  if (total <= 8) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Optimal' };
  if (total <= 12) return { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Elevated' };
  return { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Over-exposed' };
}

interface Props {
  data: DashboardData;
}

export function ChannelFrequency({ data }: Props) {
  const { audiences, channels, matrix, totals, statuses } = data.frequencyData;
  const hasData = audiences.length >= 2 && channels.length >= 2;

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">Cross-channel frequency intelligence</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">Weekly impressions per person by audience × channel. Optimal threshold: 6–8x total.</p>
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
                  <th className="text-left py-2 pr-3 text-[10px] text-muted-foreground font-medium sticky left-0 bg-card z-10">Audience</th>
                  {channels.map(ch => (
                    <th key={ch} className="text-center px-2 py-2 text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                      {CHANNEL_LABELS[ch]?.replace('The Trade Desk', 'TTD').replace('Google Search', 'Search').replace('Out-of-Home', 'OOH') || ch}
                    </th>
                  ))}
                  <th className="text-center px-2 py-2 text-[10px] text-muted-foreground font-medium border-l border-border/30">Total</th>
                  <th className="text-center px-2 py-2 text-[10px] text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {audiences.map(aud => {
                  const tc = totalColor(totals[aud]);
                  return (
                    <tr key={aud} className="border-t border-border/10">
                      <td className="py-2 pr-3 text-xs font-medium sticky left-0 bg-card z-10 whitespace-nowrap">
                        {AUDIENCE_LABELS[aud]}
                      </td>
                      {channels.map(ch => {
                        const val = matrix[aud]?.[ch] ?? 0;
                        return (
                          <td key={ch} className="text-center px-2 py-2 tabular-nums" style={{ backgroundColor: cellColor(val) }}>
                            {val > 0 ? val.toFixed(1) : '—'}
                          </td>
                        );
                      })}
                      <td className={`text-center px-2 py-2 font-semibold tabular-nums border-l border-border/30 ${tc.text}`}>
                        {totals[aud]?.toFixed(1) ?? '—'}
                      </td>
                      <td className="text-center px-2 py-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${tc.bg} ${tc.text}`}>
                          {tc.label}
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
            <span className="text-[10px] text-muted-foreground">Frequency:</span>
            {[
              { range: '0–2x', color: 'rgba(93, 202, 165, 0.08)' },
              { range: '2–3x', color: 'rgba(93, 202, 165, 0.18)' },
              { range: '3–4x', color: 'rgba(239, 159, 39, 0.15)' },
              { range: '4x+', color: 'rgba(239, 159, 39, 0.28)' },
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
