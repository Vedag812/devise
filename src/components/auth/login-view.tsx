"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Shield, Zap, Activity } from "lucide-react"

interface LoginViewProps {
    onLogin: () => void
}

export function LoginView({ onLogin }: LoginViewProps) {
    const [isConnecting, setIsConnecting] = React.useState(false)

    const handleLogin = () => {
        setIsConnecting(true)
        setTimeout(() => {
            onLogin()
        }, 1500)
    }

    return (
        <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[200] overflow-hidden font-mono">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                 style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(234, 88, 12, 0.15) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md p-12 relative"
            >
                {/* Visual Header */}
                <div className="flex flex-col items-center mb-12 text-center">
                    <div className="w-20 h-20 border-2 border-flame/20 flex items-center justify-center mb-6 relative group">
                        <div className="absolute inset-0 bg-flame/5 blur-xl group-hover:bg-flame/10 transition-all" />
                        <Shield className="w-10 h-10 text-flame relative z-10" />
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-2 border-t-2 border-flame/40 rounded-full" 
                        />
                    </div>
                    
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase mb-2">Devise</h1>
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.4em] text-white/20 uppercase">
                        <Zap className="w-3 h-3 text-flame" /> Autonomous_Command_Node
                    </div>
                </div>

                {/* Connection Box */}
                <div className="bg-white/[0.02] border-2 border-white/5 p-8 backdrop-blur-xl relative">
                    <div className="absolute -top-3 left-6 bg-[#050505] px-4 py-1 border border-white/10 text-[9px] font-black uppercase text-white/40 tracking-widest">
                        Handshake_Protocol
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <div className="text-[10px] text-white/20 font-black uppercase tracking-widest px-1">Access_Level</div>
                            <div className="w-full bg-white/[0.03] border-2 border-white/5 px-4 py-3 text-xs text-white/40 font-black uppercase tracking-widest italic cursor-not-allowed">
                                [ Demo_Developer ]
                            </div>
                        </div>

                        <button 
                            onClick={handleLogin}
                            disabled={isConnecting}
                            className="w-full py-5 bg-flame text-black font-black uppercase tracking-[0.3em] text-sm hover:bg-white transition-all relative overflow-hidden group active:translate-y-1 shadow-[0_0_50px_rgba(234,88,12,0.15)]"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            {isConnecting ? "[ Connecting... ]" : "[ Authorize_Connection ]"}
                        </button>
                    </div>
                    
                    {/* Status Footer */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/10">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 animate-pulse text-green-500/30" />
                            Security_Status: Nominal
                        </div>
                        <div>Node: 01_Main</div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[9px] text-white/10 font-bold uppercase tracking-[0.5em]">Warning: Intent Enforcement Active</p>
                </div>
            </motion.div>
        </div>
    )
}
