"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Brain, FileKey2, ShieldCheck, Rocket, ChevronRight } from "lucide-react"

type NodePhase = "SWARM_ANALYST" | "RISK_AGENT" | "ARMORCLAW" | "DEVICE_POLICY" | "TRADER"
type NodeStatus = "idle" | "processing" | "allowed" | "blocked"

interface PipelineFlowProps {
    activePhase: NodePhase | null
    nodeStatuses: Record<string, NodeStatus>
    ticker?: string
    className?: string
}

const NODES = [
    { id: "SWARM_ANALYST", label: "MIROFISH", sub: "Simulation Engine", icon: Brain, color: "blue" },
    { id: "RISK_AGENT", label: "RISK", sub: "Policy Validation", icon: FileKey2, color: "purple" },
    { id: "ARMORCLAW", label: "ARMORCLAW", sub: "Intent Enforcement", icon: ShieldCheck, color: "flame" },
    { id: "TRADER", label: "TRADER", sub: "Paper Execution", icon: Rocket, color: "green" },
]

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; glow: string; ring: string }> = {
    blue:   { border: "border-sky-500/60",     bg: "bg-sky-500/8",     text: "text-sky-400",     glow: "shadow-[0_0_25px_rgba(56,189,248,0.2)]",  ring: "ring-sky-500/30" },
    purple: { border: "border-purple-500/60",  bg: "bg-purple-500/8",  text: "text-purple-400",  glow: "shadow-[0_0_25px_rgba(168,85,247,0.2)]",  ring: "ring-purple-500/30" },
    flame:  { border: "border-flame/60",       bg: "bg-flame/8",       text: "text-flame",       glow: "shadow-[0_0_25px_rgba(254,127,45,0.2)]",  ring: "ring-flame/30" },
    green:  { border: "border-emerald-500/60", bg: "bg-emerald-500/8", text: "text-emerald-400", glow: "shadow-[0_0_25px_rgba(16,185,129,0.2)]",  ring: "ring-emerald-500/30" },
}

export function PipelineFlow({ activePhase, nodeStatuses, className }: PipelineFlowProps) {
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
                                    ? { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
                                    : { scale: 1 }
                            }
                            className={cn(
                                "relative flex flex-col items-center gap-2.5 p-3 sm:p-4 rounded-xl min-w-[90px] sm:min-w-[120px] transition-all duration-500",
                                status === "idle" && "border border-white/[0.04] bg-white/[0.01]",
                                status === "processing" && cn("border", colors.border, colors.bg, colors.glow),
                                status === "allowed" && "border border-emerald-500/40 bg-emerald-500/8 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
                                status === "blocked" && "border border-red-500/40 bg-red-500/8 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
                            )}
                        >
                            {/* Processing ring pulse */}
                            {status === "processing" && (
                                <motion.div
                                    className={cn("absolute inset-0 rounded-xl border", colors.border)}
                                    animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.02, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                />
                            )}

                            {/* Status dot */}
                            <div className={cn(
                                "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#020204] transition-all duration-300",
                                status === "idle" && "bg-white/10",
                                status === "processing" && cn("animate-pulse",
                                    node.color === "flame" ? "bg-flame" :
                                    node.color === "green" ? "bg-emerald-500" :
                                    node.color === "purple" ? "bg-purple-500" : "bg-sky-500"),
                                status === "allowed" && "bg-emerald-500",
                                status === "blocked" && "bg-red-500",
                            )} />

                            {/* Icon circle */}
                            <div className={cn(
                                "w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg transition-all duration-500",
                                status === "idle" && "bg-white/[0.03] text-white/15",
                                status === "processing" && cn(colors.bg, colors.text),
                                status === "allowed" && "bg-emerald-500/15 text-emerald-400",
                                status === "blocked" && "bg-red-500/15 text-red-400",
                            )}>
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>

                            {/* Label */}
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
                                <div className="text-[7px] sm:text-[8px] text-white/15 uppercase tracking-wider mt-0.5 hidden sm:block">
                                    {node.sub}
                                </div>
                            </div>

                            {/* Status badge */}
                            <AnimatePresence>
                                {(status === "allowed" || status === "blocked") && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5, y: 4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className={cn(
                                            "absolute -bottom-2.5 text-[7px] sm:text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                            status === "allowed" && "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10",
                                            status === "blocked" && "bg-red-500/20 border border-red-500/30 text-red-400 shadow-sm shadow-red-500/10",
                                        )}
                                    >
                                        {status === "allowed" ? "✓ PASS" : "✗ BLOCKED"}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Connector */}
                        {idx < NODES.length - 1 && (
                            <div className="flex items-center relative h-8 min-w-[20px] sm:min-w-[36px]">
                                {/* Line */}
                                <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2">
                                    <div className={cn(
                                        "h-full w-full transition-all duration-500",
                                        nodeStatuses[NODES[idx].id] === "allowed" ? "bg-gradient-to-r from-emerald-500/50 to-emerald-500/20" :
                                        nodeStatuses[NODES[idx].id] === "blocked" ? "bg-gradient-to-r from-red-500/50 to-red-500/10" :
                                        "bg-white/[0.06]"
                                    )} />
                                </div>
                                {/* Animated pulse */}
                                {(nodeStatuses[NODES[idx].id] === "allowed" || nodeStatuses[NODES[idx].id] === "processing") && (
                                    <motion.div
                                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400/70 blur-[1px]"
                                        initial={{ left: 0, opacity: 0 }}
                                        animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
                                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                    />
                                )}
                                <ChevronRight className={cn(
                                    "w-3 h-3 relative z-10 mx-auto transition-colors duration-500",
                                    nodeStatuses[NODES[idx].id] === "allowed" ? "text-emerald-500/60" :
                                    nodeStatuses[NODES[idx].id] === "blocked" ? "text-red-500/60" :
                                    "text-white/[0.08]"
                                )} />
                            </div>
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}
