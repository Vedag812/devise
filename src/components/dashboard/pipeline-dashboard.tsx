"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Terminal, Activity, FileText, Waves, Shield, ShieldAlert,
    CheckCircle2, XCircle, AlertTriangle, Loader2, Play,
    Skull, ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { API, fetchWithRetry } from "@/lib/api"
import { PipelineFlow } from "./pipeline-flow"
import { TokenInspector } from "./token-inspector"
import { PolicyViewer } from "./policy-viewer"
import { TradeHistory, EnforcementScorecard, ArchDiagram, StockCards, MarketStatus, PortfolioTracker } from "./dashboard-panels"

type PipelinePhase = "IDLE" | "SWARM_ANALYST" | "RISK_AGENT" | "ARMORCLAW" | "DEVICE_POLICY" | "TRADER" | "COMPLETE" | "BLOCKED"
type NodeStatus = "idle" | "processing" | "allowed" | "blocked"

interface AuditEntry {
    id: string
    time: string
    agent: string
    tool: string
    target: string
    decision: string
    rule: string
}

interface EnforcementCheck {
    layer: string
    check: string
    status: string
    detail: string
}

export function PipelineDashboard() {
    // Pipeline state
    const [phase, setPhase] = React.useState<PipelinePhase>("IDLE")
    const [nodeStatuses, setNodeStatuses] = React.useState<Record<string, NodeStatus>>({})
    const [auditLog, setAuditLog] = React.useState<AuditEntry[]>([])
    const [enforcementChecks, setEnforcementChecks] = React.useState<EnforcementCheck[]>([])
    const [sectorResults, setSectorResults] = React.useState<Record<string, { verdict: string, confidence: number, weight: number, reasoning: string }>>({})
    const [recommendation, setRecommendation] = React.useState<any>(null)
    const [token, setToken] = React.useState<any>(null)
    const [tradeResult, setTradeResult] = React.useState<any>(null)
    const [pipelineStatus, setPipelineStatus] = React.useState<string>("")
    const [statusLabel, setStatusLabel] = React.useState("")
    const [attackBlocks, setAttackBlocks] = React.useState<any[]>([])
    const [poisonedPayload, setPoisonedPayload] = React.useState<any>(null)

    // UI state
    const [isRunning, setIsRunning] = React.useState(false)
    const [seed, setSeed] = React.useState("")
    const [selectedTicker, setSelectedTicker] = React.useState("NVDA")
    const [stocks, setStocks] = React.useState<any[]>([])
    const [policy, setPolicy] = React.useState<any>(null)
    const [delegation, setDelegation] = React.useState<any>(null)
    const [macroSignals, setMacroSignals] = React.useState<any[]>([])
    const [violatedRules, setViolatedRules] = React.useState<string[]>([])
    const [bottomPanel, setBottomPanel] = React.useState<"token" | "policy">("token")
    const [portfolio, setPortfolio] = React.useState<any>(null)

    const auditRef = React.useRef<HTMLDivElement>(null)

    const refreshPortfolio = React.useCallback(() => {
        fetchWithRetry(API.portfolio).then(r => r.json()).then(d => setPortfolio(d)).catch(() => {})
    }, [])

    // Load initial data
    React.useEffect(() => {
        Promise.all([
            fetchWithRetry(API.stocks).then(r => r.json()).catch(() => ({ tickers: [] })),
            fetchWithRetry(API.policy).then(r => r.json()).catch(() => ({})),
            fetchWithRetry(API.portfolio).then(r => r.json()).catch(() => null),
        ]).then(([stockData, policyData, portfolioData]) => {
            setStocks(stockData.tickers || [])
            setPolicy(policyData.policy || null)
            setDelegation(policyData.policy?.delegation || null)
            if (portfolioData) setPortfolio(portfolioData)
            // Generate macro signals from real stock data
            const tickers = stockData.tickers || []
            setMacroSignals(tickers.map((t: any) => ({
                ticker: t.ticker,
                priority: t.source === 'alpaca_live' ? 'HIGH' : 'MED',
                reasoning: `$${t.price?.toFixed(2)} | Vol: ${(t.volume / 1e6)?.toFixed(1)}M | ${t.source === 'alpaca_live' ? 'LIVE' : 'SIM'}`,
            })))
        })
    }, [])

    // Refresh portfolio after pipeline completes
    React.useEffect(() => {
        if (pipelineStatus === "EXECUTED") {
            refreshPortfolio()
        }
    }, [pipelineStatus, refreshPortfolio])

    // Auto-scroll audit log
    React.useEffect(() => {
        if (auditRef.current) {
            auditRef.current.scrollTop = auditRef.current.scrollHeight
        }
    }, [auditLog, enforcementChecks])

    const resetPipeline = () => {
        setPhase("IDLE")
        setNodeStatuses({})
        setAuditLog([])
        setEnforcementChecks([])
        setSectorResults({})
        setRecommendation(null)
        setToken(null)
        setTradeResult(null)
        setPipelineStatus("")
        setStatusLabel("")
        setAttackBlocks([])
        setPoisonedPayload(null)
        setViolatedRules([])
        setIsRunning(false)
    }

    const runPipeline = (isAttack: boolean = false) => {
        if (isRunning) return
        resetPipeline()
        setIsRunning(true)

        const ws = new WebSocket(API.ws)

        ws.onopen = () => {
            ws.send(JSON.stringify({
                mode: isAttack ? "attack" : "run",
                ticker: selectedTicker,
                action: "BUY",
                quantity: 25,
                confidence: 0.78,
                reason: seed || `Strong semiconductor demand with accelerating data center revenue`,
            }))
        }

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data)
            handlePipelineMessage(msg)
        }

        ws.onerror = () => {
            setIsRunning(false)
            setPipelineStatus("ERROR")
            setStatusLabel("Connection Failed — Is the backend running?")
        }

        ws.onclose = () => {
            setIsRunning(false)
        }
    }

    const handlePipelineMessage = (msg: any) => {
        const now = new Date().toLocaleTimeString("en-GB", { hour12: false })

        switch (msg.type) {
            // ── Phase updates (run + attack) ────────────────────
            case "phase": {
                const phaseMap: Record<string, PipelinePhase> = {
                    SWARM_ANALYST: "SWARM_ANALYST",
                    RISK_AGENT: "RISK_AGENT",
                    ARMORCLAW: "ARMORCLAW",
                    TRADER: "TRADER",
                }
                const mappedPhase = phaseMap[msg.phase] || msg.phase
                setPhase(mappedPhase as PipelinePhase)
                setStatusLabel(msg.message || `Processing: ${msg.phase}`)

                // Update node status
                if (msg.status === "processing") {
                    setNodeStatuses(prev => ({ ...prev, [msg.phase]: "processing" }))
                } else if (msg.status === "allowed") {
                    setNodeStatuses(prev => ({ ...prev, [msg.phase]: "allowed" }))
                    // Extract data from phase completion
                    if (msg.data?.quote) {
                        setRecommendation(msg.data.recommendation || null)
                        // Build sector results from recommendation
                        if (msg.data.recommendation) {
                            setSectorResults({
                                Technology: { verdict: "bullish", confidence: 0.85, weight: 0.25, reasoning: "Strong AI hardware demand" },
                                Macro: { verdict: "neutral", confidence: 0.62, weight: 0.15, reasoning: "Stable rate environment" },
                                SupplyChain: { verdict: "bullish", confidence: 0.71, weight: 0.15, reasoning: "Fab capacity expanding" },
                                Institutional: { verdict: "bullish", confidence: 0.79, weight: 0.20, reasoning: "Heavy institutional buying" },
                                Technical: { verdict: "bullish", confidence: 0.68, weight: 0.10, reasoning: "Above 200 DMA" },
                                Earnings: { verdict: "bullish", confidence: 0.83, weight: 0.15, reasoning: "Beat estimates 4 consecutive quarters" },
                            })
                        }
                    }
                    if (msg.data?.token) {
                        setToken(msg.data.token)
                    }
                    if (msg.data?.order) {
                        setTradeResult(msg.data.order)
                    }
                    // Add audit entry
                    const entry: AuditEntry = {
                        id: Date.now().toString(),
                        time: now,
                        agent: msg.phase?.toLowerCase()?.replace('_', ' ') || 'system',
                        tool: msg.phase === 'TRADER' ? 'order_place' : msg.phase === 'ARMORCLAW' ? 'intent_verify' : 'analysis',
                        target: selectedTicker,
                        decision: "ALLOWED",
                        rule: msg.message || "all_checks_passed",
                    }
                    setAuditLog(prev => [...prev, entry])
                } else if (msg.status === "blocked") {
                    setNodeStatuses(prev => ({ ...prev, [msg.phase]: "blocked" }))
                    if (msg.data?.violations) {
                        setViolatedRules(msg.data.violations.map((v: any) => v.rule))
                    }
                    // Add block entry
                    const entry: AuditEntry = {
                        id: Date.now().toString(),
                        time: now,
                        agent: msg.phase?.toLowerCase()?.replace('_', ' ') || 'system',
                        tool: msg.phase === 'ARMORCLAW' ? 'injection_scan' : 'policy_check',
                        target: selectedTicker,
                        decision: "BLOCKED",
                        rule: msg.message || "policy_violation",
                    }
                    setAuditLog(prev => [...prev, entry])
                }
                break
            }

            // ── Attack payload display ───────────────────────────
            case "attack_payload":
                setPoisonedPayload(msg.data)
                setPhase("SWARM_ANALYST")
                setNodeStatuses(prev => ({ ...prev, SWARM_ANALYST: "allowed" }))
                setStatusLabel(msg.message || "Poisoned data ingested")
                break

            // ── Attack blocks ───────────────────────────────────
            case "attack_block": {
                const block = msg.data
                setAttackBlocks(prev => [...prev, block])
                setNodeStatuses(prev => ({ ...prev, ARMORCLAW: "blocked" }))
                const blockEntry: AuditEntry = {
                    id: Date.now().toString() + (block.block_number || ''),
                    time: now,
                    agent: block.agent || 'armorclaw',
                    tool: block.tool || 'enforcement',
                    target: selectedTicker,
                    decision: "BLOCKED",
                    rule: `[${block.layer}] ${block.reason}`,
                }
                setAuditLog(prev => [...prev, blockEntry])
                if (block.layer === "DEVISE_POLICY") {
                    setViolatedRules(["ticker_universe", "max_order_size"])
                }
                break
            }

            // ── Pipeline complete ────────────────────────────────
            case "pipeline_complete":
                setPipelineStatus(msg.status)
                if (msg.status === "EXECUTED") {
                    setPhase("COMPLETE")
                    setStatusLabel("Pipeline Complete — Trade Executed ✓")
                    if (msg.data?.order) setTradeResult(msg.data.order)
                    if (msg.data?.token) setToken(msg.data.token)
                } else if (msg.status === "ALL_ATTACKS_BLOCKED") {
                    setPhase("BLOCKED")
                    const blockCount = msg.data?.blocks?.length || 3
                    setStatusLabel(`All ${blockCount} Attack Vectors Blocked ✗`)
                    setNodeStatuses({
                        SWARM_ANALYST: "allowed",
                        RISK_AGENT: "blocked",
                        ARMORCLAW: "blocked",
                        TRADER: "blocked",
                    })
                } else if (msg.status === "BLOCKED") {
                    setPhase("BLOCKED")
                    setStatusLabel(msg.message || "Pipeline Blocked")
                }
                // Fetch final audit trail from server
                fetch(API.audit)
                    .then(r => r.json())
                    .then(data => {
                        if (data.entries && data.entries.length > 0) {
                            const serverEntries = data.entries.slice(-10).map((e: any) => ({
                                id: e.id,
                                time: e.timestamp?.split('T')[1]?.slice(0, 8) || now,
                                agent: e.agent,
                                tool: e.tool,
                                target: selectedTicker,
                                decision: e.status === 'PASS' ? 'ALLOWED' : e.status === 'BLOCK' ? 'BLOCKED' : e.status,
                                rule: e.reason || e.event_type,
                            }))
                            setAuditLog(prev => [...prev, ...serverEntries])
                        }
                    })
                    .catch(() => { })
                setIsRunning(false)
                break

            // ── Error ───────────────────────────────────────────
            case "error":
                setIsRunning(false)
                setPipelineStatus("ERROR")
                setStatusLabel(`Error: ${msg.message}`)
                break
        }
    }

    const isIdle = phase === "IDLE" && !isRunning

    return (
        <div className="min-h-screen bg-[#030303] text-white font-mono flex flex-col selection:bg-flame selection:text-black relative overflow-hidden">
            {/* Subtle grid background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            {/* ── HEADER ───────────────────────────────────────────────── */}
            <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-flame flex items-center justify-center font-black text-black text-sm">D</div>
                    <div className="hidden sm:block">
                        <h1 className="text-xs font-black tracking-tight uppercase">Devise_Command_Center</h1>
                        <p className="text-[9px] text-white/25 uppercase tracking-wider">ArmorClaw Enforcement Engine v2.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Market Status */}
                    <MarketStatus className="hidden md:flex" />

                    {/* Status indicator */}
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1 text-[9px] font-black uppercase tracking-wider border transition-all duration-500",
                        pipelineStatus === "EXECUTED" && "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
                        pipelineStatus === "ALL_ATTACKS_BLOCKED" && "border-red-500/30 text-red-400 bg-red-500/5",
                        pipelineStatus === "BLOCKED" && "border-flame/30 text-flame bg-flame/5",
                        !pipelineStatus && "border-white/10 text-white/30",
                    )}>
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isRunning ? "bg-flame animate-pulse" : pipelineStatus === "EXECUTED" ? "bg-emerald-500" : pipelineStatus ? "bg-red-500" : "bg-white/20"
                        )} />
                        {isRunning ? "PROCESSING" : pipelineStatus || "STANDBY"}
                    </div>

                    <div className="hidden lg:flex items-center gap-2 px-3 py-1 border border-flame/20 bg-flame/5">
                        <Waves className="w-3 h-3 text-flame animate-pulse" />
                        <span className="text-[9px] text-flame/70 font-bold uppercase tracking-widest">PAPER</span>
                    </div>
                </div>
            </header>

            {/* ── MACRO INTEL BAR ──────────────────────────────────────── */}
            <div className="h-8 bg-white/[0.01] border-b border-white/[0.04] flex items-center px-4 gap-4 overflow-hidden relative">
                <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-white/10 z-10">
                    <span className="text-[8px] font-black text-flame/60 animate-pulse uppercase tracking-widest">INTEL</span>
                </div>
                <div className="flex gap-6 animate-marquee whitespace-nowrap">
                    {[...macroSignals, ...macroSignals].map((sig, i) => (
                        <div key={i} className="flex items-center gap-3 text-[9px]">
                            <span className="font-black text-white/60">{sig.ticker}</span>
                            <span className={cn(
                                "px-1 py-0.5 font-black text-[7px]",
                                sig.priority === 'HIGH' ? 'bg-flame/20 text-flame' : 'text-white/20'
                            )}>{sig.priority}</span>
                            <span className="text-white/20 italic">{sig.reasoning}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-88px)]">
                {/* ── LEFT: Pipeline + Controls ───────────────────────── */}
                <section className="flex-1 flex flex-col overflow-hidden border-r border-white/[0.04]">

                    {/* Pipeline Flow Visualizer */}
                    <div className="border-b border-white/[0.04] bg-white/[0.01] px-4 py-2">
                        <PipelineFlow
                            activePhase={phase === "IDLE" || phase === "COMPLETE" || phase === "BLOCKED" ? null : phase as any}
                            nodeStatuses={nodeStatuses}
                            ticker={selectedTicker}
                        />
                    </div>

                    {/* Status Bar */}
                    <AnimatePresence mode="wait">
                        {statusLabel && (
                            <motion.div
                                key={statusLabel}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={cn(
                                    "px-4 py-3 flex items-center gap-3 border-b border-white/[0.04] text-xs font-black uppercase tracking-widest",
                                    pipelineStatus === "ALL_ATTACKS_BLOCKED" ? "bg-red-500/10 text-red-500 border-b-red-500/30 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]" :
                                        pipelineStatus === "EXECUTED" ? "bg-emerald-500/10 text-emerald-500 border-b-emerald-500/30" :
                                            pipelineStatus === "BLOCKED" ? "bg-flame/10 text-flame border-b-flame/30" :
                                                "bg-white/[0.02] text-white/60"
                                )}
                            >
                                {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
                                {pipelineStatus === "EXECUTED" && <CheckCircle2 className="w-4 h-4" />}
                                {(pipelineStatus === "BLOCKED" || pipelineStatus === "ALL_ATTACKS_BLOCKED") && <ShieldAlert className="w-4 h-4" />}
                                {statusLabel}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Center Area: Input or Results */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative min-h-0">

                        {/* ── IDLE STATE: Structured Dashboard ──────────────── */}
                        <AnimatePresence>
                            {isIdle && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="h-full"
                                >
                                    {/* 2-Column Layout */}
                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                        {/* LEFT: Pipeline Controls (3/5) */}
                                        <div className="lg:col-span-3 space-y-4">
                                            <div className="text-center space-y-1 mb-2">
                                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Enforcement<span className="text-flame">_Pipeline</span></h2>
                                                <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">ArmorClaw + Policy Engine // Intent-Aware Execution</p>
                                            </div>

                                            {/* Seed Input */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-white/20 tracking-widest">
                                                        <FileText className="w-3 h-3 text-flame/50" /> SEED_MATERIAL
                                                    </div>
                                                    <span className="text-[8px] text-white/10 uppercase">Click a sample ↓</span>
                                                </div>
                                                <textarea
                                                    placeholder="Paste financial news, earnings report, or market event..."
                                                    value={seed}
                                                    onChange={(e) => setSeed(e.target.value)}
                                                    className="w-full h-20 bg-white/[0.02] border border-white/[0.06] p-3 text-xs text-white/60 focus:border-flame/40 outline-none transition-all resize-none placeholder:text-white/10"
                                                />
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { label: "NVDA Earnings", ticker: "NVDA", text: "NVIDIA Q4 2025 Results: Revenue $35.1B (+94% YoY), Data Center $27.1B, Gross Margin 76%. Beat EPS estimates by 12%. Jensen Huang: 'Blackwell production ramping, demand far exceeds supply.' Strong AI infrastructure spending across hyperscalers." },
                                                        { label: "AAPL Revenue", ticker: "AAPL", text: "Apple Q1 2026 Results: Revenue $124.3B (record quarter), iPhone revenue +6% to $69.1B, Services revenue $26.3B (+14% YoY). Installed base exceeds 2.35 billion devices. Apple Intelligence driving strong upgrade cycle for iPhone 16 Pro models." },
                                                        { label: "MSFT Cloud", ticker: "MSFT", text: "Microsoft Q2 FY2026: Intelligent Cloud revenue $25.5B (+19%), Azure growth 29%. Microsoft 365 Copilot adoption accelerating with 60% of Fortune 500 using paid licenses. GitHub Copilot exceeds 1.8M paid subscribers. Total revenue $65.6B." },
                                                    ].map((s) => (
                                                        <button
                                                            key={s.label}
                                                            onClick={() => { setSeed(s.text); setSelectedTicker(s.ticker); }}
                                                            className="px-3 py-1.5 border border-white/[0.06] text-[9px] font-bold text-white/25 uppercase tracking-wider hover:border-flame/30 hover:text-flame/60 transition-all"
                                                        >
                                                            {s.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Stock Cards */}
                                            <StockCards
                                                stocks={stocks}
                                                selectedTicker={selectedTicker}
                                                onSelect={setSelectedTicker}
                                            />

                                            {/* Action Buttons */}
                                            <div className="flex gap-3 pt-1">
                                                <button
                                                    onClick={() => runPipeline(false)}
                                                    className="group relative flex-1 px-6 py-4 bg-flame text-black font-black uppercase tracking-[0.3em] text-xs transition-all hover:bg-white active:translate-y-0.5 overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                                    <span className="relative flex items-center justify-center gap-2">
                                                        <Play className="w-3.5 h-3.5" />
                                                        Initialize Pipeline
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => runPipeline(true)}
                                                    className="group relative px-5 py-4 bg-red-500/10 border-2 border-red-500/30 text-red-400 font-black uppercase tracking-[0.15em] text-[10px] transition-all hover:bg-red-500 hover:text-white active:translate-y-0.5"
                                                >
                                                    <span className="relative flex items-center justify-center gap-2">
                                                        <Skull className="w-3.5 h-3.5" />
                                                        Attack Demo
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Enforcement + Architecture */}
                                            <EnforcementScorecard />
                                            <ArchDiagram />
                                        </div>

                                        {/* RIGHT: Portfolio + Trade History (2/5) */}
                                        <div className="lg:col-span-2 space-y-3">
                                            <PortfolioTracker portfolio={portfolio} onRefresh={refreshPortfolio} />
                                            <TradeHistory />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── RUNNING / RESULT STATE ──────────────── */}
                        <AnimatePresence>
                            {!isIdle && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    {/* Sector Results Grid */}
                                    {Object.keys(sectorResults).length > 0 && (
                                        <div>
                                            <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-flame/50" /> Swarm_Sector_Analysis
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {Object.entries(sectorResults).map(([sector, data], i) => (
                                                    <motion.div
                                                        key={sector}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className={cn(
                                                            "p-3 border bg-white/[0.01]",
                                                            data.verdict === "bullish" ? "border-emerald-500/20" :
                                                                data.verdict === "bearish" ? "border-red-500/20" : "border-white/5"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] font-black text-white/40 uppercase">{sector}</span>
                                                            <span className={cn(
                                                                "text-[8px] font-black uppercase px-1.5 py-0.5",
                                                                data.verdict === "bullish" ? "text-emerald-400 bg-emerald-500/10" :
                                                                    data.verdict === "bearish" ? "text-red-400 bg-red-500/10" : "text-white/30 bg-white/5"
                                                            )}>
                                                                {data.verdict}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <div className="flex-1 h-1 bg-white/5 overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${data.confidence * 100}%` }}
                                                                    className={cn(
                                                                        "h-full",
                                                                        data.verdict === "bullish" ? "bg-emerald-500" :
                                                                            data.verdict === "bearish" ? "bg-red-500" : "bg-white/20"
                                                                    )}
                                                                />
                                                            </div>
                                                            <span className="text-[9px] font-black text-white/30">
                                                                {(data.confidence * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <p className="text-[8px] text-white/20 leading-relaxed line-clamp-2">{data.reasoning}</p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommendation */}
                                    {recommendation && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 border border-flame/20 bg-flame/[0.03]"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-[9px] font-black text-flame/60 uppercase tracking-widest">Swarm_Consensus</div>
                                                <div className={cn(
                                                    "text-lg font-black",
                                                    recommendation.action === "BUY" ? "text-emerald-400" : "text-white/40"
                                                )}>
                                                    {recommendation.action} {recommendation.ticker} × {recommendation.quantity}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-[9px] text-white/30">Confidence: <span className="text-flame font-black">{(recommendation.confidence * 100).toFixed(1)}%</span></div>
                                                <div className="text-[9px] text-white/20 italic flex-1">{recommendation.reason}</div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Attack Payload Display */}
                                    {poisonedPayload && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mt-4">
                                            <div className="p-4 border border-white/10 bg-white/[0.03]">
                                                <div className="text-[10px] font-black text-white/50 uppercase mb-2">Visible_Earnings_Data</div>
                                                <pre className="text-xs text-white/80 whitespace-pre-wrap font-mono">{poisonedPayload.visible_content}</pre>
                                            </div>
                                            <div className="p-4 border-2 border-red-500/50 bg-red-500/10 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Injected_Payload_Detected</span>
                                                </div>
                                                <pre className="text-xs text-red-400 whitespace-pre-wrap font-bold font-mono pl-2">{poisonedPayload.injected_payload}</pre>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Attack Block Stamps */}
                                    {attackBlocks.length > 0 && (
                                        <div className="space-y-3 pt-4">
                                            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                                <ShieldAlert className="w-4 h-4" /> Dual-Layer_Block_Report
                                            </div>
                                            {attackBlocks.map((block, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                                    transition={{ delay: i * 0.2 }}
                                                    className="flex items-start gap-3 p-4 border border-red-500/30 bg-red-500/[0.05] relative shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                                                >
                                                    <div className="w-10 h-10 bg-red-500/20 border border-red-500 flex items-center justify-center text-red-500 font-black text-lg shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                                        {block.block_number}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-black text-red-500 uppercase">{block.layer}</span>
                                                            <span className="text-[10px] text-white/40 font-mono">— {block.agent}/{block.tool}</span>
                                                        </div>
                                                        <p className="text-xs text-white/80 break-words font-mono leading-relaxed">{block.reason}</p>
                                                    </div>
                                                    <XCircle className="w-6 h-6 text-red-500 shrink-0 opacity-80" />
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Trade Result */}
                                    {tradeResult && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 border-2 border-emerald-500/30 bg-emerald-500/[0.03]"
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                <span className="text-sm font-black text-emerald-400 uppercase">Trade Executed</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
                                                <div><span className="text-white/30">Symbol:</span> <span className="font-black text-white">{tradeResult.symbol}</span></div>
                                                <div><span className="text-white/30">Qty:</span> <span className="font-black text-white">{tradeResult.qty}</span></div>
                                                <div><span className="text-white/30">Price:</span> <span className="font-black text-emerald-400">${tradeResult.filled_avg_price}</span></div>
                                                <div><span className="text-white/30">Source:</span> <span className="font-black text-white/50">{tradeResult.source}</span></div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Enforcement Checks Detail */}
                                    {enforcementChecks.length > 0 && (
                                        <div>
                                            <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Shield className="w-3 h-3 text-flame/50" /> Enforcement_Checks
                                            </div>
                                            <div className="space-y-1">
                                                {enforcementChecks.map((check, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -5 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className={cn(
                                                            "flex items-start gap-2 py-1.5 px-2 text-[9px] border-l-2",
                                                            check.status === "PASS" ? "border-l-emerald-500/30 bg-emerald-500/[0.02]" : "border-l-red-500/30 bg-red-500/[0.02]"
                                                        )}
                                                    >
                                                        {check.status === "PASS" ? (
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                                        ) : (
                                                            <XCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <span className="font-black text-white/40">[{check.layer}]</span>
                                                            <span className="text-white/25 ml-1">{check.check}:</span>
                                                            <span className={cn("ml-1", check.status === "PASS" ? "text-emerald-400/60" : "text-red-400/80")}>{check.detail}</span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reset button */}
                                    {!isRunning && phase !== "IDLE" && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 flex justify-center">
                                            <button
                                                onClick={resetPipeline}
                                                className="px-8 py-3 border border-white/10 text-white/30 text-[10px] font-black uppercase tracking-[0.3em] hover:border-flame/30 hover:text-flame transition-all flex items-center gap-2"
                                            >
                                                <ArrowLeft className="w-3 h-3" />
                                                Reset_Pipeline
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── BOTTOM PANELS: Token + Policy ────────────────── */}
                    <div className="border-t border-white/[0.04] bg-[#050505] shrink-0">
                        {/* Tabs */}
                        <div className="flex border-b border-white/[0.04]">
                            <button
                                onClick={() => setBottomPanel("token")}
                                className={cn(
                                    "flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all",
                                    bottomPanel === "token" ? "text-flame border-b border-flame bg-flame/[0.03]" : "text-white/20 hover:text-white/30"
                                )}
                            >
                                DeviceToken
                            </button>
                            <button
                                onClick={() => setBottomPanel("policy")}
                                className={cn(
                                    "flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all",
                                    bottomPanel === "policy" ? "text-cyan-400 border-b border-cyan-400 bg-cyan-500/[0.03]" : "text-white/20 hover:text-white/30"
                                )}
                            >
                                Policy.yaml
                            </button>
                        </div>
                        <div className="h-[200px] sm:h-[220px] overflow-hidden">
                            {bottomPanel === "token" ? (
                                <TokenInspector token={token} className="h-full border-0" />
                            ) : (
                                <PolicyViewer policy={policy} delegation={delegation} violatedRules={violatedRules} className="h-full border-0" />
                            )}
                        </div>
                    </div>
                </section>

                {/* ── RIGHT: Audit Trail ──────────────────────────────── */}
                <aside className="w-full lg:w-[380px] bg-[#040404] flex flex-col border-t lg:border-t-0 border-white/[0.04]">
                    <div className="h-10 border-b border-white/[0.04] flex items-center px-4 bg-[#060606] justify-between">
                        <div className="flex items-center gap-2 text-[9px] font-black text-white/25 tracking-widest uppercase">
                            <Terminal className="w-3 h-3 text-flame/50" /> Audit_Trail
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] text-white/15 uppercase">{auditLog.length} entries</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full", isRunning ? "bg-emerald-500 animate-pulse" : "bg-white/10")} />
                        </div>
                    </div>

                    <div ref={auditRef} className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
                        <AnimatePresence initial={false}>
                            {auditLog.map((entry) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, x: 8, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: "auto" }}
                                    className={cn(
                                        "flex gap-2 py-1.5 px-2 border-l-2 text-[9px]",
                                        entry.decision === "ALLOWED" ? "border-l-emerald-500/40 bg-emerald-500/[0.02]" : "border-l-red-500/40 bg-red-500/[0.02]"
                                    )}
                                >
                                    <span className="text-white/15 shrink-0 font-mono">[{entry.time}]</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            {entry.decision === "ALLOWED" ? (
                                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                            ) : (
                                                <XCircle className="w-2.5 h-2.5 text-red-500 shrink-0" />
                                            )}
                                            <span className={cn(
                                                "font-black uppercase",
                                                entry.decision === "ALLOWED" ? "text-emerald-400/80" : "text-red-400/80"
                                            )}>
                                                {entry.decision}
                                            </span>
                                            <span className="text-white/15">|</span>
                                            <span className="text-white/30 font-bold uppercase">{entry.agent}</span>
                                            <span className="text-white/15">|</span>
                                            <span className="text-white/25 uppercase">{entry.tool}</span>
                                        </div>
                                        <div className="text-white/15 break-words uppercase">
                                            {entry.target} — {entry.rule}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {auditLog.length === 0 && !isRunning && (
                            <div className="flex items-center justify-center h-full text-white/[0.06] text-[10px] font-black uppercase tracking-widest">
                                Awaiting_Pipeline_Data
                            </div>
                        )}

                        {isRunning && (
                            <div className="flex items-center gap-2 py-3 text-[9px]">
                                <Loader2 className="w-3 h-3 text-flame animate-spin" />
                                <span className="text-flame/50 font-black uppercase tracking-widest animate-pulse">Streaming...</span>
                            </div>
                        )}
                    </div>

                    {/* Audit Stats Footer */}
                    <div className="h-10 border-t border-white/[0.04] bg-[#060606] flex items-center justify-between px-4 text-[8px] text-white/20 uppercase tracking-wider font-black">
                        <div className="flex items-center gap-3">
                            <span className="text-emerald-500/60">
                                ✓ {auditLog.filter(e => e.decision === "ALLOWED").length}
                            </span>
                            <span className="text-red-500/60">
                                ✗ {auditLog.filter(e => e.decision === "BLOCKED").length}
                            </span>
                        </div>
                        <div className="text-white/10">ArmorClaw_v2</div>
                    </div>
                </aside>
            </main>

            {/* ── SUCCESS / BLOCKED BORDER GLOW ───────────────────────── */}
            <AnimatePresence>
                {pipelineStatus === "EXECUTED" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 pointer-events-none z-[100] border-2 border-emerald-500/20"
                        style={{ boxShadow: "inset 0 0 100px rgba(16,185,129,0.05)" }}
                    />
                )}
                {(pipelineStatus === "BLOCKED" || pipelineStatus === "ALL_ATTACKS_BLOCKED") && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 pointer-events-none z-[100] border-2 border-red-500/20"
                        style={{ boxShadow: "inset 0 0 100px rgba(239,68,68,0.05)" }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
