"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart as PieChartIcon, Table2 } from "lucide-react";
import type { Campaign, AggregatedKPIs } from "@/types";
import { DIVISION_LABELS } from "@/types";
import { formatCurrency, formatKPIValue } from "@/lib/format";

interface CampaignOverviewChartProps {
  campaignData: Array<{ campaign: Campaign; kpis: AggregatedKPIs }>;
}

const CAMPAIGN_COLORS = [
  "#e07060",
  "#50b89a",
  "#6b8aad",
  "#8b7ec8",
  "#f0a050",
  "#c76be0",
  "#5ab8d0",
  "#d06090",
  "#70c070",
  "#b8a060",
  "#60a0d0",
  "#d0a070",
];

const MAX_CAMPAIGNS = 12;

export function CampaignOverviewChart({ campaignData }: CampaignOverviewChartProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const allActive = campaignData
    .filter((d) => d.campaign.status === "live")
    .sort((a, b) => b.kpis.spend - a.kpis.spend);

  const active = allActive.slice(0, MAX_CAMPAIGNS);
  const rest = allActive.slice(MAX_CAMPAIGNS);
  const restSpend = rest.reduce((s, d) => s + d.kpis.spend, 0);

  const totalSpend = allActive.reduce((s, d) => s + d.kpis.spend, 0);

  const pieData = active.map((d, i) => ({
    name: d.campaign.name,
    value: d.kpis.spend,
    color: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length],
  }));

  if (rest.length > 0) {
    pieData.push({ name: `Other (${rest.length})`, value: restSpend, color: "#555" });
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold tracking-wide">Active Campaigns</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border/40 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 ${viewMode === "chart" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("chart")}
            >
              <PieChartIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 ${viewMode === "table" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <Table2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {active.length} live
          </Badge>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mb-5">
        Spend distribution across active campaigns
      </p>

      {viewMode === "chart" ? (
        <div className="grid grid-cols-[180px_1fr] gap-6">
          {/* Pie chart */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 24, 28, 0.95)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "#e0e0e0",
                    padding: "10px 14px",
                  }}
                  formatter={(value) => [formatCurrency(value as number), "Spend"]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold">{formatCurrency(totalSpend)}</span>
              <span className="text-[10px] text-muted-foreground">Total Spend</span>
            </div>
          </div>

          {/* Campaign KPI table (compact, beside pie) */}
          <div className="overflow-auto max-h-[280px]">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border/30">
                  <th className="text-left pb-2 font-medium">Campaign</th>
                  <th className="text-right pb-2 font-medium">Spend</th>
                  <th className="text-right pb-2 font-medium">ROAS</th>
                  <th className="text-right pb-2 font-medium">CPA</th>
                  <th className="text-right pb-2 font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {active.map((d, i) => (
                  <tr
                    key={d.campaign.id}
                    className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length] }}
                        />
                        <span className="font-medium truncate max-w-[160px]">
                          {d.campaign.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground shrink-0">
                          {DIVISION_LABELS[d.campaign.division]}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-2 tabular-nums">
                      {formatCurrency(d.kpis.spend)}
                    </td>
                    <td className="text-right py-2 tabular-nums">
                      {formatKPIValue(d.kpis.roas, "decimal")}
                    </td>
                    <td className="text-right py-2 tabular-nums">
                      {formatCurrency(d.kpis.cpa)}
                    </td>
                    <td className="text-right py-2 tabular-nums">
                      {formatKPIValue(d.kpis.conversions, "number")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Full-width table view */
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border/30">
                <th className="text-left pb-2 font-medium">Campaign</th>
                <th className="text-left pb-2 font-medium">Division</th>
                <th className="text-right pb-2 font-medium">Spend</th>
                <th className="text-right pb-2 font-medium">% of Total</th>
                <th className="text-right pb-2 font-medium">ROAS</th>
                <th className="text-right pb-2 font-medium">CPA</th>
                <th className="text-right pb-2 font-medium">Conv.</th>
                <th className="text-right pb-2 font-medium">Impressions</th>
                <th className="text-right pb-2 font-medium">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {active.map((d, i) => (
                <tr
                  key={d.campaign.id}
                  className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length] }}
                      />
                      <span className="font-medium truncate max-w-[200px]">
                        {d.campaign.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {DIVISION_LABELS[d.campaign.division]}
                  </td>
                  <td className="text-right py-2.5 tabular-nums">
                    {formatCurrency(d.kpis.spend)}
                  </td>
                  <td className="text-right py-2.5 tabular-nums text-muted-foreground">
                    {totalSpend > 0 ? ((d.kpis.spend / totalSpend) * 100).toFixed(1) : "0.0"}%
                  </td>
                  <td className="text-right py-2.5 tabular-nums">
                    {formatKPIValue(d.kpis.roas, "decimal")}
                  </td>
                  <td className="text-right py-2.5 tabular-nums">
                    {formatCurrency(d.kpis.cpa)}
                  </td>
                  <td className="text-right py-2.5 tabular-nums">
                    {formatKPIValue(d.kpis.conversions, "number")}
                  </td>
                  <td className="text-right py-2.5 tabular-nums">
                    {formatKPIValue(d.kpis.impressions, "number")}
                  </td>
                  <td className="text-right py-2.5 tabular-nums">
                    {formatKPIValue(d.kpis.clicks, "number")}
                  </td>
                </tr>
              ))}
            </tbody>
            {rest.length > 0 && (
              <tfoot>
                <tr className="border-t border-border/40 text-muted-foreground">
                  <td className="py-2.5 pr-3 font-medium" colSpan={2}>
                    Other ({rest.length} campaigns)
                  </td>
                  <td className="text-right py-2.5 tabular-nums">{formatCurrency(restSpend)}</td>
                  <td className="text-right py-2.5 tabular-nums">
                    {totalSpend > 0 ? ((restSpend / totalSpend) * 100).toFixed(1) : "0.0"}%
                  </td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
