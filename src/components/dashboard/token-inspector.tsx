"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Lock, Clock, Shield, Hash, User, TrendingUp, Layers, AlertTriangle } from "lucide-react"

interface TokenInspectorProps {
    token: Record<string, any> | null
    className?: string
}

export function TokenInspector({ token, className }: TokenInspectorProps) {
    const [showFull, setShowFull] = React.useState(false)

    if (!token || token.status === "no_token_issued") {
        return (
            <div className={cn("border border-white/5 bg-white/[0.01] p-4", className)}>
                <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-3.5 h-3.5 text-white/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">DeviceToken_Inspector</span>
                </div>
                <div className="flex items-center justify-center py-6 text-white/10">
                    <div className="text-center">
                        <Lock className="w-6 h-6 mx-auto mb-2 opacity-30" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting_Token_Issuance</p>
                    </div>
                </div>
            </div>
        )
    }

    const isExpired = token.expires_at && (Date.now() / 1000) > token.expires_at
    const ttlRemaining = token.expires_at ? Math.max(0, token.expires_at - Date.now() / 1000) : 0
    const ttlMinutes = Math.floor(ttlRemaining / 60)
    const ttlSeconds = Math.floor(ttlRemaining % 60)

    const fields = [
        { key: "issued_to", icon: User, label: "DELEGATE", color: "text-blue-400" },
        { key: "ticker", icon: TrendingUp, label: "TICKER_LOCK", color: "text-flame" },
        { key: "side", icon: Layers, label: "SIDE", color: "text-purple-400" },
        { key: "max_quantity", icon: Hash, label: "MAX_QTY", color: "text-cyan-400" },
    ]

    return (
        <div className={cn("border border-white/5 bg-white/[0.01] overflow-hidden", className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <Lock className={cn("w-3.5 h-3.5", isExpired ? "text-red-400" : "text-emerald-400")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">DeviceToken</span>
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-black uppercase border",
                    isExpired ? "border-red-500/30 text-red-400 bg-red-500/10" : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", isExpired ? "bg-red-400" : "bg-emerald-400 animate-pulse")} />
                    {isExpired ? "EXPIRED" : "VALID"}
                </div>
            </div>

            <div className="p-3 space-y-2">
                {/* Token fields */}
                {fields.map((field, i) => (
                    <motion.div
                        key={field.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between gap-2 py-1 border-b border-white/[0.03] last:border-0"
                    >
                        <div className="flex items-center gap-2">
                            <field.icon className={cn("w-3 h-3", field.color)} />
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-wider">{field.label}</span>
                        </div>
                        <span className={cn("text-xs font-black uppercase", field.color)}>
                            {String(token[field.key] ?? "—")}
                        </span>
                    </motion.div>
                ))}

                {/* TTL Countdown */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.05]"
                >
                    <div className="flex items-center gap-2">
                        <Clock className={cn("w-3 h-3", isExpired ? "text-red-400" : "text-yellow-400")} />
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-wider">TTL</span>
                    </div>
                    <span className={cn(
                        "text-xs font-black font-mono",
                        isExpired ? "text-red-400 line-through" : "text-yellow-400"
                    )}>
                        {isExpired ? "00:00" : `${String(ttlMinutes).padStart(2, '0')}:${String(ttlSeconds).padStart(2, '0')}`}
                    </span>
                </motion.div>

                {/* HMAC Signature */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="pt-2"
                >
                    <div className="flex items-center gap-2 mb-1.5">
                        <Shield className="w-3 h-3 text-cyan-400" />
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-wider">HMAC-SHA256</span>
                    </div>
                    <button
                        onClick={() => setShowFull(!showFull)}
                        className="w-full text-left bg-black/50 border border-white/5 px-2.5 py-1.5 font-mono text-[9px] text-cyan-400/60 break-all hover:text-cyan-400 hover:border-cyan-500/20 transition-all cursor-pointer"
                    >
                        {showFull ? token.hmac : `${(token.hmac || "").substring(0, 20)}...`}
                    </button>
                </motion.div>

                {/* Token ID */}
                <div className="flex items-center justify-between text-[8px] text-white/15 pt-1">
                    <span>ID: {token.token_id?.substring(0, 8) ?? "—"}</span>
                    <span>{token.sub_delegation ? "⚠ SUB_DELEGATION" : "NO_SUB_DELEGATION"}</span>
                </div>
            </div>
        </div>
    )
}
