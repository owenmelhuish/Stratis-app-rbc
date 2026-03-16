"use client";
import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { generateAllData, aggregateMetrics, type MockDataStore } from '@/lib/mock-data';
import type { RegionId, ChannelId, AggregatedKPIs, Campaign, DailyMetrics, Anomaly, Insight, ViewLevel } from '@/types';
import { STATE_NAMES } from '@/lib/geo';
import { REGION_LABELS } from '@/types';
import { subDays, format, differenceInDays, parseISO } from 'date-fns';

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
  regionData: Array<{
    region: RegionId;
    regionLabel: string;
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
  topImproving: Array<{ label: string; region: RegionId; roasDelta: number; cpaDelta: number }>;
  topDeclining: Array<{ label: string; region: RegionId; roasDelta: number; cpaDelta: number }>;
  anomalies: Anomaly[];
  scopedInsights: Insight[];
  filteredRegions: RegionId[];
  filteredCountries: string[];
  allCampaigns: Campaign[];
  selectedCampaignObj?: Campaign;
  store: MockDataStore;
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
    dateRange, compareEnabled, selectedRegions, selectedCountries, selectedChannels,
    selectedCampaigns,
    selectedObjectives, selectedCampaignStatuses, attributionModel,
    selectedRegion, selectedCampaign,
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
    if (selectedRegions.length > 0) campaigns = campaigns.filter(c => selectedRegions.includes(c.region));
    if (selectedCountries.length > 0) {
      const countrySet = new Set(selectedCountries);
      campaigns = campaigns.filter(c => c.countries.some(cc => countrySet.has(cc)));
    }
    if (selectedObjectives.length > 0) campaigns = campaigns.filter(c => selectedObjectives.includes(c.objective));
    if (selectedCampaignStatuses.length > 0) campaigns = campaigns.filter(c => selectedCampaignStatuses.includes(c.status));
    if (selectedCampaigns.length > 0) campaigns = campaigns.filter(c => selectedCampaigns.includes(c.id));

    // Determine view level
    const viewLevel = selectedCampaign ? 'campaign' : selectedRegion ? 'region' : 'brand';

    // Get relevant campaigns for current view
    let viewCampaigns = campaigns;
    if (selectedRegion) viewCampaigns = campaigns.filter(c => c.region === selectedRegion);
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

    // Region data
    const allRegions: RegionId[] = ['north-america'];
    const regionData = allRegions.map(region => {
      const regionCamps = campaigns.filter(c => c.region === region);
      const rDays = collectDays(regionCamps, start, end, channelFilter);
      const rPrevDays = compareEnabled ? collectDays(regionCamps, prevStart, prevEnd, channelFilter) : [];
      return {
        region,
        regionLabel: REGION_LABELS[region],
        kpis: aggregateMetrics(rDays),
        previousKpis: compareEnabled ? aggregateMetrics(rPrevDays) : undefined,
        campaignCount: regionCamps.length,
      };
    });

    // Campaign data (for region view)
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
    const allChannels: ChannelId[] = ['instagram', 'facebook', 'tiktok', 'google-search', 'ttd', 'ctv', 'spotify'];
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
      const movers = regionData.map(r => {
        const roasDelta = r.previousKpis && r.previousKpis.roas > 0
          ? ((r.kpis.roas - r.previousKpis.roas) / r.previousKpis.roas) * 100 : 0;
        const cpaDelta = r.previousKpis && r.previousKpis.cpa > 0
          ? ((r.kpis.cpa - r.previousKpis.cpa) / r.previousKpis.cpa) * 100 : 0;
        return { label: r.regionLabel, region: r.region, roasDelta, cpaDelta };
      });
      topImproving = movers.filter(m => m.roasDelta > 0).sort((a, b) => b.roasDelta - a.roasDelta).slice(0, 3);
      topDeclining = movers.filter(m => m.roasDelta < 0).sort((a, b) => a.roasDelta - b.roasDelta).slice(0, 3);
    }

    // Anomalies — respect both multi-select filters and drill-down
    let anomalies = store.anomalies.filter(a => a.date >= start && a.date <= end);
    if (selectedRegions.length > 0) anomalies = anomalies.filter(a => selectedRegions.includes(a.region));
    if (selectedCampaigns.length > 0) anomalies = anomalies.filter(a => !a.campaign || selectedCampaigns.includes(a.campaign));
    if (selectedChannels.length > 0) anomalies = anomalies.filter(a => !a.channel || selectedChannels.includes(a.channel));
    if (selectedRegion) anomalies = anomalies.filter(a => a.region === selectedRegion);
    if (selectedCampaign) anomalies = anomalies.filter(a => a.campaign === selectedCampaign);

    // Scoped insights — respect both multi-select filters and drill-down
    let scopedInsights = store.insights.filter(i => i.createdAt >= start && i.createdAt <= end);
    if (selectedRegions.length > 0) scopedInsights = scopedInsights.filter(i => !i.region || selectedRegions.includes(i.region));
    if (selectedCampaigns.length > 0) scopedInsights = scopedInsights.filter(i => !i.campaign || selectedCampaigns.includes(i.campaign));
    if (selectedChannels.length > 0) scopedInsights = scopedInsights.filter(i => i.channels.length === 0 || i.channels.some(ch => selectedChannels.includes(ch)));
    if (selectedRegion) scopedInsights = scopedInsights.filter(i => !i.region || i.region === selectedRegion);
    if (selectedCampaign) scopedInsights = scopedInsights.filter(i => !i.campaign || i.campaign === selectedCampaign);

    const selectedCampaignObj = selectedCampaign ? store.campaigns.find(c => c.id === selectedCampaign) : undefined;

    // Province-level data: distribute each campaign's metrics weighted by store footprint
    // Pizza Pizza store distribution (651 locations)
    const PROVINCE_STORE_WEIGHT: Record<string, number> = {
      'ON': 0.584, 'AB': 0.126, 'QC': 0.123, 'BC': 0.083,
      'MB': 0.037, 'NS': 0.017, 'NB': 0.012, 'SK': 0.011,
      'NL': 0.005, 'PE': 0.002, 'YT': 0.002,
    };
    const stateAccum: Record<string, { spend: number; impressions: number; conversions: number; revenue: number; campaignCount: number }> = {};
    for (const cd of campaignData) {
      const provinces = cd.campaign.countries;
      if (!provinces || provinces.length === 0) continue;
      // Calculate total weight for provinces in this campaign
      const totalWeight = provinces.reduce((sum, code) => sum + (PROVINCE_STORE_WEIGHT[code] || 0.005), 0);
      for (const code of provinces) {
        const weight = (PROVINCE_STORE_WEIGHT[code] || 0.005) / totalWeight;
        if (!stateAccum[code]) stateAccum[code] = { spend: 0, impressions: 0, conversions: 0, revenue: 0, campaignCount: 0 };
        stateAccum[code].spend += cd.kpis.spend * weight;
        stateAccum[code].impressions += cd.kpis.impressions * weight;
        stateAccum[code].conversions += cd.kpis.conversions * weight;
        stateAccum[code].revenue += cd.kpis.revenue * weight;
        stateAccum[code].campaignCount += 1;
      }
    }
    let stateData: StateDatum[] = Object.entries(stateAccum).map(([code, val]) => ({
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
    if (selectedCountries.length > 0) {
      const countrySet = new Set(selectedCountries);
      stateData = stateData.filter(c => countrySet.has(c.stateCode));
    }

    return {
      viewLevel, currentKPIs, previousKPIs, timeSeries, regionData, campaignData,
      channelData: channelDataMap, stateData, topImproving, topDeclining, anomalies, scopedInsights,
      filteredRegions: selectedRegions,
      filteredCountries: selectedCountries,
      allCampaigns: store.campaigns, selectedCampaignObj, store,
    };
  }, [store, dateRange, compareEnabled, selectedRegions, selectedCountries, selectedChannels, selectedCampaigns, selectedObjectives, selectedCampaignStatuses, attributionModel, selectedRegion, selectedCampaign]);
}
