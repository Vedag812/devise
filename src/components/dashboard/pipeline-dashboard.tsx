"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
    Terminal, Activity, FileText, Shield, ShieldAlert,
    CheckCircle2, XCircle, Loader2, Play,
    Skull, Users, Landmark, TrendingUp, BarChart3,
    Newspaper, Brain, Zap, Send, LayoutDashboard,
    Eye, Bot, Wallet, ScrollText, Settings,
    RefreshCw, Search, ChevronRight, ArrowUpRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { API, fetchWithRetry } from "@/lib/api"
import { PortfolioMonitorPanel, EarningsResearchPanel, CompliancePanel } from "./agent-panels"
import { MiroFishGraph } from "./mirofish-graph"

type Phase = "IDLE"|"SWARM_ANALYST"|"RISK_AGENT"|"ARMORCLAW"|"DEVICE_POLICY"|"TRADER"|"COMPLETE"|"BLOCKED"
type NStatus = "idle"|"processing"|"allowed"|"blocked"
interface AuditEntry { id:string; time:string; agent:string; tool:string; target:string; decision:string; rule:string }

const AGENTS: Record<string,{icon:React.ElementType;label:string;color:string}> = {
    RetailTraders:{icon:Users,label:"Retail",color:"text-cyan-600"},
    Institutional:{icon:Landmark,label:"Institutional",color:"text-blue-600"},
    HedgeFunds:{icon:TrendingUp,label:"Hedge Funds",color:"text-violet-600"},
    Analysts:{icon:BarChart3,label:"Analysts",color:"text-amber-600"},
    MediaSentiment:{icon:Newspaper,label:"Media",color:"text-rose-600"},
    Technology:{icon:Zap,label:"Technology",color:"text-cyan-600"},
    Macro:{icon:Landmark,label:"Macro",color:"text-blue-600"},
    SupplyChain:{icon:TrendingUp,label:"Supply Chain",color:"text-violet-600"},
    Technical:{icon:BarChart3,label:"Technical",color:"text-amber-600"},
    Earnings:{icon:Newspaper,label:"Earnings",color:"text-rose-600"},
}

const SEEDS = [
    {label:"NVDA Earnings",ticker:"NVDA",text:"NVIDIA Q4 2025: Revenue $35.1B (+94% YoY), Data Center $27.1B. Beat EPS by 12%. Blackwell production ramping.",blocked:false},
    {label:"AAPL Record",ticker:"AAPL",text:"Apple Q1 2026: Revenue $124.3B record. iPhone +6%, Services $26.3B (+14%). Apple Intelligence driving upgrades.",blocked:false},
    {label:"MSFT Cloud",ticker:"MSFT",text:"Microsoft Q2 FY2026: Azure growth 29%. Copilot adoption 60% Fortune 500. GitHub Copilot 1.8M subs.",blocked:false},
    {label:"⛔ TSLA",ticker:"TSLA",text:"Tesla Q4: Revenue $25.2B, margins declining. Cybertruck below expectations.",blocked:true},
]

const NAV_ITEMS = [
    {icon:LayoutDashboard,label:"Dashboard",active:true},
    {icon:Brain,label:"MiroFish"},
    {icon:Shield,label:"ArmorClaw"},
    {icon:Bot,label:"OpenClaw"},
    {icon:Wallet,label:"Portfolio"},
    {icon:FileText,label:"Earnings"},
    {icon:ScrollText,label:"Compliance"},
]

export function PipelineDashboard() {
    const [phase,setPhase]=React.useState<Phase>("IDLE")
    const [nodeStatuses,setNodeStatuses]=React.useState<Record<string,NStatus>>({})
    const [auditLog,setAuditLog]=React.useState<AuditEntry[]>([])
    const [sectorResults,setSectorResults]=React.useState<Record<string,any>>({})
    const [recommendation,setRecommendation]=React.useState<any>(null)
    const [_token,setToken]=React.useState<any>(null)
    const [tradeResult,setTradeResult]=React.useState<any>(null)
    const [pipelineStatus,setPipelineStatus]=React.useState("")
    const [statusLabel,setStatusLabel]=React.useState("")
    const [attackBlocks,setAttackBlocks]=React.useState<any[]>([])
    const [_poisonedPayload,setPoisonedPayload]=React.useState<any>(null)
    const [isRunning,setIsRunning]=React.useState(false)
    const [seed,setSeed]=React.useState("")
    const [selectedTicker,setSelectedTicker]=React.useState("NVDA")
    const [stocks,setStocks]=React.useState<any[]>([])
    const [_violatedRules,setViolatedRules]=React.useState<string[]>([])
    const [portfolio,setPortfolio]=React.useState<any>(null)
    const [orders,setOrders]=React.useState<any[]>([])
    const [agentInput,setAgentInput]=React.useState("")
    const [agentResult,setAgentResult]=React.useState<any>(null)
    const [agentLoading,setAgentLoading]=React.useState(false)
    const [activeNav,setActiveNav]=React.useState("Dashboard")
    const auditRef=React.useRef<HTMLDivElement>(null)

    const refreshPortfolio=React.useCallback(()=>{fetchWithRetry(API.portfolio).then(r=>r.json()).then(d=>setPortfolio(d)).catch(()=>{})},[])
    const refreshOrders=React.useCallback(()=>{fetchWithRetry(API.orders).then(r=>r.json()).then(d=>setOrders(d.orders||[])).catch(()=>{})},[])

    React.useEffect(()=>{
        Promise.all([
            fetchWithRetry(API.stocks).then(r=>r.json()).catch(()=>({tickers:[]})),
            fetchWithRetry(API.portfolio).then(r=>r.json()).catch(()=>null),
            fetchWithRetry(API.orders).then(r=>r.json()).catch(()=>({orders:[]})),
        ]).then(([s,port,ord])=>{setStocks(s.tickers||[]);if(port)setPortfolio(port);setOrders(ord.orders||[])})
    },[])

    React.useEffect(()=>{const t=setInterval(()=>{fetchWithRetry(API.stocks).then(r=>r.json()).then(d=>setStocks(d.tickers||[])).catch(()=>{})},30000);return()=>clearInterval(t)},[])
    React.useEffect(()=>{if(pipelineStatus==="EXECUTED"){refreshPortfolio();refreshOrders()}},[pipelineStatus,refreshPortfolio,refreshOrders])
    React.useEffect(()=>{if(auditRef.current)auditRef.current.scrollTop=auditRef.current.scrollHeight},[auditLog])

    const resetPipeline=()=>{setPhase("IDLE");setNodeStatuses({});setAuditLog([]);setSectorResults({});setRecommendation(null);setToken(null);setTradeResult(null);setPipelineStatus("");setStatusLabel("");setAttackBlocks([]);setPoisonedPayload(null);setViolatedRules([]);setIsRunning(false)}

    const runPipeline=(isAttack:boolean=false)=>{
        if(isRunning)return;resetPipeline();setIsRunning(true)
        const ws=new WebSocket(API.ws)
        const qty=Math.floor(Math.random()*46)+5
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
                    if(msg.data?.quote){setRecommendation(msg.data.recommendation||null);if(msg.data.recommendation)setSectorResults({Technology:{verdict:"bullish",confidence:0.85,weight:0.25,reasoning:"Strong AI hardware demand"},Macro:{verdict:"neutral",confidence:0.62,weight:0.15,reasoning:"Stable rate environment"},SupplyChain:{verdict:"bullish",confidence:0.71,weight:0.15,reasoning:"Fab capacity expanding"},Institutional:{verdict:"bullish",confidence:0.79,weight:0.20,reasoning:"Heavy institutional buying"},Technical:{verdict:"bullish",confidence:0.68,weight:0.10,reasoning:"Above 200 DMA"},Earnings:{verdict:"bullish",confidence:0.83,weight:0.15,reasoning:"Beat estimates 4Q"}})}
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

    return (
        <div className="min-h-screen bg-[#f0f1f5] text-[#1a1a2e] flex">

            {/* ═══ SIDEBAR ═══ */}
            <aside className="w-[220px] shrink-0 bg-white border-r border-black/[0.06] flex flex-col p-4 gap-1 sticky top-0 h-screen shadow-sm">
                <div className="flex items-center gap-2.5 px-3 py-4 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-500/25">D</div>
                    <div>
                        <span className="text-sm font-bold tracking-tight">Devise</span>
                        <span className="text-[9px] ml-1.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-semibold">v3</span>
                    </div>
                </div>
                {NAV_ITEMS.map(n=>(
                    <button key={n.label} onClick={()=>setActiveNav(n.label)}
                        className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                            activeNav===n.label?"bg-indigo-50 text-indigo-600 shadow-sm":"text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        )}>
                        <n.icon className="w-[18px] h-[18px]" />
                        {n.label}
                    </button>
                ))}
                <div className="flex-1" />
                <div className="px-3 py-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
                    <div className="text-[10px] font-semibold text-indigo-600 mb-1">Hackathon Mode</div>
                    <div className="text-[9px] text-gray-400">MiroFish · ArmorClaw · OpenClaw</div>
                </div>
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-gray-300 hover:text-gray-500 transition-all mt-1">
                    <Settings className="w-[18px] h-[18px]" /> Settings
                </button>
            </aside>

            {/* ═══ MAIN ═══ */}
            <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

                {/* ── TOPBAR ── */}
                <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 bg-white/80 backdrop-blur-xl border-b border-black/[0.04] shadow-sm">
                    <h1 className="text-lg font-bold text-gray-800">Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <Search className="w-3.5 h-3.5 text-gray-300" />
                            <span className="text-xs text-gray-400">Search...</span>
                        </div>
                        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase",
                            pipelineStatus==="EXECUTED"?"bg-emerald-50 text-emerald-600 border border-emerald-200":
                            pipelineStatus==="BLOCKED"||pipelineStatus==="ALL_ATTACKS_BLOCKED"?"bg-red-50 text-red-600 border border-red-200":
                            "bg-gray-50 text-gray-400 border border-gray-100"
                        )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full",isRunning?"bg-indigo-500 animate-pulse":pipelineStatus==="EXECUTED"?"bg-emerald-500":pipelineStatus?"bg-red-500":"bg-gray-300")} />
                            {isRunning?"LIVE":pipelineStatus||"READY"}
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-6 space-y-5">

                    {/* ── ROW 1: STAT CARDS ── */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-gray-400 font-medium">Portfolio Value</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Wallet className="w-4 h-4 text-emerald-500" /></div>
                            </div>
                            <div className="text-2xl font-bold text-gray-800">${portfolio?.equity?Number(portfolio.equity).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}):'—'}</div>
                            <div className="flex items-center gap-1 mt-1.5">
                                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                <span className="text-xs text-emerald-500 font-semibold">{portfolio?.equity?'+'+((Number(portfolio.equity)-100000)/1000).toFixed(1)+'%':''}</span>
                            </div>
                        </div>
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-gray-400 font-medium">MiroFish Agents</span>
                                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center"><Brain className="w-4 h-4 text-cyan-500" /></div>
                            </div>
                            <div className="text-2xl font-bold text-gray-800">15</div>
                            <div className="text-xs text-gray-400 mt-1.5">5 types · 5 rounds</div>
                        </div>
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-gray-400 font-medium">ArmorClaw</span>
                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Shield className="w-4 h-4 text-amber-500" /></div>
                            </div>
                            <div className="flex items-baseline gap-4">
                                <div><span className="text-2xl font-bold text-emerald-500">{allowed}</span><span className="text-xs text-gray-400 ml-1">passed</span></div>
                                <div><span className="text-2xl font-bold text-red-500">{blocked}</span><span className="text-xs text-gray-400 ml-1">blocked</span></div>
                            </div>
                        </div>
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-gray-400 font-medium">Trades Today</span>
                                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><Activity className="w-4 h-4 text-violet-500" /></div>
                            </div>
                            <div className="text-2xl font-bold text-gray-800">{orders.length}</div>
                            <div className="text-xs text-gray-400 mt-1.5">via Alpaca Paper</div>
                        </div>
                    </div>

                    {/* ── ROW 2: PIPELINE + STOCKS ── */}
                    <div className="grid grid-cols-5 gap-4">
                        {/* Pipeline — 3 cols */}
                        <div className="col-span-3 card p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-700">MiroFish Pipeline</h3>
                                {statusLabel&&<span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full",
                                    pipelineStatus==="EXECUTED"?"bg-emerald-50 text-emerald-600":pipelineStatus==="BLOCKED"||pipelineStatus==="ALL_ATTACKS_BLOCKED"?"bg-red-50 text-red-600":"bg-gray-50 text-gray-500"
                                )}>{statusLabel}</span>}
                            </div>
                            {/* Pipeline nodes */}
                            <div className="flex items-center gap-2">
                                {[{id:"SWARM_ANALYST",l:"MiroFish",icon:Brain,bg:"bg-cyan-50",tc:"text-cyan-600"},{id:"RISK_AGENT",l:"Risk",icon:Eye,bg:"bg-violet-50",tc:"text-violet-600"},{id:"ARMORCLAW",l:"ArmorClaw",icon:Shield,bg:"bg-amber-50",tc:"text-amber-600"},{id:"TRADER",l:"Trader",icon:Zap,bg:"bg-emerald-50",tc:"text-emerald-600"}].map((n,i,a)=>{
                                    const st=nodeStatuses[n.id]||"idle";const I=n.icon
                                    return(<React.Fragment key={n.id}>
                                        <div className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl flex-1 transition-all border",
                                            st==="idle"&&"bg-gray-50 border-gray-100",
                                            st==="processing"&&"bg-amber-50 border-amber-200 shadow-sm",
                                            st==="allowed"&&"bg-emerald-50 border-emerald-200 shadow-sm",
                                            st==="blocked"&&"bg-red-50 border-red-200 shadow-sm",
                                        )}>
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",st==="idle"?n.bg:st==="processing"?"bg-amber-100":st==="allowed"?"bg-emerald-100":"bg-red-100")}>
                                                <I className={cn("w-4 h-4",st==="idle"?n.tc:st==="processing"?"text-amber-600":st==="allowed"?"text-emerald-600":"text-red-600")} />
                                            </div>
                                            <div>
                                                <div className={cn("text-[11px] font-semibold",st==="idle"?"text-gray-500":st==="processing"?"text-amber-700":st==="allowed"?"text-emerald-700":"text-red-700")}>{n.l}</div>
                                                {st!=="idle"&&<div className={cn("text-[9px] font-medium",st==="allowed"?"text-emerald-500":st==="blocked"?"text-red-500":"text-amber-500")}>{st==="allowed"?"✓ Pass":st==="blocked"?"✗ Block":"Processing..."}</div>}
                                            </div>
                                        </div>
                                        {i<a.length-1&&<ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0"/>}
                                    </React.Fragment>)
                                })}
                            </div>
                            {/* Seed */}
                            <textarea placeholder="Paste financial news or earnings data..." value={seed} onChange={e=>setSeed(e.target.value)}
                                className="w-full h-16 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-600 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none resize-none placeholder:text-gray-300" />
                            <div className="flex flex-wrap gap-1.5">
                                {SEEDS.map(s=>(
                                    <button key={s.label} onClick={()=>{setSeed(s.text);setSelectedTicker(s.ticker)}}
                                        className={cn("px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border",
                                            s.blocked?"border-red-100 text-red-400 bg-red-50/50 hover:text-red-600":"border-gray-100 text-gray-400 bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"
                                        )}>{s.label}</button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={()=>runPipeline(false)} disabled={isRunning}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-indigo-200">
                                    {isRunning?<Loader2 className="w-4 h-4 animate-spin"/>:<Play className="w-4 h-4"/>} {isRunning?"Running...":"Run Simulation"}
                                </button>
                                <button onClick={()=>runPipeline(true)} disabled={isRunning}
                                    className="px-4 py-3 bg-red-50 border border-red-200 text-red-500 font-semibold text-[10px] uppercase rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">
                                    <Skull className="w-4 h-4"/>
                                </button>
                                {!isIdle&&!isRunning&&<button onClick={resetPipeline} className="px-4 py-3 bg-gray-50 border border-gray-100 text-gray-400 rounded-xl hover:text-gray-600 transition-all"><RefreshCw className="w-4 h-4"/></button>}
                            </div>
                        </div>

                        {/* Stocks — 2 cols */}
                        <div className="col-span-2 card p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-700">Live Stocks</h3>
                                <span className="text-[9px] text-gray-300 font-medium">Alpaca Paper</span>
                            </div>
                            <div className="space-y-1">
                                {stocks.slice(0,6).map(s=>(
                                    <button key={s.ticker} onClick={()=>setSelectedTicker(s.ticker)}
                                        className={cn("w-full flex items-center justify-between p-3 rounded-xl transition-all",
                                            selectedTicker===s.ticker?"bg-indigo-50 border border-indigo-100 shadow-sm":"hover:bg-gray-50 border border-transparent"
                                        )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
                                                selectedTicker===s.ticker?"bg-indigo-100 text-indigo-600":"bg-gray-100 text-gray-400"
                                            )}>{s.ticker?.slice(0,2)}</div>
                                            <div className="text-left">
                                                <div className="text-xs font-semibold text-gray-700">{s.ticker}</div>
                                                <div className="text-[10px] text-gray-300">{s.source==='alpaca_live'?'Live':'Simulated'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-mono font-bold text-gray-700">${s.price?.toFixed(2)}</div>
                                            <div className="text-[10px] text-gray-300">Vol {(s.volume/1e6)?.toFixed(1)}M</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── ROW 3: AGENTS + OPENCLAW ── */}
                    <div className="grid grid-cols-5 gap-4">
                        {/* MiroFish — 2 cols */}
                        <div className="col-span-2 card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Brain className="w-4 h-4 text-cyan-500"/> MiroFish Agents</h3>
                                <span className="text-[9px] text-gray-300">Emergent Consensus</span>
                            </div>
                            {Object.keys(sectorResults).length>0?(
                                <div className="space-y-2">
                                    {Object.entries(sectorResults).map(([k,v]:any)=>{
                                        const ag=AGENTS[k]||{icon:Activity,label:k,color:"text-gray-400"};const AI=ag.icon
                                        return(
                                            <div key={k} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                                                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm"><AI className={cn("w-3.5 h-3.5",ag.color)}/></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-semibold text-gray-600">{ag.label}</span>
                                                        <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md",
                                                            v.verdict==="bullish"?"text-emerald-600 bg-emerald-50":v.verdict==="bearish"?"text-red-600 bg-red-50":"text-gray-400 bg-gray-100"
                                                        )}>{v.verdict}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <motion.div initial={{width:0}} animate={{width:`${v.confidence*100}%`}} transition={{duration:.6}}
                                                                className={cn("h-full rounded-full",v.verdict==="bullish"?"bg-emerald-500":v.verdict==="bearish"?"bg-red-500":"bg-gray-400")}/>
                                                        </div>
                                                        <span className="text-[9px] font-mono font-bold text-gray-400 w-7 text-right">{(v.confidence*100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {recommendation&&(
                                        <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-emerald-500 font-semibold">Consensus</span>
                                                <span className="text-sm font-bold text-emerald-700">{recommendation.action} {recommendation.ticker} × {recommendation.quantity}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ):(
                                <div className="flex flex-col items-center justify-center h-40 text-gray-200">
                                    <Brain className="w-10 h-10 mb-2"/>
                                    <span className="text-xs text-gray-300">Run simulation to see agents</span>
                                </div>
                            )}
                        </div>

                        {/* OpenClaw — 3 cols */}
                        <div className="col-span-3 card p-5 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Bot className="w-4 h-4 text-violet-500"/> OpenClaw Agent</h3>
                                <span className="text-[9px] text-gray-300">Natural Language → Enforced Execution</span>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <input value={agentInput} onChange={e=>setAgentInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&runAgent()}
                                    placeholder="e.g. Research NVDA and buy 5 shares..."
                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-600 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none placeholder:text-gray-300"/>
                                <button onClick={runAgent} disabled={agentLoading}
                                    className="px-4 rounded-xl bg-violet-50 text-violet-500 border border-violet-100 hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-all disabled:opacity-50">
                                    {agentLoading?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                                </button>
                            </div>
                            {agentResult?(
                                <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="flex-1 space-y-2 overflow-y-auto">
                                    <div className="flex items-center gap-3 text-[11px]">
                                        <span className={cn("font-bold px-2 py-0.5 rounded-md",agentResult.status==="completed"?"text-emerald-600 bg-emerald-50":"text-red-600 bg-red-50")}>{agentResult.status}</span>
                                        {agentResult.enforcement_summary&&<span className="text-gray-400">✓ {agentResult.enforcement_summary.allowed} · ✗ {agentResult.enforcement_summary.blocked}</span>}
                                    </div>
                                    {agentResult.steps?.map((s:any,i:number)=>(
                                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 text-[11px]">
                                            {s.status==="executed"?<CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/>:<XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0"/>}
                                            <div><span className="font-bold text-gray-700">{s.tool}</span><span className="text-gray-400"> — {s.reasoning}</span></div>
                                        </div>
                                    ))}
                                </motion.div>
                            ):(
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-200">
                                    <Bot className="w-10 h-10 mb-2"/>
                                    <span className="text-xs text-gray-300">Type a command for the autonomous agent</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── ROW 4: AUDIT + ORDERS ── */}
                    <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-3 card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Terminal className="w-4 h-4 text-amber-500"/> Enforcement Log</h3>
                                <span className="text-[9px] text-gray-300 font-medium">{auditLog.length} entries</span>
                            </div>
                            <div ref={auditRef} className="max-h-[200px] overflow-y-auto space-y-1 scrollbar-thin">
                                {auditLog.length>0?auditLog.map(e=>(
                                    <div key={e.id} className={cn("flex items-start gap-2 py-2 px-3 rounded-lg text-[10px]",
                                        e.decision==="ALLOWED"?"bg-emerald-50/60":"bg-red-50/60"
                                    )}>
                                        {e.decision==="ALLOWED"?<CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0"/>:<XCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0"/>}
                                        <div className="flex-1 min-w-0">
                                            <span className={cn("font-bold uppercase",e.decision==="ALLOWED"?"text-emerald-600":"text-red-600")}>{e.decision}</span>
                                            <span className="text-gray-300 mx-1">·</span>
                                            <span className="text-gray-500 font-medium">{e.agent}</span>
                                            <span className="text-gray-300 mx-1">·</span>
                                            <span className="text-gray-400">{e.tool}</span>
                                            <div className="text-gray-400 mt-0.5 break-words">{e.rule}</div>
                                        </div>
                                        <span className="text-gray-300 font-mono shrink-0">{e.time}</span>
                                    </div>
                                )):<div className="flex items-center justify-center h-20 text-gray-200 text-xs">No enforcement data yet</div>}
                            </div>
                        </div>

                        <div className="col-span-2 card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-700">Recent Orders</h3>
                                <button onClick={refreshOrders} className="text-gray-300 hover:text-gray-500 transition-all"><RefreshCw className="w-3.5 h-3.5"/></button>
                            </div>
                            {tradeResult&&(
                                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 mb-3">
                                    <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/><span className="text-xs font-bold text-emerald-700">Latest Trade</span></div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div><span className="text-gray-400">Symbol</span> <span className="font-bold text-gray-700 ml-1">{tradeResult.symbol}</span></div>
                                        <div><span className="text-gray-400">Qty</span> <span className="font-bold text-gray-700 ml-1">{tradeResult.qty}</span></div>
                                        <div><span className="text-gray-400">Price</span> <span className="font-bold text-emerald-600 ml-1">{tradeResult.filled_avg_price?`$${tradeResult.filled_avg_price}`:"Market"}</span></div>
                                        <div><span className="text-gray-400">Source</span> <span className="font-bold text-gray-500 ml-1">{tradeResult.source}</span></div>
                                    </div>
                                </motion.div>
                            )}
                            <div className="space-y-1 max-h-[140px] overflow-y-auto scrollbar-thin">
                                {orders.slice(0,5).map((o:any,i:number)=>(
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 text-[10px]">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold",o.side==="buy"?"bg-emerald-100 text-emerald-600":"bg-red-100 text-red-600")}>{o.side==="buy"?"B":"S"}</div>
                                            <span className="font-semibold text-gray-700">{o.symbol}</span>
                                        </div>
                                        <span className="text-gray-400">×{o.qty}</span>
                                        <span className={cn("font-medium",o.status==="filled"?"text-emerald-600":o.status==="new"?"text-amber-600":"text-gray-400")}>{o.status}</span>
                                    </div>
                                ))}
                                {orders.length===0&&<div className="text-center text-gray-300 text-xs py-4">No orders yet</div>}
                            </div>
                        </div>
                    </div>

                    {/* ── ROW 5: MIROFISH ENTITY GRAPH ── */}
                    <MiroFishGraph />

                    {/* ── ROW 6: AGENT PANELS ── */}
                    <div className="grid grid-cols-3 gap-4">
                        <PortfolioMonitorPanel />
                        <EarningsResearchPanel ticker={selectedTicker} />
                        <CompliancePanel />
                    </div>

                    {/* Attack blocks */}
                    {attackBlocks.length>0&&(
                        <div className="card p-5 border-red-100">
                            <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-3"><ShieldAlert className="w-4 h-4"/> Attack Blocked</h3>
                            {attackBlocks.map((b,i)=>(
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100 mb-2">
                                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">{b.block_number}</div>
                                    <div><div className="text-[10px] font-bold text-red-600 uppercase">{b.layer}</div><p className="text-[10px] text-gray-500 font-mono">{b.reason}</p></div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
