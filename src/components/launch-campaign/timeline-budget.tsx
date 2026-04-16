"use client";
import React from 'react';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PacingPreference } from '@/types';
import { SectionCard } from './section-card';
import { SegmentedGroup } from './segmented-group';

const PACING_OPTIONS: Array<{ value: PacingPreference; label: string; hint: string }> = [
  { value: 'even', label: 'Even', hint: 'Flat spend across flight' },
  { value: 'front-loaded', label: 'Front-loaded', hint: 'Launch punch, then taper' },
  { value: 'back-loaded', label: 'Back-loaded', hint: 'Build toward climax' },
];

function formatCurrency(raw: string): string {
  const digits = raw.replace(/[^0-9.]/g, '');
  if (!digits) return '';
  const num = Number(digits);
  if (Number.isNaN(num)) return digits;
  return num.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
}

export function TimelineBudget() {
  const draft = useAppStore((s) => s.draftCampaign);
  const setField = useAppStore((s) => s.setDraftCampaignField);

  const filled = Boolean(draft.startDate && draft.plannedBudget && Number(draft.plannedBudget.replace(/[^0-9.]/g, '')) > 0);

  return (
    <SectionCard
      id="timeline-budget"
      number={5}
      title="Timeline & Budget"
      subtitle="The envelope STRATIS has to work inside."
      filled={filled}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="start-date" className="text-[12px] text-muted-foreground">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={draft.startDate}
            onChange={(e) => setField('startDate', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date" className="text-[12px] text-muted-foreground">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={draft.endDate}
            onChange={(e) => setField('endDate', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget" className="text-[12px] text-muted-foreground">Planned Budget (CAD)</Label>
          <Input
            id="budget"
            inputMode="decimal"
            placeholder="$0"
            value={draft.plannedBudget}
            onChange={(e) => setField('plannedBudget', e.target.value)}
            onBlur={(e) => setField('plannedBudget', formatCurrency(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[12px] text-muted-foreground">Pacing Preference</Label>
        <SegmentedGroup<PacingPreference>
          value={draft.pacing}
          onChange={(v) => setField('pacing', v)}
          options={PACING_OPTIONS}
          columns={3}
        />
      </div>
    </SectionCard>
  );
}
