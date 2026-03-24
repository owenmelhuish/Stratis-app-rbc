"use client";
import React, { useMemo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { DashboardData } from '@/hooks/use-dashboard-data';

interface Props { data: DashboardData }

export function BudgetSankey({ data }: Props) {
  const { divisions, products, channels, estimatedWaste, flows } = data.sankeyData;
  const hasData = divisions.filter(d => d.spend > 0).length >= 2;
  const totalSpend = divisions.reduce((s, d) => s + d.spend, 0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const layout = useMemo(() => {
    if (!hasData) return null;

    // ─── CONSTANTS ───
    const W = 1100;
    const TOP = 36;
    const GAP = 6;
    const MIN_NODE_H = 16;
    const MIN_FLOW = totalSpend * 0.008;

    const COLS = [
      { x: 20,  w: 12, prefix: 'div',    color: '#7F77DD' },
      { x: 220, w: 12, prefix: 'agency', color: '#D85A30' },
      { x: 440, w: 12, prefix: 'prod',   color: '#1D9E75' },
      { x: 680, w: 12, prefix: 'ch',     color: '#378ADD' },
      { x: 920, w: 14, prefix: 'outcome',color: '#5DCAA5' },
    ];

    // ─── BUILD NODE ARRAYS PER COLUMN ───
    const divNodes = divisions.filter(d => d.spend > 0)
      .map(d => ({ id: d.id, label: d.label, value: d.spend }))
      .sort((a, b) => b.value - a.value);

    const agencyNodes = (data.sankeyData.agencies || []).filter(a => a.spend > 0)
      .map(a => ({ id: a.id, label: a.label, value: a.spend }))
      .sort((a, b) => b.value - a.value);

    const prodNodes = products.filter(p => p.spend > 0)
      .map(p => ({ id: p.id, label: p.label, value: p.spend }))
      .sort((a, b) => b.value - a.value);

    const chanNodes = channels.filter(c => c.spend > 0)
      .map(c => ({ id: c.id, label: c.label, value: c.spend }))
      .sort((a, b) => b.value - a.value);

    const outcomeNodes = [
      { id: 'revenue', label: 'Revenue', value: Math.max(0, totalSpend - estimatedWaste) },
      { id: 'waste', label: 'Est. Waste', value: estimatedWaste },
    ].filter(n => n.value > 0);

    const columns = [divNodes, agencyNodes, prodNodes, chanNodes, outcomeNodes];

    // ─── COMPUTE SVG HEIGHT ───
    const maxNodes = Math.max(...columns.map(c => c.length));
    const H = Math.max(480, TOP + 20 + maxNodes * 32 + (maxNodes - 1) * GAP);
    const availH = H - TOP - 20;

    // ─── LAYOUT NODES ───
    interface NL {
      id: string; label: string; value: number;
      x: number; y: number; w: number; h: number;
      color: string; usedLeft: number; usedRight: number;
    }

    const nodeMap: Record<string, NL> = {};

    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const colDef = COLS[c];
      const colTotal = col.reduce((s, n) => s + n.value, 0);
      if (colTotal === 0) continue;

      const gaps = Math.max(0, col.length - 1) * GAP;
      const usable = availH - gaps;

      let yy = TOP;
      for (const n of col) {
        const rawH = (n.value / colTotal) * usable;
        const h = Math.max(MIN_NODE_H, rawH);

        let color = colDef.color;
        if (n.id === 'revenue') color = '#5DCAA5';
        if (n.id === 'waste') color = '#EF9F27';

        nodeMap[n.id] = {
          id: n.id, label: n.label, value: n.value,
          x: colDef.x, y: yy, w: colDef.w, h,
          color, usedLeft: 0, usedRight: 0,
        };
        yy += h + GAP;
      }
    }

    // ─── COLUMN INDEX HELPER ───
    function colOf(id: string): number {
      if (id.startsWith('div-')) return 0;
      if (id.startsWith('agency-')) return 1;
      if (id.startsWith('prod-')) return 2;
      if (id.startsWith('ch-')) return 3;
      return 4;
    }

    // ─── FILTER AND GROUP FLOWS BY LAYER ───
    const validFlows = flows.filter(f => {
      if (f.value < MIN_FLOW) return false;
      if (!nodeMap[f.source] || !nodeMap[f.target]) return false;
      return true;
    });

    const layers: Record<number, typeof validFlows> = {};
    for (const f of validFlows) {
      const layer = colOf(f.source);
      if (!layers[layer]) layers[layer] = [];
      layers[layer].push(f);
    }

    // Sort within each layer by source Y then target Y
    for (const layerFlows of Object.values(layers)) {
      layerFlows.sort((a, b) => {
        const sa = nodeMap[a.source], sb = nodeMap[b.source];
        const ta = nodeMap[a.target], tb = nodeMap[b.target];
        const sy = (sa?.y ?? 0) - (sb?.y ?? 0);
        if (Math.abs(sy) > 0.5) return sy;
        return (ta?.y ?? 0) - (tb?.y ?? 0);
      });
    }

    // ─── BUILD PATHS ───
    interface FP {
      d: string; thickness: number;
      srcColor: string; tgtColor: string;
      sourceId: string; targetId: string;
      sx: number; tx: number;
    }

    const pathList: FP[] = [];

    for (let layer = 0; layer <= 4; layer++) {
      const lf = layers[layer];
      if (!lf) continue;

      for (const f of lf) {
        const src = nodeMap[f.source];
        const tgt = nodeMap[f.target];
        if (!src || !tgt) continue;

        const srcShare = src.value > 0 ? f.value / src.value : 0;
        const srcH = srcShare * src.h;

        const tgtShare = tgt.value > 0 ? f.value / tgt.value : 0;
        const tgtH = tgtShare * tgt.h;

        const thickness = Math.max(1.5, (srcH + tgtH) / 2);

        const sy = src.y + src.usedRight + srcH / 2;
        src.usedRight += srcH;

        const ty = tgt.y + tgt.usedLeft + tgtH / 2;
        tgt.usedLeft += tgtH;

        const sx = src.x + src.w;
        const tx = tgt.x;
        const mx = (sx + tx) / 2;

        pathList.push({
          d: `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`,
          thickness,
          srcColor: src.color,
          tgtColor: tgt.color,
          sourceId: f.source,
          targetId: f.target,
          sx, tx,
        });
      }
    }

    return { nodeMap, pathList, H, W, COLS, validFlows };
  }, [hasData, divisions, products, channels, totalSpend, estimatedWaste, flows, data.sankeyData.agencies]);

  // Hover: terminal-node-aware traversal
  const connectedNodes = useMemo(() => {
    if (!hoveredNode || !layout) return null;
    const connected = new Set<string>([hoveredNode]);
    const terminal = new Set(['revenue', 'waste']);
    let frontier = [hoveredNode];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const id of frontier) for (const f of layout.validFlows) {
        if (f.source === id && !connected.has(f.target)) { connected.add(f.target); if (!terminal.has(f.target)) next.push(f.target); }
      }
      frontier = next;
    }
    frontier = [hoveredNode];
    const visited = new Set([hoveredNode]);
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const id of frontier) for (const f of layout.validFlows) {
        if (f.target === id && !visited.has(f.source)) { connected.add(f.source); visited.add(f.source); next.push(f.source); }
      }
      frontier = next;
    }
    return connected;
  }, [hoveredNode, layout]);

  const onEnter = useCallback((id: string) => setHoveredNode(id), []);
  const onLeave = useCallback(() => setHoveredNode(null), []);

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Budget allocation flow</h3>
        <p className="text-xs text-muted-foreground">
          How {formatCurrency(totalSpend)} flows from divisions through agencies, products, and channels to revenue outcomes
        </p>
      </div>

      {!hasData || !layout ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No data available — adjust filter selections to broaden this view.</div>
      ) : (
        <svg viewBox={`0 0 ${layout.W} ${layout.H}`} width="100%" className="overflow-visible">
          <defs>
            {layout.pathList.map((p, i) => (
              <linearGradient key={`sg-${i}`} id={`sg-${i}`} gradientUnits="userSpaceOnUse" x1={p.sx} y1={0} x2={p.tx} y2={0}>
                <stop offset="0%" stopColor={p.srcColor} />
                <stop offset="100%" stopColor={p.tgtColor} />
              </linearGradient>
            ))}
          </defs>

          {['DIVISIONS', 'AGENCIES', 'PRODUCTS', 'CHANNELS', 'OUTCOME'].map((label, i) => (
            <text key={label} x={layout.COLS[i].x + layout.COLS[i].w + 6} y={14} textAnchor="start"
              className="fill-muted-foreground" style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.05em' }}>
              {label}
            </text>
          ))}

          {layout.pathList.map((p, i) => {
            const conn = connectedNodes ? (connectedNodes.has(p.sourceId) && connectedNodes.has(p.targetId)) : true;
            return <path key={`f-${i}`} d={p.d} fill="none" stroke={`url(#sg-${i})`}
              strokeWidth={p.thickness} opacity={connectedNodes ? (conn ? 0.45 : 0.02) : 0.22} />;
          })}

          {Object.values(layout.nodeMap).map(n => {
            const isOutcome = n.id === 'revenue' || n.id === 'waste';
            const nOp = connectedNodes ? (connectedNodes.has(n.id) ? 0.85 : 0.12) : 0.75;
            const tOp = connectedNodes ? (connectedNodes.has(n.id) ? 1 : 0.2) : 1;
            return (
              <g key={n.id} onMouseEnter={() => onEnter(n.id)} onMouseLeave={onLeave} style={{ cursor: 'pointer' }}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={3} fill={n.color} opacity={nOp} />
                <text x={isOutcome ? n.x - 6 : n.x + n.w + 6} y={n.y + Math.min(n.h / 2, 14)}
                  textAnchor={isOutcome ? 'end' : 'start'} dominantBaseline="middle"
                  className="fill-foreground" style={{ fontSize: 11, fontWeight: 500 }} opacity={tOp}>
                  {n.label.length > 18 ? n.label.slice(0, 16) + '...' : n.label}
                </text>
                <text x={isOutcome ? n.x - 6 : n.x + n.w + 6} y={n.y + Math.min(n.h / 2, 14) + 14}
                  textAnchor={isOutcome ? 'end' : 'start'} dominantBaseline="middle"
                  className="fill-muted-foreground" style={{ fontSize: 9 }} opacity={tOp}>
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
