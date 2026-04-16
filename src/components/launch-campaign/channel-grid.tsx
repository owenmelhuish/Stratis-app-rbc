"use client";
import React from 'react';
import { Check, Lock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import {
  CHANNEL_LABELS,
  CHANNEL_COLORS,
  type ChannelId,
} from '@/types';
import { cn } from '@/lib/utils';
import { SectionCard } from './section-card';

const CHANNEL_IDS = Object.keys(CHANNEL_LABELS) as ChannelId[];

function distributeEvenly(ids: ChannelId[]): Partial<Record<ChannelId, number>> {
  if (ids.length === 0) return {};
  const base = Math.floor(100 / ids.length);
  const remainder = 100 - base * ids.length;
  const splits: Partial<Record<ChannelId, number>> = {};
  ids.forEach((id, i) => {
    splits[id] = base + (i < remainder ? 1 : 0);
  });
  return splits;
}

export function ChannelGrid() {
  const draft = useAppStore((s) => s.draftCampaign);
  const setField = useAppStore((s) => s.setDraftCampaignField);

  const toggleChannel = (id: ChannelId) => {
    const isRemoving = draft.channels.includes(id);
    const next = isRemoving
      ? draft.channels.filter((x) => x !== id)
      : [...draft.channels, id];
    setField('channels', next);
    setField('channelBudgetSplits', distributeEvenly(next));
  };

  // Dynamic slider: raising one channel proportionally shrinks the others so
  // the total is always <= 100%. If others are all at 0, the moved slider is
  // clamped to 100 instead of pulling from a zero pool.
  const setSplit = (id: ChannelId, rawValue: number) => {
    const newValue = Math.max(0, Math.min(100, rawValue));
    const others = draft.channels.filter((c) => c !== id);
    const othersTotal = others.reduce((sum, o) => sum + (draft.channelBudgetSplits[o] ?? 0), 0);
    const desiredTotal = newValue + othersTotal;

    const next: Partial<Record<ChannelId, number>> = { ...draft.channelBudgetSplits };

    if (desiredTotal <= 100) {
      next[id] = newValue;
    } else if (othersTotal === 0) {
      next[id] = 100;
    } else {
      const excess = desiredTotal - 100;
      let distributed = 0;
      others.forEach((o, i) => {
        const current = draft.channelBudgetSplits[o] ?? 0;
        const share = current / othersTotal;
        if (i === others.length - 1) {
          next[o] = Math.max(0, Math.round(current - (excess - distributed)));
        } else {
          const reduction = Math.round(share * excess);
          next[o] = Math.max(0, current - reduction);
          distributed += reduction;
        }
      });
      next[id] = newValue;
    }

    setField('channelBudgetSplits', next);
  };

  const rebalance = () => {
    setField('channelBudgetSplits', distributeEvenly(draft.channels));
  };

  const totalSplit = draft.channels.reduce((sum, id) => sum + (draft.channelBudgetSplits[id] ?? 0), 0);
  const remaining = Math.max(0, 100 - totalSplit);
  const filled = draft.channels.length > 0;

  return (
    <SectionCard
      id="channels"
      number={6}
      title="Channel Mix & Budget Allocation"
      subtitle="Pick surfaces and weight them. Total always stays within 100% — raising one channel shrinks the others."
      filled={filled}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {CHANNEL_IDS.map((id) => {
          const active = draft.channels.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleChannel(id)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-teal/50 bg-teal/10"
                  : "border-border/50 bg-card-elevated/30 hover:border-border"
              )}
            >
              <span
                className="h-8 w-8 rounded-lg shrink-0"
                style={{ backgroundColor: `${CHANNEL_COLORS[id]}22`, border: `1px solid ${CHANNEL_COLORS[id]}55` }}
              >
                <span
                  className="block h-full w-full rounded-lg"
                  style={{ backgroundColor: CHANNEL_COLORS[id], opacity: active ? 1 : 0.5 }}
                />
              </span>
              <span className="flex-1">
                <span
                  className={cn(
                    "block text-[13px] font-medium",
                    active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {CHANNEL_LABELS[id]}
                </span>
                {active && draft.channelBudgetSplits[id] !== undefined && (
                  <span className="block text-[11px] text-teal/80 tabular-nums">
                    {draft.channelBudgetSplits[id]}% of budget
                  </span>
                )}
              </span>
              {active && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {draft.channels.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/30">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-[12px] text-muted-foreground">Budget Allocation</Label>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 text-teal border border-teal/20 px-2 py-0.5 text-[10px] font-semibold">
                <Lock className="h-2.5 w-2.5" />
                Capped at 100%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  totalSplit === 100 ? "text-teal" : "text-muted-foreground/80"
                )}
              >
                {totalSplit}% allocated
                {remaining > 0 && (
                  <span className="text-muted-foreground/60"> · {remaining}% unassigned</span>
                )}
              </span>
              <button
                type="button"
                onClick={rebalance}
                className="text-[11px] text-teal hover:underline underline-offset-2"
              >
                Rebalance evenly
              </button>
            </div>
          </div>
          {/* Allocation bar */}
          <div className="flex h-2 w-full rounded-full bg-border/30 overflow-hidden">
            {draft.channels.map((id) => {
              const pct = draft.channelBudgetSplits[id] ?? 0;
              if (pct === 0) return null;
              return (
                <div
                  key={id}
                  title={`${CHANNEL_LABELS[id]} · ${pct}%`}
                  className="h-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: CHANNEL_COLORS[id] }}
                />
              );
            })}
          </div>

          <div className="space-y-2.5 pt-1">
            {draft.channels.map((id) => {
              const value = draft.channelBudgetSplits[id] ?? 0;
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="flex items-center gap-2 w-36 shrink-0">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: CHANNEL_COLORS[id] }}
                    />
                    <span className="text-[12px] text-foreground truncate">{CHANNEL_LABELS[id]}</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={value}
                    onChange={(e) => setSplit(id, Number(e.target.value))}
                    className="flex-1 accent-[var(--teal)]"
                  />
                  <span className="w-11 text-right text-[12px] tabular-nums text-muted-foreground">
                    {value}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
