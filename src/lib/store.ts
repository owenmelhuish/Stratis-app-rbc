import { create } from 'zustand';
import { subDays, format, startOfYear } from 'date-fns';
import type {
  DateRange,
  DateRangePreset,
  UserRole,
  RegionId,
  ChannelId,
  CampaignObjective,
  CampaignStatus,
  AttributionModel,
  KPIKey,
  InsightStatus,
  DismissReason,
  ActionLogEntry,
  FunnelStage,
} from '@/types';
import { DEFAULT_BRAND_KPIS, FUNNEL_CUSTOM_KPIS } from '@/types';

const STORAGE_KEY = 'stratis-app-state';
const TODAY = new Date('2026-02-12');

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function computeDateRange(preset: DateRangePreset): DateRange {
  const end = format(TODAY, 'yyyy-MM-dd');
  switch (preset) {
    case '1d': return { preset, start: format(subDays(TODAY, 1), 'yyyy-MM-dd'), end };
    case '7d': return { preset, start: format(subDays(TODAY, 7), 'yyyy-MM-dd'), end };
    case '14d': return { preset, start: format(subDays(TODAY, 14), 'yyyy-MM-dd'), end };
    case '30d': return { preset, start: format(subDays(TODAY, 30), 'yyyy-MM-dd'), end };
    case '90d': return { preset, start: format(subDays(TODAY, 90), 'yyyy-MM-dd'), end };
    case 'ytd': return { preset, start: format(startOfYear(TODAY), 'yyyy-MM-dd'), end };
    case 'custom': return { preset, start: end, end };
  }
}

interface PersistedState {
  dateRange: DateRange;
  compareEnabled: boolean;
  role: UserRole;
  customKpis: KPIKey[];
  selectedFunnel: FunnelStage;
  insightStatuses: Record<string, InsightStatus>;
  insightApprovals: Record<string, string>;
  insightDismissals: Record<string, DismissReason>;
  insightSnoozes: Record<string, string>;
  actionLog: ActionLogEntry[];
}

function readStorage(): Partial<PersistedState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch { return null; }
}

function writeStorage(state: PersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded */ }
}

export interface AppState {
  dateRange: DateRange;
  compareEnabled: boolean;
  selectedRegions: RegionId[];
  selectedCountries: string[];
  selectedChannels: ChannelId[];
  selectedCampaigns: string[];
  selectedObjectives: CampaignObjective[];
  selectedCampaignStatuses: CampaignStatus[];
  attributionModel: AttributionModel;
  role: UserRole;
  selectedRegion: RegionId | null;
  selectedCampaign: string | null;
  customKpis: KPIKey[];
  selectedFunnel: FunnelStage;
  insightStatuses: Record<string, InsightStatus>;
  insightApprovals: Record<string, string>;
  insightDismissals: Record<string, DismissReason>;
  insightSnoozes: Record<string, string>;
  actionLog: ActionLogEntry[];
  isLoading: boolean;
  approvedDrawerOpen: boolean;

  setDateRange: (range: DateRange) => void;
  setDatePreset: (preset: DateRangePreset) => void;
  toggleCompare: () => void;
  setRole: (role: UserRole) => void;
  setSelectedRegion: (region: RegionId | null) => void;
  setSelectedCampaign: (campaign: string | null) => void;
  setSelectedRegions: (regions: RegionId[]) => void;
  setSelectedCountries: (countries: string[]) => void;
  setSelectedChannels: (channels: ChannelId[]) => void;
  setSelectedCampaigns: (campaigns: string[]) => void;
  setSelectedObjectives: (objectives: CampaignObjective[]) => void;
  setSelectedCampaignStatuses: (statuses: CampaignStatus[]) => void;
  setAttributionModel: (model: AttributionModel) => void;
  setCustomKpis: (kpis: KPIKey[]) => void;
  setFunnel: (funnel: FunnelStage) => void;
  setLoading: (loading: boolean) => void;
  setApprovedDrawerOpen: (open: boolean) => void;

  approveInsight: (id: string, rationale?: string) => void;
  dismissInsight: (id: string, reason: DismissReason) => void;
  snoozeInsight: (id: string, days: number) => void;
  reviewInsight: (id: string) => void;

  drillToRegion: (region: RegionId) => void;
  drillToCampaign: (region: RegionId, campaignId: string) => void;
  drillUp: () => void;

  hydrateFromStorage: () => void;
  syncToStorage: () => void;
}

const DEFAULT_DATE_RANGE = computeDateRange('30d');

export const useAppStore = create<AppState>()((set, get) => ({
  dateRange: DEFAULT_DATE_RANGE,
  compareEnabled: false,
  selectedRegions: [],
  selectedCountries: [],
  selectedChannels: [],
  selectedCampaigns: [],
  selectedObjectives: [],
  selectedCampaignStatuses: [],
  attributionModel: 'last-click',
  role: 'agency',
  selectedRegion: null,
  selectedCampaign: null,
  customKpis: [...DEFAULT_BRAND_KPIS],
  selectedFunnel: 'all',
  insightStatuses: {},
  insightApprovals: {},
  insightDismissals: {},
  insightSnoozes: {},
  actionLog: [],
  isLoading: false,
  approvedDrawerOpen: false,

  setDateRange: (range) => { set({ dateRange: range }); get().syncToStorage(); },
  setDatePreset: (preset) => {
    if (preset === 'custom') {
      set((s) => ({ dateRange: { ...s.dateRange, preset: 'custom' } }));
    } else {
      set({ dateRange: computeDateRange(preset) });
    }
    get().syncToStorage();
  },
  toggleCompare: () => { set((s) => ({ compareEnabled: !s.compareEnabled })); get().syncToStorage(); },
  setRole: (role) => { set({ role }); get().syncToStorage(); },
  setSelectedRegions: (regions) => set({ selectedRegions: regions }),
  setSelectedCountries: (countries) => set({ selectedCountries: countries }),
  setSelectedChannels: (channels) => set({ selectedChannels: channels }),
  setSelectedCampaigns: (campaigns) => set({ selectedCampaigns: campaigns }),
  setSelectedObjectives: (objectives) => set({ selectedObjectives: objectives }),
  setSelectedCampaignStatuses: (statuses) => set({ selectedCampaignStatuses: statuses }),
  setAttributionModel: (model) => set({ attributionModel: model }),
  setCustomKpis: (kpis) => { set({ customKpis: kpis }); get().syncToStorage(); },
  setFunnel: (funnel) => { set({ selectedFunnel: funnel, customKpis: [...FUNNEL_CUSTOM_KPIS[funnel]] }); get().syncToStorage(); },
  setLoading: (loading) => set({ isLoading: loading }),
  setApprovedDrawerOpen: (open) => set({ approvedDrawerOpen: open }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),

  approveInsight: (id, rationale) => {
    const entry: ActionLogEntry = { id: generateId(), insightId: id, action: 'approved', timestamp: new Date().toISOString(), rationale };
    set((s) => ({
      insightStatuses: { ...s.insightStatuses, [id]: 'approved' as InsightStatus },
      insightApprovals: { ...s.insightApprovals, [id]: rationale ?? '' },
      actionLog: [entry, ...s.actionLog],
    }));
    get().syncToStorage();
  },

  dismissInsight: (id, reason) => {
    const entry: ActionLogEntry = { id: generateId(), insightId: id, action: 'dismissed', timestamp: new Date().toISOString(), dismissReason: reason };
    set((s) => ({
      insightStatuses: { ...s.insightStatuses, [id]: 'dismissed' as InsightStatus },
      insightDismissals: { ...s.insightDismissals, [id]: reason },
      actionLog: [entry, ...s.actionLog],
    }));
    get().syncToStorage();
  },

  snoozeInsight: (id, days) => {
    const snoozeUntil = format(subDays(TODAY, -days), 'yyyy-MM-dd');
    const entry: ActionLogEntry = { id: generateId(), insightId: id, action: 'snoozed', timestamp: new Date().toISOString(), snoozeUntil };
    set((s) => ({
      insightStatuses: { ...s.insightStatuses, [id]: 'snoozed' as InsightStatus },
      insightSnoozes: { ...s.insightSnoozes, [id]: snoozeUntil },
      actionLog: [entry, ...s.actionLog],
    }));
    get().syncToStorage();
  },

  reviewInsight: (id) => {
    const entry: ActionLogEntry = { id: generateId(), insightId: id, action: 'reviewed', timestamp: new Date().toISOString() };
    set((s) => ({
      insightStatuses: { ...s.insightStatuses, [id]: 'reviewed' as InsightStatus },
      actionLog: [entry, ...s.actionLog],
    }));
    get().syncToStorage();
  },

  drillToRegion: (region) => set({ selectedRegion: region, selectedCampaign: null }),
  drillToCampaign: (region, campaignId) => set({ selectedRegion: region, selectedCampaign: campaignId }),
  drillUp: () => {
    const { selectedCampaign, selectedRegion } = get();
    if (selectedCampaign) { set({ selectedCampaign: null }); }
    else if (selectedRegion) { set({ selectedRegion: null }); }
  },

  hydrateFromStorage: () => {
    const persisted = readStorage();
    if (!persisted) return;
    set((s) => ({
      dateRange: persisted.dateRange ?? s.dateRange,
      compareEnabled: persisted.compareEnabled ?? s.compareEnabled,
      role: persisted.role ?? s.role,
      customKpis: persisted.customKpis ?? s.customKpis,
      selectedFunnel: persisted.selectedFunnel ?? s.selectedFunnel,
      insightStatuses: persisted.insightStatuses ?? s.insightStatuses,
      insightApprovals: persisted.insightApprovals ?? s.insightApprovals,
      insightDismissals: persisted.insightDismissals ?? s.insightDismissals,
      insightSnoozes: persisted.insightSnoozes ?? s.insightSnoozes,
      actionLog: persisted.actionLog ?? s.actionLog,
    }));
  },

  syncToStorage: () => {
    const s = get();
    writeStorage({
      dateRange: s.dateRange,
      compareEnabled: s.compareEnabled,
      role: s.role,
      customKpis: s.customKpis,
      selectedFunnel: s.selectedFunnel,
      insightStatuses: s.insightStatuses,
      insightApprovals: s.insightApprovals,
      insightDismissals: s.insightDismissals,
      insightSnoozes: s.insightSnoozes,
      actionLog: s.actionLog,
    });
  },
}));
