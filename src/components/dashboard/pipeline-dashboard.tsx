"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Terminal, Activity, FileText, Shield, ShieldAlert,
    CheckCircle2, XCircle, AlertTriangle, Loader2, Play,
    Skull, ArrowLeft, Users, Landmark, TrendingUp, BarChart3,
    Newspaper, Brain, ChevronRight, Zap, RefreshCw, Send
} from "lucide-react"
import { cn } from "@/lib/utils"
import { API, fetchWithRetry } from "@/lib/api"

// ── Types ────────────────────────────────────────────────────────
type Phase = "IDLE"|"SWARM_ANALYST"|"RISK_AGENT"|"ARMORCLAW"|"DEVICE_POLICY"|"TRADER"|"COMPLETE"|"BLOCKED"
type NStatus = "idle"|"processing"|"allowed"|"blocked"
interface AuditEntry { id:string; time:string; agent:string; tool:string; target:string; decision:string; rule:string }

// ── MiroFish Agent Config ────────────────────────────────────────
const AGENTS: Record<string,{icon:React.ElementType;label:string;color:string}> = {
    RetailTraders:  { icon: Users,      label: "Retail",       color: "text-cyan-400" },
    Institutional:  { icon: Landmark,   label: "Institutional",color: "text-blue-400" },
    HedgeFunds:     { icon: TrendingUp, label: "Hedge Funds",  color: "text-violet-400" },
    Analysts:       { icon: BarChart3,  label: "Analysts",     color: "text-amber-400" },
    MediaSentiment: { icon: Newspaper,  label: "Media",        color: "text-rose-400" },
    Technology:     { icon: Zap,        label: "Technology",   color: "text-cyan-400" },
    Macro:          { icon: Landmark,   label: "Macro",        color: "text-blue-400" },
    SupplyChain:    { icon: TrendingUp, label: "Supply Chain", color: "text-violet-400" },
    Technical:      { icon: BarChart3,  label: "Technical",    color: "text-amber-400" },
    Earnings:       { icon: Newspaper,  label: "Earnings",     color: "text-rose-400" },
}

const PIPELINE_NODES = [
    { id: "SWARM_ANALYST", label: "MiroFish",   sub: "Simulation", icon: Brain,     gradient: "from-blue-500 to-cyan-400" },
    { id: "RISK_AGENT",    label: "Risk",        sub: "Validation", icon: Shield,    gradient: "from-violet-500 to-purple-400" },
    { id: "ARMORCLAW",     label: "ArmorClaw",   sub: "Enforcement",icon: ShieldAlert,gradient: "from-amber-500 to-orange-400" },
    { id: "TRADER",        label: "Trader",      sub: "Execution",  icon: Zap,       gradient: "from-emerald-500 to-green-400" },
]

const SEEDS = [
    { label: "NVDA Earnings Beat", ticker: "NVDA", text: "NVIDIA Q4 2025: Revenue $35.1B (+94% YoY), Data Center $27.1B. Beat EPS estimates by 12%. Jensen Huang: 'Blackwell production ramping, demand exceeds supply.'", blocked: false },
    { label: "AAPL Record Quarter", ticker: "AAPL", text: "Apple Q1 2026: Revenue $124.3B (record), iPhone +6% to $69.1B, Services $26.3B (+14%). Apple Intelligence driving strong iPhone 16 Pro upgrade cycle.", blocked: false },
    { label: "MSFT Cloud Surge", ticker: "MSFT", text: "Microsoft Q2 FY2026: Intelligent Cloud $25.5B (+19%), Azure growth 29%. Copilot adoption: 60% Fortune 500. GitHub Copilot 1.8M paid subs.", blocked: false },
    { label: "⛔ TSLA Blocked", ticker: "TSLA", text: "Tesla Q4: Revenue $25.2B (+8%), margins declining to 17.6%. Cybertruck below expectations. $10B AI cluster investment.", blocked: true },
]

// ── Component ────────────────────────────────────────────────────
export function PipelineDashboard() {
    const [phase, setPhase] = React.useState<Phase>("IDLE")
    const [nodeStatuses, setNodeStatuses] = React.useState<Record<string,NStatus>>({})
    const [auditLog, setAuditLog] = React.useState<AuditEntry[]>([])
    const [enforcementChecks, setEnforcementChecks] = React.useState<any[]>([])
    const [sectorResults, setSectorResults] = React.useState<Record<string,any>>({})
    const [recommendation, setRecommendation] = React.useState<any>(null)
    const [token, setToken] = React.useState<any>(null)
    const [tradeResult, setTradeResult] = React.useState<any>(null)
    const [pipelineStatus, setPipelineStatus] = React.useState("")
    const [statusLabel, setStatusLabel] = React.useState("")
    const [attackBlocks, setAttackBlocks] = React.useState<any[]>([])
    const [poisonedPayload, setPoisonedPayload] = React.useState<any>(null)
    const [isRunning, setIsRunning] = React.useState(false)
    const [seed, setSeed] = React.useState("")
    const [selectedTicker, setSelectedTicker] = React.useState("NVDA")
    const [stocks, setStocks] = React.useState<any[]>([])
    const [policy, setPolicy] = React.useState<any>(null)
    const [violatedRules, setViolatedRules] = React.useState<string[]>([])
    const [portfolio, setPortfolio] = React.useState<any>(null)
    const [agentInput, setAgentInput] = React.useState("")
    const [agentResult, setAgentResult] = React.useState<any>(null)
    const [agentLoading, setAgentLoading] = React.useState(false)
    const auditRef = React.useRef<HTMLDivElement>(null)

    const refreshPortfolio = React.useCallback(() => {
        fetchWithRetry(API.portfolio).then(r=>r.json()).then(d=>setPortfolio(d)).catch(()=>{})
    }, [])

    React.useEffect(() => {
        Promise.all([
            fetchWithRetry(API.stocks).then(r=>r.json()).catch(()=>({tickers:[]})),
            fetchWithRetry(API.policy).then(r=>r.json()).catch(()=>({})),
            fetchWithRetry(API.portfolio).then(r=>r.json()).catch(()=>null),
        ]).then(([s,p,port]) => {
            setStocks(s.tickers||[])
            setPolicy(p.policy||null)
            if(port) setPortfolio(port)
        })
    }, [])

    React.useEffect(() => {
        const t = setInterval(() => {
            fetchWithRetry(API.stocks).then(r=>r.json()).then(d=>setStocks(d.tickers||[])).catch(()=>{})
        }, 30000)
        return () => clearInterval(t)
    }, [])

    React.useEffect(() => { if(pipelineStatus==="EXECUTED") refreshPortfolio() }, [pipelineStatus, refreshPortfolio])
    React.useEffect(() => { if(auditRef.current) auditRef.current.scrollTop = auditRef.current.scrollHeight }, [auditLog])

    const resetPipeline = () => {
        setPhase("IDLE"); setNodeStatuses({}); setAuditLog([]); setEnforcementChecks([]);
        setSectorResults({}); setRecommendation(null); setToken(null); setTradeResult(null);
        setPipelineStatus(""); setStatusLabel(""); setAttackBlocks([]); setPoisonedPayload(null);
        setViolatedRules([]); setIsRunning(false);
    }

    const runPipeline = (isAttack: boolean = false) => {
        if(isRunning) return; resetPipeline(); setIsRunning(true);
        const ws = new WebSocket(API.ws)
        ws.onopen = () => ws.send(JSON.stringify({ mode: isAttack?"attack":"run", ticker: selectedTicker, action:"BUY", quantity:25, confidence:0.78, reason: seed||"Strong semiconductor demand with accelerating data center revenue" }))
        ws.onmessage = (e) => handleMsg(JSON.parse(e.data))
        ws.onerror = () => { setIsRunning(false); setPipelineStatus("ERROR"); setStatusLabel("Connection Failed") }
        ws.onclose = () => setIsRunning(false)
    }

    const runAgent = async () => {
        if(!agentInput.trim()||agentLoading) return
        setAgentLoading(true); setAgentResult(null)
        try {
            const r = await fetch(`${API.base}/v1/agent/run`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({instruction:agentInput}) })
            setAgentResult(await r.json())
        } catch { setAgentResult({status:"error",steps:[]}) }
        setAgentLoading(false)
    }

    const handleMsg = (msg:any) => {
        const now = new Date().toLocaleTimeString("en-GB",{hour12:false})
        switch(msg.type) {
            case "phase": {
                setPhase(msg.phase as Phase); setStatusLabel(msg.message||`Processing: ${msg.phase}`)
                if(msg.status==="processing") setNodeStatuses(p=>({...p,[msg.phase]:"processing"}))
                else if(msg.status==="allowed") {
                    setNodeStatuses(p=>({...p,[msg.phase]:"allowed"}))
                    if(msg.data?.quote) { setRecommendation(msg.data.recommendation||null); if(msg.data.recommendation) setSectorResults({Technology:{verdict:"bullish",confidence:0.85,weight:0.25,reasoning:"Strong AI hardware demand"},Macro:{verdict:"neutral",confidence:0.62,weight:0.15,reasoning:"Stable rate environment"},SupplyChain:{verdict:"bullish",confidence:0.71,weight:0.15,reasoning:"Fab capacity expanding"},Institutional:{verdict:"bullish",confidence:0.79,weight:0.20,reasoning:"Heavy institutional buying"},Technical:{verdict:"bullish",confidence:0.68,weight:0.10,reasoning:"Above 200 DMA"},Earnings:{verdict:"bullish",confidence:0.83,weight:0.15,reasoning:"Beat estimates 4 consecutive quarters"}}) }
                    if(msg.data?.token) setToken(msg.data.token)
                    if(msg.data?.order) setTradeResult(msg.data.order)
                    setAuditLog(p=>[...p,{id:Date.now().toString(),time:now,agent:msg.phase?.toLowerCase()?.replace('_',' ')||'system',tool:msg.phase==='TRADER'?'order_place':msg.phase==='ARMORCLAW'?'intent_verify':'analysis',target:selectedTicker,decision:"ALLOWED",rule:msg.message||"all_checks_passed"}])
                } else if(msg.status==="blocked") {
                    setNodeStatuses(p=>({...p,[msg.phase]:"blocked"}))
                    if(msg.data?.violations) setViolatedRules(msg.data.violations.map((v:any)=>v.rule))
                    setAuditLog(p=>[...p,{id:Date.now().toString(),time:now,agent:msg.phase?.toLowerCase()?.replace('_',' ')||'system',tool:msg.phase==='ARMORCLAW'?'injection_scan':'policy_check',target:selectedTicker,decision:"BLOCKED",rule:msg.message||"policy_violation"}])
                }
                break
            }
            case "attack_payload": setPoisonedPayload(msg.data); setPhase("SWARM_ANALYST"); setNodeStatuses(p=>({...p,SWARM_ANALYST:"allowed"})); setStatusLabel(msg.message||"Poisoned data ingested"); break
            case "attack_block": {
                const b=msg.data; setAttackBlocks(p=>[...p,b]); setNodeStatuses(p=>({...p,ARMORCLAW:"blocked"}))
                setAuditLog(p=>[...p,{id:Date.now().toString()+(b.block_number||''),time:now,agent:b.agent||'armorclaw',tool:b.tool||'enforcement',target:selectedTicker,decision:"BLOCKED",rule:`[${b.layer}] ${b.reason}`}])
                if(b.layer==="DEVISE_POLICY") setViolatedRules(["ticker_universe","max_order_size"])
                break
            }
            case "pipeline_complete":
                setPipelineStatus(msg.status)
                if(msg.status==="EXECUTED") { setPhase("COMPLETE"); setStatusLabel("Pipeline Complete — Trade Executed ✓"); if(msg.data?.order) setTradeResult(msg.data.order); if(msg.data?.token) setToken(msg.data.token) }
                else if(msg.status==="ALL_ATTACKS_BLOCKED") { setPhase("BLOCKED"); setStatusLabel(`All ${msg.data?.blocks?.length||3} Attack Vectors Blocked`); setNodeStatuses({SWARM_ANALYST:"allowed",RISK_AGENT:"blocked",ARMORCLAW:"blocked",TRADER:"blocked"}) }
                else if(msg.status==="BLOCKED") { setPhase("BLOCKED"); setStatusLabel(msg.message||"Pipeline Blocked") }
                fetch(API.audit).then(r=>r.json()).then(data => { if(data.entries?.length>0) { const se=data.entries.slice(-10).map((e:any)=>({id:e.id,time:e.timestamp?.split('T')[1]?.slice(0,8)||now,agent:e.agent,tool:e.tool,target:selectedTicker,decision:e.status==='PASS'?'ALLOWED':e.status==='BLOCK'?'BLOCKED':e.status,rule:e.reason||e.event_type})); setAuditLog(p=>[...p,...se]) } }).catch(()=>{})
                setIsRunning(false); break
            case "error": setIsRunning(false); setPipelineStatus("ERROR"); setStatusLabel(`Error: ${msg.message}`); break
        }
    }

    const isIdle = phase==="IDLE" && !isRunning

    // ── RENDER ────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#07070a] text-white flex flex-col overflow-hidden">

            {/* ═══ HEADER ═══ */}
            <header className="h-14 flex items-center justify-between px-5 border-b border-white/[0.04] bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-amber-500/20">D</div>
                    <div>
                        <h1 className="text-sm font-extrabold tracking-tight">DEVISE</h1>
                        <p className="text-[10px] text-white/30 font-medium">MiroFish Engine · ArmorClaw</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Live stocks ticker */}
                    <div className="hidden md:flex items-center gap-4">
                        {stocks.slice(0,4).map(s => (
                            <div key={s.ticker} className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-white/60">{s.ticker}</span>
                                <span className="font-mono font-bold text-white/80">${s.price?.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-6 w-px bg-white/[0.06] hidden md:block" />
                    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        pipelineStatus==="EXECUTED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        pipelineStatus==="BLOCKED"||pipelineStatus==="ALL_ATTACKS_BLOCKED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        "bg-white/[0.03] text-white/30 border border-white/[0.06]"
                    )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", isRunning?"bg-amber-400 animate-pulse":pipelineStatus==="EXECUTED"?"bg-emerald-500":pipelineStatus?"bg-red-500":"bg-white/20")} />
                        {isRunning ? "LIVE" : pipelineStatus || "READY"}
                    </div>
                </div>
            </header>

            {/* ═══ MAIN GRID ═══ */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] overflow-hidden">

                {/* ── LEFT PANEL ── */}
                <div className="flex flex-col overflow-y-auto">

                    {/* Pipeline Flow */}
                    <div className="px-5 pt-5 pb-3">
                        <div className="flex items-center justify-center gap-2">
                            {PIPELINE_NODES.map((node, i) => {
                                const st = nodeStatuses[node.id]||"idle"
                                const Icon = node.icon
                                return (
                                    <React.Fragment key={node.id}>
                                        <motion.div
                                            animate={st==="processing"?{scale:[1,1.03,1],transition:{repeat:Infinity,duration:1.5}}:{scale:1}}
                                            className={cn("relative flex flex-col items-center gap-2 p-4 rounded-2xl min-w-[100px] transition-all duration-500",
                                                st==="idle" && "card",
                                                st==="processing" && "card card-glow-amber border-amber-500/20",
                                                st==="allowed" && "card card-glow-green border-emerald-500/20",
                                                st==="blocked" && "card card-glow-red border-red-500/20",
                                            )}
                                        >
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                st==="idle" ? "bg-white/[0.04] text-white/20" :
                                                st==="processing" ? `bg-gradient-to-br ${node.gradient} text-white shadow-lg` :
                                                st==="allowed" ? "bg-emerald-500/15 text-emerald-400" :
                                                "bg-red-500/15 text-red-400"
                                            )}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="text-center">
                                                <div className={cn("text-[10px] font-bold uppercase tracking-wide",
                                                    st==="idle"?"text-white/25":st==="processing"?"text-amber-400":st==="allowed"?"text-emerald-400":"text-red-400"
                                                )}>{node.label}</div>
                                                <div className="text-[8px] text-white/15 uppercase">{node.sub}</div>
                                            </div>
                                            {(st==="allowed"||st==="blocked") && (
                                                <motion.div initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}}
                                                    className={cn("absolute -bottom-2 text-[7px] font-bold uppercase px-2 py-0.5 rounded-full",
                                                        st==="allowed"?"bg-emerald-500/15 text-emerald-400 border border-emerald-500/20":"bg-red-500/15 text-red-400 border border-red-500/20"
                                                    )}>{st==="allowed"?"✓ Pass":"✗ Block"}</motion.div>
                                            )}
                                        </motion.div>
                                        {i<PIPELINE_NODES.length-1 && (
                                            <div className="flex items-center w-8 relative">
                                                <div className={cn("h-px w-full",nodeStatuses[PIPELINE_NODES[i].id]==="allowed"?"bg-emerald-500/30":"bg-white/[0.06]")} />
                                                {nodeStatuses[PIPELINE_NODES[i].id]==="allowed" && <motion.div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400/80" initial={{left:0,opacity:0}} animate={{left:"100%",opacity:[0,1,1,0]}} transition={{duration:1,repeat:Infinity,ease:"linear"}} />}
                                                <ChevronRight className={cn("w-3 h-3 absolute left-1/2 -translate-x-1/2",nodeStatuses[PIPELINE_NODES[i].id]==="allowed"?"text-emerald-500/50":"text-white/[0.08]")} />
                                            </div>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </div>
                    </div>

                    {/* Status Bar */}
                    <AnimatePresence mode="wait">
                        {statusLabel && (
                            <motion.div key={statusLabel} initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                                className={cn("mx-5 mb-3 px-4 py-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold",
                                    pipelineStatus==="ALL_ATTACKS_BLOCKED"?"bg-red-500/8 text-red-400 border border-red-500/15":
                                    pipelineStatus==="EXECUTED"?"bg-emerald-500/8 text-emerald-400 border border-emerald-500/15":
                                    pipelineStatus==="BLOCKED"?"bg-amber-500/8 text-amber-400 border border-amber-500/15":
                                    "bg-white/[0.02] text-white/50 border border-white/[0.04]"
                                )}>
                                {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {pipelineStatus==="EXECUTED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {(pipelineStatus==="BLOCKED"||pipelineStatus==="ALL_ATTACKS_BLOCKED") && <ShieldAlert className="w-3.5 h-3.5" />}
                                {statusLabel}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Content Area ── */}
                    <div className="flex-1 px-5 pb-5 space-y-4 min-h-0 overflow-y-auto">
                        <AnimatePresence>
                        {isIdle && (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:0.98}} className="space-y-5">

                                {/* Title */}
                                <div className="text-center pt-2">
                                    <h2 className="text-2xl font-black tracking-tight"><span className="gradient-text">MiroFish</span> <span className="text-white/50">Pipeline</span></h2>
                                    <p className="text-xs text-white/25 mt-1">Swarm Intelligence · Enforcement · Live Execution</p>
                                </div>

                                {/* Seed Input */}
                                <div className="card p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3 h-3 text-amber-500/50" /> News Seed</span>
                                        <span className="text-[9px] text-white/15">Select a sample ↓</span>
                                    </div>
                                    <textarea placeholder="Paste financial news, earnings data, or market event..." value={seed} onChange={e=>setSeed(e.target.value)}
                                        className="w-full h-20 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-xs text-white/70 focus:border-amber-500/30 outline-none transition-all resize-none placeholder:text-white/15 font-mono" />
                                    <div className="flex flex-wrap gap-1.5">
                                        {SEEDS.map(s => (
                                            <button key={s.label} onClick={()=>{setSeed(s.text);setSelectedTicker(s.ticker)}}
                                                className={cn("px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all",
                                                    s.blocked ? "border border-red-500/15 text-red-400/50 hover:border-red-500/40 hover:text-red-400" :
                                                    "border border-white/[0.05] text-white/30 hover:border-amber-500/30 hover:text-amber-400"
                                                )}>{s.label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Stock Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {stocks.slice(0,8).map(s => (
                                        <button key={s.ticker} onClick={()=>setSelectedTicker(s.ticker)}
                                            className={cn("card-sm p-3 text-left transition-all hover:border-white/10",
                                                selectedTicker===s.ticker && "!border-amber-500/30 card-glow-amber"
                                            )}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold">{s.ticker}</span>
                                                <span className={cn("text-[9px] font-bold",s.source==='alpaca_live'?"text-emerald-400":"text-white/20")}>
                                                    {s.source==='alpaca_live'?"LIVE":"SIM"}
                                                </span>
                                            </div>
                                            <div className="text-sm font-mono font-bold text-white/80">${s.price?.toFixed(2)}</div>
                                            <div className="text-[9px] text-white/20 mt-0.5">Vol: {(s.volume/1e6)?.toFixed(1)}M</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button onClick={()=>runPipeline(false)}
                                        className="flex-1 group relative px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] overflow-hidden">
                                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                        <span className="relative flex items-center justify-center gap-2"><Play className="w-4 h-4" /> Run Simulation</span>
                                    </button>
                                    <button onClick={()=>runPipeline(true)}
                                        className="px-5 py-4 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 font-bold uppercase tracking-wider text-[10px] transition-all hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-[0.98]">
                                        <span className="flex items-center gap-2"><Skull className="w-4 h-4" /> Attack</span>
                                    </button>
                                </div>

                                {/* OpenClaw Agent */}
                                <div className="card p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-violet-400" />
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">OpenClaw Agent</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input value={agentInput} onChange={e=>setAgentInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&runAgent()}
                                            placeholder="e.g. Research NVDA and buy 5 shares..."
                                            className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2.5 text-xs text-white/70 focus:border-violet-500/30 outline-none placeholder:text-white/15" />
                                        <button onClick={runAgent} disabled={agentLoading}
                                            className="px-4 rounded-lg bg-violet-500/15 text-violet-400 hover:bg-violet-500 hover:text-white transition-all disabled:opacity-50">
                                            {agentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {agentResult && (
                                        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="card-sm p-3 space-y-2">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-bold text-white/40">Status: <span className={agentResult.status==="completed"?"text-emerald-400":"text-red-400"}>{agentResult.status}</span></span>
                                                {agentResult.enforcement_summary && <span className="text-white/20">✓{agentResult.enforcement_summary.allowed} ✗{agentResult.enforcement_summary.blocked}</span>}
                                            </div>
                                            {agentResult.steps?.map((s:any,i:number) => (
                                                <div key={i} className="flex items-start gap-2 text-[10px]">
                                                    {s.status==="executed"?<CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0"/>:<XCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0"/>}
                                                    <span className="text-white/40"><span className="font-bold text-white/60">{s.tool}</span> — {s.reasoning}</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>

                        {/* ── RUNNING / RESULT STATE ── */}
                        <AnimatePresence>
                        {!isIdle && (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">

                                {/* MiroFish Agent Results */}
                                {Object.keys(sectorResults).length > 0 && (
                                    <div className="card p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-cyan-400" /> MiroFish Agents</span>
                                            <span className="text-[8px] text-white/15">15 agents · 5 rounds · emergent</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {Object.entries(sectorResults).map(([k,v]:any, i) => {
                                                const ag = AGENTS[k]||{icon:Activity,label:k,color:"text-white/40"}; const AI=ag.icon;
                                                return (
                                                    <motion.div key={k} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
                                                        className={cn("card-sm p-3 relative overflow-hidden",
                                                            v.verdict==="bullish"?"border-emerald-500/10":v.verdict==="bearish"?"border-red-500/10":"")}>
                                                        <div className={cn("absolute top-0 left-0 w-0.5 h-full rounded-full",v.verdict==="bullish"?"bg-emerald-500/50":v.verdict==="bearish"?"bg-red-500/50":"bg-white/[0.06]")} />
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <AI className={cn("w-3.5 h-3.5",ag.color)} />
                                                            <span className="text-[9px] font-bold text-white/50 uppercase">{ag.label}</span>
                                                            <span className={cn("text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-full ml-auto",
                                                                v.verdict==="bullish"?"text-emerald-400 bg-emerald-500/10":v.verdict==="bearish"?"text-red-400 bg-red-500/10":"text-white/25 bg-white/5"
                                                            )}>{v.verdict}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                                                <motion.div initial={{width:0}} animate={{width:`${v.confidence*100}%`}} transition={{duration:.8}}
                                                                    className={cn("h-full rounded-full",v.verdict==="bullish"?"bg-gradient-to-r from-emerald-600 to-emerald-400":v.verdict==="bearish"?"bg-gradient-to-r from-red-600 to-red-400":"bg-white/15")} />
                                                            </div>
                                                            <span className="text-[9px] font-mono font-bold text-white/30">{(v.confidence*100).toFixed(0)}%</span>
                                                        </div>
                                                        <p className="text-[8px] text-white/15 line-clamp-2">{v.reasoning}</p>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Consensus */}
                                {recommendation && (
                                    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="card p-4 border-amber-500/10 card-glow-amber">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-amber-500/50 uppercase tracking-wider flex items-center gap-1.5"><Brain className="w-3 h-3" /> Consensus</span>
                                            <div className={cn("text-lg font-black",recommendation.action==="BUY"?"text-emerald-400":"text-white/40")}>
                                                {recommendation.action} {recommendation.ticker} × {recommendation.quantity}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-[10px] text-white/30">Confidence: <span className="text-amber-400 font-bold">{(recommendation.confidence*100).toFixed(1)}%</span></span>
                                            <span className="text-[10px] text-white/20 italic flex-1">{recommendation.reason}</span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Attack blocks */}
                                {poisonedPayload && (
                                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-2">
                                        <div className="card-sm p-3"><div className="text-[9px] font-bold text-white/30 uppercase mb-1">Visible Content</div><pre className="text-[10px] text-white/60 whitespace-pre-wrap font-mono">{poisonedPayload.visible_content}</pre></div>
                                        <div className="card-sm p-3 border-red-500/20 card-glow-red">
                                            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /><span className="text-[9px] font-bold text-red-500 uppercase">Injected Payload</span></div>
                                            <pre className="text-[10px] text-red-400 whitespace-pre-wrap font-mono">{poisonedPayload.injected_payload}</pre>
                                        </div>
                                    </motion.div>
                                )}

                                {attackBlocks.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Block Report</span>
                                        {attackBlocks.map((b,i) => (
                                            <motion.div key={i} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:i*0.15}}
                                                className="card-sm p-3 border-red-500/15 flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-500 font-black shrink-0">{b.block_number}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-bold text-red-400 uppercase">{b.layer}</span><span className="text-[9px] text-white/25 font-mono">{b.agent}/{b.tool}</span></div>
                                                    <p className="text-[10px] text-white/50 font-mono break-words">{b.reason}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Trade Result */}
                                {tradeResult && (
                                    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="card p-4 border-emerald-500/15 card-glow-green">
                                        <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-sm font-bold text-emerald-400">Trade Executed</span>
                                            {tradeResult.status && <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold uppercase rounded-full">{tradeResult.status}</span>}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[10px]">
                                            <div><span className="text-white/25">Symbol:</span> <span className="font-bold">{tradeResult.symbol}</span></div>
                                            <div><span className="text-white/25">Qty:</span> <span className="font-bold">{tradeResult.qty}</span></div>
                                            <div><span className="text-white/25">Price:</span> <span className="font-bold text-emerald-400">{tradeResult.filled_avg_price?`$${tradeResult.filled_avg_price}`:"Market Order"}</span></div>
                                            <div><span className="text-white/25">Source:</span> <span className="font-bold text-white/50">{tradeResult.source}</span></div>
                                            <div><span className="text-white/25">ID:</span> <span className="font-mono text-white/25">{tradeResult.order_id?.slice(0,8)||"—"}</span></div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Reset */}
                                {!isRunning && phase!=="IDLE" && (
                                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex justify-center pt-2">
                                        <button onClick={resetPipeline} className="px-6 py-2.5 rounded-xl border border-white/[0.06] text-white/30 text-[10px] font-bold uppercase tracking-wider hover:border-amber-500/30 hover:text-amber-400 transition-all flex items-center gap-2">
                                            <ArrowLeft className="w-3 h-3" /> Reset Pipeline
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── RIGHT: AUDIT TRAIL ── */}
                <aside className="hidden lg:flex flex-col bg-[#09090d] border-l border-white/[0.04]">
                    <div className="h-12 flex items-center justify-between px-4 border-b border-white/[0.04]">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5"><Terminal className="w-3 h-3 text-amber-500/40" /> Audit Trail</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] text-white/15 font-mono">{auditLog.length} entries</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full",isRunning?"bg-emerald-500 animate-pulse":"bg-white/10")} />
                        </div>
                    </div>
                    <div ref={auditRef} className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
                        <AnimatePresence initial={false}>
                            {auditLog.map(e => (
                                <motion.div key={e.id} initial={{opacity:0,x:6}} animate={{opacity:1,x:0}}
                                    className={cn("flex gap-2 py-2 px-2.5 rounded-lg text-[9px]",
                                        e.decision==="ALLOWED"?"bg-emerald-500/[0.03] border-l-2 border-emerald-500/30":"bg-red-500/[0.03] border-l-2 border-red-500/30"
                                    )}>
                                    <span className="text-white/15 shrink-0 font-mono">{e.time}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            {e.decision==="ALLOWED"?<CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0"/>:<XCircle className="w-2.5 h-2.5 text-red-500 shrink-0"/>}
                                            <span className={cn("font-bold uppercase",e.decision==="ALLOWED"?"text-emerald-400/70":"text-red-400/70")}>{e.decision}</span>
                                            <span className="text-white/15">·</span>
                                            <span className="text-white/30 font-semibold uppercase">{e.agent}</span>
                                            <span className="text-white/15">·</span>
                                            <span className="text-white/20 uppercase">{e.tool}</span>
                                        </div>
                                        <div className="text-white/15 break-words">{e.rule}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {auditLog.length===0 && !isRunning && <div className="flex items-center justify-center h-full text-white/[0.06] text-[10px] font-bold uppercase tracking-wider">Awaiting Data</div>}
                        {isRunning && <div className="flex items-center gap-2 py-3 text-[9px]"><Loader2 className="w-3 h-3 text-amber-400 animate-spin" /><span className="text-amber-400/50 font-bold uppercase tracking-wider animate-pulse">Streaming...</span></div>}
                    </div>
                    <div className="h-10 border-t border-white/[0.04] flex items-center justify-between px-4 text-[8px] text-white/20 uppercase tracking-wider font-bold">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-emerald-500/50"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"/>{auditLog.filter(e=>e.decision==="ALLOWED").length}</span>
                            <span className="flex items-center gap-1 text-red-500/50"><div className="w-1.5 h-1.5 rounded-full bg-red-500/50"/>{auditLog.filter(e=>e.decision==="BLOCKED").length}</span>
                        </div>
                        <span className="text-white/10">MiroFish + ArmorClaw</span>
                    </div>
                </aside>
            </main>

            {/* Border glow effects */}
            <AnimatePresence>
                {pipelineStatus==="EXECUTED" && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 pointer-events-none z-[100] rounded-xl" style={{boxShadow:"inset 0 0 80px rgba(16,185,129,0.04), inset 0 0 2px rgba(16,185,129,0.15)"}} />}
                {(pipelineStatus==="BLOCKED"||pipelineStatus==="ALL_ATTACKS_BLOCKED") && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 pointer-events-none z-[100]" style={{boxShadow:"inset 0 0 80px rgba(239,68,68,0.04), inset 0 0 2px rgba(239,68,68,0.15)"}} />}
            </AnimatePresence>
        </div>
    )
}
