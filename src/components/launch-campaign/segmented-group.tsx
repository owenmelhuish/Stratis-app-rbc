"use client";
import React from 'react';
import { cn } from '@/lib/utils';

interface SegmentedGroupProps<T extends string> {
  value: T | '';
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; hint?: string }>;
  columns?: number;
}

export function SegmentedGroup<T extends string>({
  value,
  onChange,
  options,
  columns,
}: SegmentedGroupProps<T>) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4",
        columns === 5 && "grid-cols-5",
        !columns && "grid-cols-2 md:grid-cols-4",
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all",
              active
                ? "border-teal/50 bg-teal/10 text-foreground"
                : "border-border/50 bg-card-elevated/30 text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <span className={cn("text-[13px] font-medium", active && "text-teal")}>{opt.label}</span>
            {opt.hint && (
              <span className="text-[11px] text-muted-foreground/70">{opt.hint}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
