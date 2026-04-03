"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { FileText, ShieldAlert, CheckCircle2, XCircle } from "lucide-react"

interface PolicyViewerProps {
    policy: Record<string, any> | null
    delegation: Record<string, any> | null
    violatedRules?: string[]
    className?: string
}

export function PolicyViewer({ policy, delegation, violatedRules = [], className }: PolicyViewerProps) {
    if (!policy) {
        return (
            <div className={cn("border border-white/5 bg-white/[0.01] p-4", className)}>
                <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-3.5 h-3.5 text-white/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">DevicePolicy</span>
                </div>
                <div className="flex items-center justify-center py-6 text-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Loading_Policy...</p>
                </div>
            </div>
        )
    }

    const isViolated = (key: string) => violatedRules.some(r => r.toLowerCase().includes(key.toLowerCase()))

    const renderValue = (value: any): string => {
        if (Array.isArray(value)) return `[${value.map(v => `"${v}"`).join(", ")}]`
        if (typeof value === "boolean") return value ? "true" : "false"
        return String(value)
    }

    return (
        <div className={cn("border border-white/5 bg-white/[0.01] overflow-hidden", className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">policy.yaml</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-black uppercase border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ACTIVE
                </div>
            </div>

            <div className="p-3 space-y-0.5 font-mono text-[10px] max-h-[250px] overflow-y-auto scrollbar-thin">
                {/* Policy section */}
                <div className="text-cyan-400/60 mb-1">policy:</div>
                {Object.entries(policy).map(([key, value], i) => {
                    if (typeof value === "object" && !Array.isArray(value)) {
                        return (
                            <div key={key} className="ml-3 mb-1">
                                <div className="text-white/30">{key}:</div>
                                {Object.entries(value as Record<string, any>).map(([subKey, subVal]) => (
                                    <motion.div
                                        key={subKey}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={cn(
                                            "ml-3 flex items-start gap-1.5 py-0.5 transition-all duration-500",
                                            isViolated(subKey) && "bg-red-500/10 -ml-1 pl-4 border-l-2 border-red-500"
                                        )}
                                    >
                                        {isViolated(subKey) ? (
                                            <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                                        ) : (
                                            <CheckCircle2 className="w-3 h-3 text-white/10 shrink-0 mt-0.5" />
                                        )}
                                        <span className="text-white/40">{subKey}:</span>
                                        <span className={cn(
                                            isViolated(subKey) ? "text-red-400 font-bold" : "text-emerald-400/70"
                                        )}>
                                            {renderValue(subVal)}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        )
                    }
                    return (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "ml-3 flex items-start gap-1.5 py-0.5 transition-all duration-500",
                                isViolated(key) && "bg-red-500/10 -ml-1 pl-4 border-l-2 border-red-500"
                            )}
                        >
                            {isViolated(key) ? (
                                <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                            ) : (
                                <CheckCircle2 className="w-3 h-3 text-white/10 shrink-0 mt-0.5" />
                            )}
                            <span className="text-white/40">{key}:</span>
                            <span className={cn(
                                "break-all",
                                isViolated(key) ? "text-red-400 font-bold" : "text-emerald-400/70"
                            )}>
                                {renderValue(value)}
                            </span>
                        </motion.div>
                    )
                })}

                {/* Delegation section */}
                {delegation && (
                    <>
                        <div className="text-cyan-400/60 mt-3 mb-1 pt-2 border-t border-white/5">delegation:</div>
                        {Object.entries(delegation).map(([key, value]) => (
                            <div key={key} className="ml-3">
                                <div className="text-white/30">{key}:</div>
                                {typeof value === "object" && Object.entries(value as Record<string, any>).map(([sk, sv]) => (
                                    <div key={sk} className="ml-3 flex items-center gap-1.5 py-0.5">
                                        <CheckCircle2 className="w-3 h-3 text-white/10 shrink-0" />
                                        <span className="text-white/40">{sk}:</span>
                                        <span className="text-purple-400/70">{renderValue(sv)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    )
}
