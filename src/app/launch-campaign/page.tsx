"use client";
import React, { useMemo, useState } from 'react';
import { Rocket, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CampaignEssentials } from '@/components/launch-campaign/campaign-essentials';
import { BriefSection } from '@/components/launch-campaign/brief-section';
import { ObjectivesKpis } from '@/components/launch-campaign/objectives-kpis';
import { AudienceGeo } from '@/components/launch-campaign/audience-geo';
import { TimelineBudget } from '@/components/launch-campaign/timeline-budget';
import { ChannelGrid } from '@/components/launch-campaign/channel-grid';
import { StratisContextPanel } from '@/components/launch-campaign/stratis-context-panel';
import { GeneratingOverlay } from '@/components/launch-campaign/generating-overlay';
import { SuccessRecap } from '@/components/launch-campaign/success-recap';

type SubmitState = 'idle' | 'generating' | 'success';

export default function LaunchCampaignPage() {
  const draft = useAppStore((s) => s.draftCampaign);
  const resetDraft = useAppStore((s) => s.resetDraftCampaign);

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [showErrors, setShowErrors] = useState(false);

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!draft.name.trim()) e.push('Campaign name');
    if (!draft.division) e.push('Division');
    if (!draft.productLine) e.push('Product line');
    if (!draft.objective) e.push('Primary objective');
    if (draft.channels.length === 0) e.push('At least one channel');
    const budgetNum = Number(draft.plannedBudget.replace(/[^0-9.]/g, ''));
    if (!budgetNum || budgetNum <= 0) e.push('Planned budget');
    if (!draft.startDate) e.push('Start date');
    return e;
  }, [draft]);

  const handleGenerate = () => {
    if (errors.length > 0) {
      setShowErrors(true);
      document.getElementById('launch-errors')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setShowErrors(false);
    setSubmitState('generating');
  };

  const handleStartAnother = () => {
    resetDraft();
    setSubmitState('idle');
    setShowErrors(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitState === 'generating') {
    return <GeneratingOverlay onDone={() => setSubmitState('success')} />;
  }

  if (submitState === 'success') {
    return <SuccessRecap onStartAnother={handleStartAnother} />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 border border-teal/30">
          <Rocket className="h-5 w-5 text-teal" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Launch Campaign</h1>
            <Badge className="bg-teal/15 text-teal border-0 text-[10px] font-semibold">
              Preview
            </Badge>
          </div>
          <p className="text-[12.5px] text-muted-foreground/80 mt-0.5">
            Hand STRATIS everything it needs. The more context you give, the sharper the strategy it generates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        {/* Left: briefing canvas */}
        <div className="space-y-4 min-w-0">
          {showErrors && errors.length > 0 && (
            <div
              id="launch-errors"
              className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4"
            >
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="text-[12.5px]">
                <p className="font-medium text-destructive">Complete these before STRATIS can generate a strategy:</p>
                <p className="text-destructive/80 mt-1">{errors.join(' · ')}</p>
              </div>
            </div>
          )}

          <CampaignEssentials />
          <BriefSection />
          <ObjectivesKpis />
          <AudienceGeo />
          <TimelineBudget />
          <ChannelGrid />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            <Button
              type="button"
              size="lg"
              onClick={handleGenerate}
              className="bg-teal text-primary-foreground hover:bg-teal/90 gap-2 font-semibold"
            >
              <Rocket className="h-4 w-4" />
              Generate Strategy
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => {
                if (confirm('Clear the current brief? This cannot be undone.')) {
                  resetDraft();
                  setShowErrors(false);
                }
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear draft
            </Button>
            <p className="text-[11px] text-muted-foreground/60 sm:ml-auto">
              Draft auto-saves as you type.
            </p>
          </div>
        </div>

        {/* Right: STRATIS context */}
        <aside className="lg:sticky lg:top-0">
          <StratisContextPanel />
        </aside>
      </div>
    </div>
  );
}
