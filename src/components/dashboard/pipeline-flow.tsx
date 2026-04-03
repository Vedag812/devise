"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Brain, FileKey2, ShieldCheck, Terminal, Rocket, ArrowRight } from "lucide-react"

type NodePhase = "SWARM_ANALYST" | "RISK_AGENT" | "ARMORCLAW" | "DEVICE_POLICY" | "TRADER"
type NodeStatus = "idle" | "processing" | "allowed" | "blocked"

interface PipelineFlowProps {
    activePhase: NodePhase | null
    nodeStatuses: Record<string, NodeStatus>
    ticker?: string
    className?: string
}

const NODES = [
    { id: "SWARM_ANALYST", label: "SWARM", sub: "6-Persona Analysis", icon: Brain, color: "blue" },
    { id: "RISK_AGENT", label: "RISK", sub: "Portfolio Validation", icon: FileKey2, color: "purple" },
    { id: "ARMORCLAW", label: "ARMORCLAW", sub: "Intent Enforcement", icon: ShieldCheck, color: "flame" },
    { id: "TRADER", label: "TRADER", sub: "Paper Execution", icon: Rocket, color: "green" },
]

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    blue: { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]" },
    purple: { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]" },
    flame: { border: "border-flame", bg: "bg-flame/10", text: "text-flame", glow: "shadow-[0_0_30px_rgba(254,127,45,0.3)]" },
    green: { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]" },
}

export function PipelineFlow({ activePhase, nodeStatuses, ticker, className }: PipelineFlowProps) {
    return (
        <div className={cn("flex items-center justify-center gap-1 sm:gap-2 py-6 overflow-x-auto", className)}>
            {NODES.map((node, idx) => {
                const status = nodeStatuses[node.id] || "idle"
                const colors = COLOR_MAP[node.color]
                const isActive = activePhase === node.id
                const Icon = node.icon

                return (
                    <React.Fragment key={node.id}>
                        <motion.div
                            animate={
                                isActive
                                    ? { scale: [1, 1.03, 1], transition: { repeat: Infinity, duration: 1.5 } }
                                    : { scale: 1 }
                            }
                            className={cn(
                                "relative flex flex-col items-center gap-2 p-3 sm:p-4 border-2 min-w-[90px] sm:min-w-[120px] transition-all duration-500",
                                status === "idle" && "border-white/5 bg-white/[0.01]",
                                status === "processing" && cn(colors.border, colors.bg, colors.glow),
                                status === "allowed" && "border-emerald-500 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.2)]",
                                status === "blocked" && "border-red-500 bg-red-500/10 shadow-[0_0_25px_rgba(239,68,68,0.3)]",
                            )}
                        >
                            {/* Processing indicator */}
                            {status === "processing" && (
                                <motion.div
                                    className="absolute inset-0 border-2 border-white/20"
                                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 1.2 }}
                                />
                            )}

                            {/* Status dot */}
                            <div className={cn(
                                "absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border border-black",
                                status === "idle" && "bg-white/10",
                                status === "processing" && cn("animate-pulse", node.color === "flame" ? "bg-flame" : node.color === "green" ? "bg-emerald-500" : node.color === "purple" ? "bg-purple-500" : "bg-blue-500"),
                                status === "allowed" && "bg-emerald-500",
                                status === "blocked" && "bg-red-500",
                            )} />

                            <div className={cn(
                                "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border transition-all duration-500",
                                status === "idle" && "border-white/10 text-white/20",
                                status === "processing" && cn(colors.border, colors.text),
                                status === "allowed" && "border-emerald-500 text-emerald-400",
                                status === "blocked" && "border-red-500 text-red-400",
                            )}>
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>

                            <div className="text-center">
                                <div className={cn(
                                    "text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-500",
                                    status === "idle" && "text-white/20",
                                    status === "processing" && colors.text,
                                    status === "allowed" && "text-emerald-400",
                                    status === "blocked" && "text-red-400",
                                )}>
                                    {node.label}
                                </div>
                                <div className="text-[7px] sm:text-[8px] text-white/20 uppercase tracking-wider mt-0.5 hidden sm:block">
                                    {node.sub}
                                </div>
                            </div>

                            {/* Status text */}
                            <AnimatePresence>
                                {(status === "allowed" || status === "blocked") && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "absolute -bottom-3 text-[7px] sm:text-[8px] font-black uppercase px-2 py-0.5 border",
                                            status === "allowed" && "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
                                            status === "blocked" && "bg-red-500/20 border-red-500/40 text-red-400",
                                        )}
                                    >
                                        {status === "allowed" ? "✓ PASS" : "✗ BLOCKED"}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Connector */}
                        {idx < NODES.length - 1 && (
                            <div className="flex items-center relative h-8 min-w-[20px] sm:min-w-[40px]">
                                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2" />
                                {/* Animated data pulse */}
                                {(nodeStatuses[NODES[idx].id] === "allowed" || nodeStatuses[NODES[idx].id] === "processing") && (
                                    <motion.div
                                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500/60"
                                        initial={{ left: 0, opacity: 0 }}
                                        animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
                                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                    />
                                )}
                                <ArrowRight className={cn(
                                    "w-3 h-3 relative z-10 mx-auto transition-colors duration-500",
                                    nodeStatuses[NODES[idx].id] === "allowed" ? "text-emerald-500" :
                                    nodeStatuses[NODES[idx].id] === "blocked" ? "text-red-500" :
                                    "text-white/10"
                                )} />
                            </div>
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}
