import * as React from "react"
import {
    TrendingUp, TrendingDown, AlertTriangle,
    Shield, CheckCircle2, XCircle, Loader2,
    Eye, RefreshCw, Lock, BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"
import { API, fetchWithRetry } from "@/lib/api"

/* ════════════════════════════════════════════════════════════
   PORTFOLIO MONITOR PANEL
   ════════════════════════════════════════════════════════════ */
export function PortfolioMonitorPanel() {
    const [data, setData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)

    const refresh = () => {
        setLoading(true)
        fetchWithRetry(API.portfolioMonitor)
            .then(r => r.json()).then(d => setData(d))
            .catch(() => {}).finally(() => setLoading(false))
    }

    React.useEffect(() => { refresh() }, [])

    return (
        <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" /> Portfolio Monitor
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> READ-ONLY
                    </span>
                    <button onClick={refresh} className="text-gray-300 hover:text-gray-500 transition-all">
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {data?.status === "success" ? (
                <>
                    {/* Account summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-gray-50">
                            <div className="text-[10px] text-gray-400 mb-1">Equity</div>
                            <div className="text-sm font-bold text-gray-800">${data.account.equity?.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50">
                            <div className="text-[10px] text-gray-400 mb-1">Cash</div>
                            <div className="text-sm font-bold text-gray-800">${data.account.cash?.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50">
                            <div className="text-[10px] text-gray-400 mb-1">Buying Power</div>
                            <div className="text-sm font-bold text-gray-800">${data.account.buying_power?.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    {/* Holdings */}
                    {data.holdings?.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="text-[10px] text-gray-400 font-semibold uppercase">Holdings</div>
                            {data.holdings.map((h: any) => (
                                <div key={h.ticker} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm">{h.ticker?.slice(0, 2)}</div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-700">{h.ticker}</div>
                                            <div className="text-[9px] text-gray-400">{h.qty} shares · {h.weight}%</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-mono font-bold text-gray-700">${h.current_price?.toFixed(2)}</div>
                                        <div className={cn("text-[10px] font-semibold flex items-center gap-0.5 justify-end",
                                            h.pnl_pct >= 0 ? "text-emerald-500" : "text-red-500"
                                        )}>
                                            {h.pnl_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {h.pnl_pct?.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Drift Metrics */}
                    <div className="space-y-1.5">
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">Drift Metrics</div>
                        {data.drift_metrics?.map((d: any) => (
                            <div key={d.ticker} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                                <span className="text-xs font-semibold text-gray-700 w-12">{d.ticker}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between text-[9px] mb-1">
                                        <span className="text-gray-400">Target: {d.target_weight}%</span>
                                        <span className="text-gray-400">Actual: {d.actual_weight}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all", d.status === "OK" ? "bg-emerald-400" : "bg-amber-400")}
                                            style={{ width: `${Math.min(100, (d.actual_weight / Math.max(1, d.target_weight)) * 100)}%` }} />
                                    </div>
                                </div>
                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded",
                                    d.status === "OK" ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                                )}>{d.status}</span>
                            </div>
                        ))}
                    </div>

                    {/* Alerts */}
                    {data.alerts?.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="text-[10px] text-gray-400 font-semibold uppercase flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Alerts ({data.alert_count})
                            </div>
                            {data.alerts.map((a: any, i: number) => (
                                <div key={i} className={cn("p-2.5 rounded-lg text-[10px] border",
                                    a.severity === "HIGH" ? "bg-red-50 border-red-100 text-red-700" :
                                    a.severity === "MEDIUM" ? "bg-amber-50 border-amber-100 text-amber-700" :
                                    "bg-blue-50 border-blue-100 text-blue-700"
                                )}>
                                    <span className="font-bold">{a.type}</span>: {a.message}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Enforcement badge */}
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-[10px]">
                        <Lock className="w-3 h-3 text-blue-500" />
                        <span className="text-blue-600 font-medium">
                            Mode: {data.enforcement?.mode} · Can Trade: {String(data.enforcement?.can_trade)} · External: {String(data.enforcement?.can_transmit_external)}
                        </span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-200">
                    <Eye className="w-8 h-8 mb-2" />
                    <span className="text-xs text-gray-300">{data?.reason || "Loading portfolio data..."}</span>
                </div>
            )}
        </div>
    )
}


/* ════════════════════════════════════════════════════════════
   EARNINGS RESEARCH PANEL
   ════════════════════════════════════════════════════════════ */
export function EarningsResearchPanel({ ticker = "NVDA" }: { ticker?: string }) {
    const [data, setData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)
    const [activeTicker, setActiveTicker] = React.useState(ticker)

    const research = (t: string) => {
        setLoading(true); setActiveTicker(t)
        fetchWithRetry(API.earningsResearch(t))
            .then(r => r.json()).then(d => setData(d))
            .catch(() => {}).finally(() => setLoading(false))
    }

    React.useEffect(() => { research(activeTicker) }, [])

    const e = data?.report?.earnings_data

    return (
        <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" /> Earnings Research
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> NO TRADE
                    </span>
                </div>
            </div>

            {/* Ticker selector */}
            <div className="flex gap-1.5">
                {["NVDA", "AAPL", "MSFT"].map(t => (
                    <button key={t} onClick={() => research(t)}
                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border",
                            activeTicker === t ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "text-gray-400 border-gray-100 hover:text-gray-600"
                        )}>{t}</button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
            ) : e ? (
                <>
                    {/* Blackout status */}
                    <div className={cn("p-3 rounded-xl border text-[10px] flex items-center gap-2",
                        data.blackout?.active ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                    )}>
                        {data.blackout?.active ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        <div>
                            <div className={cn("font-bold", data.blackout?.active ? "text-red-600" : "text-emerald-600")}>
                                {data.blackout?.active ? "⛔ BLACKOUT ACTIVE" : "✓ No Active Blackout"}
                            </div>
                            <div className="text-gray-500">{data.blackout?.message}</div>
                        </div>
                    </div>

                    {/* Earnings data */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-gray-50">
                            <div className="text-[9px] text-gray-400">Quarter</div>
                            <div className="text-xs font-bold text-gray-700">{e.quarter}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50">
                            <div className="text-[9px] text-gray-400">Revenue</div>
                            <div className="text-xs font-bold text-gray-700">${(e.revenue / 1e9).toFixed(1)}B ({e.revenue_yoy > 0 ? "+" : ""}{e.revenue_yoy}%)</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50">
                            <div className="text-[9px] text-gray-400">EPS</div>
                            <div className="text-xs font-bold text-gray-700">${e.eps} <span className="text-emerald-500 text-[9px]">beat {e.eps_surprise_pct}%</span></div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50">
                            <div className="text-[9px] text-gray-400">Gross Margin</div>
                            <div className="text-xs font-bold text-gray-700">{e.gross_margin}%</div>
                        </div>
                    </div>

                    {/* Guidance */}
                    <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
                        <div className="text-[9px] text-indigo-500 font-semibold mb-1">Guidance</div>
                        <div className="text-[10px] text-gray-600">{e.guidance}</div>
                    </div>

                    {/* Risks */}
                    {e.risks?.length > 0 && (
                        <div className="space-y-1">
                            <div className="text-[9px] text-gray-400 font-semibold uppercase">Risk Factors</div>
                            {e.risks.map((r: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" /> {r}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Anomalies */}
                    {e.anomalies?.length > 0 && (
                        <div className="space-y-1">
                            <div className="text-[9px] text-red-400 font-semibold uppercase">⚠ Anomalies Flagged</div>
                            {e.anomalies.map((a: string, i: number) => (
                                <div key={i} className="p-2 rounded-lg bg-red-50 border border-red-100 text-[10px] text-red-600">{a}</div>
                            ))}
                        </div>
                    )}

                    {/* Enforcement */}
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-[10px]">
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span className="text-amber-600 font-medium">
                            Data: {data.enforcement?.data_access} · Trade: {String(data.enforcement?.can_trade)} · Publish: {String(data.enforcement?.can_publish_external)}
                        </span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-200">
                    <BookOpen className="w-8 h-8 mb-2" />
                    <span className="text-xs text-gray-300">Select a ticker to research</span>
                </div>
            )}
        </div>
    )
}


/* ════════════════════════════════════════════════════════════
   COMPLIANCE PANEL
   ════════════════════════════════════════════════════════════ */
export function CompliancePanel() {
    const [data, setData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)

    const refresh = () => {
        setLoading(true)
        fetchWithRetry(API.compliance)
            .then(r => r.json()).then(d => setData(d))
            .catch(() => {}).finally(() => setLoading(false))
    }

    React.useEffect(() => { refresh() }, [])

    return (
        <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-500" /> Compliance Monitor
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> AUDIT-ONLY
                    </span>
                    <button onClick={refresh} className="text-gray-300 hover:text-gray-500 transition-all">
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {data ? (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-4 gap-2">
                        <div className="p-2.5 rounded-lg bg-gray-50 text-center">
                            <div className="text-lg font-bold text-gray-700">{data.summary?.total_trades || 0}</div>
                            <div className="text-[9px] text-gray-400">Total</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-50 text-center">
                            <div className="text-lg font-bold text-emerald-600">{data.summary?.executed || 0}</div>
                            <div className="text-[9px] text-gray-400">Executed</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-red-50 text-center">
                            <div className="text-lg font-bold text-red-600">{data.summary?.blocked || 0}</div>
                            <div className="text-[9px] text-gray-400">Blocked</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-50 text-center">
                            <div className="text-lg font-bold text-amber-600">{data.summary?.block_rate || "0%"}</div>
                            <div className="text-[9px] text-gray-400">Block Rate</div>
                        </div>
                    </div>

                    {/* Policy rules */}
                    <div className="space-y-1.5">
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">Active Policy Rules</div>
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="text-gray-600">Universe: <b>{data.policy?.ticker_universe?.join(", ")}</b></span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="text-gray-600">Max order: <b>{data.policy?.max_order_size} shares</b></span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="text-gray-600">Daily cap: <b>${data.policy?.max_daily_exposure?.toLocaleString()}</b></span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="text-gray-600">Blackout: <b>{data.policy?.earnings_blackout_days}d</b></span>
                            </div>
                        </div>
                    </div>

                    {/* Restricted list */}
                    {data.policy?.restricted_list?.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="text-[10px] text-gray-400 font-semibold uppercase">Restricted List</div>
                            <div className="flex gap-1.5">
                                {data.policy.restricted_list.map((t: string) => (
                                    <span key={t} className="px-2 py-1 rounded-lg bg-red-50 border border-red-100 text-[10px] font-bold text-red-600">
                                        ⛔ {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Forbidden tools */}
                    {data.policy?.forbidden_tools?.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="text-[10px] text-gray-400 font-semibold uppercase">Forbidden Tools</div>
                            <div className="flex flex-wrap gap-1">
                                {data.policy.forbidden_tools.map((t: string) => (
                                    <span key={t} className="px-2 py-0.5 rounded bg-gray-100 text-[9px] font-mono text-gray-500">{t}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trade log */}
                    {data.trade_log?.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="text-[10px] text-gray-400 font-semibold uppercase">Trade Audit Log</div>
                            {data.trade_log.map((t: any, i: number) => (
                                <div key={i} className={cn("flex items-center justify-between p-2.5 rounded-lg text-[10px] border",
                                    t.status === "EXECUTED" ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                                )}>
                                    <div className="flex items-center gap-2">
                                        {t.status === "EXECUTED" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                                        <span className="font-bold text-gray-700">{t.action} {t.ticker} ×{t.quantity}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-gray-500">${t.value?.toFixed(2)}</div>
                                        <div className="text-[8px] text-gray-400 mt-0.5 max-w-[120px] truncate">{t.intent}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Wash sale window */}
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-[10px]">
                        <Lock className="w-3 h-3 text-rose-500" />
                        <span className="text-rose-600 font-medium">
                            Wash Sale Window: {data.policy?.wash_sale_window_days}d · Mode: READ-ONLY · Cannot modify records
                        </span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-200">
                    <Shield className="w-8 h-8 mb-2" />
                    <span className="text-xs text-gray-300">Loading compliance data...</span>
                </div>
            )}
        </div>
    )
}
