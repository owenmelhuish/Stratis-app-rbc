"use client";
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { DashboardData } from '@/hooks/use-dashboard-data';

const COL_COLORS: Record<string, string> = {
  div: '#7F77DD',
  prod: '#1D9E75',
  ch: '#378ADD',
  revenue: '#5DCAA5',
  waste: '#EF9F27',
};

function nodeColor(id: string): string {
  if (id === 'revenue') return COL_COLORS.revenue;
  if (id === 'waste') return COL_COLORS.waste;
  const prefix = id.split('-')[0];
  return COL_COLORS[prefix] || '#888';
}

interface NodeLayout {
  id: string; label: string; value: number;
  x: number; y: number; width: number; height: number;
  claimed: number;
}

interface Props {
  data: DashboardData;
}

export function BudgetSankey({ data }: Props) {
  const { divisions, products, channels, revenue, estimatedWaste, flows } = data.sankeyData;
  const hasData = divisions.filter(d => d.spend > 0).length >= 2;
  const totalSpend = divisions.reduce((s, d) => s + d.spend, 0);

  const layout = useMemo(() => {
    if (!hasData) return null;

    const W = 880;
    const TOP = 36;
    const BOT = 16;
    const colPositions = [
      { x: 30, w: 14 },   // divisions
      { x: 240, w: 12 },  // products
      { x: 480, w: 12 },  // channels
      { x: 720, w: 14 },  // outcomes
    ];
    const GAP = 6;

    // Build columns
    const outcomeNodes = [
      { id: 'revenue', label: 'Revenue', value: totalSpend - estimatedWaste },
      { id: 'waste', label: 'Est. Waste', value: estimatedWaste },
    ].filter(n => n.value > 0);

    const columns = [
      divisions.filter(d => d.spend > 0).map(d => ({ id: d.id, label: d.label, value: d.spend })).sort((a, b) => b.value - a.value),
      products.filter(p => p.spend > 0).map(p => ({ id: p.id, label: p.label, value: p.spend })).sort((a, b) => b.value - a.value),
      channels.filter(c => c.spend > 0).map(c => ({ id: c.id, label: c.label, value: c.spend })).sort((a, b) => b.value - a.value),
      outcomeNodes.sort((a, b) => b.value - a.value),
    ];

    // Calculate total height needed
    const maxNodes = Math.max(...columns.map(c => c.length));
    const H = Math.max(420, TOP + BOT + maxNodes * 28 + (maxNodes - 1) * GAP + 60);
    const availH = H - TOP - BOT;

    // Layout nodes per column
    const nodeMap = new Map<string, NodeLayout>();
    for (let col = 0; col < 4; col++) {
      const nodes = columns[col];
      const colTotal = nodes.reduce((s, n) => s + n.value, 0);
      const totalGap = (nodes.length - 1) * GAP;
      const usableH = availH - totalGap;
      let cy = TOP;
      for (const n of nodes) {
        const h = Math.max(18, (n.value / colTotal) * usableH);
        nodeMap.set(n.id, {
          id: n.id, label: n.label, value: n.value,
          x: colPositions[col].x, y: cy, width: colPositions[col].w, height: h,
          claimed: 0,
        });
        cy += h + GAP;
      }
    }

    // Sort flows to render larger ones first (more stable layout)
    const sortedFlows = [...flows].sort((a, b) => b.value - a.value);

    // Build flow paths
    const paths: Array<{ d: string; thickness: number; sourceColor: string; targetColor: string; opacity: number }> = [];
    for (const f of sortedFlows) {
      const src = nodeMap.get(f.source);
      const tgt = nodeMap.get(f.target);
      if (!src || !tgt) continue;

      const colTotal = totalSpend || 1;
      const thickness = Math.max(2, (f.value / colTotal) * availH);

      const sy = src.y + src.claimed + thickness / 2;
      src.claimed += thickness;
      const ty = tgt.y + tgt.claimed + thickness / 2;
      tgt.claimed += thickness;

      const sx = src.x + src.width;
      const tx = tgt.x;
      const mx = (sx + tx) / 2;

      paths.push({
        d: `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`,
        thickness,
        sourceColor: nodeColor(f.source),
        targetColor: nodeColor(f.target),
        opacity: 0.22,
      });
    }

    return { nodeMap, paths, H, W };
  }, [hasData, divisions, products, channels, totalSpend, estimatedWaste, flows]);

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Budget allocation flow</h3>
          <p className="text-xs text-muted-foreground">
            How {formatCurrency(totalSpend)} flows from divisions through products and channels to revenue outcomes
          </p>
        </div>
      </div>

      {!hasData || !layout ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No data available — adjust filter selections to broaden this view.
        </div>
      ) : (
        <svg viewBox={`0 0 ${layout.W} ${layout.H}`} width="100%" className="overflow-visible">
          {/* Gradient defs */}
          <defs>
            {layout.paths.map((p, i) => (
              <linearGradient key={i} id={`sg-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={p.sourceColor} />
                <stop offset="100%" stopColor={p.targetColor} />
              </linearGradient>
            ))}
          </defs>

          {/* Column headers */}
          {[
            { x: 37, label: 'DIVISIONS' },
            { x: 246, label: 'PRODUCTS' },
            { x: 486, label: 'CHANNELS' },
            { x: 727, label: 'OUTCOME' },
          ].map(h => (
            <text key={h.label} x={h.x} y={14} textAnchor="start" className="fill-muted-foreground" style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.05em' }}>
              {h.label}
            </text>
          ))}

          {/* Flow paths */}
          {layout.paths.map((p, i) => (
            <path key={i} d={p.d} fill="none" stroke={`url(#sg-${i})`} strokeWidth={p.thickness} opacity={p.opacity} />
          ))}

          {/* Nodes */}
          {Array.from(layout.nodeMap.values()).map(n => {
            const color = nodeColor(n.id);
            const isRightCol = n.x >= 700;
            return (
              <g key={n.id}>
                <rect x={n.x} y={n.y} width={n.width} height={n.height} rx={3} fill={color} opacity={0.75} />
                <text
                  x={isRightCol ? n.x - 6 : n.x + n.width + 6}
                  y={n.y + Math.min(n.height / 2, 12)}
                  textAnchor={isRightCol ? 'end' : 'start'}
                  dominantBaseline="middle"
                  className="fill-foreground"
                  style={{ fontSize: 11, fontWeight: 500 }}
                >
                  {n.label}
                </text>
                <text
                  x={isRightCol ? n.x - 6 : n.x + n.width + 6}
                  y={n.y + Math.min(n.height / 2, 12) + 13}
                  textAnchor={isRightCol ? 'end' : 'start'}
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: 9 }}
                >
                  {formatCurrency(n.value)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </Card>
  );
}
