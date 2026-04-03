"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { API, fetchWithRetry } from "@/lib/api"
import {
    TrendingUp, TrendingDown, Shield, CheckCircle2, XCircle,
    Activity, BarChart3, Lock, Zap, ArrowRight, AlertTriangle,
    Wifi, WifiOff, RefreshCw, DollarSign, PieChart
} from "lucide-react"


// ── MARKET STATUS ─────────────────────────────────────────────────────────
export function MarketStatus({ className }: { className?: string }) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [timeStr, setTimeStr] = React.useState("")

    React.useEffect(() => {
        const check = () => {
            const now = new Date()
            const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
            const h = et.getHours()
            const m = et.getMinutes()
            const day = et.getDay()
            const open = day >= 1 && day <= 5 && ((h === 9 && m >= 30) || (h >= 10 && h < 16))
            setIsOpen(open)
            setTimeStr(et.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "America/New_York" }))
        }
        check()
        const t = setInterval(check, 30000)
        return () => clearInterval(t)
    }, [])

    return (
        <div className={cn("flex items-center gap-2 px-3 py-1.5 border text-[9px] font-black uppercase tracking-wider", isOpen ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-red-500/20 text-red-400/60 bg-red-500/5", className)}>
            {isOpen ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOpen ? "MARKET OPEN" : "MARKET CLOSED"}</span>
            <span className="text-white/20">|</span>
            <span className="text-white/30">{timeStr} ET</span>
        </div>
    )
}


// ── PORTFOLIO TRACKER ─────────────────────────────────────────────────────
interface PortfolioTrackerProps {
    portfolio: any
    onRefresh: () => void
    className?: string
}

export function PortfolioTracker({ portfolio, onRefresh, className }: PortfolioTrackerProps) {
    const [lastRefresh, setLastRefresh] = React.useState(Date.now())

    // Auto-refresh every 30s
    React.useEffect(() => {
        const t = setInterval(() => { onRefresh(); setLastRefresh(Date.now()) }, 30000)
        return () => clearInterval(t)
    }, [onRefresh])

    const [pendingOrders, setPendingOrders] = React.useState<any[]>([])
    React.useEffect(() => {
        fetchWithRetry(API.orders)
            .then(r => r.json())
            .then(d => setPendingOrders((d.orders || []).filter((o: any) => o.status === "accepted" || o.status === "new" || o.status === "pending_new")))
            .catch(() => {})
    }, [])

    if (!portfolio) return null

    const equity = Number(portfolio.equity)
    const cash = Number(portfolio.cash)
    const positions = portfolio.positions || []
    // Calculate committed: sum of pending orders estimated value
    const committed = pendingOrders.reduce((sum: number, o: any) => {
        const price = Number(o.filled_avg_price) || 0
        const qty = Number(o.qty) || 0
        return sum + (price > 0 ? price * qty : qty * 150) // est $150/share if no price
    }, 0)
    const totalInvested = positions.reduce((sum: number, p: any) => sum + Number(p.market_value || 0), 0) + committed
    const pnl = equity - 100000
    const pnlPct = ((equity - 100000) / 100000 * 100)

    return (
        <div className={cn("border border-white/[0.06] bg-white/[0.01] overflow-hidden", className)}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <PieChart className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Portfolio</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[7px] text-white/15 uppercase">Alpaca Paper</span>
                    <button onClick={() => { onRefresh(); setLastRefresh(Date.now()) }} className="text-white/20 hover:text-flame transition-colors">
                        <RefreshCw className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 divide-x divide-white/[0.04]">
                {[
                    { label: "Equity", value: `$${equity.toLocaleString()}`, icon: DollarSign, color: "emerald" },
                    { label: "Cash", value: `$${cash.toLocaleString()}`, icon: DollarSign, color: "white" },
                ].map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-3 py-3 text-center"
                    >
                        <card.icon className={cn("w-3.5 h-3.5 mx-auto mb-1", card.color === "emerald" ? "text-emerald-400/50" : "text-white/20")} />
                        <div className={cn("text-xl font-black", card.color === "emerald" ? "text-emerald-400" : "text-white/60")}>
                            {card.value}
                        </div>
                        <div className="text-[7px] font-black text-white/20 uppercase tracking-widest">{card.label}</div>
                    </motion.div>
                ))}
            </div>
            <div className="grid grid-cols-3 divide-x divide-white/[0.04] border-t border-white/[0.04]">
                {[
                    { label: "Invested", value: `$${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "flame", sub: totalInvested === 0 && pendingOrders.length > 0 ? `${pendingOrders.length} pending` : "" },
                    { label: "P&L", value: `${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: pnl >= 0 ? "emerald" : "red", sub: `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%` },
                    { label: "Orders", value: `${pendingOrders.length}`, color: pendingOrders.length > 0 ? "cyan" : "white", sub: pendingOrders.length > 0 ? "PENDING" : "NONE" },
                ].map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                        className="px-3 py-2.5 text-center"
                    >
                        <div className={cn("text-lg font-black",
                            card.color === "emerald" ? "text-emerald-400" :
                            card.color === "red" ? "text-red-400" :
                            card.color === "flame" ? "text-flame" :
                            card.color === "cyan" ? "text-cyan-400" :
                            "text-white/40"
                        )}>
                            {card.value}
                        </div>
                        <div className="text-[7px] font-black text-white/20 uppercase tracking-widest">{card.label}</div>
                        {card.sub && <div className={cn("text-[7px] font-bold mt-0.5", card.color === "emerald" ? "text-emerald-400/60" : card.color === "red" ? "text-red-400/60" : card.color === "cyan" ? "text-cyan-400/60" : "text-flame/60")}>{card.sub}</div>}
                </motion.div>
                ))}
            </div>


            {/* Positions */}
            {positions.length > 0 && (
                <div className="border-t border-white/[0.04]">
                    <div className="px-3 py-1.5 text-[8px] font-black text-white/20 uppercase tracking-widest bg-white/[0.01]">
                        Open Positions ({positions.length})
                    </div>
                    {positions.map((p: any) => {
                        const unrealized = Number(p.unrealized_pl || 0)
                        return (
                            <div key={p.symbol} className="flex items-center justify-between px-3 py-2 border-t border-white/[0.03] text-[9px]">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-white/70">{p.symbol}</span>
                                    <span className="text-white/20">{p.qty} shares</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-white/30">${Number(p.current_price).toFixed(2)}</span>
                                    <span className={cn("font-black", unrealized >= 0 ? "text-emerald-400" : "text-red-400")}>
                                        {unrealized >= 0 ? "+" : ""}${unrealized.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="px-3 py-1 border-t border-white/[0.04] text-[7px] text-white/10 flex justify-between">
                <span>Source: {portfolio.source}</span>
                <span>Updated {Math.round((Date.now() - lastRefresh) / 1000)}s ago</span>
            </div>
        </div>
    )
}


// ── TRADE HISTORY ─────────────────────────────────────────────────────────
interface TradeHistoryProps { className?: string }

export function TradeHistory({ className }: TradeHistoryProps) {
    const [orders, setOrders] = React.useState<any[]>([])
    const [source, setSource] = React.useState("")

    const refresh = React.useCallback(() => {
        fetchWithRetry(API.orders)
            .then(r => r.json())
            .then(d => { setOrders(d.orders || []); setSource(d.source || "") })
            .catch(() => {})
    }, [])

    React.useEffect(() => { refresh() }, [refresh])
    React.useEffect(() => {
        const t = setInterval(refresh, 15000)
        return () => clearInterval(t)
    }, [refresh])

    return (
        <div className={cn("border border-white/[0.06] bg-white/[0.01] overflow-hidden", className)}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Trade History</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] text-white/15 uppercase">{orders.length} orders</span>
                    <div className={cn("flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-black uppercase border", source === "alpaca_live" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-white/10 text-white/25 bg-white/5")}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", source === "alpaca_live" ? "bg-emerald-400 animate-pulse" : "bg-white/20")} />
                        {source === "alpaca_live" ? "LIVE" : "OFFLINE"}
                    </div>
                </div>
            </div>
            <div className="max-h-[180px] overflow-y-auto scrollbar-thin">
                {orders.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-white/10 text-[10px] font-black uppercase tracking-widest">
                        No orders — Run a pipeline
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
                                <th className="text-left px-3 py-2 font-black hidden md:table-cell">Time</th>
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
                                        <span className={cn("px-1.5 py-0.5 font-black uppercase", o.side === "buy" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10")}>
                                            {o.side}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-white/50 font-bold">{o.qty}</td>
                                    <td className="px-3 py-2 text-white/40 hidden sm:table-cell">
                                        {o.filled_avg_price ? `$${parseFloat(o.filled_avg_price).toFixed(2)}` : "—"}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className={cn("px-1.5 py-0.5 font-black uppercase text-[8px]",
                                            o.status === "filled" ? "text-emerald-400 bg-emerald-500/10" :
                                            o.status === "new" || o.status === "accepted" ? "text-cyan-400 bg-cyan-500/10" :
                                            "text-white/30 bg-white/5"
                                        )}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-white/15 hidden md:table-cell">
                                        {o.submitted_at ? new Date(o.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}


// ── ENFORCEMENT SCORECARD ──────────────────────────────────────────────────
interface EnforcementScorecardProps { className?: string }

export function EnforcementScorecard({ className }: EnforcementScorecardProps) {
    const [stats, setStats] = React.useState<any>(null)

    const refresh = React.useCallback(() => {
        fetchWithRetry(API.stats)
            .then(r => r.json())
            .then(d => setStats(d))
            .catch(() => {})
    }, [])

    React.useEffect(() => { refresh() }, [refresh])
    React.useEffect(() => {
        const t = setInterval(refresh, 5000)
        return () => clearInterval(t)
    }, [refresh])

    if (!stats) return null

    const cards = [
        { label: "Passed", value: stats.passed, icon: CheckCircle2, color: "emerald" },
        { label: "Blocked", value: stats.blocked, icon: XCircle, color: "red" },
        { label: "Injections", value: stats.injections_caught, icon: AlertTriangle, color: "amber" },
        { label: "Tokens", value: stats.tokens_issued, icon: Lock, color: "cyan" },
        { label: "Rules", value: stats.policy_rules, icon: Shield, color: "purple" },
    ]

    return (
        <div className={cn("border border-white/[0.06] bg-white/[0.01] overflow-hidden", className)}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-flame" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Enforcement</span>
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
                        className="px-2 py-3 text-center"
                    >
                        <card.icon className={cn("w-3.5 h-3.5 mx-auto mb-1",
                            card.color === "emerald" ? "text-emerald-400/60" :
                            card.color === "red" ? "text-red-400/60" :
                            card.color === "amber" ? "text-amber-400/60" :
                            card.color === "cyan" ? "text-cyan-400/60" :
                            "text-purple-400/60"
                        )} />
                        <div className={cn("text-lg font-black",
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


// ── ARCHITECTURE DIAGRAM ───────────────────────────────────────────────────
interface ArchDiagramProps { className?: string }

export function ArchDiagram({ className }: ArchDiagramProps) {
    const nodes = [
        { id: "analyst", label: "ANALYST", sub: "Research + Data", icon: Activity, color: "cyan" },
        { id: "risk", label: "RISK", sub: "Policy Gate", icon: Shield, color: "amber" },
        { id: "armorclaw", label: "ARMORCLAW", sub: "Intent Enforce", icon: Lock, color: "red" },
        { id: "trader", label: "TRADER", sub: "Alpaca Exec", icon: Zap, color: "emerald" },
    ]

    return (
        <div className={cn("border border-white/[0.06] bg-white/[0.01] overflow-hidden", className)}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Architecture</span>
                </div>
                <div className="text-[8px] font-black uppercase text-white/15 tracking-widest">OpenClaw</div>
            </div>
            <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-1">
                    {nodes.map((node, i) => (
                        <React.Fragment key={node.id}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn("flex-1 border p-2 text-center",
                                    node.color === "cyan" ? "border-cyan-500/20 bg-cyan-500/[0.03]" :
                                    node.color === "amber" ? "border-amber-500/20 bg-amber-500/[0.03]" :
                                    node.color === "red" ? "border-red-500/20 bg-red-500/[0.03]" :
                                    "border-emerald-500/20 bg-emerald-500/[0.03]"
                                )}
                            >
                                <node.icon className={cn("w-4 h-4 mx-auto mb-1",
                                    node.color === "cyan" ? "text-cyan-400" :
                                    node.color === "amber" ? "text-amber-400" :
                                    node.color === "red" ? "text-red-400" :
                                    "text-emerald-400"
                                )} />
                                <div className="text-[7px] font-black text-white/50 uppercase">{node.label}</div>
                                <div className="text-[6px] text-white/15 mt-0.5">{node.sub}</div>
                            </motion.div>
                            {i < nodes.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-white/10 shrink-0" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex items-center justify-between mt-2 text-[7px] font-black uppercase tracking-widest">
                    <span className="text-cyan-400/30">REASONING</span>
                    <span className="text-white/8">─ DeviceToken (HMAC) ─</span>
                    <span className="text-emerald-400/30">EXECUTION</span>
                </div>
            </div>
        </div>
    )
}


// ── STOCK PRICE CARDS ──────────────────────────────────────────────────────
interface StockCardsProps {
    stocks: any[]
    selectedTicker: string
    onSelect: (ticker: string) => void
    className?: string
}

export function StockCards({ stocks, selectedTicker, onSelect, className }: StockCardsProps) {
    if (stocks.length === 0) return null

    return (
        <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2", className)}>
            {stocks.map((s, i) => {
                const change = s.price && s.prev_close ? ((s.price - s.prev_close) / s.prev_close * 100) : 0
                const isUp = change >= 0
                const isSelected = selectedTicker === s.ticker
                const isRestricted = s.policy_status === "restricted"

                return (
                    <motion.button
                        key={s.ticker}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        onClick={() => onSelect(s.ticker)}
                        className={cn(
                            "border p-3 text-left transition-all relative overflow-hidden group",
                            isRestricted && isSelected
                                ? "border-red-500/40 bg-red-500/[0.05] shadow-[0_0_20px_rgba(239,68,68,0.08)]"
                                : isSelected
                                ? "border-flame/40 bg-flame/[0.05] shadow-[0_0_20px_rgba(254,127,45,0.08)]"
                                : isRestricted
                                ? "border-red-500/[0.15] bg-red-500/[0.02] hover:border-red-500/30"
                                : "border-white/[0.06] bg-white/[0.01] hover:border-white/15"
                        )}
                    >
                        {isSelected && !isRestricted && (
                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-t-flame/40 border-l-[16px] border-l-transparent" />
                        )}
                        {isRestricted && (
                            <div className="absolute top-0 right-0 px-1 py-0.5 bg-red-500/20 text-red-400 text-[6px] font-black uppercase tracking-wider">
                                BLOCKED
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-1.5">
                            <span className={cn("text-xs font-black uppercase",
                                isRestricted ? "text-red-400" :
                                isSelected ? "text-flame" : "text-white/60"
                            )}>
                                {s.ticker}
                            </span>
                            <span className={cn("flex items-center gap-0.5 text-[8px] font-black px-1 py-0.5",
                                isUp ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                            )}>
                                {isUp ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                                {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                            </span>
                        </div>
                        <div className="text-base font-black text-white/80">${s.price?.toFixed(2)}</div>
                        <div className="flex items-center justify-between mt-1.5 text-[7px] text-white/20">
                            <span>Vol: {(s.volume / 1e6)?.toFixed(1)}M</span>
                            <span className={cn("px-1 py-0.5 font-black text-[6px] uppercase",
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
