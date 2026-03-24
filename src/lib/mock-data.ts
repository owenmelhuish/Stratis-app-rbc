import { subDays, format } from 'date-fns';
import type {
  ChannelId, Campaign, CampaignObjective, CampaignStatus,
  DailyMetrics, AggregatedKPIs, KPIDelta, KPIKey,
  NewsItem, NewsTag, NewsUrgency,
  Insight, InsightCategory, InsightStatus, InsightActionStep,
  Anomaly,
  DivisionId, AgencyId, ProductLineId, AudienceId, GeoId,
} from '@/types';
import { CHANNEL_LABELS, GEO_LABELS } from '@/types';

// ===== Seedable PRNG (Mulberry32) =====
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

function randBetween(min: number, max: number): number {
  return min + rng() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(randBetween(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

function gaussian(): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ===== Constants =====
const END_DATE = new Date('2026-02-11');
const DATA_DAYS = 180;
const START_DATE = subDays(END_DATE, DATA_DAYS - 1);
const ALL_GEOS: GeoId[] = ['national', 'ontario', 'quebec', 'western', 'atlantic'];
const ALL_CHANNELS: ChannelId[] = ['instagram', 'facebook', 'tiktok', 'google-search', 'ttd', 'ctv', 'spotify', 'linkedin', 'ooh'];

// ===== Channel Profiles =====
interface ChannelProfile {
  baseSpend: number;
  cpmRange: [number, number];
  ctrRange: [number, number];
  cvrRange: [number, number];
  cpcRange: [number, number];
  videoViewRate: number;
  videoCompletionRate: number;
  engagementMultiplier: number;
  volatility: number;
}

const CHANNEL_PROFILES: Record<ChannelId, ChannelProfile> = {
  'google-search': { baseSpend: 2085, cpmRange: [18, 38], ctrRange: [3, 7], cvrRange: [4, 8], cpcRange: [3, 7], videoViewRate: 0, videoCompletionRate: 0, engagementMultiplier: 0.5, volatility: 0.15 },
  'facebook': { baseSpend: 1730, cpmRange: [10, 22], ctrRange: [0.9, 2.0], cvrRange: [1.8, 4.0], cpcRange: [1.2, 3.5], videoViewRate: 0.3, videoCompletionRate: 0.25, engagementMultiplier: 1.2, volatility: 0.12 },
  'instagram': { baseSpend: 1535, cpmRange: [10, 24], ctrRange: [0.8, 1.8], cvrRange: [1.8, 3.5], cpcRange: [1.5, 4], videoViewRate: 0.4, videoCompletionRate: 0.3, engagementMultiplier: 1.5, volatility: 0.1 },
  'tiktok': { baseSpend: 1185, cpmRange: [6, 18], ctrRange: [0.6, 1.6], cvrRange: [1.0, 2.8], cpcRange: [0.8, 2.5], videoViewRate: 0.8, videoCompletionRate: 0.15, engagementMultiplier: 2.0, volatility: 0.25 },
  'ttd': { baseSpend: 2570, cpmRange: [6, 18], ctrRange: [0.2, 0.8], cvrRange: [0.8, 2.0], cpcRange: [1.5, 5], videoViewRate: 0.2, videoCompletionRate: 0.2, engagementMultiplier: 0.3, volatility: 0.08 },
  'ctv': { baseSpend: 3200, cpmRange: [22, 45], ctrRange: [0.15, 0.5], cvrRange: [0.5, 1.5], cpcRange: [4, 10], videoViewRate: 0.9, videoCompletionRate: 0.7, engagementMultiplier: 0.2, volatility: 0.06 },
  'spotify': { baseSpend: 1400, cpmRange: [12, 28], ctrRange: [0.4, 1.2], cvrRange: [0.8, 2.5], cpcRange: [2, 5], videoViewRate: 0.0, videoCompletionRate: 0.0, engagementMultiplier: 0.4, volatility: 0.10 },
  'linkedin': { baseSpend: 1800, cpmRange: [15, 35], ctrRange: [0.5, 1.5], cvrRange: [1.5, 3.5], cpcRange: [3, 8], videoViewRate: 0.15, videoCompletionRate: 0.2, engagementMultiplier: 0.6, volatility: 0.10 },
  'ooh': { baseSpend: 2200, cpmRange: [8, 20], ctrRange: [0.1, 0.3], cvrRange: [0.3, 1.0], cpcRange: [5, 15], videoViewRate: 0, videoCompletionRate: 0, engagementMultiplier: 0.1, volatility: 0.05 },
};

// ===== Geo multipliers =====
const GEO_MULTIPLIERS: Record<GeoId, number> = {
  'national': 1.4,
  'ontario': 1.3,
  'quebec': 1.1,
  'western': 1.2,
  'atlantic': 0.9,
};

// ===== Province Branch Weight Distribution =====
const PROVINCE_BRANCH_WEIGHT: Record<string, number> = {
  'ON': 0.380, 'QC': 0.230, 'BC': 0.140, 'AB': 0.110,
  'MB': 0.035, 'SK': 0.025, 'NS': 0.025, 'NB': 0.020,
  'NL': 0.015, 'PE': 0.008, 'NT': 0.005, 'YT': 0.004, 'NU': 0.003,
};

// ===== Geo to Province mapping =====
const GEO_TO_PROVINCES: Record<GeoId, string[]> = {
  'national': ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'YT', 'NU'],
  'ontario': ['ON'],
  'quebec': ['QC'],
  'western': ['BC', 'AB', 'MB', 'SK'],
  'atlantic': ['NS', 'NB', 'NL', 'PE'],
};

// ===== Campaign definitions =====
interface CampaignDef {
  id: string; name: string; division: DivisionId; agency: AgencyId;
  productLine: ProductLineId; audiences: AudienceId[];
  objective: CampaignObjective; status: CampaignStatus;
  channels: ChannelId[]; geos: GeoId[]; budgetMultiplier: number;
  plannedBudget: number;
}

const CAMPAIGN_DEFS: CampaignDef[] = [
  { id: 'rbc-avion-travel-q1', name: 'Avion Travel Rewards — Q1 Push', division: 'pcb', agency: 'omnicom', productLine: 'avion', audiences: ['young-professionals', 'families', 'high-net-worth'], objective: 'awareness', status: 'live',
    channels: ['instagram', 'facebook', 'google-search', 'ctv', 'ttd', 'ooh', 'spotify'], geos: ['national'], budgetMultiplier: 1.50, plannedBudget: 3200000 },
  { id: 'rbc-avion-points-accel', name: 'Avion Points Accelerator', division: 'pcb', agency: 'omnicom', productLine: 'avion', audiences: ['young-professionals', 'families', 'mass-market'], objective: 'conversion', status: 'live',
    channels: ['instagram', 'facebook', 'google-search'], geos: ['national'], budgetMultiplier: 1.10, plannedBudget: 1800000 },
  { id: 'rbc-avion-retention', name: 'Avion Cardholder Retention', division: 'pcb', agency: 'omnicom', productLine: 'avion', audiences: ['young-professionals', 'families', 'high-net-worth'], objective: 'retention', status: 'live',
    channels: ['instagram', 'facebook', 'google-search'], geos: ['national'], budgetMultiplier: 0.85, plannedBudget: 1200000 },
  { id: 'rbc-ion-launch', name: 'ION Card Digital Launch', division: 'pcb', agency: 'omnicom', productLine: 'ion', audiences: ['young-professionals', 'students'], objective: 'awareness', status: 'live',
    channels: ['tiktok', 'instagram', 'facebook', 'spotify', 'google-search'], geos: ['national'], budgetMultiplier: 1.35, plannedBudget: 2400000 },
  { id: 'rbc-ion-student', name: 'ION Student Crossover', division: 'pcb', agency: 'omnicom', productLine: 'ion', audiences: ['students'], objective: 'consideration', status: 'live',
    channels: ['tiktok', 'instagram', 'facebook', 'spotify'], geos: ['ontario', 'quebec'], budgetMultiplier: 0.70, plannedBudget: 900000 },
  { id: 'rbc-rewards-awareness', name: 'RBC Rewards Brand Awareness', division: 'pcb', agency: 'in-house', productLine: 'rewards', audiences: ['mass-market', 'young-professionals', 'families'], objective: 'awareness', status: 'live',
    channels: ['instagram', 'facebook', 'ctv', 'spotify'], geos: ['national'], budgetMultiplier: 1.00, plannedBudget: 1600000 },
  { id: 'rbc-mortgage-spring', name: 'Spring Mortgage Rates', division: 'pcb', agency: 'omnicom', productLine: 'mortgage', audiences: ['families', 'young-professionals'], objective: 'conversion', status: 'live',
    channels: ['google-search', 'instagram', 'facebook', 'ctv', 'ttd'], geos: ['national'], budgetMultiplier: 1.40, plannedBudget: 2800000 },
  { id: 'rbc-mortgage-ftb', name: 'First-Time Home Buyer', division: 'pcb', agency: 'omnicom', productLine: 'mortgage', audiences: ['young-professionals'], objective: 'consideration', status: 'live',
    channels: ['google-search', 'instagram', 'facebook', 'linkedin'], geos: ['ontario', 'western'], budgetMultiplier: 1.05, plannedBudget: 1500000 },
  { id: 'rbc-di-tfsa', name: 'TFSA Season Push', division: 'wealth', agency: 'publicis', productLine: 'direct-investing', audiences: ['young-professionals', 'high-net-worth', 'retirees'], objective: 'conversion', status: 'live',
    channels: ['google-search', 'instagram', 'facebook', 'linkedin'], geos: ['national'], budgetMultiplier: 1.20, plannedBudget: 2000000 },
  { id: 'rbc-di-active-trader', name: 'Active Trader Acquisition', division: 'wealth', agency: 'publicis', productLine: 'direct-investing', audiences: ['young-professionals', 'high-net-worth'], objective: 'consideration', status: 'live',
    channels: ['google-search', 'instagram', 'facebook', 'tiktok'], geos: ['national'], budgetMultiplier: 0.90, plannedBudget: 1100000 },
  { id: 'rbc-ds-hnw', name: 'HNW Wealth Advisory', division: 'wealth', agency: 'publicis', productLine: 'dominion-securities', audiences: ['high-net-worth', 'retirees'], objective: 'consideration', status: 'live',
    channels: ['linkedin', 'ctv', 'ooh'], geos: ['ontario', 'western'], budgetMultiplier: 1.15, plannedBudget: 1800000 },
  { id: 'rbc-insurance-bundle', name: 'Home & Auto Insurance Bundle', division: 'insurance', agency: 'publicis', productLine: 'insurance-products', audiences: ['families', 'mass-market'], objective: 'conversion', status: 'live',
    channels: ['google-search', 'instagram', 'facebook', 'ctv'], geos: ['national'], budgetMultiplier: 1.25, plannedBudget: 2100000 },
  { id: 'rbc-student-bts', name: 'Back to School Banking 2026', division: 'pcb', agency: 'omnicom', productLine: 'student', audiences: ['students'], objective: 'awareness', status: 'live',
    channels: ['tiktok', 'instagram', 'facebook', 'spotify'], geos: ['ontario', 'quebec'], budgetMultiplier: 0.65, plannedBudget: 800000 },
  { id: 'rbc-newcomer-welcome', name: 'Welcome to Canada', division: 'pcb', agency: 'wpp', productLine: 'newcomer', audiences: ['new-canadians'], objective: 'awareness', status: 'live',
    channels: ['google-search', 'instagram', 'facebook', 'linkedin'], geos: ['national'], budgetMultiplier: 1.00, plannedBudget: 1400000 },
  { id: 'rbc-smb-growth', name: 'Small Business Growth', division: 'pcb', agency: 'wpp', productLine: 'small-business', audiences: ['business-owners'], objective: 'consideration', status: 'live',
    channels: ['google-search', 'linkedin', 'instagram', 'facebook'], geos: ['national'], budgetMultiplier: 1.10, plannedBudget: 1600000 },
  { id: 'rbc-cml-commercial', name: 'Commercial Lending', division: 'capital-markets', agency: 'wpp', productLine: 'commercial-lending', audiences: ['business-owners'], objective: 'consideration', status: 'live',
    channels: ['linkedin', 'google-search'], geos: ['national'], budgetMultiplier: 0.75, plannedBudget: 900000 },
  { id: 'rbc-gic-rates', name: 'GIC Rate Promotion', division: 'pcb', agency: 'in-house', productLine: 'gic-savings', audiences: ['retirees', 'mass-market'], objective: 'conversion', status: 'live',
    channels: ['google-search', 'instagram', 'facebook'], geos: ['national'], budgetMultiplier: 0.80, plannedBudget: 1000000 },
  { id: 'rbc-gameday-moments', name: 'Game Day Moments', division: 'pcb', agency: 'in-house', productLine: 'rewards', audiences: ['young-professionals', 'families', 'mass-market'], objective: 'awareness', status: 'live',
    channels: ['instagram', 'facebook', 'ctv', 'tiktok', 'ooh', 'spotify'], geos: ['national'], budgetMultiplier: 1.60, plannedBudget: 3500000 },
  { id: 'rbc-brand-q1', name: 'RBC Master Brand — Q1', division: 'pcb', agency: 'in-house', productLine: 'rewards', audiences: ['mass-market', 'young-professionals', 'families'], objective: 'awareness', status: 'live',
    channels: ['instagram', 'facebook', 'ctv', 'google-search', 'ooh', 'spotify'], geos: ['national'], budgetMultiplier: 1.75, plannedBudget: 4000000 },
];

// ===== Events (anomaly generators) =====
interface DataEvent {
  name: string; dayOffset: number; duration: number;
  geos: GeoId[]; spendMult: number; cvrMult: number; engageMult: number;
}

const DATA_EVENTS: DataEvent[] = [
  { name: 'RRSP/TFSA Deadline Push', dayOffset: 30, duration: 14, geos: ['national'], spendMult: 1.6, cvrMult: 1.4, engageMult: 1.2 },
  { name: 'Bank of Canada Rate Decision', dayOffset: 60, duration: 5, geos: ['national'], spendMult: 1.3, cvrMult: 1.2, engageMult: 1.1 },
  { name: 'Spring Housing Market Surge', dayOffset: 90, duration: 21, geos: ['national'], spendMult: 1.5, cvrMult: 1.3, engageMult: 1.0 },
  { name: 'Wealthsimple Aggressive Campaign', dayOffset: 110, duration: 10, geos: ['national'], spendMult: 1.0, cvrMult: 0.85, engageMult: 0.8 },
  { name: 'Back to School Banking Season', dayOffset: 150, duration: 14, geos: ['national'], spendMult: 1.4, cvrMult: 1.15, engageMult: 1.3 },
];

// ===== Data Generation =====
function generateDailyData(): Record<string, Record<string, DailyMetrics[]>> {
  const data: Record<string, Record<string, DailyMetrics[]>> = {};

  for (const campaign of CAMPAIGN_DEFS) {
    data[campaign.id] = {};
    // Use the first geo's multiplier as the campaign multiplier
    const geoMult = GEO_MULTIPLIERS[campaign.geos[0]] || 1.0;

    for (const channel of campaign.channels) {
      const profile = CHANNEL_PROFILES[channel];
      const days: DailyMetrics[] = [];

      for (let d = 0; d < DATA_DAYS; d++) {
        const date = format(subDays(END_DATE, DATA_DAYS - 1 - d), 'yyyy-MM-dd');
        const dayOfWeek = new Date(date).getDay();
        const weekendMult = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.75 : 1.0;
        const seasonality = 1 + 0.1 * Math.sin((d / DATA_DAYS) * Math.PI * 2);

        // Check events
        let eventSpendMult = 1, eventCvrMult = 1, eventEngageMult = 1;
        for (const evt of DATA_EVENTS) {
          if (d >= evt.dayOffset && d < evt.dayOffset + evt.duration &&
              evt.geos.some(g => campaign.geos.includes(g) || g === 'national')) {
            eventSpendMult *= evt.spendMult;
            eventCvrMult *= evt.cvrMult;
            eventEngageMult *= evt.engageMult;
          }
        }

        const noise = 1 + gaussian() * profile.volatility;
        const spendBase = profile.baseSpend * campaign.budgetMultiplier * geoMult * weekendMult * seasonality * eventSpendMult * Math.max(0.3, noise);
        const spend = Math.max(10, spendBase);

        const cpm = randBetween(profile.cpmRange[0], profile.cpmRange[1]) * (1 + gaussian() * 0.1);
        const impressions = Math.round((spend / cpm) * 1000);
        const reach = Math.round(impressions * randBetween(0.6, 0.85));

        const ctr = randBetween(profile.ctrRange[0], profile.ctrRange[1]) * Math.max(0.5, 1 + gaussian() * 0.15) / 100;
        const clicks = Math.round(impressions * ctr);

        const lpvRate = randBetween(0.5, 0.8);
        const landingPageViews = Math.round(clicks * lpvRate);

        const cvr = randBetween(profile.cvrRange[0], profile.cvrRange[1]) * eventCvrMult * Math.max(0.3, 1 + gaussian() * 0.15) / 100;
        const conversions = Math.max(0, Math.round(clicks * cvr));
        const leads = Math.round(conversions * randBetween(1.5, 3));

        const avgOrderValue = randBetween(800, 3500);
        const revenue = conversions * avgOrderValue * randBetween(0.8, 1.2);

        const videoViews3s = Math.round(impressions * profile.videoViewRate * randBetween(0.8, 1.2));
        const videoViewsThruplay = Math.round(videoViews3s * profile.videoCompletionRate * randBetween(0.7, 1.3));

        const engagements = Math.round(impressions * profile.engagementMultiplier * eventEngageMult * randBetween(0.01, 0.04));
        const assistedConversions = Math.round(conversions * randBetween(0.2, 0.5));

        days.push({
          date, spend, impressions, reach, clicks, landingPageViews,
          leads, conversions, revenue, videoViews3s, videoViewsThruplay,
          engagements, assistedConversions,
        });
      }
      data[campaign.id][channel] = days;
    }
  }
  return data;
}

// ===== Aggregation =====
export function aggregateMetrics(dailyData: DailyMetrics[]): AggregatedKPIs {
  if (dailyData.length === 0) {
    return {
      date: '', spend: 0, impressions: 0, reach: 0, clicks: 0, landingPageViews: 0,
      leads: 0, conversions: 0, revenue: 0, videoViews3s: 0, videoViewsThruplay: 0,
      engagements: 0, assistedConversions: 0,
      frequency: 0, ctr: 0, cpc: 0, cpm: 0, lpvRate: 0, cpl: 0, cpa: 0, roas: 0,
      videoCompletionRate: 0, threeSecondViewRate: 0, engagementRate: 0, brandSearchLift: 0, shareOfVoice: 0,
      volatilityScore: 0, anomalyCount: 0, budgetPacing: 0, creativeFatigueIndex: 0,
    };
  }

  const sum = (key: keyof DailyMetrics) => dailyData.reduce((s, d) => s + (d[key] as number), 0);

  const spend = sum('spend');
  const impressions = sum('impressions');
  const reach = sum('reach');
  const clicks = sum('clicks');
  const landingPageViews = sum('landingPageViews');
  const leads = sum('leads');
  const conversions = sum('conversions');
  const revenue = sum('revenue');
  const videoViews3s = sum('videoViews3s');
  const videoViewsThruplay = sum('videoViewsThruplay');
  const engagements = sum('engagements');
  const assistedConversions = sum('assistedConversions');

  const frequency = reach > 0 ? impressions / reach : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const lpvRate = clicks > 0 ? (landingPageViews / clicks) * 100 : 0;
  const cpl = leads > 0 ? spend / leads : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const roas = spend > 0 ? revenue / spend : 0;
  const videoCompletionRate = videoViews3s > 0 ? (videoViewsThruplay / videoViews3s) * 100 : 0;
  const threeSecondViewRate = impressions > 0 ? (videoViews3s / impressions) * 100 : 0;
  const engagementRate = impressions > 0 ? (engagements / impressions) * 100 : 0;

  // Mock health indicators
  const spendValues = dailyData.map(d => d.spend);
  const mean = spendValues.reduce((a, b) => a + b, 0) / spendValues.length;
  const stdDev = Math.sqrt(spendValues.reduce((s, v) => s + (v - mean) ** 2, 0) / spendValues.length);
  const volatilityScore = mean > 0 ? (stdDev / mean) * 100 : 0;

  // Count anomalies in last 7 days
  const last7 = dailyData.slice(-7);
  let anomalyCount = 0;
  for (const day of last7) {
    const zScore = mean > 0 ? Math.abs(day.spend - mean) / (stdDev || 1) : 0;
    if (zScore > 2) anomalyCount++;
  }

  const brandSearchLift = 50 + rng() * 50;
  const shareOfVoice = 10 + rng() * 30;
  const budgetPacing = 82 + rng() * 13;
  const creativeFatigueIndex = 20 + rng() * 60;

  return {
    date: dailyData[dailyData.length - 1]?.date ?? '',
    spend, impressions, reach, clicks, landingPageViews, leads, conversions, revenue,
    videoViews3s, videoViewsThruplay, engagements, assistedConversions,
    frequency, ctr, cpc, cpm, lpvRate, cpl, cpa, roas,
    videoCompletionRate, threeSecondViewRate, engagementRate, brandSearchLift, shareOfVoice,
    volatilityScore, anomalyCount, budgetPacing, creativeFatigueIndex,
  };
}

export function computeDeltas(current: AggregatedKPIs, previous: AggregatedKPIs): Record<KPIKey, KPIDelta> {
  const result: Record<string, KPIDelta> = {};
  const keys: KPIKey[] = [
    'spend', 'impressions', 'reach', 'clicks', 'landingPageViews', 'leads', 'conversions', 'revenue',
    'videoViews3s', 'videoViewsThruplay', 'engagements', 'assistedConversions',
    'frequency', 'ctr', 'cpc', 'cpm', 'lpvRate', 'cpl', 'cpa', 'roas',
    'videoCompletionRate', 'threeSecondViewRate', 'engagementRate', 'brandSearchLift', 'shareOfVoice',
    'volatilityScore', 'anomalyCount', 'budgetPacing', 'creativeFatigueIndex',
  ];
  for (const key of keys) {
    const v = current[key] as number;
    const pv = previous[key] as number;
    result[key] = {
      value: v, previousValue: pv,
      delta: v - pv,
      deltaPercent: pv !== 0 ? ((v - pv) / pv) * 100 : 0,
    };
  }
  return result as Record<KPIKey, KPIDelta>;
}

// ===== Anomaly Detection =====
function detectAnomalies(dailyData: Record<string, Record<string, DailyMetrics[]>>): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const metricsToCheck: (keyof DailyMetrics)[] = ['spend', 'clicks', 'conversions', 'revenue'];

  for (const campaignDef of CAMPAIGN_DEFS) {
    for (const channel of campaignDef.channels) {
      const series = dailyData[campaignDef.id]?.[channel];
      if (!series || series.length < 30) continue;

      for (const metric of metricsToCheck) {
        const values = series.map(d => d[metric] as number);
        const rollingWindow = 30;

        for (let i = rollingWindow; i < values.length; i++) {
          const window = values.slice(i - rollingWindow, i);
          const windowMean = window.reduce((a, b) => a + b, 0) / window.length;
          const windowStd = Math.sqrt(window.reduce((s, v) => s + (v - windowMean) ** 2, 0) / window.length);

          if (windowStd === 0) continue;
          const zScore = Math.abs(values[i] - windowMean) / windowStd;

          if (zScore > 2.5) {
            const severity = zScore > 3.5 ? 'high' : zScore > 3 ? 'medium' : 'low';
            anomalies.push({
              id: `anom-${campaignDef.id}-${channel}-${metric}-${i}`,
              date: series[i].date,
              geo: campaignDef.geos[0],
              division: campaignDef.division,
              productLine: campaignDef.productLine,
              campaign: campaignDef.id,
              channel: channel,
              metric: metric as KPIKey,
              severity,
              zScore: Math.round(zScore * 100) / 100,
              description: `${metric} ${values[i] > windowMean ? 'spike' : 'drop'} in ${campaignDef.name} (${CHANNEL_LABELS[channel]}): z-score ${zScore.toFixed(1)}`,
            });
          }
        }
      }
    }
  }

  // Limit and sort by date desc
  return anomalies.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 200);
}

// ===== News Generation =====
const NEWS_SOURCES_BY_TAG: Record<string, string[]> = {
  brand: ['Financial Post', 'The Globe and Mail', 'Bloomberg', 'Reuters', 'Strategy Online', 'BNN Bloomberg'],
  banking: ['OSFI Bulletin', 'Financial Post', 'The Globe and Mail', 'Canadian Banker', 'Reuters'],
  'credit-cards': ['Financial Post', 'Ratehub.ca', 'MoneySense', 'The Globe and Mail', 'Strategy Online'],
  fintech: ['BetaKit', 'TechCrunch', 'Financial Post', 'The Logic', 'Wealthsimple Blog'],
  social: ['Reddit r/PersonalFinanceCanada', 'Reddit r/CanadianInvestor', 'TikTok #FinTok', 'Reddit r/churningcanada', 'X/Twitter Finance'],
  sports: ['TSN', 'Sportsnet', 'Golf Digest', 'Strategy Online', 'Financial Post'],
  sponsorships: ['TSN', 'Golf Digest', 'The Athletic', 'Strategy Online', 'PGA Tour'],
  competitors: ['Financial Post', 'The Globe and Mail', 'Ratehub.ca', 'MoneySense', 'RedFlagDeals'],
  macro: ['Statistics Canada', 'Bank of Canada', 'The Globe and Mail', 'Financial Post', 'Deloitte Canada'],
};

function generateNews(): NewsItem[] {
  const items: NewsItem[] = [];
  const templates: Array<{
    titleTemplate: (c?: string) => string; tags: NewsTag[]; urgency: NewsUrgency;
    summary: string; whyItMatters: string; competitor?: string;
  }> = [
    // ── 1. Brand & Corporate (3 pinned) ──
    { titleTemplate: () => 'RBC Q1 2026 Earnings Beat Expectations — Digital Banking Growth Highlighted as Key Driver', tags: ['brand'], urgency: 'high',
      summary: 'RBC reported Q1 2026 earnings above analyst expectations, with digital banking transactions up 34% year-over-year. Media coverage frames RBC as Canada\'s digital banking leader, with the CEO citing mobile-first initiatives and the ION card launch as catalysts for younger customer acquisition.',
      whyItMatters: 'Positive earnings narrative reinforces RBC\'s market leadership positioning. Media is connecting digital transformation to financial performance — amplify this story across paid channels before the news cycle moves on.' },
    { titleTemplate: () => 'RBC Avion Named #1 Travel Rewards Card in Canada by MoneySense Annual Rankings', tags: ['brand'], urgency: 'high',
      summary: 'MoneySense\'s annual credit card rankings have named RBC Avion as the #1 travel rewards card in Canada for the third consecutive year. The ranking cited superior lounge access, travel insurance coverage, and the Avion points ecosystem. Brand recall for Avion surged 18% in the week following publication.',
      whyItMatters: 'Third-party validation from a trusted source is the highest-value brand signal. This ranking should be amplified across all Avion campaigns immediately — it provides credibility that paid messaging alone cannot achieve.' },
    { titleTemplate: () => 'RBC ESG/Climate Commitments Draw Mixed Reception — Sustainability Report Under Scrutiny', tags: ['brand'], urgency: 'medium',
      summary: 'RBC\'s latest sustainability report highlights $500B in sustainable financing commitments and net-zero targets. Reception is mixed: sustainability advocates praise the direction while environmental groups question fossil fuel lending exposure. Social media discussion is polarized but engagement is high.',
      whyItMatters: 'ESG narrative requires careful management — positive signals exist but the story isn\'t fully landed. Monitor sentiment closely and consider proactive communication to control the framing before critics dominate the conversation.' },

    // ── 2. Banking Industry (3 pinned) ──
    { titleTemplate: () => 'OSFI Finalizes Open Banking Framework — Big Five Banks Given 18-Month Implementation Timeline', tags: ['banking'], urgency: 'high',
      summary: 'OSFI has finalized Canada\'s open banking framework, giving the Big Five banks 18 months to implement consumer data portability standards. The framework requires standardized APIs for account data sharing, transaction history, and product switching. Industry analysts expect this to accelerate fintech partnerships and competitive dynamics.',
      whyItMatters: 'Open banking will reshape how Canadians choose financial products. RBC must position its digital experience as the reason customers stay — marketing should emphasize the strength of RBC\'s integrated ecosystem before competitors frame data portability as a reason to switch.' },
    { titleTemplate: () => 'Bank of Canada Signals Potential Rate Cut — Mortgage and Lending Markets Respond', tags: ['banking'], urgency: 'high',
      summary: 'Bank of Canada Governor Tiff Macklem signalled a potential rate cut in upcoming decisions, citing slowing inflation and housing market concerns. Mortgage pre-approval applications surged 22% within 48 hours. Fixed-rate mortgage pricing is already adjusting downward across the Big Five.',
      whyItMatters: 'Rate cut signals drive immediate consumer action in mortgage and lending. RBC\'s mortgage campaigns should accelerate spend while consumer intent is elevated — the window for capturing rate-sensitive demand is narrow.' },
    { titleTemplate: () => 'Canadian Banking Digital Adoption Reaches 78% — Mobile-First Banks Growing 3x Faster', tags: ['banking'], urgency: 'medium',
      summary: 'Canadian Bankers Association data shows digital banking adoption has reached 78% of Canadian adults, with mobile-first interactions now exceeding branch visits by 5:1. Banks with strong mobile app experiences are acquiring customers 3x faster than those relying on branch networks.',
      whyItMatters: 'Digital adoption acceleration validates RBC\'s mobile-first investment thesis. Marketing should emphasize app experience quality and digital-exclusive features to capture the growing cohort of Canadians who will never visit a branch.' },

    // ── 3. Credit Cards (3 pinned) ──
    { titleTemplate: () => 'Canadian Credit Card Rewards War Intensifies — Avion, Aeroplan, Scene+ Battle for Premium Cardholders', tags: ['credit-cards'], urgency: 'high',
      summary: 'Competition for premium credit card customers in Canada has reached unprecedented levels. Avion, Aeroplan, and Scene+ are all increasing welcome bonuses, accelerating earn rates, and expanding lounge access. Customer acquisition costs for premium cards have risen 28% year-over-year as banks fight for high-value cardholders.',
      whyItMatters: 'The rewards war is driving up acquisition costs but also increasing consumer awareness of card benefits. RBC\'s Avion campaigns must differentiate on experience quality and ecosystem breadth, not just points — competing on sign-up bonuses alone is unsustainable.' },
    { titleTemplate: () => 'Buy Now Pay Later Regulation Coming to Canada — BNPL Providers Face New Oversight', tags: ['credit-cards'], urgency: 'medium',
      summary: 'Federal regulators have announced plans to bring Buy Now Pay Later providers under consumer protection oversight, requiring disclosure standards, credit checks, and complaint handling processes. Traditional credit card issuers may benefit as BNPL loses its regulatory arbitrage advantage.',
      whyItMatters: 'BNPL regulation levels the playing field for traditional credit cards. RBC can position credit cards as the safer, more transparent alternative — marketing should emphasize consumer protection and responsible lending as BNPL faces scrutiny.' },
    { titleTemplate: () => 'Contactless Payment Adoption in Canada Hits 92% — Tap-to-Pay Now Default Consumer Behaviour', tags: ['credit-cards'], urgency: 'medium',
      summary: 'Interac and Payments Canada report contactless payment adoption has reached 92% of Canadian card transactions. Tap-to-pay is now the default behaviour, with consumers actively avoiding merchants that require chip insertion or PIN entry. Mobile wallet integration is the next frontier.',
      whyItMatters: 'Near-universal contactless adoption means payment convenience is no longer a differentiator — it\'s table stakes. RBC should shift card marketing emphasis from tap convenience to ecosystem benefits, rewards quality, and digital wallet integration.' },

    // ── 4. Fintech (3 pinned) ──
    { titleTemplate: () => 'Wealthsimple Surpasses 4M Users — Aggressive Ad Spend on TikTok and Instagram Targeting 18-34', tags: ['fintech'], urgency: 'high',
      summary: 'Wealthsimple has surpassed 4 million users in Canada, driven by aggressive performance marketing on TikTok and Instagram targeting the 18-34 demographic. The fintech\'s ad spend has increased 180% year-over-year, with influencer partnerships and UGC-style content generating strong engagement and conversion rates.',
      whyItMatters: 'Wealthsimple is the most aggressive competitor in the young-professional investing segment — directly threatening RBC Direct Investing acquisition. RBC wealth campaigns must match Wealthsimple\'s social-native creative approach while emphasizing the depth of RBC\'s advisory and product ecosystem.' },
    { titleTemplate: () => 'EQ Bank Launches High-Interest Savings at 4.5% — Puts Pressure on Big Five Deposit Products', tags: ['fintech'], urgency: 'high',
      summary: 'EQ Bank has launched a high-interest savings account at 4.5%, significantly above Big Five savings rates averaging 1.5-2.5%. The offer is supported by a national digital campaign targeting rate-sensitive savers. Early reports suggest meaningful deposit outflows from traditional banks in the first two weeks.',
      whyItMatters: 'EQ Bank\'s rate advantage is a direct threat to RBC deposit retention. Marketing for GIC and savings products should emphasize the full value of the RBC relationship — security, integration, and advisory access — rather than competing on rate alone.' },
    { titleTemplate: () => 'Neo Financial Raises $200M Series D — Expansion into Credit Cards and Mortgages', tags: ['fintech'], urgency: 'high',
      summary: 'Neo Financial has raised $200M in Series D funding and announced plans to expand beyond its core rewards and savings products into credit cards and mortgages. The Calgary-based fintech is positioning itself as a full-service digital banking alternative to the Big Five.',
      whyItMatters: 'Neo Financial\'s expansion into credit cards and mortgages represents a direct competitive threat across RBC\'s core product lines. Monitor Neo\'s product launches and marketing positioning closely — their venture-backed aggressive pricing could capture price-sensitive segments.' },

    // ── 5. Social & Sentiment (3 pinned) ──
    { titleTemplate: () => 'r/PersonalFinanceCanada "Best Credit Card" Mega-Thread Goes Viral — 8K Upvotes, Avion Prominently Recommended', tags: ['social'], urgency: 'high',
      summary: 'A mega-thread on r/PersonalFinanceCanada asking "What\'s the best credit card in Canada right now?" has hit 8K upvotes and 2,400+ comments. RBC Avion is one of the most frequently recommended cards, with users citing travel benefits, lounge access, and points flexibility. The thread is driving significant referral traffic to RBC\'s credit card comparison page.',
      whyItMatters: 'Reddit mega-threads are high-conviction organic endorsements — they carry more credibility than paid advertising. This thread will be referenced for months. RBC should ensure its credit card landing pages are optimized for the traffic surge and consider subtle community engagement.' },
    { titleTemplate: () => 'TikTok #FinTok Creators Drive 240% Spike in TFSA Content — Young Investors Influenced by Social', tags: ['social'], urgency: 'high',
      summary: 'TikTok\'s #FinTok community has driven a 240% spike in TFSA-related content, with creators explaining contribution room, investment strategies, and account comparisons. RBC Direct Investing is mentioned in 18% of TFSA comparison videos, behind Wealthsimple (42%) but ahead of other Big Five platforms.',
      whyItMatters: '#FinTok is becoming a primary discovery channel for young investors choosing investment platforms. RBC Direct Investing needs stronger social-native content to close the awareness gap with Wealthsimple — creator partnerships and UGC-style educational content should be prioritized.' },
    { titleTemplate: () => 'r/churningcanada Community Grows to 180K — Sophisticated Consumers Optimizing Card Signup Bonuses', tags: ['social'], urgency: 'medium',
      summary: 'The r/churningcanada community has grown to 180K members, with increasingly sophisticated discussions around credit card signup bonus optimization, product switching strategies, and points maximization. RBC products are frequently discussed, with Avion\'s welcome bonus and annual fee waiver strategies being popular topics.',
      whyItMatters: 'The churning community represents a double-edged sword — they drive sign-up volume but can increase acquisition costs through bonus optimization. Understanding their behaviour helps RBC design retention-focused card strategies and anticipate promotional response patterns.' },

    // ── 6. Sports (3 pinned) ──
    { titleTemplate: () => 'RBC Canadian Open Attendance Breaks Records — 280K Visitors, Brand Activations Generate Significant Social Buzz', tags: ['sports'], urgency: 'high',
      summary: 'The RBC Canadian Open drew record attendance of 280K visitors over the tournament week. Brand activations including the RBC Experience Zone, athlete meet-and-greets, and social media content generated over 45M impressions. Post-event surveys show a 28% lift in RBC brand consideration among attendees.',
      whyItMatters: 'Record attendance validates RBC\'s investment in the Canadian Open as a premier brand activation platform. The 28% consideration lift among attendees is a strong ROI signal — post-event retargeting of attendees and social engagers should be activated immediately.' },
    { titleTemplate: () => 'Sports Sponsorship ROI for Financial Brands Hits All-Time High — 32% Lift in Brand Consideration', tags: ['sports'], urgency: 'medium',
      summary: 'Industry research shows financial services brands with active sports sponsorships are seeing a 32% lift in brand consideration and 22% higher trust scores compared to non-sponsoring competitors. Golf, hockey, and Olympic sponsorships deliver the highest ROI for banking brands in the Canadian market.',
      whyItMatters: 'Sports sponsorship ROI at all-time highs validates RBC\'s portfolio of golf, hockey, and Olympic partnerships. Consider increasing sports marketing investment to capture disproportionate brand consideration gains — especially among the 25-54 demographic that indexes highest for financial product decisions.' },
    { titleTemplate: () => 'Team RBC Athletes Win 4 Majors in 2025 — Media Value of Golf Sponsorship Portfolio Exceeds $120M', tags: ['sports'], urgency: 'medium',
      summary: 'Team RBC athletes collectively won 4 major golf championships in 2025, generating an estimated $120M in media value for the RBC brand. The wins drove significant organic social media coverage and brand association, with RBC mentions in golf media up 340% during championship weeks.',
      whyItMatters: 'Major championship wins create peak media value moments for RBC\'s golf sponsorship portfolio. The $120M media value equivalent far exceeds sponsorship costs — this data supports continued and expanded investment in Team RBC athlete partnerships.' },

    // ── 7. Sponsorships (3 pinned) ──
    { titleTemplate: () => 'RBC Canadian Open 2026 Announced at St. George\'s Golf Club — Early Ticket Sales Up 45%', tags: ['sponsorships'], urgency: 'high',
      summary: 'The 2026 RBC Canadian Open has been announced at St. George\'s Golf and Country Club in Toronto, with early ticket sales up 45% over the prior year. The tournament will feature an expanded corporate hospitality program and enhanced digital fan experiences. Media coverage is positioning the event as a must-attend for Toronto\'s business community.',
      whyItMatters: 'Strong early ticket sales indicate growing event prestige and corporate interest. RBC should leverage the announcement momentum to activate early hospitality sales, corporate partnership conversations, and pre-event brand campaigns targeting the Toronto business community.' },
    { titleTemplate: () => 'Team RBC Adds Two Rising PGA Tour Stars — Portfolio Now Spans 12 Athletes Across Golf and Olympic Sports', tags: ['sponsorships'], urgency: 'medium',
      summary: 'RBC has expanded its athlete sponsorship portfolio to 12 athletes by adding two rising PGA Tour stars with strong social media followings. The portfolio now spans professional golf and Olympic sports, providing year-round brand visibility across major sporting events and social media channels.',
      whyItMatters: 'Expanding the athlete portfolio with social-media-native athletes ensures RBC\'s sponsorship investment generates value beyond traditional broadcast — younger athletes with strong Instagram and TikTok presence create content opportunities that align with digital-first marketing strategies.' },
    { titleTemplate: () => 'RBC Community Sponsorship Program Reaches 1,200 Events Nationwide — Grassroots Brand Building', tags: ['sponsorships'], urgency: 'medium',
      summary: 'RBC\'s community sponsorship program has reached 1,200 events across every Canadian province and territory. The program spans local sports teams, cultural festivals, charitable runs, and community celebrations, generating grassroots brand presence in markets where national advertising alone cannot reach.',
      whyItMatters: 'Community sponsorship creates hyperlocal brand affinity that complements national campaigns. Each event generates organic social content and word-of-mouth — marketing should integrate community sponsorship stories into regional campaigns to create authentic local connection.' },

    // ── 8. Competitors (3 pinned) ──
    { titleTemplate: () => 'TD Launches "TD First Class Travel" Visa Infinite — Direct Competitor to Avion with 6x Points on Travel', tags: ['competitors'], urgency: 'high', competitor: 'TD',
      summary: 'TD has launched the "TD First Class Travel" Visa Infinite card offering 6x points on travel purchases, a $400 welcome bonus, and complimentary Priority Pass lounge access. The card is supported by a $15M launch campaign across TV, digital, and social channels targeting premium travellers — the same audience RBC Avion competes for.',
      whyItMatters: 'TD\'s new card is a direct competitive response to Avion\'s market leadership. The 6x travel earn rate matches Avion\'s best tier. RBC should consider a competitive response emphasizing Avion\'s broader ecosystem, established lounge network, and travel insurance superiority.' },
    { titleTemplate: () => 'Scotiabank Scene+ Integrates with Cineplex and Grocery — Lifestyle Rewards Positioning', tags: ['competitors'], urgency: 'high', competitor: 'Scotiabank',
      summary: 'Scotiabank has expanded Scene+ integration to include Cineplex entertainment and grocery partners, positioning Scene+ as a lifestyle rewards program rather than purely travel-focused. The strategy targets families and everyday spenders who value practical rewards over aspirational travel benefits.',
      whyItMatters: 'Scotiabank is differentiating Scene+ from travel-focused competitors like Avion by targeting everyday spending. RBC should monitor whether this lifestyle positioning shifts card consideration among families — the RBC Rewards program may need to emphasize its own everyday earning potential.' },
    { titleTemplate: () => 'BMO Launches "BMO alto" Digital-Only Savings Account at 4.25% — Competing with Fintech Challengers', tags: ['competitors'], urgency: 'high', competitor: 'BMO',
      summary: 'BMO has launched "BMO alto," a digital-only savings account offering 4.25% interest with no minimum balance. The product is designed to compete directly with fintech challengers like EQ Bank and Wealthsimple Cash, using BMO\'s brand trust and CDIC insurance as key differentiators against digital-native competitors.',
      whyItMatters: 'BMO alto signals that Big Five banks are taking fintech savings competition seriously. If BMO\'s digital-only approach succeeds, RBC may need a similar high-yield digital savings product to prevent deposit outflows to both fintech and Big Five competitors.' },

    // ── 9. Macro (3 pinned) ──
    { titleTemplate: () => 'Canadian Consumer Confidence Rises in Q1 2026 — But Housing Affordability Remains Top Concern', tags: ['macro'], urgency: 'high',
      summary: 'The Conference Board of Canada reports consumer confidence rose modestly in Q1 2026, driven by easing inflation and stable employment. However, housing affordability remains the #1 consumer concern, with 68% of Canadians citing it as their primary financial worry. Spending intent is cautiously positive for financial products.',
      whyItMatters: 'Rising confidence creates opportunity for financial product marketing, but housing anxiety means mortgage and homeownership messaging must be carefully calibrated. Emphasize accessibility and support rather than aspirational homeownership narratives.' },
    { titleTemplate: () => 'Bank of Canada Holds Rate at 3.25% — Signals Data-Dependent Approach for Remainder of 2026', tags: ['macro'], urgency: 'high',
      summary: 'The Bank of Canada held its benchmark rate at 3.25%, signalling a data-dependent approach for the remainder of 2026. The decision was widely expected, but the accompanying statement emphasized housing market stability concerns and global trade uncertainty as key factors in future rate decisions.',
      whyItMatters: 'Rate stability provides a predictable environment for mortgage and savings marketing. RBC should use the holding pattern to emphasize rate-lock advantages for mortgage products and competitive GIC rates while the rate environment remains attractive.' },
    { titleTemplate: () => 'Canadian Household Debt-to-Income Ratio Stabilizes at 175% — Mortgage Renewals at Higher Rates Become Key Concern', tags: ['macro'], urgency: 'medium',
      summary: 'Statistics Canada reports the household debt-to-income ratio has stabilized at 175%, with mortgage debt comprising the largest component. Approximately 2.2 million Canadian mortgages will renew in 2026-2027, many at significantly higher rates than their original terms. Financial advisors are urging proactive renewal planning.',
      whyItMatters: 'The mortgage renewal wave is a massive marketing opportunity for RBC. Proactive outreach to existing customers and competitive conquest campaigns targeting renewing borrowers at other institutions should be a priority for the mortgage marketing team.' },

    // ── Loop articles ──
    // Brand loop
    { titleTemplate: () => 'RBC Mobile App Downloads Surge 42% After Feature Update — Biometric Login and Instant E-Transfer Drive Adoption', tags: ['brand'], urgency: 'medium',
      summary: 'RBC\'s mobile banking app saw a 42% surge in downloads following a major feature update introducing biometric login and instant e-Transfer. App store ratings improved to 4.7/5.0, and mobile-first transaction volume increased significantly in the first two weeks post-update.',
      whyItMatters: 'App adoption surges create windows for cross-selling financial products to newly engaged digital customers. Marketing should capitalize on the positive sentiment with in-app product recommendations and targeted push notification campaigns.' },
    { titleTemplate: () => 'RBC Named Canada\'s Most Valuable Banking Brand — BrandZ Global Rankings Place RBC at #26 Worldwide', tags: ['brand'], urgency: 'high',
      summary: 'BrandZ\'s annual global brand valuation has ranked RBC as Canada\'s most valuable banking brand and #26 globally across all financial services brands. The ranking cited RBC\'s digital transformation leadership, sponsorship portfolio strength, and customer satisfaction scores as key drivers of brand equity growth.',
      whyItMatters: 'Global brand ranking validation provides powerful third-party credibility. This data point should be integrated into corporate brand campaigns and used as a trust signal in competitive markets where RBC faces challenges from fintech and Big Five competitors.' },
    { titleTemplate: () => 'RBC Wealth Management Client Assets Reach Record $1.2T — Advisory Platform Modernization Cited as Growth Driver', tags: ['brand'], urgency: 'medium',
      summary: 'RBC Wealth Management has reached record client assets of $1.2 trillion, driven by platform modernization and a 28% increase in new advisory relationships. The growth is concentrated in the high-net-worth and ultra-high-net-worth segments, with digital onboarding reducing client acquisition timelines by 60%.',
      whyItMatters: 'Record wealth management assets validate RBC\'s investment in advisory platform modernization. Marketing for Dominion Securities and Direct Investing should leverage the scale narrative — "Canada\'s largest wealth platform" is a compelling trust signal for high-net-worth prospects.' },

    // Banking loop
    { titleTemplate: () => 'Open Banking Pilot Programs Launch in Ontario — Early Consumer Adoption Signals Strong Demand for Data Portability', tags: ['banking'], urgency: 'medium',
      summary: 'Ontario\'s open banking pilot programs have launched with strong early consumer adoption, with 340K users connecting their bank accounts to third-party comparison tools in the first month. The pilots suggest Canadians are eager to compare financial products across institutions when given easy access to their data.',
      whyItMatters: 'Strong pilot adoption confirms that open banking will drive product comparison shopping. RBC must ensure its products compete well in side-by-side comparisons — rate transparency, fee structures, and digital experience quality will be the key differentiators.' },
    { titleTemplate: () => 'Canadian Banking Cybersecurity Standards Updated — OSFI Requires AI-Powered Fraud Detection by 2027', tags: ['banking'], urgency: 'medium',
      summary: 'OSFI has updated cybersecurity standards to require AI-powered fraud detection systems across all federally regulated banks by 2027. The new requirements include real-time transaction monitoring, behavioural biometrics, and enhanced customer authentication. Banks are investing heavily in cybersecurity infrastructure.',
      whyItMatters: 'Cybersecurity investment is both a compliance requirement and a marketing opportunity. RBC should frame its security investments as customer protection — "your money is safe with RBC" messaging resonates with consumers increasingly concerned about digital fraud.' },

    // Credit cards loop
    { titleTemplate: () => 'Premium Credit Card Applications in Canada Rise 34% — Travel Recovery Drives Demand for Rewards Cards', tags: ['credit-cards'], urgency: 'medium',
      summary: 'Premium credit card applications across Canadian banks have risen 34% year-over-year, driven by continued travel recovery and consumer demand for travel rewards, lounge access, and insurance coverage. The growth is strongest among 25-45 professionals with household income above $100K.',
      whyItMatters: 'Rising premium card demand is a tailwind for RBC Avion. Marketing should emphasize the full premium experience — lounge access, travel insurance, and concierge services — to capture high-value applicants while demand is elevated.' },
    { titleTemplate: () => 'Canadian Credit Card Spending Hits Record $65B in Q4 — E-Commerce and Travel Drive Growth', tags: ['credit-cards'], urgency: 'medium',
      summary: 'Canadian credit card spending reached a record $65B in Q4 2025, with e-commerce transactions up 28% and travel spending up 42% year-over-year. The growth is driving increased interchange revenue for card issuers and creating opportunities for targeted rewards and loyalty marketing.',
      whyItMatters: 'Record spending volume validates the overall card business model. RBC should use spending data insights to create targeted rewards campaigns — e.g., bonus points on travel categories during peak booking seasons, or accelerated earn rates for e-commerce to drive card-on-file behaviour.' },

    // Fintech loop
    { titleTemplate: () => 'Canadian Fintech Investment Reaches $3.8B in 2025 — Payments and Lending Lead Funding Categories', tags: ['fintech'], urgency: 'medium',
      summary: 'Canadian fintech investment reached $3.8B in 2025, with payments and lending startups attracting the most capital. Investor interest is concentrated in companies challenging traditional banking products — savings accounts, credit cards, and mortgage origination. Several fintechs are now pursuing banking licences.',
      whyItMatters: 'Sustained fintech investment means competition will intensify, not subside. RBC must continuously improve its digital products to match fintech user experience standards while leveraging its regulatory moat and brand trust as competitive advantages.' },
    { titleTemplate: () => 'KOHO Launches Credit Building Product — Free Alternative to Traditional Credit Cards Targets Underserved Canadians', tags: ['fintech'], urgency: 'medium',
      summary: 'KOHO has launched a credit building product that allows users to build credit scores without a traditional credit card, targeting underserved Canadians including newcomers, students, and those with limited credit history. The product is free with a premium upgrade path.',
      whyItMatters: 'KOHO\'s credit builder targets the same newcomer and student segments as RBC\'s Welcome to Canada and Student Banking campaigns. RBC should monitor KOHO\'s acquisition metrics in these segments and ensure its own onboarding experience remains competitive for credit-building customers.' },

    // Social loop
    { titleTemplate: () => 'Reddit r/PersonalFinanceCanada "Rate My Portfolio" Weekly Thread Shows Growing Interest in RBC Direct Investing', tags: ['social'], urgency: 'medium',
      summary: 'The popular weekly "Rate My Portfolio" thread on r/PersonalFinanceCanada shows growing mentions of RBC Direct Investing, with users citing the platform\'s research tools and RRSP/TFSA integration. While Wealthsimple remains the most recommended platform, RBC\'s share of positive mentions has increased 15% over the past quarter.',
      whyItMatters: 'Organic Reddit sentiment shifting toward RBC Direct Investing signals that product improvements are being noticed by the community. Marketing should monitor these threads for content inspiration and consider community engagement strategies that build on this positive momentum.' },
    { titleTemplate: () => 'TikTok "Day in My Life as a Banker" Trend Generates 180M Views — Humanizing Financial Institutions', tags: ['social'], urgency: 'low',
      summary: 'A TikTok trend featuring bank employees sharing "day in my life" content has generated 180M views globally, with Canadian bank employees prominently represented. The content humanizes financial institutions and is driving positive sentiment among younger demographics.',
      whyItMatters: 'Employee-generated content on TikTok creates authentic brand visibility at zero media cost. RBC should consider supporting employee content creation within brand guidelines — the trend humanizes the institution and resonates with demographics that distrust corporate advertising.' },

    // Sports loop
    { titleTemplate: () => 'NHL Playoffs Drive Surge in Financial Product Searches — "Best Credit Card" Queries Up 45% During Game Nights', tags: ['sports'], urgency: 'medium',
      summary: 'Google Trends data shows a 45% increase in financial product searches during NHL playoff game nights, with "best credit card," "savings account rates," and "investment app" among the most searched terms. The correlation suggests sports viewers are engaged and receptive to financial advertising during live sports.',
      whyItMatters: 'Sports viewership drives financial product consideration — a valuable insight for media planning. RBC should ensure strong search presence for key financial product terms during NHL playoff periods and align CTV and social ad delivery with game schedules.' },
    { titleTemplate: () => 'Golf Sponsorship ROI Study Shows 3.5x Return for Financial Brands — RBC Canadian Open Among Top Performers', tags: ['sports'], urgency: 'medium',
      summary: 'A new sponsorship ROI study shows financial services brands generate an average 3.5x return on golf sponsorship investment, with the RBC Canadian Open ranking among the top three performing events globally. The study attributes the high ROI to golf\'s affluent audience profile and extended brand engagement during tournament week.',
      whyItMatters: 'Quantified ROI data validates continued and expanded investment in the RBC Canadian Open. The 3.5x return figure should be used in internal budget discussions and can inform future sponsorship portfolio decisions.' },

    // Sponsorships loop
    { titleTemplate: () => 'RBC Foundation Announces $50M Community Impact Fund — Supporting Financial Literacy Across Canada', tags: ['sponsorships'], urgency: 'medium',
      summary: 'The RBC Foundation has announced a $50M community impact fund focused on financial literacy programs across Canada. The fund will support financial education in schools, newcomer financial integration programs, and small business mentorship. The announcement received positive media coverage and strong social media engagement.',
      whyItMatters: 'Community investment in financial literacy creates long-term brand affinity and customer pipeline. The announcement provides authentic content for brand campaigns and demonstrates RBC\'s commitment to financial inclusion — messaging that resonates strongly with younger demographics.' },
    { titleTemplate: () => 'Team RBC Golfer Wins First Major — Social Media Celebration Generates $18M in Brand Value for RBC', tags: ['sponsorships'], urgency: 'high',
      summary: 'A Team RBC golfer\'s first major championship victory generated an estimated $18M in brand value for RBC through broadcast logos, social media mentions, and post-victory interviews. RBC\'s congratulatory social content received 4.2M impressions and the brand was mentioned in 89% of media coverage of the victory.',
      whyItMatters: 'Major championship wins create peak brand value moments that cannot be replicated through paid media. The $18M brand value equivalent from a single victory validates the Team RBC investment model — future athlete selection should prioritize competitiveness in major championships.' },

    // Competitors loop
    { titleTemplate: () => 'CIBC Launches AI-Powered Financial Planning Tool — First Big Five Bank to Offer Automated Advice', tags: ['competitors'], urgency: 'medium', competitor: 'CIBC',
      summary: 'CIBC has launched an AI-powered financial planning tool that provides automated investment advice, retirement projections, and tax optimization strategies. The tool is available free to all CIBC clients and is being positioned as a bridge between self-directed investing and full-service advisory.',
      whyItMatters: 'CIBC\'s AI advisory tool sets a new bar for digital financial planning. If adoption is strong, other Big Five banks including RBC will face pressure to offer similar capabilities. Monitor CIBC\'s user adoption metrics and client satisfaction data for competitive intelligence.' },
    { titleTemplate: () => 'National Bank Acquires Fintech Lender — Signals Consolidation Trend Between Banks and Fintechs', tags: ['competitors'], urgency: 'medium', competitor: 'National Bank',
      summary: 'National Bank has acquired a Canadian fintech lending platform, signalling a growing trend of traditional banks acquiring fintech capabilities rather than building them internally. The acquisition gives National Bank instant access to the fintech\'s digital origination platform and 200K customer base.',
      whyItMatters: 'Bank-fintech consolidation is accelerating. RBC should evaluate whether strategic fintech acquisitions could accelerate digital product development faster than internal build — particularly in areas where fintech user experience leads traditional banking.' },
    { titleTemplate: () => 'TD Launches Cross-Border Banking Package — Targeting Canadian Snowbirds and US-Connected Customers', tags: ['competitors'], urgency: 'medium', competitor: 'TD',
      summary: 'TD has launched an integrated cross-border banking package targeting Canadian snowbirds and US-connected customers, offering seamless CAD-USD account management, competitive exchange rates, and unified digital banking across both countries. The package leverages TD\'s unique position as a major bank in both markets.',
      whyItMatters: 'TD\'s cross-border proposition exploits a structural advantage RBC cannot easily replicate. RBC should monitor whether cross-border features become a meaningful driver of customer acquisition and consider partnerships that enhance its own cross-border capabilities.' },

    // Macro loop
    { titleTemplate: () => 'Canadian Housing Market Shows Signs of Stabilization — Spring Listings Up 22% Year-Over-Year', tags: ['macro'], urgency: 'medium',
      summary: 'Canadian housing market data shows stabilization with spring listings up 22% year-over-year and price growth moderating to 3-5% annually. First-time buyer activity is increasing in suburban markets as affordability improves relative to peak 2022-2023 levels. Mortgage origination volume is expected to increase significantly in spring 2026.',
      whyItMatters: 'Housing stabilization is a green light for mortgage marketing acceleration. RBC should increase mortgage campaign spend heading into spring — first-time buyer activity increasing in suburban markets aligns perfectly with the First-Time Home Buyer campaign targeting.' },
    { titleTemplate: () => 'Canadian Employment Rate Holds Steady at 61.5% — Tech Sector Layoffs Offset by Services Growth', tags: ['macro'], urgency: 'medium',
      summary: 'Statistics Canada reports the employment rate holding steady at 61.5%, with tech sector layoffs offset by growth in healthcare, professional services, and construction. The stable employment picture supports consumer confidence and financial product demand, though income growth remains below inflation in several sectors.',
      whyItMatters: 'Stable employment supports overall financial product demand but uneven income growth means messaging must be nuanced. Value-focused positioning resonates across segments while premium messaging should be targeted to growing income cohorts.' },
    { titleTemplate: () => 'Canadian Consumer Savings Rate Rises to 6.2% — Highest Level Since 2021 as Canadians Build Financial Buffers', tags: ['macro'], urgency: 'medium',
      summary: 'The Canadian consumer savings rate has risen to 6.2%, the highest since 2021, as households prioritize financial resilience. The trend is driving demand for high-yield savings accounts, GICs, and investment products. Financial advisors report increased client interest in emergency fund planning and retirement contributions.',
      whyItMatters: 'Rising savings rates create direct demand for RBC\'s savings and investment products. GIC, TFSA, and RRSP campaigns should emphasize building financial security — messaging aligned with consumer behaviour trends will outperform aspirational wealth-building narratives in this environment.' },
  ];

  // First 27 templates are pinned (3 per category x 9 categories), rest are loop templates
  const pinnedTemplates = templates.slice(0, 27);
  const loopTemplates = templates.slice(27);

  const categoryTags: NewsTag[] = ['brand', 'banking', 'credit-cards', 'fintech', 'social', 'sports', 'sponsorships', 'competitors', 'macro'];
  const categorySources: Record<string, string[][]> = {
    brand: [['Financial Post', 'The Globe and Mail', 'Bloomberg']],
    banking: [['OSFI Bulletin', 'Financial Post', 'The Globe and Mail']],
    'credit-cards': [['Financial Post', 'Ratehub.ca', 'MoneySense']],
    fintech: [['BetaKit', 'TechCrunch', 'Financial Post']],
    social: [['Reddit r/PersonalFinanceCanada', 'TikTok #FinTok', 'Reddit r/churningcanada']],
    sports: [['TSN', 'Sportsnet', 'Golf Digest']],
    sponsorships: [['TSN', 'Golf Digest', 'Strategy Online']],
    competitors: [['Financial Post', 'The Globe and Mail', 'Ratehub.ca']],
    macro: [['Statistics Canada', 'Bank of Canada', 'The Globe and Mail']],
  };

  // Generate pinned articles (3 per category)
  categoryTags.forEach((tag, catIdx) => {
    const catTemplates = pinnedTemplates.filter(t => t.tags.includes(tag));
    const sources = categorySources[tag][0];
    catTemplates.forEach((tmpl, idx) => {
      items.push({
        id: `news-${tag}-${idx}`,
        title: tmpl.titleTemplate(),
        source: sources[idx % sources.length],
        date: format(subDays(END_DATE, catIdx + idx), 'yyyy-MM-dd'),
        tags: tmpl.tags,
        regions: ['national'] as GeoId[],
        urgency: tmpl.urgency,
        summary: tmpl.summary,
        whyItMatters: tmpl.whyItMatters,
        competitor: tmpl.competitor,
      });
    });
  });

  // Generate loop articles — one per template to avoid duplicates
  for (let i = 0; i < loopTemplates.length; i++) {
    const template = loopTemplates[i];
    const tag = template.tags[0];
    const daysAgo = randInt(0, 89);
    const date = format(subDays(END_DATE, daysAgo), 'yyyy-MM-dd');
    const sources = NEWS_SOURCES_BY_TAG[tag] || ['The Globe and Mail'];
    const geos = pickN(ALL_GEOS, randInt(1, 3));

    items.push({
      id: `news-loop-${i}`,
      title: template.titleTemplate(),
      source: pick(sources),
      date,
      tags: template.tags,
      regions: geos,
      urgency: template.urgency,
      summary: template.summary,
      whyItMatters: template.whyItMatters,
      competitor: template.competitor,
    });
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

// ===== Action Step Templates =====
const ACTION_STEP_TEMPLATES: Record<InsightCategory, Array<{ title: string; subtitle: string; type: InsightActionStep['type'] }>> = {
  performance: [
    { title: 'Optimize Budget Allocation', subtitle: 'REDISTRIBUTE SPEND ACROSS TOP AD SETS', type: 'budget' },
    { title: 'Adjust Channel Bids', subtitle: 'INCREASE BIDS ON HIGH-ROAS CHANNELS', type: 'bidding' },
    { title: 'Refine Audience Targeting', subtitle: 'NARROW TO HIGH-INTENT SEGMENTS', type: 'targeting' },
  ],
  creative: [
    { title: 'Refresh Creative Assets', subtitle: 'REPLACE FATIGUED AD UNITS WITH NEW VARIANTS', type: 'creative' },
    { title: 'A/B Test New Variants', subtitle: 'LAUNCH 3 NEW CREATIVE CONCEPTS', type: 'creative' },
    { title: 'Adjust Ad Scheduling', subtitle: 'SHIFT DELIVERY TO PEAK HOURS', type: 'scheduling' },
  ],
  competitive: [
    { title: 'Launch Conquest Campaign', subtitle: 'TARGET COMPETITOR AUDIENCES', type: 'targeting' },
    { title: 'Increase Brand Spend', subtitle: 'BOOST AWARENESS BUDGET BY 15%', type: 'budget' },
    { title: 'Adjust Bidding Strategy', subtitle: 'INCREASE BIDS ON CONTESTED TERMS', type: 'bidding' },
  ],
  platform: [
    { title: 'Update Bidding Strategy', subtitle: 'ALIGN WITH NEW ALGORITHM PREFERENCES', type: 'bidding' },
    { title: 'Adjust Ad Formats', subtitle: 'ADOPT PLATFORM-RECOMMENDED FORMATS', type: 'creative' },
    { title: 'Revise Targeting Parameters', subtitle: 'UPDATE AUDIENCE DEFINITIONS', type: 'targeting' },
  ],
  macro: [
    { title: 'Reallocate Regional Budget', subtitle: 'SHIFT SPEND TO FAVORABLE MARKETS', type: 'budget' },
    { title: 'Adjust Messaging', subtitle: 'UPDATE COPY FOR MARKET CONDITIONS', type: 'creative' },
    { title: 'Modify Flight Schedule', subtitle: 'RESCHEDULE CAMPAIGNS FOR OPTIMAL TIMING', type: 'scheduling' },
  ],
};

function generateActionSteps(category: InsightCategory, insightIndex: number): InsightActionStep[] {
  const templates = ACTION_STEP_TEMPLATES[category];
  const count = 1 + (insightIndex % 3); // 1-3 steps
  const steps: InsightActionStep[] = [];
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    steps.push({
      id: `step-${insightIndex}-${i}`,
      title: t.title,
      subtitle: t.subtitle,
      type: t.type,
      completed: false,
    });
  }
  return steps;
}

// ===== Curated Insight Generation =====
function generateInsights(_anomalies: Anomaly[]): Insight[] {
  const today = format(END_DATE, 'yyyy-MM-dd');
  const yesterday = format(subDays(END_DATE, 1), 'yyyy-MM-dd');
  const twoDaysAgo = format(subDays(END_DATE, 2), 'yyyy-MM-dd');

  const curated: Insight[] = [
    // ── CAMPAIGN group (scope=campaign, category≠creative) ──
    {
      id: 'insight-pacing-1',
      createdAt: today,
      scope: 'campaign',
      category: 'performance',
      division: 'pcb',
      productLine: 'avion',
      campaign: 'rbc-avion-travel-q1',
      channels: ['instagram', 'facebook', 'ctv'],
      title: 'Pacing to Underspend',
      recommendedAction: 'Increase daily budget or expand targeting to hit flight budget',
      summary: 'Avion Travel Q1 daily spend rate projects a $52K underspend by flight end. Expanding travel-intent lookalike audiences or increasing bid caps on CTV will close the gap before the Q1 awareness push concludes.',
      evidence: ['Projected spend: $3.148M of $3.2M budget', 'Daily run rate $2.8K below target', '18 days remaining in flight'],
      impactEstimate: '+$52K utilization',
      confidence: 88,
      status: 'new',
      actionSteps: generateActionSteps('performance', 0),
    },
    {
      id: 'insight-cpa-above',
      createdAt: twoDaysAgo,
      scope: 'campaign',
      category: 'performance',
      division: 'pcb',
      productLine: 'mortgage',
      campaign: 'rbc-mortgage-spring',
      channels: ['google-search', 'instagram', 'facebook'],
      title: 'CPA Trending Above Target',
      recommendedAction: 'Tighten targeting or reduce bid caps on broad search terms',
      summary: 'Spring Mortgage Rates cost per acquisition has risen 18% above target. Generic "mortgage rates" search terms are driving inefficiency compared to branded "RBC mortgage" queries, with non-branded CPA 2.1x higher.',
      evidence: ['Current CPA $185 vs $155 target', 'Generic terms CPA is 2.1x branded CPA', 'Bid cap exceeded on 3 ad groups'],
      impactEstimate: '-$30K efficiency',
      confidence: 79,
      status: 'new',
      actionSteps: generateActionSteps('performance', 2),
    },
    {
      id: 'insight-ion-awareness',
      createdAt: yesterday,
      scope: 'campaign',
      category: 'performance',
      division: 'pcb',
      productLine: 'ion',
      campaign: 'rbc-ion-launch',
      channels: ['tiktok', 'instagram', 'facebook', 'spotify'],
      title: 'Exceeding Awareness Benchmarks',
      recommendedAction: 'Consider shifting budget to conversion objective to capitalize on strong awareness',
      summary: 'ION Card Digital Launch is exceeding awareness benchmarks by 34%, with brand recall and consideration metrics significantly above industry norms for card launches. The campaign has built sufficient awareness to support a shift toward conversion-focused creative and targeting.',
      evidence: ['Reach exceeding target by 34%', 'Brand recall lift: 22% (benchmark: 15%)', 'Consideration intent: 2.8x above pre-campaign baseline'],
      impactEstimate: '+$85K conversion potential',
      confidence: 82,
      status: 'new',
      actionSteps: generateActionSteps('performance', 1),
    },

    // ── CROSS CHANNEL group (scope=brand|division, category≠creative) ──
    {
      id: 'insight-channel-mix',
      createdAt: today,
      scope: 'division',
      category: 'performance',
      division: 'wealth',
      channels: ['linkedin', 'google-search'],
      title: 'Channel Mix Imbalance',
      recommendedAction: 'Shift budget from LinkedIn to Google Search for wealth management campaigns',
      summary: 'LinkedIn is receiving 25% of wealth management budget but generating only 8% of conversions. Google Search shows 3.8x higher ROAS with significant room to scale — impression share is only 58% on key wealth management keywords.',
      evidence: ['LinkedIn ROAS: 1.1x vs Google Search ROAS: 4.2x', '25% budget → 8% conversions on LinkedIn', 'Google Search impression share only 58%'],
      impactEstimate: '+$42K rev potential',
      confidence: 91,
      status: 'new',
      actionSteps: generateActionSteps('performance', 3),
    },
    {
      id: 'insight-meta-diminishing',
      createdAt: yesterday,
      scope: 'brand',
      category: 'platform',
      channels: ['facebook', 'google-search'],
      title: 'Diminishing Returns on Meta',
      recommendedAction: 'Reallocate excess Facebook spend to Google Search',
      summary: 'Incremental CPA on Facebook has risen 35% as audience overlap between credit card ad sets reaches 45%. Moving $8K weekly to Search would improve blended efficiency across Avion and ION campaigns heading into TFSA season.',
      evidence: ['Facebook incremental CPA up 35% MoM', 'Audience overlap at 45% across 4 credit card ad sets', 'Google Search has 42% headroom on impression share'],
      impactEstimate: '-$6.5K CPA savings',
      confidence: 85,
      status: 'new',
      actionSteps: generateActionSteps('platform', 4),
    },
    {
      id: 'insight-freq-cap',
      createdAt: twoDaysAgo,
      scope: 'brand',
      category: 'performance',
      channels: ['instagram', 'facebook', 'tiktok', 'ttd', 'ctv'],
      title: 'Cross-Channel Frequency Cap',
      recommendedAction: 'Cap combined exposure to reduce ad fatigue',
      summary: 'Users are seeing RBC ads an average of 14.2 times per week across channels, well above the 8x optimal threshold. Excess frequency is driving CPM inflation without conversion lift, particularly among the young-professionals audience segment.',
      evidence: ['Average weekly frequency: 14.2x (target: 8x)', 'CTR drops 40% after 9th impression', 'Estimated waste: $12K/week in excess impressions'],
      impactEstimate: '-$12K waste/wk',
      confidence: 87,
      status: 'new',
      actionSteps: generateActionSteps('performance', 5),
    },
    {
      id: 'insight-channel-saturation',
      createdAt: today,
      scope: 'brand',
      category: 'performance',
      channels: ['instagram', 'tiktok'],
      title: 'Channel Saturation Detected',
      recommendedAction: 'Reduce Instagram spend on ION card campaigns and reallocate to emerging channels',
      summary: 'Instagram performance is declining as frequency climbs for ION card campaigns. The channel has reached its saturation point in the 18-34 demographic. Reallocating budget to channels with lower marginal costs will improve overall portfolio efficiency.',
      evidence: ['Frequency up 40% while CTR down 25%', 'Diminishing returns threshold exceeded', 'TikTok and Spotify showing significant headroom'],
      impactEstimate: '+$15K efficiency',
      confidence: 88,
      status: 'new',
      actionSteps: generateActionSteps('performance', 12),
    },
    {
      id: 'insight-channel-divergence',
      createdAt: yesterday,
      scope: 'brand',
      category: 'performance',
      channels: ['tiktok', 'instagram'],
      title: 'Channel Performance Divergence',
      recommendedAction: 'Reallocate spend from Instagram to TikTok for student-focused campaigns',
      summary: 'TikTok ROAS for student campaigns is up 28% while Instagram is declining 12% over the same period. This shift — likely driven by the 18-24 demographic\'s platform preference — presents an opportunity to reallocate spend toward TikTok to protect overall efficiency.',
      evidence: ['TikTok ROAS up 28% vs Instagram down 12%', 'Student audience engagement shifting to TikTok', 'TikTok algorithm favouring short-form financial education content'],
      impactEstimate: '+$22K optimization',
      confidence: 85,
      status: 'new',
      actionSteps: generateActionSteps('performance', 14),
    },

    // ── AD group (category=creative) ──
    {
      id: 'insight-fatigue-1',
      createdAt: today,
      scope: 'campaign',
      category: 'creative',
      division: 'pcb',
      productLine: 'ion',
      campaign: 'rbc-ion-launch',
      channels: ['tiktok', 'instagram', 'facebook'],
      title: 'Possible Creative Fatigue',
      recommendedAction: 'Refresh ION Launch TikTok creative with new UGC-style content and influencer variants',
      summary: 'ION Launch primary TikTok creative has been running for 21 days with CTR declining 32% over the last 14 days. Frequency has reached 7.2x in the core 18-34 audience, indicating significant ad fatigue in the young-professionals segment.',
      evidence: ['CTR declined 32% over 14 days', 'Frequency reached 7.2x in primary audience', 'Creative fatigue index: 78/100'],
      impactEstimate: '+22% CTR recovery',
      confidence: 84,
      status: 'new',
      actionSteps: generateActionSteps('creative', 6),
    },
    {
      id: 'insight-fatigue-2',
      createdAt: yesterday,
      scope: 'campaign',
      category: 'creative',
      division: 'pcb',
      productLine: 'avion',
      campaign: 'rbc-avion-retention',
      channels: ['instagram', 'facebook'],
      title: 'Possible Creative Fatigue',
      recommendedAction: 'Pause spend on underperforming loyalty video creative',
      summary: 'Avion Retention loyalty video has reached saturation with completion rates dropping below 15%. The cardholder audience has been heavily exposed over the past 3 weeks, reducing the video\'s effectiveness at driving retention engagement.',
      evidence: ['Video completion rate dropped from 28% to 14%', 'Frequency: 6.1x in cardholder audience', 'CPA increased 38% for this creative'],
      impactEstimate: '+22% VCR recovery',
      confidence: 78,
      status: 'new',
      actionSteps: generateActionSteps('creative', 7),
    },
    {
      id: 'insight-fatigue-3',
      createdAt: twoDaysAgo,
      scope: 'campaign',
      category: 'creative',
      division: 'pcb',
      productLine: 'mortgage',
      campaign: 'rbc-mortgage-spring',
      channels: ['instagram', 'facebook'],
      title: 'Possible Creative Fatigue',
      recommendedAction: 'Replace or refresh declining carousel creative',
      summary: 'Mortgage Spring Rates carousel creative shows declining engagement. Swipe rate has halved while CPC has doubled over the past 10 days, suggesting creative exhaustion among the family and young-professional audiences.',
      evidence: ['Swipe rate dropped 52% in 10 days', 'CPC increased from $2.40 to $4.85', 'Engagement rate: 1.1% (was 2.8%)'],
      impactEstimate: '+$4.2K efficiency',
      confidence: 81,
      status: 'new',
      actionSteps: generateActionSteps('creative', 8),
    },
    {
      id: 'insight-scale-top',
      createdAt: today,
      scope: 'campaign',
      category: 'creative',
      division: 'wealth',
      productLine: 'direct-investing',
      campaign: 'rbc-di-tfsa',
      channels: ['instagram', 'facebook', 'tiktok'],
      title: 'Top Performer Ready to Scale',
      recommendedAction: 'Increase budget allocation to top creative',
      summary: 'New UGC-style TFSA explainer video is outperforming all other creatives by 2.8x on ROAS. Currently capped at 12% of ad set budget — scaling to 30% is projected to significantly improve overall campaign ROAS during peak TFSA contribution season.',
      evidence: ['Creative ROAS: 5.2x vs campaign avg 1.9x', 'Only receiving 12% of ad set budget', 'No fatigue signals after 14 days'],
      impactEstimate: '+$28K rev potential',
      confidence: 92,
      status: 'new',
      actionSteps: generateActionSteps('creative', 9),
    },
    {
      id: 'insight-low-engage',
      createdAt: yesterday,
      scope: 'campaign',
      category: 'creative',
      division: 'pcb',
      productLine: 'newcomer',
      campaign: 'rbc-newcomer-welcome',
      channels: ['facebook', 'instagram'],
      title: 'Low Engagement Variant',
      recommendedAction: 'Replace or refresh underperforming creative',
      summary: 'Static "Welcome to Canada" image variant C has the lowest engagement rate across all active creatives at 0.6%. Budget is being wasted on an asset that fails to capture attention — zero conversions attributed in the last 7 days.',
      evidence: ['Engagement rate: 0.6% (campaign avg: 2.1%)', 'CTR: 0.3% vs 1.1% campaign average', 'Zero conversions attributed in last 7 days'],
      impactEstimate: '+$3.5K reallocation',
      confidence: 90,
      status: 'new',
      actionSteps: generateActionSteps('creative', 10),
    },

    // ── Additional insights ──
    {
      id: 'insight-channel-opportunity',
      createdAt: twoDaysAgo,
      scope: 'division',
      category: 'performance',
      division: 'capital-markets',
      channels: ['linkedin', 'google-search'],
      title: 'New Channel Opportunity Detected',
      recommendedAction: 'Increase LinkedIn budget for commercial lending campaigns',
      summary: 'LinkedIn is showing strong early signals for commercial lending but only receiving 5% of budget. Early ROAS at 3.2x significantly outperforms other channels for business-owner targeting. Increasing budget while reducing lowest-efficiency channels will test full scaling potential.',
      evidence: ['LinkedIn CPM 40% below portfolio average for B2B', 'Early ROAS signals at 3.2x', 'Only 5% of commercial lending budget allocated'],
      impactEstimate: '+$18K scaling potential',
      confidence: 87,
      status: 'new',
      actionSteps: generateActionSteps('performance', 15),
    },
    {
      id: 'insight-channel-dependence',
      createdAt: yesterday,
      scope: 'division',
      category: 'performance',
      division: 'wealth',
      channels: ['linkedin', 'ctv', 'ooh'],
      title: 'Excessive Channel Dependence',
      recommendedAction: 'Diversify Dominion Securities media mix to reduce single-channel risk',
      summary: 'A single channel currently accounts for 60% of total Dominion Securities spend while ROAS is declining. This over-reliance creates account instability — redistributing funds to diversified channels with comparable audience profiles will lower overall risk.',
      evidence: ['Single channel at 60% of total spend', 'Channel ROAS declining 18% MoM', 'Portfolio risk score: High'],
      impactEstimate: '-$12K risk reduction',
      confidence: 83,
      status: 'new',
      actionSteps: generateActionSteps('performance', 13),
    },
  ];

  return curated;
}

// ===== Main Data Store =====
export interface MockDataStore {
  campaigns: Campaign[];
  dailyData: Record<string, Record<string, DailyMetrics[]>>;
  newsItems: NewsItem[];
  insights: Insight[];
  anomalies: Anomaly[];
}

let cachedStore: MockDataStore | null = null;

export function generateAllData(): MockDataStore {
  if (cachedStore) return cachedStore;

  const campaigns: Campaign[] = CAMPAIGN_DEFS.map(def => ({
    id: def.id,
    name: def.name,
    division: def.division,
    agency: def.agency,
    productLine: def.productLine,
    audiences: def.audiences,
    objective: def.objective,
    status: def.status,
    channels: def.channels,
    geos: def.geos,
    startDate: format(START_DATE, 'yyyy-MM-dd'),
    plannedBudget: def.plannedBudget,
  }));

  const dailyData = generateDailyData();
  const anomalies = detectAnomalies(dailyData);
  const newsItems = generateNews();
  const insights = generateInsights(anomalies);

  cachedStore = { campaigns, dailyData, newsItems, insights, anomalies };
  return cachedStore;
}
