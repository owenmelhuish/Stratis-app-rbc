"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getNode, MOLECULAR_NODES } from '@/lib/molecular-graph';
import { MolecularScene } from './molecular-scene';
import { MolecularPanel } from './molecular-panel';
import type { MolecularNode } from '@/lib/molecular-graph';
import type { ChannelId, GeoId, CampaignObjective, DivisionId, AgencyId, ProductLineId, AudienceId } from '@/types';

interface MolecularFilterOverlayProps {
  onClose: () => void;
}

export function MolecularFilterOverlay({ onClose }: MolecularFilterOverlayProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<MolecularNode | null>(null);

  const {
    setSelectedDivisions, setSelectedAgencies, setSelectedProductLines,
    setSelectedAudiences, setSelectedGeos, setSelectedChannels,
    setSelectedCampaigns, setSelectedObjectives,
    setMolecularSelections, setMolecularFilterOpen,
  } = useAppStore();

  const handleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      // Click on RBC nucleus clears all
      if (id === 'rbc') {
        return new Set();
      }
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDeselect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleApply = useCallback(() => {
    const selectedNodes = Array.from(selectedIds)
      .map(id => getNode(id))
      .filter(Boolean) as MolecularNode[];

    // Group selections by filterType
    const divisions = selectedNodes.filter(n => n.filterType === 'division').map(n => n.filterValue as DivisionId);
    const agencies = selectedNodes.filter(n => n.filterType === 'agency').map(n => n.filterValue as AgencyId);
    const productLines = selectedNodes.filter(n => n.filterType === 'productLine').map(n => n.filterValue as ProductLineId);
    const audiences = selectedNodes.filter(n => n.filterType === 'audience').map(n => n.filterValue as AudienceId);
    const campaigns = selectedNodes.filter(n => n.filterType === 'campaign').map(n => n.filterValue!);
    const channels = selectedNodes.filter(n => n.filterType === 'channel').map(n => n.filterValue as ChannelId);
    const geos = selectedNodes.filter(n => n.filterType === 'geo').map(n => n.filterValue as GeoId);
    const objectives = selectedNodes.filter(n => n.filterType === 'funnel').map(n => n.filterValue as CampaignObjective);

    // Set each filter dimension in the store
    if (divisions.length > 0) setSelectedDivisions(divisions);
    if (agencies.length > 0) setSelectedAgencies(agencies);
    if (productLines.length > 0) setSelectedProductLines(productLines);
    if (audiences.length > 0) setSelectedAudiences(audiences);
    if (campaigns.length > 0) setSelectedCampaigns(campaigns);
    if (channels.length > 0) setSelectedChannels(channels);
    if (geos.length > 0) setSelectedGeos(geos);
    if (objectives.length > 0) setSelectedObjectives(objectives);

    // Persist molecular selections
    setMolecularSelections(Array.from(selectedIds));
    setMolecularFilterOpen(false);
    onClose();
  }, [selectedIds, setSelectedDivisions, setSelectedAgencies, setSelectedProductLines, setSelectedAudiences, setSelectedCampaigns, setSelectedChannels, setSelectedGeos, setSelectedObjectives, setMolecularSelections, setMolecularFilterOpen, onClose]);

  const handleCancel = useCallback(() => {
    setMolecularFilterOpen(false);
    onClose();
  }, [setMolecularFilterOpen, onClose]);

  const handleHover = useCallback((node: MolecularNode | null) => {
    setHoveredNode(node);
  }, []);

  return (
    <div className="absolute inset-0 bg-background flex">
      {/* 3D Scene */}
      <div className="flex-1 relative">
        <MolecularScene
          selectedIds={selectedIds}
          onSelect={handleSelect}
          hoveredNode={hoveredNode}
          onHover={handleHover}
        />
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card-elevated/80 backdrop-blur border border-border/30 text-muted-foreground hover:text-foreground transition-colors text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Close
        </button>
        {/* Color legend */}
        <div className="absolute bottom-4 left-4 z-10 px-3 py-2.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border/30 space-y-1">
          {[
            ['#E24B4A', 'RBC (nucleus)'],
            ['#7F77DD', 'Organization'],
            ['#1D9E75', 'Product Lines'],
            ['#D85A30', 'Audiences'],
            ['#5DCAA5', 'Campaigns'],
            ['#378ADD', 'Execution'],
          ].map(([color, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selection panel */}
      <div className="w-[280px] shrink-0 border-l border-border/30 bg-background p-4 overflow-y-auto">
        <MolecularPanel
          selectedIds={selectedIds}
          onDeselect={handleDeselect}
          onClearAll={handleClearAll}
          onApply={handleApply}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
