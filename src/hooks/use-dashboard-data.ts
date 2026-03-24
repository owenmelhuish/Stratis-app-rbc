"use client";
import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { generateAllData, aggregateMetrics, type MockDataStore } from '@/lib/mock-data';
import type { DivisionId, ProductLineId, AgencyId, AudienceId, GeoId, ChannelId, AggregatedKPIs, Campaign, DailyMetrics, Anomaly, Insight, ViewLevel } from '@/types';
import { STATE_NAMES } from '@/lib/geo';
import { DIVISION_LABELS, PRODUCT_LINE_LABELS, AUDIENCE_LABELS, AGENCY_LABELS, CHANNEL_LABELS } from '@/types';
import { subDays, format, differenceInDays, parseISO } from 'date-fns';

// Geo to province mapping
const GEO_TO_PROVINCES: Record<GeoId, string[]> = {
  'national': ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'YT', 'NU'],
  'ontario': ['ON'],
  'quebec': ['QC'],
  'western': ['BC', 'AB', 'MB', 'SK'],
  'atlantic': ['NS', 'NB', 'NL', 'PE'],
};

// Province branch weight distribution (RBC branches)
const PROVINCE_BRANCH_WEIGHT: Record<string, number> = {
  'ON': 0.380, 'QC': 0.230, 'BC': 0.140, 'AB': 0.110,
  'MB': 0.035, 'SK': 0.025, 'NS': 0.025, 'NB': 0.020,
  'NL': 0.015, 'PE': 0.008, 'NT': 0.005, 'YT': 0.004, 'NU': 0.003,
};

export interface StateDatum {
  stateCode: string;
  stateName: string;
  campaignCount: number;
  spend: number;
  impressions: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  cpm: number;
}

export interface DashboardData {
  viewLevel: ViewLevel;
  currentKPIs: AggregatedKPIs;
  previousKPIs: AggregatedKPIs | null;
  timeSeries: Array<Record<string, number | string>>;
  divisionData: Array<{
    division: DivisionId;
    divisionLabel: string;
    kpis: AggregatedKPIs;
    previousKpis?: AggregatedKPIs;
    campaignCount: number;
    productCount: number;
  }>;
  productData: Array<{
    productLine: ProductLineId;
    productLabel: string;
    kpis: AggregatedKPIs;
    previousKpis?: AggregatedKPIs;
    campaignCount: number;
  }>;
  campaignData: Array<{
    campaign: Campaign;
    kpis: AggregatedKPIs;
    previousKpis?: AggregatedKPIs;
  }>;
  channelData: Record<string, AggregatedKPIs>;
  stateData: StateDatum[];
  topImproving: Array<{ label: string; division: DivisionId; roasDelta: number; cpaDelta: number }>;
  topDeclining: Array<{ label: string; division: DivisionId; roasDelta: number; cpaDelta: number }>;
  anomalies: Anomaly[];
  scopedInsights: Insight[];
  filteredGeos: GeoId[];
  allCampaigns: Campaign[];
  selectedCampaignObj?: Campaign;
  store: MockDataStore;
  funnelData: {
    stages: Array<{ id: string; label: string; volume: number; topChannels: string[] }>;
    gates: Array<{ from: string; to: string; conversionRate: number; previousRate: number | null }>;
  };
  audienceData: Array<{
    id: AudienceId; label: string; shareOfSpend: number; roas: number;
    marginalReturn: 'rising' | 'flat' | 'declining'; saturation: number;
    health: 'healthy' | 'watch' | 'over-saturated' | 'under-invested';
    action: 'scale' | 'hold' | 'reduce' | 'grow';
  }>;
  frequencyData: {
    audiences: AudienceId[]; channels: ChannelId[];
    matrix: Record<string, Record<string, number>>;
    totals: Record<string, number>;
    statuses: Record<string, 'optimal' | 'elevated' | 'over-exposed' | 'under-reached'>;
  };
  agencyData: Array<{
    id: AgencyId; label: string; managedSpend: number; campaignCount: number;
    blendedRoas: number; avgCpa: number; budgetPacing: number;
    objectiveMix: Record<string, number>; efficiencyScore: number; previousScore: number | null;
  }>;
  sankeyData: {
    divisions: Array<{ id: string; label: string; spend: number }>;
    products: Array<{ id: string; label: string; spend: number; divisionId: string }>;
    channels: Array<{ id: string; label: string; spend: number }>;
    revenue: number;
    estimatedWaste: number;
    flows: Array<{ source: string; target: string; value: number }>;
  };
  conversionValueData: Array<{
    productLine: ProductLineId; label: string; conversions: number; revenue: number;
    revenuePerConversion: number; previousRevenuePerConversion: number | null;
    trend: number; signal: 'high-value' | 'improving' | 'stable' | 'watch' | 'declining';
    sparkline: number[];
  }>;
}

function filterDailyByDate(days: DailyMetrics[], start: string, end: string): DailyMetrics[] {
  return days.filter(d => d.date >= start && d.date <= end);
}

function mergeDailyArrays(arrays: DailyMetrics[][]): DailyMetrics[] {
  const byDate: Record<string, DailyMetrics> = {};
  for (const arr of arrays) {
    for (const d of arr) {
      if (!byDate[d.date]) {
        byDate[d.date] = { ...d };
      } else {
        const existing = byDate[d.date];
        existing.spend += d.spend;
        existing.impressions += d.impressions;
        existing.reach += d.reach;
        existing.clicks += d.clicks;
        existing.landingPageViews += d.landingPageViews;
        existing.leads += d.leads;
        existing.conversions += d.conversions;
        existing.revenue += d.revenue;
        existing.videoViews3s += d.videoViews3s;
        existing.videoViewsThruplay += d.videoViewsThruplay;
        existing.engagements += d.engagements;
        existing.assistedConversions += d.assistedConversions;
      }
    }
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

export function useDashboardData(): DashboardData {
  const store = useMemo(() => generateAllData(), []);
  const {
    dateRange, compareEnabled, selectedDivisions, selectedAgencies, selectedProductLines,
    selectedAudiences, selectedGeos, selectedChannels,
    selectedCampaigns,
    selectedObjectives, selectedCampaignStatuses, attributionModel,
    selectedDivision, selectedProductLine, selectedCampaign,
  } = useAppStore();

  return useMemo(() => {
    const { start, end } = dateRange;
    const dayCount = differenceInDays(parseISO(end), parseISO(start)) || 1;
    const prevEnd = format(subDays(parseISO(start), 1), 'yyyy-MM-dd');
    const prevStart = format(subDays(parseISO(start), dayCount), 'yyyy-MM-dd');

    // Attribution multiplier
    const attrMult: Record<string, number> = { 'last-click': 1, 'first-click': 0.85, 'linear': 0.92, 'data-driven': 1.05 };
    const convMult = attrMult[attributionModel] || 1;

    // Filter campaigns
    let campaigns = store.campaigns;
    if (selectedDivisions.length > 0) campaigns = campaigns.filter(c => selectedDivisions.includes(c.division));
    if (selectedAgencies.length > 0) campaigns = campaigns.filter(c => selectedAgencies.includes(c.agency));
    if (selectedProductLines.length > 0) campaigns = campaigns.filter(c => selectedProductLines.includes(c.productLine));
    if (selectedAudiences.length > 0) campaigns = campaigns.filter(c => c.audiences.some(a => selectedAudiences.includes(a)));
    if (selectedGeos.length > 0) campaigns = campaigns.filter(c => c.geos.some(g => selectedGeos.includes(g)));
    if (selectedObjectives.length > 0) campaigns = campaigns.filter(c => selectedObjectives.includes(c.objective));
    if (selectedCampaignStatuses.length > 0) campaigns = campaigns.filter(c => selectedCampaignStatuses.includes(c.status));
    if (selectedCampaigns.length > 0) campaigns = campaigns.filter(c => selectedCampaigns.includes(c.id));

    // Determine view level
    const viewLevel: ViewLevel = selectedCampaign ? 'campaign' : selectedProductLine ? 'product' : selectedDivision ? 'division' : 'brand';

    // Get relevant campaigns for current view
    let viewCampaigns = campaigns;
    if (selectedDivision) viewCampaigns = campaigns.filter(c => c.division === selectedDivision);
    if (selectedProductLine) viewCampaigns = viewCampaigns.filter(c => c.productLine === selectedProductLine);
    if (selectedCampaign) viewCampaigns = campaigns.filter(c => c.id === selectedCampaign);

    // Collect daily data for current/previous period
    function collectDays(camps: Campaign[], periodStart: string, periodEnd: string, channels?: ChannelId[]): DailyMetrics[] {
      const allDays: DailyMetrics[][] = [];
      for (const camp of camps) {
        const campData = store.dailyData[camp.id];
        if (!campData) continue;
        for (const ch of camp.channels) {
          if (channels && channels.length > 0 && !channels.includes(ch)) continue;
          const chData = campData[ch];
          if (!chData) continue;
          const filtered = filterDailyByDate(chData, periodStart, periodEnd);
          // Apply attribution multiplier
          const adjusted = filtered.map(d => ({
            ...d,
            conversions: Math.round(d.conversions * convMult),
            revenue: d.revenue * convMult,
            assistedConversions: Math.round(d.assistedConversions * convMult),
          }));
          allDays.push(adjusted);
        }
      }
      return mergeDailyArrays(allDays);
    }

    const channelFilter = selectedChannels.length > 0 ? selectedChannels : undefined;
    const currentDays = collectDays(viewCampaigns, start, end, channelFilter);
    const previousDays = compareEnabled ? collectDays(viewCampaigns, prevStart, prevEnd, channelFilter) : [];

    const currentKPIs = aggregateMetrics(currentDays);
    const previousKPIs = compareEnabled ? aggregateMetrics(previousDays) : null;

    // Time series
    const timeSeries = currentDays.map(d => {
      const imp = d.impressions || 1;
      const clicks = d.clicks || 1;
      return {
        date: d.date,
        spend: d.spend,
        impressions: d.impressions,
        reach: d.reach,
        clicks: d.clicks,
        conversions: d.conversions,
        revenue: d.revenue,
        leads: d.leads,
        engagements: d.engagements,
        assistedConversions: d.assistedConversions,
        landingPageViews: d.landingPageViews,
        videoViews3s: d.videoViews3s,
        videoViewsThruplay: d.videoViewsThruplay,
        roas: d.spend > 0 ? d.revenue / d.spend : 0,
        ctr: (d.clicks / imp) * 100,
        cpc: d.spend / clicks,
        cpm: (d.spend / imp) * 1000,
        cpa: d.conversions > 0 ? d.spend / d.conversions : 0,
        cpl: d.leads > 0 ? d.spend / d.leads : 0,
        lpvRate: d.clicks > 0 ? (d.landingPageViews / d.clicks) * 100 : 0,
        engagementRate: (d.engagements / imp) * 100,
        threeSecondViewRate: imp > 0 ? (d.videoViews3s / imp) * 100 : 0,
        videoCompletionRate: d.videoViews3s > 0 ? (d.videoViewsThruplay / d.videoViews3s) * 100 : 0,
        frequency: d.reach > 0 ? d.impressions / d.reach : 0,
        brandSearchLift: 40 + Math.random() * 30,
        shareOfVoice: 25 + Math.random() * 20,
        budgetPacing: 80 + Math.random() * 30,
        creativeFatigueIndex: 30 + Math.random() * 40,
      };
    });

    // Division data
    const allDivisions: DivisionId[] = ['pcb', 'wealth', 'insurance', 'capital-markets'];
    const divisionData = allDivisions.map(division => {
      const divCamps = campaigns.filter(c => c.division === division);
      const dDays = collectDays(divCamps, start, end, channelFilter);
      const dPrevDays = compareEnabled ? collectDays(divCamps, prevStart, prevEnd, channelFilter) : [];
      const uniqueProducts = new Set(divCamps.map(c => c.productLine));
      return {
        division,
        divisionLabel: DIVISION_LABELS[division],
        kpis: aggregateMetrics(dDays),
        previousKpis: compareEnabled ? aggregateMetrics(dPrevDays) : undefined,
        campaignCount: divCamps.length,
        productCount: uniqueProducts.size,
      };
    });

    // Product data (when a division is selected)
    const productData = selectedDivision
      ? [...new Set(viewCampaigns.map(c => c.productLine))].map(productLine => {
          const pCamps = viewCampaigns.filter(c => c.productLine === productLine);
          const pDays = collectDays(pCamps, start, end, channelFilter);
          const pPrevDays = compareEnabled ? collectDays(pCamps, prevStart, prevEnd, channelFilter) : [];
          return {
            productLine,
            productLabel: PRODUCT_LINE_LABELS[productLine],
            kpis: aggregateMetrics(pDays),
            previousKpis: compareEnabled ? aggregateMetrics(pPrevDays) : undefined,
            campaignCount: pCamps.length,
          };
        })
      : [];

    // Campaign data (for division/product view)
    const campaignData = viewCampaigns.map(camp => {
      const cDays = collectDays([camp], start, end, channelFilter);
      const cPrevDays = compareEnabled ? collectDays([camp], prevStart, prevEnd, channelFilter) : [];
      return {
        campaign: camp,
        kpis: aggregateMetrics(cDays),
        previousKpis: compareEnabled ? aggregateMetrics(cPrevDays) : undefined,
      };
    });

    // Channel data
    const channelDataMap: Record<string, AggregatedKPIs> = {};
    const allChannels: ChannelId[] = ['instagram', 'facebook', 'tiktok', 'google-search', 'ttd', 'ctv', 'spotify', 'linkedin', 'ooh'];
    for (const ch of allChannels) {
      const chDays: DailyMetrics[][] = [];
      for (const camp of viewCampaigns) {
        if (!camp.channels.includes(ch)) continue;
        const chData = store.dailyData[camp.id]?.[ch];
        if (!chData) continue;
        const filtered = filterDailyByDate(chData, start, end).map(d => ({
          ...d, conversions: Math.round(d.conversions * convMult), revenue: d.revenue * convMult,
          assistedConversions: Math.round(d.assistedConversions * convMult),
        }));
        chDays.push(filtered);
      }
      channelDataMap[ch] = aggregateMetrics(mergeDailyArrays(chDays));
    }

    // Top movers (need compare)
    let topImproving: DashboardData['topImproving'] = [];
    let topDeclining: DashboardData['topDeclining'] = [];
    if (compareEnabled) {
      const movers = divisionData.map(d => {
        const roasDelta = d.previousKpis && d.previousKpis.roas > 0
          ? ((d.kpis.roas - d.previousKpis.roas) / d.previousKpis.roas) * 100 : 0;
        const cpaDelta = d.previousKpis && d.previousKpis.cpa > 0
          ? ((d.kpis.cpa - d.previousKpis.cpa) / d.previousKpis.cpa) * 100 : 0;
        return { label: d.divisionLabel, division: d.division, roasDelta, cpaDelta };
      });
      topImproving = movers.filter(m => m.roasDelta > 0).sort((a, b) => b.roasDelta - a.roasDelta).slice(0, 3);
      topDeclining = movers.filter(m => m.roasDelta < 0).sort((a, b) => a.roasDelta - b.roasDelta).slice(0, 3);
    }

    // Anomalies — respect both multi-select filters and drill-down
    let anomalies = store.anomalies.filter(a => a.date >= start && a.date <= end);
    if (selectedGeos.length > 0) anomalies = anomalies.filter(a => selectedGeos.includes(a.geo));
    if (selectedDivisions.length > 0) anomalies = anomalies.filter(a => !a.division || selectedDivisions.includes(a.division));
    if (selectedCampaigns.length > 0) anomalies = anomalies.filter(a => !a.campaign || selectedCampaigns.includes(a.campaign));
    if (selectedChannels.length > 0) anomalies = anomalies.filter(a => !a.channel || selectedChannels.includes(a.channel));
    if (selectedDivision) anomalies = anomalies.filter(a => a.division === selectedDivision);
    if (selectedProductLine) anomalies = anomalies.filter(a => a.productLine === selectedProductLine);
    if (selectedCampaign) anomalies = anomalies.filter(a => a.campaign === selectedCampaign);

    // Scoped insights — respect both multi-select filters and drill-down
    let scopedInsights = store.insights.filter(i => i.createdAt >= start && i.createdAt <= end);
    if (selectedDivisions.length > 0) scopedInsights = scopedInsights.filter(i => !i.division || selectedDivisions.includes(i.division));
    if (selectedCampaigns.length > 0) scopedInsights = scopedInsights.filter(i => !i.campaign || selectedCampaigns.includes(i.campaign));
    if (selectedChannels.length > 0) scopedInsights = scopedInsights.filter(i => i.channels.length === 0 || i.channels.some(ch => selectedChannels.includes(ch)));
    if (selectedDivision) scopedInsights = scopedInsights.filter(i => !i.division || i.division === selectedDivision);
    if (selectedProductLine) scopedInsights = scopedInsights.filter(i => !i.productLine || i.productLine === selectedProductLine);
    if (selectedCampaign) scopedInsights = scopedInsights.filter(i => !i.campaign || i.campaign === selectedCampaign);

    const selectedCampaignObj = selectedCampaign ? store.campaigns.find(c => c.id === selectedCampaign) : undefined;

    // Province-level data: distribute each campaign's metrics weighted by branch footprint
    const stateAccum: Record<string, { spend: number; impressions: number; conversions: number; revenue: number; campaignCount: number }> = {};
    for (const cd of campaignData) {
      // Expand geos to province codes
      const provinces: string[] = [];
      for (const geo of cd.campaign.geos) {
        const geoProv = GEO_TO_PROVINCES[geo];
        if (geoProv) {
          for (const p of geoProv) {
            if (!provinces.includes(p)) provinces.push(p);
          }
        }
      }
      if (provinces.length === 0) continue;
      // Calculate total weight for provinces in this campaign
      const totalWeight = provinces.reduce((sum, code) => sum + (PROVINCE_BRANCH_WEIGHT[code] || 0.003), 0);
      for (const code of provinces) {
        const weight = (PROVINCE_BRANCH_WEIGHT[code] || 0.003) / totalWeight;
        if (!stateAccum[code]) stateAccum[code] = { spend: 0, impressions: 0, conversions: 0, revenue: 0, campaignCount: 0 };
        stateAccum[code].spend += cd.kpis.spend * weight;
        stateAccum[code].impressions += cd.kpis.impressions * weight;
        stateAccum[code].conversions += cd.kpis.conversions * weight;
        stateAccum[code].revenue += cd.kpis.revenue * weight;
        stateAccum[code].campaignCount += 1;
      }
    }
    const stateData: StateDatum[] = Object.entries(stateAccum).map(([code, val]) => ({
      stateCode: code,
      stateName: STATE_NAMES[code] || code,
      campaignCount: val.campaignCount,
      spend: val.spend,
      impressions: Math.round(val.impressions),
      conversions: Math.round(val.conversions),
      revenue: val.revenue,
      roas: val.spend > 0 ? val.revenue / val.spend : 0,
      cpa: val.conversions > 0 ? val.spend / val.conversions : 0,
      cpm: val.impressions > 0 ? (val.spend / val.impressions) * 1000 : 0,
    }));

    // ===== Funnel Velocity Data =====
    const FUNNEL_STAGES = [
      { id: 'awareness', label: 'Awareness', objectives: ['awareness'] as string[], metric: 'impressions' as const },
      { id: 'consideration', label: 'Consideration', objectives: ['consideration'] as string[], metric: 'clicks' as const },
      { id: 'application', label: 'Application', objectives: ['conversion'] as string[], metric: 'leads' as const },
      { id: 'conversion', label: 'Conversion', objectives: ['conversion', 'retention'] as string[], metric: 'conversions' as const },
      { id: 'activation', label: 'Activation', objectives: [] as string[], metric: 'conversions' as const },
    ];
    const funnelStages = FUNNEL_STAGES.map(stage => {
      let volume = 0;
      const channelContrib: Record<string, number> = {};
      if (stage.id === 'activation') {
        const convStage = FUNNEL_STAGES.find(s => s.id === 'conversion');
        const convCamps = campaigns.filter(c => convStage!.objectives.includes(c.objective));
        const convDays = collectDays(convCamps, start, end, channelFilter);
        const convAgg = aggregateMetrics(convDays);
        volume = Math.round(convAgg.conversions * 0.73);
      } else {
        const stageCamps = campaigns.filter(c => stage.objectives.includes(c.objective));
        const sDays = collectDays(stageCamps, start, end, channelFilter);
        const sAgg = aggregateMetrics(sDays);
        volume = sAgg[stage.metric] as number;
        for (const camp of stageCamps) {
          for (const ch of camp.channels) {
            const chData = store.dailyData[camp.id]?.[ch];
            if (!chData) continue;
            const filt = filterDailyByDate(chData, start, end);
            const total = filt.reduce((s, d) => s + (d[stage.metric] as number), 0);
            channelContrib[ch] = (channelContrib[ch] || 0) + total;
          }
        }
      }
      const topChannels = Object.entries(channelContrib)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([ch]) => CHANNEL_LABELS[ch as ChannelId] || ch);
      return { id: stage.id, label: stage.label, volume, topChannels };
    });
    const funnelGates = [];
    for (let i = 0; i < funnelStages.length - 1; i++) {
      const from = funnelStages[i];
      const to = funnelStages[i + 1];
      const rate = from.volume > 0 ? (to.volume / from.volume) * 100 : 0;
      let previousRate: number | null = null;
      if (compareEnabled) {
        const fromPrev = FUNNEL_STAGES[i];
        const toPrev = FUNNEL_STAGES[i + 1];
        let fromVol = 0, toVol = 0;
        if (toPrev.id === 'activation') {
          const convCamps = campaigns.filter(c => ['conversion', 'retention'].includes(c.objective));
          const d = collectDays(convCamps, prevStart, prevEnd, channelFilter);
          toVol = Math.round(aggregateMetrics(d).conversions * 0.73);
        } else {
          const toCamps = campaigns.filter(c => toPrev.objectives.includes(c.objective));
          toVol = aggregateMetrics(collectDays(toCamps, prevStart, prevEnd, channelFilter))[toPrev.metric] as number;
        }
        if (fromPrev.id === 'activation') {
          fromVol = toVol;
        } else {
          const fromCamps = campaigns.filter(c => fromPrev.objectives.includes(c.objective));
          fromVol = aggregateMetrics(collectDays(fromCamps, prevStart, prevEnd, channelFilter))[fromPrev.metric] as number;
        }
        previousRate = fromVol > 0 ? (toVol / fromVol) * 100 : 0;
      }
      funnelGates.push({ from: from.id, to: to.id, conversionRate: rate, previousRate });
    }
    const funnelData = { stages: funnelStages, gates: funnelGates };

    // ===== Audience Portfolio Data =====
    const allAudienceIds: AudienceId[] = ['young-professionals', 'families', 'new-canadians', 'high-net-worth', 'students', 'retirees', 'business-owners', 'mass-market'];
    const avgRoas = currentKPIs.spend > 0 ? currentKPIs.revenue / currentKPIs.spend : 0;
    const totalSpend = currentKPIs.spend;
    const audienceData = allAudienceIds.map(audId => {
      let audSpend = 0, audRevenue = 0, audImpressions = 0, audReach = 0;
      let recentSpend = 0, recentRevenue = 0, priorSpend = 0, priorRevenue = 0;
      const midDate = format(subDays(parseISO(end), 7), 'yyyy-MM-dd');
      const priorStart = format(subDays(parseISO(midDate), 7), 'yyyy-MM-dd');
      const priorEnd = format(subDays(parseISO(midDate), 1), 'yyyy-MM-dd');

      for (const camp of viewCampaigns) {
        if (!camp.audiences.includes(audId)) continue;
        const splitFactor = 1 / camp.audiences.length;
        for (const ch of camp.channels) {
          if (channelFilter && !channelFilter.includes(ch)) continue;
          const chData = store.dailyData[camp.id]?.[ch];
          if (!chData) continue;
          const days = filterDailyByDate(chData, start, end);
          for (const d of days) {
            audSpend += d.spend * splitFactor;
            audRevenue += d.revenue * splitFactor;
            audImpressions += d.impressions * splitFactor;
            audReach += d.reach * splitFactor;
          }
          // Marginal return sub-periods
          const recentD = filterDailyByDate(chData, midDate, end);
          for (const d of recentD) { recentSpend += d.spend * splitFactor; recentRevenue += d.revenue * splitFactor; }
          const priorD = filterDailyByDate(chData, priorStart, priorEnd);
          for (const d of priorD) { priorSpend += d.spend * splitFactor; priorRevenue += d.revenue * splitFactor; }
        }
      }

      const roas = audSpend > 0 ? audRevenue / audSpend : 0;
      const shareOfSpend = totalSpend > 0 ? (audSpend / totalSpend) * 100 : 0;
      const freq = audReach > 0 ? audImpressions / audReach : 0;
      const saturation = Math.min(100, (freq / 15) * 100);
      const recentRoas = recentSpend > 0 ? recentRevenue / recentSpend : 0;
      const priorRoas = priorSpend > 0 ? priorRevenue / priorSpend : 0;
      const marginalReturn: 'rising' | 'flat' | 'declining' = recentRoas > priorRoas * 1.05 ? 'rising' : recentRoas < priorRoas * 0.95 ? 'declining' : 'flat';

      const aboveAvg = roas >= avgRoas * 0.9;
      const belowAvg = roas < avgRoas * 0.9;
      const lowShare = shareOfSpend < (100 / allAudienceIds.length) * 0.6;
      let health: 'healthy' | 'watch' | 'over-saturated' | 'under-invested' = 'healthy';
      let action: 'scale' | 'hold' | 'reduce' | 'grow' = 'hold';
      if (lowShare && aboveAvg && saturation < 40) { health = 'under-invested'; action = 'grow'; }
      else if (aboveAvg && saturation < 50) { health = 'healthy'; action = 'scale'; }
      else if (aboveAvg && saturation < 70) { health = 'watch'; action = 'hold'; }
      else if (belowAvg && saturation > 60) { health = 'over-saturated'; action = 'reduce'; }
      else if (belowAvg) { health = 'watch'; action = 'reduce'; }
      else { health = 'healthy'; action = 'hold'; }
      return { id: audId, label: AUDIENCE_LABELS[audId], shareOfSpend, roas, marginalReturn, saturation, health, action };
    });

    // ===== Channel Frequency Data (spend-based model) =====
    const AUDIENCE_SIZE_ESTIMATES: Record<string, number> = {
      'young-professionals': 4_500_000, 'families': 5_200_000, 'new-canadians': 1_200_000,
      'high-net-worth': 800_000, 'students': 2_800_000, 'retirees': 3_500_000,
      'business-owners': 1_500_000, 'mass-market': 12_000_000,
    };
    const CHANNEL_REACH_RATES: Record<string, Record<string, number>> = {
      'young-professionals': { 'instagram': 0.75, 'facebook': 0.65, 'tiktok': 0.60, 'google-search': 0.80, 'ttd': 0.40, 'ctv': 0.35, 'spotify': 0.55, 'linkedin': 0.50, 'ooh': 0.30 },
      'families': { 'instagram': 0.65, 'facebook': 0.70, 'tiktok': 0.30, 'google-search': 0.75, 'ttd': 0.45, 'ctv': 0.55, 'spotify': 0.35, 'linkedin': 0.25, 'ooh': 0.40 },
      'new-canadians': { 'instagram': 0.70, 'facebook': 0.75, 'tiktok': 0.40, 'google-search': 0.65, 'ttd': 0.20, 'ctv': 0.15, 'spotify': 0.25, 'linkedin': 0.35, 'ooh': 0.20 },
      'high-net-worth': { 'instagram': 0.45, 'facebook': 0.40, 'tiktok': 0.10, 'google-search': 0.70, 'ttd': 0.35, 'ctv': 0.50, 'spotify': 0.20, 'linkedin': 0.65, 'ooh': 0.45 },
      'students': { 'instagram': 0.85, 'facebook': 0.55, 'tiktok': 0.80, 'google-search': 0.60, 'ttd': 0.15, 'ctv': 0.10, 'spotify': 0.70, 'linkedin': 0.05, 'ooh': 0.15 },
      'retirees': { 'instagram': 0.25, 'facebook': 0.50, 'tiktok': 0.05, 'google-search': 0.65, 'ttd': 0.30, 'ctv': 0.45, 'spotify': 0.10, 'linkedin': 0.30, 'ooh': 0.35 },
      'business-owners': { 'instagram': 0.45, 'facebook': 0.50, 'tiktok': 0.15, 'google-search': 0.75, 'ttd': 0.25, 'ctv': 0.20, 'spotify': 0.15, 'linkedin': 0.70, 'ooh': 0.25 },
      'mass-market': { 'instagram': 0.60, 'facebook': 0.65, 'tiktok': 0.35, 'google-search': 0.70, 'ttd': 0.40, 'ctv': 0.45, 'spotify': 0.30, 'linkedin': 0.20, 'ooh': 0.35 },
    };
    const freqAudiences = allAudienceIds;
    const freqChannels: ChannelId[] = ['instagram', 'facebook', 'tiktok', 'google-search', 'ttd', 'ctv', 'spotify', 'linkedin', 'ooh'];
    const matrix: Record<string, Record<string, number>> = {};
    const totals: Record<string, number> = {};
    const freqStatuses: Record<string, 'optimal' | 'elevated' | 'over-exposed' | 'under-reached'> = {};
    const weeks = Math.max(1, dayCount / 7);
    for (const aud of freqAudiences) {
      matrix[aud] = {};
      let totalFreq = 0;
      for (const ch of freqChannels) {
        let cellWeeklySpend = 0, cellAvgCPM = 0, cellSpendCount = 0;
        for (const camp of viewCampaigns) {
          if (!camp.audiences.includes(aud)) continue;
          if (!camp.channels.includes(ch)) continue;
          const splitFactor = 1 / camp.audiences.length;
          const chData = store.dailyData[camp.id]?.[ch];
          if (!chData) continue;
          const days = filterDailyByDate(chData, start, end);
          let chSpend = 0, chImpressions = 0;
          for (const d of days) { chSpend += d.spend * splitFactor; chImpressions += d.impressions * splitFactor; }
          cellWeeklySpend += chSpend / weeks;
          if (chImpressions > 0 && chSpend > 0) { cellAvgCPM += (chSpend / chImpressions) * 1000; cellSpendCount++; }
        }
        if (cellWeeklySpend <= 0 || cellSpendCount === 0) {
          matrix[aud][ch] = 0;
        } else {
          const avgCPM = cellAvgCPM / cellSpendCount;
          const weeklyImpressions = (cellWeeklySpend / avgCPM) * 1000;
          const audienceSize = AUDIENCE_SIZE_ESTIMATES[aud] || 3_000_000;
          const channelReach = CHANNEL_REACH_RATES[aud]?.[ch] || 0.3;
          const reachableAudience = audienceSize * channelReach;
          const freq = reachableAudience > 0 ? weeklyImpressions / reachableAudience : 0;
          matrix[aud][ch] = Math.round(freq * 10) / 10;
        }
        totalFreq += matrix[aud][ch];
      }
      totals[aud] = Math.round(totalFreq * 10) / 10;
      freqStatuses[aud] = totalFreq < 6 ? 'under-reached' : totalFreq <= 8 ? 'optimal' : totalFreq <= 12 ? 'elevated' : 'over-exposed';
    }
    const frequencyData = { audiences: freqAudiences, channels: freqChannels, matrix, totals, statuses: freqStatuses };

    // ===== Agency Benchmarking Data =====
    const allAgencyIds: AgencyId[] = ['omnicom', 'publicis', 'wpp', 'in-house', 'other'];
    const agencyData = allAgencyIds.map(agId => {
      const agCamps = campaigns.filter(c => c.agency === agId);
      if (agCamps.length === 0) return null;
      const aDays = collectDays(agCamps, start, end, channelFilter);
      const aKpis = aggregateMetrics(aDays);
      const blendedRoas = aKpis.spend > 0 ? aKpis.revenue / aKpis.spend : 0;
      const avgCpa = aKpis.conversions > 0 ? aKpis.spend / aKpis.conversions : 0;
      const budgetPacing = aKpis.budgetPacing;
      // Objective mix
      const objCounts: Record<string, number> = {};
      for (const c of agCamps) { objCounts[c.objective] = (objCounts[c.objective] || 0) + 1; }
      const objTotal = agCamps.length;
      const objectiveMix: Record<string, number> = {};
      for (const [obj, cnt] of Object.entries(objCounts)) { objectiveMix[obj] = Math.round((cnt / objTotal) * 100); }
      // Efficiency score
      const avgAllRoas = avgRoas || 1;
      const avgAllCpa = currentKPIs.conversions > 0 ? currentKPIs.spend / currentKPIs.conversions : 1;
      const baseScore = (blendedRoas / avgAllRoas) * 50 + (1 - avgCpa / (avgAllCpa * 2)) * 30 + (budgetPacing / 100) * 20;
      const efficiencyScore = Math.max(0, Math.min(100, Math.round(baseScore)));
      // Previous score
      let previousScore: number | null = null;
      if (compareEnabled) {
        const pDays = collectDays(agCamps, prevStart, prevEnd, channelFilter);
        const pKpis = aggregateMetrics(pDays);
        const pRoas = pKpis.spend > 0 ? pKpis.revenue / pKpis.spend : 0;
        const pCpa = pKpis.conversions > 0 ? pKpis.spend / pKpis.conversions : 0;
        const pBase = (pRoas / avgAllRoas) * 50 + (1 - pCpa / (avgAllCpa * 2)) * 30 + (pKpis.budgetPacing / 100) * 20;
        previousScore = Math.max(0, Math.min(100, Math.round(pBase)));
      }
      return {
        id: agId, label: AGENCY_LABELS[agId], managedSpend: aKpis.spend,
        campaignCount: agCamps.length, blendedRoas, avgCpa, budgetPacing,
        objectiveMix, efficiencyScore, previousScore,
      };
    }).filter(Boolean) as DashboardData['agencyData'];

    // ===== Sankey Data =====
    const sankeyDivMap: Record<string, number> = {};
    const sankeyProdMap: Record<string, { spend: number; divisionId: string }> = {};
    const sankeyChanMap: Record<string, { spend: number; revenue: number }> = {};
    const sankeyFlowMap: Record<string, number> = {};

    for (const camp of viewCampaigns) {
      let campTotal = 0;
      for (const ch of camp.channels) {
        const chData = store.dailyData[camp.id]?.[ch];
        if (!chData) continue;
        const days = filterDailyByDate(chData, start, end);
        const chSpend = days.reduce((s, d) => s + d.spend, 0);
        const chRev = days.reduce((s, d) => s + d.revenue, 0);
        campTotal += chSpend;
        // Channel totals
        if (!sankeyChanMap[ch]) sankeyChanMap[ch] = { spend: 0, revenue: 0 };
        sankeyChanMap[ch].spend += chSpend;
        sankeyChanMap[ch].revenue += chRev;
        // Product → Channel flow
        const pcKey = `prod-${camp.productLine}|ch-${ch}`;
        sankeyFlowMap[pcKey] = (sankeyFlowMap[pcKey] || 0) + chSpend;
      }
      // Division total
      sankeyDivMap[camp.division] = (sankeyDivMap[camp.division] || 0) + campTotal;
      // Product total
      if (!sankeyProdMap[camp.productLine]) sankeyProdMap[camp.productLine] = { spend: 0, divisionId: camp.division };
      sankeyProdMap[camp.productLine].spend += campTotal;
      // Division → Product flow
      const dpKey = `div-${camp.division}|prod-${camp.productLine}`;
      sankeyFlowMap[dpKey] = (sankeyFlowMap[dpKey] || 0) + campTotal;
    }

    // Channel → Outcome flows
    let sankeyRevenue = 0;
    let sankeyWaste = 0;
    for (const [ch, { spend: chSpend, revenue: chRev }] of Object.entries(sankeyChanMap)) {
      const roas = chSpend > 0 ? chRev / chSpend : 0;
      const wasteRatio = roas < 1.0 ? 0.50 : roas < 1.5 ? 0.30 : roas < 2.5 ? 0.15 : 0.05;
      const wasteAmt = chSpend * wasteRatio;
      const revFlow = chSpend - wasteAmt;
      sankeyFlowMap[`ch-${ch}|revenue`] = (sankeyFlowMap[`ch-${ch}|revenue`] || 0) + revFlow;
      sankeyFlowMap[`ch-${ch}|waste`] = (sankeyFlowMap[`ch-${ch}|waste`] || 0) + wasteAmt;
      sankeyRevenue += chRev;
      sankeyWaste += wasteAmt;
    }

    const sankeyFlows = Object.entries(sankeyFlowMap)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => { const [source, target] = key.split('|'); return { source, target, value }; });

    const sankeyData: DashboardData['sankeyData'] = {
      divisions: Object.entries(sankeyDivMap).map(([id, spend]) => ({ id: `div-${id}`, label: DIVISION_LABELS[id as DivisionId] || id, spend })),
      products: Object.entries(sankeyProdMap).map(([id, { spend, divisionId }]) => ({ id: `prod-${id}`, label: PRODUCT_LINE_LABELS[id as ProductLineId] || id, spend, divisionId })),
      channels: Object.entries(sankeyChanMap).map(([id, { spend }]) => ({ id: `ch-${id}`, label: CHANNEL_LABELS[id as ChannelId] || id, spend })),
      revenue: sankeyRevenue,
      estimatedWaste: sankeyWaste,
      flows: sankeyFlows,
    };

    // ===== Conversion Value Data =====
    const cvProdMap: Record<string, { conversions: number; revenue: number; dailyBuckets: Record<string, { conversions: number; revenue: number }> }> = {};
    for (const camp of viewCampaigns) {
      const pl = camp.productLine;
      if (!cvProdMap[pl]) cvProdMap[pl] = { conversions: 0, revenue: 0, dailyBuckets: {} };
      for (const ch of camp.channels) {
        const chData = store.dailyData[camp.id]?.[ch];
        if (!chData) continue;
        const days = filterDailyByDate(chData, start, end);
        for (const d of days) {
          cvProdMap[pl].conversions += d.conversions;
          cvProdMap[pl].revenue += d.revenue;
          if (!cvProdMap[pl].dailyBuckets[d.date]) cvProdMap[pl].dailyBuckets[d.date] = { conversions: 0, revenue: 0 };
          cvProdMap[pl].dailyBuckets[d.date].conversions += d.conversions;
          cvProdMap[pl].dailyBuckets[d.date].revenue += d.revenue;
        }
      }
    }
    // Always compute previous period for conversion value trends
    const cvPrevMap: Record<string, { conversions: number; revenue: number }> = {};
    for (const camp of viewCampaigns) {
      const pl = camp.productLine;
      if (!cvPrevMap[pl]) cvPrevMap[pl] = { conversions: 0, revenue: 0 };
      for (const ch of camp.channels) {
        const chData = store.dailyData[camp.id]?.[ch];
        if (!chData) continue;
        const days = filterDailyByDate(chData, prevStart, prevEnd);
        for (const d of days) {
          cvPrevMap[pl].conversions += d.conversions;
          cvPrevMap[pl].revenue += d.revenue;
        }
      }
    }
    // Build result
    const cvEntries = Object.entries(cvProdMap)
      .filter(([, v]) => v.conversions > 0)
      .map(([pl, data]) => {
        const rpc = data.revenue / data.conversions;
        const prev = cvPrevMap[pl];
        const prevRpc = prev && prev.conversions > 0 ? prev.revenue / prev.conversions : null;
        const trend = prevRpc !== null && prevRpc > 0 ? ((rpc - prevRpc) / prevRpc) * 100 : 0;
        // Sparkline
        const sortedDates = Object.keys(data.dailyBuckets).sort();
        const totalDays = sortedDates.length;
        const bucketSize = Math.max(1, Math.floor(totalDays / 10));
        const sparkline: number[] = [];
        for (let i = 0; i < 10; i++) {
          const bStart = i * bucketSize;
          const bEnd = Math.min((i + 1) * bucketSize, totalDays);
          const slice = sortedDates.slice(bStart, bEnd);
          let bConv = 0, bRev = 0;
          for (const dt of slice) { bConv += data.dailyBuckets[dt].conversions; bRev += data.dailyBuckets[dt].revenue; }
          sparkline.push(bConv > 0 ? bRev / bConv : 0);
        }
        return { productLine: pl as ProductLineId, label: PRODUCT_LINE_LABELS[pl as ProductLineId] || pl, conversions: data.conversions, revenue: data.revenue, revenuePerConversion: rpc, previousRevenuePerConversion: prevRpc, trend, signal: 'stable' as const, sparkline };
      })
      .sort((a, b) => b.revenuePerConversion - a.revenuePerConversion);
    // Assign signals
    const rpcValues = cvEntries.map(e => e.revenuePerConversion).sort((a, b) => b - a);
    const top25 = rpcValues[Math.floor(rpcValues.length * 0.25)] || rpcValues[0] || 0;
    const conversionValueData: DashboardData['conversionValueData'] = cvEntries.map(e => {
      let signal: DashboardData['conversionValueData'][0]['signal'] = 'stable';
      if (e.revenuePerConversion >= top25 && e.trend > 5) signal = 'high-value';
      else if (e.trend > 15) signal = 'improving';
      else if (e.trend >= -5 && e.trend <= 5) signal = 'stable';
      else if (e.trend >= -15 && e.trend < -5) signal = 'watch';
      else if (e.trend < -15) signal = 'declining';
      return { ...e, signal };
    });

    return {
      viewLevel, currentKPIs, previousKPIs, timeSeries, divisionData, productData, campaignData,
      channelData: channelDataMap, stateData, topImproving, topDeclining, anomalies, scopedInsights,
      filteredGeos: selectedGeos,
      allCampaigns: store.campaigns, selectedCampaignObj, store,
      funnelData, audienceData, frequencyData, agencyData, sankeyData, conversionValueData,
    };
  }, [store, dateRange, compareEnabled, selectedDivisions, selectedAgencies, selectedProductLines, selectedAudiences, selectedGeos, selectedChannels, selectedCampaigns, selectedObjectives, selectedCampaignStatuses, attributionModel, selectedDivision, selectedProductLine, selectedCampaign]);
}
