"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Lock, CheckCircle2, XCircle, Terminal, Activity, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnforcerOverlayProps {
    isOpen: boolean
    onClose: () => void
    report: any
    logs: { time: string, msg: string, type: 'sys' | 'ok' | 'err' }[]
}

export function EnforcerOverlay({ isOpen, onClose, report, logs }: EnforcerOverlayProps) {
    const [status, setStatus] = React.useState<'SCANNING' | 'VERIFYING' | 'EXECUTING' | 'COMPLETE' | 'BLOCKED'>('SCANNING')
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (isOpen) {
            setStatus('SCANNING')
            const timer = setTimeout(() => setStatus('VERIFYING'), 2000)
            const timer2 = setTimeout(() => {
                const isBlocked = report?.ticker === 'TSLA' // Example block logic
                setStatus(isBlocked ? 'BLOCKED' : 'COMPLETE')
            }, 5000)
            return () => { clearTimeout(timer); clearTimeout(timer2); }
        }
    }, [isOpen, report])

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    if (!isOpen) return null

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex flex-col font-mono"
        >
            {/* Header Status HUD */}
            <div className="h-24 border-b-2 border-white/10 bg-black/50 px-12 flex items-center justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                     style={{ backgroundImage: `repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 0, transparent 40px)` }} />
                
                <div className="flex items-center gap-8 relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Target_Instrument</span>
                        <span className="text-3xl font-black text-white">{report?.ticker || "N/A"}</span>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Proposed_Intent</span>
                        <span className={cn(
                            "text-3xl font-black",
                            report?.action === 'BUY' ? "text-green-500" : "text-flame"
                        )}>{report?.action || "N/A"}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                     <div className="text-right">
                        <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">ArmorClaw_Status</div>
                        <div className={cn(
                            "text-xs font-black uppercase px-4 py-1 border-2",
                            status === 'BLOCKED' ? "border-flame text-flame bg-flame/10" : 
                            status === 'COMPLETE' ? "border-green-500 text-green-500 bg-green-500/10" : 
                            "border-white/20 text-white/40 bg-white/5"
                        )}>
                            {status}
                        </div>
                     </div>
                     <Shield className={cn(
                        "w-10 h-10 transition-colors",
                        status === 'BLOCKED' ? "text-flame" : status === 'COMPLETE' ? "text-green-500" : "text-white/20"
                     )} />
                </div>
            </div>

            {/* Main Audit Log Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Verification Steps */}
                <div className="w-[400px] border-r-2 border-white/10 p-12 space-y-12 bg-black/20">
                     <div className="space-y-8">
                        <StepItem icon={<Activity />} label="Intent_Recognition" status={status === 'SCANNING' ? 'loading' : 'done'} />
                        <StepItem icon={<Shield />} label="Device_Policy_Check" status={status === 'SCANNING' ? 'pending' : status === 'VERIFYING' ? 'loading' : report?.ticker === 'TSLA' ? 'error' : 'done'} />
                        <StepItem icon={<Lock />} label="Delegation_Token_HMAC" status={status === 'SCANNING' || status === 'VERIFYING' ? 'pending' : (status === 'COMPLETE' || status === 'BLOCKED') ? (report?.ticker === 'TSLA' ? 'error' : 'done') : 'loading'} />
                     </div>

                     <div className="pt-12 border-t border-white/5">
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6">Security_Handshake_Node</div>
                        <div className="space-y-3 opacity-40 grayscale">
                             <div className="flex justify-between text-[10px] font-bold"><span>Key:</span> <span className="text-flame truncate w-40">**********8k29</span></div>
                             <div className="flex justify-between text-[10px] font-bold"><span>Cipher:</span> <span>AES-256-GCM</span></div>
                             <div className="flex justify-between text-[10px] font-bold"><span>Enforcer:</span> <span>ArmorClaw_v2</span></div>
                        </div>
                     </div>
                </div>

                {/* Right: Real-time Audit Stream */}
                <div className="flex-1 flex flex-col p-0">
                    <div className="h-12 border-b border-white/10 bg-white/[0.02] flex items-center px-12 justify-between">
                         <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                             <Terminal className="w-3 h-3 text-flame" /> Decoded_Action_Stream
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[9px] font-black text-green-500/50 uppercase tracking-widest">Live_Verification</span>
                         </div>
                    </div>
                    
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-4 scrollbar-thin">
                        <AnimatePresence initial={false}>
                            {logs.map((log, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-6 group">
                                    <span className="text-[10px] font-black text-white/10 select-none w-20">[{log.time}]</span>
                                    <div className={cn(
                                        "flex-1 text-xs uppercase tracking-tight font-medium",
                                        log.type === 'sys' ? "text-white/40" : 
                                        log.type === 'ok' ? "text-green-400" : "text-flame font-bold"
                                    )}>
                                        <span className="mr-3 text-white/10 group-hover:text-white/30">|</span>
                                        {log.msg}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {(status === 'SCANNING' || status === 'VERIFYING' || status === 'EXECUTING') && (
                             <div className="flex gap-6 items-center py-4 border-t border-white/5">
                                 <Loader2 className="w-4 h-4 text-flame animate-spin" />
                                 <span className="text-[10px] font-black text-flame animate-pulse uppercase tracking-[0.5em]">Analyzing_Next_Packet...</span>
                             </div>
                        )}
                    </div>

                    {/* Final Action Bar */}
                    <div className="h-32 border-t-2 border-white/10 bg-black flex items-center px-12 justify-end gap-6">
                        {(status === 'COMPLETE' || status === 'BLOCKED') && (
                            <motion.button 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={onClose}
                                className={cn(
                                    "px-12 py-5 font-black uppercase tracking-[0.5em] text-sm transition-all active:translate-y-1 shadow-2xl",
                                    status === 'BLOCKED' ? "bg-flame text-black hover:bg-white" : "bg-white text-black hover:bg-green-500 hover:text-white"
                                )}
                            >
                                {status === 'BLOCKED' ? "[ Acknowledge_Violation ]" : "[ Finalize_Transaction_Report ]"}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>

            {/* Success/Failure Visual Overlays */}
            <AnimatePresence>
                {status === 'BLOCKED' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none border-[40px] border-flame/10 z-[500]" />
                )}
                {status === 'COMPLETE' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none border-[40px] border-green-500/10 z-[500]" />
                )}
            </AnimatePresence>
        </motion.div>
    )
}

function StepItem({ icon, label, status }: { icon: React.ReactNode, label: string, status: 'pending' | 'loading' | 'done' | 'error' }) {
    return (
        <div className="flex items-center gap-4 transition-all duration-500">
            <div className={cn(
                "w-12 h-12 border-2 flex items-center justify-center transition-all duration-500 bg-black",
                status === 'done' ? "border-green-500 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]" : 
                status === 'loading' ? "border-flame text-flame animate-pulse" : 
                status === 'error' ? "border-flame text-flame shadow-[0_0_20px_rgba(234,88,12,0.4)]" :
                "border-white/10 text-white/10"
            )}>
                {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                 status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : 
                 status === 'error' ? <XCircle className="w-5 h-5" /> : 
                 icon}
            </div>
            <div className="flex flex-col">
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    status === 'pending' ? "text-white/20" : "text-white/60"
                )}>{label}</span>
                <span className={cn(
                    "text-[8px] font-bold uppercase",
                    status === 'done' ? "text-green-500" : 
                    status === 'loading' ? "text-flame" : 
                    status === 'error' ? "text-flame" :
                    "text-white/5"
                )}>{status}</span>
            </div>
        </div>
    )
}
