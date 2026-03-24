"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Zap,
  ArrowUp,
  Paperclip,
  Sparkles,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Target,
  ChevronRight,
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from "lucide-react";

// ─── Suggested prompts ──────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: BarChart3, label: "Campaign Performance", prompt: "How are my campaigns performing this week?" },
  { icon: TrendingUp, label: "ROAS Analysis", prompt: "Which channels have the highest ROAS for card acquisition?" },
  { icon: Lightbulb, label: "Optimization Tips", prompt: "What budget optimizations do you recommend across divisions?" },
  { icon: Target, label: "Audience Insights", prompt: "Show me audience performance across product lines" },
];

// ─── Mock conversation ──────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const WELCOME_MESSAGES: Message[] = [];

// ─── Simulated AI response ─────────────────────────────────────────────────

function getAIResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("performing") || lower.includes("performance")) {
    return `Here's a snapshot of your campaign performance this week:

**Overall Metrics (Last 7 Days)**
- **Total Spend:** $1.82M (+3.2% vs. prior week)
- **Revenue:** $4.1M (+5.1%)
- **ROAS:** 2.25x (stable)
- **Conversions:** 8,340 (+4.8%)

**Top Performers:**
1. **Google Search — RBC Mortgage Branded Terms** — 4.8x ROAS, $189K spend
2. **Meta — Avion Retargeting** — 3.7x ROAS, $124K spend
3. **TikTok — ION Card Launch** — 2.9x ROAS, $167K spend

**Needs Attention:**
- TTD Programmatic display CPA is up 12% — recommend reducing frequency cap
- Instagram Story placements seeing creative fatigue (CTR down 18%)

Would you like me to drill into any specific campaign or channel?`;
  }

  if (lower.includes("roas") || lower.includes("return")) {
    return `Here's your ROAS breakdown by channel:

| Channel | ROAS | Spend | Revenue |
|---------|------|-------|---------|
| Google Search | 4.2x | $385K | $1.62M |
| Meta (Facebook + IG) | 2.8x | $520K | $1.46M |
| TikTok | 2.4x | $310K | $744K |
| The Trade Desk | 1.8x | $195K | $351K |

**Key Insight:** Google Search continues to lead on efficiency, but Meta drives the highest absolute revenue. TikTok is showing strong growth momentum — ROAS is up 0.6x from last month on ION and student campaigns.

**Recommendation:** Consider shifting 5-8% of TTD budget toward TikTok to capture the upward trend while maintaining Search investment.`;
  }

  if (lower.includes("budget") || lower.includes("optimization") || lower.includes("optimiz")) {
    return `Based on my analysis, here are my top 3 budget optimization recommendations:

**1. Reallocate TTD Underperformers → TikTok** 🔄
Move ~$40K/month from low-performing TTD segments (CPA > $180) to TikTok prospecting for ION and student campaigns. Expected impact: +$96K revenue/month.

**2. Increase Google Brand Bid Caps** ⬆️
Your branded mortgage and credit card terms are hitting budget caps by 2pm daily. Increasing daily budget by 15% ($13K/month) could capture an estimated 4,200 additional high-intent clicks.

**3. Consolidate Meta Ad Sets** 🎯
You have 14 ad sets with <$50/day budget across Avion and Rewards campaigns. Consolidating to 6 will help Meta's algorithm optimize faster. Expected CPA reduction: 8-12%.

**Total projected impact:** +$280K revenue/month with only $53K additional spend.

Want me to create an implementation plan for any of these?`;
  }

  if (lower.includes("audience") || lower.includes("insight")) {
    return `Here's what I'm seeing across your audience segments:

**Top Converting Segments:**
- **Young Professionals (25-34)** — 3.8% CVR, $142 CPA — Strong conversion on ION card and Direct Investing campaigns. TikTok and Instagram are primary discovery channels.
- **High-Net-Worth ($200K+ HHI)** — 2.1% CVR, $285 CPA — Highest lifetime value segment. Dominion Securities and Avion Infinite driving strong portfolio returns via LinkedIn and CTV.
- **Families (35-55)** — 2.9% CVR, $168 CPA — Steady mortgage and insurance converters. Google Search and Facebook are primary channels.
- **Students (18-24)** — 4.2% CVR, $62 CPA — Highest conversion rate on ION Student Crossover. TikTok and Spotify driving awareness efficiently.

**Emerging Opportunity:**
The Students segment is showing a 240% increase in engagement with TFSA and investing content on TikTok over the past 30 days. This segment is also driving unexpected crossover into Direct Investing — 18% of student ION cardholders have opened a TFSA within 90 days.

**Recommendation:** Expand ION Student Crossover with Direct Investing cross-sell creative on TikTok. Estimated incremental account openings: 2,400/month.

Shall I draft a targeting strategy?`;
  }

  return `I've analyzed your question. Here's what I found:

Based on your current campaign data across all channels and divisions, I can see several patterns worth highlighting:

- Your overall portfolio ROAS is strong at 2.25x, trending above the financial services benchmark
- Spend pacing is on track at 94% of monthly budget with 8 days remaining
- 3 campaigns have been flagged for creative refresh based on declining engagement metrics

Would you like me to go deeper into any specific area — performance, creative, audiences, or budget allocation?`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(WELCOME_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: getAIResponse(text),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="-m-8 flex flex-col h-[calc(100vh-57px)] bg-background overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-auto">
        {isEmpty ? (
          /* ─── Empty state ─── */
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal/20 to-emerald-500/10 border border-teal/20 flex items-center justify-center mb-6">
              <Zap className="h-8 w-8 text-teal" />
            </div>
            <h1 className="text-2xl font-bold mb-2">STRATIS Assistant</h1>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-10">
              Your AI-powered media strategist. Ask about campaign performance, budget optimization, audience insights, or creative strategy.
            </p>

            {/* Suggestion cards */}
            <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  className="group flex items-start gap-3 p-4 rounded-xl bg-card border border-border/30 hover:border-teal/30 hover:bg-teal/5 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border/20 flex items-center justify-center shrink-0 group-hover:bg-teal/10 group-hover:border-teal/20 transition-colors">
                    <s.icon className="h-4 w-4 text-muted-foreground group-hover:text-teal transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground mb-0.5">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground/70 line-clamp-2">{s.prompt}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-teal/50 shrink-0 mt-1 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ─── Conversation ─── */
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal/20 to-emerald-500/10 border border-teal/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-teal" />
                  </div>
                )}
                <div className={cn("max-w-[85%] min-w-0", msg.role === "user" && "order-first")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-teal text-white rounded-br-md"
                        : "bg-card border border-border/30 rounded-bl-md"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div
                        className="prose prose-sm prose-invert max-w-none
                          [&_strong]:text-foreground [&_strong]:font-semibold
                          [&_p]:text-muted-foreground [&_p]:mb-3 [&_p:last-child]:mb-0
                          [&_li]:text-muted-foreground [&_li]:mb-1
                          [&_table]:text-[12px] [&_th]:text-foreground [&_th]:font-semibold [&_th]:pb-2 [&_th]:pr-4 [&_th]:text-left
                          [&_td]:text-muted-foreground [&_td]:py-1.5 [&_td]:pr-4
                          [&_h2]:text-foreground [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-4
                          [&_code]:text-teal [&_code]:bg-teal/10 [&_code]:px-1 [&_code]:rounded"
                        dangerouslySetInnerHTML={{
                          __html: msg.content
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\n\n/g, "</p><p>")
                            .replace(/\n\|(.+)\|/g, (_, row) => {
                              const cells = row.split("|").map((c: string) => c.trim());
                              return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join("")}</tr>`;
                            })
                            .replace(/\n- /g, "</p><li>")
                            .replace(/\n(\d+)\. /g, "</p><li>")
                            .replace(/^/, "<p>")
                            .replace(/$/, "</p>"),
                        }}
                      />
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  {/* Message actions */}
                  <div className={cn("flex items-center gap-1 mt-1.5 px-1", msg.role === "user" && "justify-end")}>
                    <span className="text-[10px] text-muted-foreground/40 mr-2">{msg.timestamp}</span>
                    {msg.role === "assistant" && (
                      <>
                        <button className="p-1 rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                          <Copy className="h-3 w-3" />
                        </button>
                        <button className="p-1 rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button className="p-1 rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                        <button className="p-1 rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border/20 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal/20 to-emerald-500/10 border border-teal/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-teal" />
                </div>
                <div className="bg-card border border-border/30 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal/60 animate-bounce [animation-delay:0ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal/60 animate-bounce [animation-delay:150ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ─── Input bar ─── */}
      <div className="border-t border-border/30 bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-card border border-border/40 rounded-2xl px-4 py-3 shadow-lg shadow-black/10 focus-within:border-teal/30 transition-colors">
            <button className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-colors shrink-0 mb-0.5">
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask STRATIS anything about your campaigns..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none max-h-[120px]"
              style={{ height: "auto", minHeight: "24px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
              <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <Sparkles className="h-3 w-3" />
                STRATIS AI
              </button>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                  input.trim() && !isTyping
                    ? "bg-teal text-white hover:bg-teal/90"
                    : "bg-muted/50 text-muted-foreground/30"
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/30 text-center mt-2">
            STRATIS AI can make mistakes. Verify important campaign decisions with your team.
          </p>
        </div>
      </div>
    </div>
  );
}
