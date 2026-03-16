"use client";
import React, { useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { REGION_LABELS, CHANNEL_LABELS, FUNNEL_LABELS, type RegionId, type ChannelId, type DateRangePreset, type FunnelStage } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, ChevronDown, SlidersHorizontal, GitCompareArrows, User, MapPin, Radio, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATE_NAMES } from '@/lib/geo';
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
  label: string; icon: React.ElementType;
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

/** Region → Province[] map — all Canadian provinces belong to north-america */
const REGION_COUNTRIES: Record<RegionId, { code: string; name: string }[]> = (() => {
  const map: Record<string, { code: string; name: string }[]> = {};
  for (const regionId of Object.keys(REGION_LABELS)) {
    map[regionId] = [];
  }
  for (const [code, name] of Object.entries(STATE_NAMES)) {
    map['north-america']?.push({ code, name });
  }
  // Sort provinces alphabetically
  for (const list of Object.values(map)) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  return map as Record<RegionId, { code: string; name: string }[]>;
})();

function RegionCountryFilter({
  selectedRegions, selectedCountries,
  onToggleRegion, onToggleCountry,
  onClearAll,
}: {
  selectedRegions: RegionId[];
  selectedCountries: string[];
  onToggleRegion: (id: RegionId) => void;
  onToggleCountry: (code: string) => void;
  onClearAll: () => void;
}) {
  const badgeCount = selectedRegions.length + selectedCountries.length;
  const allRegionKeys = Object.keys(REGION_LABELS) as RegionId[];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 border-border bg-transparent text-muted-foreground hover:text-foreground gap-1.5 text-xs">
          <MapPin className="h-3 w-3" />
          Region
          {badgeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] px-1 text-[10px] bg-orange/15 text-orange border-0">{badgeCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium">Region &amp; Country</p>
          {badgeCount > 0 && <button onClick={onClearAll} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>}
        </div>
        <Separator className="mb-2" />
        <div className="space-y-0.5 max-h-72 overflow-auto">
          {allRegionKeys.map((regionId) => {
            const isRegionSelected = selectedRegions.includes(regionId);
            const countries = REGION_COUNTRIES[regionId];
            const regionCountryCodes = countries.map(c => c.code);
            const selectedInRegion = selectedCountries.filter(c => regionCountryCodes.includes(c));

            return (
              <div key={regionId}>
                {/* Region row */}
                <label className="flex items-center gap-2.5 py-1 px-1 rounded hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={isRegionSelected}
                    onCheckedChange={() => onToggleRegion(regionId)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs font-medium flex-1">{REGION_LABELS[regionId]}</span>
                  {isRegionSelected && (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </label>

                {/* Country sub-list (visible when region is checked) */}
                {isRegionSelected && (
                  <div className="ml-5 border-l border-border/40 pl-2 mt-0.5 mb-1">
                    <div className="flex items-center justify-between mb-0.5 px-1">
                      <span className="text-[10px] text-muted-foreground">
                        {selectedInRegion.length === 0 ? 'All provinces' : `${selectedInRegion.length} selected`}
                      </span>
                      {selectedInRegion.length > 0 && selectedInRegion.length < countries.length && (
                        <button
                          onClick={() => {
                            // Select all countries in this region
                            const toAdd = regionCountryCodes.filter(c => !selectedCountries.includes(c));
                            if (toAdd.length > 0) {
                              for (const c of toAdd) onToggleCountry(c);
                            }
                          }}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          All
                        </button>
                      )}
                      {selectedInRegion.length > 0 && (
                        <button
                          onClick={() => {
                            for (const c of selectedInRegion) onToggleCountry(c);
                          }}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {countries.map((country) => (
                      <label key={country.code} className="flex items-center gap-2.5 py-0.5 px-1 rounded hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={selectedCountries.includes(country.code)}
                          onCheckedChange={() => onToggleCountry(country.code)}
                          className="h-3 w-3"
                        />
                        <span className="text-[11px]">{country.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function HeaderBar() {
  const {
    role, setRole, dateRange, setDatePreset, compareEnabled, toggleCompare,
    selectedRegions, setSelectedRegions, selectedCountries, setSelectedCountries,
    selectedChannels, setSelectedChannels, selectedCampaigns, setSelectedCampaigns,
    attributionModel, setAttributionModel,
    selectedRegion, selectedCampaign, setSelectedRegion, setSelectedCampaign,
    selectedFunnel, setFunnel,
  } = useAppStore();

  const store = useMemo(() => generateAllData(), []);

  // States available based on selected regions
  const availableCountries = useMemo(() => {
    const items: Record<string, string> = {};
    for (const [code, name] of Object.entries(STATE_NAMES)) {
      if (selectedRegions.length > 0) {
        // All states belong to north-america
        if (!selectedRegions.includes('north-america')) continue;
      }
      items[code] = name;
    }
    return items;
  }, [selectedRegions]);

  // Campaigns available based on selected regions + countries
  const availableCampaigns = useMemo(() => {
    let camps = store.campaigns;
    if (selectedRegions.length > 0) {
      camps = camps.filter(c => selectedRegions.includes(c.region));
    }
    if (selectedCountries.length > 0) {
      const countrySet = new Set(selectedCountries);
      camps = camps.filter(c => c.countries.some(cc => countrySet.has(cc)));
    }
    return camps;
  }, [store, selectedRegions, selectedCountries]);

  // Label map for campaign multi-select
  const campaignItems = useMemo(() => {
    const items: Record<string, string> = {};
    for (const c of availableCampaigns) {
      items[c.id] = c.name;
    }
    return items;
  }, [availableCampaigns]);

  // Channels available based on selected campaigns
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

  // Prune stale country selections when regions change
  useEffect(() => {
    if (selectedCountries.length === 0) return;
    const validCodes = new Set(Object.keys(availableCountries));
    const pruned = selectedCountries.filter(code => validCodes.has(code));
    if (pruned.length !== selectedCountries.length) {
      setSelectedCountries(pruned);
    }
  }, [availableCountries, selectedCountries, setSelectedCountries]);

  // Prune stale campaign selections when regions/countries change
  useEffect(() => {
    if (selectedCampaigns.length === 0) return;
    const validIds = new Set(availableCampaigns.map(c => c.id));
    const pruned = selectedCampaigns.filter(id => validIds.has(id));
    if (pruned.length !== selectedCampaigns.length) {
      setSelectedCampaigns(pruned);
    }
  }, [availableCampaigns, selectedCampaigns, setSelectedCampaigns]);

  // Prune stale channel selections when campaigns change
  useEffect(() => {
    if (selectedChannels.length === 0) return;
    const validChannels = new Set(Object.keys(availableChannels));
    const pruned = selectedChannels.filter(ch => validChannels.has(ch));
    if (pruned.length !== selectedChannels.length) {
      setSelectedChannels(pruned as ChannelId[]);
    }
  }, [availableChannels, selectedChannels, setSelectedChannels]);

  const viewLevel = selectedCampaign ? 'campaign' : selectedRegion ? 'region' : 'brand';
  const viewLabel = viewLevel === 'campaign' ? 'Campaign View' : viewLevel === 'region' ? 'Region View' : 'Brand View';

  const toggleRegion = (id: string) => {
    const r = id as RegionId;
    if (selectedRegions.includes(r)) {
      setSelectedRegions(selectedRegions.filter(x => x !== r));
      // Clear any country selections belonging to this region
      const regionCodes = new Set(REGION_COUNTRIES[r].map(c => c.code));
      const pruned = selectedCountries.filter(c => !regionCodes.has(c));
      if (pruned.length !== selectedCountries.length) {
        setSelectedCountries(pruned);
      }
    } else {
      setSelectedRegions([...selectedRegions, r]);
    }
  };

  const toggleCountry = (id: string) => {
    setSelectedCountries(selectedCountries.includes(id) ? selectedCountries.filter(x => x !== id) : [...selectedCountries, id]);
  };

  const toggleCampaign = (id: string) => {
    setSelectedCampaigns(selectedCampaigns.includes(id) ? selectedCampaigns.filter(x => x !== id) : [...selectedCampaigns, id]);
  };

  const toggleChannel = (id: string) => {
    const c = id as ChannelId;
    setSelectedChannels(selectedChannels.includes(c) ? selectedChannels.filter(x => x !== c) : [...selectedChannels, c]);
  };

  return (
    <header className="shrink-0 border-b border-border/30 bg-background/60 backdrop-blur-md">
      <div className="flex items-center justify-between px-8 h-12">
        <div className="flex items-center gap-1.5 min-w-0">
          <button onClick={() => { setSelectedRegion(null); setSelectedCampaign(null); }} className="text-sm font-semibold text-foreground hover:text-teal transition-colors">
            Pizza Pizza
          </button>
          {selectedRegion && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <button onClick={() => setSelectedCampaign(null)} className="text-sm font-medium text-foreground hover:text-teal transition-colors truncate">
                {REGION_LABELS[selectedRegion]}
              </button>
            </>
          )}
          {selectedCampaign && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">{selectedCampaign}</span>
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

          {/* Pill date selector */}
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

        <RegionCountryFilter
          selectedRegions={selectedRegions}
          selectedCountries={selectedCountries}
          onToggleRegion={(id) => toggleRegion(id)}
          onToggleCountry={toggleCountry}
          onClearAll={() => { setSelectedRegions([]); setSelectedCountries([]); }}
        />
        <MultiSelectFilter label="Campaign" icon={Megaphone} allItems={campaignItems} selectedItems={selectedCampaigns} onToggle={toggleCampaign} onClear={() => setSelectedCampaigns([])} popoverWidth="w-72" />
        <MultiSelectFilter label="Channel" icon={Radio} allItems={availableChannels} selectedItems={selectedChannels} onToggle={toggleChannel} onClear={() => setSelectedChannels([])} />

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
