// ===== Enterprise Hierarchy =====

// --- Business Divisions ---
export type DivisionId = 'pcb' | 'wealth' | 'insurance' | 'capital-markets';

export const DIVISION_LABELS: Record<DivisionId, string> = {
  'pcb': 'Personal & Commercial Banking',
  'wealth': 'Wealth Management',
  'insurance': 'Insurance',
  'capital-markets': 'Capital Markets',
};

// --- Agency Partners ---
export type AgencyId = 'omnicom' | 'publicis' | 'wpp' | 'in-house' | 'other';

export const AGENCY_LABELS: Record<AgencyId, string> = {
  'omnicom': 'Omnicom Media Group',
  'publicis': 'Publicis Groupe',
  'wpp': 'WPP',
  'in-house': 'RBC In-House',
  'other': 'Other Agencies',
};

// --- Product Lines ---
export type ProductLineId =
  | 'avion' | 'ion' | 'rewards'
  | 'mortgage' | 'direct-investing' | 'dominion-securities'
  | 'insurance-products' | 'student' | 'newcomer'
  | 'small-business' | 'commercial-lending' | 'gic-savings';

export const PRODUCT_LINE_LABELS: Record<ProductLineId, string> = {
  'avion': 'Avion',
  'ion': 'ION',
  'rewards': 'RBC Rewards',
  'mortgage': 'Mortgages & Home Equity',
  'direct-investing': 'RBC Direct Investing',
  'dominion-securities': 'RBC Dominion Securities',
  'insurance-products': 'Insurance Products',
  'student': 'Student Banking',
  'newcomer': 'Newcomer Banking',
  'small-business': 'Small Business Banking',
  'commercial-lending': 'Commercial Lending',
  'gic-savings': 'GICs & Savings',
};

export interface ProductLine {
  id: ProductLineId;
  label: string;
  division: DivisionId;
  agencies: AgencyId[];
}

// --- Audience Segments ---
export type AudienceId =
  | 'young-professionals' | 'families' | 'new-canadians'
  | 'high-net-worth' | 'students' | 'retirees'
  | 'business-owners' | 'mass-market';

export const AUDIENCE_LABELS: Record<AudienceId, string> = {
  'young-professionals': 'Young Professionals',
  'families': 'Families',
  'new-canadians': 'New Canadians',
  'high-net-worth': 'High-Net-Worth',
  'students': 'Students',
  'retirees': 'Retirees',
  'business-owners': 'Business Owners',
  'mass-market': 'Mass Market',
};

// --- Geographic Regions ---
export type GeoId = 'national' | 'ontario' | 'quebec' | 'western' | 'atlantic';

export const GEO_LABELS: Record<GeoId, string> = {
  'national': 'National',
  'ontario': 'Ontario',
  'quebec': 'Quebec',
  'western': 'Western Canada',
  'atlantic': 'Atlantic Canada',
};

/** @deprecated Use GeoId. Kept for backward compatibility during migration. */
export type RegionId = GeoId;
/** @deprecated Use GEO_LABELS. Kept for backward compatibility during migration. */
export const REGION_LABELS = GEO_LABELS;

// ===== Channels =====
export type ChannelId = 'instagram' | 'facebook' | 'tiktok' | 'google-search' | 'ttd' | 'ctv' | 'spotify' | 'linkedin' | 'ooh';

export const CHANNEL_LABELS: Record<ChannelId, string> = {
  'instagram': 'Instagram',
  'facebook': 'Facebook',
  'tiktok': 'TikTok',
  'google-search': 'Google Search',
  'ttd': 'The Trade Desk',
  'ctv': 'CTV',
  'spotify': 'Spotify',
  'linkedin': 'LinkedIn',
  'ooh': 'Out-of-Home',
};

export const CHANNEL_COLORS: Record<ChannelId, string> = {
  'instagram': '#E1306C',
  'facebook': '#1877F2',
  'tiktok': '#00F2EA',
  'google-search': '#FBBC05',
  'ttd': '#22C55E',
  'ctv': '#A855F7',
  'spotify': '#1DB954',
  'linkedin': '#0A66C2',
  'ooh': '#F97316',
};

// ===== Campaigns =====
export type CampaignObjective = 'awareness' | 'consideration' | 'conversion' | 'retention';
export type CampaignStatus = 'live' | 'paused' | 'completed' | 'scheduled';

export interface Campaign {
  id: string;
  name: string;
  division: DivisionId;
  agency: AgencyId;
  productLine: ProductLineId;
  audiences: AudienceId[];
  objective: CampaignObjective;
  status: CampaignStatus;
  channels: ChannelId[];
  geos: GeoId[];
  startDate: string;
  endDate?: string;
  plannedBudget: number;
}

// ===== KPI Data =====
export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  landingPageViews: number;
  leads: number;
  conversions: number;
  revenue: number;
  videoViews3s: number;
  videoViewsThruplay: number;
  engagements: number;
  assistedConversions: number;
}

export interface AggregatedKPIs extends DailyMetrics {
  // Derived
  frequency: number;
  ctr: number;
  cpc: number;
  cpm: number;
  lpvRate: number;
  cpl: number;
  cpa: number;
  roas: number;
  videoCompletionRate: number;
  threeSecondViewRate: number;
  engagementRate: number;
  brandSearchLift: number;
  shareOfVoice: number;
  // Health
  volatilityScore: number;
  anomalyCount: number;
  budgetPacing: number;
  creativeFatigueIndex: number;
}

export interface KPIDelta {
  value: number;
  previousValue: number;
  delta: number;
  deltaPercent: number;
}

export type KPIKey = keyof AggregatedKPIs;

export interface KPIConfig {
  key: KPIKey;
  label: string;
  format: 'currency' | 'number' | 'percent' | 'decimal' | 'index';
  higherIsBetter: boolean;
  category: 'spend' | 'reach' | 'engagement' | 'conversion' | 'revenue' | 'video' | 'health';
}

export const KPI_CONFIGS: KPIConfig[] = [
  { key: 'spend', label: 'Spend', format: 'currency', higherIsBetter: false, category: 'spend' },
  { key: 'impressions', label: 'Impressions', format: 'number', higherIsBetter: true, category: 'reach' },
  { key: 'reach', label: 'Reach', format: 'number', higherIsBetter: true, category: 'reach' },
  { key: 'frequency', label: 'Frequency', format: 'decimal', higherIsBetter: false, category: 'reach' },
  { key: 'clicks', label: 'Clicks', format: 'number', higherIsBetter: true, category: 'engagement' },
  { key: 'ctr', label: 'CTR', format: 'percent', higherIsBetter: true, category: 'engagement' },
  { key: 'cpc', label: 'CPC', format: 'currency', higherIsBetter: false, category: 'engagement' },
  { key: 'cpm', label: 'CPM', format: 'currency', higherIsBetter: false, category: 'reach' },
  { key: 'landingPageViews', label: 'Landing Page Views', format: 'number', higherIsBetter: true, category: 'engagement' },
  { key: 'lpvRate', label: 'LPV Rate', format: 'percent', higherIsBetter: true, category: 'engagement' },
  { key: 'leads', label: 'Leads', format: 'number', higherIsBetter: true, category: 'conversion' },
  { key: 'cpl', label: 'CPL', format: 'currency', higherIsBetter: false, category: 'conversion' },
  { key: 'conversions', label: 'Conversions', format: 'number', higherIsBetter: true, category: 'conversion' },
  { key: 'cpa', label: 'CPA', format: 'currency', higherIsBetter: false, category: 'conversion' },
  { key: 'revenue', label: 'Revenue', format: 'currency', higherIsBetter: true, category: 'revenue' },
  { key: 'roas', label: 'ROAS', format: 'decimal', higherIsBetter: true, category: 'revenue' },
  { key: 'videoViews3s', label: 'Video Views (3s)', format: 'number', higherIsBetter: true, category: 'video' },
  { key: 'videoViewsThruplay', label: 'ThruPlay Views', format: 'number', higherIsBetter: true, category: 'video' },
  { key: 'videoCompletionRate', label: 'Video Completion Rate', format: 'percent', higherIsBetter: true, category: 'video' },
  { key: 'threeSecondViewRate', label: '3s View Rate', format: 'percent', higherIsBetter: true, category: 'video' },
  { key: 'engagements', label: 'Engagements', format: 'number', higherIsBetter: true, category: 'engagement' },
  { key: 'engagementRate', label: 'Engagement Rate', format: 'percent', higherIsBetter: true, category: 'engagement' },
  { key: 'assistedConversions', label: 'Assisted Conversions', format: 'number', higherIsBetter: true, category: 'conversion' },
  { key: 'brandSearchLift', label: 'Brand Search Lift', format: 'index', higherIsBetter: true, category: 'reach' },
  { key: 'shareOfVoice', label: 'Share of Voice', format: 'percent', higherIsBetter: true, category: 'reach' },
  { key: 'volatilityScore', label: 'Volatility', format: 'decimal', higherIsBetter: false, category: 'health' },
  { key: 'anomalyCount', label: 'Anomalies (7d)', format: 'number', higherIsBetter: false, category: 'health' },
  { key: 'budgetPacing', label: 'Budget Pacing', format: 'percent', higherIsBetter: true, category: 'health' },
  { key: 'creativeFatigueIndex', label: 'Creative Fatigue', format: 'index', higherIsBetter: false, category: 'health' },
];

export const DEFAULT_BRAND_KPIS: KPIKey[] = [
  'spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc', 'cpm',
  'conversions', 'cpa', 'revenue', 'roas', 'engagementRate', 'threeSecondViewRate', 'budgetPacing'
];

// ===== Funnel Stage =====
export type FunnelStage = 'all' | 'upper' | 'mid' | 'lower' | 'retention';

export const FUNNEL_LABELS: Record<FunnelStage, string> = {
  all: 'All Funnel',
  upper: 'Upper Funnel',
  mid: 'Mid Funnel',
  lower: 'Lower Funnel',
  retention: 'Retention',
};

export const FUNNEL_HERO_KPIS: Record<FunnelStage, KPIKey[]> = {
  all: ['spend', 'cpm', 'roas'],
  upper: ['impressions', 'reach', 'cpm'],
  mid: ['clicks', 'ctr', 'engagementRate'],
  lower: ['conversions', 'cpa', 'roas'],
  retention: ['conversions', 'roas', 'cpl'],
};

export const FUNNEL_CUSTOM_KPIS: Record<FunnelStage, KPIKey[]> = {
  all: DEFAULT_BRAND_KPIS,
  upper: ['spend', 'impressions', 'reach', 'frequency', 'cpm', 'videoViews3s', 'videoViewsThruplay', 'threeSecondViewRate', 'brandSearchLift', 'budgetPacing'],
  mid: ['spend', 'clicks', 'ctr', 'cpc', 'landingPageViews', 'lpvRate', 'engagements', 'engagementRate', 'videoViewsThruplay', 'videoCompletionRate', 'budgetPacing'],
  lower: ['spend', 'conversions', 'cpa', 'revenue', 'roas', 'leads', 'cpl', 'assistedConversions', 'budgetPacing'],
  retention: ['spend', 'conversions', 'cpa', 'revenue', 'roas', 'leads', 'cpl', 'assistedConversions', 'budgetPacing'],
};

export const DEFAULT_EXEC_KPIS: KPIKey[] = [
  'spend', 'reach', 'conversions', 'revenue', 'roas', 'cpa',
  'brandSearchLift', 'shareOfVoice', 'budgetPacing', 'anomalyCount'
];

// ===== Date Range =====
export type DateRangePreset = '1d' | '7d' | '14d' | '30d' | '90d' | 'ytd' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  start: string;
  end: string;
}

// ===== Attribution =====
export type AttributionModel = 'last-click' | 'first-click' | 'linear' | 'data-driven';

// ===== Role =====
export type UserRole = 'agency' | 'exec';

// ===== View Level =====
export type ViewLevel = 'brand' | 'division' | 'product' | 'campaign';

// ===== News =====
export type NewsTag =
  | 'brand'
  | 'banking'
  | 'credit-cards'
  | 'fintech'
  | 'social'
  | 'sports'
  | 'sponsorships'
  | 'competitors'
  | 'macro';

export type NewsUrgency = 'low' | 'medium' | 'high';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  tags: NewsTag[];
  regions: RegionId[];
  urgency: NewsUrgency;
  summary: string;
  whyItMatters: string;
  competitor?: string;
}

// ===== Insights =====
export type InsightCategory = 'performance' | 'creative' | 'competitive' | 'platform' | 'macro';
export type InsightStatus = 'new' | 'reviewed' | 'approved' | 'dismissed' | 'snoozed';
export type InsightScope = 'brand' | 'division' | 'product' | 'campaign';

export type DismissReason = 'not-relevant' | 'insufficient-confidence' | 'brand-constraint' | 'other';

export interface InsightActionStep {
  id: string;
  title: string;
  subtitle: string;
  type: 'budget' | 'creative' | 'targeting' | 'bidding' | 'scheduling';
  completed: boolean;
}

export interface Insight {
  id: string;
  createdAt: string;
  scope: InsightScope;
  division?: DivisionId;
  productLine?: ProductLineId;
  campaign?: string;
  channels: ChannelId[];
  category: InsightCategory;
  title: string;
  summary: string;
  evidence: string[];
  confidence: number;
  impactEstimate: string;
  recommendedAction: string;
  status: InsightStatus;
  linkedNewsId?: string;
  linkedAnomalyId?: string;
  actionSteps: InsightActionStep[];
  approvalRationale?: string;
  dismissReason?: DismissReason;
  snoozeUntil?: string;
  actionedAt?: string;
  actionedBy?: string;
}

export interface ActionLogEntry {
  id: string;
  insightId: string;
  action: 'approved' | 'dismissed' | 'snoozed' | 'reviewed';
  timestamp: string;
  rationale?: string;
  dismissReason?: DismissReason;
  snoozeUntil?: string;
}

// ===== Anomaly =====
export interface Anomaly {
  id: string;
  date: string;
  geo: GeoId;
  division?: DivisionId;
  productLine?: ProductLineId;
  campaign?: string;
  channel?: ChannelId;
  metric: KPIKey;
  severity: 'low' | 'medium' | 'high';
  zScore: number;
  description: string;
}

// ===== Filters =====
export interface DashboardFilters {
  dateRange: DateRange;
  compareEnabled: boolean;
  divisions: DivisionId[];
  agencies: AgencyId[];
  productLines: ProductLineId[];
  audiences: AudienceId[];
  geos: GeoId[];
  channels: ChannelId[];
  objectives: CampaignObjective[];
  campaignStatus: CampaignStatus[];
  attributionModel: AttributionModel;
  role: UserRole;
  selectedDivision?: DivisionId;
  selectedProductLine?: ProductLineId;
  selectedCampaign?: string;
  customKpis?: KPIKey[];
}
