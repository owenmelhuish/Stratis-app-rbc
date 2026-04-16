"use client";
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  filled?: boolean;
  children: React.ReactNode;
}

export function SectionCard({ id, number, title, subtitle, filled, children }: SectionCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative rounded-xl bg-card border border-border/40 p-6 transition-colors",
        filled && "border-teal/30"
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full transition-colors",
          filled ? "bg-teal" : "bg-border/40"
        )}
      />
      <header className="flex items-start gap-4 mb-5">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
            filled
              ? "border-teal/50 bg-teal/10 text-teal"
              : "border-border/50 bg-card-elevated/40 text-muted-foreground"
          )}
        >
          {filled ? <Check className="h-3.5 w-3.5" /> : number}
        </div>
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-[12px] text-muted-foreground/80 mt-0.5">{subtitle}</p>
          )}
        </div>
      </header>
      <div className="pl-11 space-y-4">{children}</div>
    </section>
  );
}
