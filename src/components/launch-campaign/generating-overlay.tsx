"use client";
import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const STATUS_LINES = [
  'Ingesting brief…',
  'Mapping audience to channels…',
  'Scoring KPI feasibility…',
  'Aligning pacing to funnel stage…',
  'Synthesizing strategy…',
];

interface Props {
  onDone: () => void;
  durationMs?: number;
}

export function GeneratingOverlay({ onDone, durationMs = 3500 }: Props) {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const stepMs = durationMs / STATUS_LINES.length;
    const interval = setInterval(() => {
      setStatusIdx((i) => Math.min(i + 1, STATUS_LINES.length - 1));
    }, stepMs);
    const done = setTimeout(onDone, durationMs);
    return () => {
      clearInterval(interval);
      clearTimeout(done);
    };
  }, [durationMs, onDone]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        {/* Orbital loader */}
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border-2 border-teal/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal animate-spin" style={{ animationDuration: '1.8s' }} />
          <div className="absolute inset-2 rounded-full border border-teal/15" />
          <div className="absolute inset-2 rounded-full border border-transparent border-t-teal/60 animate-spin" style={{ animationDuration: '2.6s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-teal" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            STRATIS is building your strategy
          </h2>
          <p className="text-[13px] text-muted-foreground/80">
            Weaving the brief, targets, and channel mix into an optimized launch plan.
          </p>
        </div>

        <div className="min-h-[24px]">
          <p className="text-[12px] font-medium text-teal animate-pulse tabular-nums">
            {STATUS_LINES[statusIdx]}
          </p>
        </div>

        <div className="w-full max-w-xs">
          <div className="h-1 w-full rounded-full bg-border/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal transition-all ease-linear"
              style={{
                width: `${((statusIdx + 1) / STATUS_LINES.length) * 100}%`,
                transitionDuration: `${durationMs / STATUS_LINES.length}ms`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
