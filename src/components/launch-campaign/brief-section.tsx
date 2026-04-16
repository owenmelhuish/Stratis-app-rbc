"use client";
import React, { useRef, useState } from 'react';
import { FileText, X, FileUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SectionCard } from './section-card';

const ACCEPTED = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.md';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BriefSection() {
  const draft = useAppStore((s) => s.draftCampaign);
  const setField = useAppStore((s) => s.setDraftCampaignField);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const filled = draft.briefNarrative.trim().length > 20 || draft.briefFile !== null;

  const handleFile = (file: File) => {
    setField('briefFile', { name: file.name, size: file.size, type: file.type || 'unknown' });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <SectionCard
      id="brief"
      number={2}
      title="The Brief"
      subtitle="Upload the brief, write the narrative, or both. The more context, the sharper the strategy."
      filled={filled}
    >
      {/* Upload zone */}
      <div className="space-y-2">
        <Label className="text-[12px] text-muted-foreground">Upload brief (optional)</Label>
        {draft.briefFile ? (
          <div className="flex items-center gap-3 rounded-lg border border-teal/40 bg-teal/10 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/20 shrink-0">
              <FileText className="h-4 w-4 text-teal" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate">{draft.briefFile.name}</p>
              <p className="text-[11px] text-muted-foreground/70 tabular-nums">
                {formatSize(draft.briefFile.size)} · STRATIS will extract context from this document
              </p>
            </div>
            <button
              type="button"
              onClick={() => setField('briefFile', null)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-card-elevated/60 hover:text-foreground transition-colors"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-all",
              isDragging
                ? "border-teal bg-teal/10"
                : "border-border/60 bg-card-elevated/30 hover:border-teal/50 hover:bg-card-elevated/50"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card-elevated/80 group-hover:bg-teal/15 transition-colors">
              <FileUp className="h-5 w-5 text-muted-foreground group-hover:text-teal transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-foreground">
                Drop a brief here, or <span className="text-teal underline underline-offset-2">browse</span>
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                PDF, DOCX, PPT, TXT · STRATIS ingests documents as first-class context
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 h-px bg-border/30" />
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">or write it</span>
        <div className="flex-1 h-px bg-border/30" />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="brief-narrative" className="text-[12px] text-muted-foreground">
            What is this campaign about?
          </Label>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">
            {draft.briefNarrative.length} chars
          </span>
        </div>
        <Textarea
          id="brief-narrative"
          placeholder="The business problem we're solving, the moment in market, the consumer tension, the opportunity STRATIS should act on…"
          value={draft.briefNarrative}
          onChange={(e) => setField('briefNarrative', e.target.value)}
          className="min-h-[140px] resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brief-success" className="text-[12px] text-muted-foreground">
          What does success look like?
        </Label>
        <Textarea
          id="brief-success"
          placeholder="If this campaign lands, what happens for the business? Be specific — targets, behaviors, stories you'd tell the exec team."
          value={draft.successCriteria}
          onChange={(e) => setField('successCriteria', e.target.value)}
          className="min-h-[90px] resize-y"
        />
      </div>
    </SectionCard>
  );
}
