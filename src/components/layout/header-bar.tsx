"use client";
import React, { useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import {
  DIVISION_LABELS, AGENCY_LABELS, PRODUCT_LINE_LABELS, AUDIENCE_LABELS, GEO_LABELS,
  CHANNEL_LABELS, FUNNEL_LABELS,
  type DivisionId, type AgencyId, type ProductLineId, type AudienceId, type GeoId,
  type ChannelId, type DateRangePreset, type FunnelStage,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, ChevronDown, SlidersHorizontal, GitCompareArrows, User, MapPin, Radio, Megaphone, Building2, Briefcase, Users, Globe, Atom } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateAllData } from '@/lib/mock-data';

const DATE_PILLS: { value: DateRangePreset; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '7d', label: '7D' },
  { value: '14d', label: '14D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'ytd', label: 'YTD' },
];

function MultiSelectFilter({
  label, icon: Icon, allItems, selectedItems, onToggle, onClear, popoverWidth,
}: {
  label: string; icon: React.ComponentType<{ className?: string }>;
  allItems: Record<string, string>; selectedItems: string[];
  onToggle: (id: string) => void; onClear: () => void;
  popoverWidth?: string;
}) {
  const count = selectedItems.length;
  const allKeys = Object.keys(allItems);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 border-border bg-transparent text-muted-foreground hover:text-foreground gap-1.5 text-xs">
          <Icon className="h-3 w-3" />
          {label}
          {count > 0 && count < allKeys.length && (
            <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] px-1 text-[10px] bg-orange/15 text-orange border-0">{count}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-52 p-3", popoverWidth)} align="start">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium">{label}</p>
          {count > 0 && <button onClick={onClear} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>}
        </div>
        <Separator className="mb-2" />
        <div className="space-y-1.5 max-h-48 overflow-auto">
          {allKeys.map((key) => (
            <label key={key} className="flex items-center gap-2.5 py-1 px-1 rounded hover:bg-muted/50 cursor-pointer">
              <Checkbox checked={selectedItems.includes(key)} onCheckedChange={() => onToggle(key)} className="h-3.5 w-3.5" />
              <span className="text-xs">{allItems[key]}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function HeaderBar() {
  const {
    role, setRole, dateRange, setDatePreset, compareEnabled, toggleCompare,
    selectedDivisions, setSelectedDivisions, selectedAgencies, setSelectedAgencies,
    selectedProductLines, setSelectedProductLines, selectedAudiences, setSelectedAudiences,
    selectedGeos, setSelectedGeos,
    selectedChannels, setSelectedChannels, selectedCampaigns, setSelectedCampaigns,
    attributionModel, setAttributionModel,
    selectedDivision, selectedProductLine, selectedCampaign,
    setSelectedDivision, setSelectedProductLine, setSelectedCampaign,
    selectedFunnel, setFunnel,
    molecularFilterOpen, setMolecularFilterOpen, molecularSelections,
  } = useAppStore();

  const store = useMemo(() => generateAllData(), []);

  // Campaigns available based on selected filters
  const availableCampaigns = useMemo(() => {
    let camps = store.campaigns;
    if (selectedDivisions.length > 0) camps = camps.filter(c => selectedDivisions.includes(c.division));
    if (selectedGeos.length > 0) camps = camps.filter(c => c.geos.some(g => selectedGeos.includes(g)));
    if (selectedAgencies.length > 0) camps = camps.filter(c => selectedAgencies.includes(c.agency));
    if (selectedProductLines.length > 0) camps = camps.filter(c => selectedProductLines.includes(c.productLine));
    if (selectedAudiences.length > 0) camps = camps.filter(c => c.audiences.some(a => selectedAudiences.includes(a)));
    return camps;
  }, [store, selectedDivisions, selectedGeos, selectedAgencies, selectedProductLines, selectedAudiences]);

  const campaignItems = useMemo(() => {
    const items: Record<string, string> = {};
    for (const c of availableCampaigns) {
      items[c.id] = c.name;
    }
    return items;
  }, [availableCampaigns]);

  const availableChannels = useMemo(() => {
    if (selectedCampaigns.length === 0) {
      return CHANNEL_LABELS as unknown as Record<string, string>;
    }
    const camps = store.campaigns.filter(c => selectedCampaigns.includes(c.id));
    const channelSet = new Set<ChannelId>();
    for (const c of camps) {
      for (const ch of c.channels) channelSet.add(ch);
    }
    const items: Record<string, string> = {};
    for (const ch of channelSet) {
      items[ch] = (CHANNEL_LABELS as Record<string, string>)[ch];
    }
    return items;
  }, [store, selectedCampaigns]);

  // Prune stale campaign selections
  useEffect(() => {
    if (selectedCampaigns.length === 0) return;
    const validIds = new Set(availableCampaigns.map(c => c.id));
    const pruned = selectedCampaigns.filter(id => validIds.has(id));
    if (pruned.length !== selectedCampaigns.length) {
      setSelectedCampaigns(pruned);
    }
  }, [availableCampaigns, selectedCampaigns, setSelectedCampaigns]);

  // Prune stale channel selections
  useEffect(() => {
    if (selectedChannels.length === 0) return;
    const validChannels = new Set(Object.keys(availableChannels));
    const pruned = selectedChannels.filter(ch => validChannels.has(ch));
    if (pruned.length !== selectedChannels.length) {
      setSelectedChannels(pruned as ChannelId[]);
    }
  }, [availableChannels, selectedChannels, setSelectedChannels]);

  const viewLevel = selectedCampaign ? 'campaign' : selectedProductLine ? 'product' : selectedDivision ? 'division' : 'brand';
  const viewLabel = viewLevel === 'campaign' ? 'Campaign View' : viewLevel === 'product' ? 'Product View' : viewLevel === 'division' ? 'Division View' : 'Brand View';

  const toggleItem = <T extends string>(list: T[], item: T, setter: (v: T[]) => void) => {
    setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  };

  return (
    <header className="shrink-0 border-b border-border/30 bg-background/60 backdrop-blur-md">
      <div className="flex items-center justify-between px-8 h-12">
        <div className="flex items-center gap-1.5 min-w-0">
          <button onClick={() => { setSelectedDivision(null); setSelectedProductLine(null); setSelectedCampaign(null); }} className="text-sm font-semibold text-foreground hover:text-teal transition-colors">
            RBC
          </button>
          {selectedDivision && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <button onClick={() => { setSelectedProductLine(null); setSelectedCampaign(null); }} className="text-sm font-medium text-foreground hover:text-teal transition-colors truncate">
                {DIVISION_LABELS[selectedDivision]}
              </button>
            </>
          )}
          {selectedProductLine && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <button onClick={() => setSelectedCampaign(null)} className="text-sm font-medium text-foreground hover:text-teal transition-colors truncate">
                {PRODUCT_LINE_LABELS[selectedProductLine]}
              </button>
            </>
          )}
          {selectedCampaign && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">{store.campaigns.find(c => c.id === selectedCampaign)?.name ?? selectedCampaign}</span>
            </>
          )}
          <Badge variant="outline" className="ml-2 text-[10px] font-medium border-border text-muted-foreground shrink-0">{viewLabel}</Badge>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-[11px] text-muted-foreground whitespace-nowrap">
              {role === 'agency' ? 'Agency Operator' : 'Brand Exec'}
            </Label>
            <Switch checked={role === 'exec'} onCheckedChange={(c) => setRole(c ? 'exec' : 'agency')} className="data-[state=checked]:bg-teal" />
          </div>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex items-center gap-0.5 rounded-lg bg-muted/30 p-0.5">
            {DATE_PILLS.map((p) => (
              <button
                key={p.value}
                onClick={() => setDatePreset(p.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                  dateRange.preset === p.value
                    ? "bg-card-elevated text-teal"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-[11px] text-muted-foreground">Compare</Label>
            <Switch checked={compareEnabled} onCheckedChange={toggleCompare} className="data-[state=checked]:bg-teal" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-8 h-9 border-t border-border/20">
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground mr-1" />

        <div className="flex items-center gap-0.5 rounded-lg bg-muted/30 p-0.5">
          {(Object.entries(FUNNEL_LABELS) as [FunnelStage, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFunnel(value)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap",
                selectedFunnel === value
                  ? "bg-card-elevated text-teal"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {value === 'all' ? 'All' : label.replace(' Funnel', '')}
            </button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-5" />

        <MultiSelectFilter label="Division" icon={Building2} allItems={DIVISION_LABELS as unknown as Record<string, string>} selectedItems={selectedDivisions} onToggle={(id) => toggleItem(selectedDivisions, id as DivisionId, setSelectedDivisions)} onClear={() => setSelectedDivisions([])} />
        <MultiSelectFilter label="Agency" icon={Briefcase} allItems={AGENCY_LABELS as unknown as Record<string, string>} selectedItems={selectedAgencies} onToggle={(id) => toggleItem(selectedAgencies, id as AgencyId, setSelectedAgencies)} onClear={() => setSelectedAgencies([])} />
        <MultiSelectFilter label="Product" icon={Megaphone} allItems={PRODUCT_LINE_LABELS as unknown as Record<string, string>} selectedItems={selectedProductLines} onToggle={(id) => toggleItem(selectedProductLines, id as ProductLineId, setSelectedProductLines)} onClear={() => setSelectedProductLines([])} popoverWidth="w-72" />
        <MultiSelectFilter label="Audience" icon={Users} allItems={AUDIENCE_LABELS as unknown as Record<string, string>} selectedItems={selectedAudiences} onToggle={(id) => toggleItem(selectedAudiences, id as AudienceId, setSelectedAudiences)} onClear={() => setSelectedAudiences([])} />
        <MultiSelectFilter label="Geography" icon={Globe} allItems={GEO_LABELS as unknown as Record<string, string>} selectedItems={selectedGeos} onToggle={(id) => toggleItem(selectedGeos, id as GeoId, setSelectedGeos)} onClear={() => setSelectedGeos([])} />
        <MultiSelectFilter label="Campaign" icon={MapPin} allItems={campaignItems} selectedItems={selectedCampaigns} onToggle={(id) => toggleItem(selectedCampaigns, id, setSelectedCampaigns)} onClear={() => setSelectedCampaigns([])} popoverWidth="w-72" />
        <MultiSelectFilter label="Channel" icon={Radio} allItems={availableChannels} selectedItems={selectedChannels} onToggle={(id) => toggleItem(selectedChannels, id as ChannelId, setSelectedChannels)} onClear={() => setSelectedChannels([])} />

        <Separator orientation="vertical" className="h-5" />

        <Button
          variant="outline"
          size="sm"
          className="h-7 border-teal/30 bg-teal/10 text-teal hover:bg-teal/20 gap-1.5 text-xs"
          onClick={() => setMolecularFilterOpen(true)}
        >
          <Atom className="h-3 w-3" />
          Filter Data
        </Button>
        {molecularSelections.length > 0 && (
          <Badge className="bg-teal/15 text-teal text-[10px] border-0">
            {molecularSelections.length} molecular filters
          </Badge>
        )}

        <Select value={attributionModel} onValueChange={(v) => setAttributionModel(v as typeof attributionModel)}>
          <SelectTrigger className="h-7 w-[140px] text-xs border-border bg-transparent text-muted-foreground ml-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-click" className="text-xs">Last Click</SelectItem>
            <SelectItem value="first-click" className="text-xs">First Click</SelectItem>
            <SelectItem value="linear" className="text-xs">Linear</SelectItem>
            <SelectItem value="data-driven" className="text-xs">Data-Driven</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
