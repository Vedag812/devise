"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { API } from "@/lib/api"
import {
    TrendingUp, TrendingDown, Shield, CheckCircle2, XCircle,
    Activity, BarChart3, Lock, Zap, ArrowRight, AlertTriangle
} from "lucide-react"

// ── 1. TRADE HISTORY ─────────────────────────────────────────────────────
interface TradeHistoryProps { className?: string }

export function TradeHistory({ className }: TradeHistoryProps) {
    const [orders, setOrders] = React.useState<any[]>([])
    const [source, setSource] = React.useState("")

    React.useEffect(() => {
        fetch(API.orders)
            .then(r => r.json())
            .then(d => { setOrders(d.orders || []); setSource(d.source || "") })
            .catch(() => {})
    }, [])

    return (
        <div className={cn("border border-white/[0.06] bg-white/[0.01] overflow-hidden", className)}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Trade History</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-black uppercase border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {source === "alpaca_live" ? "LIVE" : "OFFLINE"}
                </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto scrollbar-thin">
                {orders.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-white/10 text-[10px] font-black uppercase tracking-widest">
                        No orders yet — Run a pipeline
                    </div>
                ) : (
                    <table className="w-full text-[9px]">
                        <thead>
                            <tr className="border-b border-white/[0.04] text-white/20 uppercase tracking-widest">
                                <th className="text-left px-3 py-2 font-black">Ticker</th>
                                <th className="text-left px-3 py-2 font-black">Side</th>
                                <th className="text-left px-3 py-2 font-black">Qty</th>
                                <th className="text-left px-3 py-2 font-black hidden sm:table-cell">Price</th>
                                <th className="text-left px-3 py-2 font-black">Status</th>
                                <th className="text-left px-3 py-2 font-black hidden md:table-cell">Order ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o, i) => (
                                <motion.tr
                                    key={o.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-3 py-2 font-black text-white/70">{o.ticker}</td>
                                    <td className="px-3 py-2">
                                        <span className={cn(
                                            "px-1.5 py-0.5 font-black uppercase",
                                            o.side === "buy" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                                        )}>
                                            {o.side}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-white/50 font-bold">{o.qty}</td>
                                    <td className="px-3 py-2 text-white/40 hidden sm:table-cell">
                                        {o.filled_avg_price ? `$${parseFloat(o.filled_avg_price).toFixed(2)}` : "—"}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className={cn(
                                            "px-1.5 py-0.5 font-black uppercase text-[8px]",
                                            o.status === "filled" ? "text-emerald-400 bg-emerald-500/10" :
                                            o.status === "new" || o.status === "accepted" ? "text-cyan-400 bg-cyan-500/10" :
                                            "text-white/30 bg-white/5"
                                        )}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-white/15 font-mono hidden md:table-cell">{o.id?.slice(0, 8)}</td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}


// ── 2. ENFORCEMENT SCORECARD ──────────────────────────────────────────────
interface EnforcementScorecardProps { className?: string }

export function EnforcementScorecard({ className }: EnforcementScorecardProps) {
    const [stats, setStats] = React.useState<any>(null)

    React.useEffect(() => {
        fetch(API.stats)
            .then(r => r.json())
            .then(d => setStats(d))
            .catch(() => {})
    }, [])

    const refreshStats = () => {
        fetch(API.stats)
            .then(r => r.json())
            .then(d => setStats(d))
            .catch(() => {})
    }

    // Refresh every 5 seconds
    React.useEffect(() => {
        const interval = setInterval(refreshStats, 5000)
        return () => clearInterval(interval)
    }, [])

    if (!stats) return null

    const cards = [
        { label: "Checks Passed", value: stats.passed, icon: CheckCircle2, color: "emerald" },
        { label: "Blocked", value: stats.blocked, icon: XCircle, color: "red" },
        { label: "Injections Caught", value: stats.injections_caught, icon: AlertTriangle, color: "amber" },
        { label: "Tokens Issued", value: stats.tokens_issued, icon: Lock, color: "cyan" },
        { label: "Policy Rules", value: stats.policy_rules, icon: Shield, color: "purple" },
    ]

    return (
        <div className={cn("border border-white/[0.06] bg-white/[0.01] overflow-hidden", className)}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-flame" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Enforcement Scorecard</span>
                </div>
                <div className="text-[8px] font-black uppercase text-flame/60 tracking-widest">
                    {stats.enforcement_rate} block rate
                </div>
            </div>
            <div className="grid grid-cols-5 divide-x divide-white/[0.04]">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="px-3 py-3 text-center"
                    >
                        <card.icon className={cn(
                            "w-4 h-4 mx-auto mb-1.5",
                            card.color === "emerald" ? "text-emerald-400/60" :
                            card.color === "red" ? "text-red-400/60" :
                            card.color === "amber" ? "text-amber-400/60" :
                            card.color === "cyan" ? "text-cyan-400/60" :
                            "text-purple-400/60"
                        )} />
                        <div className={cn(
                            "text-xl font-black",
                            card.color === "emerald" ? "text-emerald-400" :
                            card.color === "red" ? "text-red-400" :
                            card.color === "amber" ? "text-amber-400" :
                            card.color === "cyan" ? "text-cyan-400" :
                            "text-purple-400"
                        )}>
                            {card.value}
                        </div>
                        <div className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-0.5">{card.label}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}


// ── 3. ARCHITECTURE DIAGRAM ───────────────────────────────────────────────
interface ArchDiagramProps { className?: string }

export function ArchDiagram({ className }: ArchDiagramProps) {
    const nodes = [
        { id: "analyst", label: "ANALYST AGENT", sub: "Research + Data", icon: Activity, color: "cyan" },
        { id: "risk", label: "RISK AGENT", sub: "Policy Validation", icon: Shield, color: "amber" },
        { id: "armorclaw", label: "ARMORCLAW", sub: "Intent Enforcement", icon: Lock, color: "red" },
        { id: "trader", label: "TRADER AGENT", sub: "Alpaca Execution", icon: Zap, color: "emerald" },
    ]

    return (
        <div className={cn("border border-white/[0.06] bg-white/[0.01] overflow-hidden", className)}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Architecture</span>
                </div>
                <div className="text-[8px] font-black uppercase text-white/15 tracking-widest">OpenClaw + ArmorClaw</div>
            </div>
            <div className="px-4 py-4">
                {/* Pipeline flow */}
                <div className="flex items-center justify-between gap-2">
                    {nodes.map((node, i) => (
                        <React.Fragment key={node.id}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn(
                                    "flex-1 border p-3 text-center relative group",
                                    node.color === "cyan" ? "border-cyan-500/20 bg-cyan-500/[0.03]" :
                                    node.color === "amber" ? "border-amber-500/20 bg-amber-500/[0.03]" :
                                    node.color === "red" ? "border-red-500/20 bg-red-500/[0.03]" :
                                    "border-emerald-500/20 bg-emerald-500/[0.03]"
                                )}
                            >
                                <node.icon className={cn(
                                    "w-5 h-5 mx-auto mb-1.5",
                                    node.color === "cyan" ? "text-cyan-400" :
                                    node.color === "amber" ? "text-amber-400" :
                                    node.color === "red" ? "text-red-400" :
                                    "text-emerald-400"
                                )} />
                                <div className="text-[8px] font-black text-white/60 uppercase tracking-wider">{node.label}</div>
                                <div className="text-[7px] text-white/20 mt-0.5">{node.sub}</div>
                            </motion.div>
                            {i < nodes.length - 1 && (
                                <ArrowRight className="w-4 h-4 text-white/10 shrink-0" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
                {/* Labels */}
                <div className="flex items-center justify-between mt-3 text-[7px] font-black uppercase tracking-widest">
                    <span className="text-cyan-400/40">REASONING</span>
                    <span className="text-white/10">─── DeviceToken (HMAC-SHA256) ───</span>
                    <span className="text-emerald-400/40">EXECUTION</span>
                </div>
            </div>
        </div>
    )
}


// ── 4. STOCK PRICE CARDS ──────────────────────────────────────────────────
interface StockCardsProps {
    stocks: any[]
    selectedTicker: string
    onSelect: (ticker: string) => void
    className?: string
}

export function StockCards({ stocks, selectedTicker, onSelect, className }: StockCardsProps) {
    if (stocks.length === 0) return null

    return (
        <div className={cn("grid grid-cols-3 gap-3", className)}>
            {stocks.map((s, i) => {
                const change = s.price && s.prev_close ? ((s.price - s.prev_close) / s.prev_close * 100) : 0
                const isUp = change >= 0
                const isSelected = selectedTicker === s.ticker

                return (
                    <motion.button
                        key={s.ticker}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        onClick={() => onSelect(s.ticker)}
                        className={cn(
                            "border p-4 text-left transition-all relative overflow-hidden group",
                            isSelected
                                ? "border-flame/40 bg-flame/[0.05] shadow-[0_0_20px_rgba(254,127,45,0.08)]"
                                : "border-white/[0.06] bg-white/[0.01] hover:border-white/15"
                        )}
                    >
                        {isSelected && (
                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-flame/40 border-l-[20px] border-l-transparent" />
                        )}
                        <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                                "text-sm font-black uppercase",
                                isSelected ? "text-flame" : "text-white/60"
                            )}>
                                {s.ticker}
                            </span>
                            <span className={cn(
                                "flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5",
                                isUp ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                            )}>
                                {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                            </span>
                        </div>
                        <div className="text-lg font-black text-white/80">${s.price?.toFixed(2)}</div>
                        <div className="flex items-center justify-between mt-2 text-[8px] text-white/20">
                            <span>Vol: {(s.volume / 1e6)?.toFixed(1)}M</span>
                            <span className={cn(
                                "px-1 py-0.5 font-black text-[7px] uppercase",
                                s.source === "alpaca_live" ? "text-emerald-400/60 bg-emerald-500/5" : "text-white/20"
                            )}>
                                {s.source === "alpaca_live" ? "LIVE" : "SIM"}
                            </span>
                        </div>
                    </motion.button>
                )
            })}
        </div>
    )
}
