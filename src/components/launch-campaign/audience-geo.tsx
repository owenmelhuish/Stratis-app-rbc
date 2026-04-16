"use client";
import React from 'react';
import { useAppStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import {
  AUDIENCE_LABELS,
  GEO_LABELS,
  type AudienceId,
  type GeoId,
} from '@/types';
import { cn } from '@/lib/utils';
import { SectionCard } from './section-card';

const AUDIENCE_IDS = Object.keys(AUDIENCE_LABELS) as AudienceId[];
const GEO_IDS = Object.keys(GEO_LABELS) as GeoId[];

interface ChipGroupProps<T extends string> {
  items: T[];
  labelMap: Record<T, string>;
  selected: T[];
  onToggle: (id: T) => void;
}

function ChipGroup<T extends string>({ items, labelMap, selected, onToggle }: ChipGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((id) => {
        const active = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
              active
                ? "border-teal/50 bg-teal/15 text-teal"
                : "border-border/50 bg-card-elevated/30 text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {labelMap[id]}
          </button>
        );
      })}
    </div>
  );
}

export function AudienceGeo() {
  const draft = useAppStore((s) => s.draftCampaign);
  const setField = useAppStore((s) => s.setDraftCampaignField);

  const toggleAudience = (id: AudienceId) => {
    const next = draft.audiences.includes(id)
      ? draft.audiences.filter((x) => x !== id)
      : [...draft.audiences, id];
    setField('audiences', next);
  };

  const toggleGeo = (id: GeoId) => {
    const next = draft.geos.includes(id)
      ? draft.geos.filter((x) => x !== id)
      : [...draft.geos, id];
    setField('geos', next);
  };

  const filled = draft.audiences.length > 0 && draft.geos.length > 0;

  return (
    <SectionCard
      id="audience-geo"
      number={4}
      title="Audience & Geography"
      subtitle="Who should this reach, and where? STRATIS weights channel mix by audience-geo fit."
      filled={filled}
    >
      <div className="space-y-2">
        <Label className="text-[12px] text-muted-foreground">Target Audiences</Label>
        <ChipGroup
          items={AUDIENCE_IDS}
          labelMap={AUDIENCE_LABELS}
          selected={draft.audiences}
          onToggle={toggleAudience}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[12px] text-muted-foreground">Geographies</Label>
        <ChipGroup
          items={GEO_IDS}
          labelMap={GEO_LABELS}
          selected={draft.geos}
          onToggle={toggleGeo}
        />
      </div>
    </SectionCard>
  );
}
