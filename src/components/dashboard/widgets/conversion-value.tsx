"use client";
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import type { DashboardData } from '@/hooks/use-dashboard-data';

const SIGNAL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'high-value': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'High value' },
  improving: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Improving' },
  stable: { bg: 'bg-purple-500/12', text: 'text-purple-400', label: 'Stable' },
  watch: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Watch' },
  declining: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Declining' },
};

function rankColor(rank: number): string {
  if (rank <= 2) return 'bg-emerald-500/15 text-emerald-400';
  if (rank <= 4) return 'bg-blue-500/12 text-blue-400';
  if (rank <= 6) return 'bg-purple-500/12 text-purple-400';
  return 'bg-amber-500/12 text-amber-400';
}

function Sparkline({ data, color, declining }: { data: number[]; color: string; declining?: boolean }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', gap: '1px', height: '28px', alignItems: 'flex-end' }}>
      {data.map((val, i) => {
        const h = max > 0 ? (val / max) * 100 : 0;
        const opacity = declining
          ? 0.7 - (i / 9) * 0.4
          : 0.3 + (i / 9) * 0.4;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(4, h)}%`,
              borderRadius: '2px 2px 0 0',
              backgroundColor: color,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}

interface Props {
  data: DashboardData;
  compareEnabled: boolean;
}

export function ConversionValue({ data, compareEnabled }: Props) {
  const products = data.conversionValueData;
  const hasData = products.filter(p => p.conversions > 0).length >= 2;

  const highest = products[0];
  const mostImproved = [...products].sort((a, b) => b.trend - a.trend)[0];
  const declining = [...products].sort((a, b) => a.trend - b.trend)[0];
  const hasDecline = declining && declining.trend < -5;

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold">Conversion value intelligence</h3>
          <p className="text-xs text-muted-foreground">
            Average revenue per conversion by product line — proxy for customer acquisition value
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{compareEnabled ? 'vs prior period' : ''}</span>
      </div>

      {!hasData ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No data available — adjust filter selections to broaden this view.
        </div>
      ) : (
        <>
          {/* 3 Highlight cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Highest value */}
            {highest && (
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Highest value acquisitions</p>
                <p className="text-xl font-bold tabular-nums text-emerald-400">{formatCurrency(highest.revenuePerConversion)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{highest.label}</p>
                {highest.trend !== 0 && (
                  <p className={`text-[10px] mt-1 ${highest.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {highest.trend >= 0 ? '▲' : '▼'} {Math.abs(highest.trend).toFixed(1)}%
                  </p>
                )}
                <div className="mt-3">
                  <Sparkline data={highest.sparkline} color="#5DCAA5" />
                </div>
              </div>
            )}

            {/* Most improved */}
            {mostImproved && (
              <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Most improved value</p>
                <p className="text-xl font-bold tabular-nums text-blue-400">{formatCurrency(mostImproved.revenuePerConversion)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mostImproved.label}</p>
                <p className={`text-[10px] mt-1 ${mostImproved.trend >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                  {mostImproved.trend >= 0 ? '▲' : '▼'} {Math.abs(mostImproved.trend).toFixed(1)}%
                </p>
                <div className="mt-3">
                  <Sparkline data={mostImproved.sparkline} color="#378ADD" />
                </div>
              </div>
            )}

            {/* Declining / All stable */}
            {hasDecline && declining ? (
              <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Declining value</p>
                <p className="text-xl font-bold tabular-nums text-red-400">{formatCurrency(declining.revenuePerConversion)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{declining.label}</p>
                <p className="text-[10px] mt-1 text-red-400">
                  ▼ {Math.abs(declining.trend).toFixed(1)}%
                </p>
                <div className="mt-3">
                  <Sparkline data={declining.sparkline} color="#E24B4A" declining />
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/20 border border-border/30 p-4 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Declining value</p>
                  <p className="text-sm text-muted-foreground">All stable</p>
                </div>
              </div>
            )}
          </div>

          {/* Ranked table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left py-2 pr-2 text-[10px] text-muted-foreground font-medium w-8">#</th>
                  <th className="text-left py-2 pr-3 text-[10px] text-muted-foreground font-medium">Product Line</th>
                  <th className="text-right py-2 px-2 text-[10px] text-muted-foreground font-medium">Conversions</th>
                  <th className="text-right py-2 px-2 text-[10px] text-muted-foreground font-medium">Revenue</th>
                  <th className="text-right py-2 px-2 text-[10px] text-muted-foreground font-medium">Rev / Conv</th>
                  <th className="text-right py-2 px-2 text-[10px] text-muted-foreground font-medium">Trend</th>
                  <th className="text-center py-2 pl-2 text-[10px] text-muted-foreground font-medium">Signal</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const rank = i + 1;
                  const sig = SIGNAL_STYLES[p.signal];
                  return (
                    <tr key={p.productLine} className="border-b border-border/10">
                      <td className="py-2.5 pr-2">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium ${rankColor(rank)}`}>
                          {rank}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-medium">{p.label}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{p.conversions.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{formatCurrency(p.revenue)}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-medium">{formatCurrency(p.revenuePerConversion)}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {p.trend !== 0 ? (
                          <span className={p.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {p.trend >= 0 ? '▲' : '▼'} {Math.abs(p.trend).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pl-2 text-center">
                        <Badge className={`text-[9px] border-0 ${sig.bg} ${sig.text}`}>{sig.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
