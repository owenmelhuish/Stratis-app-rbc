"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Sparkles,
  ChevronDown,
  X,
  Check,
  Info,
  Star,
  ArrowRight,
  ImageIcon,
  Upload,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandState {
  logo: string | null;
  name: string;
  website: string;
  theme: string;
}

interface IdentityState {
  industry: string;
  subCategory: string;
  marketPosition: string;
  valueProposition: string;
  differentiators: string[];
  brandTone: string[];
}

interface ObjectivesState {
  primaryObjective: string;
  timeHorizon: string;
  northStarKPIs: string[];
  kpiTargets: Record<string, { current: string; target: string }>;
  budgetDirection: string;
}

interface AudienceState {
  businessModel: string;
  targetCompanySize: string[];
  targetIndustries: string[];
  targetBuyerRole: string;
  ageRange: string[];
  incomeBracket: string[];
  lifestyleDescriptors: string[];
  painPoints: string;
  purchaseTriggers: string[];
}

interface CompetitorEntry {
  name: string;
  positioning: string;
}

interface CompetitiveState {
  competitors: CompetitorEntry[];
  competitiveEdge: string;
}

interface ChannelEntry {
  name: string;
  isTopInvestment: boolean;
}

interface MarketState {
  activeChannels: ChannelEntry[];
  geographicFocus: string;
  geographicDetails: string;
  hasSeasonality: boolean;
  peakMonths: number[];
  macroTrends: string[];
}

interface FormState {
  brand: BrandState;
  identity: IdentityState;
  objectives: ObjectivesState;
  audience: AudienceState;
  competitive: CompetitiveState;
  market: MarketState;
}

// ─── CSS Variables (inline, light theme for the setup flow) ───────────────────

const THEME = {
  bgPrimary: "oklch(0.16 0.005 160)",      // --card
  bgPage: "oklch(0.13 0.005 160)",          // --background
  bgHover: "oklch(0.19 0.005 160)",         // --card-elevated
  bgSelected: "rgba(124, 107, 240, 0.12)",  // violet tint on dark
  borderDefault: "oklch(1 0 0 / 6%)",       // --border
  borderFocus: "oklch(0.75 0.15 170)",      // --teal (focus ring)
  textPrimary: "oklch(0.96 0 0)",           // --foreground
  textSecondary: "oklch(0.55 0 0)",         // --muted-foreground
  textTertiary: "oklch(0.40 0 0)",          // dimmer muted
  accentPrimary: "oklch(0.96 0 0)",         // --foreground (for dark primary buttons)
  accentSoft: "oklch(0.20 0.005 160)",      // --secondary (soft CTA bg)
  accentAi: "#7C6BF0",                      // violet AI accent (unchanged)
  success: "#4ADE80",                       // brighter green for dark bg
  chipBorder: "oklch(1 0 0 / 10%)",         // --border-strong
  chipSelectedBorder: "#7C6BF0",            // violet (unchanged)
};

// ─── AI Suggest Data ──────────────────────────────────────────────────────────

const AI_SUGGESTIONS: Record<number, Partial<FormState>> = {
  2: {
    identity: {
      industry: "Technology & Software",
      subCategory: "Marketing Analytics",
      marketPosition: "Established Challenger",
      valueProposition: "",
      differentiators: ["Product Innovation", "Technical Superiority", "Speed & Agility"],
      brandTone: [],
    },
  },
  3: {
    objectives: {
      primaryObjective: "",
      timeHorizon: "6 Months",
      northStarKPIs: [],
      kpiTargets: {},
      budgetDirection: "Increasing",
    },
  },
  4: {
    audience: {
      businessModel: "b2b",
      targetCompanySize: ["Mid-Market", "Enterprise"],
      targetIndustries: ["SaaS", "E-Commerce", "Financial Services"],
      targetBuyerRole: "VP of Marketing, CMO, Head of Growth",
      ageRange: [],
      incomeBracket: [],
      lifestyleDescriptors: [],
      painPoints: "",
      purchaseTriggers: [],
    },
  },
  5: {
    competitive: {
      competitors: [
        { name: "HubSpot Analytics", positioning: "They're Ahead" },
        { name: "Mixpanel", positioning: "Neck & Neck" },
        { name: "Amplitude", positioning: "Neck & Neck" },
        { name: "Looker", positioning: "Indirect Threat" },
      ],
      competitiveEdge: "",
    },
  },
  6: {
    market: {
      activeChannels: [],
      geographicFocus: "Multi-Country",
      geographicDetails: "North America, Western Europe",
      hasSeasonality: true,
      peakMonths: [9, 10, 11, 1],
      macroTrends: [],
    },
  },
};

// ─── Tooltip Data ─────────────────────────────────────────────────────────────

const TOOLTIPS: Record<string, string> = {
  industry: "Sets the universe of relevant market signals for your brand.",
  subCategory: "Helps STRATIS narrow intelligence to your specific niche.",
  marketPosition: "Shifts STRATIS between offensive and defensive intelligence modes.",
  valueProposition: "Used to evaluate whether market trends reinforce or threaten your core positioning.",
  differentiators: "Helps STRATIS highlight moves by competitors that target your key strengths.",
  brandTone: "Calibrates how insights and recommendations are framed for your team.",
  primaryObjective: "Becomes the master filter — every insight is ranked by relevance to this goal.",
  timeHorizon: "Sets the urgency window for intelligence — short-term signals vs. long-term trends.",
  northStarKPIs: "STRATIS frames every insight around impact on these specific metrics.",
  kpiTargets: "Quantifies your gap-to-goal so insights can be sized by potential impact.",
  budgetDirection: "Helps STRATIS calibrate whether to recommend growth plays or efficiency optimizations.",
  businessModel: "Determines which audience signals and channels are most relevant.",
  targetCompanySize: "Filters B2B intelligence by company segment.",
  targetIndustries: "Activates industry-specific signal tracking for your buyers.",
  targetBuyerRole: "Helps STRATIS identify relevant thought leadership and decision-maker trends.",
  ageRange: "Filters consumer trend data to your core demographics.",
  incomeBracket: "Calibrates price sensitivity and premium positioning signals.",
  lifestyleDescriptors: "Enables psychographic trend matching for your audience.",
  painPoints: "STRATIS monitors market signals that amplify or resolve these pain points.",
  purchaseTriggers: "Prioritizes intelligence about factors that directly drive your sales.",
  competitors: "Activates dedicated tracking on these companies across all data sources.",
  competitiveEdge: "Helps STRATIS alert you when competitors threaten your key advantage.",
  activeChannels: "Focuses channel-specific intelligence on where you're actually investing.",
  geographicFocus: "Filters market signals to your operating regions.",
  seasonality: "STRATIS increases intelligence urgency before your peak periods.",
  macroTrends: "Activates dedicated monitoring on these macro-level signals.",
};

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: FormState = {
  brand: { logo: null, name: "", website: "", theme: "black" },
  identity: {
    industry: "",
    subCategory: "",
    marketPosition: "",
    valueProposition: "",
    differentiators: [],
    brandTone: [],
  },
  objectives: {
    primaryObjective: "",
    timeHorizon: "",
    northStarKPIs: [],
    kpiTargets: {},
    budgetDirection: "",
  },
  audience: {
    businessModel: "",
    targetCompanySize: [],
    targetIndustries: [],
    targetBuyerRole: "",
    ageRange: [],
    incomeBracket: [],
    lifestyleDescriptors: [],
    painPoints: "",
    purchaseTriggers: [],
  },
  competitive: {
    competitors: [
      { name: "", positioning: "" },
      { name: "", positioning: "" },
      { name: "", positioning: "" },
    ],
    competitiveEdge: "",
  },
  market: {
    activeChannels: [],
    geographicFocus: "",
    geographicDetails: "",
    hasSeasonality: false,
    peakMonths: [],
    macroTrends: [],
  },
};

// ─── Reusable Sub-Components ──────────────────────────────────────────────────

function TooltipIcon({ field }: { field: string }) {
  const [show, setShow] = useState(false);
  const tip = TOOLTIPS[field];
  if (!tip) return null;

  return (
    <span className="relative inline-flex ml-1.5">
      <button
        type="button"
        onMouseEnter={(e) => { setShow(true); e.currentTarget.style.color = THEME.textSecondary; }}
        onMouseLeave={(e) => { setShow(false); e.currentTarget.style.color = THEME.textTertiary; }}
        onClick={() => setShow((p) => !p)}
        className="transition-colors"
        style={{ color: THEME.textTertiary }}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in duration-150"
          style={{
            background: "oklch(0.25 0.005 160)",
            color: "oklch(0.96 0 0)",
            fontSize: 13,
            maxWidth: 240,
            borderRadius: 8,
            padding: "8px 12px",
            lineHeight: 1.4,
            pointerEvents: "none",
            border: "1px solid oklch(1 0 0 / 10%)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {tip}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `6px solid oklch(0.25 0.005 160)`,
            }}
          />
        </div>
      )}
    </span>
  );
}

function FieldLabel({
  children,
  tooltipField,
}: {
  children: React.ReactNode;
  tooltipField?: string;
}) {
  return (
    <label
      className="flex items-center text-[11px] font-semibold uppercase tracking-[0.08em] mb-2"
      style={{ color: THEME.textSecondary }}
    >
      {children}
      {tooltipField && <TooltipIcon field={tooltipField} />}
    </label>
  );
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] leading-relaxed mb-1" style={{ color: THEME.textSecondary }}>
      {children}
    </p>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  aiSuggested,
  onFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  aiSuggested?: boolean;
  onFocus?: () => void;
}) {
  return (
    <div
      className="transition-all duration-150"
      style={{
        borderLeft: aiSuggested ? `3px solid ${THEME.accentAi}` : "3px solid transparent",
        paddingLeft: aiSuggested ? 8 : 0,
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="w-full h-[48px] px-4 text-[15px] rounded-xl outline-none transition-all duration-150 focus:ring-[3px]"
        style={{
          border: `1px solid ${THEME.borderDefault}`,
          color: THEME.textPrimary,
          background: THEME.bgPrimary,
          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = THEME.borderFocus;
          e.currentTarget.style.boxShadow = `0 0 0 3px rgba(124, 107, 240, 0.15)`;
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = THEME.borderDefault;
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  maxLength,
  aiSuggested,
  onFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  aiSuggested?: boolean;
  onFocus?: () => void;
}) {
  return (
    <div
      className="transition-all duration-150"
      style={{
        borderLeft: aiSuggested ? `3px solid ${THEME.accentAi}` : "3px solid transparent",
        paddingLeft: aiSuggested ? 8 : 0,
      }}
    >
      <textarea
        value={value}
        onChange={(e) => {
          if (maxLength && e.target.value.length > maxLength) return;
          onChange(e.target.value);
        }}
        onFocus={onFocus}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-3.5 text-[15px] rounded-xl outline-none transition-all duration-150 resize-y min-h-[100px] focus:ring-[3px]"
        style={{
          border: `1px solid ${THEME.borderDefault}`,
          color: THEME.textPrimary,
          background: THEME.bgPrimary,
          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = THEME.borderFocus;
          e.currentTarget.style.boxShadow = `0 0 0 3px rgba(124, 107, 240, 0.15)`;
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = THEME.borderDefault;
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {maxLength && (
        <p className="text-[13px] mt-1" style={{ color: THEME.textTertiary }}>
          {value.length}/{maxLength} characters
        </p>
      )}
    </div>
  );
}

function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  aiSuggested,
  onFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  aiSuggested?: boolean;
  onFocus?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      className="relative transition-all duration-150"
      style={{
        borderLeft: aiSuggested ? `3px solid ${THEME.accentAi}` : "3px solid transparent",
        paddingLeft: aiSuggested ? 8 : 0,
      }}
    >
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          onFocus?.();
        }}
        className="w-full h-[48px] px-4 text-[15px] rounded-xl flex items-center justify-between transition-all duration-150"
        style={{
          border: `1px solid ${open ? THEME.borderFocus : THEME.borderDefault}`,
          color: value ? THEME.textPrimary : THEME.textSecondary,
          background: THEME.bgPrimary,
          boxShadow: open ? `0 0 0 3px rgba(124, 107, 240, 0.15)` : "none",
          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        }}
      >
        <span>{value || placeholder}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
          style={{ color: THEME.textSecondary }}
        />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          style={{
            border: `1px solid ${THEME.borderDefault}`,
            background: THEME.bgPrimary,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-[15px] transition-colors duration-100"
              style={{
                color: THEME.textPrimary,
                background: value === opt ? THEME.bgSelected : "transparent",
                fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
              }}
              onMouseEnter={(e) => {
                if (value !== opt) e.currentTarget.style.background = THEME.bgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = value === opt ? THEME.bgSelected : "transparent";
              }}
            >
              {opt}
              {value === opt && <Check className="inline ml-2 h-4 w-4" style={{ color: THEME.accentAi }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChipSelect({
  options,
  selected,
  onToggle,
  max,
  aiSuggested,
  onFocus,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  max?: number;
  aiSuggested?: boolean;
  onFocus?: () => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-2 transition-all duration-150"
      style={{
        borderLeft: aiSuggested ? `3px solid ${THEME.accentAi}` : "3px solid transparent",
        paddingLeft: aiSuggested ? 8 : 0,
      }}
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        const atMax = max !== undefined && selected.length >= max && !isSelected;
        return (
          <button
            key={opt}
            type="button"
            disabled={atMax}
            onClick={() => {
              onToggle(opt);
              onFocus?.();
            }}
            className="px-4 py-2 rounded-[20px] text-[14px] font-medium transition-all duration-120 inline-flex items-center gap-1.5"
            style={{
              border: `1px solid ${isSelected ? THEME.chipSelectedBorder : THEME.chipBorder}`,
              background: isSelected ? THEME.bgSelected : "transparent",
              color: isSelected ? THEME.textPrimary : THEME.textSecondary,
              opacity: atMax ? 0.4 : 1,
              cursor: atMax ? "not-allowed" : "pointer",
              fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
            }}
            onMouseEnter={(e) => {
              if (!isSelected && !atMax) e.currentTarget.style.background = THEME.bgHover;
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = "transparent";
            }}
          >
            {opt}
            {isSelected && <X className="h-3 w-3" style={{ color: THEME.textSecondary }} />}
          </button>
        );
      })}
    </div>
  );
}

function CardSelect({
  options,
  selected,
  onChange,
  columns = 2,
  aiSuggested,
  onFocus,
}: {
  options: { title: string; description: string }[];
  selected: string;
  onChange: (v: string) => void;
  columns?: number;
  aiSuggested?: boolean;
  onFocus?: () => void;
}) {
  return (
    <div
      className={cn("grid gap-3 transition-all duration-150", columns === 2 ? "grid-cols-2" : "grid-cols-3")}
      style={{
        borderLeft: aiSuggested ? `3px solid ${THEME.accentAi}` : "3px solid transparent",
        paddingLeft: aiSuggested ? 8 : 0,
      }}
    >
      {options.map((opt) => {
        const isSelected = selected === opt.title;
        return (
          <button
            key={opt.title}
            type="button"
            onClick={() => {
              onChange(opt.title);
              onFocus?.();
            }}
            className="text-left p-4 rounded-xl transition-all duration-150 relative"
            style={{
              border: `1px solid ${isSelected ? THEME.chipSelectedBorder : THEME.borderDefault}`,
              background: isSelected ? THEME.bgSelected : THEME.bgPrimary,
              fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = THEME.bgHover;
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = THEME.bgPrimary;
            }}
          >
            {isSelected && (
              <div
                className="absolute top-3 right-3 h-5 w-5 rounded-full flex items-center justify-center"
                style={{ background: THEME.accentAi }}
              >
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            <p className="text-[15px] font-semibold" style={{ color: THEME.textPrimary }}>
              {opt.title}
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: THEME.textSecondary }}>
              {opt.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  max,
  aiSuggested,
  onFocus,
}: {
  tags: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder?: string;
  max?: number;
  aiSuggested?: boolean;
  onFocus?: () => void;
}) {
  const [inputVal, setInputVal] = useState("");

  return (
    <div
      className="transition-all duration-150"
      style={{
        borderLeft: aiSuggested ? `3px solid ${THEME.accentAi}` : "3px solid transparent",
        paddingLeft: aiSuggested ? 8 : 0,
      }}
    >
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[20px] text-[14px]"
            style={{
              border: `1px solid ${THEME.chipSelectedBorder}`,
              background: THEME.bgSelected,
              color: THEME.textPrimary,
            }}
          >
            {tag}
            <button type="button" onClick={() => onRemove(tag)}>
              <X className="h-3 w-3" style={{ color: THEME.textSecondary }} />
            </button>
          </span>
        ))}
      </div>
      {(!max || tags.length < max) && (
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onFocus={onFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputVal.trim()) {
              e.preventDefault();
              if (!tags.includes(inputVal.trim())) {
                onAdd(inputVal.trim());
              }
              setInputVal("");
            }
          }}
          placeholder={placeholder}
          className="w-full h-[48px] px-4 text-[15px] rounded-xl outline-none transition-all duration-150 focus:ring-[3px]"
          style={{
            border: `1px solid ${THEME.borderDefault}`,
            color: THEME.textPrimary,
            background: THEME.bgPrimary,
            fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = THEME.borderFocus;
            e.currentTarget.style.boxShadow = `0 0 0 3px rgba(124, 107, 240, 0.15)`;
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = THEME.borderDefault;
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      )}
    </div>
  );
}

// ─── Progress Indicator ───────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isCompleted = step < current;
        return (
          <div
            key={step}
            className="h-[4px] rounded-full transition-all duration-300 ease-out"
            style={{
              width: isActive ? 48 : 32,
              background: isCompleted || isActive ? THEME.accentPrimary : THEME.borderDefault,
              opacity: isActive ? 1 : isCompleted ? 0.8 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Saved Indicator ──────────────────────────────────────────────────────────

function SavedIndicator({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      className="absolute top-4 right-4 flex items-center gap-1.5 text-[13px] animate-in fade-in duration-200"
      style={{ color: THEME.success }}
    >
      <Check className="h-3.5 w-3.5" />
      Saved
    </div>
  );
}

// ─── AI Suggest Button ────────────────────────────────────────────────────────

function AiSuggestButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-150 hover:shadow-md"
      style={{
        border: `1px solid ${loading ? THEME.accentAi : THEME.borderDefault}`,
        background: THEME.bgPrimary,
        color: loading ? THEME.accentAi : THEME.textSecondary,
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor = THEME.accentAi;
          e.currentTarget.style.boxShadow = `0 0 0 1px ${THEME.accentAi}20`;
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor = THEME.borderDefault;
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: THEME.accentAi }} />
          <span>Analyzing...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" style={{ color: THEME.accentAi }} />
          <span>STRATIS Suggest</span>
        </>
      )}
    </button>
  );
}

// ─── Shimmer Overlay ──────────────────────────────────────────────────────────

function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 z-10 rounded-xl overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${THEME.accentAi}08 30%, ${THEME.accentAi}12 50%, ${THEME.accentAi}08 70%, transparent 100%)`,
          animation: "shimmerSweep 1.5s ease-in-out",
        }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClientSetupFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState<FormState>(initialState);
  const [aiSuggestedFields, setAiSuggestedFields] = useState<Set<string>>(new Set());
  const [aiLoading, setAiLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [websiteChecking, setWebsiteChecking] = useState(false);
  const [websiteChecked, setWebsiteChecked] = useState(false);
  const [expandedReviewSection, setExpandedReviewSection] = useState<number | null>(null);

  // Update helpers
  const updateBrand = useCallback(
    (updates: Partial<BrandState>) => setFormState((s) => ({ ...s, brand: { ...s.brand, ...updates } })),
    []
  );
  const updateIdentity = useCallback(
    (updates: Partial<IdentityState>) => setFormState((s) => ({ ...s, identity: { ...s.identity, ...updates } })),
    []
  );
  const updateObjectives = useCallback(
    (updates: Partial<ObjectivesState>) => setFormState((s) => ({ ...s, objectives: { ...s.objectives, ...updates } })),
    []
  );
  const updateAudience = useCallback(
    (updates: Partial<AudienceState>) => setFormState((s) => ({ ...s, audience: { ...s.audience, ...updates } })),
    []
  );
  const updateCompetitive = useCallback(
    (updates: Partial<CompetitiveState>) =>
      setFormState((s) => ({ ...s, competitive: { ...s.competitive, ...updates } })),
    []
  );
  const updateMarket = useCallback(
    (updates: Partial<MarketState>) => setFormState((s) => ({ ...s, market: { ...s.market, ...updates } })),
    []
  );

  // Toggle helpers for arrays
  const toggleInArray = (arr: string[], item: string, max?: number) => {
    if (arr.includes(item)) return arr.filter((x) => x !== item);
    if (max && arr.length >= max) return arr;
    return [...arr, item];
  };

  // Clear AI suggestion indicator when field is focused
  const clearAiSuggestion = (field: string) => {
    setAiSuggestedFields((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  // Step transitions
  const goNext = () => {
    if (currentStep < 7) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      setCurrentStep((s) => s + 1);
    }
  };
  const goBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // AI Suggest handler
  const handleAiSuggest = () => {
    const suggestions = AI_SUGGESTIONS[currentStep];
    if (!suggestions) return;

    setAiLoading(true);
    setShowShimmer(true);

    setTimeout(() => {
      setShowShimmer(false);
      setAiLoading(false);

      // Apply suggestions and mark fields
      const newSuggested = new Set(aiSuggestedFields);

      if (suggestions.identity) {
        const s = suggestions.identity;
        const updates: Partial<IdentityState> = {};
        if (s.industry) { updates.industry = s.industry; newSuggested.add("industry"); }
        if (s.subCategory) { updates.subCategory = s.subCategory; newSuggested.add("subCategory"); }
        if (s.marketPosition) { updates.marketPosition = s.marketPosition; newSuggested.add("marketPosition"); }
        if (s.differentiators && s.differentiators.length) { updates.differentiators = s.differentiators; newSuggested.add("differentiators"); }
        updateIdentity(updates);
      }

      if (suggestions.objectives) {
        const s = suggestions.objectives;
        const updates: Partial<ObjectivesState> = {};
        if (s.timeHorizon) { updates.timeHorizon = s.timeHorizon; newSuggested.add("timeHorizon"); }
        if (s.budgetDirection) { updates.budgetDirection = s.budgetDirection; newSuggested.add("budgetDirection"); }
        updateObjectives(updates);
      }

      if (suggestions.audience) {
        const s = suggestions.audience;
        const updates: Partial<AudienceState> = {};
        if (s.businessModel) { updates.businessModel = s.businessModel; newSuggested.add("businessModel"); }
        if (s.targetCompanySize?.length) { updates.targetCompanySize = s.targetCompanySize; newSuggested.add("targetCompanySize"); }
        if (s.targetIndustries?.length) { updates.targetIndustries = s.targetIndustries; newSuggested.add("targetIndustries"); }
        if (s.targetBuyerRole) { updates.targetBuyerRole = s.targetBuyerRole; newSuggested.add("targetBuyerRole"); }
        updateAudience(updates);
      }

      if (suggestions.competitive) {
        const s = suggestions.competitive;
        if (s.competitors?.length) {
          updateCompetitive({ competitors: s.competitors });
          newSuggested.add("competitors");
        }
      }

      if (suggestions.market) {
        const s = suggestions.market;
        const updates: Partial<MarketState> = {};
        if (s.geographicFocus) { updates.geographicFocus = s.geographicFocus; newSuggested.add("geographicFocus"); }
        if (s.geographicDetails) { updates.geographicDetails = s.geographicDetails; newSuggested.add("geographicDetails"); }
        if (s.hasSeasonality !== undefined) { updates.hasSeasonality = s.hasSeasonality; newSuggested.add("seasonality"); }
        if (s.peakMonths?.length) { updates.peakMonths = s.peakMonths; newSuggested.add("peakMonths"); }
        updateMarket(updates);
      }

      setAiSuggestedFields(newSuggested);
    }, 1500);
  };

  // Website check simulation
  useEffect(() => {
    if (formState.brand.website && formState.brand.website.includes(".")) {
      setWebsiteChecking(true);
      setWebsiteChecked(false);
      const timer = setTimeout(() => {
        setWebsiteChecking(false);
        setWebsiteChecked(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setWebsiteChecking(false);
      setWebsiteChecked(false);
    }
  }, [formState.brand.website]);

  // Completeness calculation for Step 7
  const getCompleteness = (): number => {
    let filled = 0;
    let total = 0;

    // Step 1 (weight 10)
    total += 10;
    if (formState.brand.name) filled += 5;
    if (formState.brand.website) filled += 5;

    // Step 2 (weight 20)
    total += 20;
    if (formState.identity.industry) filled += 4;
    if (formState.identity.subCategory) filled += 3;
    if (formState.identity.marketPosition) filled += 4;
    if (formState.identity.valueProposition) filled += 4;
    if (formState.identity.differentiators.length) filled += 3;
    if (formState.identity.brandTone.length) filled += 2;

    // Step 3 (weight 20)
    total += 20;
    if (formState.objectives.primaryObjective) filled += 6;
    if (formState.objectives.timeHorizon) filled += 4;
    if (formState.objectives.northStarKPIs.length) filled += 5;
    if (formState.objectives.budgetDirection) filled += 5;

    // Step 4 (weight 20)
    total += 20;
    if (formState.audience.businessModel) filled += 5;
    if (formState.audience.painPoints) filled += 8;
    if (formState.audience.purchaseTriggers.length) filled += 7;

    // Step 5 (weight 15)
    total += 15;
    if (formState.competitive.competitors.some((c) => c.name)) filled += 10;
    if (formState.competitive.competitiveEdge) filled += 5;

    // Step 6 (weight 15)
    total += 15;
    if (formState.market.activeChannels.length) filled += 5;
    if (formState.market.geographicFocus) filled += 4;
    if (formState.market.macroTrends.length) filled += 6;

    return Math.round((filled / total) * 100);
  };

  // ─── Success State ────────────────────────────────────────────────────────

  if (setupComplete) {
    return (
      <div
        className="min-h-full flex items-center justify-center"
        style={{ background: THEME.bgPage, fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` }}
      >
        <div className="text-center animate-in fade-in zoom-in-95 duration-500">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(74, 222, 128, 0.12)" }}
          >
            <Check className="h-10 w-10" style={{ color: THEME.success }} />
          </div>
          <h1 className="text-[28px] font-bold mb-3" style={{ color: THEME.textPrimary, letterSpacing: "-0.02em" }}>
            Your brand intelligence engine is ready
          </h1>
          <p className="text-[15px] max-w-md mx-auto" style={{ color: THEME.textSecondary }}>
            STRATIS is now configured for your brand. Intelligence collection has begun — expect your first insights
            within 24 hours.
          </p>
          <div className="mt-8 flex items-center justify-center gap-1.5 text-[14px]" style={{ color: THEME.textTertiary }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up your intelligence engine...
          </div>
        </div>
      </div>
    );
  }

  // ─── Step Content Renderers ─────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <h1 className="text-[28px] font-bold mb-8" style={{ color: THEME.textPrimary, letterSpacing: "-0.02em" }}>
        Create a Client
      </h1>

      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* Logo Upload */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center justify-center min-h-[280px]"
          style={{ border: `1px solid ${THEME.borderDefault}`, background: THEME.bgPrimary }}
        >
          <FieldLabel>Brand Logo</FieldLabel>
          <div
            className="w-full flex-1 rounded-xl flex flex-col items-center justify-center mb-4 cursor-pointer"
            style={{ border: `2px dashed ${THEME.borderDefault}` }}
            onClick={() => updateBrand({ logo: "placeholder" })}
          >
            {formState.brand.logo ? (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ background: THEME.accentAi }}
              >
                <span className="text-white text-xl font-bold">
                  {formState.brand.name?.[0]?.toUpperCase() || "M"}
                </span>
              </div>
            ) : (
              <ImageIcon className="h-12 w-12" style={{ color: THEME.borderDefault }} />
            )}
          </div>
          <button
            type="button"
            onClick={() => updateBrand({ logo: "placeholder" })}
            className="px-5 py-2 rounded-lg text-[14px] font-medium"
            style={{ background: "oklch(1 0 0 / 10%)", color: THEME.textPrimary, border: `1px solid oklch(1 0 0 / 12%)` }}
          >
            Upload Image...
          </button>
        </div>

        {/* Right fields */}
        <div className="space-y-5">
          <div>
            <FieldLabel>Client Name</FieldLabel>
            <TextInput
              value={formState.brand.name}
              onChange={(v) => updateBrand({ name: v })}
              placeholder="Company Name"
            />
          </div>

          <div>
            <FieldLabel>Client Website</FieldLabel>
            <TextInput
              value={formState.brand.website}
              onChange={(v) => updateBrand({ website: v })}
              placeholder="https://www.example.com"
            />
            {(websiteChecking || websiteChecked) && (
              <div
                className="flex items-center gap-2 mt-2 text-[13px] animate-in fade-in duration-200"
                style={{ color: THEME.accentAi }}
              >
                {websiteChecking ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    STRATIS is researching your brand...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" style={{ color: THEME.success }} />
                    <span style={{ color: THEME.success }}>Brand data collected</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <FieldLabel>Dashboard Theme</FieldLabel>
            <Dropdown
              value={formState.brand.theme === "black" ? "Black" : "White"}
              onChange={(v) => updateBrand({ theme: v.toLowerCase() })}
              options={["Black", "White"]}
              placeholder="Select theme"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 relative">
      {showShimmer && <ShimmerOverlay />}
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-[28px] font-bold" style={{ color: THEME.textPrimary, letterSpacing: "-0.02em" }}>
          Brand Identity
        </h1>
        <AiSuggestButton onClick={handleAiSuggest} loading={aiLoading} />
      </div>
      <HelperText>
        Help STRATIS understand who your brand is in the market. This shapes how intelligence is contextualized for your
        positioning.
      </HelperText>

      <div className="space-y-6 mt-8">
        <div>
          <FieldLabel tooltipField="industry">Industry</FieldLabel>
          <Dropdown
            value={formState.identity.industry}
            onChange={(v) => updateIdentity({ industry: v })}
            options={[
              "Technology & Software",
              "Financial Services",
              "Healthcare & Pharma",
              "Consumer Packaged Goods (CPG)",
              "Retail & E-Commerce",
              "Travel & Hospitality",
              "Media & Entertainment",
              "Automotive",
              "Real Estate",
              "Education",
              "Energy & Utilities",
              "Professional Services",
              "Telecommunications",
              "Other",
            ]}
            placeholder="Select your industry"
            aiSuggested={aiSuggestedFields.has("industry")}
            onFocus={() => clearAiSuggestion("industry")}
          />
        </div>

        <div>
          <FieldLabel tooltipField="subCategory">Sub-Category</FieldLabel>
          <TextInput
            value={formState.identity.subCategory}
            onChange={(v) => updateIdentity({ subCategory: v })}
            placeholder="e.g., Enterprise SaaS, Luxury Hotels, Organic Skincare"
            aiSuggested={aiSuggestedFields.has("subCategory")}
            onFocus={() => clearAiSuggestion("subCategory")}
          />
        </div>

        <div>
          <FieldLabel tooltipField="marketPosition">Market Position</FieldLabel>
          <CardSelect
            options={[
              { title: "Market Leader", description: "Established #1 or #2 in your category" },
              { title: "Established Challenger", description: "Strong presence, competing to overtake leaders" },
              { title: "Growth-Stage Disruptor", description: "Scaling fast, redefining the category" },
              { title: "New Entrant", description: "Recently entered or launching in this market" },
              { title: "Niche Specialist", description: "Dominant in a focused segment" },
              { title: "Legacy in Transformation", description: "Established brand undergoing reinvention" },
            ]}
            selected={formState.identity.marketPosition}
            onChange={(v) => updateIdentity({ marketPosition: v })}
            aiSuggested={aiSuggestedFields.has("marketPosition")}
            onFocus={() => clearAiSuggestion("marketPosition")}
          />
        </div>

        <div>
          <FieldLabel tooltipField="valueProposition">Value Proposition</FieldLabel>
          <TextArea
            value={formState.identity.valueProposition}
            onChange={(v) => updateIdentity({ valueProposition: v })}
            placeholder="In 1-2 sentences, what does your brand promise that competitors don't?"
            maxLength={300}
          />
          <p className="text-[13px] mt-1" style={{ color: THEME.textSecondary }}>
            STRATIS uses this to evaluate whether market trends reinforce or threaten your core positioning.
          </p>
        </div>

        <div>
          <FieldLabel tooltipField="differentiators">Brand Differentiators</FieldLabel>
          <HelperText>Select up to 3 that best define your competitive edge.</HelperText>
          <ChipSelect
            options={[
              "Price & Value",
              "Product Innovation",
              "Customer Experience",
              "Speed & Agility",
              "Trust & Heritage",
              "Sustainability",
              "Technical Superiority",
              "Network & Ecosystem",
            ]}
            selected={formState.identity.differentiators}
            onToggle={(v) => updateIdentity({ differentiators: toggleInArray(formState.identity.differentiators, v, 3) })}
            max={3}
            aiSuggested={aiSuggestedFields.has("differentiators")}
            onFocus={() => clearAiSuggestion("differentiators")}
          />
        </div>

        <div>
          <FieldLabel tooltipField="brandTone">Brand Tone</FieldLabel>
          <HelperText>Select 2 that best describe your brand&apos;s voice.</HelperText>
          <ChipSelect
            options={["Authoritative", "Approachable", "Provocative", "Premium", "Technical", "Playful", "Mission-Driven"]}
            selected={formState.identity.brandTone}
            onToggle={(v) => updateIdentity({ brandTone: toggleInArray(formState.identity.brandTone, v, 2) })}
            max={2}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 relative">
      {showShimmer && <ShimmerOverlay />}
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-[28px] font-bold" style={{ color: THEME.textPrimary, letterSpacing: "-0.02em" }}>
          Strategic Objectives
        </h1>
        <AiSuggestButton onClick={handleAiSuggest} loading={aiLoading} />
      </div>
      <HelperText>
        Tell STRATIS what success looks like. This drives which insights get prioritized and how they&apos;re framed for your
        goals.
      </HelperText>

      <div className="space-y-6 mt-8">
        <div>
          <FieldLabel tooltipField="primaryObjective">Primary Objective</FieldLabel>
          <CardSelect
            options={[
              { title: "Grow Market Share", description: "Capture more of your category" },
              { title: "Launch New Product", description: "Bring a new offering to market" },
              { title: "Improve Marketing Efficiency", description: "Do more with less, optimize ROAS" },
              { title: "Defend Against Competitors", description: "Protect position from emerging threats" },
              { title: "Expand Into New Market", description: "Enter a new segment or geography" },
              { title: "Build Brand Awareness", description: "Increase recognition and share of voice" },
              { title: "Drive Retention & LTV", description: "Maximize existing customer value" },
            ]}
            selected={formState.objectives.primaryObjective}
            onChange={(v) => updateObjectives({ primaryObjective: v })}
          />
        </div>

        <div>
          <FieldLabel tooltipField="timeHorizon">Time Horizon</FieldLabel>
          <ChipSelect
            options={["Next 90 Days", "6 Months", "12+ Months"]}
            selected={formState.objectives.timeHorizon ? [formState.objectives.timeHorizon] : []}
            onToggle={(v) => updateObjectives({ timeHorizon: formState.objectives.timeHorizon === v ? "" : v })}
            aiSuggested={aiSuggestedFields.has("timeHorizon")}
            onFocus={() => clearAiSuggestion("timeHorizon")}
          />
        </div>

        <div>
          <FieldLabel tooltipField="northStarKPIs">North Star KPIs</FieldLabel>
          <HelperText>Select up to 3 metrics that matter most.</HelperText>
          <ChipSelect
            options={[
              "Revenue Growth",
              "Customer Acquisition Cost (CAC)",
              "Brand Awareness Lift",
              "Share of Voice",
              "Conversion Rate",
              "Marketing ROI / ROAS",
              "Customer Lifetime Value (LTV)",
              "Pipeline Velocity",
              "Market Share %",
            ]}
            selected={formState.objectives.northStarKPIs}
            onToggle={(v) => {
              const newKPIs = toggleInArray(formState.objectives.northStarKPIs, v, 3);
              const newTargets = { ...formState.objectives.kpiTargets };
              // Remove targets for deselected KPIs
              Object.keys(newTargets).forEach((k) => {
                if (!newKPIs.includes(k)) delete newTargets[k];
              });
              // Add targets for new KPIs
              newKPIs.forEach((k) => {
                if (!newTargets[k]) newTargets[k] = { current: "", target: "" };
              });
              updateObjectives({ northStarKPIs: newKPIs, kpiTargets: newTargets });
            }}
            max={3}
          />
        </div>

        {formState.objectives.northStarKPIs.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <FieldLabel tooltipField="kpiTargets">KPI Targets</FieldLabel>
            <HelperText>
              Where are you today vs. where you want to be? STRATIS uses this to frame insights around your gap-to-goal.
            </HelperText>
            {formState.objectives.northStarKPIs.map((kpi) => (
              <div
                key={kpi}
                className="p-4 rounded-xl animate-in fade-in slide-in-from-bottom-1 duration-200"
                style={{ border: `1px solid ${THEME.borderDefault}`, background: THEME.bgPrimary }}
              >
                <p className="text-[15px] font-semibold mb-3" style={{ color: THEME.textPrimary }}>
                  {kpi}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] mb-1 block" style={{ color: THEME.textSecondary }}>
                      Current
                    </label>
                    <input
                      type="text"
                      value={formState.objectives.kpiTargets[kpi]?.current || ""}
                      onChange={(e) =>
                        updateObjectives({
                          kpiTargets: {
                            ...formState.objectives.kpiTargets,
                            [kpi]: { ...formState.objectives.kpiTargets[kpi], current: e.target.value },
                          },
                        })
                      }
                      placeholder="e.g., $120"
                      className="w-full h-[40px] px-3 text-[14px] rounded-lg outline-none transition-all duration-150"
                      style={{
                        border: `1px solid ${THEME.borderDefault}`,
                        color: THEME.textPrimary,
                        background: THEME.bgPrimary,
                        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] mb-1 block" style={{ color: THEME.textSecondary }}>
                      Target
                    </label>
                    <input
                      type="text"
                      value={formState.objectives.kpiTargets[kpi]?.target || ""}
                      onChange={(e) =>
                        updateObjectives({
                          kpiTargets: {
                            ...formState.objectives.kpiTargets,
                            [kpi]: { ...formState.objectives.kpiTargets[kpi], target: e.target.value },
                          },
                        })
                      }
                      placeholder="e.g., $95"
                      className="w-full h-[40px] px-3 text-[14px] rounded-lg outline-none transition-all duration-150"
                      style={{
                        border: `1px solid ${THEME.borderDefault}`,
                        color: THEME.textPrimary,
                        background: THEME.bgPrimary,
                        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <FieldLabel tooltipField="budgetDirection">Budget Direction</FieldLabel>
          <HelperText>This helps STRATIS calibrate whether to recommend growth plays or efficiency optimizations.</HelperText>
          <ChipSelect
            options={["Increasing", "Flat", "Decreasing"]}
            selected={formState.objectives.budgetDirection ? [formState.objectives.budgetDirection] : []}
            onToggle={(v) => updateObjectives({ budgetDirection: formState.objectives.budgetDirection === v ? "" : v })}
            aiSuggested={aiSuggestedFields.has("budgetDirection")}
            onFocus={() => clearAiSuggestion("budgetDirection")}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const bm = formState.audience.businessModel;
    const showB2B = bm === "b2b" || bm === "both";
    const showB2C = bm === "b2c" || bm === "both";

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 relative">
        {showShimmer && <ShimmerOverlay />}
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-[28px] font-bold" style={{ color: THEME.textPrimary, letterSpacing: "-0.02em" }}>
            Target Audience
          </h1>
          <AiSuggestButton onClick={handleAiSuggest} loading={aiLoading} />
        </div>
        <HelperText>
          Define who you&apos;re trying to reach. STRATIS uses this to filter which market signals matter for your brand vs.
          noise.
        </HelperText>

        <div className="space-y-6 mt-8">
          <div>
            <FieldLabel tooltipField="businessModel">Business Model</FieldLabel>
            <ChipSelect
              options={["B2B", "B2C", "Both"]}
              selected={
                bm === "b2b" ? ["B2B"] : bm === "b2c" ? ["B2C"] : bm === "both" ? ["Both"] : []
              }
              onToggle={(v) => {
                const val = v === "B2B" ? "b2b" : v === "B2C" ? "b2c" : "both";
                updateAudience({ businessModel: bm === val ? "" : val });
              }}
              aiSuggested={aiSuggestedFields.has("businessModel")}
              onFocus={() => clearAiSuggestion("businessModel")}
            />
          </div>

          {showB2B && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {bm === "both" && (
                <div className="h-px" style={{ background: THEME.borderDefault }} />
              )}
              <div>
                <FieldLabel tooltipField="targetCompanySize">Target Company Size</FieldLabel>
                <ChipSelect
                  options={["SMB", "Mid-Market", "Enterprise", "All Sizes"]}
                  selected={formState.audience.targetCompanySize}
                  onToggle={(v) =>
                    updateAudience({ targetCompanySize: toggleInArray(formState.audience.targetCompanySize, v) })
                  }
                  aiSuggested={aiSuggestedFields.has("targetCompanySize")}
                  onFocus={() => clearAiSuggestion("targetCompanySize")}
                />
              </div>
              <div>
                <FieldLabel tooltipField="targetIndustries">Target Industries</FieldLabel>
                <TagInput
                  tags={formState.audience.targetIndustries}
                  onAdd={(v) => updateAudience({ targetIndustries: [...formState.audience.targetIndustries, v] })}
                  onRemove={(v) =>
                    updateAudience({ targetIndustries: formState.audience.targetIndustries.filter((t) => t !== v) })
                  }
                  placeholder="Type an industry and press Enter"
                  aiSuggested={aiSuggestedFields.has("targetIndustries")}
                  onFocus={() => clearAiSuggestion("targetIndustries")}
                />
              </div>
              <div>
                <FieldLabel tooltipField="targetBuyerRole">Target Buyer Role</FieldLabel>
                <TextInput
                  value={formState.audience.targetBuyerRole}
                  onChange={(v) => updateAudience({ targetBuyerRole: v })}
                  placeholder="e.g., VP of Marketing, CTO, Head of Operations"
                  aiSuggested={aiSuggestedFields.has("targetBuyerRole")}
                  onFocus={() => clearAiSuggestion("targetBuyerRole")}
                />
              </div>
            </div>
          )}

          {showB2C && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {bm === "both" && (
                <div className="h-px" style={{ background: THEME.borderDefault }} />
              )}
              <div>
                <FieldLabel tooltipField="ageRange">Age Range</FieldLabel>
                <ChipSelect
                  options={["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]}
                  selected={formState.audience.ageRange}
                  onToggle={(v) => updateAudience({ ageRange: toggleInArray(formState.audience.ageRange, v) })}
                />
              </div>
              <div>
                <FieldLabel tooltipField="incomeBracket">Income Bracket</FieldLabel>
                <ChipSelect
                  options={["Budget-Conscious", "Mid-Range", "Affluent", "Luxury"]}
                  selected={formState.audience.incomeBracket}
                  onToggle={(v) =>
                    updateAudience({ incomeBracket: toggleInArray(formState.audience.incomeBracket, v) })
                  }
                />
              </div>
              <div>
                <FieldLabel tooltipField="lifestyleDescriptors">Lifestyle & Psychographics</FieldLabel>
                <TagInput
                  tags={formState.audience.lifestyleDescriptors}
                  onAdd={(v) =>
                    updateAudience({ lifestyleDescriptors: [...formState.audience.lifestyleDescriptors, v] })
                  }
                  onRemove={(v) =>
                    updateAudience({
                      lifestyleDescriptors: formState.audience.lifestyleDescriptors.filter((t) => t !== v),
                    })
                  }
                  placeholder="e.g., health-conscious, tech-savvy, sustainability-focused"
                />
              </div>
            </div>
          )}

          <div>
            <FieldLabel tooltipField="painPoints">Customer Pain Points</FieldLabel>
            <HelperText>What are the top 2-3 problems your customers are trying to solve when they find you?</HelperText>
            <TextArea
              value={formState.audience.painPoints}
              onChange={(v) => updateAudience({ painPoints: v })}
              placeholder="e.g., Can't prove marketing ROI to the CFO, spending too much on tools that don't integrate"
              maxLength={500}
            />
          </div>

          <div>
            <FieldLabel tooltipField="purchaseTriggers">Purchase Decision Factors</FieldLabel>
            <HelperText>Select the top 3 factors that drive your customers to buy.</HelperText>
            <ChipSelect
              options={[
                "Price",
                "Peer Recommendations",
                "Analyst & Review Validation",
                "Ease of Implementation",
                "Brand Trust",
                "Innovation & Features",
                "Compliance & Security",
                "Speed to Value",
              ]}
              selected={formState.audience.purchaseTriggers}
              onToggle={(v) =>
                updateAudience({ purchaseTriggers: toggleInArray(formState.audience.purchaseTriggers, v, 3) })
              }
              max={3}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    const positioningOptions = ["They're Ahead", "Neck & Neck", "We're Ahead", "Indirect Threat"];

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 relative">
        {showShimmer && <ShimmerOverlay />}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold" style={{ color: THEME.textPrimary, letterSpacing: "-0.02em" }}>
              Competitive Landscape
            </h1>
            <span
              className="px-3 py-1 rounded-full text-[12px] font-medium"
              style={{ color: THEME.textTertiary, border: `1px solid ${THEME.borderDefault}` }}
            >
              Optional
            </span>
          </div>
          <AiSuggestButton onClick={handleAiSuggest} loading={aiLoading} />
        </div>
        <HelperText>Tell STRATIS who you&apos;re watching. This activates competitor-specific intelligence tracking.</HelperText>

        <div className="space-y-6 mt-8">
          <div>
            <FieldLabel tooltipField="competitors">Your Competitors</FieldLabel>
            <HelperText>Add up to 7 brands you directly compete with.</HelperText>
            <div className="space-y-3">
              {formState.competitive.competitors.map((comp, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={comp.name}
                      onChange={(e) => {
                        const updated = [...formState.competitive.competitors];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        updateCompetitive({ competitors: updated });
                      }}
                      placeholder={`Competitor ${idx + 1}`}
                      className="w-full h-[44px] px-4 text-[15px] rounded-xl outline-none transition-all duration-150"
                      style={{
                        border: `1px solid ${THEME.borderDefault}`,
                        color: THEME.textPrimary,
                        background: THEME.bgPrimary,
                        borderLeft: aiSuggestedFields.has("competitors") && comp.name
                          ? `3px solid ${THEME.accentAi}`
                          : undefined,
                        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
                      }}
                    />
                  </div>
                  <div className="w-[180px]">
                    <Dropdown
                      value={comp.positioning}
                      onChange={(v) => {
                        const updated = [...formState.competitive.competitors];
                        updated[idx] = { ...updated[idx], positioning: v };
                        updateCompetitive({ competitors: updated });
                      }}
                      options={positioningOptions}
                      placeholder="Position"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formState.competitive.competitors.filter((_, i) => i !== idx);
                      updateCompetitive({ competitors: updated });
                    }}
                    className="p-2 rounded-lg transition-colors duration-150"
                    style={{ color: THEME.textTertiary }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = THEME.textPrimary)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = THEME.textTertiary)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {formState.competitive.competitors.length < 7 && (
              <button
                type="button"
                onClick={() =>
                  updateCompetitive({
                    competitors: [...formState.competitive.competitors, { name: "", positioning: "" }],
                  })
                }
                className="mt-3 text-[14px] font-medium transition-colors duration-150"
                style={{ color: THEME.accentAi }}
              >
                + Add Competitor
              </button>
            )}
          </div>

          <div>
            <FieldLabel tooltipField="competitiveEdge">Your Competitive Edge</FieldLabel>
            <TextArea
              value={formState.competitive.competitiveEdge}
              onChange={(v) => updateCompetitive({ competitiveEdge: v })}
              placeholder="What do you do better than your closest competitor?"
              maxLength={300}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStep6 = () => {
    const channelOptions = [
      "Paid Search",
      "Paid Social",
      "Organic Social",
      "SEO & Content",
      "Email",
      "Events & Conferences",
      "ABM",
      "PR & Earned Media",
      "Influencer & Partnerships",
      "Direct Mail",
      "OOH & Broadcast",
      "Affiliate",
    ];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const toggleChannel = (name: string) => {
      const existing = formState.market.activeChannels.find((c) => c.name === name);
      if (existing) {
        updateMarket({ activeChannels: formState.market.activeChannels.filter((c) => c.name !== name) });
      } else {
        updateMarket({
          activeChannels: [...formState.market.activeChannels, { name, isTopInvestment: false }],
        });
      }
    };

    const toggleStar = (name: string) => {
      const starredCount = formState.market.activeChannels.filter((c) => c.isTopInvestment).length;
      const channel = formState.market.activeChannels.find((c) => c.name === name);
      if (!channel) return;
      if (!channel.isTopInvestment && starredCount >= 3) return;
      updateMarket({
        activeChannels: formState.market.activeChannels.map((c) =>
          c.name === name ? { ...c, isTopInvestment: !c.isTopInvestment } : c
        ),
      });
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 relative">
        {showShimmer && <ShimmerOverlay />}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold" style={{ color: THEME.textPrimary, letterSpacing: "-0.02em" }}>
              Market Context
            </h1>
            <span
              className="px-3 py-1 rounded-full text-[12px] font-medium"
              style={{ color: THEME.textTertiary, border: `1px solid ${THEME.borderDefault}` }}
            >
              Optional
            </span>
          </div>
          <AiSuggestButton onClick={handleAiSuggest} loading={aiLoading} />
        </div>
        <HelperText>
          Give STRATIS the bigger picture — where you operate, when you peak, and what&apos;s keeping you up at night.
        </HelperText>

        <div className="space-y-6 mt-8">
          <div>
            <FieldLabel tooltipField="activeChannels">Active Channels</FieldLabel>
            <HelperText>Select all channels you currently invest in, then star your top 3 by spend.</HelperText>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map((ch) => {
                const entry = formState.market.activeChannels.find((c) => c.name === ch);
                const isSelected = !!entry;
                return (
                  <div key={ch} className="inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className="px-4 py-2 rounded-[20px] text-[14px] font-medium transition-all duration-120 inline-flex items-center gap-1.5"
                      style={{
                        border: `1px solid ${isSelected ? THEME.chipSelectedBorder : THEME.chipBorder}`,
                        background: isSelected ? THEME.bgSelected : "transparent",
                        color: isSelected ? THEME.textPrimary : THEME.textSecondary,
                        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
                      }}
                    >
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(ch);
                          }}
                          className="mr-0.5"
                        >
                          <Star
                            className="h-3.5 w-3.5 transition-colors duration-150"
                            style={{
                              color: entry?.isTopInvestment ? "#D4A017" : THEME.textTertiary,
                              fill: entry?.isTopInvestment ? "#D4A017" : "none",
                            }}
                          />
                        </button>
                      )}
                      {ch}
                      {isSelected && <X className="h-3 w-3 ml-1" style={{ color: THEME.textSecondary }} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <FieldLabel tooltipField="geographicFocus">Geographic Focus</FieldLabel>
            <ChipSelect
              options={["Single Country", "Multi-Country", "Global"]}
              selected={formState.market.geographicFocus ? [formState.market.geographicFocus] : []}
              onToggle={(v) =>
                updateMarket({ geographicFocus: formState.market.geographicFocus === v ? "" : v })
              }
              aiSuggested={aiSuggestedFields.has("geographicFocus")}
              onFocus={() => clearAiSuggestion("geographicFocus")}
            />
            {(formState.market.geographicFocus === "Single Country" ||
              formState.market.geographicFocus === "Multi-Country") && (
              <div className="mt-3 animate-in fade-in duration-200">
                <TextInput
                  value={formState.market.geographicDetails}
                  onChange={(v) => updateMarket({ geographicDetails: v })}
                  placeholder={
                    formState.market.geographicFocus === "Single Country"
                      ? "e.g., United States"
                      : "e.g., North America, Western Europe"
                  }
                  aiSuggested={aiSuggestedFields.has("geographicDetails")}
                  onFocus={() => clearAiSuggestion("geographicDetails")}
                />
              </div>
            )}
          </div>

          <div>
            <FieldLabel tooltipField="seasonality">Seasonality</FieldLabel>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[14px]" style={{ color: THEME.textSecondary }}>
                Does your business have significant seasonal patterns?
              </span>
              <button
                type="button"
                onClick={() => updateMarket({ hasSeasonality: !formState.market.hasSeasonality })}
                className="relative w-11 h-6 rounded-full transition-colors duration-200"
                style={{
                  background: formState.market.hasSeasonality ? THEME.accentAi : THEME.borderDefault,
                }}
              >
                <span
                  className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                  style={{
                    transform: formState.market.hasSeasonality ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </button>
            </div>
            {formState.market.hasSeasonality && (
              <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                <HelperText>Select your peak performance months. STRATIS will increase intelligence urgency before these periods.</HelperText>
                <div className="flex flex-wrap gap-2 mt-2">
                  {months.map((m, idx) => {
                    const monthNum = idx + 1;
                    const isSelected = formState.market.peakMonths.includes(monthNum);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          updateMarket({
                            peakMonths: isSelected
                              ? formState.market.peakMonths.filter((p) => p !== monthNum)
                              : [...formState.market.peakMonths, monthNum],
                          });
                        }}
                        className="w-[56px] h-[36px] rounded-lg text-[13px] font-medium transition-all duration-150"
                        style={{
                          border: `1px solid ${isSelected ? THEME.chipSelectedBorder : THEME.borderDefault}`,
                          background: isSelected ? THEME.bgSelected : "transparent",
                          color: isSelected ? THEME.textPrimary : THEME.textSecondary,
                          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <FieldLabel tooltipField="macroTrends">What Keeps You Up at Night?</FieldLabel>
            <HelperText>What broader trends or threats are top of mind? STRATIS will actively monitor these.</HelperText>
            <TagInput
              tags={formState.market.macroTrends}
              onAdd={(v) => updateMarket({ macroTrends: [...formState.market.macroTrends, v] })}
              onRemove={(v) => updateMarket({ macroTrends: formState.market.macroTrends.filter((t) => t !== v) })}
              placeholder="e.g., AI disruption, new privacy regulations, economic downturn"
              max={5}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStep7 = () => {
    const completeness = getCompleteness();
    const expandedSection = expandedReviewSection;
    const setExpandedSection = setExpandedReviewSection;

    const sections = [
      {
        step: 1,
        title: "Brand Basics",
        summary: [formState.brand.name, formState.brand.website].filter(Boolean).join(" · ") || "Not started",
        filled: !!formState.brand.name,
        details: () => (
          <div className="space-y-2 text-[14px]" style={{ color: THEME.textPrimary }}>
            <p><span style={{ color: THEME.textSecondary }}>Name:</span> {formState.brand.name || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Website:</span> {formState.brand.website || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Theme:</span> {formState.brand.theme}</p>
          </div>
        ),
      },
      {
        step: 2,
        title: "Brand Identity",
        summary:
          [
            formState.identity.industry,
            formState.identity.marketPosition,
            formState.identity.differentiators.length
              ? `${formState.identity.differentiators.length} differentiators`
              : "",
          ]
            .filter(Boolean)
            .join(" · ") || "Not started",
        filled: !!formState.identity.industry,
        details: () => (
          <div className="space-y-2 text-[14px]" style={{ color: THEME.textPrimary }}>
            <p><span style={{ color: THEME.textSecondary }}>Industry:</span> {formState.identity.industry || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Sub-Category:</span> {formState.identity.subCategory || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Position:</span> {formState.identity.marketPosition || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Value Prop:</span> {formState.identity.valueProposition || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Differentiators:</span> {formState.identity.differentiators.join(", ") || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Tone:</span> {formState.identity.brandTone.join(", ") || "—"}</p>
          </div>
        ),
      },
      {
        step: 3,
        title: "Strategic Objectives",
        summary:
          [
            formState.objectives.primaryObjective,
            formState.objectives.timeHorizon,
            formState.objectives.northStarKPIs.length
              ? `${formState.objectives.northStarKPIs.length} KPIs`
              : "",
          ]
            .filter(Boolean)
            .join(" · ") || "Not started",
        filled: !!formState.objectives.primaryObjective,
        details: () => (
          <div className="space-y-2 text-[14px]" style={{ color: THEME.textPrimary }}>
            <p><span style={{ color: THEME.textSecondary }}>Objective:</span> {formState.objectives.primaryObjective || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Horizon:</span> {formState.objectives.timeHorizon || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>KPIs:</span> {formState.objectives.northStarKPIs.join(", ") || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Budget:</span> {formState.objectives.budgetDirection || "—"}</p>
          </div>
        ),
      },
      {
        step: 4,
        title: "Target Audience",
        summary:
          [
            formState.audience.businessModel?.toUpperCase(),
            formState.audience.purchaseTriggers.length
              ? `${formState.audience.purchaseTriggers.length} purchase factors`
              : "",
          ]
            .filter(Boolean)
            .join(" · ") || "Not started",
        filled: !!formState.audience.businessModel,
        details: () => (
          <div className="space-y-2 text-[14px]" style={{ color: THEME.textPrimary }}>
            <p><span style={{ color: THEME.textSecondary }}>Model:</span> {formState.audience.businessModel?.toUpperCase() || "—"}</p>
            {formState.audience.targetCompanySize.length > 0 && (
              <p><span style={{ color: THEME.textSecondary }}>Company Size:</span> {formState.audience.targetCompanySize.join(", ")}</p>
            )}
            {formState.audience.targetIndustries.length > 0 && (
              <p><span style={{ color: THEME.textSecondary }}>Industries:</span> {formState.audience.targetIndustries.join(", ")}</p>
            )}
            <p><span style={{ color: THEME.textSecondary }}>Triggers:</span> {formState.audience.purchaseTriggers.join(", ") || "—"}</p>
          </div>
        ),
      },
      {
        step: 5,
        title: "Competitive Landscape",
        tier2: true,
        summary: formState.competitive.competitors.filter((c) => c.name).length
          ? `${formState.competitive.competitors.filter((c) => c.name).length} competitors tracked`
          : "Not yet completed",
        filled: formState.competitive.competitors.some((c) => c.name),
        details: () => (
          <div className="space-y-2 text-[14px]" style={{ color: THEME.textPrimary }}>
            {formState.competitive.competitors
              .filter((c) => c.name)
              .map((c, i) => (
                <p key={i}>
                  <span style={{ color: THEME.textSecondary }}>{c.name}:</span> {c.positioning || "—"}
                </p>
              ))}
            {formState.competitive.competitiveEdge && (
              <p><span style={{ color: THEME.textSecondary }}>Edge:</span> {formState.competitive.competitiveEdge}</p>
            )}
          </div>
        ),
      },
      {
        step: 6,
        title: "Market Context",
        tier2: true,
        summary:
          [
            formState.market.geographicFocus,
            formState.market.activeChannels.length
              ? `${formState.market.activeChannels.length} channels`
              : "",
          ]
            .filter(Boolean)
            .join(" · ") || "Not yet completed",
        filled: !!formState.market.geographicFocus || formState.market.activeChannels.length > 0,
        details: () => (
          <div className="space-y-2 text-[14px]" style={{ color: THEME.textPrimary }}>
            <p><span style={{ color: THEME.textSecondary }}>Channels:</span> {formState.market.activeChannels.map((c) => c.name).join(", ") || "—"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Geography:</span> {formState.market.geographicFocus || "—"} {formState.market.geographicDetails && `(${formState.market.geographicDetails})`}</p>
            <p><span style={{ color: THEME.textSecondary }}>Seasonality:</span> {formState.market.hasSeasonality ? `Peak: ${formState.market.peakMonths.map((m) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]).join(", ")}` : "No"}</p>
            <p><span style={{ color: THEME.textSecondary }}>Macro Trends:</span> {formState.market.macroTrends.join(", ") || "—"}</p>
          </div>
        ),
      },
    ];

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
        <h1 className="text-[28px] font-bold mb-2" style={{ color: THEME.textPrimary, letterSpacing: "-0.02em" }}>
          Review Your Brand Profile
        </h1>
        <HelperText>
          Here&apos;s what STRATIS knows about your brand. Review, edit anything, and launch your intelligence engine.
        </HelperText>

        {/* Completeness Bar */}
        <div
          className="rounded-xl p-5 mt-6 mb-8"
          style={{ border: `1px solid ${THEME.borderDefault}`, background: THEME.bgPrimary }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-semibold" style={{ color: THEME.textPrimary }}>
              Profile Completeness
            </span>
            <span className="text-[15px] font-bold" style={{ color: THEME.accentAi }}>
              {completeness}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: THEME.bgHover }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completeness}%`, background: THEME.accentAi }}
            />
          </div>
          <p className="text-[13px] mt-3" style={{ color: THEME.textSecondary }}>
            {completeness >= 100
              ? "Your brand profile is fully configured. STRATIS intelligence is optimized."
              : completeness >= 70
              ? `Great foundation. Complete remaining sections to unlock deeper intelligence.`
              : "Complete more sections to help STRATIS deliver sharper insights."}
          </p>
          <p className="text-[12px] mt-1" style={{ color: THEME.textTertiary }}>
            Your profile evolves over time — STRATIS continuously learns from market data and how your team uses insights.
          </p>
        </div>

        {/* Section Cards */}
        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.step}
              className="rounded-xl overflow-hidden transition-all duration-200"
              style={{ border: `1px solid ${THEME.borderDefault}`, background: THEME.bgPrimary }}
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedSection(expandedSection === section.step ? null : section.step)}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                  style={{
                    background: section.filled ? "rgba(74, 222, 128, 0.12)" : THEME.bgHover,
                    color: section.filled ? THEME.success : THEME.textTertiary,
                  }}
                >
                  {section.filled ? <Check className="h-3.5 w-3.5" /> : section.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold" style={{ color: THEME.textPrimary }}>
                    {section.title}
                  </p>
                  <p className="text-[13px] truncate" style={{ color: section.filled ? THEME.textSecondary : THEME.textTertiary }}>
                    {section.summary}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {section.tier2 && !section.filled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentStep(section.step);
                      }}
                      className="text-[13px] font-medium"
                      style={{ color: THEME.accentAi }}
                    >
                      Complete now
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentStep(section.step);
                    }}
                    className="text-[13px] font-medium"
                    style={{ color: THEME.textSecondary }}
                  >
                    Edit
                  </button>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      expandedSection === section.step && "rotate-180"
                    )}
                    style={{ color: THEME.textTertiary }}
                  />
                </div>
              </div>
              {expandedSection === section.step && (
                <div
                  className="px-4 pb-4 pl-[60px] animate-in fade-in slide-in-from-top-1 duration-150"
                  style={{ borderTop: `1px solid ${THEME.borderDefault}` }}
                >
                  <div className="pt-3">{section.details()}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return null;
    }
  };

  const isTier2 = currentStep === 5 || currentStep === 6;

  return (
    <div
      className="min-h-full py-10"
      style={{
        background: THEME.bgPage,
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
      }}
    >
      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="max-w-[720px] mx-auto relative">
        <SavedIndicator show={showSaved} />
        <ProgressBar current={currentStep} total={7} />

        {/* Main Card */}
        <div
          className="rounded-2xl p-8 relative"
          style={{
            background: THEME.bgPrimary,
            border: `1px solid ${THEME.borderDefault}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          {renderCurrentStep()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="text-[15px] font-medium transition-colors duration-150"
                  style={{ color: THEME.textSecondary }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = THEME.textPrimary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = THEME.textSecondary)}
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {currentStep === 7 ? (
                <button
                  type="button"
                  onClick={() => setSetupComplete(true)}
                  className="px-12 py-3.5 rounded-full text-[15px] font-medium transition-all duration-150 hover:opacity-85"
                  style={{ background: THEME.accentAi, color: "#fff" }}
                >
                  Complete Setup
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-12 py-3.5 rounded-full text-[15px] font-medium transition-all duration-150 hover:opacity-85"
                  style={{ background: "oklch(1 0 0 / 10%)", color: THEME.textPrimary, border: `1px solid oklch(1 0 0 / 12%)` }}
                >
                  Next
                </button>
              )}
              {isTier2 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="text-[13px] transition-colors duration-150 flex items-center gap-1"
                  style={{ color: THEME.textTertiary }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = THEME.textSecondary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = THEME.textTertiary)}
                >
                  I&apos;ll complete this later <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
