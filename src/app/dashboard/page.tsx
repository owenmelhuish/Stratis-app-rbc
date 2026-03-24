"use client";
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { BrandView } from '@/components/dashboard/brand-view';
import { DivisionView } from '@/components/dashboard/division-view';
import { ProductView } from '@/components/dashboard/product-view';
import { CampaignView } from '@/components/dashboard/campaign-view';
import { DashboardSkeleton } from '@/components/shared/loading-skeleton';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const selectedDivision = useAppStore(s => s.selectedDivision);
  const selectedProductLine = useAppStore(s => s.selectedProductLine);
  const selectedCampaign = useAppStore(s => s.selectedCampaign);
  const actionLog = useAppStore(s => s.actionLog);
  const viewLevel = selectedCampaign ? 'campaign' : selectedProductLine ? 'product' : selectedDivision ? 'division' : 'brand';
  const approvedCount = actionLog.filter(a => a.action === 'approved').length;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [viewLevel, selectedDivision, selectedProductLine, selectedCampaign]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          {viewLevel === 'brand' && 'Global Performance'}
          {viewLevel === 'division' && 'Division Performance'}
          {viewLevel === 'product' && 'Product Line Performance'}
          {viewLevel === 'campaign' && 'Campaign Performance'}
        </h1>
        <span className="text-[11px] text-muted-foreground/70">
          {viewLevel === 'brand' && 'All divisions & channels'}
          {viewLevel === 'division' && 'All product lines in this division'}
          {viewLevel === 'product' && 'All campaigns for this product'}
          {viewLevel === 'campaign' && "Bird's eye view across channels"}
        </span>
        {approvedCount > 0 && (
          <Badge className="bg-teal/15 text-teal text-[10px] ml-auto border-0">
            Plan updated ({approvedCount} approved)
          </Badge>
        )}
      </div>
      {viewLevel === 'brand' && <BrandView />}
      {viewLevel === 'division' && <DivisionView />}
      {viewLevel === 'product' && <ProductView />}
      {viewLevel === 'campaign' && <CampaignView />}
    </div>
  );
}
