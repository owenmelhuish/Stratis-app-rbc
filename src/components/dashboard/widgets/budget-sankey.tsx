"use client";
import React, { useMemo, useState, useCallback } from 'react';
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
  midY: number; claimed: number;
}

interface FlowPath {
  d: string; thickness: number; sourceColor: string; targetColor: string;
  sourceId: string; targetId: string;
}

interface Props {
  data: DashboardData;
}

export function BudgetSankey({ data }: Props) {
  const { divisions, products, channels, revenue, estimatedWaste, flows } = data.sankeyData;
  const hasData = divisions.filter(d => d.spend > 0).length >= 2;
  const totalSpend = divisions.reduce((s, d) => s + d.spend, 0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const layout = useMemo(() => {
    if (!hasData) return null;

    const W = 880;
    const TOP = 36;
    const BOT = 16;
    const colPositions = [
      { x: 30, w: 14 },
      { x: 240, w: 12 },
      { x: 480, w: 12 },
      { x: 720, w: 14 },
    ];
    const GAP = 6;
    const minFlowThreshold = totalSpend * 0.01;

    // Sort divisions by spend desc
    const sortedDivisions = [...divisions].filter(d => d.spend > 0).sort((a, b) => b.spend - a.spend);
    const divisionOrder = sortedDivisions.map(d => d.id);

    // Sort products: group by division, then by spend within each group
    const sortedProducts = [...products].filter(p => p.spend > 0).sort((a, b) => {
      const divIdxA = divisionOrder.indexOf(`div-${a.divisionId}`);
      const divIdxB = divisionOrder.indexOf(`div-${b.divisionId}`);
      if (divIdxA !== divIdxB) return divIdxA - divIdxB;
      return b.spend - a.spend;
    });

    // Build columns (divisions and products sorted, channels sorted later)
    const outcomeNodes = [
      { id: 'revenue', label: 'Revenue', value: totalSpend - estimatedWaste },
      { id: 'waste', label: 'Est. Waste', value: estimatedWaste },
    ].filter(n => n.value > 0);

    const colDivs = sortedDivisions.map(d => ({ id: d.id, label: d.label, value: d.spend }));
    const colProds = sortedProducts.map(p => ({ id: p.id, label: p.label, value: p.spend }));

    // Position divisions and products first
    const nodeMap = new Map<string, NodeLayout>();
    const maxNodes = Math.max(colDivs.length, colProds.length, channels.filter(c => c.spend > 0).length, outcomeNodes.length);
    const H = Math.max(420, TOP + BOT + maxNodes * 28 + (maxNodes - 1) * GAP + 60);
    const availH = H - TOP - BOT;

    function layoutColumn(nodes: Array<{ id: string; label: string; value: number }>, colIdx: number) {
      const colTotal = nodes.reduce((s, n) => s + n.value, 0);
      const totalGap = (nodes.length - 1) * GAP;
      const usableH = availH - totalGap;
      let cy = TOP;
      for (const n of nodes) {
        const h = Math.max(18, (n.value / colTotal) * usableH);
        const midY = cy + h / 2;
        nodeMap.set(n.id, {
          id: n.id, label: n.label, value: n.value,
          x: colPositions[colIdx].x, y: cy, width: colPositions[colIdx].w, height: h,
          midY, claimed: 0,
        });
        cy += h + GAP;
      }
    }

    layoutColumn(colDivs, 0);
    layoutColumn(colProds, 1);

    // Sort channels by center of gravity relative to products
    const channelGravity: Record<string, number> = {};
    const channelFlowTotal: Record<string, number> = {};
    for (const f of flows) {
      if (f.source.startsWith('prod-') && f.target.startsWith('ch-')) {
        const src = nodeMap.get(f.source);
        if (src) {
          channelGravity[f.target] = (channelGravity[f.target] || 0) + src.midY * f.value;
          channelFlowTotal[f.target] = (channelFlowTotal[f.target] || 0) + f.value;
        }
      }
    }
    for (const ch of channels) {
      if (channelFlowTotal[ch.id] && channelFlowTotal[ch.id] > 0) {
        channelGravity[ch.id] = channelGravity[ch.id] / channelFlowTotal[ch.id];
      }
    }
    const sortedChannels = [...channels].filter(c => c.spend > 0).sort((a, b) =>
      (channelGravity[a.id] || 0) - (channelGravity[b.id] || 0)
    );

    layoutColumn(sortedChannels.map(c => ({ id: c.id, label: c.label, value: c.spend })), 2);
    layoutColumn(outcomeNodes.sort((a, b) => b.value - a.value), 3);

    // Filter small flows and build paths
    const visibleFlows = flows.filter(f => f.value >= minFlowThreshold);
    const sortedFlows = [...visibleFlows].sort((a, b) => b.value - a.value);

    const paths: FlowPath[] = [];
    for (const f of sortedFlows) {
      const src = nodeMap.get(f.source);
      const tgt = nodeMap.get(f.target);
      if (!src || !tgt) continue;

      const thickness = Math.max(2, (f.value / (totalSpend || 1)) * availH);
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
        sourceId: f.source,
        targetId: f.target,
      });
    }

    return { nodeMap, paths, H, W, visibleFlows };
  }, [hasData, divisions, products, channels, totalSpend, estimatedWaste, flows]);

  // Hover: trace upstream + downstream, treating revenue/waste as terminal (don't traverse through them)
  const connectedNodes = useMemo(() => {
    if (!hoveredNode || !layout) return null;
    const connected = new Set<string>([hoveredNode]);
    const terminalNodes = new Set(['revenue', 'waste']);
    // Forward (source → target)
    let frontier = [hoveredNode];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const f of layout.visibleFlows) {
          if (f.source === id && !connected.has(f.target)) {
            connected.add(f.target);
            if (!terminalNodes.has(f.target)) next.push(f.target);
          }
        }
      }
      frontier = next;
    }
    // Backward (target → source)
    frontier = [hoveredNode];
    const visited = new Set([hoveredNode]);
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const f of layout.visibleFlows) {
          if (f.target === id && !visited.has(f.source)) {
            connected.add(f.source);
            visited.add(f.source);
            next.push(f.source);
          }
        }
      }
      frontier = next;
    }
    return connected;
  }, [hoveredNode, layout]);

  const handleNodeEnter = useCallback((id: string) => setHoveredNode(id), []);
  const handleNodeLeave = useCallback(() => setHoveredNode(null), []);

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
          <defs>
            {layout.paths.map((p, i) => (
              <linearGradient key={i} id={`sg-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={p.sourceColor} />
                <stop offset="100%" stopColor={p.targetColor} />
              </linearGradient>
            ))}
          </defs>

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
          {layout.paths.map((p, i) => {
            const isConnected = connectedNodes ? (connectedNodes.has(p.sourceId) && connectedNodes.has(p.targetId)) : true;
            const opacity = connectedNodes ? (isConnected ? 0.4 : 0.02) : 0.2;
            return (
              <path key={i} d={p.d} fill="none" stroke={`url(#sg-${i})`} strokeWidth={p.thickness} opacity={opacity} />
            );
          })}

          {/* Nodes */}
          {Array.from(layout.nodeMap.values()).map(n => {
            const color = nodeColor(n.id);
            const isRightCol = n.x >= 700;
            const nodeOpacity = connectedNodes ? (connectedNodes.has(n.id) ? 0.85 : 0.12) : 0.7;
            return (
              <g
                key={n.id}
                onMouseEnter={() => handleNodeEnter(n.id)}
                onMouseLeave={handleNodeLeave}
                style={{ cursor: 'pointer' }}
              >
                <rect x={n.x} y={n.y} width={n.width} height={n.height} rx={3} fill={color} opacity={nodeOpacity} />
                <text
                  x={isRightCol ? n.x - 6 : n.x + n.width + 6}
                  y={n.y + Math.min(n.height / 2, 12)}
                  textAnchor={isRightCol ? 'end' : 'start'}
                  dominantBaseline="middle"
                  className="fill-foreground"
                  style={{ fontSize: 11, fontWeight: 500 }}
                  opacity={connectedNodes ? (connectedNodes.has(n.id) ? 1 : 0.2) : 1}
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
                  opacity={connectedNodes ? (connectedNodes.has(n.id) ? 1 : 0.15) : 1}
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
