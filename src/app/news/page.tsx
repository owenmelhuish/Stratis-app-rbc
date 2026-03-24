"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { generateAllData } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, X, Sparkles, AlertTriangle, TrendingUp, Shield, Target, ArrowRight, ExternalLink, Bookmark, Share2 } from 'lucide-react';
import { type NewsItem, type NewsTag } from '@/types';
import { cn } from '@/lib/utils';

// ─── Section definitions ────────────────────────────────────────────────────

interface FeedSection {
  id: string;
  title: string;
  sources: string[];
  filterFn: (item: { tags: NewsTag[]; competitor?: string }) => boolean;
}

const FEED_SECTIONS: FeedSection[] = [
  {
    id: "brand",
    title: "Brand & Corporate Narrative",
    sources: ["Financial Post", "The Globe and Mail", "Strategy Online", "BNN Bloomberg"],
    filterFn: (item) => item.tags.includes("brand"),
  },
  {
    id: "banking",
    title: "Banking Industry & Regulation",
    sources: ["OSFI Bulletin", "Financial Post", "The Globe and Mail", "Canadian Banker"],
    filterFn: (item) => item.tags.includes("banking"),
  },
  {
    id: "credit-cards",
    title: "Credit Card & Payments",
    sources: ["Financial Post", "Ratehub.ca", "MoneySense", "The Globe and Mail"],
    filterFn: (item) => item.tags.includes("credit-cards"),
  },
  {
    id: "fintech",
    title: "Digital Banking & Fintech",
    sources: ["BetaKit", "TechCrunch", "Financial Post", "The Logic"],
    filterFn: (item) => item.tags.includes("fintech"),
  },
  {
    id: "social",
    title: "Social & Financial Culture",
    sources: ["Reddit r/PersonalFinanceCanada", "Reddit r/investing", "TikTok #FinTok", "YouTube"],
    filterFn: (item) => item.tags.includes("social"),
  },
  {
    id: "sports",
    title: "Sports, Events & Partnerships",
    sources: ["TSN", "Sportsnet", "Strategy Online", "The Athletic"],
    filterFn: (item) => item.tags.includes("sports"),
  },
  {
    id: "sponsorships",
    title: "Corporate Sponsorships",
    sources: ["TSN", "Sportsnet", "The Athletic", "Strategy Online"],
    filterFn: (item) => item.tags.includes("sponsorships"),
  },
  {
    id: "competitors",
    title: "Competitor Watch",
    sources: ["Financial Post", "The Globe and Mail", "Bloomberg", "J.D. Power"],
    filterFn: (item) => item.tags.includes("competitors"),
  },
  {
    id: "macro",
    title: "Macro Consumer & Financial Environment",
    sources: ["Statistics Canada", "The Globe and Mail", "Financial Post", "Bank of Canada"],
    filterFn: (item) => item.tags.includes("macro"),
  },
];

// ─── Contextual image URL from article title ────────────────────────────────

const CURATED_IMAGES: Array<{ match: RegExp; photos: string[] }> = [
  // ── Brand & Corporate Narrative ──
  { match: /CEO|corporate|brand|narrative/i, photos: ["photo-1460925895917-afdab827c52f"] },
  { match: /ESG|sustainable|sustainability/i, photos: ["photo-1559526324-4b87b5e36e44"] },
  { match: /expansion|growth/i, photos: ["photo-1555396273-367ea4eb4db5"] },

  // ── Financial Services Industry ──
  { match: /revenue|market|industry/i, photos: ["photo-1552566626-52f8b828add9"] },
  { match: /digital|fintech|platform/i, photos: ["photo-1556742393-d75f468bfcb0"] },
  { match: /banking|bank/i, photos: ["photo-1526367790999-0150786686a2"] },

  // ── Product & Innovation ──
  { match: /card|credit|avion|ion/i, photos: ["photo-1574071318508-1cdbab80d002"] },
  { match: /mortgage|home/i, photos: ["photo-1565299624946-b28f40a0ae38"] },
  { match: /invest|TFSA|wealth/i, photos: ["photo-1590947132387-155cc02f3212"] },

  // ── Digital Banking ──
  { match: /mobile|app|digital banking/i, photos: ["photo-1567620905732-2d1ec7ab7445"] },
  { match: /payment|contactless/i, photos: ["photo-1528137871618-79d2761e3fd5"] },

  // ── Social & Financial Culture ──
  { match: /reddit|tiktok|social/i, photos: ["photo-1604382354936-07c5d9983bd3"] },
  { match: /community|culture/i, photos: ["photo-1513104890138-7c749659a591"] },

  // ── Sports & Sponsorships ──
  { match: /sports|game day|NHL|hockey/i, photos: ["photo-1546519638-68e109498ffc"] },
  { match: /Maple Leafs|Raptors/i, photos: ["photo-1552566626-52f8b828add9"] },
  { match: /PWHL|women/i, photos: ["photo-1515703407324-5f753afd8be8"] },
  { match: /CFL|Lions|football/i, photos: ["photo-1487466365202-1afdb86c764e"] },

  // ── Competitor Watch ──
  { match: /TD|BMO|Scotiabank|CIBC|competitor/i, photos: ["photo-1571407970349-bc81e7e96d47"] },

  // ── Macro Environment ──
  { match: /Consumer Confidence|inflation/i, photos: ["photo-1460925895917-afdab827c52f"] },
  { match: /interest rate|Bank of Canada/i, photos: ["photo-1551288049-bebda4e38f71"] },
  { match: /housing|real estate/i, photos: ["photo-1586528116311-ad8dd3c8310d"] },
  { match: /spending|forecast/i, photos: ["photo-1607083206968-13611e3d76db"] },
];

const FALLBACK_PHOTOS = [
  "photo-1565299624946-b28f40a0ae38",
  "photo-1513104890138-7c749659a591",
  "photo-1574071318508-1cdbab80d002",
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function photoToUrl(photo: string, w: number, h: number): string {
  if (photo.startsWith("http")) return photo;
  return `https://images.unsplash.com/${photo}?w=${w}&h=${h}&fit=crop&auto=format`;
}

function articleImageUrl(title: string, id: string): string {
  const idx = hashId(id);
  for (const entry of CURATED_IMAGES) {
    if (entry.match.test(title)) {
      const photo = entry.photos[idx % entry.photos.length];
      return photoToUrl(photo, 640, 400);
    }
  }
  const photo = FALLBACK_PHOTOS[idx % FALLBACK_PHOTOS.length];
  return photoToUrl(photo, 640, 400);
}

// Larger version for the modal hero
function articleImageUrlLarge(title: string, id: string): string {
  const idx = hashId(id);
  for (const entry of CURATED_IMAGES) {
    if (entry.match.test(title)) {
      const photo = entry.photos[idx % entry.photos.length];
      return photoToUrl(photo, 1200, 500);
    }
  }
  const photo = FALLBACK_PHOTOS[idx % FALLBACK_PHOTOS.length];
  return photoToUrl(photo, 1200, 500);
}

// ─── AI Insight generator (deterministic from article) ──────────────────────

const TAG_LABELS: Record<NewsTag, string> = {
  brand: "Brand & Corporate Narrative",
  banking: "Banking Industry & Regulation",
  'credit-cards': "Credit Card & Payments",
  fintech: "Digital Banking & Fintech",
  social: "Social & Financial Culture",
  sports: "Sports, Events & Partnerships",
  sponsorships: "Corporate Sponsorships",
  competitors: "Competitor Watch",
  macro: "Macro Consumer & Financial",
};

function generateInsight(item: NewsItem): { impact: string; actions: Array<{ icon: React.ComponentType<{ className?: string }>; title: string; description: string }> } {
  const tag = item.tags[0];

  if (tag === "brand") {
    return {
      impact: "This signals a shift in how the market perceives RBC's brand narrative. Whether it's growth strategy, executive positioning, digital transformation, or ESG messaging, every public-facing signal shapes market confidence and customer trust. RBC's ability to control this narrative directly affects brand equity, investor sentiment, and competitive positioning across all divisions.",
      actions: [
        { icon: TrendingUp, title: "Amplify Positive Brand Signals", description: "If the narrative is favourable, accelerate owned and paid amplification. Feature the story across RBC's social channels and align PR with the momentum before it fades." },
        { icon: Target, title: "Track Narrative Trajectory", description: "Monitor whether this story is being picked up by other outlets and how the tone is shifting. Flag any divergence between RBC's intended positioning and how the market is interpreting it." },
        { icon: Shield, title: "Prepare Counter-Narrative if Needed", description: "If sentiment is negative or mixed, draft response messaging and identify owned channels to reinforce the brand's intended narrative around trust, innovation, and Canadian leadership." },
      ],
    };
  }
  if (tag === "banking") {
    return {
      impact: "Canada's financial services landscape is evolving rapidly with digital transformation, Open Banking regulation, and shifting consumer expectations. These industry-level shifts have direct implications for RBC's product strategy, channel mix, and competitive positioning across personal banking, wealth management, and insurance.",
      actions: [
        { icon: TrendingUp, title: "Align Strategy to Industry Momentum", description: "Cross-reference this financial services industry shift against RBC's current performance. If a trend is accelerating industry-wide, ensure RBC's marketing and product strategy reflect it before competitors respond." },
        { icon: Target, title: "Monitor Digital Banking Dynamics", description: "Track digital adoption rates, fintech market share shifts, and Open Banking readiness. Identify where industry changes create opportunity or risk for RBC's customer acquisition and retention." },
        { icon: Shield, title: "Watch for Competitive Threats", description: "Financial services industry shifts often create competitive openings — neobanks, embedded finance, or regulatory changes. Flag emerging competitive threats for strategic evaluation." },
      ],
    };
  }
  if (tag === "credit-cards") {
    return {
      impact: "Product innovation tracking helps RBC move from reacting to market trends to anticipating customer demand. Recent signals show continued consumer interest in digital-first experiences, rewards integration, sustainable investing, and personalized financial products. Catching these signals early means better product positioning, smarter launch planning, and more relevant marketing.",
      actions: [
        { icon: TrendingUp, title: "Anticipate Demand — Don't Chase It", description: "If a product category or feature is showing breakout signals, ensure RBC's innovation pipeline and marketing creative are ahead of the curve before the trend peaks." },
        { icon: Target, title: "Cross-Reference with Social Signals", description: "Check whether this product trend is being amplified on Reddit, TikTok FinTok, or financial blogs. Social amplification accelerates demand velocity and shortens the window to capture it." },
        { icon: Shield, title: "Flag Seasonal and Life-Stage Triggers", description: "Track upcoming tax seasons, RRSP deadlines, and life-stage moments. These are predictable demand drivers that RBC can build campaigns and product promotions around with lead time." },
      ],
    };
  }
  if (tag === "fintech") {
    return {
      impact: "Digital banking platforms act as real-time proxies for customer behaviour and preference. App usage patterns, feature adoption rates, and digital channel preferences reveal how customers want to interact with their finances — and where RBC can compete on experience, convenience, and personalization rather than rate alone.",
      actions: [
        { icon: TrendingUp, title: "Map Digital Trends to RBC Opportunity", description: "Cross-reference digital banking trends and feature adoption against RBC's current digital experience. Identify gaps where customer demand is proven but RBC's positioning could capture more engagement." },
        { icon: Target, title: "Track Adoption Velocity as a Leading Indicator", description: "Rapid feature adoption often precedes mainstream behaviour shifts. Flag trending digital behaviours for early product consideration and experience alignment." },
        { icon: Shield, title: "Differentiate on Digital Experience", description: "Fintech competitors compete on convenience but lack the full-service relationship. RBC's response should emphasize the integrated digital experience — banking, investing, insurance, and rewards in one ecosystem." },
      ],
    };
  }
  if (tag === "social") {
    return {
      impact: "Financial decision-making is increasingly community-driven. Reddit communities — r/PersonalFinanceCanada, r/investing — and TikTok FinTok creators are surfacing high-conviction opinions that influence real financial decisions. Unlike traditional advertising, these communities represent genuine financial enthusiasm with detailed context on why a product or institution resonates. This matters because RBC's marketing can align not just to what is trending, but to why consumers trust specific financial products.",
      actions: [
        { icon: TrendingUp, title: "Align Marketing to Community Conversation", description: "If a product, feature, or financial strategy is gaining traction on Reddit or TikTok, ensure RBC's marketing reflects the language and framing the community is using. Community-driven interest is high-conviction and specific." },
        { icon: Target, title: "Monitor Community Sentiment Velocity", description: "Track which brands, products, and financial strategies are gaining momentum across key communities. High upvote counts and comment velocity on recommendation threads are leading indicators of mainstream adoption." },
        { icon: Shield, title: "Watch for Emerging Financial Trends", description: "Social financial conversation often organizes around tips, strategies, and product comparisons. These are marketable themes RBC can build educational content and social campaigns around." },
      ],
    };
  }
  if (tag === "sports") {
    return {
      impact: "Sports and financial services are connected through brand visibility, community engagement, and cultural relevance. Game day activations, sports partnership ROI, and event-driven brand awareness represent high-impact marketing opportunities. Monitoring sports calendars, partnership effectiveness, and fan engagement patterns helps RBC maximize the value of sports-driven brand moments.",
      actions: [
        { icon: TrendingUp, title: "Align to Sports Calendar", description: "Track upcoming sports events — NHL playoffs, Olympics, community events — and ensure brand campaigns, activations, and digital content are positioned with lead time." },
        { icon: Target, title: "Monitor Sports Partnership ROI", description: "Track brand recall, app downloads, account openings, and social engagement from sports partnerships and sponsorships. Optimize activation spend based on measured impact rather than awareness assumptions." },
        { icon: Shield, title: "Position RBC as Community Champion", description: "Sports partnerships drive brand affinity beyond product marketing. RBC's community investment, youth programs, and grassroots sports initiatives are competitive advantages worth amplifying across all sports moments." },
      ],
    };
  }
  if (tag === "competitors") {
    return {
      impact: "Competitor activity from TD, BMO, Scotiabank, and CIBC directly affects RBC's market position, rate perception, and customer acquisition. Product launches, digital innovations, and marketing strategies from these competitors signal where competitive pressure is intensifying — and where RBC has an opportunity to differentiate or defend.",
      actions: [
        { icon: TrendingUp, title: "Assess Competitive Threat Level", description: "Evaluate whether this competitor move targets a segment, product line, or market where RBC has significant share. Determine if it requires a defensive response or if RBC's existing positioning is sufficient." },
        { icon: Target, title: "Monitor Customer Response", description: "Track whether this competitor promotion is shifting account openings, app downloads, or search share in overlapping markets. Digital engagement data will show impact faster than brand tracking studies." },
        { icon: Shield, title: "Identify Differentiation Opportunity", description: "Every competitor move reveals their strategic priorities — and their blind spots. Identify where RBC's strengths (integrated platform, rewards ecosystem, wealth management depth, Canadian trust) create defensible advantages the competitor cannot easily replicate." },
      ],
    };
  }
  if (tag === "sponsorships") {
    return {
      impact: "RBC's corporate sponsorships create high-visibility activation windows tied to community passion and cultural moments. League milestones, playoff runs, community events, and cultural celebrations each represent opportunities to convert sponsorship investment into brand engagement, app downloads, and account openings. The key is activating in real time — emotional peaks during these moments fade quickly.",
      actions: [
        { icon: TrendingUp, title: "Activate Around the Moment", description: "Coordinate real-time social content, push notifications, and geo-targeted promotions tied to this event. Community engagement peaks during and immediately after key moments — speed of activation determines share of the attention." },
        { icon: Target, title: "Leverage Partner Assets", description: "Use co-branded content, athlete appearances, and in-venue activations to extend reach beyond paid media. Sponsorship assets are most valuable when integrated into organic community conversation, not just displayed as logos." },
        { icon: Shield, title: "Measure Sponsorship ROI", description: "Track account openings, app downloads, card applications, and social engagement lift during and after activation windows. Build a sponsorship performance baseline to optimize future investment across all partnership properties." },
      ],
    };
  }
  if (tag === "macro") {
    return {
      impact: "Macro consumer and financial conditions directly shape RBC's performance pressure points: rate sensitivity, product demand mix, channel preferences, and marketing strategy. Canadian economic commentary in early 2026 points to interest rate shifts, housing market dynamics, and evolving savings behaviour. Understanding these forces helps STRATIS connect external conditions to strategic response.",
      actions: [
        { icon: TrendingUp, title: "Adjust Strategy to Economic Climate", description: "If consumer confidence is declining or interest rates are shifting, adjust messaging toward financial security, savings tools, and long-term value — away from premium and discretionary products." },
        { icon: Target, title: "Monitor Channel and Product Shifts", description: "Track digital banking adoption, product mix changes, and customer segment migration. Changes in how customers engage with financial services have direct implications for RBC's marketing budget allocation." },
        { icon: Shield, title: "Flag Seasonal Demand Signals Early", description: "Early indicators of RRSP season activity, tax planning behaviour, and mortgage renewal cycles help RBC calibrate promotional intensity, staffing, and campaign timing." },
      ],
    };
  }
  // default
  return {
    impact: "This development has strategic implications for RBC's positioning. Staying ahead of market shifts, consumer behaviour changes, and competitive dynamics ensures RBC can respond proactively rather than reactively.",
    actions: [
      { icon: TrendingUp, title: "Assess Strategic Impact", description: "Evaluate how this development affects RBC's current priorities and whether it warrants a change in approach across product strategy, marketing, or operations." },
      { icon: Target, title: "Cross-Reference with Other Signals", description: "Check whether this signal is being confirmed by other data sources — social conversation, customer data, competitor behaviour — to determine confidence level before acting." },
      { icon: Shield, title: "Monitor for Escalation", description: "Track whether this signal is intensifying, stabilising, or fading. Set a review point to reassess impact and determine next steps." },
    ],
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const store = useMemo(() => generateAllData(), []);
  const newsItems = store.newsItems;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedArticle(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const sections = useMemo(() => {
    const used = new Set<string>();
    return FEED_SECTIONS.map((section) => {
      const items = newsItems.filter((item) => {
        if (used.has(item.id)) return false;
        if (section.filterFn(item)) {
          used.add(item.id);
          return true;
        }
        return false;
      });
      return { ...section, items: items.slice(0, 6) };
    }).filter((s) => s.items.length > 0);
  }, [newsItems]);

  if (loading) {
    return (
      <div className="space-y-10 px-2">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-3">
                  <Skeleton className="h-44 rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const insight = selectedArticle ? generateInsight(selectedArticle) : null;

  return (
    <>
      <div className="space-y-12 px-2">
        {sections.map((section) => {
          const sourcesDisplay = section.sources.slice(0, 3).join(", ");
          const moreCount = Math.max(0, section.sources.length - 3);
          const unreadCount = section.items.length;

          return (
            <div key={section.id}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="text-lg font-bold">{section.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Monitoring: {sourcesDisplay}
                    {moreCount > 0 && <>, and {moreCount} more</>}
                    .{" "}
                    <button className="text-foreground underline underline-offset-2 hover:text-teal transition-colors">Edit</button>
                  </p>
                </div>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-1">
                  View all ({unreadCount} unread) <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-5 mt-4">
                {section.items.slice(0, 3).map((item) => {
                  const date = new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedArticle(item)}
                      className="group rounded-xl border border-border/40 bg-card overflow-hidden hover:border-border/60 hover:shadow-lg hover:shadow-black/10 transition-all cursor-pointer"
                    >
                      <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={articleImageUrl(item.title, item.id)}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold leading-snug mb-2 line-clamp-2 group-hover:text-teal transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-4">
                          <span className="font-medium text-muted-foreground/80">{item.source}</span>
                          {" "}• {date} • {item.summary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Article Detail Modal ─── */}
      {selectedArticle && insight && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] bg-card border border-border/40 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero image */}
            <div className="relative h-56 shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={articleImageUrlLarge(selectedArticle.title, selectedArticle.id)}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

              {/* Close button */}
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Tags */}
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                {selectedArticle.tags.map((tag) => (
                  <span key={tag} className="text-[10px] font-semibold text-white/90 bg-white/15 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full">
                    {TAG_LABELS[tag]}
                  </span>
                ))}
                <span className={cn(
                  "text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm",
                  selectedArticle.urgency === "high" ? "text-red-300 bg-red-500/20 border border-red-500/20" :
                  selectedArticle.urgency === "medium" ? "text-amber-300 bg-amber-500/20 border border-amber-500/20" :
                  "text-white/70 bg-white/10 border border-white/10"
                )}>
                  {selectedArticle.urgency.charAt(0).toUpperCase() + selectedArticle.urgency.slice(1)} Priority
                </span>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-auto px-6 pb-6">
              {/* Article header */}
              <div className="pt-4 pb-5">
                <h2 className="text-xl font-bold leading-tight mb-3">{selectedArticle.title}</h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70">{selectedArticle.source}</span>
                  <span>•</span>
                  <span>{new Date(selectedArticle.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>

              {/* Article body */}
              <div className="space-y-4 mb-6">
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedArticle.summary}</p>
                {selectedArticle.competitor && (
                  <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300/80">
                      <span className="font-semibold text-red-400">Competitor Alert:</span> This article involves <span className="font-semibold">{selectedArticle.competitor}</span>, a competing brand in RBC&apos;s market.
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border/30 my-6" />

              {/* STRATIS Insight */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal/20 to-emerald-500/10 border border-teal/20 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-teal" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">STRATIS Insight</h3>
                    <p className="text-[10px] text-muted-foreground/60">What this means for RBC</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{insight.impact}</p>

                {/* Why it matters callout */}
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-teal/5 border border-teal/10 mb-6">
                  <TrendingUp className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <p className="text-xs text-teal/80">
                    <span className="font-semibold text-teal">Why it matters:</span> {selectedArticle.whyItMatters}
                  </p>
                </div>

                {/* Recommended actions */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50 mb-3">Recommended Actions</h4>
                <div className="space-y-3">
                  {insight.actions.map((action, i) => (
                    <div key={i} className="group/action flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-border/20 hover:border-teal/20 hover:bg-teal/5 transition-all cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                        <action.icon className="h-4 w-4 text-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-semibold">{action.title}</h5>
                          <ArrowRight className="h-3 w-3 text-teal opacity-0 group-hover/action:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="shrink-0 border-t border-border/30 px-6 py-3 flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  <Bookmark className="h-3.5 w-3.5" /> Save
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" /> Source
                </button>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal text-white text-xs font-semibold hover:bg-teal/90 transition-colors">
                <Sparkles className="h-3.5 w-3.5" /> Generate Insight Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
