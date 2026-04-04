"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Terminal, Activity, FileText, Shield, ShieldAlert,
    CheckCircle2, XCircle, AlertTriangle, Loader2, Play,
    Skull, Users, Landmark, TrendingUp, BarChart3,
    Newspaper, Brain, Zap, Send, LayoutDashboard,
    Eye, Swords, Bot, Wallet, ScrollText, Settings,
    RefreshCw, Search, ChevronRight, ArrowUpRight, ArrowDownRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { API, fetchWithRetry } from "@/lib/api"

// ── Types ────────────────────────────────────────────────────────
type Phase = "IDLE"|"SWARM_ANALYST"|"RISK_AGENT"|"ARMORCLAW"|"DEVICE_POLICY"|"TRADER"|"COMPLETE"|"BLOCKED"
type NStatus = "idle"|"processing"|"allowed"|"blocked"
interface AuditEntry { id:string; time:string; agent:string; tool:string; target:string; decision:string; rule:string }

const AGENTS: Record<string,{icon:React.ElementType;label:string;color:string}> = {
    RetailTraders:{icon:Users,label:"Retail",color:"text-cyan-400"},
    Institutional:{icon:Landmark,label:"Institutional",color:"text-blue-400"},
    HedgeFunds:{icon:TrendingUp,label:"Hedge Funds",color:"text-violet-400"},
    Analysts:{icon:BarChart3,label:"Analysts",color:"text-amber-400"},
    MediaSentiment:{icon:Newspaper,label:"Media",color:"text-rose-400"},
    Technology:{icon:Zap,label:"Technology",color:"text-cyan-400"},
    Macro:{icon:Landmark,label:"Macro",color:"text-blue-400"},
    SupplyChain:{icon:TrendingUp,label:"Supply Chain",color:"text-violet-400"},
    Technical:{icon:BarChart3,label:"Technical",color:"text-amber-400"},
    Earnings:{icon:Newspaper,label:"Earnings",color:"text-rose-400"},
}

const SEEDS = [
    { label:"NVDA Earnings",ticker:"NVDA",text:"NVIDIA Q4 2025: Revenue $35.1B (+94% YoY), Data Center $27.1B. Beat EPS by 12%. Blackwell production ramping.",blocked:false },
    { label:"AAPL Record",ticker:"AAPL",text:"Apple Q1 2026: Revenue $124.3B record. iPhone +6%, Services $26.3B (+14%). Apple Intelligence driving upgrades.",blocked:false },
    { label:"MSFT Cloud",ticker:"MSFT",text:"Microsoft Q2 FY2026: Azure growth 29%. Copilot adoption 60% Fortune 500. GitHub Copilot 1.8M subs.",blocked:false },
    { label:"⛔ TSLA",ticker:"TSLA",text:"Tesla Q4: Revenue $25.2B, margins declining. Cybertruck below expectations.",blocked:true },
]

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Brain, label: "MiroFish" },
    { icon: Shield, label: "ArmorClaw" },
    { icon: Bot, label: "OpenClaw" },
    { icon: Wallet, label: "Portfolio" },
    { icon: ScrollText, label: "Audit Log" },
]

export function PipelineDashboard() {
    const [phase, setPhase] = React.useState<Phase>("IDLE")
    const [nodeStatuses, setNodeStatuses] = React.useState<Record<string,NStatus>>({})
    const [auditLog, setAuditLog] = React.useState<AuditEntry[]>([])
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
    const [violatedRules, setViolatedRules] = React.useState<string[]>([])
    const [portfolio, setPortfolio] = React.useState<any>(null)
    const [orders, setOrders] = React.useState<any[]>([])
    const [agentInput, setAgentInput] = React.useState("")
    const [agentResult, setAgentResult] = React.useState<any>(null)
    const [agentLoading, setAgentLoading] = React.useState(false)
    const [activeNav, setActiveNav] = React.useState("Dashboard")
    const auditRef = React.useRef<HTMLDivElement>(null)

    const refreshPortfolio = React.useCallback(()=>{
        fetchWithRetry(API.portfolio).then(r=>r.json()).then(d=>setPortfolio(d)).catch(()=>{})
    },[])
    const refreshOrders = React.useCallback(()=>{
        fetchWithRetry(API.orders).then(r=>r.json()).then(d=>setOrders(d.orders||[])).catch(()=>{})
    },[])

    React.useEffect(()=>{
        Promise.all([
            fetchWithRetry(API.stocks).then(r=>r.json()).catch(()=>({tickers:[]})),
            fetchWithRetry(API.portfolio).then(r=>r.json()).catch(()=>null),
            fetchWithRetry(API.orders).then(r=>r.json()).catch(()=>({orders:[]})),
        ]).then(([s,port,ord])=>{
            setStocks(s.tickers||[])
            if(port) setPortfolio(port)
            setOrders(ord.orders||[])
        })
    },[])

    React.useEffect(()=>{
        const t=setInterval(()=>{fetchWithRetry(API.stocks).then(r=>r.json()).then(d=>setStocks(d.tickers||[])).catch(()=>{})},30000)
        return ()=>clearInterval(t)
    },[])
    React.useEffect(()=>{if(pipelineStatus==="EXECUTED"){refreshPortfolio();refreshOrders()}},[pipelineStatus,refreshPortfolio,refreshOrders])
    React.useEffect(()=>{if(auditRef.current)auditRef.current.scrollTop=auditRef.current.scrollHeight},[auditLog])

    const resetPipeline=()=>{setPhase("IDLE");setNodeStatuses({});setAuditLog([]);setSectorResults({});setRecommendation(null);setToken(null);setTradeResult(null);setPipelineStatus("");setStatusLabel("");setAttackBlocks([]);setPoisonedPayload(null);setViolatedRules([]);setIsRunning(false)}

    const runPipeline=(isAttack:boolean=false)=>{
        if(isRunning)return;resetPipeline();setIsRunning(true)
        const ws=new WebSocket(API.ws)
        const qty = Math.floor(Math.random() * 46) + 5 // 5-50 shares
        ws.onopen=()=>ws.send(JSON.stringify({mode:isAttack?"attack":"run",ticker:selectedTicker,action:"BUY",quantity:qty,confidence:0.78,reason:seed||"Strong semiconductor demand with accelerating data center revenue"}))
        ws.onmessage=(e)=>handleMsg(JSON.parse(e.data))
        ws.onerror=()=>{setIsRunning(false);setPipelineStatus("ERROR");setStatusLabel("Connection Failed")}
        ws.onclose=()=>setIsRunning(false)
    }

    const runAgent=async()=>{
        if(!agentInput.trim()||agentLoading)return;setAgentLoading(true);setAgentResult(null)
        try{const r=await fetch(`${API.base}/v1/agent/run`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({instruction:agentInput})});setAgentResult(await r.json())}catch{setAgentResult({status:"error",steps:[]})}
        setAgentLoading(false)
    }

    const handleMsg=(msg:any)=>{
        const now=new Date().toLocaleTimeString("en-GB",{hour12:false})
        switch(msg.type){
            case "phase":{
                setPhase(msg.phase as Phase);setStatusLabel(msg.message||`Processing: ${msg.phase}`)
                if(msg.status==="processing")setNodeStatuses(p=>({...p,[msg.phase]:"processing"}))
                else if(msg.status==="allowed"){
                    setNodeStatuses(p=>({...p,[msg.phase]:"allowed"}))
                    if(msg.data?.quote){setRecommendation(msg.data.recommendation||null);if(msg.data.recommendation)setSectorResults({Technology:{verdict:"bullish",confidence:0.85,weight:0.25,reasoning:"Strong AI hardware demand"},Macro:{verdict:"neutral",confidence:0.62,weight:0.15,reasoning:"Stable rate environment"},SupplyChain:{verdict:"bullish",confidence:0.71,weight:0.15,reasoning:"Fab capacity expanding"},Institutional:{verdict:"bullish",confidence:0.79,weight:0.20,reasoning:"Heavy institutional buying"},Technical:{verdict:"bullish",confidence:0.68,weight:0.10,reasoning:"Above 200 DMA"},Earnings:{verdict:"bullish",confidence:0.83,weight:0.15,reasoning:"Beat estimates 4 consecutive Q"}})}
                    if(msg.data?.token)setToken(msg.data.token)
                    if(msg.data?.order)setTradeResult(msg.data.order)
                    setAuditLog(p=>[...p,{id:Date.now().toString(),time:now,agent:msg.phase?.toLowerCase()?.replace('_',' ')||'system',tool:msg.phase==='TRADER'?'order_place':msg.phase==='ARMORCLAW'?'intent_verify':'analysis',target:selectedTicker,decision:"ALLOWED",rule:msg.message||"all_checks_passed"}])
                }else if(msg.status==="blocked"){
                    setNodeStatuses(p=>({...p,[msg.phase]:"blocked"}))
                    if(msg.data?.violations)setViolatedRules(msg.data.violations.map((v:any)=>v.rule))
                    setAuditLog(p=>[...p,{id:Date.now().toString(),time:now,agent:msg.phase?.toLowerCase()?.replace('_',' ')||'system',tool:msg.phase==='ARMORCLAW'?'injection_scan':'policy_check',target:selectedTicker,decision:"BLOCKED",rule:msg.message||"policy_violation"}])
                }
                break
            }
            case "attack_payload":setPoisonedPayload(msg.data);setPhase("SWARM_ANALYST");setNodeStatuses(p=>({...p,SWARM_ANALYST:"allowed"}));setStatusLabel(msg.message||"Poisoned data ingested");break
            case "attack_block":{const b=msg.data;setAttackBlocks(p=>[...p,b]);setNodeStatuses(p=>({...p,ARMORCLAW:"blocked"}));setAuditLog(p=>[...p,{id:Date.now().toString()+(b.block_number||''),time:now,agent:b.agent||'armorclaw',tool:b.tool||'enforcement',target:selectedTicker,decision:"BLOCKED",rule:`[${b.layer}] ${b.reason}`}]);if(b.layer==="DEVISE_POLICY")setViolatedRules(["ticker_universe","max_order_size"]);break}
            case "pipeline_complete":
                setPipelineStatus(msg.status)
                if(msg.status==="EXECUTED"){setPhase("COMPLETE");setStatusLabel("Trade Executed ✓");if(msg.data?.order)setTradeResult(msg.data.order);if(msg.data?.token)setToken(msg.data.token)}
                else if(msg.status==="ALL_ATTACKS_BLOCKED"){setPhase("BLOCKED");setStatusLabel(`All ${msg.data?.blocks?.length||3} Attacks Blocked`);setNodeStatuses({SWARM_ANALYST:"allowed",RISK_AGENT:"blocked",ARMORCLAW:"blocked",TRADER:"blocked"})}
                else if(msg.status==="BLOCKED"){setPhase("BLOCKED");setStatusLabel(msg.message||"Blocked")}
                fetch(API.audit).then(r=>r.json()).then(data=>{if(data.entries?.length>0){const se=data.entries.slice(-10).map((e:any)=>({id:e.id,time:e.timestamp?.split('T')[1]?.slice(0,8)||now,agent:e.agent,tool:e.tool,target:selectedTicker,decision:e.status==='PASS'?'ALLOWED':e.status==='BLOCK'?'BLOCKED':e.status,rule:e.reason||e.event_type}));setAuditLog(p=>[...p,...se])}}).catch(()=>{})
                setIsRunning(false);break
            case "error":setIsRunning(false);setPipelineStatus("ERROR");setStatusLabel(`Error: ${msg.message}`);break
        }
    }

    const isIdle=phase==="IDLE"&&!isRunning
    const allowed=auditLog.filter(e=>e.decision==="ALLOWED").length
    const blocked=auditLog.filter(e=>e.decision==="BLOCKED").length

    // ── RENDER ────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0d0e12] text-white flex">

            {/* ═══ SIDEBAR ═══ */}
            <aside className="w-[220px] shrink-0 border-r border-white/[0.06] bg-[#111216] flex flex-col p-4 gap-1 sticky top-0 h-screen">
                <div className="flex items-center gap-2.5 px-3 py-4 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-black text-sm">D</div>
                    <span className="text-sm font-bold tracking-tight">Devise</span>
                </div>
                {NAV_ITEMS.map(n=>(
                    <button key={n.label} onClick={()=>setActiveNav(n.label)}
                        className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                            activeNav===n.label ? "bg-emerald-500/10 text-emerald-400" : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                        )}>
                        <n.icon className="w-4 h-4" />
                        {n.label}
                    </button>
                ))}
                <div className="flex-1" />
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/25 hover:text-white/50 transition-all">
                    <Settings className="w-4 h-4" /> Settings
                </button>
            </aside>

            {/* ═══ MAIN ═══ */}
            <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

                {/* ── TOPBAR ── */}
                <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 bg-[#0d0e12]/80 backdrop-blur-xl border-b border-white/[0.04]">
                    <h1 className="text-lg font-bold">Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                            <Search className="w-3.5 h-3.5 text-white/30" />
                            <span className="text-xs text-white/30">Search...</span>
                        </div>
                        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase",
                            pipelineStatus==="EXECUTED"?"bg-emerald-500/10 text-emerald-400 border border-emerald-500/15":
                            pipelineStatus==="BLOCKED"||pipelineStatus==="ALL_ATTACKS_BLOCKED"?"bg-red-500/10 text-red-400 border border-red-500/15":
                            "bg-white/[0.04] text-white/40 border border-white/[0.06]"
                        )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full",isRunning?"bg-emerald-400 animate-pulse":pipelineStatus==="EXECUTED"?"bg-emerald-500":pipelineStatus?"bg-red-500":"bg-white/20")} />
                            {isRunning?"LIVE":pipelineStatus||"READY"}
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-6 space-y-5">

                    {/* ── ROW 1: STAT CARDS ── */}
                    <div className="grid grid-cols-4 gap-4">
                        {/* Portfolio Value */}
                        <div className="bg-[#16171c] rounded-2xl border border-white/[0.06] p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-white/40 font-medium">Portfolio</span>
                                <Wallet className="w-4 h-4 text-emerald-400/50" />
                            </div>
                            <div className="text-2xl font-bold">${portfolio?.equity ? Number(portfolio.equity).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—'}</div>
                            <div className="flex items-center gap-1 mt-1">
                                {portfolio?.equity && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
                                <span className="text-xs text-emerald-400 font-medium">{portfolio?.equity ? '+' + ((Number(portfolio.equity)-100000)/1000).toFixed(1)+'%' : ''}</span>
                            </div>
                        </div>
                        {/* MiroFish Status */}
                        <div className="bg-[#16171c] rounded-2xl border border-white/[0.06] p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-white/40 font-medium">MiroFish Agents</span>
                                <Brain className="w-4 h-4 text-cyan-400/50" />
                            </div>
                            <div className="text-2xl font-bold">15</div>
                            <div className="text-xs text-white/30 mt-1">5 types · 5 rounds</div>
                        </div>
                        {/* ArmorClaw */}
                        <div className="bg-[#16171c] rounded-2xl border border-white/[0.06] p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-white/40 font-medium">ArmorClaw</span>
                                <Shield className="w-4 h-4 text-amber-400/50" />
                            </div>
                            <div className="flex items-baseline gap-3">
                                <div><span className="text-2xl font-bold text-emerald-400">{allowed}</span><span className="text-xs text-white/30 ml-1">passed</span></div>
                                <div><span className="text-2xl font-bold text-red-400">{blocked}</span><span className="text-xs text-white/30 ml-1">blocked</span></div>
                            </div>
                        </div>
                        {/* Trades */}
                        <div className="bg-[#16171c] rounded-2xl border border-white/[0.06] p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-white/40 font-medium">Trades Today</span>
                                <Activity className="w-4 h-4 text-violet-400/50" />
                            </div>
                            <div className="text-2xl font-bold">{orders.length}</div>
                            <div className="text-xs text-white/30 mt-1">via Alpaca Paper</div>
                        </div>
                    </div>

                    {/* ── ROW 2: PIPELINE + STOCKS ── */}
                    <div className="grid grid-cols-5 gap-4">

                        {/* Pipeline Control — 3 cols */}
                        <div className="col-span-3 bg-[#16171c] rounded-2xl border border-white/[0.06] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold">MiroFish Pipeline</h3>
                                {statusLabel && <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full",
                                    pipelineStatus==="EXECUTED"?"bg-emerald-500/10 text-emerald-400":pipelineStatus==="BLOCKED"||pipelineStatus==="ALL_ATTACKS_BLOCKED"?"bg-red-500/10 text-red-400":"bg-white/[0.04] text-white/40"
                                )}>{statusLabel}</span>}
                            </div>

                            {/* Pipeline nodes inline */}
                            <div className="flex items-center gap-2">
                                {[{id:"SWARM_ANALYST",l:"MiroFish",icon:Brain,c:"cyan"},{id:"RISK_AGENT",l:"Risk",icon:Eye,c:"violet"},{id:"ARMORCLAW",l:"ArmorClaw",icon:Shield,c:"amber"},{id:"TRADER",l:"Trader",icon:Zap,c:"emerald"}].map((n,i,a)=>{
                                    const st=nodeStatuses[n.id]||"idle"; const I=n.icon
                                    return(<React.Fragment key={n.id}>
                                        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl flex-1 transition-all border",
                                            st==="idle"&&"bg-white/[0.02] border-white/[0.04]",
                                            st==="processing"&&"bg-amber-500/8 border-amber-500/20",
                                            st==="allowed"&&"bg-emerald-500/8 border-emerald-500/20",
                                            st==="blocked"&&"bg-red-500/8 border-red-500/20",
                                        )}>
                                            <I className={cn("w-4 h-4",st==="idle"?"text-white/20":st==="processing"?"text-amber-400":st==="allowed"?"text-emerald-400":"text-red-400")} />
                                            <div>
                                                <div className={cn("text-[10px] font-bold",st==="idle"?"text-white/30":st==="processing"?"text-amber-400":st==="allowed"?"text-emerald-400":"text-red-400")}>{n.l}</div>
                                                {st!=="idle"&&<div className="text-[8px] font-medium text-white/20">{st==="allowed"?"✓ Pass":st==="blocked"?"✗ Block":"..."}</div>}
                                            </div>
                                        </div>
                                        {i<a.length-1&&<ChevronRight className="w-3 h-3 text-white/10 shrink-0" />}
                                    </React.Fragment>)
                                })}
                            </div>

                            {/* Seed input */}
                            <textarea placeholder="Paste financial news or earnings data..." value={seed} onChange={e=>setSeed(e.target.value)}
                                className="w-full h-16 bg-[#0d0e12] border border-white/[0.06] rounded-xl p-3 text-xs text-white/60 focus:border-emerald-500/30 outline-none resize-none placeholder:text-white/15 font-mono" />
                            <div className="flex flex-wrap gap-1.5">
                                {SEEDS.map(s=>(
                                    <button key={s.label} onClick={()=>{setSeed(s.text);setSelectedTicker(s.ticker)}}
                                        className={cn("px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all border",
                                            s.blocked?"border-red-500/15 text-red-400/50 hover:text-red-400":"border-white/[0.06] text-white/30 hover:text-emerald-400 hover:border-emerald-500/20"
                                        )}>{s.label}</button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={()=>runPipeline(false)} disabled={isRunning}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
                                    {isRunning?<Loader2 className="w-4 h-4 animate-spin"/>:<Play className="w-4 h-4"/>} {isRunning?"Running...":"Run Simulation"}
                                </button>
                                <button onClick={()=>runPipeline(true)} disabled={isRunning}
                                    className="px-4 py-3 bg-red-500/10 border border-red-500/15 text-red-400 font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">
                                    <Skull className="w-4 h-4" />
                                </button>
                                {!isIdle&&!isRunning&&<button onClick={resetPipeline} className="px-4 py-3 bg-white/[0.03] border border-white/[0.06] text-white/30 rounded-xl hover:text-white/60 transition-all"><RefreshCw className="w-4 h-4"/></button>}
                            </div>
                        </div>

                        {/* Stocks — 2 cols */}
                        <div className="col-span-2 bg-[#16171c] rounded-2xl border border-white/[0.06] p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold">Live Stocks</h3>
                                <span className="text-[9px] text-white/20">Alpaca Paper</span>
                            </div>
                            <div className="space-y-1">
                                {stocks.slice(0,6).map(s=>(
                                    <button key={s.ticker} onClick={()=>setSelectedTicker(s.ticker)}
                                        className={cn("w-full flex items-center justify-between p-3 rounded-xl transition-all",
                                            selectedTicker===s.ticker?"bg-emerald-500/8 border border-emerald-500/15":"hover:bg-white/[0.02] border border-transparent"
                                        )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
                                                selectedTicker===s.ticker?"bg-emerald-500/20 text-emerald-400":"bg-white/[0.04] text-white/40"
                                            )}>{s.ticker?.slice(0,2)}</div>
                                            <div className="text-left">
                                                <div className="text-xs font-semibold">{s.ticker}</div>
                                                <div className="text-[10px] text-white/25">{s.source==='alpaca_live'?'Live':'Simulated'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-mono font-bold">${s.price?.toFixed(2)}</div>
                                            <div className="text-[10px] text-white/20">Vol {(s.volume/1e6)?.toFixed(1)}M</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── ROW 3: MIROFISH AGENTS + OPENCLAW + AUDIT ── */}
                    <div className="grid grid-cols-5 gap-4">

                        {/* MiroFish Agents — 2 cols */}
                        <div className="col-span-2 bg-[#16171c] rounded-2xl border border-white/[0.06] p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2"><Brain className="w-4 h-4 text-cyan-400" /> MiroFish Agents</h3>
                                <span className="text-[9px] text-white/20">Emergent Consensus</span>
                            </div>
                            {Object.keys(sectorResults).length>0 ? (
                                <div className="space-y-2">
                                    {Object.entries(sectorResults).map(([k,v]:any)=>{
                                        const ag=AGENTS[k]||{icon:Activity,label:k,color:"text-white/40"};const AI=ag.icon
                                        return(
                                            <div key={k} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02]">
                                                <AI className={cn("w-4 h-4 shrink-0",ag.color)} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-semibold text-white/60">{ag.label}</span>
                                                        <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md",
                                                            v.verdict==="bullish"?"text-emerald-400 bg-emerald-500/10":v.verdict==="bearish"?"text-red-400 bg-red-500/10":"text-white/30 bg-white/5"
                                                        )}>{v.verdict}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                                            <motion.div initial={{width:0}} animate={{width:`${v.confidence*100}%`}} transition={{duration:.6}}
                                                                className={cn("h-full rounded-full",v.verdict==="bullish"?"bg-emerald-500":v.verdict==="bearish"?"bg-red-500":"bg-white/15")} />
                                                        </div>
                                                        <span className="text-[9px] font-mono text-white/30 w-7 text-right">{(v.confidence*100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {recommendation && (
                                        <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-emerald-400/60 font-semibold">Consensus</span>
                                                <span className="text-sm font-bold text-emerald-400">{recommendation.action} {recommendation.ticker} × {recommendation.quantity}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 text-white/10">
                                    <Brain className="w-8 h-8 mb-2" />
                                    <span className="text-xs">Run simulation to see agents</span>
                                </div>
                            )}
                        </div>

                        {/* OpenClaw Agent — 3 cols */}
                        <div className="col-span-3 bg-[#16171c] rounded-2xl border border-white/[0.06] p-5 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2"><Bot className="w-4 h-4 text-violet-400" /> OpenClaw Agent</h3>
                                <span className="text-[9px] text-white/20">Natural Language → Enforced Execution</span>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <input value={agentInput} onChange={e=>setAgentInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&runAgent()}
                                    placeholder="e.g. Research NVDA and buy 5 shares..."
                                    className="flex-1 bg-[#0d0e12] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white/60 focus:border-violet-500/30 outline-none placeholder:text-white/15" />
                                <button onClick={runAgent} disabled={agentLoading}
                                    className="px-4 rounded-xl bg-violet-500/15 text-violet-400 hover:bg-violet-500 hover:text-white transition-all disabled:opacity-50">
                                    {agentLoading?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                                </button>
                            </div>
                            {agentResult ? (
                                <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="flex-1 space-y-2 overflow-y-auto">
                                    <div className="flex items-center gap-3 text-[11px]">
                                        <span className={cn("font-bold",agentResult.status==="completed"?"text-emerald-400":"text-red-400")}>{agentResult.status}</span>
                                        {agentResult.enforcement_summary&&<span className="text-white/20">✓ {agentResult.enforcement_summary.allowed} · ✗ {agentResult.enforcement_summary.blocked}</span>}
                                    </div>
                                    {agentResult.steps?.map((s:any,i:number)=>(
                                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] text-[11px]">
                                            {s.status==="executed"?<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0"/>:<XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0"/>}
                                            <div><span className="font-bold text-white/60">{s.tool}</span><span className="text-white/30"> — {s.reasoning}</span></div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-white/10">
                                    <Bot className="w-8 h-8 mb-2" />
                                    <span className="text-xs">Ask the agent anything</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── ROW 4: AUDIT TRAIL + TRADE RESULT + ORDERS ── */}
                    <div className="grid grid-cols-5 gap-4">

                        {/* Audit Trail — 3 cols */}
                        <div className="col-span-3 bg-[#16171c] rounded-2xl border border-white/[0.06] p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold flex items-center gap-2"><Terminal className="w-4 h-4 text-amber-400/60" /> Enforcement Log</h3>
                                <span className="text-[9px] text-white/20">{auditLog.length} entries</span>
                            </div>
                            <div ref={auditRef} className="max-h-[200px] overflow-y-auto space-y-1 scrollbar-thin">
                                {auditLog.length>0 ? auditLog.map(e=>(
                                    <div key={e.id} className={cn("flex items-start gap-2 py-2 px-3 rounded-lg text-[10px]",
                                        e.decision==="ALLOWED"?"bg-emerald-500/[0.03]":"bg-red-500/[0.03]"
                                    )}>
                                        {e.decision==="ALLOWED"?<CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0"/>:<XCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0"/>}
                                        <div className="flex-1 min-w-0">
                                            <span className={cn("font-bold uppercase",e.decision==="ALLOWED"?"text-emerald-400/70":"text-red-400/70")}>{e.decision}</span>
                                            <span className="text-white/15 mx-1">·</span>
                                            <span className="text-white/30 font-medium">{e.agent}</span>
                                            <span className="text-white/15 mx-1">·</span>
                                            <span className="text-white/20">{e.tool}</span>
                                            <div className="text-white/15 mt-0.5 break-words">{e.rule}</div>
                                        </div>
                                        <span className="text-white/10 font-mono shrink-0">{e.time}</span>
                                    </div>
                                )) : <div className="flex items-center justify-center h-20 text-white/10 text-xs">No enforcement data yet</div>}
                            </div>
                        </div>

                        {/* Orders / Trade Result — 2 cols */}
                        <div className="col-span-2 bg-[#16171c] rounded-2xl border border-white/[0.06] p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold">Recent Orders</h3>
                                <button onClick={refreshOrders} className="text-white/20 hover:text-white/50 transition-all"><RefreshCw className="w-3.5 h-3.5" /></button>
                            </div>
                            {tradeResult && (
                                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 mb-3">
                                    <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-emerald-400"/><span className="text-xs font-bold text-emerald-400">Latest Trade</span></div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div><span className="text-white/25">Symbol</span> <span className="font-bold ml-1">{tradeResult.symbol}</span></div>
                                        <div><span className="text-white/25">Qty</span> <span className="font-bold ml-1">{tradeResult.qty}</span></div>
                                        <div><span className="text-white/25">Price</span> <span className="font-bold text-emerald-400 ml-1">{tradeResult.filled_avg_price?`$${tradeResult.filled_avg_price}`:"Market"}</span></div>
                                        <div><span className="text-white/25">Source</span> <span className="font-bold text-white/50 ml-1">{tradeResult.source}</span></div>
                                    </div>
                                </motion.div>
                            )}
                            <div className="space-y-1 max-h-[140px] overflow-y-auto scrollbar-thin">
                                {orders.slice(0,5).map((o:any,i:number)=>(
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] text-[10px]">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold",o.side==="buy"?"bg-emerald-500/15 text-emerald-400":"bg-red-500/15 text-red-400")}>{o.side==="buy"?"B":"S"}</div>
                                            <span className="font-semibold">{o.symbol}</span>
                                        </div>
                                        <span className="text-white/30">×{o.qty}</span>
                                        <span className={cn("font-medium",o.status==="filled"?"text-emerald-400":o.status==="new"?"text-amber-400":"text-white/30")}>{o.status}</span>
                                    </div>
                                ))}
                                {orders.length===0&&<div className="text-center text-white/10 text-xs py-4">No orders yet</div>}
                            </div>
                        </div>
                    </div>

                    {/* Attack blocks display */}
                    {attackBlocks.length>0 && (
                        <div className="bg-[#16171c] rounded-2xl border border-red-500/10 p-5">
                            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-3"><ShieldAlert className="w-4 h-4"/> Attack Blocked</h3>
                            {attackBlocks.map((b,i)=>(
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/[0.03] border border-red-500/10 mb-2">
                                    <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">{b.block_number}</div>
                                    <div><div className="text-[10px] font-bold text-red-400 uppercase">{b.layer}</div><p className="text-[10px] text-white/40 font-mono">{b.reason}</p></div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
